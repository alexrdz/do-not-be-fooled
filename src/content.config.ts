import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const crises = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/crises" }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),
    icon: z.enum(["cpu", "waterdrop", "document-text"]),
    order: z.number(),
    summary: z.string(),
    narrative: z.string(),
    reality: z.string(),
  }),
});

const updates = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/updates" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default("DNBF Staff"),
    tag: z.string().default("Update"),
  }),
});

export const collections = { crises, updates };
