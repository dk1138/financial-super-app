import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/lib/toolsData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.planfolio.ca';
  const currentDate = new Date().toISOString().split('T')[0];

  // Core Marketing & App Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/databank`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/planner`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Dynamic Standalone Financial Calculators
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes];
}