"use client";

import { usePathname } from 'next/navigation';
import { Inter } from "next/font/google";
import "./globals.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import GlobalHeader from "@/components/GlobalHeader";
import SessionWrapper from "@/components/SessionWrapper";
import { FinanceProvider } from "@/lib/FinanceContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // ADD THIS: Exclude both the landing page AND the features page
  const isMarketingPage = pathname === "/" || pathname === "/features";

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionWrapper>
          <FinanceProvider>
            {/* Change this to use the new isMarketingPage variable */}
            {!isMarketingPage && <GlobalHeader />}
            
            <main>
              {children}
            </main>
          </FinanceProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}