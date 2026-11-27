import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';
import { ENGINE_VERSION } from '@/lib/financeEngine';

export const metadata: Metadata = {
  title: '2026 Canadian Tax, CPP/OAS & Simulation Methodology',
  description:
    'Transparent documentation of Planfolio’s 2026 CRA & 13-province tax formulas, CPP/CPP2/OAS mechanics, RRIF/LIF factors, inflation indexing, and Monte Carlo methodology.',
  alternates: { canonical: 'https://www.planfolio.ca/methodology' },
  openGraph: {
    title: '2026 Canadian Tax & Retirement Simulation Methodology | Planfolio',
    description:
      'Audit every statutory 2026 CRA constant, provincial surtax rule, pension-splitting cap, and stochastic assumption behind Planfolio.',
    url: 'https://www.planfolio.ca/methodology',
    type: 'article',
    siteName: 'Planfolio Canada',
  },
};

export default function MethodologyPage() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: 'Planfolio 2026 Canadian Tax & Retirement Simulation Methodology',
    datePublished: '2026-01-15',
    dateModified: '2026-11-26',
    version: ENGINE_VERSION,
    inLanguage: 'en-CA',
    author: { '@type': 'Organization', name: 'Planfolio', url: 'https://www.planfolio.ca' },
    publisher: { '@type': 'Organization', name: 'Planfolio', url: 'https://www.planfolio.ca' },
    url: 'https://www.planfolio.ca/methodology',
  };

  return (
    <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <MarketingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
          <span>✓ Last Updated for 2026 Tax Year (Engine v{ENGINE_VERSION})</span>
          <span>·</span>
          <span>Reviewed Nov 26, 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
          2026 Canadian Tax &amp; Simulation Methodology
        </h1>
        <p className="text-slate-300 text-base leading-relaxed mb-10">
          Planfolio is built for full mathematical transparency. Below are the exact 2026 statutory constants, government sources, and simulation conventions used by Engine <code className="text-sky-300">v{ENGINE_VERSION}</code>.
        </p>

        <div className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">1. Verified 2026 CRA &amp; Service Canada Parameters</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-left">
                    <th className="pb-2">Parameter</th>
                    <th className="pb-2">2026 Value</th>
                    <th className="pb-2">Statutory Authority / Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  <tr>
                    <td className="py-2.5 text-white font-medium">Federal Tax Brackets</td>
                    <td className="py-2.5 text-sky-300">14.0% ($58,523) · 20.5% ($117,045) · 26% ($181,440) · 29% ($258,482) · 33%</td>
                    <td className="py-2.5 text-slate-400">CRA T4032 (2026), Bill C-4 (14% lowest rate), +2.0% CPI indexation</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">Federal Basic Personal Amount</td>
                    <td className="py-2.5 text-sky-300">$16,452 max → $14,829 min</td>
                    <td className="py-2.5 text-slate-400">Phases out linearly across $181,440–$258,482 (Line 23600 Net Income)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">Federal Age Amount (65+)</td>
                    <td className="py-2.5 text-sky-300">$9,208 (15% clawback &gt; $46,432)</td>
                    <td className="py-2.5 text-slate-400">CRA Line 30100 (eliminated at $107,819 net income)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">Capital Gains &amp; Dividends</td>
                    <td className="py-2.5 text-sky-300">Flat 50% CG · 1.38× / 1.15× Div Gross-Up</td>
                    <td className="py-2.5 text-slate-400">Flat 50% CG (Mar 2025 cancellation); Eligible 15.0198% &amp; Non-Elig 9.0301% Fed DTC</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">CPP / QPP &amp; CPP2 Ceilings</td>
                    <td className="py-2.5 text-sky-300">YMPE $74,600 · YAMPE $85,000</td>
                    <td className="py-2.5 text-slate-400">CPP 5.95% (QPP 6.30%) above $3,500; Tier-2 4.0% on $74,600–$85,000; −0.6%/mo early, +0.7%/mo late</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">OAS &amp; Recovery Tax (Clawback)</td>
                    <td className="py-2.5 text-sky-300">$95,323 threshold (15% recovery)</td>
                    <td className="py-2.5 text-slate-400">Tested on Line 23400 (incl. 1.38× dividend gross-up); deducted on Line 23500; +0.6%/mo deferral; +10% at age 75</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-white font-medium">TFSA, RRSP &amp; FHSA Limits</td>
                    <td className="py-2.5 text-sky-300">TFSA $7,000 · RRSP $33,810 · FHSA $8,000</td>
                    <td className="py-2.5 text-slate-400">Cumulative carry-forwards tracked; TFSA withdrawals restore room Jan 1; RRSP/FHSA capped at age 71</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">2. Provincial Surtaxes, Freezes &amp; Quebec Structure</h2>
            <p className="m-0">
              All 10 provinces and 3 territories use jurisdiction-specific progressive schedules: Ontario’s 20% ($5,818) and 36% ($7,446) stacked surtaxes (56% combined) are computed <em>after</em> deducting the Ontario Dividend Tax Credit per Form ON428 alongside the Ontario Health Premium ($0–$900) and $300 basic Ontario Tax Reduction; British Columbia reflects the 2026 5.60% first bracket and 2027–2030 indexation pause; Prince Edward Island includes the 20.0% 6th bracket above $200,000; Manitoba freezes $47,000/$100,000 brackets and claws back BPA above $200,000; and Quebec models the 16.5% federal abatement, QPP, reduced 1.30% EI, and 0.43% QPIP.
            </p>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">3. Decumulation, Pension Splitting &amp; Inflation Conventions</h2>
            <p className="m-0">
              RRSPs convert to RRIFs by age 71 with CRA prescribed minimum factors starting at age 72 (5.28% on Jan 1 age 71 up to 20.0% at 95+, with optional younger-spouse age election under ITA s. 146.3(1)). When spousal pension splitting is enabled (ITA s. 60.03), the engine optimizes up to 50% of eligible DB pension (any age) and RRIF/LIF income (age 65+) to minimize combined household tax and OAS clawback. Future tax brackets (except legislatively frozen thresholds), government benefits, and spending are indexed at your chosen inflation rate, and Real Dollars mode discounts nominal cash flows by <code className="text-sky-300">(1 + inflation)^t</code>.
            </p>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">4. Monte Carlo &amp; Sequence-of-Returns Stress Testing</h2>
            <p className="m-0">
              Users can run deterministic projections (net of expected investment fees/MERs entered in return rates), historical crash sequences (1929, 1966 Stagflation, 2000 Dot-Com, 2008 GFC), or up to 1,000-path stochastic simulations using Latin Hypercube Sampling (LHS), Quasi-Monte Carlo Halton sequences, or S&amp;P 500 historical bootstrap blocks with asset-class volatility betas and strict shortfall tracking.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href="/planner" className="text-sky-400 font-semibold hover:text-sky-300">← Launch Planner</Link>
          <Link href="/tools" className="text-slate-300 hover:text-white">Explore All 29 Calculators</Link>
          <Link href="/privacy" className="text-slate-300 hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="text-slate-300 hover:text-white">Terms &amp; Disclaimer</Link>
        </div>
      </main>
    </div>
  );
}
