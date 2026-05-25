import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // The themed registry route is dynamic per `?preset=` query param,
        // so there's nothing useful for crawlers to index there.
        disallow: ['/r/themed.json'],
      },
    ],
    sitemap: 'https://shaduler.com/sitemap.xml',
    host: 'https://shaduler.com',
  }
}
