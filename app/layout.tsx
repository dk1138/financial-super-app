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
  return (
    <html lang="en" data-bs-theme="dark">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </head>
      <body>
        <SessionWrapper> 
          <FinanceProvider>
            <div className="container-fluid pb-4 min-vh-100 transition-all position-relative d-flex flex-column" style={{ maxWidth: '1700px' }}>
              
              {/* This navigation bar will now persist across all routes */}
              <GlobalHeader />
              
              {/* Next.js will swap the Planner and Expense Tracker in here */}
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