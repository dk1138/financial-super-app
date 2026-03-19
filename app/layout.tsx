import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import SessionWrapper from "../components/SessionWrapper"; 
import { FinanceProvider } from "../lib/FinanceContext";
import GlobalHeader from "../components/GlobalHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Financial Super App",
  description: "Advanced retirement forecasting and expense tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  // Note: suppressHydrationWarning stops React from throwing a mismatch error 
  // because the script below injects the dark/light theme before the page hydrates.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
        
        {/* Blocking script to apply the correct theme BEFORE the screen paints */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('appTheme') || 'dark';
                document.documentElement.setAttribute('data-bs-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <SessionWrapper> 
          <FinanceProvider>
            <div className="container-fluid pb-4 min-vh-100 transition-all position-relative d-flex flex-column" style={{ maxWidth: '1700px' }}>
              
              <GlobalHeader />
              
              <main className="flex-grow-1 d-flex flex-column">
                {children}
              </main>

            </div>
          </FinanceProvider>
          <Analytics />
        </SessionWrapper>
      </body>
    </html>
  );
}