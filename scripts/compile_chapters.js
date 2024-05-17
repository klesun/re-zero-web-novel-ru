import fs from "fs/promises";
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from "util";
import NodeID3, { TagConstants } from 'node-id3';

const writeTags = promisify(NodeID3.write);

/** @param {EventEmitter} eventEmitter */
function once(eventEmitter) {
    return new Promise((resolve, reject) => {
        eventEmitter
            .on("error", reject)
            .on("end", resolve);
    });
}

const exit = process.exit;
process.exit = (status) => { throw new Error("Fucking lib tried to process.exit " + status); };

/** @param {Response} rs */
async function makeImageTag(rs) {
    const buff = await rs.arrayBuffer();
    const mime = rs.headers.get("Content-Type");
    return {
        mime,
        imageBuffer: Buffer.from(buff),
        type: {
           id: TagConstants.AttachedPicture.PictureType.FRONT_COVER,
        },
        description: "Chapter Illustration",
    };
}

const whenAlbumCover = fetch("https://witchculttranslation.com/wp-content/uploads/2019/01/DtAgHD1VAAA9XEP.jpg_large.jpg")
    .then(makeImageTag);

const speakers = JSON.parse(await fs.readFile("./speakers.json", "utf8"));
const nameToSpeaker = Object.fromEntries(speakers.map(s => [s.name, s]));

/** @return {Tags} */
async function getTags(chapter, trackNumber) {
    return {
        album: "Re:Zero Арка 5 Звёзды что Вершат Историю",
        artist: "Rusuba",
        artistUrl: "https://github.com/klesun/re-zero-web-novel-ru",
        audioSourceUrl: "https://github.com/klesun/re-zero-web-novel-ru",
        comment: "Generated using fan translations and Microsoft Text-to-Speech services",
        composer: "klesun",
        textWriter: chapter.translator,
        chapter: chapter.chapter,
        trackNumber: trackNumber,
        title: trackNumber + ". " + chapter.title,
        copyright: "2024 klesun CC BY 4.0 DEED Attribution 4.0 International",
        copyrightUrl: "https://creativecommons.org/licenses/by/4.0/",
        genre: "(183)Audiobook",
        language: "rus",
        originalTitle: trackNumber === 1 ? "始まりはいつも来訪者から" : undefined,
        originalTextwriter: "長月達平",
        originalReleaseTime: trackNumber === 1 ? "2014-09-17" : undefined,
        image: trackNumber === 1
            ? await fetch("https://witchculttranslation.com/wp-content/uploads/2018/11/a5c1.png").then(makeImageTag)
            : await whenAlbumCover,
        synchronisedLyrics: [{
            language: "rus",
            timeStampFormat: TagConstants.TimeStampFormat.MILLISECONDS,
            contentType: TagConstants.SynchronisedLyrics.ContentType.LYRICS,
            shortText: chapter.paragraphs.length + " speeches follow. SYLT frames are supported by PowerAmp and MusicBee players on the moment of writing. If you see this, then your player is trying to incorrectly interpret SYLT id3v2 tag as .lrc and it should be ashamed for adding to the confusion of the SYLT format.",
            synchronisedText: chapter.paragraphs.map(speech => ({
                text: speech.speaker === "Narrator" ? speech.text : "\"" + speech.text + "\" - " + speech.speaker,
                timeStamp: Math.floor(speech.startTime * 1000),
            })),
        }],
    };
}

function hashCode(str) {
  var hash = 0,
    i, chr;
  if (str.length === 0) return hash;
  for (i = 0; i < str.length; i++) {
    chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

async function compileChapter(chapter, trackNumber) {
    let lastEndTime = 0;
    for (const p of chapter.paragraphs) {
        let speakerData = nameToSpeaker[p.speaker];
        if (speakerData?.sameAs) {
            speakerData = nameToSpeaker[speakerData.sameAs];
        }
        let pitchFactor = speakerData?.pitchFactor ?? 1;
        if (speakerData && !speakerData.pitchFactor && speakerData.name !== "Narrator") {
            const hashCodeValue = Math.abs(hashCode(speakerData.name));
            const extra = Math.abs(hashCodeValue) / (2 ** 31);
            pitchFactor = 0.85 + extra * 0.3;
        }
        if (pitchFactor !== 1) {
            const pitchBentPath = "speeches_pitch_bent/" + p.id + ".oga";

            const newFrequency = pitchFactor * 48000;
            const bending = ffmpeg(p.speechPath)
                .on('start', (ffmpegCommand) => console.log(ffmpegCommand))
                .audioFilter({
                    filter: "asetrate",
                    options: Math.floor(newFrequency),
                })
                .outputOptions(["-c libopus"])
                .output(pitchBentPath);
            bending.run();
            await once(bending);

            p.speechPath = pitchBentPath;
        }
        p.startTime = lastEndTime;
        lastEndTime += p.duration / pitchFactor;
    }
    const listFileContent = chapter.paragraphs
        .map(s => `file '../${s.speechPath}'`)
        .join("\n");
    await fs.writeFile("./unv/list.txt", listFileContent);

    const concatFileName = "unv/tmp_concat/compiled_chap_" + chapter.chapter + ".oga";
    const outputFileName = "unv/output/compiled_chap_" + chapter.chapter + ".mp3";

    let concatenation = ffmpeg("./unv/list.txt")
        .inputFormat("concat")
        .inputOptions(['-safe 0'])
        .outputOptions(["-c copy"])
        .on('start', (ffmpegCommand) => console.log(ffmpegCommand))
        .output(concatFileName);

    concatenation.run();
    await once(concatenation);

    const mp3Conversion = ffmpeg(concatFileName)
        .output(outputFileName);
    mp3Conversion.run();
    await once(mp3Conversion);

    const tags = await getTags(chapter, trackNumber);
    await writeTags(tags, outputFileName);
}

async function main() {
    const chapters = JSON.parse(await fs.readFile("./chapters.json", "utf8"));
    let trackNumber = 0;
    for (const chapter of chapters) {
        await compileChapter(chapter, ++trackNumber);
    }
}

main().then(
    () => exit(0),
    error => {
        console.error(error);
        exit(1);
    }
);
