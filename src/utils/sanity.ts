import { sanityClient } from 'sanity:client'
import type { PortableTextBlock } from '@portabletext/types'
import type { Post, PostListItem } from '@/types'

type SanityPostListItem = {
  _id: string
  title: string
  slug: string
  publishedAt: string
}

type SanityPost = SanityPostListItem & {
  body?: PortableTextBlock[]
}

const POSTS_LIST_QUERY = /* groq */ `
  *[
    _type == "post" &&
    defined(slug.current) &&
    !(_id in path("drafts.**"))
  ]
  | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    "slug": slug.current,
    "publishedAt": coalesce(publishedAt, _createdAt)
  }
`

const POST_BY_SLUG_QUERY = /* groq */ `
  *[
    _type == "post" &&
    slug.current == $slug &&
    !(_id in path("drafts.**"))
  ][0]{
    _id,
    title,
    "slug": slug.current,
    "publishedAt": coalesce(publishedAt, _createdAt),
    body
  }
`

function toDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.valueOf())) {
    throw new Error(`[Sanity] Invalid date: ${value}`)
  }
  return date
}

export async function getAllPosts(): Promise<PostListItem[]> {
  const results = await sanityClient.fetch<SanityPostListItem[]>(POSTS_LIST_QUERY)
  return results.map((post) => ({
    slug: post.slug,
    title: post.title,
    pubDate: toDate(post.publishedAt)
  }))
}

export async function getAllPostSlugs(): Promise<string[]> {
  const results = await sanityClient.fetch<Array<Pick<SanityPostListItem, 'slug'>>>(POSTS_LIST_QUERY)
  return results.map((post) => post.slug)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const result = await sanityClient.fetch<SanityPost | null>(POST_BY_SLUG_QUERY, { slug })
  if (!result) return null
  return {
    slug: result.slug,
    title: result.title,
    pubDate: toDate(result.publishedAt),
    body: result.body ?? []
  }
}
