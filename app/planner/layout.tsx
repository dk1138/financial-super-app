"use client";

import { usePathname } from 'next/navigation';
import { Inter } from "next/font/google";
import "./globals.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import GlobalHeader from "@/components/GlobalHeader";
import SessionWrapper from "@/components/SessionWrapper";
import { FinanceProvider } from "@/lib/FinanceContext";
import { LanguageProvider } from "@/lib/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMarketingPage = pathname === "/" || pathname === "/features";

  return (
    <>
      {!isMarketingPage && <GlobalHeader />}
      <main>
        {children}
      </main>
    </>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionWrapper>
          <FinanceProvider>
            <LanguageProvider>
              <MainLayoutContent>
                {children}
              </MainLayoutContent>
            </LanguageProvider>
          </FinanceProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}