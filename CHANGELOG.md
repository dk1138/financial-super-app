# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2026-11-24]

### Security
- **Untracked `.env.local` & added `.env.example` (`.gitignore`, `.env.example`)**: Removed `.env.local` from Git tracking so secrets are never committed, and added `.env.example` documenting required environment variables (`RESEND_API_KEY`, `FEEDBACK_TO_EMAIL`, `IMGUR_CLIENT_ID`, `EXPENSES_DEV_PASSCODE`).
- **HTTP security headers (`next.config.ts`)**: Added global `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`, and `Strict-Transport-Security` headers.
- **Server-side `/expenses` developer auth (`app/api/expenses-auth/route.ts`, `app/expenses/page.tsx`)**: Replaced hardcoded client-side passcode with a rate-limited server endpoint using `EXPENSES_DEV_PASSCODE`, `crypto.timingSafeEqual`, and an `HttpOnly` session cookie.
- **Hardened Feedback & Image Upload API routes (`app/api/auth/feedback/route.ts`, `app/api/auth/upload-image/route.ts`, `lib/rateLimit.ts`)**: Added per-IP rate limiting, lazy `Resend` initialization, `FEEDBACK_TO_EMAIL` env var (removing hardcoded personal email), email/category sanitization, 5,000-char message cap, 5 MB attachment/image limits, strict image MIME-type validation (`image/png`, `image/jpeg`, `image/webp`), and removed the hardcoded fallback Imgur Client-ID and untrusted `x-imgur-client-id` header.
- **Tooltip HTML sanitization (`lib/sanitizeHtml.ts`, `components/SharedUI.tsx`)**: Added an allowlist HTML sanitizer to `InfoBtn` to strip scripts, iframes, and event handlers before rendering tooltips.

### Fixed
- **Complete 13-jurisdiction tax constants & OHP consolidation (`lib/config.js`, `lib/engine/tax.ts`)**: Added missing territorial (`YT`, `NT`, `NU`) entries for `PROV_BPA`, `PROV_DISABILITY_AMOUNT`, `PROV_DIV_CREDIT_ELIGIBLE`, and `PROV_DIV_CREDIT_NON_ELIGIBLE`; populated `PROV_PENSION_AMOUNT` across all 13 provinces and territories; and consolidated Ontario Health Premium calculation in `tax.ts` to read directly from `constants.ON_OHP_TIERS`.
- **Ontario Surtax & Dividend Tax Credit order (`lib/engine/tax.ts`)**: Applied the Ontario Dividend Tax Credit to Basic Ontario Tax *before* calculating Ontario Surtax per CRA Form ON428, and read the configured `taxData.ON.surtaxes` thresholds ($5,818 / $7,446) instead of falling back to stale 2024 thresholds ($5,554 / $7,108).
- **Real-dollar discounting in Compare tab (`components/CompareTab.tsx`)**: Discounted each year's tax and expenses individually by its own year before summing instead of discounting lifetime nominal totals by the final year. Aligned both active and comparison plans (metrics and chart) to use the active `useRealDollars` toggle.
- **Stale favicon metadata (`app/layout.tsx`)**: Removed the `/favicon.ico` reference after migrating to `icon.svg`.

### Removed
- **Conflicting & duplicate files**: Removed typoed `public/robots,txt` (superseded by `app/robots.ts`), static `public/sitemap.xml` (conflicted with dynamic `app/sitemap.ts`), duplicate `components/tools/[slug]/page.tsx`, and unused legacy scripts (`lib/worker.js`, `lib/optimizers.js`, `lib/cppEngine.js`).
- **Unused dependencies (`package.json`)**: Removed unused `chart.js`, `react-chartjs-2`, and `react-countup`.

### Changed
- **Stabilized Zustand store actions & added granular selector hooks (`lib/FinanceContext.tsx`, `lib/types.ts`)**: Extracted singleton `financeActions` (preventing closure re-allocations across renders), exported slice selector hooks (`useFinanceData`, `useFinanceResults`, `useFinancePlanScore`, `useFinanceIsCalculating`, `useFinanceMonteCarlo`, `useFinanceActions`), and added the `TimelineYear` interface for typed simulation timelines.
- **Scoped `FinanceProvider` off static marketing pages (`components/ClientLayoutWrapper.tsx`)**: Mounted `FinanceProvider` (and its background Web Worker) only on interactive routes (`/planner`, `/tools/*`, `/expenses`) so landing/marketing pages load faster without running background simulations.
- **Offloaded Compare & Monte Carlo simulations to Web Worker (`lib/engine/monteCarlo.ts`, `lib/financeWorker.ts`, `components/risk/MonteCarloCard.tsx`, `components/CompareTab.tsx`)**: Moved both Monte Carlo and scenario comparison runs off the main UI thread with clean worker termination.
- **Theme-aware PNG exports & `<html lang>` sync (`components/DashboardTab.tsx`, `components/ProjectionTab.tsx`, `lib/LanguageContext.tsx`)**: Replaced hardcoded dark `#16181d` backgrounds in `html2canvas` exports with active Light/Dark theme detection, and synced `document.documentElement.lang` when switching between English and French.
- **Removed redundant CDN icon stylesheet & starter SVGs (`app/planner/layout.tsx`, `public/`)**: Removed duplicate `bootstrap-icons` CDN link (already bundled locally), deleted unused Next.js starter SVGs, and compressed `public/preview-summary.png`.
- **Updated site favicon & brand icons (`app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `public/icon-192.png`, `public/icon-512.png`, `public/manifest.json`, `app/layout.tsx`)**: Replaced the old blue SVG icon with the new Planfolio maple-leaf/growth-arrow icon across favicons, Apple touch icon, PWA manifest, and all in-app brand headers (`GlobalHeader`, `MarketingHeader`, `SplashScreen`, landing footer, and `ExecutiveReportModal`).
- **Replaced all native `alert()` and `confirm()` dialogs with non-blocking UI feedback (`components/SharedUI.tsx`)**: Added a reusable `ConfirmModal` portal component and eliminated all remaining browser `alert()` / `confirm()` popups across `CompareTab`, `DataBankTab`, `DataBankModal`, `MonteCarloCard`, and the Expense Tracker tabs.

### Added
- **60-Second Guided Onboarding Wizard & Canadian Persona Presets (`lib/personas.ts`, `components/OnboardingWizardModal.tsx`, `components/SplashScreen.tsx`, `app/planner/page.tsx`)**: Added a 4-step Quick Setup Wizard (Basics → Income & Spend → Savings & Home → Review) and 4 realistic 1-click Canadian persona templates (Toronto Starter Couple, Vancouver FIRE Single, Ottawa DB Pension Couple, Calgary Retiring at 60), accessible from both the SplashScreen and the Inputs tab.
- **1-Click Auto-Optimize Strategy Matrix (`lib/engine/strategyMatrix.ts`, `lib/financeWorker.ts`, `components/StrategyMatrixCard.tsx`, `components/StrategyTab.tsx`)**: Benchmarks 7 Canadian retirement strategies in the background Web Worker (Current Setup, RRSP Meltdown + Pension Split, OAS Clawback Shield, Defer CPP/OAS to 70, Early CPP at 60, Classic Order, and TFSA-First), ranks them by After-Tax Estate or Lowest Lifetime Tax, and applies any winning strategy in 1 click.
- **Global Error Boundary (`app/error.tsx`)**: Added a Next.js App Router error boundary with graceful recovery controls ("Try Again" / "Home") so runtime errors never leave users on a blank screen.
- **Engine & security unit tests (`lib/engine/tax.test.mjs`, `lib/engine/benefits.test.mjs`, `lib/engine/scoring.test.mjs`, `lib/security.test.mjs`, `package.json`)**: Added zero-dependency unit tests via Node's built-in `node:test` runner (`npm test`, 23 passing tests).
