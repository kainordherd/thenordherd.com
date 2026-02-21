import type { APIContext } from 'astro'
import { Feed } from 'feed'
import { sanityClient } from 'sanity:client'
import { themeConfig } from '@/config'

type SanityFeedPost = {
  title: string
  slug: string
  publishedAt: string
  content?: string
}

const FEED_POSTS_QUERY = /* groq */ `
  *[
    _type == "post" &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ]
  | order(coalesce(publishedAt, _createdAt) desc) {
    title,
    "slug": slug.current,
    "publishedAt": coalesce(publishedAt, _createdAt),
    "content": pt::text(body)
  }
`

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Generate a generic Feed instance
 */
async function generateFeedInstance(context: APIContext) {
  const siteUrl = (context.site?.toString() || themeConfig.site.website).replace(/\/$/, '')
  const { title = '', description = '', author = '', language = 'en-US' } = themeConfig.site

  const feed = new Feed({
    title: title,
    description: description,
    id: siteUrl,
    link: siteUrl,
    language: language,
    copyright: `Copyright © ${new Date().getFullYear()} ${author}`,
    updated: new Date(),
    generator: 'Astro Chiri Feed Generator',
    feedLinks: {
      rss: `${siteUrl}/rss.xml`,
      atom: `${siteUrl}/atom.xml`
    },
    author: {
      name: author,
      link: siteUrl
    }
  })

  const posts = await sanityClient.fetch<SanityFeedPost[]>(FEED_POSTS_QUERY)

  for (const post of posts) {
    const postUrl = new URL(`${post.slug}/`, siteUrl).toString()
    const publishedAt = new Date(post.publishedAt)
    const text = (post.content ?? '').replace(/\s+/g, ' ').trim()
    const descriptionText = text.length > 200 ? `${text.slice(0, 200)}...` : text
    const htmlContent = text ? `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>` : ''

    feed.addItem({
      title: post.title,
      id: postUrl,
      link: postUrl,
      description: descriptionText,
      content: htmlContent,
      date: publishedAt,
      published: publishedAt
    })
  }

  return feed
}

/**
 * Generate RSS 2.0 feed
 */
export async function generateRSS(context: APIContext) {
  const feed = await generateFeedInstance(context)
  const rssXml = feed
    .rss2()
    .replace(
      '<?xml version="1.0" encoding="utf-8"?>',
      '<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet type="text/xsl" href="/feeds/rss-style.xsl"?>'
    )
  return new Response(rssXml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  })
}

/**
 * Generate Atom 1.0 feed
 */
export async function generateAtom(context: APIContext) {
  const feed = await generateFeedInstance(context)
  const atomXml = feed
    .atom1()
    .replace(
      '<?xml version="1.0" encoding="utf-8"?>',
      '<?xml version="1.0" encoding="utf-8"?>\n<?xml-stylesheet type="text/xsl" href="/feeds/atom-style.xsl"?>'
    )
  return new Response(atomXml, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' }
  })
}
