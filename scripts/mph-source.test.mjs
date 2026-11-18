import test from "node:test";
import assert from "node:assert/strict";
import { parseMphSpeiseplan } from "./parse-mph-speiseplan.mjs";
import { resolveMphSource } from "./mph-source.mjs";
const table = `<table><thead><tr><th>Tag</th><th>Quick &amp; Easy</th><th>vegan / veggie</th></tr></thead><tbody><tr><td>Montag</td><td>Tagesessen</td><td>Linsencurry</td></tr></tbody></table>`;
const links = `<a href='/current.pdf'><strong>Aktueller Speiseplan als PDF</strong></a><a href="/next.pdf">Speiseplan der kommenden Woche als PDF</a>`;
const pageUrl = "https://example.org/menu";
const options = { today: "2026-11-18" };
const days = [{ date: "2026-11-16", items: [{ title: "Curry" }] }];
for (const heading of [
  '<h2><strong>16.11.26 –20.11.26</strong></h2>',
  '<h2><strong>16</strong><strong>.11.26 –20.11.26&nbsp;</strong></h2>',
  '<h2 class="week"><span>16.11.2026</span>&#160;&ndash;&#xA0;20.11.2026</h2>',
  '<h2>16.11. – 20.11.2026</h2>',
]) {
  test(`parses heading ${heading}`, () => {
    assert.equal(parseMphSpeiseplan(heading + table)[0].date, "2026-11-16");
  });
}
test("valid HTML is preferred without downloading a PDF", async () => {
  const result = await resolveMphSource('<h2>16.11.26 – 20.11.26</h2>' + table + links, pageUrl,
    { ...options, pdfText: () => { throw new Error("must not fetch"); } });
  assert.equal(result.kind, "html");
});
test("broken HTML falls back to current PDF before upcoming PDF", async () => {
  const seen = [];
  const result = await resolveMphSource(links, pageUrl, { ...options,
    pdfText: async url => { seen.push(url); return "tsv"; }, parsePdf: () => days });
  assert.equal(result.url, "https://example.org/current.pdf");
  assert.deepEqual(seen, [result.url]);
});
test("upcoming link can recover if current PDF fails and its actual dates match", async () => {
  const result = await resolveMphSource(links, pageUrl, { ...options,
    pdfText: async url => { if (url.endsWith('/current.pdf')) throw new Error("503"); return "tsv"; },
    parsePdf: () => days });
  assert.equal(result.url, "https://example.org/next.pdf");
});
test("rejects stale and future PDFs rather than publishing the wrong week", async () => {
  await assert.rejects(resolveMphSource(links, pageUrl, { ...options,
    pdfText: async url => url,
    parsePdf: url => [{ date: url.endsWith('/current.pdf') ? "2026-11-09" : "2026-11-23", items: [{}] }],
  }), /No usable MPH menu/);
});
test("forced upcoming mode bypasses malformed HTML and validates next week", async () => {
  const result = await resolveMphSource(links, pageUrl, { ...options, forceUpcoming: true,
    pdfText: async url => { assert.ok(url.endsWith('/next.pdf')); return "tsv"; },
    parsePdf: () => [{ date: "2026-11-23", items: [{}] }] });
  assert.equal(result.kind, "pdf");
});
