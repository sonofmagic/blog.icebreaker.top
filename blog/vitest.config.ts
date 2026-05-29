import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    'import.meta.client': 'true',
  },
  test: {
    name: 'blog',
    environment: 'node',
    passWithNoTests: true,
    include: [
      'app/**/*.{test,spec}.ts',
      'scripts/**/*.{test,spec}.ts',
    ],
    coverage: {
      enabled: true,
      skipFull: true,
      exclude: [
        '.nuxt/**',
        '.output/**',
        'node_modules/**',
      ],
    },
  },
})
