import fs from "fs/promises";

/** @kudos to https://stackoverflow.com/a/27979933/2750743 */
function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

async function generateSpeech(msSpeakerId, text) {
    const response = await fetch("https://swedencentral.tts.speech.microsoft.com/cognitiveservices/v1", {
        method: "POST",
        headers: {
            "X-Microsoft-OutputFormat": "ogg-48khz-16bit-mono-opus",
            "Ocp-Apim-Subscription-Key": "81693f28ed3d4ccb9e2d0073b895b111",
            "Content-Type": "application/ssml+xml",
        },
        body: `<speak version='1.0' xml:lang='ru-RU'>
            <voice xml:lang='ru-RU' name='${msSpeakerId}'>${escapeXml(text)}</voice>
        </speak>`,
    });
    if (!response.ok) {
        throw new Error("Unsuccessful status returned by speech API: " + response.status + " speaking of " + text);
    }
    return await response.arrayBuffer();
}

const speakers = JSON.parse(await fs.readFile("./speakers.json", "utf8"));
const chapters = JSON.parse(await fs.readFile("./chapters.json", "utf8"));

const nameToSpeaker = Object.fromEntries(speakers.map(s => [s.name, s]));

for (const chapter of chapters) {
    for (const paragraph of chapter.paragraphs) {
        let { id, speaker, text } = paragraph;
        if (text.match(/^(\s*※\s*)+$/) || text.match(/^(\s*\*\s*)+$/)) {
            text = "... Некоторое время спустя...";
        }
        console.log("#" + id + " " + speaker + ": " + text);
        const speakerData = nameToSpeaker[speaker];
        const gender = !speakerData ? "UNKNOWN" : speakerData.gender;
        const msSpeakerId = gender === "MALE"
            ? "ru-RU-DmitryNeural"
            : "ru-RU-SvetlanaNeural";
        const speechOggBuff = await generateSpeech(msSpeakerId, text);
        const outputFileName = id + ".oga";
        await fs.appendFile("./speeches/" + outputFileName, Buffer.from(speechOggBuff));
    }
}
