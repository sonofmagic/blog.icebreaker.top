import { icebreaker } from '@icebreakers/eslint-config'

export default icebreaker(
  {
    vue: {
      vueVersion: 2,
      sfcBlocks: {
        blocks: {
          styles: false,
        },
      },
    },
    tailwindcss: false,
    ignores: ['**/fixtures/**'],
  },
)
