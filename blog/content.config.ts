import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const articles = defineCollection({
  type: 'page',
  source: [
    {
      include: 'articles/**/*.md',
      exclude: ['articles/**/.*.md'],
    },
  ],
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    authors: z.array(z.string()).optional(),
    readingMinutes: z.number().optional(),
    readingWords: z.number().optional(),
  }).passthrough(),
})

export default defineContentConfig({
  collections: {
    articles,
  },
})
