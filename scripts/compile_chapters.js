import fs from "fs/promises";
import util from "util";
import { exec } from "child_process";
import ffmpeg from 'fluent-ffmpeg';
import { promisify } from "util";

const ffprobe = promisify(ffmpeg.ffprobe);

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
