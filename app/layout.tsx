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
  
  // Define the pages where we DON'T want the app header (e.g., the landing page)
  const isLandingPage = pathname === "/";

  return (
    <html lang="en">
      <head>
        {/* Load Bootstrap CSS from CDN */}
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" 
          rel="stylesheet" 
        />
      </head>
      <body className={inter.className}>
        <SessionWrapper>
          <FinanceProvider>
            {/* Only show the Global App Header if we are NOT on the landing page */}
            {!isLandingPage && <GlobalHeader />}
            
            <main>
              {children}
            </main>
          </FinanceProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}