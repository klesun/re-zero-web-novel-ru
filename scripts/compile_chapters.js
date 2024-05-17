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

const TRACK_TO_COVER_IMAGE_URL = {
    1: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c1.png",
    2: "https://witchculttranslation.com/wp-content/uploads/2018/11/DwjytwhU8AURSaS.jpg_orig.jpg",
    3: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c3-e1543440881481.jpg",
    4: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c4-1024x576.jpg",
    5: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c5-1024x576.jpg",
    6: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c6-1024x576.jpg",
    7: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c7-e1543442772517-1024x523.jpg",
    8: "https://witchculttranslation.com/wp-content/uploads/2018/11/1507153871738-e1551199746435-1024x563.jpg",
    9: "https://witchculttranslation.com/wp-content/uploads/2018/11/59311928_p9_master1200-e1551199792699.jpg",
    10: "https://witchculttranslation.com/wp-content/uploads/2018/11/62479682_p21_master1200-e1550081966925-1024x684.jpg",
    11: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c11-1024x585.png",
    12: "",
    13: "https://witchculttranslation.com/wp-content/uploads/2018/11/DEATH_OR_KISS_CG_50-1024x576.jpg",
    14: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c14-1024x576.png",
    15: "",
    16: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c16-1024x615.png",
    17: "https://witchculttranslation.com/wp-content/uploads/2018/11/julius_euclius_anime-1024x576.png",
    18: "https://witchculttranslation.com/wp-content/uploads/2018/11/58905257_p0_master1200-e1551140619403.jpg",
    19: "https://witchculttranslation.com/wp-content/uploads/2018/11/dqgxndgv4ae4g0y-1024x692.jpg",
    20: "https://witchculttranslation.com/wp-content/uploads/2018/11/yi9QUdh-e1548952893232-1024x700.jpg",
    21: "https://witchculttranslation.com/wp-content/uploads/2018/11/d1df9947e19d1cb3d7738852c8945f87-1024x576.png",
    22: "https://witchculttranslation.com/wp-content/uploads/2018/11/DhTYkK0U0AASQzT-e1549579290543-1024x530.jpg",
    23: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c23-1024x576.png",
    24: "https://witchculttranslation.com/wp-content/uploads/2018/11/xyaknylcu2b01-e1543493929207-1024x542.jpg",
    25: "https://witchculttranslation.com/wp-content/uploads/2018/11/Vj1HELF-e1548952490625.jpg",
    26: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c26-1024x539.jpg",
    27: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c27-1024x576.png",
    28: "https://witchculttranslation.com/wp-content/uploads/2018/11/876065e378cf16d792a2742f3f9d081c0c6adea9_hq.jpg",
    29: "https://witchculttranslation.com/wp-content/uploads/2018/11/DL8-LqbV4AAcv-R-e1548950907946.jpg",
    30: "https://witchculttranslation.com/wp-content/uploads/2018/11/79f-e1543516128819.jpg",
    31: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c31-1024x500.png",
    32: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c32.png",
    33: "https://witchculttranslation.com/wp-content/uploads/2018/11/C33.png",
    34: "https://witchculttranslation.com/wp-content/uploads/2018/11/bsnxfp5a0yy11-e1543511565557-1024x469.jpg",
    35: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c35-1024x568.jpg",
    36: "https://witchculttranslation.com/wp-content/uploads/2018/11/plshz7qrvqi11-e1543514490768-1024x631.jpg",
    37: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c37.png",
    38: "https://witchculttranslation.com/wp-content/uploads/2018/11/c38.jpg",
    39: "https://witchculttranslation.com/wp-content/uploads/2018/11/a5c39-1024x570.png",
    40: "https://witchculttranslation.com/wp-content/uploads/2018/11/aldebaran_anime-1024x576.jpg",
    41: "",
    42: "",
    43: "https://witchculttranslation.com/wp-content/uploads/2018/10/reinhard_van_astrea_anime-1024x576.png",
    44: "",
    45: "https://witchculttranslation.com/wp-content/uploads/2018/09/619df63b0f4ba3d2ed74a239b0fabf2f.png",
    46: "",
    47: "https://witchculttranslation.com/wp-content/uploads/2018/09/julius-e1543358153757.jpg",
    48: "",
    49: "https://witchculttranslation.com/wp-content/uploads/2018/09/9plzvph-j6gnxirmbnpvpn9tbj8f53kgrq5cxwcvsq0-e1543357296750.jpg",
    50: "https://witchculttranslation.com/wp-content/uploads/2018/10/image0-1024x641.jpg",
    51: "https://witchculttranslation.com/wp-content/uploads/2018/12/63045148_p1-e1545070064895.jpg",
    52: "https://witchculttranslation.com/wp-content/uploads/2019/01/A5C52-1024x714.png",
    53: "https://witchculttranslation.com/wp-content/uploads/2019/01/1540117245275-e1548949536100-1024x688.png",
    54: "https://witchculttranslation.com/wp-content/uploads/2019/02/Dv0l_3bUUAEsTWj.jpg_orig-e1549538676266.jpg",
    55: "https://witchculttranslation.com/wp-content/uploads/2019/02/A5C55-1024x605.png",
    56: "https://witchculttranslation.com/wp-content/uploads/2019/02/A5C56-1-1024x602.png",
    57: "https://witchculttranslation.com/wp-content/uploads/2019/02/184n-e1551357326411-1024x756.png",
    58: "https://witchculttranslation.com/wp-content/uploads/2019/03/maxresdefault-1024x568.jpg",
    59: "https://witchculttranslation.com/wp-content/uploads/2019/03/image0-3-e1552995685157.jpg",
    60: "https://witchculttranslation.com/wp-content/uploads/2019/03/70754924_p6-e1553847793519-1024x711.jpg",
    61: "https://witchculttranslation.com/wp-content/uploads/2019/04/71340004_p0-768x913.jpg",
    62: "https://witchculttranslation.com/wp-content/uploads/2019/04/67779498_p21_master1200.jpg",
    63: "https://witchculttranslation.com/wp-content/uploads/2019/04/A5C64-1024x743.jpg",
    64: "https://witchculttranslation.com/wp-content/uploads/2019/04/A5C63-1024x601.png",
    65: "https://witchculttranslation.com/wp-content/uploads/2019/05/D13YXv5UcAM0_Al-e1557494770159-1024x774.jpg",
    66: "https://pbs.twimg.com/media/FWGXS7mUcAI8HeC?format=jpg&name=900x900",
    67: "https://witchculttranslation.com/wp-content/uploads/2019/07/63209919_p0-e1562155491373-1024x770.jpg",
    68: "https://witchculttranslation.com/wp-content/uploads/2019/06/68-1024x939.png",
    69: "https://witchculttranslation.com/wp-content/uploads/2019/07/69.jpg",
    70: "https://witchculttranslation.com/wp-content/uploads/2019/07/70-1.jpg",
    71: "https://web.archive.org/web/20220123124204im_/https://witchculttranslation.com/wp-content/uploads/2019/07/71.png",
    72: "https://witchculttranslation.com/wp-content/uploads/2019/07/72.png",
    73: "https://witchculttranslation.com/wp-content/uploads/2019/07/D872169D-F331-470C-837C-9388F0993960.jpeg",
    74: "https://witchculttranslation.com/wp-content/uploads/2019/08/Chapter-74-1024x534.png",
    75: "https://witchculttranslation.com/wp-content/uploads/2019/08/evdfinu5vrcy.png",
    76: "https://witchculttranslation.com/wp-content/uploads/2019/08/Sirius-768x432.png",
    77: "https://witchculttranslation.com/wp-content/uploads/2019/07/image0-973x1024.png",
    78: "https://witchculttranslation.com/wp-content/uploads/2019/08/Chapter-78-1024x576.png",
    79: "https://witchculttranslation.com/wp-content/uploads/2019/08/Reinfelt.jpg",
    80: "https://witchculttranslation.com/wp-content/uploads/2019/08/JoshJuli-1024x768.jpg",
    81: "https://witchculttranslation.com/wp-content/uploads/2019/08/Anastasia.Hoshin.full_.2533540-e1566659016441-1024x736.jpg",
    82: "",
    83: "",
    84: "",
};

async function getImageCover(trackNumber) {
    const url = TRACK_TO_COVER_IMAGE_URL[trackNumber];
    if (url) {
        return fetch("https://witchculttranslation.com/wp-content/uploads/2018/11/a5c1.png").then(makeImageTag);
    } else {
        return whenAlbumCover;
    }
}

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
        image: await getImageCover(trackNumber),
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
