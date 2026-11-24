/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: components/ClientLayoutWrapper.tsx
 * PURPOSE: Global Client Wrapper for Providers, Analytics, and Header Switching
 * INSTRUCTION: Replace your existing 'components/ClientLayoutWrapper.tsx' with this file.
 * =========================================================================
 */

"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import GlobalHeader from "@/components/GlobalHeader";
import SessionWrapper from "@/components/SessionWrapper";
import { FinanceProvider } from "@/lib/FinanceContext";
import { LanguageProvider } from "@/lib/LanguageContext";
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Safely check if current page belongs to the marketing / public landing matrix (hide in-app GlobalHeader)
  const isMarketingPage = 
    pathname === "/" || 
    pathname === "/features" || 
    pathname?.startsWith("/tools") || 
    pathname === "/databank";

  // Only mount FinanceProvider (and its background Web Worker) on interactive routes that consume it
  const needsFinanceProvider =
    pathname?.startsWith("/planner") ||
    pathname?.startsWith("/tools/") ||
    pathname?.startsWith("/expenses");

  const content = (
    <LanguageProvider>
      {!isMarketingPage && <GlobalHeader />}
      <main>
        {children}
      </main>
      <Analytics />
      <SpeedInsights />
    </LanguageProvider>
  );

  return (
    <SessionWrapper>
      {needsFinanceProvider ? <FinanceProvider>{content}</FinanceProvider> : content}
    </SessionWrapper>
  );
}