#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const assetsDir = path.join(rootDir, "src", "assets", "books");
const contentDir = path.join(rootDir, "src", "content", "books");

const BOOK_GENRES = [
  "Fiction",
  "Nonfiction",
  "Autobiographical",
  "Historical",
  "Political",
  "Poetry",
  "Design & Tech",
  "Other",
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchCoverImage(title, author) {
  try {
    console.log(`\n🔍 Searching Open Library for cover art...`);
    const query = new URLSearchParams({
      title: title,
      author: author,
      limit: "1",
    });
    const res = await fetch(`https://openlibrary.org/search.json?${query}`);
    if (!res.ok) return null;

    const data = await res.json();
    const doc = data.docs?.[0];

    if (doc?.cover_i) {
      const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      console.log(`📥 Downloading cover image from: ${coverUrl}`);
      const imgRes = await fetch(coverUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        return buffer;
      }
    }
  } catch (err) {
    console.warn(`⚠️ Could not auto-fetch cover: ${err.message}`);
  }
  return null;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=========================================");
  console.log("  📚 Astroblog — Log a New Book");
  console.log("=========================================\n");

  try {
    // 1. Title
    let title = "";
    while (!title.trim()) {
      title = await rl.question("Book Title: ");
    }
    title = title.trim();

    // 2. Author
    let author = "";
    while (!author.trim()) {
      author = await rl.question("Author: ");
    }
    author = author.trim();

    // 3. Status
    console.log("\nStatus options: [1] reading, [2] finished, [3] dnf");
    const statusChoice = (await rl.question("Status (default 2/finished): ")) || "2";
    let status = "finished";
    if (statusChoice === "1" || statusChoice.toLowerCase() === "reading") status = "reading";
    else if (statusChoice === "3" || statusChoice.toLowerCase() === "dnf") status = "dnf";

    // 4. Genre
    console.log("\nAllowed Genres:");
    BOOK_GENRES.forEach((g, idx) => console.log(`  [${idx + 1}] ${g}`));
    const genreChoice = (await rl.question(`Select Genre [1-${BOOK_GENRES.length}] (default 1): `)) || "1";
    const genreIndex = parseInt(genreChoice, 10) - 1;
    const genre = BOOK_GENRES[genreIndex] || BOOK_GENRES[0];

    // 5. Rating
    let rating = null;
    if (status !== "reading") {
      const ratingStr = await rl.question("\nRating (0-5, optional): ");
      if (ratingStr.trim()) {
        const parsed = parseFloat(ratingStr);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
          rating = parsed;
        }
      }
    }

    // 6. Dates
    let dateStarted = "";
    let dateCompleted = "";
    const today = getTodayString();

    if (status === "reading") {
      dateStarted = (await rl.question(`Date started (default ${today}): `)) || today;
    } else {
      dateStarted = await rl.question("Date started (YYYY-MM-DD, optional): ");
      dateCompleted = (await rl.question(`Date completed (default ${today}): `)) || today;
    }

    // 7. Tags
    const tagsInput = await rl.question("\nTags (comma-separated, optional): ");
    const tags = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];

    rl.close();

    const slug = slugify(title);
    await fs.mkdir(assetsDir, { recursive: true });
    await fs.mkdir(contentDir, { recursive: true });

    // 8. Fetch and process cover
    let coverRelPath = null;
    const coverBuffer = await fetchCoverImage(title, author);

    if (coverBuffer) {
      const imageFileName = `${slug}.webp`;
      const imageFilePath = path.join(assetsDir, imageFileName);

      await sharp(coverBuffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(imageFilePath);

      console.log(`✅ Saved optimized WebP cover: src/assets/books/${imageFileName}`);
      coverRelPath = `../../assets/books/${imageFileName}`;
    } else {
      console.log(`ℹ️  No cover found or fetched. Will use Bauhaus typographic fallback.`);
    }

    // 9. Generate Frontmatter & File
    const frontmatterLines = [
      "---",
      `title: "${title.replace(/"/g, '\\"')}"`,
      `author: "${author.replace(/"/g, '\\"')}"`,
      `status: "${status}"`,
      `genre: "${genre}"`,
    ];

    if (dateStarted) frontmatterLines.push(`dateStarted: "${dateStarted}"`);
    if (dateCompleted) frontmatterLines.push(`dateCompleted: "${dateCompleted}"`);
    if (rating !== null) frontmatterLines.push(`rating: ${rating}`);
    if (coverRelPath) frontmatterLines.push(`cover: "${coverRelPath}"`);

    if (tags.length > 0) {
      frontmatterLines.push(`tags: [${tags.map((t) => `"${t}"`).join(", ")}]`);
    } else {
      frontmatterLines.push(`tags: []`);
    }

    frontmatterLines.push("---");
    frontmatterLines.push("");
    frontmatterLines.push("## Impressions & Takeaways");
    frontmatterLines.push("");
    frontmatterLines.push("Thoughts are percolating...");
    frontmatterLines.push("");

    const markdownFilePath = path.join(contentDir, `${slug}.md`);
    await fs.writeFile(markdownFilePath, frontmatterLines.join("\n"), "utf-8");

    console.log(`\n🎉 Book logged successfully!`);
    console.log(`📄 Markdown: src/content/books/${slug}.md`);
    console.log(`🚀 View it by running 'pnpm dev' and navigating to /books/${slug}\n`);
  } catch (error) {
    console.error("❌ Error adding book:", error);
    rl.close();
  }
}

main();
