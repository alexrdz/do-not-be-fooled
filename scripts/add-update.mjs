#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const updatesDir = path.join(__dirname, "..", "src", "content", "updates");

const slugify = (t) =>
  t
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("\n=========================================");
  console.log("  DNBF — Add an Update Post");
  console.log("=========================================\n");

  try {
    let title = "";
    while (!title.trim()) title = await rl.question("Title: ");
    title = title.trim();

    const tag = (await rl.question("Tag (e.g. '01 / TECH', '02 / ENERGY', '03 / POLICY', default 'Update'): ")).trim() || "Update";

    let description = "";
    while (!description.trim()) description = await rl.question("Description/Summary: ");
    description = description.trim();

    const author = (await rl.question("Author (default 'DNBF Staff'): ")).trim() || "DNBF Staff";

    const defaultDate = new Date().toISOString().split("T")[0];
    const pubDate = (await rl.question(`Publish date (YYYY-MM-DD, default ${defaultDate}): `)).trim() || defaultDate;

    rl.close();

    const slug = slugify(title);
    const fm = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `description: "${description.replace(/"/g, '\\"')}"`,
      `pubDate: "${pubDate}"`,
      `author: "${author.replace(/"/g, '\\"')}"`,
      `tag: "${tag.replace(/"/g, '\\"')}"`,
      "---",
      "",
      "Write your update content here in Markdown.",
      "",
    ].join("\n");

    await fs.mkdir(updatesDir, { recursive: true });
    const targetFile = path.join(updatesDir, `${slug}.md`);

    try {
      await fs.access(targetFile);
      console.error(`\nError: File ${slug}.md already exists!`);
      process.exit(1);
    } catch {
      // file does not exist, proceed
    }

    await fs.writeFile(targetFile, fm, "utf-8");
    console.log(`\nCreated: src/content/updates/${slug}.md\n`);
  } catch (err) {
    console.error("Failed:", err.message);
    process.exit(1);
  }
}

main();
