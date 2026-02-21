import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import playformInline from '@playform/inline'
import sanity from '@sanity/astro'
import remarkMath from 'remark-math'
import remarkDirective from 'remark-directive'
import rehypeKatex from 'rehype-katex'
import remarkEmbeddedMedia from './src/plugins/remark-embedded-media.mjs'
import remarkReadingTime from './src/plugins/remark-reading-time.mjs'
import rehypeCleanup from './src/plugins/rehype-cleanup.mjs'
import rehypeImageProcessor from './src/plugins/rehype-image-processor.mjs'
import rehypeCopyCode from './src/plugins/rehype-copy-code.mjs'
import remarkTOC from './src/plugins/remark-toc.mjs'
import { themeConfig } from './src/config'
import { imageConfig } from './src/utils/image-config'
import path from 'path'
import netlify from '@astrojs/netlify'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`[Sanity] Missing \`${name}\`. Copy \`.env.example\` to \`.env\` and fill it in.`)
  }
  return value
}

const sanityProjectId = requiredEnv('SANITY_PROJECT_ID')
const sanityDataset = requiredEnv('SANITY_DATASET')
const sanityApiVersion = process.env.SANITY_API_VERSION || '2024-01-01'
const sanityUseCdn = process.env.SANITY_USE_CDN === 'true'
const sanityReadToken = process.env.SANITY_API_READ_TOKEN

export default defineConfig({
  // No Visual Editing (SSG pages). If `linkCard` is enabled we still need a server runtime for `/api/proxy`.
  output: themeConfig.post.linkCard ? 'server' : 'static',
  adapter: netlify(), // Set adapter for deployment, or set `linkCard` to `false` in `src/config.ts`
  site: themeConfig.site.website,
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: imageConfig
    }
  },
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: false
    },
    remarkPlugins: [remarkMath, remarkDirective, remarkEmbeddedMedia, remarkReadingTime, remarkTOC],
    rehypePlugins: [rehypeKatex, rehypeCleanup, rehypeImageProcessor, rehypeCopyCode]
  },
  integrations: [
    sanity({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      useCdn: sanityUseCdn,
      ...(sanityReadToken ? { token: sanityReadToken } : {})
    }),
    playformInline({
      Exclude: [(file) => file.toLowerCase().includes('katex')]
    }),
    mdx(),
    sitemap()
  ],
  vite: {
    resolve: {
      alias: {
        '@': path.resolve('./src')
      }
    }
  },
  devToolbar: {
    enabled: false
  }
})
