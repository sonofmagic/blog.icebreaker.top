export interface TocLink {
  id: string
  depth: number
  text: string
  children?: TocLink[]
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function getChildren(value: unknown): unknown[] {
  const record = asRecord(value)
  if (Array.isArray(record?.value)) {
    return record.value
  }
  return Array.isArray(record?.children) ? record.children : []
}

function getElement(node: unknown) {
  if (Array.isArray(node) && typeof node[0] === 'string') {
    return { tag: node[0], props: asRecord(node[1]), children: node.slice(2) }
  }
  const record = asRecord(node)
  return { tag: record?.tag, props: asRecord(record?.props), children: getChildren(node) }
}

function gatherNodeText(node: unknown): string {
  if (typeof node === 'string') {
    return node
  }
  const record = asRecord(node)
  if (typeof record?.value === 'string') {
    return record.value
  }
  return getElement(node).children.map(gatherNodeText).join('')
}

export function extractFirstParagraphText(body: unknown): string | undefined {
  for (const node of getChildren(body)) {
    if (getElement(node).tag !== 'p') {
      continue
    }
    const text = gatherNodeText(node).replace(/\s+/g, ' ').trim()
    if (text) {
      return text
    }
  }
  return undefined
}

export function buildTocLinksFromBody(body: unknown): TocLink[] {
  const links: TocLink[] = []
  const stack: TocLink[] = []

  for (const node of getChildren(body)) {
    const element = getElement(node)
    if (typeof element.tag !== 'string' || !/^h[2-6]$/.test(element.tag)) {
      continue
    }
    const id = element.props?.id
    const text = gatherNodeText(node).trim()
    if (typeof id !== 'string' || !id || !text) {
      continue
    }

    const link: TocLink = { id, depth: Number(element.tag.slice(1)), text }
    while (stack.length && stack[stack.length - 1]!.depth >= link.depth) {
      stack.pop()
    }
    const parent = stack[stack.length - 1]
    if (parent) {
      (parent.children ??= []).push(link)
    }
    else {
      links.push(link)
    }
    stack.push(link)
  }
  return links
}
