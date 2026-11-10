#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(__dirname, "..", "src", "content", "crises");
const ICONS = ["cpu", "waterdrop", "document-text"];

const slugify = (t) =>
  t.toString().toLowerCase().trim().replace(/[\s\W-]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\n=========================================");
  console.log("  DNBF — Add a Crisis Page");
  console.log("=========================================\n");
  try {
    let title = "";
    while (!title.trim()) title = await rl.question("Title: ");
    title = title.trim();

    const tag = (await rl.question("Tag (e.g. '04 / CLIMATE', optional): ")).trim();

    console.log("\nIcon options:");
    ICONS.forEach((i, n) => console.log(`  [${n + 1}] ${i}`));
    const iconChoice = (await rl.question(`Icon [1-${ICONS.length}] (default 1): `)) || "1";
    const icon = ICONS[parseInt(iconChoice, 10) - 1] || ICONS[0];

    const orderStr = await rl.question("Order (default 99): ");
    const order = parseInt(orderStr, 10) || 99;

    let summary = "";
    while (!summary.trim()) summary = await rl.question("Summary (one paragraph): ");
    const narrative = (await rl.question("Media narrative (the false claim): ")).trim();
    const reality = (await rl.question("Reality (the documented cause): ")).trim();

    rl.close();

    const slug = slugify(title);
    const fm = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `tag: "${(tag || `0${order} / NEW`).replace(/"/g, '\\"')}"`,
      `icon: "${icon}"`,
      `order: ${order}`,
      `summary: "${summary.trim().replace(/"/g, '\\"')}"`,
      `narrative: '"${narrative.replace(/"/g, "")}"'`,
      `reality: "${reality.replace(/"/g, '\\"')}"`,
      "---",
      "",
      "## What's Happening?",
      "",
      "- ",
      "",
      "### Key Facts",
      "",
      "| Fact | Source |",
      "|------|--------|",
      "|  | [Outlet](url) |",
      "",
      "### Why Is This Trump's Fault?",
      "",
      "",
      "### What Happens Next?",
      "",
    ].join("\n");

    await fs.mkdir(contentDir, { recursive: true });
    const file = path.join(contentDir, `${slug}.md`);
    await fs.writeFile(file, fm, "utf-8");
    console.log(`\nDone. Created src/content/crises/${slug}.md`);
    console.log(`Preview: pnpm dev -> /crises/${slug}\n`);
  } catch (err) {
    console.error("Error:", err);
    rl.close();
  }
}
main();
