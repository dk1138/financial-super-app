import { MetadataRoute } from 'next';
import { TOOLS_DATA } from '@/lib/toolsData';
import { PROVINCIAL_TAX_PAGES } from '@/lib/provincialSeoData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.planfolio.ca';
  const currentDate = new Date().toISOString().split('T')[0];

  // Core Marketing, App & YMYL Trust Routes
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
    {
      url: `${baseUrl}/methodology`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // 29 Standalone Canadian Financial Calculators
  const toolRoutes: MetadataRoute.Sitemap = TOOLS_DATA.map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.85,
  }));

  // 13 Programmatic Provincial & Territorial 2026 Tax Calculators
  const provincialRoutes: MetadataRoute.Sitemap = PROVINCIAL_TAX_PAGES.map((prov) => ({
    url: `${baseUrl}/tools/tax-calculator/${prov.slug}`,
    lastModified: currentDate,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...toolRoutes, ...provincialRoutes];
}