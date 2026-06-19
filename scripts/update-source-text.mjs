import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = new URL("..", import.meta.url);
const outDir = new URL("data/source-text/", root);

await mkdir(outDir, { recursive: true });

const hungryPdf = await findHungryElkPdf();
const mphPdf = process.env.MPH_CURRENT_PDF_URL || "https://www.mph.tuebingen.mpg.de/52017/KW25.pdf";

const [hungryText, mphText] = await Promise.all([pdfText(hungryPdf), pdfText(mphPdf)]);

await writeFile(new URL("hungry-elk.txt", outDir), hungryText);
await writeFile(new URL("mph.txt", outDir), mphText);
await writeFile(
  new URL("sources.json", outDir),
  JSON.stringify({ updatedAt: new Date().toISOString(), hungryPdf, mphPdf }, null, 2),
);

console.log(`Extracted source text from:\n- ${hungryPdf}\n- ${mphPdf}`);
console.log("Review the text and update data/menu.json.");

async function findHungryElkPdf() {
  const response = await fetch("https://stollsteimer.de/wp-json/wp/v2/pages/2755");
  if (!response.ok) throw new Error(`Hungry Elk REST request failed: ${response.status}`);
  const page = await response.json();
  const content = page.content?.rendered || "";
  const match = content.match(/https:\\\/\\\/stollsteimer\.de\\\/easy-pdf-restaurant-menu\\\/menu-files\\\/menu-thehungryelk\.pdf\?cb=\d+/);
  if (!match) throw new Error("Could not find Hungry Elk PDF URL");
  return match[0].replaceAll("\\/", "/");
}

async function pdfText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`PDF request failed for ${url}: ${response.status}`);

  const filePath = join(tmpdir(), `${crypto.randomUUID()}.pdf`);
  await writeFile(filePath, Buffer.from(await response.arrayBuffer()));

  try {
    const { stdout } = await execFileAsync("pdftotext", ["-layout", filePath, "-"], {
      maxBuffer: 1024 * 1024 * 10,
    });
    return stdout;
  } catch (error) {
    throw new Error(`pdftotext failed. Install poppler-utils/poppler. ${error.message}`);
  }
}
