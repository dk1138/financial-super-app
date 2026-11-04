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
    default: "Planfolio | Canadian Retirement & Cash Flow Planner",
    template: "%s | Planfolio",
  },
  description:
    "Free, local-first Canadian retirement and cash flow planner. Model CPP, OAS clawback, all 13 provincial tax brackets, TFSA vs RRSP, LIF unlocking, and 28 specialized financial optimizers with zero sign-up.",
  keywords: [
    "Canadian retirement calculator",
    "retirement planner Canada",
    "CPP calculator",
    "OAS clawback calculator",
    "TFSA vs RRSP Canada",
    "LIF to RRIF unlocking",
    "financial independence Canada",
    "FIRE planner Canada",
    "defined benefit pension buyback calculator",
    "Smith Maneuver calculator",
    "Canada Child Benefit calculator",
    "retirement cash flow model",
  ],
  authors: [{ name: "Planfolio" }],
  creator: "Planfolio",
  publisher: "Planfolio",
  applicationName: "Planfolio",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
    url: "https://www.planfolio.ca",
    siteName: "Planfolio Canada",
    title: "Planfolio | Canadian Retirement & Cash Flow Planner",
    description:
      "Free, local-first Canadian retirement and cash flow planning. Model your real estate, CPP/OAS pensions, CRA tax brackets, and 28 financial optimizers with zero sign-up.",
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
    title: "Planfolio | Canadian Retirement & Cash Flow Planner",
    description:
      "Free, local-first Canadian retirement and cash flow planning. Model CPP/OAS, CRA taxes, and 28 financial optimizers.",
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