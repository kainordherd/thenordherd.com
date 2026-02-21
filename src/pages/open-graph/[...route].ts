import { OGImageRoute } from 'astro-og-canvas'
import { sanityClient } from 'sanity:client'
import { themeConfig } from '../../config'

export const prerender = true

type OGPage = {
  title: string
}

type SanityOGPost = {
  slug: string
  title: string
}

const OG_POSTS_QUERY = /* groq */ `
  *[
    _type == "post" &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ]{
    title,
    "slug": slug.current
  }
`

const posts = await sanityClient.fetch<SanityOGPost[]>(OG_POSTS_QUERY)

// Map the posts array to the `pages` shape required by `astro-og-canvas`.
const pages = Object.fromEntries(posts.map((post) => [post.slug, { title: post.title } satisfies OGPage]))

export const { getStaticPaths, GET } = await OGImageRoute({
  param: 'route',
  pages,
  getImageOptions: (_path: string, page: OGPage) => ({
    title: page.title,
    description: themeConfig.site.title,
    logo: {
      path: 'public/og/og-logo.png',
      size: [80, 80]
    },
    bgGradient: [[255, 255, 255]],
    bgImage: {
      path: 'public/og/og-bg.png',
      fit: 'fill'
    },
    padding: 64,
    font: {
      title: {
        color: [28, 28, 28],
        size: 68,
        weight: 'SemiBold',
        families: ['PingFang SC']
      },
      description: {
        color: [180, 180, 180],
        size: 40,
        weight: 'Medium',
        families: ['PingFang SC']
      }
    },
    fonts: [
      'https://cdn.jsdelivr.net/npm/font-pingfang-sc-font-weight-improved@latest/PingFangSC-Medium.woff2',
      'https://cdn.jsdelivr.net/npm/font-pingfang-sc-font-weight-improved@latest/PingFangSC-Semibold.woff2'
    ]
  })
})
