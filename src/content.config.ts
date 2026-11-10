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

export const collections = { crises };
