import { getCollection, type CollectionEntry } from 'astro:content'
import { themeConfig } from '@/config'
import { appendVaryAccept, type NegotiatedContentType } from '@/utils/content-negotiation'
import { getTextExcerpt, isPublishedPost } from '@/utils/draft'
import { isPublishedPage } from '@/utils/pages'

type MarkdownExtension = '.md' | '.mdx'

export type RoutedContentEntry =
  | { kind: 'post'; entry: CollectionEntry<'posts'> }
  | { kind: 'page'; entry: CollectionEntry<'pages'> }

export type ResolvedContentRoute = {
  route: RoutedContentEntry
  canonicalPath: string
  markdownPath: string
  markdownExtension: MarkdownExtension | null
}

const MARKDOWN_EXTENSIONS: MarkdownExtension[] = ['.mdx', '.md']

function stripMarkdownExtension(slug: string) {
  for (const extension of MARKDOWN_EXTENSIONS) {
    if (slug.toLowerCase().endsWith(extension)) {
      return {
        slug: slug.slice(0, -extension.length),
        markdownExtension: extension
      }
    }
  }

  return { slug, markdownExtension: null }
}

function normalizeSlug(rawSlug: string | undefined) {
  if (!rawSlug) {
    return { slug: '', markdownExtension: null }
  }

  return stripMarkdownExtension(rawSlug.replace(/^\/+|\/+$/g, ''))
}

function canonicalPathForSlug(slug: string) {
  return `/${slug}/`
}

function markdownPathForSlug(slug: string) {
  return `/${slug}.md`
}

function documentBody(markdown: string) {
  return markdown.replace(/<!--[\s\S]*?-->/g, '').trim()
}

function oneLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

export async function resolveContentRoute(rawSlug: string | undefined): Promise<ResolvedContentRoute | null> {
  const { slug, markdownExtension } = normalizeSlug(rawSlug)

  if (!slug) {
    return null
  }

  const [posts, pages]: [CollectionEntry<'posts'>[], CollectionEntry<'pages'>[]] = await Promise.all([
    getCollection('posts'),
    getCollection('pages')
  ])
  const publishedPost = posts.find((post) => post.id === slug && isPublishedPost(post)) ?? null
  const publishedPage = pages.find((page) => page.id === slug && isPublishedPage(page)) ?? null

  if (publishedPost && publishedPage) {
    throw new Error(`Duplicate content slug "${slug}" found in posts/pages collections.`)
  }

  const route: RoutedContentEntry | null = publishedPost
    ? { kind: 'post', entry: publishedPost }
    : publishedPage
      ? { kind: 'page', entry: publishedPage }
      : null

  if (!route) {
    return null
  }

  return {
    route,
    canonicalPath: canonicalPathForSlug(slug),
    markdownPath: markdownPathForSlug(slug),
    markdownExtension
  }
}

export async function getPublishedContentSlugs() {
  const [posts, pages]: [CollectionEntry<'posts'>[], CollectionEntry<'pages'>[]] = await Promise.all([
    getCollection('posts'),
    getCollection('pages')
  ])

  return [
    ...posts.filter(isPublishedPost).map((post) => post.id),
    ...pages.filter(isPublishedPage).map((page) => page.id)
  ]
}

export function getContentDescription(route: RoutedContentEntry) {
  return route.entry.data.description || getTextExcerpt(route.entry.body ?? '', 160) || themeConfig.site.description
}

export function shouldServeMarkdown(
  route: ResolvedContentRoute,
  preferredType: NegotiatedContentType | null | undefined
) {
  return route.markdownExtension !== null || preferredType === 'text/markdown'
}

export function buildMarkdownDocument(route: RoutedContentEntry) {
  const lines = [`# ${route.entry.data.title}`]
  const explicitDescription = route.entry.data.description
  const body = documentBody(route.entry.body ?? '')

  if (route.kind === 'post' || explicitDescription) {
    lines.push('')
  }

  if (route.kind === 'post') {
    lines.push(`Published: ${route.entry.data.pubDate.toISOString().slice(0, 10)}`)
  }

  if (explicitDescription) {
    lines.push(`Description: ${oneLine(explicitDescription)}`)
  }

  if (body) {
    lines.push('', body)
  }

  return `${lines.join('\n').trim()}\n`
}

export function markdownResponse(route: ResolvedContentRoute) {
  const headers = new Headers({
    'Content-Type': 'text/markdown; charset=utf-8',
    Link: `<${route.canonicalPath}>; rel="canonical"; type="text/html"`
  })
  appendVaryAccept(headers)

  return new Response(buildMarkdownDocument(route.route), { headers })
}

export function notAcceptableResponse() {
  const headers = new Headers({
    'Content-Type': 'text/plain; charset=utf-8'
  })
  appendVaryAccept(headers)

  return new Response('Not Acceptable\n', { status: 406, headers })
}

export function markdownAlternateLink(route: ResolvedContentRoute) {
  return `<${route.markdownPath}>; rel="alternate"; type="text/markdown"`
}
