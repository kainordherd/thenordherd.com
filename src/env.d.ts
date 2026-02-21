/// <reference types="astro/client" />
/// <reference types="astro/content" />
/// <reference types="@sanity/astro/module" />

declare module 'astro:content' {
  interface Render {
    '.md': Promise<{
      Content: import('astro').MarkdownInstance<Record<string, unknown>>['Content']
      headings: import('astro').MarkdownHeading[]
      remarkPluginFrontmatter: Record<string, unknown>
    }>
  }
}
