
export function parseAttribution(text) {
    const parts = text.split(":").map(part => part.trim());
    if (parts.length < 2) {
        return null;
    }
    const value = parts.slice(1).join(" ");
    if (parts[0].toUpperCase() === "ПЕРЕВОД") {
        return { translator: value };
    } else if (parts[0].toUpperCase() === "РЕДАКТУРА") {
        return { editor: value };
    } else if (parts[0].toUpperCase() === "ПЕРЕВОД И РЕДАКТУРА") {
        return { translator: value, editor: value };
    } else {
        return null;
    }
}
