/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: components/MarketingHeader.tsx
 * PURPOSE: Universal Navigation Bar for All Public / Marketing Pages
 * INSTRUCTION: Place this file in 'components/MarketingHeader.tsx'
 * =========================================================================
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MarketingHeader() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/#about', label: 'About', isRoute: false },
        { href: '/features', label: 'Features', isRoute: true },
        { 
            href: '/tools', 
            label: 'Tools', 
            badge: 'Free', 
            badgeColor: 'bg-blue-500/20 text-blue-400', 
            isRoute: true 
        },
        { 
            href: '/databank', 
            label: 'Data Bank', 
            badge: 'New', 
            badgeColor: 'bg-emerald-500/20 text-emerald-400', 
            isRoute: true 
        },
        { href: '/#how-it-works', label: 'How It Works', isRoute: false },
        { href: '/#privacy', label: 'Local-First Privacy', isRoute: false },
        { href: '/#pricing', label: 'Pricing', isRoute: false },
    ];

    const isLinkActive = (item: typeof navLinks[0]) => {
        if (!item.isRoute) return false;
        if (item.href === '/tools') return pathname?.startsWith('/tools');
        return pathname === item.href;
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800 marketing-nav">
            <style dangerouslySetInnerHTML={{ __html: `
                .marketing-nav {
                    width: 100% !important;
                }
                .marketing-nav-container {
                    width: 100% !important;
                    max-width: 100% !important;
                }
                .marketing-nav a {
                    text-decoration: none !important;
                }
                .marketing-nav a.marketing-nav-link {
                    color: #94a3b8 !important;
                    font-size: 0.875rem !important;
                    font-weight: 600 !important;
                    transition: color 0.15s ease-in-out !important;
                }
                .marketing-nav a.marketing-nav-link:hover {
                    color: #ffffff !important;
                }
                .marketing-nav a.marketing-nav-link.active-link {
                    color: #ffffff !important;
                    font-weight: 700 !important;
                }
                .marketing-nav .brand-name {
                    color: #ffffff !important;
                }
            `}} />

            <div className="marketing-nav-container w-full px-6 py-3.5 flex justify-between items-center" style={{ maxWidth: '100%' }}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <i className="bi bi-graph-up-arrow text-white text-base"></i>
                    </div>
                    <div className="flex flex-col text-start">
                        <span className="brand-name text-xl font-black tracking-tight text-white leading-none">Planfolio</span>
                        <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mt-0.5">Canada</span>
                    </div>
                </Link>
                
                {/* Navigation Links with Automatic Active-State Detection */}
                <div className="hidden lg:flex items-center gap-8 text-sm font-semibold">
                    {navLinks.map((item) => {
                        const active = isLinkActive(item);
                        return (
                            <Link 
                                key={item.label}
                                href={item.href} 
                                className={`marketing-nav-link ${
                                    active 
                                        ? 'active-link !text-white !font-bold' 
                                        : '!text-slate-400 hover:!text-white transition-colors'
                                } text-decoration-none flex items-center gap-1.5`}
                            >
                                <span>{item.label}</span>
                                {item.badge && (
                                    <span className={`${item.badgeColor} text-[10px] px-1.5 py-0.5 rounded-full font-bold`}>
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Primary Action Button */}
                <div className="flex items-center gap-3">
                    <Link 
                        href="/planner" 
                        className="bg-blue-600 hover:bg-blue-500 !text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 transition-all text-decoration-none flex items-center gap-1.5"
                    >
                        <span>Launch Planner</span>
                        <i className="bi bi-arrow-right"></i>
                    </Link>
                </div>
            </div>
        </nav>
    );
}