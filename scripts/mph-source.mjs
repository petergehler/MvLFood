import { parseMphSpeiseplan, parseMphSpeiseplanPdfText } from "./parse-mph-speiseplan.mjs";

// Do not let cosmetic HTML changes prevent the PDF fallback from running.
export async function resolveMphSource(html, pageUrl, {
  pdfText,
  today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }).format(new Date()),
  forceUpcoming = false,
  parsePdf = parseMphSpeiseplanPdfText,
} = {}) {
  const monday = new Date(`${today}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (monday.getUTCDay() + 6) % 7);
  if (forceUpcoming) monday.setUTCDate(monday.getUTCDate() + 7);
  const start = monday.toISOString().slice(0, 10);
  monday.setUTCDate(monday.getUTCDate() + 7);
  const end = monday.toISOString().slice(0, 10);
  function checkDays(days) {
    if (!days.length || days.some(day => !day.date || day.date < start || day.date >= end) ||
        !days.some(day => day.items.length)) {
      throw new Error(`Menu does not cover the requested week starting ${start}`);
    }
    return days;
  }
  const errors = [];
  if (!forceUpcoming) {
    try {
      return { kind: "html", url: pageUrl, days: checkDays(parseMphSpeiseplan(html)) };
    } catch (error) { errors.push(`HTML: ${error.message}`); }
  }
  const links = [...html.matchAll(/<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, , href, label]) => ({
      url: new URL(href.replace(/&amp;/g, "&"), pageUrl).href,
      label: label.replace(/<[^>]+>/g, " ").replace(/&nbsp;|\s+/g, " ").trim(),
    })).filter(link => /\.pdf(?:$|\?)/i.test(link.url));
  const current = links.find(link => /aktueller\s+speiseplan/i.test(link.label));
  const upcoming = links.find(link => /kommenden\s+woche/i.test(link.label));
  for (const link of (forceUpcoming ? [upcoming] : [current, upcoming]).filter(Boolean)) {
    try {
      const days = checkDays(parsePdf(await pdfText(link.url)));
      console.warn(`MPH PDF fallback: ${errors.join("; ")} -> ${link.url}`);
      return { kind: "pdf", url: link.url, days };
    } catch (error) { errors.push(`${link.url}: ${error.message}`); }
  }
  throw new Error(`No usable MPH menu: ${errors.join("; ") || "No matching PDF link"}`);
}
