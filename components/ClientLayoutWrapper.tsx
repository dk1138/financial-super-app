// components/ClientLayoutWrapper.tsx

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
  
  // Hides GlobalHeader on homepage, features, and all /tools pages
  const isMarketingPage = pathname === "/" || pathname === "/features" || pathname?.startsWith("/tools");

  return (
    <SessionWrapper>
      <FinanceProvider>
        <LanguageProvider>
          {!isMarketingPage && <GlobalHeader />}
          <main>
            {children}
          </main>
          <Analytics />
          <SpeedInsights />
        </LanguageProvider>
      </FinanceProvider>
    </SessionWrapper>
  );
}