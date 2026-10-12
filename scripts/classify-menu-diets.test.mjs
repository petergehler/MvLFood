import test from "node:test";
import assert from "node:assert/strict";
import { classifyMenuDiets } from "./classify-menu-diets.mjs";

const feed = { week: "2026-W42", days: [{ date: "2026-10-12", items: [
  { source: "hungry-elk", title: "Tagliatelle", description: "Pilze, Rahm, Parmesan", diet: "unknown", allergens: ["F"], price: "6.70" },
  { source: "yellow-donkey", title: "Pita", diet: "meat", diets: ["meat", "vegetarian"] },
] }] };
const answer = [{ id: "0:0", diet: "vegetarian" }, { id: "0:1", diet: "meat" }];
function mock(items, inspect = () => {}) {
  return async (url, request) => {
    inspect(JSON.parse(request.body));
    return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ items }) } }] }) };
  };
}
test("reads menu descriptions, updates diets only and preserves alternatives", async () => {
  const before = structuredClone(feed);
  const result = await classifyMenuDiets(feed, { apiKey: "test", fetchImpl: mock(answer, body => {
    assert.match(body.messages[1].content, /Pilze, Rahm, Parmesan/);
    assert.deepEqual(body.response_format.json_schema.schema.properties.items.items.properties.diet.enum,
      ["vegan", "vegetarian", "meat", "fish"]);
  }) });
  assert.deepEqual(feed, before);
  before.days[0].items[0].diet = "vegetarian";
  assert.deepEqual(result, before);
});
for (const [name, items] of Object.entries({
  unknown: [{ id: "0:0", diet: "unknown" }, answer[1]],
  missing: [answer[0]],
  duplicate: [answer[0], answer[0]],
  unexpected: [answer[0], { id: "9:9", diet: "fish" }],
})) {
  test(`rejects ${name} classifications`, async () => {
    await assert.rejects(classifyMenuDiets(feed, { apiKey: "test", fetchImpl: mock(items) }));
  });
}
test("fails closed on missing credentials and provider errors", async () => {
  await assert.rejects(classifyMenuDiets(feed, { apiKey: "" }), /required/);
  await assert.rejects(classifyMenuDiets(feed, { apiKey: "test", fetchImpl: async () => ({ ok: false, status: 503 }) }), /503/);
});
