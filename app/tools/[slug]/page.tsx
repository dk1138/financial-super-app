/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: app/tools/[slug]/page.tsx
 * PURPOSE: Individual Standalone Calculator Dynamic Page
 * INSTRUCTION: Rename this file to 'page.tsx' and place it in 'app/tools/[slug]/'
 * =========================================================================
 */

import MarketingHeader from '@/components/MarketingHeader';
import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { TOOLS_BY_SLUG, ALL_TOOL_SLUGS, TOOLS_DATA } from '@/lib/toolsData';
import ToolRenderer from '@/components/tools/ToolRenderer';

interface PageProps {
    params: Promise<{ slug: string }>;
}

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
        title: `${tool.title} | Planfolio Canada`,
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

    // Wide tools that need a broader canvas (e.g. 2-column dashboards with charts)
    const isWideTool = tool.toolKey === 'buyvsrent' || tool.toolKey === 'mvi' || tool.toolKey === 'tax-curve';

    // Get 3 related standalone tools from other categories
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
            {/* Scoped CSS to enforce high-contrast light text across Bootstrap controls */}
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
                .form-control, .form-select, input:not([type="range"]) {
                    color: #f8fafc !important;
                    background-color: #080c14 !important;
                    border-color: #2c3b52 !important;
                }
                /* Eliminate black rectangle box behind range sliders */
                input[type="range"], .form-range {
                    background: transparent !important;
                    background-color: transparent !important;
                    border: none !important;
                    box-shadow: none !important;
                    padding: 0 !important;
                }
            `}} />

            {/* JSON-LD Schema for Google Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* TOP NAVIGATION BAR - Identical to Main Page, Features & Tools Directory */}
            <MarketingHeader />

            {/* MAIN CONTENT CONTAINER */}
            <main className="container mx-auto px-4 pt-28 sm:pt-32 pb-16 max-w-4xl">
                {/* TOOL HERO HEADER */}
                <div className="mb-8 text-start">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="badge bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-pill small fw-bold">
                            {tool.category}
                        </span>
                        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-pill small fw-bold">
                            {tool.badge}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                        {tool.title}
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-0">
                        {tool.subtitle}
                    </p>
                </div>

                {/* INTERACTIVE CALCULATOR CARD (Properly sized per tool type to prevent clipping) */}
                <div className={`mb-12 mx-auto w-full ${isWideTool ? 'max-w-4xl' : 'max-w-xl'}`} style={{ minHeight: '480px' }}>
                    <ToolRenderer toolKey={tool.toolKey} />
                </div>

                {/* HOW THIS CANADIAN CALCULATION WORKS */}
                <section className="mb-10 p-6 sm:p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 border-l-4 border-l-blue-500 text-start shadow-sm">
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

                {/* FREQUENTLY ASKED QUESTIONS */}
                <section className="mb-10 text-start">
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

                {/* RELATED CANADIAN CALCULATORS */}
                <section className="mb-12 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="text-base font-bold text-white mb-0">Related Canadian Calculators</h2>
                        <Link href="/tools" className="text-blue-400 hover:text-blue-300 text-xs font-semibold text-decoration-none">
                            View All Tools →
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {relatedTools.map((rel) => (
                            <Link
                                key={rel.slug}
                                href={`/tools/${rel.slug}`}
                                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-decoration-none d-flex flex-column h-100 shadow-sm group"
                            >
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 d-flex align-items-center justify-content-center flex-shrink-0">
                                        <i className={`bi ${rel.icon} text-xs`}></i>
                                    </div>
                                    <span className="text-xs font-bold text-white text-truncate group-hover:text-blue-300 transition-colors">{rel.title}</span>
                                </div>
                                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2 mb-0">
                                    {rel.subtitle}
                                </p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* FULL SIMULATOR CALL-TO-ACTION */}
                <section className="p-7 sm:p-9 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-blue-950/60 border border-blue-500/30 text-center shadow-xl mb-12">
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                        See how this fits into your full 40-year plan
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto mb-5 leading-relaxed">
                        Planfolio connects all your standalone calculations into a single unified cash flow and tax engine. Simulate lifelong wealth, pensions, and estate legacy for free.
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