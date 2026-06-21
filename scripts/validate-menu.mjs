import { readFile } from "node:fs/promises";

const feed = JSON.parse(await readFile(new URL("../data/menu.json", import.meta.url), "utf8"));
const errors = [];
const sourceIds = new Set(Object.keys(feed.sources || {}));
const validWeekdays = new Set([0, 1, 2, 3, 4, 5, 6]);

if (!feed.updatedAt) errors.push("updatedAt is required");
if (!feed.week) errors.push("week is required");
if (!Array.isArray(feed.days) || feed.days.length === 0) errors.push("days must be a non-empty array");

for (const [sourceId, source] of Object.entries(feed.sources || {})) {
  validateOpeningHours(source.openingHours, `source ${sourceId}`);
}

for (const day of feed.days || []) {
  if (!day.date) errors.push("day.date is required");
  if (!day.label) errors.push(`day ${day.date} needs a label`);
  if (!Array.isArray(day.items)) errors.push(`day ${day.date} needs items`);

  for (const item of day.items || []) {
    if (!sourceIds.has(item.source)) errors.push(`${day.date}: unknown source ${item.source}`);
    if (!item.title) errors.push(`${day.date}: item title is required`);
    if (!item.category) errors.push(`${day.date}: ${item.title} needs a category`);
    if (!["vegan", "vegetarian", "meat", "fish", "unknown"].includes(item.diet)) {
      errors.push(`${day.date}: ${item.title} has invalid diet ${item.diet}`);
    }
    if (item.diets) {
      if (!Array.isArray(item.diets)) {
        errors.push(`${day.date}: ${item.title} diets must be an array`);
      } else if (!item.diets.every((diet) => ["vegan", "vegetarian", "meat", "fish", "unknown"].includes(diet))) {
        errors.push(`${day.date}: ${item.title} has invalid diets`);
      }
    }
    if (!Array.isArray(item.allergens)) errors.push(`${day.date}: ${item.title} allergens must be an array`);
    validateOpeningHours(item.openingHours, `${day.date}: ${item.title}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${feed.days.reduce((sum, day) => sum + day.items.length, 0)} menu items.`);

function validateOpeningHours(openingHours, label) {
  if (!openingHours) return;

  if (openingHours.date && !/^\d{4}-\d{2}-\d{2}$/.test(openingHours.date)) {
    errors.push(`${label} openingHours.date must be YYYY-MM-DD`);
  }

  if (openingHours.rules) {
    if (!Array.isArray(openingHours.rules) || openingHours.rules.length === 0) {
      errors.push(`${label} openingHours.rules must be a non-empty array`);
      return;
    }

    for (const [index, rule] of openingHours.rules.entries()) {
      validateOpeningHourRule(rule, `${label} openingHours.rules[${index}]`);
    }
    return;
  }

  validateOpeningHourRule(openingHours, `${label} openingHours`);
}

function validateOpeningHourRule(rule, label) {
  if (rule.days) {
    if (!Array.isArray(rule.days)) {
      errors.push(`${label}.days must be an array`);
    } else if (!rule.days.every((day) => validWeekdays.has(day))) {
      errors.push(`${label}.days must contain weekdays 0-6`);
    }
  }

  if (!Array.isArray(rule.intervals) || rule.intervals.length === 0) {
    errors.push(`${label}.intervals must be a non-empty array`);
    return;
  }

  for (const interval of rule.intervals) {
    if (!isTime(interval.start) || !isTime(interval.end)) {
      errors.push(`${label} intervals need HH:MM start and end`);
    }
  }
}

function isTime(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}
