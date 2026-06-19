import { readFile } from "node:fs/promises";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=")];
  }),
);

if (!args.email) {
  console.error("Usage: node scripts/parse-spicetripping-email.mjs --email=/path/to/email.txt");
  process.exit(1);
}

const email = await readFile(args.email, "utf8");
const service = parseService(email);
const kadalaDescription = cleanItemDescription(
  "Traditional Kerala curry with black chickpeas, homemade spice blend, onion, sweet corn, ginger, garlic, tomato and coconut milk. Served with steamed rice, papadams, coconut chutney, beetroot yogurt salad and fried chilli.",
);
const chickenDescription = cleanItemDescription(
  "Marinated chicken with homemade spice blend, onion, tomato, ginger, garlic, coriander and coconut milk. Served with steamed rice, papadams, coconut chutney, beetroot yogurt salad and fried chilli.",
);

const parsed = {
  source: {
    id: "spicetripping",
    name: "Spicetripping",
    shortName: "ST",
    kind: "truck",
    logo: "data/images/logos/spicetripping-logo.jpg",
  },
  service,
  items: [
    {
      source: "spicetripping",
      category: "Food truck",
      diet: "vegan",
      title: "Kadala Curry",
      description: kadalaDescription,
      price: "7.50",
      allergens: ["milk"],
    },
    {
      source: "spicetripping",
      category: "Food truck",
      diet: "meat",
      title: "Chicken Masala",
      description: chickenDescription,
      price: "8.50",
      allergens: ["milk"],
    },
  ],
};

console.log(JSON.stringify(parsed, null, 2));

function parseService(text) {
  const normalized = text.replace(/\s+/g, " ");
  const dateMatch = normalized.match(/On\s+([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*([A-Za-z]+),?\s*(\d{4})/i);
  const timeMatch = normalized.match(/from\s+(\d{3,4})hrs\s+to\s+(\d{3,4})hrs/i);
  const locationMatch = normalized.match(/behind\s+(.+?)\s+from\s+\d{3,4}hrs/i);

  return {
    date: dateMatch ? toIsoDate(dateMatch[2], dateMatch[3], dateMatch[4]) : "",
    dayName: dateMatch?.[1] || "",
    start: timeMatch ? toTime(timeMatch[1]) : "",
    end: timeMatch ? toTime(timeMatch[2]) : "",
    location: locationMatch ? cleanLocation(locationMatch[1]) : "",
  };
}

function toIsoDate(day, monthName, year) {
  const months = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };
  return `${year}-${months[monthName.toLowerCase()] || "01"}-${String(day).padStart(2, "0")}`;
}

function toTime(value) {
  const padded = value.padStart(4, "0");
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

function cleanLocation(value) {
  return value.replace(/\s+/g, " ").replace(/\bstrasse\b/i, "Strasse").trim();
}

function cleanItemDescription(value) {
  return value
    .replace(
      /^(?:behind|hendra am)\s+[^.]*?\b\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\.\s*/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}
