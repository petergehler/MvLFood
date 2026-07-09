import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...value] = arg.replace(/^--/, "").split("=");
    return [key, value.join("=") || "1"];
  }),
);

if (args.help || (!args.email && !args.payload)) {
  console.error(
    [
      "Usage:",
      "  node scripts/parse-food-email-llm.mjs --email=/path/to/email.txt --source=spicetripping [--write]",
      "  node scripts/parse-food-email-llm.mjs --payload=/path/to/github-event.json [--write]",
      "",
      "Environment:",
      "  OPENROUTER_API_KEY   required",
      "  OPENROUTER_MODEL     optional, defaults to openai/gpt-4o-mini",
    ].join("\n"),
  );
  process.exit(args.help ? 0 : 1);
}

const input = args.payload ? await inputFromDispatchPayload(args.payload) : await inputFromEmailFile(args.email);
const parsed = normalizeEvent(await parseWithOpenRouter(input), input);

if (args.write) {
  const outDir = args.outDir || "data/email-events";
  await mkdir(outDir, { recursive: true });
  const outPath = join(outDir, `${safeSlug(parsed.source)}-${parsed.service.date || "undated"}-${parsed.email.messageIdHash}.json`);
  if (await fileExists(outPath)) {
    console.log(`${outPath} already exists`);
    process.exit(0);
  }

  await writeFile(outPath, `${JSON.stringify(parsed, null, 2)}\n`);
  console.log(outPath);
} else {
  console.log(JSON.stringify(parsed, null, 2));
}

async function fileExists(path) {
  try {
    await readFile(path, "utf8");
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function inputFromEmailFile(path) {
  const body = await readFile(path, "utf8");
  return {
    sourceHint: args.source || "",
    messageId: args.messageId || basename(path),
    subject: args.subject || "",
    from: args.from || "",
    receivedAt: args.receivedAt || new Date().toISOString(),
    body,
  };
}

async function inputFromDispatchPayload(path) {
  const event = JSON.parse(await readFile(path, "utf8"));
  const payload = event.client_payload || event.inputs || event;

  return {
    sourceHint: payload.sourceHint || payload.source || args.source || "",
    messageId: payload.messageId || payload.id || "",
    subject: payload.subject || "",
    from: payload.from || "",
    receivedAt: payload.receivedAt || payload.received_at || "",
    body: payload.body || payload.emailBody || payload.email_body || payload.text || "",
  };
}

async function parseWithOpenRouter(input) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://petergehler.github.io/MvLFood/",
      "X-OpenRouter-Title": "MvLFood email parser",
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You parse campus lunch vendor emails into strict JSON. Extract only information present in the email. Do not invent dishes, dates, prices, locations, allergens, or dietary labels. Use unknown when unsure.",
        },
        {
          role: "user",
          content: [
            `Source hint: ${input.sourceHint || "unknown"}`,
            `Message ID: ${input.messageId || ""}`,
            `From: ${input.from || ""}`,
            `Subject: ${input.subject || ""}`,
            `Received at: ${input.receivedAt || ""}`,
            "",
            "Email body:",
            input.body,
          ].join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "food_email_event",
          strict: true,
          schema: eventSchema(),
        },
      },
    }),
  });

  const body = await response.text();
  if (!response.ok) throw new Error(`OpenRouter request failed: ${response.status} ${body}`);

  const json = JSON.parse(body);
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("OpenRouter response did not contain message content");

  return JSON.parse(content);
}

function normalizeEvent(event, input) {
  const source = cleanId(event.source || input.sourceHint || "unknown");
  const service = {
    date: cleanString(event.service?.date),
    start: cleanString(event.service?.start),
    end: cleanString(event.service?.end),
    location: cleanString(event.service?.location),
  };
  const messageIdHash = hash(input.messageId || `${input.subject}\n${input.receivedAt}\n${input.body}`);

  return {
    id: `${source}-${service.date || "undated"}-${messageIdHash}`,
    source,
    email: {
      messageId: cleanString(input.messageId),
      messageIdHash,
      subject: cleanString(input.subject),
      from: cleanString(input.from),
      receivedAt: cleanString(input.receivedAt),
    },
    service,
    items: (event.items || []).map((item) => ({
      source,
      category: cleanString(item.category) || "Food truck",
      diet: validDiet(item.diet),
      title: cleanString(item.title),
      description: cleanString(item.description),
      price: cleanString(item.price),
      allergens: Array.isArray(item.allergens) ? item.allergens.map(cleanString).filter(Boolean) : [],
    })),
    confidence: typeof event.confidence === "number" ? Math.max(0, Math.min(1, event.confidence)) : 0,
    needsReview: Boolean(event.needsReview || !service.date || !service.start || !service.end || !service.location || !event.items?.length),
    notes: cleanString(event.notes),
  };
}

function eventSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["source", "service", "items", "confidence", "needsReview", "notes"],
    properties: {
      source: {
        type: "string",
        description: "Stable source id such as spicetripping, yellow-donkey, or unknown.",
      },
      service: {
        type: "object",
        additionalProperties: false,
        required: ["date", "start", "end", "location"],
        properties: {
          date: { type: "string", description: "YYYY-MM-DD, empty string if missing." },
          start: { type: "string", description: "HH:MM 24-hour time, empty string if missing." },
          end: { type: "string", description: "HH:MM 24-hour time, empty string if missing." },
          location: { type: "string" },
        },
      },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["category", "diet", "title", "description", "price", "allergens"],
          properties: {
            category: { type: "string" },
            diet: { type: "string", enum: ["vegan", "vegetarian", "meat", "fish", "unknown"] },
            title: { type: "string" },
            description: { type: "string" },
            price: { type: "string" },
            allergens: { type: "array", items: { type: "string" } },
          },
        },
      },
      confidence: { type: "number", minimum: 0, maximum: 1 },
      needsReview: { type: "boolean" },
      notes: { type: "string" },
    },
  };
}

function validDiet(value) {
  return ["vegan", "vegetarian", "meat", "fish", "unknown"].includes(value) ? value : "unknown";
}

function cleanString(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function cleanId(value) {
  return safeSlug(value || "unknown") || "unknown";
}

function safeSlug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}
