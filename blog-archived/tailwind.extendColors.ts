import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function withOpacityValue(variable: string) {
  return ({ opacityValue }: { opacityValue?: string }) => {
    if (opacityValue === undefined) {
      return `rgb(var(${variable}))`
    }

    return `rgb(var(${variable}) / ${opacityValue})`
  }
}

export function createExtendedColors() {
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const cssPath = path.resolve(currentDir, 'client/assets/css/tokens.css')
  const content = fs.readFileSync(cssPath, 'utf8')
  const colorMap: Record<string, ReturnType<typeof withOpacityValue>> = {}
  const regex = /--color-([a-z0-9-]+):/gi
  let match: RegExpExecArray | null

  while ((match = regex.exec(content)) !== null) {
    const key = match[1]
    const variable = `--color-${key}`
    if (!colorMap[key]) {
      colorMap[key] = withOpacityValue(variable)
    }
  }

  return colorMap
}
