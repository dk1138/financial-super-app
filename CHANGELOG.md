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
- **Ontario Surtax & Dividend Tax Credit order (`lib/engine/tax.ts`)**: Applied the Ontario Dividend Tax Credit to Basic Ontario Tax *before* calculating Ontario Surtax per CRA Form ON428, and read the configured `taxData.ON.surtaxes` thresholds ($5,818 / $7,446) instead of falling back to stale 2024 thresholds ($5,554 / $7,108).
- **Real-dollar discounting in Compare tab (`components/CompareTab.tsx`)**: Discounted each year's tax and expenses individually by its own year before summing instead of discounting lifetime nominal totals by the final year. Aligned both active and comparison plans (metrics and chart) to use the active `useRealDollars` toggle.
- **Stale favicon metadata (`app/layout.tsx`)**: Removed the `/favicon.ico` reference after migrating to `icon.svg`.

### Removed
- **Conflicting & duplicate files**: Removed typoed `public/robots,txt` (superseded by `app/robots.ts`), static `public/sitemap.xml` (conflicted with dynamic `app/sitemap.ts`), duplicate `components/tools/[slug]/page.tsx`, and unused legacy scripts (`lib/worker.js`, `lib/optimizers.js`, `lib/cppEngine.js`).
- **Unused dependencies (`package.json`)**: Removed unused `chart.js`, `react-chartjs-2`, and `react-countup`.

### Changed
- **Offloaded Monte Carlo simulations to Web Worker (`lib/engine/monteCarlo.ts`, `lib/financeWorker.ts`, `components/risk/MonteCarloCard.tsx`)**: Extracted LHS/QHS shock generators and percentile aggregation into `lib/engine/monteCarlo.ts` and moved execution off the main UI thread into `financeWorker.ts` with streaming progress updates and clean worker termination.
- **Replaced native `alert()` dialogs with non-blocking UI feedback**: Replaced browser `alert()` popups with toast notifications and inline alerts in `MonteCarloCard.tsx`, `DataBankTab.tsx`, `ExpenseHeaderActions.tsx`, `ExpenseDashboardTab.tsx`, `ExpenseTransactionsTab.tsx`, and `ExpenseCategoriesTab.tsx`.

### Added
- **Engine unit tests (`lib/engine/tax.test.mjs`, `lib/engine/benefits.test.mjs`, `package.json`)**: Added zero-dependency unit tests via Node's built-in `node:test` runner (`npm test`) covering progressive brackets, inflation indexing, Ontario surtax thresholds, ON428 Dividend Tax Credit ordering, OAS clawback, Quebec abatement, CPP/EI tiers, Ontario Seniors Public Transit refundable credit, RRIF/LIF factors, CPP/OAS actuarial adjustments, and CCB calculations.
