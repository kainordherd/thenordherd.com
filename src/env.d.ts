/// <reference types="astro/client" />

import type { NegotiatedContentType } from '@/utils/content-negotiation'

declare global {
  namespace App {
    interface Locals {
      preferredContentType: NegotiatedContentType | null
    }
  }
}

declare module 'astro:content' {
  interface Render {
    '.md': Promise<{
      Content: import('astro').MarkdownInstance<Record<string, unknown>>['Content']
      headings: import('astro').MarkdownHeading[]
      remarkPluginFrontmatter: Record<string, unknown>
    }>
  }
}
