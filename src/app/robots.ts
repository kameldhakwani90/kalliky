import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/app/dashboard/', '/admin/dashboard/'],
    },
    sitemap: 'https://orderspot.pro/sitemap.xml',
  }
}