import { JSDOM } from "jsdom";
import fs from "fs/promises";
import {parseAttribution} from "./modules/parse_helpers.js";

const chapters = [];
for (let phase = 1; phase <= 6; ++phase) {
    const phaseDir = "./arcs/5/phases/" + phase;
    const files = await fs.readdir(phaseDir);
    for (const file of files) {
        if (!file.endsWith(".html") || file === "26_elrat.html") {
            continue;
        }
        const chapterNumber = file.replace(/\.html$/, "");
        const html = await fs.readFile(phaseDir + "/" + file, "utf8");
        const doc = new JSDOM(html).window.document;
        let translator, editor;
        if (chapterNumber < "26") {
            translator = "Эльрат";
        }
        const chapter = {
            title: doc.querySelector("h1").textContent.trim().replace(/\s+/g, " "),
            file: file,
            phase: phase,
            chapter: chapterNumber,
            translator: null,
            editor: null,
            paragraphs: [...doc.querySelectorAll("p")]
                .filter(p => p.textContent.trim() !== "")
                .flatMap((p, i) => {
                    // p.setAttribute("id", chapterNumber + "_" + String(i).padStart(4, "0"));
                    let text = p.textContent.trim().replace(/\s+/g, " ");
                    const asQuote = text.split(/\s*:\s*/g);
                    const asAttribution = parseAttribution(text);
                    let speaker = "Narrator";
                    if (asAttribution) {
                        if (asAttribution.translator) {
                            translator = asAttribution.translator;
                        }
                        if (asAttribution.editor) {
                            editor = asAttribution.editor;
                        }
                        return [];
                    } else if (asQuote.length > 1) {
                        const nameParts = asQuote[0].split(/\s+/g);
                        if (nameParts.length <= 3 ||
                            asQuote[0] === "Член Чешуи Белого Дракона"
                        ) {
                            speaker = asQuote[0];
                            text = asQuote.slice(1).join(":");
                        }
                    }
                    return [{ id: p.getAttribute("id"), speaker, text }];
                }),
        };
        chapter.translator = translator;
        chapter.editor = editor;
        // const newHtml = doc.body.innerHTML;
        // await fs.writeFile(phaseDir + "/" + file, newHtml);
        chapters.push(chapter);
    }
}

console.log(JSON.stringify(chapters));

// const speakers = chapters.flatMap(c => c.paragraphs).map(p => p.speaker);
// let speakerToCount = {};
// for (const speaker of speakers) {
//     speakerToCount[speaker] = speakerToCount[speaker] ?? {
//         gender: "UNKNOWN",
//         occurrences: 0,
//         name: speaker,
//     };
//     speakerToCount[speaker].occurrences += 1;
// }
// const sortedSpeakers = Object.values(speakerToCount).sort((a,b) => b.occurrences - a.occurrences);
// console.log(JSON.stringify(sortedSpeakers));
