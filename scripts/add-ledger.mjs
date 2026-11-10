#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "..", "src", "data", "blame-ledger.yaml");

const yamlEscape = (s) => s.replace(/"/g, '\\"');

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\n=========================================");
  console.log("  DNBF — Add a Blame-Ledger Row");
  console.log("=========================================\n");
  try {
    let claim = "";
    while (!claim.trim()) claim = await rl.question("The claim (as media frames it): ");
    claim = claim.trim();

    let verdict = "";
    while (!verdict.trim()) verdict = await rl.question("Verdict (e.g. False, Mostly False, No Evidence): ");
    verdict = verdict.trim();

    let sourceTitle = "";
    while (!sourceTitle.trim()) sourceTitle = await rl.question("Source title (e.g. PolitiFact): ");
    sourceTitle = sourceTitle.trim();

    let sourceUrl = "";
    while (!sourceUrl.trim()) sourceUrl = await rl.question("Source URL: ");
    sourceUrl = sourceUrl.trim();

    rl.close();

    const entry = [
      `- claim: "${yamlEscape(claim)}"`,
      `  verdict: "${yamlEscape(verdict)}"`,
      `  source_title: "${yamlEscape(sourceTitle)}"`,
      `  source_url: "${yamlEscape(sourceUrl)}"`,
      "",
    ].join("\n");

    await fs.appendFile(dataFile, entry, "utf-8");
    console.log("\nDone. Row appended to src/data/blame-ledger.yaml — shows up in 'Who Gets the Blame'.\n");
  } catch (err) {
    console.error("Error:", err);
    rl.close();
  }
}
main();
