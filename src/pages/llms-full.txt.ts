import type { APIContext } from 'astro'
import { generateLlmsFullTxt } from '@/utils/llms'

export const prerender = true

export const GET = (context: APIContext) => generateLlmsFullTxt(context)
