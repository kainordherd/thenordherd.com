import type { APIContext } from 'astro'
import { Feed } from 'feed'
import { themeConfig } from '@/config'
import { getPostExcerpt, getPostUrl, getSortedFilteredPosts } from '@/utils/draft'

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

  const posts = await getSortedFilteredPosts()

  for (const post of posts) {
    const postUrl = new URL(getPostUrl(post), siteUrl).toString()
    const publishedAt = post.data.pubDate
    const text = getPostExcerpt(post)
    const htmlContent = text ? `<p>${escapeHtml(text).replace(/\n/g, '<br />')}</p>` : ''

    feed.addItem({
      title: post.data.title,
      id: postUrl,
      link: postUrl,
      description: text,
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
