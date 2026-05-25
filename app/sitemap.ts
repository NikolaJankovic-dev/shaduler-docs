import type { MetadataRoute } from 'next'
import { source } from '@/lib/source'

const SITE_URL = 'https://shaduler.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static, hand-curated marketing / app pages. /docs pages are pulled from
  // the fumadocs source below so the sitemap stays in sync as recipes land.
  const staticPaths: Array<{
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/create', changeFrequency: 'weekly', priority: 0.8 },
    // `/docs` is intentionally absent here — source.getPages() below
    // already emits an entry for the docs index.
  ]

  const docsEntries = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPaths.map(({ path, changeFrequency, priority }) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...docsEntries,
  ]
}
