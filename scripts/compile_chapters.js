import fs from "fs/promises";
import util from "util";
import { exec } from "child_process";
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from "util";
import NodeID3, { TagConstants } from 'node-id3';

const ffprobe = promisify(ffmpeg.ffprobe);
const writeTags = promisify(NodeID3.write);

function once(eventEmitter) {
    return new Promise((resolve, reject) => {
        eventEmitter
            .on("error", reject)
            .on("end", resolve);
    });
}

const execAsync = command => new Promise((resolve, reject) => exec(command, (error, stdout, stderr) => {
    if (error) {
        reject(error);
    } else {
        resolve([stdout, stderr]);
    }
}));

const exit = process.exit;
process.exit = (status) => { throw new Error("Fucking lib tried to process.exit " + status); };


async function main() {
    const chapters = JSON.parse(await fs.readFile("./chapters.json", "utf8"));

    let lastEndTime = 0;

    const speeches = [];
    for (const p of chapters[0].paragraphs) {
        if (p.text.trim() === "") {
            continue;
        }
        const speechPath = p.text.match(/^(\s*※\s*)+$/) || p.text.match(/^(\s*\*\s*)+$/)
            ? "special_speeches/few_moments_later.oga"
            : `speeches/${p.id}.oga`;
        speeches.push({
            speechPath: speechPath,
            startTime: lastEndTime,
            text: p.text,
        });
        const metadata = await ffprobe(speechPath);
        lastEndTime += metadata.format.duration;
        console.log("ololo " + p.id + " " + lastEndTime);
    }
    const listFileContent = speeches
        .map(s => `file '../${s.speechPath}'`)
        .join("\n");
    await fs.writeFile("./tmp/list.txt", listFileContent);

    let concatenation = ffmpeg("tmp/list.txt")
        .inputFormat("concat")
        .inputOptions(['-safe 0'])
        .outputOptions(["-c copy"])
        .on('start', (ffmpegCommand) => console.log(ffmpegCommand))
        .output("compiled_chap1.oga");
    concatenation.run();
    await once(concatenation);
    console.log("zhopa ffmpeg concat end");

    const mp3Conversion = ffmpeg('compiled_chap1.oga')
        .output('compiled_chap1_clean.mp3');
    mp3Conversion.run();
    await once(mp3Conversion);

    await writeTags({
        album: "Re:Zero Арка 5 Звёзды что Вершат Историю",
        artist: "ru-RU-DmitryNeural",
        artistUrl: "https://github.com/klesun/re-zero-web-novel-ru",
        audioSourceUrl: "https://github.com/klesun/re-zero-web-novel-ru",
        comment: "Generated using fan translations and Microsoft Text-to-Speech services",
        composer: "klesun",
        textWriter: "Эльрат",
        chapter: 1,
        trackNumber: 1,
        title: chapters[0].title,
        copyright: "2024 klesun CC BY 4.0 DEED Attribution 4.0 International",
        copyrightUrl: "https://creativecommons.org/licenses/by/4.0/",
        genre: "(183)Audiobook",
        language: "rus",
        originalTitle: "始まりはいつも来訪者から",
        originalTextwriter: "長月達平",
        originalReleaseTime: "2014-09-17",
        image: await fetch("https://witchculttranslation.com/wp-content/uploads/2018/11/a5c1.png").then(async rs => {
            const buff = await rs.arrayBuffer();
            const mime = rs.headers.get("Content-Type");
            console.log("image " + mime + " " + buff.byteLength);
            return {
                mime,
                imageBuffer: Buffer.from(buff),
                type: {
                   id: TagConstants.AttachedPicture.PictureType.FRONT_COVER,
                },
                description: "Chapter Illustration",
            };
        }),
        synchronisedLyrics: [{
            language: "rus",
            timeStampFormat: TagConstants.TimeStampFormat.MILLISECONDS,
            contentType: TagConstants.SynchronisedLyrics.ContentType.LYRICS,
            shortText: speeches.length + " speeches follow. SYLT frames are supported by PowerAmp and MusicBee players on the moment of writing. If you see this, then your player is trying to incorrectly interpret SYLT id3v2 tag as .lrc and it should be ashamed for adding to the confusion of the SYLT format.",
            synchronisedText: speeches.map(speech => ({
                text: speech.text,
                timeStamp: Math.floor(speech.startTime * 1000),
            })),
        }],
    }, "compiled_chap1_clean.mp3");
}

main().then(
    () => exit(0),
    error => {
        console.error(error);
        exit(1);
    }
);

// const concatenation = ffmpeg()
//     .input('./tmp/list.txt')
//     .inputOptions(['-f concat', '-safe 0'])
//     .outputOptions('-c copy')
//     .save('compiled_chap1.oga');
// console.log(concatenation);
// await new Promise(
//     (resolve, reject) => concatenation  // Output file
//         .on('error', reject)
//         .on('end', resolve)
// );
//
// let stdout, stderr;
// [stdout, stderr] = await execAsync("C:\\m\\ffmpeg\\bin\\ffmpeg.exe -f concat -safe 0 -i .\\tmp\\list.txt -c copy compiled_chap1.oga");
// console.log("STDOUT");
// console.log(stdout);
// console.log("STDERR");
// console.log(stderr);
