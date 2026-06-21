import { readFile } from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

if (import.meta.url === `file://${process.argv[1]}`) {
  const source = args.html
    ? await readFile(args.html, "utf8")
    : await fetchText(args.url || "https://www.mph.tuebingen.mpg.de/speiseplan");

  console.log(JSON.stringify(parseMphSpeiseplan(source), null, 2));
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed for ${url}: ${response.status}`);
  return response.text();
}

export function parseMphSpeiseplan(html) {
  const weekStart = parseWeekStart(html);
  const table = firstMenuTable(html);
  const headers = cells(table.match(/<thead[\s\S]*?<\/thead>/i)?.[0] || "", "th").map(cellText);
  const rows = rowsHtml(table.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] || "");

  return rows.map((row) => {
    const rowCells = cells(row, "td").map(cellText);
    const date = dateForDay(weekStart, rowCells[0]);

    return {
      date,
      dayName: normalizeText(rowCells[0]),
      items: rowCells
        .slice(1)
        .map((value, index) => itemFromCell(value, headers[index + 1]))
        .filter(Boolean),
    };
  });
}

export function parseMphSpeiseplanPdfText(text) {
  const words = pdfWords(text);
  const weekStart = parsePdfWeekStart(words);
  const rows = pdfDayRows(words);

  return rows.map(({ dayName, columns }) => ({
    date: dateForDay(weekStart, dayName),
    dayName,
    items: [
      itemFromCell(columns.quick, "Quick & Easy"),
      itemFromCell(columns.meat, "Hauptgericht Fleisch/Fisch"),
      itemFromCell(columns.veggie, "Hauptgericht vegan / veggie"),
    ].filter(Boolean),
  }));
}

function parseWeekStart(html) {
  const match = html.match(/<h2>\s*<strong>\s*(\d{2})\.(\d{2})\.-(\d{2})\.(\d{2})\.(\d{4})\s*<\/strong>\s*<\/h2>/i);
  if (!match) throw new Error("Could not find MPH week date range");

  const [, startDay, startMonth, , , year] = match;
  return new Date(Number(year), Number(startMonth) - 1, Number(startDay));
}

function parsePdfWeekStart(words) {
  const dateWord = words
    .filter((word) => word.left < 110 && /^\d{2}\.\d{2}\.\d{2}$/.test(word.text))
    .sort((a, b) => a.top - b.top)[0];
  if (!dateWord) throw new Error("Could not find MPH PDF week date range");

  const [startDay, startMonth, startYear] = dateWord.text.split(".");
  return new Date(Number(`20${startYear}`), Number(startMonth) - 1, Number(startDay));
}

function pdfDayRows(words) {
  const dayLabels = words
    .map((word) => ({ ...word, dayName: pdfDayName(word.text) }))
    .filter((word) => word.dayName)
    .sort((a, b) => a.top - b.top);
  const columnRanges = {
    meat: [100, 240],
    veggie: [245, 380],
    quick: [640, 830],
  };

  return dayLabels.map((day, index) => {
    const nextDay = dayLabels[index + 1];
    const top = day.top - 32;
    const bottom = nextDay ? nextDay.top - 32 : 520;
    const columns = {};

    for (const [column, [left, right]] of Object.entries(columnRanges)) {
      columns[column] = wordsInBox(words, { left, right, top, bottom });
    }

    return { dayName: day.dayName, columns };
  });
}

function pdfWords(tsv) {
  return tsv
    .trim()
    .split("\n")
    .slice(1)
    .map((line) => line.split("\t"))
    .filter((cols) => cols[0] === "5" && cols[11] && !cols[11].startsWith("###"))
    .map((cols) => ({
      left: Number(cols[6]),
      top: Number(cols[7]),
      text: cols.slice(11).join("\t"),
    }));
}

function wordsInBox(words, { left, right, top, bottom }) {
  const selected = words
    .filter((word) => word.left >= left && word.left < right && word.top >= top && word.top < bottom)
    .filter((word) => !pdfNoise(word.text));
  return clusterPdfLines(selected)
    .map((line) => line.map((word) => word.text).join(" "))
    .join("\n");
}

function clusterPdfLines(words) {
  const lines = [];
  for (const word of [...words].sort((a, b) => a.top - b.top || a.left - b.left)) {
    const line = lines.find((candidate) => Math.abs(candidate.top - word.top) <= 4);
    if (line) {
      line.words.push(word);
      line.top = Math.min(line.top, word.top);
    } else {
      lines.push({ top: word.top, words: [word] });
    }
  }

  return lines
    .sort((a, b) => a.top - b.top)
    .map((line) => line.words.sort((a, b) => a.left - b.left));
}

function pdfDayName(value) {
  const label = normalizeText(value).toLowerCase();
  if (label.includes("montag")) return "Montag";
  if (label.includes("dienstag")) return "Dienstag";
  if (label.includes("mittwoch")) return "Mittwoch";
  if (label.includes("donners")) return "Donnerstag";
  if (label.includes("freitag")) return "Freitag";
  return "";
}

function pdfNoise(value) {
  return /^(fleisch\/fisch|vegan\/veggie|hauptgericht|quick\s*&\s*easy|oder special|dessert|gemüse|inkl\.?|1,45€|5,-€|6,50€)$/i.test(
    normalizeText(value),
  );
}

function firstMenuTable(html) {
  const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
  const table = tables.find((candidate) => /Quick\s*&amp;\s*Easy/i.test(candidate) && /vegan\s*\/\s*veggie/i.test(candidate));
  if (!table) throw new Error("Could not find MPH menu table");
  return table;
}

function rowsHtml(html) {
  return html.match(/<tr[\s\S]*?<\/tr>/gi) || [];
}

function cells(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[\\s\\S]*?<\\/${tagName}>`, "gi")) || [];
}

function itemFromCell(value, header) {
  const text = normalizeText(value);
  if (!text || isSideOrDessert(header)) return null;

  const category = categoryFromHeader(header);
  if (!category) return null;

  const price = text.match(/(\d+[,.]\d{2}\s*€?\s*\/\s*100g|\d+[,.]\d{2}\s*€)/i)?.[1] || "";
  const allergens = [...text.matchAll(/\(([a-zA-Z0-9/]+)\)/g)].flatMap((match) => match[1].split("/"));
  const title = titleFromText(text, category);

  return {
    source: "mph",
    category,
    diet: dietFromHeaderAndText(header, text),
    title,
    description: descriptionFromText(text, title, price),
    price: price.replace(/\s+/g, " ").replace(",", "."),
    allergens,
  };
}

function categoryFromHeader(header) {
  const normalized = normalizeText(header).toLowerCase();
  if (normalized.includes("quick")) return "Quick & Easy";
  if (normalized.includes("fleisch") || normalized.includes("fisch")) return "Main";
  if (normalized.includes("vegan") || normalized.includes("veggie")) return "Vegan/Veggie";
  return "";
}

function dietFromHeaderAndText(header, text) {
  const normalizedHeader = normalizeText(header).toLowerCase();
  const normalizedText = normalizeText(text).toLowerCase();

  if (normalizedText.includes("vegan") || /\b(tofu|quinoa)\b/i.test(text)) return "vegan";
  if (/\b(rabas|tintenfisch|fisch)\b/i.test(text)) return "fish";
  if (normalizedHeader.includes("vegan") || normalizedHeader.includes("veggie")) return "vegetarian";
  if (/(schwein|pute|puten|hähnchen|hackfleisch|fleisch|gyros)/i.test(text)) return "meat";
  return "unknown";
}

function titleFromText(text, category) {
  const lines = text
    .replace(/\([a-zA-Z0-9/]+\)/g, "")
    .replace(/\d+[,.]\d{2}\s*€?\s*\/\s*100g|\d+[,.]\d{2}\s*€/gi, "")
    .split("\n")
    .map((line) => normalizeText(line).replace(/^Street Food Special:\s*/i, ""))
    .filter(Boolean);

  if (category === "Quick & Easy" && /^Tagesessen$/i.test(lines[0] || "")) return "Tagesessen";
  return (lines[0] || "Tagesessen").replace(/[:;,.]$/, "");
}

function descriptionFromText(text, title, price) {
  return text
    .replace(/\([a-zA-Z0-9/]+\)/g, "")
    .replace(price, "")
    .replace(title, "")
    .split("\n")
    .map(normalizeText)
    .filter(Boolean)
    .join(" ");
}

function dateForDay(weekStart, dayName) {
  const offsets = {
    montag: 0,
    dienstag: 1,
    mittwoch: 2,
    donnerstag: 3,
    freitag: 4,
  };
  const offset = offsets[normalizeText(dayName).toLowerCase()];
  if (offset === undefined) return "";

  const date = new Date(weekStart);
  date.setDate(weekStart.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSideOrDessert(header) {
  return /beilagen|dessert/i.test(normalizeText(header));
}

function cellText(html) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>|<\/div>|<\/strong>|<\/u>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function normalizeText(value = "") {
  return value.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n\s+/g, "\n").trim();
}

function decodeEntities(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&euro;/g, "€")
    .replace(/&uuml;/g, "ü")
    .replace(/&auml;/g, "ä")
    .replace(/&ouml;/g, "ö")
    .replace(/&Uuml;/g, "Ü")
    .replace(/&Auml;/g, "Ä")
    .replace(/&Ouml;/g, "Ö")
    .replace(/&szlig;/g, "ß");
}
