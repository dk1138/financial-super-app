import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Features, 2026 Canadian Tax Engine & 29 Financial Calculators',
  description:
    'Explore every Planfolio feature: 13-jurisdiction 2026 CRA tax engine, RRSP meltdown, OAS clawback shield, yearly P1 & P2 spreadsheet export, Monte Carlo & historical crash tests, Survivor stress testing, Data Bank, and 29 Canadian financial calculators.',
  keywords: [
    'Canadian retirement planner features',
    'CRA 2026 tax engine',
    'RRSP meltdown strategy Canada',
    'OAS clawback shield',
    'Canadian retirement spreadsheet export',
    'Monte Carlo retirement simulator Canada',
    'Survivor widow tax trap Canada',
    'Canadian financial calculators',
  ],
  alternates: {
    canonical: 'https://www.planfolio.ca/features',
  },
  openGraph: {
    title: 'Features, 2026 Canadian Tax Engine & 29 Calculators | Planfolio',
    description:
      'Explore all Canadian retirement planning features: 13-jurisdiction CRA taxes, CPP/OAS optimization, yearly P1 & P2 spreadsheets, Monte Carlo & crash stress tests, and 29 standalone calculators.',
    url: 'https://www.planfolio.ca/features',
    type: 'website',
    locale: 'en_CA',
    alternateLocale: ['fr_CA'],
    siteName: 'Planfolio Canada',
    images: [{ url: '/preview-summary.png', width: 1200, height: 630, alt: 'Planfolio Features & Canadian Financial Calculators Directory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features, 2026 Canadian Tax Engine & 29 Calculators | Planfolio',
    description:
      '13-jurisdiction CRA taxes, RRSP meltdown, OAS clawback shield, yearly P1 & P2 spreadsheet export, Monte Carlo, and 29 Canadian calculators.',
    images: ['/preview-summary.png'],
  },
};

const featuresJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      '@id': 'https://www.planfolio.ca/features#webpage',
      url: 'https://www.planfolio.ca/features',
      name: 'Planfolio Features, 2026 Canadian Tax Engine & 29 Financial Calculators',
      description:
        'Complete directory of Planfolio Canadian retirement planning capabilities, 13-province CRA tax rules, stress tests, and 29 specialized financial calculators.',
      inLanguage: ['en-CA', 'fr-CA'],
      dateModified: '2026-11-26',
      isPartOf: { '@id': 'https://www.planfolio.ca/#website' },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.planfolio.ca',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Features & Calculators',
          item: 'https://www.planfolio.ca/features',
        },
      ],
    },
    {
      '@type': 'ItemList',
      name: 'Planfolio Core Modules & Canadian Financial Optimizers',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '13-Jurisdiction 2026 CRA Tax & OAS Clawback Engine', url: 'https://www.planfolio.ca/planner' },
        { '@type': 'ListItem', position: 2, name: 'Full Yearly Spreadsheet View & Excel CSV Export (P1 & P2)', url: 'https://www.planfolio.ca/planner?tab=projection' },
        { '@type': 'ListItem', position: 3, name: 'Monte Carlo LHS/QHS & Historical Crash Stress Tests (2008 GFC, 2000 Dot-Com, 1966 Stagflation)', url: 'https://www.planfolio.ca/planner?tab=risk' },
        { '@type': 'ListItem', position: 4, name: 'Retirement Age vs. Spend Heatmap & Max Safe Spend Solver', url: 'https://www.planfolio.ca/tools/retirement-sensitivity-heatmap' },
        { '@type': 'ListItem', position: 5, name: 'Coast FIRE & Barista FIRE Calculator (Canada)', url: 'https://www.planfolio.ca/tools/coast-fire-calculator' },
        { '@type': 'ListItem', position: 6, name: 'LIF to RRIF 50% Unlocking Optimizer', url: 'https://www.planfolio.ca/tools/lif-to-rrif-unlocking' },
        { '@type': 'ListItem', position: 7, name: 'RRSP Deduction Sweet Spot Calculator', url: 'https://www.planfolio.ca/tools/rrsp-sweet-spot' },
        { '@type': 'ListItem', position: 8, name: 'Buy vs. Rent Analyzer (Canada)', url: 'https://www.planfolio.ca/tools/buy-vs-rent' },
        { '@type': 'ListItem', position: 9, name: 'Smith Maneuver Tax-Deductible Mortgage Calculator', url: 'https://www.planfolio.ca/tools/smith-maneuver' },
      ],
    },
  ],
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(featuresJsonLd) }}
      />
      {children}
    </>
  );
}
