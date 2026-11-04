/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: app/databank/page.tsx
 * PURPOSE: Data Bank & Annual Roll-Forward Feature Showcase Page
 * INSTRUCTION: Place this file in 'app/databank/page.tsx'
 * =========================================================================
 */

import MarketingHeader from '@/components/MarketingHeader';
import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Data Bank & Annual Roll-Forward Calibration | Planfolio Canada',
    description:
        'Bridge the gap between retirement projections and real-world statement actuals. Track Dec 31 balances, calculate actual portfolio returns, and calibrate future assumptions 100% locally.',
    alternates: {
        canonical: 'https://www.planfolio.ca/databank',
    },
    openGraph: {
        title: 'Data Bank & Annual Roll-Forward Calibration | Planfolio Canada',
        description: 'Track real-world statement actuals, benchmark your portfolio alpha, and roll forward your plan with zero cloud tracking.',
        url: 'https://www.planfolio.ca/databank',
        type: 'website',
        siteName: 'Planfolio Canada',
        images: [
            {
                url: '/preview-summary.png',
                width: 1200,
                height: 630,
                alt: 'Planfolio Data Bank & Roll-Forward Calibration',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Data Bank & Annual Roll-Forward Calibration | Planfolio Canada',
        description: 'Bridge the gap between retirement projections and real-world statement actuals.',
        images: ['/preview-summary.png'],
    },
};

export default function DataBankPage() {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebPage',
                name: 'Data Bank & Annual Roll-Forward Calibration',
                url: 'https://www.planfolio.ca/databank',
                description: 'Real-world actuals tracking and assumption calibration for Canadian retirement planning.',
            },
            {
                '@type': 'FAQPage',
                mainEntity: [
                    {
                        '@type': 'Question',
                        name: 'Why is annual roll-forward calibration necessary in financial planning?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'Static financial plans assume smooth, unvarying investment returns (e.g. 6.0% every year) for 40 years. In reality, markets experience volatility, tax brackets change, and living expenses fluctuate. The Annual Roll-Forward Wizard records your true December 31 statement actuals, compares them against what your plan projected, and updates your 40-year trajectory with empirical data.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'Does Planfolio connect to my Canadian bank account or store my credentials?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'No. Planfolio is built on a strict Local-First Philosophy. We do not use third-party screen-scrapers (like Plaid or Yodlee) and never ask for bank credentials. Your financial statements and net worth history are stored exclusively inside your local browser memory and can be exported as an encrypted JSON backup file.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'How does Planfolio calculate personal investment return in the Data Bank?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'The Data Bank isolates new capital savings and withdrawals from pure market growth: Return = (Closing Balance - Opening Balance - Net Contributions) / Average Invested Capital. This allows you to evaluate your true portfolio alpha independent of your savings rate.',
                        },
                    },
                    {
                        '@type': 'Question',
                        name: 'What accounts can be tracked in the Data Bank?',
                        acceptedAnswer: {
                            '@type': 'Answer',
                            text: 'The Data Bank supports all Canadian account types: TFSA, RRSP, FHSA, Non-Registered, Crypto, Cash, LIRA, LIF, RRIF, and RESP, with separate account tracking for Player 1, Player 2 (couples), and custom private business assets.',
                        },
                    },
                ],
            },
        ],
    };

    return (
        <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-blue-500/30 font-sans">
            {/* Scoped CSS to enforce high-contrast light text across controls */}
            <style dangerouslySetInnerHTML={{ __html: `
                .rp-card, [data-bs-theme="dark"] {
                    --bs-body-color: #f1f5f9 !important;
                    --bs-secondary-color: #94a3b8 !important;
                    --bs-body-bg: #0b0f17 !important;
                    --bs-card-bg: #0f172a !important;
                    --bs-border-color: #1e293b !important;
                }
                .text-muted { color: #94a3b8 !important; }
                .text-main { color: #f8fafc !important; }
            `}} />

            {/* JSON-LD Schema for Google Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* TOP NAVIGATION BAR - Identical to Main Page, Tools & Features */}
            <MarketingHeader />

            {/* HERO SECTION */}
            <header className="relative pt-44 pb-20 overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#0f172a]">
                <div className="container mx-auto px-6 text-center relative z-10 max-w-4xl">


                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        The Living Financial Archive.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                            Built for Real-World Returns.
                        </span>
                    </h1>

                    <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
                        Financial plans shouldn’t gather dust after day one. The Data Bank captures your December 31 statement actuals, calculates your true return alpha, and calibrates your 40-year trajectory with empirical precision.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
                        <Link
                            href="/planner?tab=databank"
                            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/20 text-decoration-none flex items-center justify-center gap-2"
                        >
                            <span>Open Data Bank in Planner</span>
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold px-8 py-3.5 rounded-full border border-slate-700 transition-all text-decoration-none flex items-center justify-center gap-2"
                        >
                            <span>Explore How It Works</span>
                            <i className="bi bi-chevron-down text-xs"></i>
                        </a>
                    </div>

                    {/* Metrics Bar - 1-Line Typography Across All Viewports */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-sm max-w-4xl mx-auto text-start">
                        <div className="border-r border-slate-800/80 pr-3 sm:pr-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Archived Years</span>
                            <span className="text-sm sm:text-base lg:text-lg font-black text-white whitespace-nowrap block">Annual Snapshots</span>
                        </div>
                        <div className="border-r border-slate-800/80 pr-3 sm:pr-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Return Engine</span>
                            <span className="text-sm sm:text-base lg:text-lg font-black text-emerald-400 whitespace-nowrap block">True IRR Alpha</span>
                        </div>
                        <div className="border-r border-slate-800/80 pr-3 sm:pr-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Account Types</span>
                            <span className="text-sm sm:text-base lg:text-lg font-black text-blue-400 whitespace-nowrap block">10 Canadian Assets</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Local Security</span>
                            <span className="text-sm sm:text-base lg:text-lg font-black text-cyan-400 whitespace-nowrap block">100% Client-Side</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* CORE PILLARS SECTION */}
            <main className="container mx-auto px-6 py-20 max-w-6xl text-start" id="features">
                <div className="text-center max-w-3xl mx-auto mb-16">

                    <h2 className="text-3xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
                        Why Most Retirement Projections Fail
                    </h2>
                    <p className="text-slate-400 text-base md:text-lg">
                        Traditional financial software forces you to restart your entire forecast every year or rely on constant, smooth 6% returns. Planfolio solves this with five purpose-built mechanisms:
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
                    {/* Pillar 1: Roll-Forward Wizard */}
                    <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-3xl transition-all group flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl mb-6 group-hover:scale-105 transition-transform">
                                <i className="bi bi-arrow-repeat"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                The Annual Roll-Forward Wizard
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                When calendar years conclude, the wizard captures your December 31 closing balances, advances household ages, automatically rolls over opening balances for January 1, and updates your multi-decade cash flow timeline.
                            </p>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mb-0 list-unstyled">
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-emerald-400 font-bold"></i> Automatic Age & Timeline Advancements
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-emerald-400 font-bold"></i> Zero Manual Re-Entry on Prior Assets
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-emerald-400 font-bold"></i> Instant Timeline Chain Continuity
                            </li>
                        </ul>
                    </div>

                    {/* Pillar 2: Alpha & Calibration */}
                    <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-3xl transition-all group flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl mb-6 group-hover:scale-105 transition-transform">
                                <i className="bi bi-bullseye"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Assumption vs. Actual Calibration
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Directly benchmark your personal portfolio return against your plan’s initial growth rate. Isolate genuine investment return from regular wage savings to quantify your true investment alpha and fee drag.
                            </p>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mb-0 list-unstyled">
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-blue-400 font-bold"></i> True Market Return vs. Savings Isolation
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-blue-400 font-bold"></i> FP Canada Benchmark Comparison
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-blue-400 font-bold"></i> Dynamic Return Calibration
                            </li>
                        </ul>
                    </div>

                    {/* Pillar 3: Immutable Snapshots */}
                    <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-3xl transition-all group flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl mb-6 group-hover:scale-105 transition-transform">
                                <i className="bi bi-shield-check"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Time-Machine Snapshots
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Before any roll-forward is finalized, Planfolio creates an immutable snapshot backup point. Audit your historical balance sheet, return breakdown, and CRA ACB at any time with complete rollback protection.
                            </p>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mb-0 list-unstyled">
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-purple-400 font-bold"></i> Immutable Dec 31 Balance Records
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-purple-400 font-bold"></i> One-Click Historical Snapshot Restore
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-purple-400 font-bold"></i> Offline JSON Archive Export
                            </li>
                        </ul>
                    </div>

                    {/* Pillar 4: Multi-Account Breakdown */}
                    <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-3xl transition-all group flex flex-col justify-between shadow-lg">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 text-xl mb-6 group-hover:scale-105 transition-transform">
                                <i className="bi bi-diagram-3"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Granular Canadian Accounts
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Track every registered, locked-in, and taxable vehicle independently. Distinct buckets for Player 1, Player 2 (couples), and Custom Assets (private business equity, real estate equity, and crypto).
                            </p>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 border-t border-slate-800/80 pt-4 mb-0 list-unstyled">
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-cyan-400 font-bold"></i> TFSA, RRSP, FHSA, RESP, Non-Reg
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-cyan-400 font-bold"></i> LIRA, LIF, RRIF Pension Vehicles
                            </li>
                            <li className="flex items-center gap-2">
                                <i className="bi bi-check2 text-cyan-400 font-bold"></i> CRA Adjusted Cost Base (ACB) Tracking
                            </li>
                        </ul>
                    </div>

                    {/* Pillar 5: Local-First Privacy */}
                    <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-3xl transition-all group flex flex-col justify-between shadow-lg md:col-span-2 lg:col-span-2">
                        <div>
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl mb-6 group-hover:scale-105 transition-transform">
                                <i className="bi bi-safe2"></i>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">
                                Zero Bank Scraping. Zero Cloud Storage.
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6">
                                Most modern financial trackers force you to hand over your online banking credentials to third-party aggregators (like Plaid or Yodlee), storing your balance sheet on foreign servers. Planfolio operates on a strict Local-First model: you enter your annual December 31 statement actuals once a year, and all calculations stay on your device.
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <i className="bi bi-shield-check text-emerald-400 font-bold"></i> No Banking Passwords Required
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <i className="bi bi-shield-check text-emerald-400 font-bold"></i> Zero Data Monetization or Ad Tracking
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <i className="bi bi-shield-check text-emerald-400 font-bold"></i> Works 100% Offline in Browser
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                                <i className="bi bi-shield-check text-emerald-400 font-bold"></i> Encrypted Local Backup Exports
                            </div>
                        </div>
                    </div>
                </div>

                {/* HOW THE ROLL-FORWARD WORKFLOW OPERATES */}
                <section className="mb-20 p-8 sm:p-12 rounded-[2.5rem] bg-slate-900/60 border border-slate-800">
                    <div className="text-center max-w-2xl mx-auto mb-12">

                        <h3 className="text-2xl sm:text-4xl font-black text-white mt-3 mb-2 tracking-tight">
                            How the Roll-Forward Works
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Complete your entire annual retirement calibration in under 5 minutes each January.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-[#141c2b] border border-[#2c3b52] p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                                <span className="text-emerald-400 font-black text-3xl mb-4 block">01</span>
                                <h4 className="text-base font-bold text-white mb-2">Snapshot Year-End Balances</h4>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Grab your December 31 statements from your brokerages (Wealthsimple, Questrade, RBC, TD, etc.) and record final balances across your registered and taxable accounts.
                                </p>
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold mt-4 block">Takes ~3 minutes</span>
                        </div>

                        <div className="bg-[#141c2b] border border-[#2c3b52] p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                                <span className="text-blue-400 font-black text-3xl mb-4 block">02</span>
                                <h4 className="text-base font-bold text-white mb-2">Audit Return Alpha</h4>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    Planfolio compares your actual rate of return against your plan’s projection. See instantly whether your portfolio outpaced inflation and benchmarks.
                                </p>
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold mt-4 block">Instant Calculation</span>
                        </div>

                        <div className="bg-[#141c2b] border border-[#2c3b52] p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                                <span className="text-purple-400 font-black text-3xl mb-4 block">03</span>
                                <h4 className="text-base font-bold text-white mb-2">Advance Plan Timeline</h4>
                                <p className="text-slate-400 text-xs leading-relaxed">
                                    The wizard advances everyone’s age by 1 year, updates current retirement countdowns, and anchors January 1 opening balances for the next 40-year vector.
                                </p>
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold mt-4 block">1-Click Execution</span>
                        </div>
                    </div>
                </section>

                {/* FAQ ACCORDION */}
                <section className="mb-20">
                    <div className="text-center max-w-2xl mx-auto mb-10">
                        <h3 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight">
                            Frequently Asked Questions
                        </h3>
                        <p className="text-slate-400 text-sm">
                            Everything you need to know about tracking annual financial actuals in Planfolio.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 divide-y divide-slate-800/70 overflow-hidden shadow-sm max-w-3xl mx-auto">
                        <div className="p-6 hover:bg-slate-900/30 transition-colors">
                            <h4 className="text-base font-bold text-white mb-2 flex items-start gap-2">
                                <span className="text-emerald-400 font-extrabold">Q:</span>
                                <span>Why is annual roll-forward necessary in financial planning?</span>
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed mb-0 ps-5">
                                Static financial plans assume unvarying investment returns (e.g. 6.0% every year for 40 years). In reality, market sequences fluctuate. The Roll-Forward Wizard anchors your forecast to real empirical data every January, ensuring your retirement date and safe withdrawal rates remain accurate.
                            </p>
                        </div>

                        <div className="p-6 hover:bg-slate-900/30 transition-colors">
                            <h4 className="text-base font-bold text-white mb-2 flex items-start gap-2">
                                <span className="text-emerald-400 font-extrabold">Q:</span>
                                <span>Does the Data Bank connect to my Canadian bank account?</span>
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed mb-0 ps-5">
                                No. Planfolio runs on a strict Local-First model. We never ask for bank credentials or route account balances through foreign servers. You simply enter final Dec 31 figures once a year, and all calculations stay on your device.
                            </p>
                        </div>

                        <div className="p-6 hover:bg-slate-900/30 transition-colors">
                            <h4 className="text-base font-bold text-white mb-2 flex items-start gap-2">
                                <span className="text-emerald-400 font-extrabold">Q:</span>
                                <span>How does Planfolio calculate my personal investment return?</span>
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed mb-0 ps-5">
                                The Data Bank separates regular savings contributions from capital growth: Return = (Closing Balance - Opening Balance - Net Contributions) / Average Invested Capital. This gives you a clean, accurate measure of your portfolio performance independent of how much you saved.
                            </p>
                        </div>

                        <div className="p-6 hover:bg-slate-900/30 transition-colors">
                            <h4 className="text-base font-bold text-white mb-2 flex items-start gap-2">
                                <span className="text-emerald-400 font-extrabold">Q:</span>
                                <span>What happens if I make a mistake during a roll-forward?</span>
                            </h4>
                            <p className="text-slate-300 text-sm leading-relaxed mb-0 ps-5">
                                Planfolio automatically takes an immutable snapshot of your entire plan before executing any roll-forward. If you ever enter an incorrect balance, you can restore a prior year snapshot with one click.
                            </p>
                        </div>
                    </div>
                </section>

                {/* BOTTOM CTA BANNER */}
                <section className="p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-900 text-center shadow-2xl">
                    <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                        Start Your Financial Track Record Today
                    </h2>
                    <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto mb-8 opacity-90">
                        Launch the full retirement planner to record past historical actuals or run your first Annual Roll-Forward calibration.
                    </p>
                    <Link
                        href="/planner?tab=databank"
                        className="bg-white text-slate-950 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-xl text-decoration-none d-inline-flex align-items-center gap-2"
                    >
                        <span>Launch Planner Data Bank</span>
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="py-12 border-t border-slate-800/80 bg-[#080d19] text-center text-xs text-slate-500">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <span className="font-bold text-slate-400 text-sm">Planfolio Canada</span>
                        <div className="flex gap-4">
                            <Link href="/" className="text-slate-400 hover:text-white text-decoration-none">Home</Link>
                            <Link href="/features" className="text-slate-400 hover:text-white text-decoration-none">Features</Link>
                            <Link href="/tools" className="text-slate-400 hover:text-white text-decoration-none">Tools</Link>
                            <Link href="/planner" className="text-slate-400 hover:text-white text-decoration-none">Planner</Link>
                        </div>
                    </div>
                    <p className="mb-0 text-slate-600">
                        © {new Date().getFullYear()} Planfolio. Built for Canadians from coast to coast. 100% Client-Side Simulation.
                    </p>
                </div>
            </footer>
        </div>
    );
}