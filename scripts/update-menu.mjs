import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { parseMphSpeiseplan } from "./parse-mph-speiseplan.mjs";

const execFileAsync = promisify(execFile);
const root = new URL("..", import.meta.url);
const menuUrl = new URL("data/menu.json", root);
const currentFeed = JSON.parse(await readFile(menuUrl, "utf8"));

const hungryPdf = await findHungryElkPdf();
const hungryText = await pdfText(hungryPdf, ["-tsv"]);
const mphHtml = await fetchText(process.env.MPH_CURRENT_HTML_URL || "https://www.mph.tuebingen.mpg.de/speiseplan");

const hungryDays = parseHungryElkTsv(hungryText);
const mphDays = parseMphSpeiseplan(mphHtml);
const generatedDates = new Set([...hungryDays, ...mphDays].map((day) => day.date).filter(Boolean));
const weekStart = [...generatedDates].sort()[0];
let updatedFeed = buildFeed({
  currentFeed,
  hungryPdf,
  mphUrl: process.env.MPH_CURRENT_HTML_URL || "https://www.mph.tuebingen.mpg.de/speiseplan",
  hungryDays,
  mphDays,
  generatedDates,
  weekStart,
});

if (process.env.OPENAI_API_KEY && process.env.MENU_LLM_NORMALIZE !== "0") {
  updatedFeed = await normalizeGeneratedItemsWithLlm(updatedFeed);
} else {
  console.log("Skipping LLM normalization; set OPENAI_API_KEY to enable it.");
}

if (comparableFeed(updatedFeed) === comparableFeed(currentFeed)) {
  updatedFeed = currentFeed;
}

await writeFile(menuUrl, `${JSON.stringify(updatedFeed, null, 2)}\n`);
console.log(`${updatedFeed === currentFeed ? "Checked" : "Updated"} data/menu.json for ${updatedFeed.week} from:`);
console.log(`- ${hungryPdf}`);
console.log(`- ${updatedFeed.sources.mph.menuUrl}`);

async function findHungryElkPdf() {
  const response = await fetch("https://stollsteimer.de/wp-json/wp/v2/pages/2755");
  if (!response.ok) throw new Error(`Hungry Elk REST request failed: ${response.status}`);
  const page = await response.json();
  const content = page.content?.rendered || "";
  const match = content.match(
    /https?:\\?\/\\?\/stollsteimer\.de\\?\/easy-pdf-restaurant-menu\\?\/menu-files\\?\/menu-thehungryelk\.pdf\?cb=\d+/,
  );
  if (!match) throw new Error("Could not find Hungry Elk PDF URL");
  return match[0].replaceAll("\\/", "/");
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed for ${url}: ${response.status}`);
  return response.text();
}

async function pdfText(url, args = ["-layout"]) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PDF request failed for ${url}: ${response.status}`);

  const filePath = join(tmpdir(), `${crypto.randomUUID()}.pdf`);
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));

  try {
    const { stdout } = await execFileAsync("pdftotext", [...args, filePath, "-"], {
      maxBuffer: 1024 * 1024 * 10,
    });
    return stdout;
  } catch (error) {
    throw new Error(`pdftotext failed. Install poppler-utils/poppler. ${error.message}`);
  }
}

function parseHungryElkTsv(tsv) {
  const rows = tsv
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

  const header = parseHungryHeader(rows);
  const dayColumns = dayColumnPositions(rows);
  const categoryRows = categoryRowPositions(rows);
  const days = new Map(dayColumns.map((column, index) => [index, { date: addDays(header.startDate, index), items: [] }]));

  for (const [categoryIndex, [category, categoryTop]] of categoryRows.entries()) {
    if (category === "Dessert") continue;

    const nextCategoryTop = categoryRows[categoryIndex + 1]?.[1] || Number.POSITIVE_INFINITY;
    for (const [dayIndex, columnLeft] of dayColumns.entries()) {
      const nextColumnLeft = dayColumns[dayIndex + 1] || Number.POSITIVE_INFINITY;
      const cellRows = rows.filter(
        (row) =>
          row.left >= columnLeft &&
          row.left < nextColumnLeft &&
          row.top > categoryTop + 20 &&
          row.top < nextCategoryTop - 5,
      );
      const item = hungryItemFromRows(cellRows, category);
      if (item) days.get(dayIndex).items.push(item);
    }
  }

  return [...days.values()].filter((day) => day.items.length);
}

function parseHungryHeader(rows) {
  const headerText = rows
    .filter((row) => row.top < 260)
    .map((row) => row.text)
    .join(" ");
  const match = headerText.match(/vom\s+(\d{1,2})\.\s+([A-Za-zÄÖÜäöüß]+)\s+bis\s+\d{1,2}\.\s+[A-Za-zÄÖÜäöüß]+\s+(\d{4})/i);
  if (!match) throw new Error("Could not find Hungry Elk week date range");

  return {
    startDate: `${match[3]}-${String(monthNumber(match[2])).padStart(2, "0")}-${String(match[1]).padStart(2, "0")}`,
  };
}

function dayColumnPositions(rows) {
  const dayNames = ["MONTAG", "DIENSTAG", "MITTWOCH", "DONNERSTAG", "FREITAG"];
  return dayNames.map((day) => {
    const match = rows.find((row) => row.text.toUpperCase() === day);
    if (!match) throw new Error(`Could not find Hungry Elk column for ${day}`);
    return match.left - 110;
  });
}

function categoryRowPositions(rows) {
  const categories = new Map();
  const candidates = [
    ["SALATBOWL", "Salatbowl"],
    ["PASTA", "Pizza & Pasta"],
    ["REGION", "Region"],
    ["FOOD", "Street Food"],
    ["DESSERT", "Dessert"],
  ];

  for (const [needle, category] of candidates) {
    const match = rows.find((row) => row.left < 380 && row.text.toUpperCase() === needle);
    if (match) categories.set(category, match.top);
  }

  return [...categories.entries()].sort((a, b) => a[1] - b[1]);
}

function hungryItemFromRows(rows, category) {
  const lines = clusterLineRows(rows)
    .map((lineRows) =>
      lineRows
        .sort((a, b) => a.left - b.left)
        .map((row) => row.text)
        .join(" ")
        .trim(),
    )
    .filter(Boolean);

  if (!lines.length) return null;

  const priceLineIndex = lines.findIndex((line) => /Int:\s*\d/.test(line));
  const relevantLines = priceLineIndex >= 0 ? lines.slice(0, priceLineIndex + 1) : lines;
  const allergenLineIndex = relevantLines.findIndex((line) => /^\([A-Z0-9,]+\)$/.test(line));
  const foodLines = relevantLines.slice(0, allergenLineIndex >= 0 ? allergenLineIndex : priceLineIndex);
  const titleLineCount = titleLineCountFor(foodLines);
  const title = normalizeFoodText(foodLines.slice(0, titleLineCount).join(" "));

  if (!title) return null;

  return {
    source: "hungry-elk",
    category,
    diet: hungryDiet(`${title} ${foodLines.slice(titleLineCount).join(" ")}`),
    title,
    description: normalizeFoodText(foodLines.slice(titleLineCount).join(" ")),
    price: priceLineIndex >= 0 ? normalizeHungryPrice(relevantLines[priceLineIndex]) : "",
    allergens:
      allergenLineIndex >= 0
        ? relevantLines[allergenLineIndex]
            .replace(/[()]/g, "")
            .split(",")
            .filter(Boolean)
        : [],
  };
}

function clusterLineRows(rows) {
  const lines = [];
  for (const row of [...rows].sort((a, b) => a.top - b.top || a.left - b.left)) {
    const line = lines.find((candidate) => Math.abs(candidate.top - row.top) <= 12);
    if (line) {
      line.rows.push(row);
      line.top = Math.min(line.top, row.top);
    } else {
      lines.push({ top: row.top, rows: [row] });
    }
  }
  return lines.sort((a, b) => a.top - b.top).map((line) => line.rows);
}

function titleLineCountFor(lines) {
  if (lines.length < 2) return 1;
  if (lines[0].endsWith("-")) return 2;
  if (/^(Spinat|\"Tonkatsu\")$/i.test(lines[1])) return 2;
  if (/^[a-zäöüß]/.test(lines[1])) return 1;
  return 1;
}

function normalizeHungryPrice(value) {
  return value
    .replace(/Int:\s*/i, "Int ")
    .replace(/€\s*\/\s*Ext:\s*/i, "/ Ext ")
    .replace(/\s*€/g, "")
    .replace(/,/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

function hungryDiet(text) {
  if (/vegan/i.test(text)) return "vegan";
  if (/(seelachs|fisch|calamari)/i.test(text)) return "fish";
  if (/(hähnchen|fleisch|schwein|puten|bolognese|hack|schinken|maultaschen)/i.test(text)) return "meat";
  if (/(camembert|mozzarella|gorgonzola|ricotta|spinat|pasta|spaghetti)/i.test(text)) return "vegetarian";
  return "unknown";
}

function buildFeed({ currentFeed, hungryPdf, mphUrl, hungryDays, mphDays, generatedDates, weekStart }) {
  const daysByDate = new Map();

  for (const date of [...generatedDates].sort()) {
    daysByDate.set(date, {
      date,
      label: weekdayLabel(date, "short"),
      fullLabel: fullLabel(date),
      items: [],
    });
  }

  for (const day of hungryDays) daysByDate.get(day.date)?.items.push(...day.items);
  for (const day of mphDays) daysByDate.get(day.date)?.items.push(...day.items);
  addPreservedManualItems(currentFeed, daysByDate);
  addRecurringTemplates(currentFeed, daysByDate);

  return {
    ...currentFeed,
    updatedAt: new Date().toISOString(),
    week: isoWeek(weekStart),
    sources: {
      ...currentFeed.sources,
      "hungry-elk": {
        ...currentFeed.sources["hungry-elk"],
        menuUrl: hungryPdf,
      },
      mph: {
        ...currentFeed.sources.mph,
        menuUrl: mphUrl,
      },
    },
    days: [...daysByDate.values()],
  };
}

function comparableFeed(feed) {
  const comparable = structuredClone(feed);
  comparable.updatedAt = "";

  if (comparable.sources?.["hungry-elk"]?.menuUrl) {
    comparable.sources["hungry-elk"].menuUrl = comparable.sources["hungry-elk"].menuUrl.replace(/\?cb=\d+$/, "");
  }

  return JSON.stringify(comparable);
}

async function normalizeGeneratedItemsWithLlm(feed) {
  const normalizedFeed = structuredClone(feed);
  const candidates = [];

  for (const [dayIndex, day] of normalizedFeed.days.entries()) {
    for (const [itemIndex, item] of day.items.entries()) {
      if (!["hungry-elk", "mph"].includes(item.source)) continue;
      candidates.push({
        id: `${dayIndex}:${itemIndex}`,
        date: day.date,
        source: item.source,
        category: item.category,
        title: item.title,
        description: item.description,
        diet: item.diet,
      });
    }
  }

  if (!candidates.length) return normalizedFeed;

  const normalizedItems = await openAiJson({
    instructions:
      "Normalize German cafeteria menu items for a small lunch app. Return concise, natural English. Preserve food meaning. Do not invent ingredients. Classify diet as exactly one of vegan, vegetarian, meat, fish, or unknown. Keep unknown when uncertain.",
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              task:
                "Return JSON with an items array. Each item must keep the same id and include only id, title, description, and diet. Translate title and description to English. Keep dish names recognizable; do not include price, allergens, date, source, or category.",
              items: candidates,
            }),
          },
        ],
      },
    ],
  });

  if (!Array.isArray(normalizedItems.items)) {
    throw new Error("LLM normalization response did not include an items array");
  }

  const byId = new Map(normalizedItems.items.map((item) => [item.id, item]));
  for (const candidate of candidates) {
    const normalized = byId.get(candidate.id);
    if (!normalized) throw new Error(`LLM normalization missed item ${candidate.id}`);
    if (!["vegan", "vegetarian", "meat", "fish", "unknown"].includes(normalized.diet)) {
      throw new Error(`LLM normalization returned invalid diet for ${candidate.id}: ${normalized.diet}`);
    }

    const [dayIndex, itemIndex] = candidate.id.split(":").map(Number);
    const item = normalizedFeed.days[dayIndex].items[itemIndex];
    item.title = cleanLlmText(normalized.title);
    item.description = cleanLlmText(normalized.description);
    item.diet = normalized.diet;
  }

  console.log(`Normalized ${candidates.length} generated items with ${process.env.OPENAI_MODEL || "gpt-5-mini"}.`);
  return normalizedFeed;
}

async function openAiJson({ instructions, input }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      instructions,
      input,
      text: {
        format: {
          type: "json_schema",
          name: "normalized_menu_items",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["items"],
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "title", "description", "diet"],
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    diet: { type: "string", enum: ["vegan", "vegetarian", "meat", "fish", "unknown"] },
                  },
                },
              },
            },
          },
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI normalization failed: ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  const outputText =
    result.output_text ||
    result.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === "output_text" && content.text)
      ?.text;

  if (!outputText) throw new Error("OpenAI normalization response did not include output text");
  return JSON.parse(outputText);
}

function cleanLlmText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function addPreservedManualItems(currentFeed, daysByDate) {
  const generatedSourceIds = new Set(["hungry-elk", "mph"]);

  for (const day of currentFeed.days || []) {
    for (const item of day.items || []) {
      const serviceDate = item.openingHours?.date;
      if (generatedSourceIds.has(item.source) || !serviceDate || !daysByDate.has(serviceDate)) continue;
      daysByDate.get(serviceDate).items.push(structuredClone(item));
    }
  }
}

function addRecurringTemplates(currentFeed, daysByDate) {
  const generatedSourceIds = new Set(["hungry-elk", "mph"]);
  const templatesBySource = new Map();

  for (const day of currentFeed.days || []) {
    for (const item of day.items || []) {
      if (generatedSourceIds.has(item.source) || item.openingHours?.date || templatesBySource.has(item.source)) continue;
      const source = currentFeed.sources[item.source];
      if (!source?.openingHours?.days) continue;
      templatesBySource.set(
        item.source,
        day.items
          .filter((candidate) => candidate.source === item.source && !candidate.openingHours?.date)
          .map((candidate) => structuredClone(candidate)),
      );
    }
  }

  for (const day of daysByDate.values()) {
    const weekday = weekdayNumber(day.date);
    for (const [sourceId, templates] of templatesBySource) {
      const source = currentFeed.sources[sourceId];
      if (source.openingHours.days.includes(weekday)) {
        day.items.push(...templates.map((template) => structuredClone(template)));
      }
    }
  }
}

function normalizeFoodText(value) {
  return value.replace(/\s+/g, " ").replace(/\s+-\s*/g, "-").replace(/-\s+/g, "-").trim();
}

function monthNumber(monthName) {
  const months = {
    januar: 1,
    februar: 2,
    märz: 3,
    maerz: 3,
    april: 4,
    mai: 5,
    juni: 6,
    juli: 7,
    august: 8,
    september: 9,
    oktober: 10,
    november: 11,
    dezember: 12,
  };
  return months[monthName.toLowerCase()] || 1;
}

function addDays(dateString, offset) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function weekdayNumber(dateString) {
  return new Date(`${dateString}T00:00:00Z`).getUTCDay();
}

function weekdayLabel(dateString, style) {
  return new Intl.DateTimeFormat("en", { weekday: style, timeZone: "UTC" }).format(new Date(`${dateString}T00:00:00Z`));
}

function fullLabel(dateString) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateString}T00:00:00Z`));
}

function isoWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}
