import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Retirement Planner',
  description:
    'Free local-first Canadian retirement and financial planning simulator with 13-jurisdiction CRA tax, CPP, OAS, RRSP meltdown, Monte Carlo, and portfolio projection engines.',
  alternates: {
    canonical: 'https://www.planfolio.ca/planner',
  },
  openGraph: {
    title: 'Canadian Retirement Planner | Planfolio',
    description:
      'Model your Canadian retirement with CRA taxes, CPP/OAS optimization, RRSP meltdown, and Monte Carlo stress testing — 100% private in your browser.',
    url: 'https://www.planfolio.ca/planner',
    type: 'website',
    siteName: 'Planfolio Canada',
    images: [{ url: '/preview-summary.png', width: 1200, height: 630, alt: 'Planfolio Retirement Planner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Canadian Retirement Planner | Planfolio',
    description:
      'Model CRA taxes, CPP/OAS optimization, RRSP meltdown, and Monte Carlo stress testing — 100% private in your browser.',
    images: ['/preview-summary.png'],
  },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
      {children}
    </>
  );
}