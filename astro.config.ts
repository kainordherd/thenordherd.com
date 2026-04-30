import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import playformInline from '@playform/inline'
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
import fs from 'fs'
import path from 'path'
import netlify from '@astrojs/netlify'

function getMarkdownContentSitemapPages() {
  const siteUrl = new URL(themeConfig.site.website)
  const contentDirs = ['src/content/posts', 'src/content/pages']
  const pages = new Set<string>()

  function walk(dir: string, baseDir: string) {
    if (!fs.existsSync(dir)) {
      return
    }

    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const entryPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(entryPath, baseDir)
        continue
      }

      if (!entry.isFile() || !/\.(md|mdx)$/.test(entry.name)) {
        continue
      }

      const relativePath = path.relative(baseDir, entryPath)
      const slug = relativePath
        .replace(/\.(md|mdx)$/, '')
        .split(path.sep)
        .join('/')

      if (!slug.startsWith('_')) {
        pages.add(new URL(`/${slug}`, siteUrl).toString())
      }
    }
  }

  for (const contentDir of contentDirs) {
    walk(contentDir, contentDir)
  }

  return Array.from(pages)
}

export default defineConfig({
  // Server output is still required for `/api/proxy`; content routes are prerendered for static hosts.
  output: 'server',
  adapter: netlify(),
  site: themeConfig.site.website,
  trailingSlash: 'never',
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
    playformInline({
      Exclude: [(file) => file.toLowerCase().includes('katex')]
    }),
    mdx(),
    sitemap({
      customPages: getMarkdownContentSitemapPages()
    })
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
