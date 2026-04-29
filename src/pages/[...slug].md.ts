import type { APIContext } from 'astro'
import { getPublishedContentSlugs, markdownResponse, resolveContentRoute } from '@/utils/markdown-content'

export const prerender = true

export async function getStaticPaths() {
  const slugs = await getPublishedContentSlugs()

  return slugs.map((slug) => ({ params: { slug } }))
}

export async function GET({ params }: APIContext) {
  const resolvedRoute = await resolveContentRoute(params.slug)

  if (!resolvedRoute) {
    return new Response('Not Found\n', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    })
  }

  return markdownResponse(resolvedRoute)
}
