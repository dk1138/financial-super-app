/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: app/tools/page.tsx
 * PURPOSE: Standalone Canadian Calculators & Tools Directory Page
 * INSTRUCTION: Rename this file to 'page.tsx' and place it in 'app/tools/'
 * =========================================================================
 */

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS_DATA } from '@/lib/toolsData';

export const metadata: Metadata = {
    title: 'Free Canadian Financial Tools & Calculators | Planfolio',
    description:
        'Explore free, standalone Canadian personal finance, tax, mortgage, and pension calculators. Built specifically for CRA statutory rules and local-first privacy.',
    alternates: {
        canonical: 'https://www.planfolio.ca/tools',
    },
    openGraph: {
        title: 'Free Canadian Financial Tools & Calculators | Planfolio',
        description: 'Free collection of standalone Canadian financial calculators. No sign-up, 100% privacy-first.',
        url: 'https://www.planfolio.ca/tools',
        type: 'website',
    },
};

export default function ToolsDirectoryPage() {
    // Dynamically derive categories from TOOLS_DATA so cards always render regardless of data revision
    const categories = Array.from(new Set((TOOLS_DATA || []).map((t) => t.category).filter(Boolean)));

    return (
        <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-blue-500/30 font-sans">
            {/* Scoped CSS to enforce high-contrast light text across Bootstrap controls */}
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

            {/* NAVIGATION BAR - Identical to Main Page */}
            <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
                <div className="container mx-auto px-6 py-3.5 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                            <i className="bi bi-graph-up-arrow text-white text-base"></i>
                        </div>
                        <div className="flex flex-col text-start">
                            <span className="text-xl font-black tracking-tight text-white leading-none">Planfolio</span>
                            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mt-0.5">Canada</span>
                        </div>
                    </Link>
                    
                    <div className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                        <Link href="/#about" className="text-slate-400 hover:text-white transition-colors text-decoration-none">About</Link>
                        <Link href="/features" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Features</Link>
                        <Link href="/tools" className="text-white font-bold transition-colors text-decoration-none flex items-center gap-1.5">
                            <span>Tools</span>
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Free</span>
                        </Link>
                        <Link href="/#databank" className="text-slate-400 hover:text-white transition-colors text-decoration-none flex items-center gap-1.5">
                            <span>Data Bank</span>
                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">New</span>
                        </Link>
                        <Link href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors text-decoration-none">How It Works</Link>
                        <Link href="/#privacy" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Local-First Privacy</Link>
                        <Link href="/#pricing" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Pricing</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link 
                            href="/planner" 
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 transition-all text-decoration-none flex items-center gap-1.5"
                        >
                            <span>Launch Planner</span>
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="container mx-auto px-6 pt-44 pb-20 max-w-6xl text-start">
                {/* DIRECTORY HERO HEADER */}
                <div className="text-center mb-16">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4">
                        Free Canadian Toolkit
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
                        Canadian Financial Tools
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Every tool runs completely standalone in your browser with zero data entry or account setup required. Modeled specifically for CRA formulas, provincial tax brackets, and local-first privacy.
                    </p>
                </div>

                {/* CATEGORIES & TOOLS GRID */}
                <div className="space-y-14">
                    {categories.length > 0 ? (
                        categories.map((cat) => {
                            const catTools = (TOOLS_DATA || []).filter((t) => t.category === cat);
                            if (catTools.length === 0) return null;

                            return (
                                <section key={cat}>
                                    <div className="flex items-center gap-2 mb-6 pb-2 border-b border-slate-800">
                                        <h2 className="text-2xl font-bold text-white tracking-tight">{cat}</h2>
                                    </div>

                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {catTools.map((tool) => (
                                            <Link
                                                key={tool.slug}
                                                href={`/tools/${tool.slug}`}
                                                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-6 rounded-2xl transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-black/30 text-decoration-none"
                                            >
                                                <div>
                                                    <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                                                        {tool.title}
                                                    </h3>
                                                    <p className="text-slate-400 text-xs leading-relaxed mb-4">
                                                        {tool.subtitle}
                                                    </p>
                                                </div>

                                                <div className="pt-3 border-t border-slate-800/80 flex justify-end items-center text-[11px] mt-auto">
                                                    <span className="text-blue-400 group-hover:text-blue-300 font-bold flex items-center gap-1 text-decoration-none group-hover:translate-x-0.5 transition-transform">
                                                        <span>Open Tool</span>
                                                        <i className="bi bi-chevron-right text-[10px]"></i>
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            );
                        })
                    ) : (
                        /* Direct fallback if categories cannot be parsed */
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {(TOOLS_DATA || []).map((tool) => (
                                <Link
                                    key={tool.slug}
                                    href={`/tools/${tool.slug}`}
                                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-6 rounded-2xl transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-black/30 text-decoration-none"
                                >
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                                            {tool.title}
                                        </h3>
                                        <p className="text-slate-400 text-xs leading-relaxed mb-4">
                                            {tool.subtitle}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-800/80 flex justify-end items-center text-[11px] mt-auto">
                                        <span className="text-blue-400 group-hover:text-blue-300 font-bold flex items-center gap-1 text-decoration-none group-hover:translate-x-0.5 transition-transform">
                                            <span>Open Tool</span>
                                            <i className="bi bi-chevron-right text-[10px]"></i>
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* BOTTOM CTA BANNER */}
                <section className="mt-20 p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-center shadow-2xl">
                    <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                        Need the full 40-year picture?
                    </h2>
                    <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-6 opacity-90">
                        Launch Planfolio to simulate your complete retirement vector, combining real estate, CPP/OAS pensions, CRA tax brackets, and after-tax estate legacy in one unified engine.
                    </p>
                    <Link
                        href="/planner"
                        className="bg-white text-blue-900 px-8 py-3.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-xl text-decoration-none d-inline-flex align-items-center gap-2"
                    >
                        <span>Launch Full Retirement Planner</span>
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
                            <Link href="/planner" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Planner</Link>
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