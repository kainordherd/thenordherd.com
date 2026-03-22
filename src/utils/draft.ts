import { getCollection, type CollectionEntry } from 'astro:content'
import type { PostListItem } from '@/types'

export function isPublishedPost(post: CollectionEntry<'posts'>) {
  return !post.id.startsWith('_')
}

export function comparePostsByDateDesc(a: CollectionEntry<'posts'>, b: CollectionEntry<'posts'>) {
  return b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
}

export function toPostListItem(post: CollectionEntry<'posts'>): PostListItem {
  return {
    slug: post.id,
    title: post.data.title,
    pubDate: post.data.pubDate
  }
}

export function getPostUrl(post: CollectionEntry<'posts'>) {
  return `/${post.id}/`
}

export function getPostExcerpt(post: CollectionEntry<'posts'>, maxLength = 200) {
  const text = post.body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*>+\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength).trim()}...`
}

/**
 * Get all posts, filtering out posts whose filenames start with _
 */
export async function getFilteredPosts() {
  const posts = await getCollection('posts')
  return posts.filter(isPublishedPost)
}

/**
 * Get all posts sorted by publication date, filtering out posts whose filenames start with _
 */
export async function getSortedFilteredPosts() {
  const posts = await getFilteredPosts()
  return posts.sort(comparePostsByDateDesc)
}

/**
 * Get all posts in the shape required by the index post list
 */
export async function getPostListItems() {
  const posts = await getSortedFilteredPosts()
  return posts.map(toPostListItem)
}
