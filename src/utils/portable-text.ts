import type { PortableTextBlock } from '@portabletext/types'
import readingTime from 'reading-time'
import type { ReadingTime, TOCItem } from '@/types'

function isTextBlock(block: PortableTextBlock): block is PortableTextBlock & {
  _type: 'block'
  style?: string
  children?: Array<{ _type?: string; text?: string }>
} {
  return (block as { _type?: string })._type === 'block'
}

function textFromBlock(block: PortableTextBlock): string {
  if (!isTextBlock(block)) return ''
  const children = (block as { children?: Array<{ _type?: string; text?: string }> }).children ?? []
  return children
    .filter((child) => child?._type === 'span')
    .map((child) => child.text ?? '')
    .join('')
}

export function portableTextToPlainText(blocks: PortableTextBlock[]): string {
  return blocks.map(textFromBlock).filter(Boolean).join('\n')
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getReadingTimeFromPortableText(blocks: PortableTextBlock[]): ReadingTime {
  const text = portableTextToPlainText(blocks)
  return readingTime(text) as ReadingTime
}

export function getTOCFromPortableText(blocks: PortableTextBlock[]): TOCItem[] {
  const seen = new Map<string, number>()
  const toc: TOCItem[] = []

  for (const block of blocks) {
    if (!isTextBlock(block)) continue

    const style = (block as { style?: string }).style ?? ''
    if (!/^h[23]$/.test(style)) continue

    const text = textFromBlock(block).trim()
    if (!text) continue

    const level = Number.parseInt(style.slice(1), 10)
    const baseId = slugify(text) || 'section'
    const count = (seen.get(baseId) ?? 0) + 1
    seen.set(baseId, count)
    const id = count === 1 ? baseId : `${baseId}-${count}`

    toc.push({
      level,
      text,
      id,
      index: toc.length
    })
  }

  return toc
}
