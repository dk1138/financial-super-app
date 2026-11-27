import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import ToolRenderer from '@/components/tools/ToolRenderer';
import { PROVINCIAL_TAX_PAGES, PROVINCE_BY_SLUG } from '@/lib/provincialSeoData';
import { FINANCIAL_CONSTANTS } from '@/lib/config';
import { ENGINE_VERSION } from '@/lib/financeEngine';

interface PageProps {
  params: Promise<{ province: string }>;
}

export function generateStaticParams() {
  return PROVINCIAL_TAX_PAGES.map((p) => ({ province: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { province } = await params;
  const entry = PROVINCE_BY_SLUG[province];
  if (!entry) {
    return { title: 'Province Not Found' };
  }

  const title = `2026 ${entry.name} Income Tax, Marginal Rate & OAS Clawback Calculator`;
  const description = `Free 2026 ${entry.name} (${entry.code}) income tax & retirement marginal rate calculator. ${entry.highlight2026}`;

  return {
    title,
    description,
    keywords: [
      `${entry.name} tax calculator 2026`,
      `${entry.name} tax brackets 2026`,
      `${entry.name} marginal tax rate 2026`,
      `${entry.name} retirement tax calculator`,
      `${entry.name} OAS clawback calculator`,
    ],
    alternates: {
      canonical: `https://www.planfolio.ca/tools/tax-calculator/${entry.slug}`,
    },
    openGraph: {
      title: `${title} | Planfolio`,
      description,
      url: `https://www.planfolio.ca/tools/tax-calculator/${entry.slug}`,
      type: 'website',
      siteName: 'Planfolio Canada',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Planfolio`,
      description,
    },
  };
}

const fmtCurr = (n: number) => `$${Math.round(n).toLocaleString('en-CA')}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(2).replace(/\.00$/, '.0')}%`;

export default async function ProvincialTaxPage({ params }: PageProps) {
  const { province } = await params;
  const entry = PROVINCE_BY_SLUG[province];
  if (!entry) notFound();

  const taxData: any = FINANCIAL_CONSTANTS.TAX_DATA;
  const provSchedule = taxData[entry.code];
  const fedSchedule = taxData.FED;
  const provBpa = (FINANCIAL_CONSTANTS.PROV_BPA as any)[entry.code];
  const provAge = (FINANCIAL_CONSTANTS.PROV_AGE_AMOUNT as any)[entry.code];
  const provEligDiv = (FINANCIAL_CONSTANTS.PROV_DIV_CREDIT_ELIGIBLE as any)[entry.code];

  const rows: { range: string; rate: string }[] = provSchedule.rates.map((rate: number, idx: number) => {
    const low = idx === 0 ? 0 : provSchedule.brackets[idx - 1];
    const high = provSchedule.brackets[idx];
    const range = high ? `${fmtCurr(low)} – ${fmtCurr(high)}` : `Over ${fmtCurr(low)}`;
    return { range, rate: fmtPct(rate) };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: `2026 ${entry.name} Income Tax & Retirement Calculator`,
        url: `https://www.planfolio.ca/tools/tax-calculator/${entry.slug}`,
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        softwareVersion: ENGINE_VERSION,
        dateModified: '2026-11-26',
        inLanguage: ['en-CA', 'fr-CA'],
        description: entry.highlight2026,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'CAD' },
        publisher: { '@type': 'Organization', name: 'Planfolio', url: 'https://www.planfolio.ca' },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.planfolio.ca' },
          { '@type': 'ListItem', position: 2, name: 'Tools & Calculators', item: 'https://www.planfolio.ca/tools' },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${entry.name} 2026 Tax Calculator`,
            item: `https://www.planfolio.ca/tools/tax-calculator/${entry.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MarketingHeader />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400 mb-6 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-white text-decoration-none text-slate-400">Home</Link>
          <span>/</span>
          <Link href="/tools" className="hover:text-white text-decoration-none text-slate-400">Calculators</Link>
          <span>/</span>
          <span className="text-sky-400 font-semibold">{entry.name} 2026 Tax</span>
        </nav>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
            <span>✓ Updated for 2026 CRA &amp; {entry.name} Budget</span>
            <span>·</span>
            <Link href="/methodology" className="underline text-emerald-200 hover:text-white">Methodology &amp; Sources</Link>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4">
            2026 {entry.name} ({entry.code}) Income Tax &amp; OAS Clawback Calculator
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            {entry.highlight2026}
          </p>
        </div>

        <section className="mb-12" aria-label={`Interactive ${entry.name} marginal tax calculator`}>
          <ToolRenderer toolKey="tax-curve" defaultProvince={entry.code} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              2026 {entry.name} Provincial Tax Brackets
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-left">
                  <th className="pb-2">2026 Taxable Income</th>
                  <th className="pb-2 text-right">{entry.code} Rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.range} className="border-b border-slate-800/70">
                    <td className="py-2.5 text-slate-200">{r.range}</td>
                    <td className="py-2.5 text-right font-semibold text-sky-400">{r.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">
              2026 Federal &amp; {entry.code} Key Credits
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between border-b border-slate-800/70 pb-2">
                <dt className="text-slate-400">Federal 1st Bracket (2026)</dt>
                <dd className="font-semibold text-white">{fmtPct(fedSchedule.rates[0])} up to {fmtCurr(fedSchedule.brackets[0])}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/70 pb-2">
                <dt className="text-slate-400">Federal Basic Personal Amount</dt>
                <dd className="font-semibold text-white">{fmtCurr(FINANCIAL_CONSTANTS.BPA_MAX_FED)} (min {fmtCurr(FINANCIAL_CONSTANTS.BPA_MIN_FED)})</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/70 pb-2">
                <dt className="text-slate-400">{entry.name} Basic Personal Amount</dt>
                <dd className="font-semibold text-white">{fmtCurr(provBpa)}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/70 pb-2">
                <dt className="text-slate-400">{entry.name} Age Amount (65+)</dt>
                <dd className="font-semibold text-white">{fmtCurr(provAge)}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-800/70 pb-2">
                <dt className="text-slate-400">{entry.code} Eligible Dividend Credit</dt>
                <dd className="font-semibold text-white">{fmtPct(provEligDiv)} of grossed-up</dd>
              </div>
              <div className="flex justify-between pt-1">
                <dt className="text-slate-400">2026 OAS Clawback Threshold</dt>
                <dd className="font-semibold text-amber-400">{fmtCurr(FINANCIAL_CONSTANTS.OAS_CLAWBACK_THRESHOLD)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6 mb-10">
          <h2 className="text-base font-bold text-white mb-3">Compare Other Canadian Provinces &amp; Territories (2026)</h2>
          <div className="flex flex-wrap gap-2">
            {PROVINCIAL_TAX_PAGES.map((p) => (
              <Link
                key={p.slug}
                href={`/tools/tax-calculator/${p.slug}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-decoration-none transition-colors ${
                  p.slug === entry.slug
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {p.name} ({p.code})
              </Link>
            ))}
          </div>
        </section>

        <footer className="border-t border-slate-800 pt-6 text-xs text-slate-400 flex flex-wrap justify-between gap-4">
          <p className="m-0">
            Educational simulation only — not personalized tax, legal, or financial advice. Verify figures against CRA Form T4032 (2026) or a CPA / CFP® professional.
          </p>
          <div className="flex gap-4">
            <Link href="/methodology" className="text-slate-300 hover:text-white">Methodology</Link>
            <Link href="/privacy" className="text-slate-300 hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-300 hover:text-white">Terms</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
