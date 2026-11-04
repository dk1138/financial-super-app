import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOLS_BY_SLUG, ALL_TOOL_SLUGS, TOOLS_DATA } from '@/lib/toolsData';
import ToolRenderer from '@/components/tools/ToolRenderer';

interface PageProps {
    params: Promise<{ slug: string }>;
}

// Popular tools for the top quick-access button bar
const POPULAR_TOOLS = [
    { slug: 'pension-buyback', label: 'Pension Buyback', icon: 'bi-clock-history' },
    { slug: 'lif-to-rrif-unlocking', label: 'LIF 50% Unlocking', icon: 'bi-safe2-fill' },
    { slug: 'tfsa-vs-rrsp', label: 'TFSA vs RRSP', icon: 'bi-arrow-left-right' },
    { slug: 'cpp-optimizer', label: 'CPP & OAS Optimizer', icon: 'bi-calendar-check' },
    { slug: 'rrsp-sweet-spot', label: 'RRSP Sweet Spot', icon: 'bi-bullseye' },
    { slug: 'marginal-tax-curve', label: 'Marginal Tax Curve', icon: 'bi-graph-up-arrow' },
    { slug: 'buy-vs-rent', label: 'Buy vs Rent', icon: 'bi-house-door-fill' },
];

export function generateStaticParams() {
    return ALL_TOOL_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const tool = TOOLS_BY_SLUG[slug];
    if (!tool) {
        return {
            title: 'Tool Not Found | Planfolio',
            description: 'The requested financial calculator could not be found.',
        };
    }

    return {
        title: `${tool.title} | Free Canadian Calculator`,
        description: tool.subtitle,
        keywords: [
            tool.title,
            `${tool.title} Canada`,
            `${tool.title} calculator`,
            'Canadian financial calculator',
            'Planfolio retirement planner',
            tool.badge,
        ],
        alternates: {
            canonical: `https://www.planfolio.ca/tools/${tool.slug}`,
        },
        openGraph: {
            title: `${tool.title} | Planfolio Canada`,
            description: tool.subtitle,
            url: `https://www.planfolio.ca/tools/${tool.slug}`,
            type: 'website',
            siteName: 'Planfolio Canada',
            images: [
                {
                    url: '/preview-tools.png',
                    width: 1200,
                    height: 630,
                    alt: `${tool.title} on Planfolio`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${tool.title} | Planfolio Canada`,
            description: tool.subtitle,
            images: ['/preview-tools.png'],
        },
    };
}

export default async function ToolPage({ params }: PageProps) {
    const { slug } = await params;
    const tool = TOOLS_BY_SLUG[slug];

    if (!tool) {
        notFound();
    }

    // Get 3 related tools from other categories
    const relatedTools = TOOLS_DATA
        .filter((t) => t.slug !== tool.slug)
        .slice(0, 3);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'WebApplication',
                name: tool.title,
                url: `https://www.planfolio.ca/tools/${tool.slug}`,
                applicationCategory: 'FinanceApplication',
                operatingSystem: 'All',
                description: tool.subtitle,
                offers: {
                    '@type': 'Offer',
                    price: '0',
                    priceCurrency: 'CAD',
                },
            },
            {
                '@type': 'FAQPage',
                mainEntity: tool.faqs.map((faq) => ({
                    '@type': 'Question',
                    name: faq.q,
                    acceptedAnswer: {
                        '@type': 'Answer',
                        text: faq.a,
                    },
                })),
            },
        ],
    };

    return (
        <div data-bs-theme="dark" className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-blue-500/30 font-sans">
            {/* Scoped CSS to enforce high-contrast light text across Bootstrap controls and eliminate black-on-dark text */}
            <style dangerouslySetInnerHTML={{ __html: `
                .rp-card, [data-bs-theme="dark"] {
                    --bs-body-color: #f1f5f9 !important;
                    --bs-secondary-color: #94a3b8 !important;
                    --bs-body-bg: #0b0f17 !important;
                    --bs-card-bg: #141c2b !important;
                    --bs-border-color: #2c3b52 !important;
                }
                .form-label, label {
                    color: #94a3b8 !important;
                }
                .text-muted {
                    color: #94a3b8 !important;
                }
                .text-main {
                    color: #f8fafc !important;
                }
                p {
                    color: #cbd5e1 !important;
                }
                .form-control, .form-select, input {
                    color: #f8fafc !important;
                    background-color: #080c14 !important;
                    border-color: #2c3b52 !important;
                }
            `}} />

            {/* JSON-LD Schema for Google Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* TOP NAVIGATION BAR */}
            <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-5xl">
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
                            className="text-slate-400 hover:text-white text-xs font-semibold text-decoration-none d-none d-sm-inline-flex align-items-center gap-1.5"
                        >
                            <i className="bi bi-grid-3x3-gap"></i>
                            <span>Features Directory</span>
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

            {/* MAIN CONTENT CONTAINER */}
            <main className="container mx-auto px-4 py-6 max-w-4xl">
                {/* BREADCRUMB */}
                <nav className="d-flex align-items-center gap-2 text-xs text-slate-400 mb-3" aria-label="Breadcrumb">
                    <Link href="/" className="text-slate-400 hover:text-white text-decoration-none">Home</Link>
                    <span>/</span>
                    <Link href="/features" className="text-slate-400 hover:text-white text-decoration-none">Canadian Tools</Link>
                    <span>/</span>
                    <span className="text-blue-400 font-semibold">{tool.title}</span>
                </nav>

                {/* QUICK-ACCESS POPULAR CALCULATOR BUTTONS (Guaranteed to work without 404s) */}
                <div className="mb-6 pb-2 overflow-x-auto hide-scrollbar">
                    <div className="d-flex align-items-center gap-2 text-nowrap">
                        <span className="text-xs font-bold text-slate-400 me-1 d-none d-md-inline-flex align-items-center gap-1">
                            <i className="bi bi-lightning-charge text-warning"></i>
                            <span>Quick Tools:</span>
                        </span>
                        {POPULAR_TOOLS.map((p) => {
                            const isActive = p.slug === tool.slug;
                            return (
                                <Link
                                    key={p.slug}
                                    href={`/tools/${p.slug}`}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold text-decoration-none transition-all d-inline-flex align-items-center gap-1.5 ${
                                        isActive 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 border border-blue-500' 
                                            : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                                    }`}
                                >
                                    <i className={`bi ${p.icon} ${isActive ? 'text-white' : 'text-blue-400'}`}></i>
                                    <span>{p.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* HERO HEADER */}
                <div className="mb-6 text-start">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-pill small fw-bold">
                            {tool.category}
                        </span>
                        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-pill small fw-bold">
                            {tool.badge}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                        {tool.title}
                    </h1>
                    <p className="text-slate-400 text-sm leading-relaxed mb-0">
                        {tool.subtitle}
                    </p>
                </div>

                {/* INTERACTIVE CALCULATOR CARD (Properly centered & naturally sized) */}
                <div className="mb-10 max-w-xl mx-auto w-full">
                    <ToolRenderer toolKey={tool.toolKey} />
                </div>

                {/* HOW THIS CANADIAN CALCULATION WORKS (Sleek Modern Editorial Design) */}
                <section className="mb-8 p-6 sm:p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 border-l-4 border-l-blue-500 text-start shadow-sm">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h2 className="text-base sm:text-lg font-bold text-white mb-0 d-flex align-items-center gap-2">
                            <i className="bi bi-info-circle text-blue-400"></i>
                            <span>How This Canadian Calculation Works</span>
                        </h2>
                        <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-pill small fw-semibold d-none d-sm-inline-block">
                            CRA Statutory Guide
                        </span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                        {tool.overview}
                    </p>
                    <div className="d-flex flex-wrap gap-2 pt-2 border-t border-slate-800/60" style={{ fontSize: '0.75rem' }}>
                        <span className="badge bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-pill">
                            ✓ CRA Compliance
                        </span>
                        <span className="badge bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-pill">
                            ✓ Provincial Formula Matching
                        </span>
                        <span className="badge bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-pill">
                            ✓ 100% Client-Side Privacy
                        </span>
                    </div>
                </section>

                {/* FREQUENTLY ASKED QUESTIONS (Single Unified Modern Accordion-Style Card) */}
                <section className="mb-8 text-start">
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-question-circle text-emerald-400 fs-5"></i>
                        <h2 className="text-base sm:text-lg font-bold text-white mb-0">Frequently Asked Questions</h2>
                    </div>

                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 divide-y divide-slate-800/70 overflow-hidden shadow-sm">
                        {tool.faqs.map((faq, idx) => (
                            <div key={idx} className="p-4 sm:p-5 hover:bg-slate-900/30 transition-colors">
                                <h3 className="text-sm font-bold text-white mb-2 d-flex align-items-start gap-2">
                                    <span className="text-blue-400 font-extrabold">Q:</span>
                                    <span>{faq.q}</span>
                                </h3>
                                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-0 ps-4">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* RELATED CANADIAN CALCULATORS (Clean Cards with Glowing Hover) */}
                <section className="mb-10 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="text-base font-bold text-white mb-0">Related Canadian Calculators</h2>
                        <Link href="/features" className="text-blue-400 hover:text-blue-300 text-xs font-semibold text-decoration-none">
                            View All Tools in Features →
                        </Link>
                    </div>
                    <div className="row g-3">
                        {relatedTools.map((rel) => (
                            <div key={rel.slug} className="col-12 col-md-4">
                                <Link
                                    href={`/tools/${rel.slug}`}
                                    className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-decoration-none d-flex flex-column h-100 shadow-sm"
                                >
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 d-flex align-items-center justify-content-center flex-shrink-0">
                                            <i className={`bi ${rel.icon} text-xs`}></i>
                                        </div>
                                        <span className="text-xs font-bold text-white text-truncate">{rel.title}</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 mb-0">
                                        {rel.subtitle}
                                    </p>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FULL SIMULATOR CALL-TO-ACTION (Streamlined Modern Gradient Card) */}
                <section className="p-7 sm:p-9 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-blue-950/60 border border-blue-500/30 text-center shadow-xl mb-12">
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                        See how this fits into your full 40-year plan
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-5 leading-relaxed">
                        Planfolio connects all 28 optimizers into a single unified cash flow and tax engine. Simulate lifelong wealth, spousal pensions, and estate legacy for free.
                    </p>
                    <Link
                        href="/planner"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-7 py-2.5 rounded-full font-bold text-xs shadow-lg shadow-blue-500/25 transition-all text-decoration-none d-inline-flex align-items-center gap-2"
                    >
                        <span>Open 100% Free Retirement Planner</span>
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="py-8 border-t border-slate-800/80 bg-[#080d19] text-center text-xs text-slate-500">
                <div className="container mx-auto px-4 max-w-4xl">
                    <p className="mb-2">
                        Planfolio is an educational simulation tool for Canadians. It does not provide certified legal, tax, or investment advice.
                    </p>
                    <p className="mb-0 text-slate-600">
                        © {new Date().getFullYear()} Planfolio Canada. 100% Client-Side Local Privacy.
                    </p>
                </div>
            </footer>
        </div>
    );
}