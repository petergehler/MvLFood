import { readFile, appendFile } from "node:fs/promises";

export function menuFreshness(feed, today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date())) {
  const items = feed.days?.find(day => day.date === today)?.items || [];
  const missing = ["hungry-elk", "mph"].filter(source => !items.some(item => item.source === source));
  const invalid = items.some(item => !["vegan", "vegetarian", "meat", "fish"].includes(item.diet));
  return { fresh: items.length > 0 && missing.length === 0 && !invalid, today, missing, invalid };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const feed = JSON.parse(await readFile(new URL("../data/menu.json", import.meta.url), "utf8"));
  const result = menuFreshness(feed);
  console.log(JSON.stringify(result));
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `fresh=${result.fresh}\n`);
  if (process.argv.includes("--require-current") && !result.fresh) {
    throw new Error(`Menu is not current for ${result.today}; missing sources: ${result.missing.join(", ")}; invalid diets: ${result.invalid}`);
  }
}
