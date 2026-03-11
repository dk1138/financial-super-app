import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import SessionWrapper from "../components/SessionWrapper"; // <-- 1. Import the wrapper
import SplashScreen from "../components/SplashScreen"; // <-- Import the new Splash Screen
import "./globals.css";

export const metadata: Metadata = {
  title: "Retirement Planner Pro",
  description: "Advanced retirement forecasting and optimization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The data-bs-theme="dark" attribute below fixes the dark text issue!
  return (
    <html lang="en" data-bs-theme="dark">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </head>
      <body>
        <SplashScreen /> {/* <-- Add the Splash Screen right here */}
        
        <SessionWrapper> {/* <-- 2. Wrap your children and Analytics */}
          {children}
          <Analytics />
        </SessionWrapper>
      </body>
    </html>
  );
}