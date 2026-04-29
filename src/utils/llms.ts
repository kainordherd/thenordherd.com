import type { APIContext } from 'astro'
import { getEntry } from 'astro:content'
import { themeConfig } from '@/config'
import { getPostExcerpt, getPostUrl, getSortedFilteredPosts, getTextExcerpt } from '@/utils/draft'
import { getPublishedPages } from '@/utils/pages'

const TEXT_HEADERS = { 'Content-Type': 'text/plain; charset=utf-8' }

function getSiteUrl(context: APIContext) {
  return (context.site?.toString() || themeConfig.site.website).replace(/\/$/, '')
}

function toAbsoluteUrl(path: string, siteUrl: string) {
  return new URL(path, `${siteUrl}/`).toString()
}

function oneLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function escapeMarkdownLinkText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\[/g, '\\[').replace(/\]/g, '\\]')
}

function listItem(title: string, url: string, description?: string) {
  const note = description ? `: ${oneLine(description)}` : ''
  return `- [${escapeMarkdownLinkText(title)}](${url})${note}`
}

function textResponse(content: string) {
  return new Response(`${content.trim()}\n`, { headers: TEXT_HEADERS })
}

function documentBody(markdown: string) {
  return markdown.replace(/<!--[\s\S]*?-->/g, '').trim()
}

function demoteHeadings(markdown: string) {
  const lines = markdown.split('\n')
  let fence: string | undefined

  return lines
    .map((line) => {
      const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/)

      if (fenceMatch) {
        const marker = fenceMatch[1][0]

        if (fence === marker) {
          fence = undefined
        } else if (!fence) {
          fence = marker
        }

        return line
      }

      if (fence) {
        return line
      }

      return line.replace(/^(#{1,5})(\s+)/, '#$1$2')
    })
    .join('\n')
}

export async function generateLlmsTxt(context: APIContext) {
  const siteUrl = getSiteUrl(context)
  const posts = await getSortedFilteredPosts()
  const pages = await getPublishedPages()

  const postItems = posts.map((post) => {
    const description = post.data.description || getPostExcerpt(post, 180)
    const date = post.data.pubDate.toISOString().slice(0, 10)
    const note = description ? `${date}. ${description}` : date

    return listItem(post.data.title, toAbsoluteUrl(getPostUrl(post), siteUrl), note)
  })

  const pageItems = pages.map((page) => {
    const description = page.data.description || getTextExcerpt(page.body ?? '', 180)

    return listItem(page.data.title, toAbsoluteUrl(`/${page.id}/`, siteUrl), description)
  })

  const lines = [
    `# ${themeConfig.site.title}`,
    '',
    `> ${themeConfig.site.description}. Personal writing by ${themeConfig.site.author}.`,
    '',
    `${themeConfig.site.title} is the personal website of ${themeConfig.site.author}. It publishes essays and notes about software, AI, product development, and responsible use of technology.`,
    '',
    'Use the linked pages for canonical public URLs. Use the optional full text file when a single Markdown document is more useful than following individual links.',
    '',
    '## Site',
    '',
    listItem('Home', toAbsoluteUrl('/', siteUrl), 'Profile summary and recent writing.'),
    listItem('RSS feed', toAbsoluteUrl('/rss.xml', siteUrl), 'RSS feed for published posts.'),
    listItem('Atom feed', toAbsoluteUrl('/atom.xml', siteUrl), 'Atom feed for published posts.'),
    '',
    '## Posts',
    '',
    ...postItems,
    '',
    '## Pages',
    '',
    ...pageItems,
    '',
    '## Optional',
    '',
    listItem(
      'Full text Markdown corpus',
      toAbsoluteUrl('/llms-full.txt', siteUrl),
      'Expanded LLM-readable text containing the public homepage, pages, and posts.'
    )
  ]

  return textResponse(lines.join('\n'))
}

export async function generateLlmsFullTxt(context: APIContext) {
  const siteUrl = getSiteUrl(context)
  const [about, pages, posts] = await Promise.all([
    getEntry('about', 'about'),
    getPublishedPages(),
    getSortedFilteredPosts()
  ])
  const sections = [
    `# ${themeConfig.site.title} Full Text`,
    '',
    `> Expanded Markdown corpus for ${themeConfig.site.title}, the personal website of ${themeConfig.site.author}.`,
    '',
    `Source: ${toAbsoluteUrl('/', siteUrl)}`,
    `Index: ${toAbsoluteUrl('/llms.txt', siteUrl)}`,
    ''
  ]

  if (about) {
    const body = documentBody(about.body ?? '')

    if (body) {
      sections.push('## Home', '', `URL: ${toAbsoluteUrl('/', siteUrl)}`, '', demoteHeadings(body), '')
    }
  }

  for (const page of pages) {
    const body = documentBody(page.body ?? '')

    sections.push(`## ${page.data.title}`, '', `URL: ${toAbsoluteUrl(`/${page.id}/`, siteUrl)}`)

    if (page.data.description) {
      sections.push(`Description: ${oneLine(page.data.description)}`)
    }

    if (body) {
      sections.push('', demoteHeadings(body))
    }

    sections.push('')
  }

  for (const post of posts) {
    const body = documentBody(post.body ?? '')

    sections.push(
      `## ${post.data.title}`,
      '',
      `URL: ${toAbsoluteUrl(getPostUrl(post), siteUrl)}`,
      `Published: ${post.data.pubDate.toISOString().slice(0, 10)}`
    )

    if (post.data.description) {
      sections.push(`Description: ${oneLine(post.data.description)}`)
    }

    if (body) {
      sections.push('', demoteHeadings(body))
    }

    sections.push('')
  }

  return textResponse(sections.join('\n'))
}
