import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import SessionWrapper from "../components/SessionWrapper"; 
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
  return (
    <html lang="en" data-bs-theme="dark">
      <head>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css" />
      </head>
      <body>
        <SessionWrapper> 
          {children}
          <Analytics />
        </SessionWrapper>
      </body>
    </html>
  );
}