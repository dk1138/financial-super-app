// app/tools/page.tsx

import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { TOOLS_DATA } from '@/lib/toolsData';

export const metadata: Metadata = {
    title: '28 Free Canadian Financial Calculators & Optimizers | Planfolio',
    description:
        'Explore 28 free Canadian personal finance, tax, real estate, and retirement calculators. Built specifically for CRA rules, provincial tax brackets, and local-first privacy.',
    alternates: {
        canonical: 'https://www.planfolio.ca/tools',
    },
    openGraph: {
        title: '28 Free Canadian Financial Calculators & Optimizers | Planfolio',
        description: 'Free collection of 28 Canadian financial calculators. No sign-up, 100% privacy-first.',
        url: 'https://www.planfolio.ca/tools',
        type: 'website',
    },
};

export default function ToolsDirectoryPage() {
    const categories = [
        'Master Simulations',
        'Tax & Registered',
        'Debt, Real Estate & Cash',
        'Business & Income',
        'Data Importers',
    ];

    return (
        <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-blue-500/30 font-sans">
            {/* TOP NAVIGATION BAR */}
            <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-6xl">
                    <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                            <i className="bi bi-graph-up-arrow text-white text-base"></i>
                        </div>
                        <div className="flex flex-col text-start">
                            <span className="text-xl font-black tracking-tight text-white leading-none">Planfolio</span>
                            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mt-0.5">Canada</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/features"
                            className="text-slate-400 hover:text-white text-xs font-semibold text-decoration-none d-none d-sm-inline-flex"
                        >
                            Feature Matrix
                        </Link>
                        <Link
                            href="/planner"
                            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg shadow-blue-500/25 transition-all text-decoration-none flex items-center gap-1.5"
                        >
                            <span>Launch Full Planner</span>
                            <i className="bi bi-arrow-right"></i>
                        </Link>
                    </div>
                </div>
            </header>

            {/* DIRECTORY HERO HEADER */}
            <main className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="text-center mb-12">
                    <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-pill small fw-bold text-uppercase ls-1">
                        Free Canadian Toolkit
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 mb-3">
                        28 Specialized Canadian Financial Optimizers
                    </h1>
                    <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
                        Every calculator is built specifically for CRA statutory rules, provincial tax formulas, and local-first privacy. Free to use with zero accounts or bank credentials.
                    </p>
                </div>

                {/* CATEGORIES & TOOLS GRID */}
                <div className="space-y-12">
                    {categories.map((cat) => {
                        const catTools = TOOLS_DATA.filter((t) => t.category === cat);
                        if (catTools.length === 0) return null;

                        return (
                            <section key={cat} className="text-start">
                                <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom border-slate-800">
                                    <h2 className="text-xl font-bold text-white mb-0">{cat}</h2>
                                    <span className="badge bg-slate-800 text-slate-400 rounded-pill small">
                                        {catTools.length} {catTools.length === 1 ? 'tool' : 'tools'}
                                    </span>
                                </div>

                                <div className="row g-3">
                                    {catTools.map((tool) => (
                                        <div key={tool.slug} className="col-12 col-md-6 col-lg-4">
                                            <Link
                                                href={`/tools/${tool.slug}`}
                                                className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-blue-500/60 hover:bg-slate-900 transition-all text-decoration-none d-flex flex-column h-100 shadow-sm group"
                                            >
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 d-flex align-items-center justify-content-center flex-shrink-0">
                                                        <i className={`bi ${tool.icon} fs-5`}></i>
                                                    </div>
                                                    <span className="badge bg-slate-800 text-slate-400 border border-slate-700/60 px-2 py-1 rounded-pill" style={{ fontSize: '10px' }}>
                                                        {tool.badge}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors mb-2">
                                                    {tool.title}
                                                </h3>
                                                <p className="text-slate-400 text-xs leading-relaxed mb-4 flex-grow-1">
                                                    {tool.subtitle}
                                                </p>

                                                <div className="d-flex align-items-center gap-1.5 text-xs font-bold text-blue-400 mt-auto pt-2 border-top border-slate-800/60">
                                                    <span>Open Calculator</span>
                                                    <i className="bi bi-arrow-right"></i>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        );
                    })}
                </div>

                {/* BOTTOM CTA BANNER */}
                <section className="mt-16 p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-center shadow-2xl">
                    <h2 className="text-2xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                        Connect all 28 tools into one lifelong simulator
                    </h2>
                    <p className="text-blue-100 text-sm sm:text-base max-w-2xl mx-auto mb-6 opacity-90">
                        Launch Planfolio to simulate your complete retirement vector, combining real estate, CPP/OAS pensions, CRA tax brackets, and after-tax estate legacy.
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
            <footer className="py-12 border-t border-slate-800 bg-[#080d19] text-center text-xs text-slate-500">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                        <span className="font-bold text-slate-400 text-sm">Planfolio Canada</span>
                        <div className="flex gap-4">
                            <Link href="/" className="text-slate-400 hover:text-white text-decoration-none">Home</Link>
                            <Link href="/features" className="text-slate-400 hover:text-white text-decoration-none">Features</Link>
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