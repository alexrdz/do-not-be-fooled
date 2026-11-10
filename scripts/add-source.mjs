#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "..", "src", "data", "sources.yaml");
const TOPICS = ["ai-bubble", "oil-reserves", "big-bill", "blame-shifting"];

const yamlEscape = (s) => s.replace(/"/g, '\\"');

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\n=========================================");
  console.log("  DNBF — Add a Source");
  console.log("=========================================\n");
  try {
    let title = "";
    while (!title.trim()) title = await rl.question("Source title: ");
    title = title.trim();

    let outlet = "";
    while (!outlet.trim()) outlet = await rl.question("Outlet (e.g. Bloomberg, KFF, PolitiFact): ");
    outlet = outlet.trim();

    let url = "";
    while (!url.trim()) url = await rl.question("URL: ");
    url = url.trim();

    console.log("\nTopics:");
    TOPICS.forEach((t, n) => console.log(`  [${n + 1}] ${t}`));
    const tChoice = (await rl.question(`Topic [1-${TOPICS.length}] (default 1): `)) || "1";
    const topic = TOPICS[parseInt(tChoice, 10) - 1] || TOPICS[0];

    rl.close();

    const entry = [
      `- title: "${yamlEscape(title)}"`,
      `  outlet: "${yamlEscape(outlet)}"`,
      `  url: "${yamlEscape(url)}"`,
      `  topic: "${topic}"`,
      "",
    ].join("\n");

    await fs.appendFile(dataFile, entry, "utf-8");
    console.log(`\nDone. Appended to src/data/sources.yaml under '${topic}'.`);
    console.log("It appears on /sources and the matching crisis page automatically.\n");
  } catch (err) {
    console.error("Error:", err);
    rl.close();
  }
}
main();
