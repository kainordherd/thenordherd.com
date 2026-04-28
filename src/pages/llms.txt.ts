import type { APIContext } from 'astro'
import { generateLlmsTxt } from '@/utils/llms'

export const prerender = true

export const GET = (context: APIContext) => generateLlmsTxt(context)
