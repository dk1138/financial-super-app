import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/expenses'],
      },
    ],
    sitemap: 'https://www.planfolio.ca/sitemap.xml',
  };
}