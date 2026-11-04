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

    // Get 3 related tools from same or adjacent categories
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
        <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30 font-sans">
            {/* JSON-LD Schema for Google Rich Snippets */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* TOP NAVIGATION BAR */}
            <header className="sticky top-0 z-40 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
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
                            href="/tools"
                            className="text-slate-400 hover:text-white text-xs font-semibold text-decoration-none d-none d-sm-inline-flex align-items-center gap-1.5"
                        >
                            <i className="bi bi-grid-3x3-gap"></i>
                            <span>All 28 Tools</span>
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
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                {/* BREADCRUMB */}
                <nav className="d-flex align-items-center gap-2 text-xs text-slate-400 mb-4" aria-label="Breadcrumb">
                    <Link href="/" className="text-slate-400 hover:text-white text-decoration-none">Home</Link>
                    <span>/</span>
                    <Link href="/tools" className="text-slate-400 hover:text-white text-decoration-none">Calculators</Link>
                    <span>/</span>
                    <span className="text-blue-400 font-semibold">{tool.title}</span>
                </nav>

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

                {/* INTERACTIVE CALCULATOR CARD */}
                <div className="mb-10 max-w-xl mx-auto w-full">
                    <ToolRenderer toolKey={tool.toolKey} />
                </div>

                {/* CANADIAN STATUTORY CONTEXT & GUIDE */}
                <section className="mb-8 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-start">
                    <h2 className="text-lg font-bold text-white mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-info-circle text-blue-400"></i>
                        <span>How This Canadian Calculation Works</span>
                    </h2>
                    <p className="text-slate-300 text-sm leading-relaxed mb-0">
                        {tool.overview}
                    </p>
                </section>

                {/* FAQ SECTION */}
                <section className="mb-8 text-start">
                    <h2 className="text-lg font-bold text-white mb-4 d-flex align-items-center gap-2">
                        <i className="bi bi-question-circle text-emerald-400"></i>
                        <span>Frequently Asked Questions</span>
                    </h2>
                    <div className="space-y-3">
                        {tool.faqs.map((faq, idx) => (
                            <div key={idx} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                                <h3 className="text-sm font-bold text-white mb-1.5">{faq.q}</h3>
                                <p className="text-slate-400 text-xs leading-relaxed mb-0">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* RELATED TOOLS CAROUSEL */}
                <section className="mb-8 text-start">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="text-base font-bold text-white mb-0">Related Canadian Calculators</h2>
                        <Link href="/tools" className="text-blue-400 hover:text-blue-300 text-xs font-semibold text-decoration-none">
                            View All 28 Tools →
                        </Link>
                    </div>
                    <div className="row g-3">
                        {relatedTools.map((rel) => (
                            <div key={rel.slug} className="col-12 col-md-4">
                                <Link
                                    href={`/tools/${rel.slug}`}
                                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-decoration-none d-flex flex-column h-100"
                                >
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className={`bi ${rel.icon} text-blue-400`}></i>
                                        <span className="text-xs font-bold text-white text-truncate">{rel.title}</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-snug line-clamp-2 mb-0">
                                        {rel.subtitle}
                                    </p>
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                {/* FULL SIMULATOR CTA BANNER */}
                <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-center shadow-xl mb-12">
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                        See how this fits into your full 40-year plan
                    </h2>
                    <p className="text-blue-100 text-xs sm:text-sm max-w-xl mx-auto mb-5 opacity-90">
                        Planfolio connects all 28 optimizers into a single unified cash flow and tax engine. Simulate lifelong wealth, spousal pensions, and estate legacy for free.
                    </p>
                    <Link
                        href="/planner"
                        className="bg-white text-blue-900 px-6 py-2.5 rounded-full font-bold text-xs hover:bg-slate-100 transition-all shadow-lg text-decoration-none d-inline-flex align-items-center gap-2"
                    >
                        <span>Open 100% Free Retirement Planner</span>
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="py-8 border-t border-slate-800 bg-[#080d19] text-center text-xs text-slate-500">
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