import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Features & Canadian Tax Engine',
  description:
    'Explore Planfolio features: 13-jurisdiction CRA tax modeling, RRSP meltdown, OAS clawback shield, Monte Carlo LHS/QHS, Survivor stress testing, DataBank, and 28 financial calculators.',
  alternates: {
    canonical: 'https://www.planfolio.ca/features',
  },
  openGraph: {
    title: 'Features & Canadian Tax Engine | Planfolio',
    description:
      'Explore all Canadian retirement planning features: 13-jurisdiction CRA taxes, CPP/OAS optimization, Monte Carlo risk analysis, and 28 standalone calculators.',
    url: 'https://www.planfolio.ca/features',
    type: 'website',
    siteName: 'Planfolio Canada',
    images: [{ url: '/preview-summary.png', width: 1200, height: 630, alt: 'Planfolio Features Directory' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features & Canadian Tax Engine | Planfolio',
    description:
      '13-jurisdiction CRA taxes, RRSP meltdown, OAS clawback shield, Monte Carlo, and 28 calculators.',
    images: ['/preview-summary.png'],
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
