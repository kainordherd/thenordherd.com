import { defineMiddleware } from 'astro:middleware'
import { appendVaryAccept, preferredContentType } from '@/utils/content-negotiation'

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.isPrerendered) {
    context.locals.preferredContentType = 'text/html'
    return next()
  }

  context.locals.preferredContentType = preferredContentType(context.request.headers.get('Accept'))

  const response = await next()
  appendVaryAccept(response.headers)

  return response
})
