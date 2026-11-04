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
    // Dynamically derive categories from TOOLS_DATA so it works regardless of dataset version
    const categories = Array.from(new Set((TOOLS_DATA || []).map((t) => t.category).filter(Boolean)));

    return (
        <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-blue-500/30 font-sans">
            {/* Scoped CSS to enforce high-contrast light text across Bootstrap controls */}
            <style dangerouslySetInnerHTML={{ __html: `
                .rp-card, [data-bs-theme="dark"] {
                    --bs-body-color: #f1f5f9 !important;
                    --bs-secondary-color: #94a3b8 !important;
                    --bs-body-bg: #0b0f17 !important;
                    --bs-card-bg: #141c2b !important;
                    --bs-border-color: #2c3b52 !important;
                }
                .text-muted { color: #94a3b8 !important; }
                .text-main { color: #f8fafc !important; }
            `}} />

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
            <main className="container mx-auto px-4 py-10 max-w-6xl text-start">
                <div className="text-center mb-12">
                    <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-pill small fw-bold text-uppercase ls-1">
                        Free Canadian Toolkit
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mt-3 mb-3">
                        Canadian Financial Tools
                    </h1>
                    <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed">
                        Every tool works completely on its own with zero prior planning or data entry required. Modeled specifically for CRA rules, provincial tax formulas, and local privacy.
                    </p>
                </div>

                {/* CATEGORIES & TOOLS GRID (Dynamic rendering guarantees cards always display) */}
                <div className="space-y-12">
                    {categories.length > 0 ? (
                        categories.map((cat) => {
                            const catTools = (TOOLS_DATA || []).filter((t) => t.category === cat);
                            if (catTools.length === 0) return null;

                            return (
                                <section key={cat}>
                                    <div className="d-flex align-items-center gap-2 mb-4 pb-2 border-bottom border-slate-800">
                                        <h2 className="text-xl font-bold text-white mb-0">{cat}</h2>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
                                        {catTools.map((tool) => (
                                            <Link
                                                key={tool.slug}
                                                href={`/tools/${tool.slug}`}
                                                className="p-5 rounded-2xl transition-all duration-200 text-decoration-none d-flex flex-column shadow-sm group"
                                                style={{
                                                    backgroundColor: '#141c2b',
                                                    border: '1px solid #2c3b52',
                                                    minHeight: '210px',
                                                }}
                                            >
                                                <div className="d-flex justify-content-between align-items-start mb-3">
                                                    <div 
                                                        className="d-flex align-items-center justify-content-center flex-shrink-0"
                                                        style={{ 
                                                            width: '42px', 
                                                            height: '42px', 
                                                            minWidth: '42px', 
                                                            minHeight: '42px',
                                                            backgroundColor: 'rgba(2, 132, 199, 0.15)',
                                                            border: '1px solid rgba(2, 132, 199, 0.3)',
                                                            borderRadius: '12px',
                                                            color: '#38bdf8'
                                                        }}
                                                    >
                                                        <i className={`bi ${tool.icon} fs-5`}></i>
                                                    </div>
                                                    <span 
                                                        className="badge px-2 py-1 rounded-pill"
                                                        style={{ 
                                                            backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                                                            color: '#94a3b8', 
                                                            border: '1px solid #334155',
                                                            fontSize: '10px' 
                                                        }}
                                                    >
                                                        {tool.badge}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                                                    {tool.title}
                                                </h3>
                                                <p className="text-xs leading-relaxed mb-4 flex-grow-1" style={{ color: '#94a3b8' }}>
                                                    {tool.subtitle}
                                                </p>

                                                <div className="d-flex align-items-center gap-1.5 text-xs font-bold text-info mt-auto pt-2.5 border-top border-secondary border-opacity-25">
                                                    <span>Open Tool</span>
                                                    <i className="bi bi-arrow-right"></i>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            );
                        })
                    ) : (
                        /* Direct fallback if categories cannot be parsed */
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
                            {(TOOLS_DATA || []).map((tool) => (
                                <Link
                                    key={tool.slug}
                                    href={`/tools/${tool.slug}`}
                                    className="p-5 rounded-2xl transition-all duration-200 text-decoration-none d-flex flex-column shadow-sm group"
                                    style={{
                                        backgroundColor: '#141c2b',
                                        border: '1px solid #2c3b52',
                                        minHeight: '210px',
                                    }}
                                >
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div 
                                            className="d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ 
                                                width: '42px', 
                                                height: '42px', 
                                                minWidth: '42px', 
                                                minHeight: '42px',
                                                backgroundColor: 'rgba(2, 132, 199, 0.15)',
                                                border: '1px solid rgba(2, 132, 199, 0.3)',
                                                borderRadius: '12px',
                                                color: '#38bdf8'
                                            }}
                                        >
                                            <i className={`bi ${tool.icon} fs-5`}></i>
                                        </div>
                                        <span 
                                            className="badge px-2 py-1 rounded-pill"
                                            style={{ 
                                                backgroundColor: 'rgba(15, 23, 42, 0.6)', 
                                                color: '#94a3b8', 
                                                border: '1px solid #334155',
                                                fontSize: '10px' 
                                            }}
                                        >
                                            {tool.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-base font-bold text-white mb-2 leading-snug">
                                        {tool.title}
                                    </h3>
                                    <p className="text-xs leading-relaxed mb-4 flex-grow-1" style={{ color: '#94a3b8' }}>
                                        {tool.subtitle}
                                    </p>

                                    <div className="d-flex align-items-center gap-1.5 text-xs font-bold text-info mt-auto pt-2.5 border-top border-secondary border-opacity-25">
                                        <span>Open Tool</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* BOTTOM CTA BANNER */}
                <section className="mt-16 p-8 sm:p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-center shadow-2xl">
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