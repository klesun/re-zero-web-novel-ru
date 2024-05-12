import { JSDOM } from "jsdom";
import fs from "fs/promises";

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
        const chapter = {
            title: doc.querySelector("h1").textContent.trim().replace(/\s+/g, " "),
            file: file,
            phase: phase,
            chapter: chapterNumber,
            paragraphs: [...doc.querySelectorAll("p")]
                .filter(p => p.textContent.trim() !== "")
                .map((p, i) => {
                    // p.setAttribute("id", chapterNumber + "_" + String(i).padStart(4, "0"));
                    let text = p.textContent.trim().replace(/\s+/g, " ");
                    const asQuote = text.split(/\s*:\s*/g);
                    let speaker = "Narrator"
                    if (asQuote.length > 1) {
                        const nameParts = asQuote[0].split(/\s+/g);
                        if (asQuote[0] !== "Перевод" &&
                            asQuote[0] !== "Редактура" &&
                            asQuote[0] !== "Перевод и редактура" &&
                            asQuote[0] !== "Перевод и Редактура" &&
                            nameParts.length <= 3 ||
                            asQuote[0] === "Член Чешуи Белого Дракона"
                        ) {
                            speaker = asQuote[0];
                            text = asQuote.slice(1).join(":");
                        }
                    }
                    return { id: p.getAttribute("id"), speaker, text };
                }),
        };
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
