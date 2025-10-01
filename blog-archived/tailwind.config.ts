import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import colors from 'tailwindcss/colors'
import typography from '@tailwindcss/typography'
import { addIconSelectors } from '@iconify/tailwind'
import { themeTransitionPlugin } from 'theme-transition/tailwindcss'
import { createExtendedColors } from './tailwind.extendColors'

const extendedColors = createExtendedColors()

export default {
  darkMode: ['selector', '[data-color-mode="dark"]'],
  content: [
    './content/**/*.{md,mdx}',
    './client/app.vue',
    './client/components/**/*.{vue,ts}',
    './client/layouts/**/*.{vue,ts}',
    './client/pages/**/*.{vue,ts}',
    './client/plugins/**/*.{js,ts}',
    './nuxt.config.ts',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E6FAF2',
          200: '#BFF3E0',
          300: '#99EBCD',
          400: '#4DDCA7',
          500: '#00CD81',
          600: '#00B974',
          700: '#007B4D',
          800: '#005C3A',
          900: '#003E27',
        },
        ...extendedColors,
      },
      typography: ({ theme }) => {
        const fontDefaultColor = 'rgb(var(--color-fg-default))'
        const headerBottomBorder = '1px solid rgb(var(--color-border-muted))'
        return {
          DEFAULT: {
            css: {
              a: {
                color: theme('colors.primary.500'),
                textDecoration: 'underline',
              },
              h2: {
                paddingBottom: theme('padding.2'),
                borderBottomWidth: '1px',
                borderBottomColor: theme('colors.gray.200'),
              },
              h3: {
                paddingBottom: theme('padding.2'),
                borderBottomWidth: '1px',
                borderBottomColor: theme('colors.gray.200'),
              },
              blockquote: {
                fontWeight: '400',
                color: theme('colors.gray.600'),
                fontStyle: 'normal',
                quotes: 'none',
                borderLeftWidth: '0.25rem',
                borderLeftColor: theme('colors.gray.300'),
              },
              'blockquote p:first-of-type::before': {
                content: '""',
              },
              'blockquote p:last-of-type::after': {
                content: '""',
              },
              code: {
                fontWeight: '400',
                backgroundColor: theme('colors.gray.100'),
                padding: theme('padding.1'),
                borderWidth: '1px',
                borderColor: theme('colors.gray.200'),
                borderRadius: theme('borderRadius.DEFAULT'),
              },
              'code::before': {
                content: '""',
              },
              'code::after': {
                content: '""',
              },
              'h3 code': {
                fontWeight: '600',
              },
              'pre code': {
                fontFamily: 'DM Mono',
                backgroundColor: 'transparent',
                borderWidth: '0',
                borderRadius: '0',
                padding: '0',
                fontWeight: '400',
                color: 'inherit',
                fontSize: 'inherit',
                lineHeight: 'inherit',
              },
              'a code': {
                color: theme('colors.primary.500'),
              },
            },
          },
          invert: {
            css: {
              color: fontDefaultColor,
              a: {
                color: 'rgb(var(--color-accent-fg))',
                textDecoration: 'none',
              },
              'a:hover': {
                textDecoration: 'underline',
              },
              blockquote: {
                padding: '0 1em',
                color: 'rgb(var(--color-fg-muted))',
                borderLeft: '.25em solid rgb(var(--color-border-default))',
              },
              h1: {
                color: fontDefaultColor,
                borderBottom: headerBottomBorder,
                fontSize: '2em',
                paddingBottom: '0.3em',
              },
              h2: {
                color: fontDefaultColor,
                borderBottom: headerBottomBorder,
              },
              h3: {
                color: fontDefaultColor,
                borderBottom: headerBottomBorder,
              },
              h4: {
                color: fontDefaultColor,
              },
              strong: {
                color: fontDefaultColor,
              },
              code: {
                color: 'rgb(var(--color-fg-default))',
                backgroundColor: 'rgb(var(--color-neutral-muted) / 0.2)',
                borderWidth: '0',
                padding: '.2em .4em',
                margin: '0',
                fontSize: '85%',
                borderRadius: '6px',
                borderColor: 'transparent',
              },
              'a code': {
                color: 'rgb(var(--color-accent-fg))',
                textDecoration: 'none',
              },
              'a code:hover': {
                textDecoration: 'underline',
              },
              'pre > code': {
                backgroundColor: 'transparent',
                padding: '0',
                borderRadius: '0',
                color: 'inherit',
              },
            },
          },
        }
      },
    },
    cursor: {
      ...defaultTheme.cursor,
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
    },
  },
  plugins: [
    typography,
    addIconSelectors(['line-md']),
    themeTransitionPlugin(),
  ],
} satisfies Config
