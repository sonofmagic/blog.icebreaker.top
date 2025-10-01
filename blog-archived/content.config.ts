import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const articles = defineCollection({
  type: 'page',
  source: 'articles/**/*',
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    date: z.string().optional(),
    tags: z.array(z.string()).optional(),
    draft: z.boolean().optional(),
    authors: z.array(z.string()).optional(),
    navigation: z.union([
      z.boolean(),
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        icon: z.string().optional(),
      }),
    ]).optional(),
    readingMinutes: z.number().optional(),
    readingWords: z.number().optional(),
  }).passthrough(),
})

const authors = defineCollection({
  type: 'data',
  source: 'authors/**/*',
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    avatarUrl: z.string().optional(),
  }).passthrough(),
})

export default defineContentConfig({
  collections: {
    articles,
    authors,
  },
})
