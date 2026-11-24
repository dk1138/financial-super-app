# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

## [2026-11-24]

### Fixed
- **Ontario Surtax & Dividend Tax Credit order (`lib/engine/tax.ts`)**: Applied the Ontario Dividend Tax Credit to Basic Ontario Tax *before* calculating Ontario Surtax per CRA Form ON428, and read the configured `taxData.ON.surtaxes` thresholds ($5,818 / $7,446) instead of falling back to stale 2024 thresholds ($5,554 / $7,108).
- **Real-dollar discounting in Compare tab (`components/CompareTab.tsx`)**: Discounted each year's tax and expenses individually by its own year before summing instead of discounting lifetime nominal totals by the final year. Aligned both active and comparison plans (metrics and chart) to use the active `useRealDollars` toggle.
- **Stale favicon metadata (`app/layout.tsx`)**: Removed the `/favicon.ico` reference after migrating to `icon.svg`.

### Removed
- **Conflicting & duplicate files**: Removed typoed `public/robots,txt` (superseded by `app/robots.ts`), static `public/sitemap.xml` (conflicted with dynamic `app/sitemap.ts`), duplicate `components/tools/[slug]/page.tsx`, and unused legacy scripts (`lib/worker.js`, `lib/optimizers.js`, `lib/cppEngine.js`).
- **Unused dependencies (`package.json`)**: Removed unused `chart.js`, `react-chartjs-2`, and `react-countup`.

### Added
- **Tax engine unit tests (`lib/engine/tax.test.mjs`, `package.json`)**: Added zero-dependency unit tests via Node's built-in `node:test` runner (`npm test`) covering progressive brackets, inflation indexing, Ontario surtax thresholds, ON428 Dividend Tax Credit ordering, OAS clawback, Quebec abatement, CPP/EI tiers, and Ontario Seniors Public Transit refundable credit.
