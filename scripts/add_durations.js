import fs from "fs/promises";
import ffmpeg from 'fluent-ffmpeg';
import {promisify} from "util";
import {parseAttribution} from "./modules/parse_helpers.js";

const ffprobe = promisify(ffmpeg.ffprobe);

const chapters = JSON.parse(await fs.readFile("./chapters.json", "utf8"));
const speakers = JSON.parse(await fs.readFile("./speakers.json", "utf8"));

const nameToSpeaker = Object.fromEntries(speakers.map(s => [s.name, s]));

let i = 0;
for (const chapter of chapters) {
    if (++i < 26) {
        chapter.translator = "Эльрат";
    }
    chapter.paragraphs = chapter.paragraphs
        .filter(p => p.text.trim() !== "")
        .filter(p => {
            const asAttribution = p.speaker === "Narrator" && parseAttribution(p.text);
            if (asAttribution) {
                console.log("asAttribution", asAttribution);
                if (asAttribution.translator) {
                    chapter.translator = asAttribution.translator;
                }
                if (asAttribution.editor) {
                    chapter.editor = asAttribution.editor;
                }
                return false;
            }
            return true;
        });
    for (const p of chapter.paragraphs) {
        const speakerData = nameToSpeaker[p.speaker];
        const gender = !speakerData ? "UNKNOWN" : speakerData.gender;
        const speechPath = p.text.match(/^(\s*※\s*)+$/) || p.text.match(/^(\s*\*\s*)+$/)
            ? "special_speeches/few_moments_later.oga"
            : !p.text.match(/[а-яА-Я]/) ? (
                gender === "MALE"
                    ? "special_speeches/hm_male.oga"
                    : "special_speeches/hm_female.oga"
            )
            : `speeches/${p.id}.oga`;
        const metadata = await ffprobe(speechPath);
        p.duration = metadata.format.duration;
        p.speechPath = speechPath;
        console.log("ololo " + p.id);
    }
}

await fs.writeFile("./chapters_with_duration.json", JSON.stringify(chapters, null, 4));
