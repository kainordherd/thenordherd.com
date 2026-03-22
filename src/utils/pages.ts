import { getCollection, type CollectionEntry } from 'astro:content'

export function isPublishedPage(page: CollectionEntry<'pages'>) {
  return !page.id.startsWith('_')
}

export async function getPublishedPages() {
  const pages = await getCollection('pages')

  return pages.filter(isPublishedPage).sort((a, b) => a.id.localeCompare(b.id))
}
