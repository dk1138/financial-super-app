import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import 'bootstrap-icons/font/bootstrap-icons.css';
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.planfolio.ca"),
  title: {
    default: "Planfolio | Free Canadian Retirement, Tax & Cash Flow Planner (2026)",
    template: "%s | Planfolio",
  },
  description:
    "Free, local-first Canadian retirement & cash flow planner (EN/FR). Model 2026 CRA taxes across all 13 provinces, CPP/OAS clawback, RRSP meltdown, yearly P1 & P2 spreadsheets, Monte Carlo & historical crash stress tests, and 29 financial calculators with zero sign-up.",
  keywords: [
    "Canadian retirement calculator",
    "free retirement planner Canada",
    "Canadian retirement spreadsheet",
    "CPP calculator Canada",
    "OAS clawback calculator",
    "RRSP meltdown calculator",
    "TFSA vs RRSP Canada",
    "LIF to RRIF unlocking",
    "Monte Carlo retirement Canada",
    "financial independence Canada",
    "FIRE planner Canada",
    "defined benefit pension buyback calculator",
    "Smith Maneuver calculator",
    "Canada Child Benefit calculator",
    "retirement cash flow model Canada",
    "planificateur de retraite Canada",
  ],
  authors: [{ name: "Planfolio" }],
  creator: "Planfolio",
  publisher: "Planfolio",
  applicationName: "Planfolio",
  category: "finance",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://www.planfolio.ca",
  },
  verification: {
    google: "aYdqmsP28hZvvdyGiCuGXxqb7w2lab1qHTHD01Gemtc",
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    alternateLocale: ["fr_CA"],
    url: "https://www.planfolio.ca",
    siteName: "Planfolio Canada",
    title: "Planfolio | Free Canadian Retirement, Tax & Cash Flow Planner (2026)",
    description:
      "Free, local-first Canadian retirement planner (EN/FR). Model 2026 CRA taxes across all 13 provinces, CPP/OAS clawback, RRSP meltdown, yearly P1 & P2 spreadsheets, and 29 financial calculators with zero sign-up.",
    images: [
      {
        url: "/preview-summary.png",
        width: 1200,
        height: 630,
        alt: "Planfolio Canadian Retirement Planner Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planfolio | Free Canadian Retirement & Cash Flow Planner (2026)",
    description:
      "Free, local-first Canadian retirement planner. Model 13-province CRA taxes, CPP/OAS clawback, yearly P1 & P2 spreadsheets, Monte Carlo, and 29 financial calculators.",
    images: ["/preview-summary.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}