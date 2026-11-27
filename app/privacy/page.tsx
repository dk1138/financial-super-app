import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingHeader from '@/components/MarketingHeader';

export const metadata: Metadata = {
  title: 'Local-First Privacy Policy & Data Sovereignty',
  description:
    'Planfolio operates on a strict 100% client-side privacy architecture. Your Canadian income, net worth, and retirement projections stay in your browser—never on remote servers.',
  alternates: { canonical: 'https://www.planfolio.ca/privacy' },
  openGraph: {
    title: 'Privacy Policy — Local-First Financial Data Sovereignty | Planfolio',
    description:
      'Zero bank logins, zero cloud database tracking of your net worth, and 100% client-side computation in your browser.',
    url: 'https://www.planfolio.ca/privacy',
    type: 'website',
    siteName: 'Planfolio Canada',
  },
};

export default function PrivacyPage() {
  return (
    <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 font-sans">
      <MarketingHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 mb-4">
          <span>🔒 100% Client-Side Computation</span>
          <span>·</span>
          <span>Last Updated: November 26, 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">
          Privacy Policy &amp; Data Sovereignty
        </h1>
        <p className="text-slate-300 text-base leading-relaxed mb-10">
          Planfolio is engineered from the ground up so you can model sensitive household salaries, RRSP/TFSA balances, mortgages, and estate plans without surrendering your financial privacy.
        </p>

        <div className="space-y-8 text-sm sm:text-base text-slate-300 leading-relaxed">
          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">1. Zero Server Storage of Financial Plan Data</h2>
            <p className="m-0">
              All tax simulations, Monte Carlo runs, and cash-flow calculations execute locally inside your browser using JavaScript and Web Workers. Your plan inputs, account balances, scenarios, and Annual Data Bank snapshots are persisted exclusively in your device’s local storage (<code className="text-sky-300">localStorage</code> / <code className="text-sky-300">IndexedDB</code>). We never transmit or store your net worth or income figures in a remote database.
            </p>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">2. No Bank Credentials or Account Aggregation</h2>
            <p className="m-0">
              Planfolio never asks for online banking passwords, CRA My Account credentials, Social Insurance Numbers (SIN), or read-access tokens via third-party aggregators (such as Plaid or Flinks).
            </p>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">3. Shareable Plan Links &amp; Exports</h2>
            <p className="m-0">
              When you export a JSON backup, Excel CSV spreadsheet, or compressed URL share link (<code className="text-sky-300">#plan=...</code>), the payload is generated directly in your browser. Share links encode plan numbers inside the URL hash fragment (which browsers do not send in standard HTTP request headers) and strip personal names by default unless you opt out.
            </p>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">4. Telemetry, Feedback &amp; Cookies</h2>
            <p className="m-0">
              We use privacy-friendly aggregate page-view and Core Web Vitals metrics (Vercel Analytics &amp; Speed Insights) to monitor site reliability—never capturing form inputs or financial balances. If you voluntarily submit a bug report or feedback message via the Feedback modal, only the message text, optional screenshot, and optional reply email you type are sent to respond to your inquiry.
            </p>
          </section>

          <section className="bg-[#141c2b] border border-[#2c3b52] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-2">5. Full User Control &amp; Instant Deletion</h2>
            <p className="m-0">
              Because your financial plans live solely in your browser, clearing your browser site data—or clicking <strong>Reset / Delete Plan</strong> inside the planner—permanently and immediately erases all stored figures. We recommend downloading a periodic JSON backup to keep an offline copy under your own control.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-wrap gap-4 text-sm">
          <Link href="/planner" className="text-sky-400 font-semibold hover:text-sky-300">← Launch Planner</Link>
          <Link href="/methodology" className="text-slate-300 hover:text-white">2026 Tax Methodology</Link>
          <Link href="/terms" className="text-slate-300 hover:text-white">Terms &amp; Disclaimer</Link>
        </div>
      </main>
    </div>
  );
}
