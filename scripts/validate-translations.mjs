import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const feed = JSON.parse(await readFile(new URL("../data/menu.json", import.meta.url), "utf8"));
const maps = {
  en: readObject("englishDishes", "germanDishes"),
  de: readObject("germanDishes", "swabianDishes"),
  sw: readObject("swabianDishes", "icons"),
};
const errors = [];

for (const day of feed.days || []) {
  for (const item of day.items || []) {
    for (const [language, map] of Object.entries(maps)) {
      if (!map[item.title]) {
        errors.push(`${day.date}: ${language} is missing translation for "${item.title}"`);
      }
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Validated dish translations for English, German, and Swabian.");

function readObject(name, nextName) {
  const declaration = `const ${name} =`;
  const nextDeclaration = `const ${nextName} =`;
  const start = app.indexOf(declaration);
  const next = app.indexOf(nextDeclaration, start);

  if (start === -1 || next === -1) {
    throw new Error(`Could not find ${name}`);
  }

  const objectStart = app.indexOf("{", start);
  const objectSource = app.slice(objectStart, next).trim().replace(/;$/, "");
  return Function(`return (${objectSource})`)();
}
