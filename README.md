1. Plan Tab (Inputs)"Expand All / Collapse All" Master Switch: A single button in the top header to expand or collapse all 10 cards at once when auditing a plan.Sticky Section Jump Bar: A compact horizontal pill bar (Personal, Income, Benefits, Portfolio, Real Estate, Expenses, Debts) at the top so users can jump straight to a section without long scrolling.Retirement Age Sync Shortcut: In couple mode, a small "Sync Partner" button beside Retirement Age or CPP/OAS Start Age to match dates in one click.2. Strategy Tab1-Click Decumulation Presets: Preset buttons above the drag-and-drop lists to instantly load common Canadian strategies:Tax-Efficient Flow: Non-Reg $\rightarrow$ RRSP/RRIF $\rightarrow$ TFSA (preserves tax shelter longest).Early Meltdown: RRSP/RRIF (to bracket cap) $\rightarrow$ Non-Reg $\rightarrow$ TFSA.Estate Maximizer: Non-Reg $\rightarrow$ RRIF Minimum $\rightarrow$ TFSA last (passes tax-free to beneficiaries).Clear Lock Indicator for Couple Accounts: When Split Annual Limits is toggled, visual player tags (P1 / P2) on draggable pills to eliminate ambiguity.3. Dashboard Tab (Summary)Safe Withdrawal Benchmark Tag: Beside the Initial Retirement Withdrawal Rate (e.g. 3.8%), add a quick status pill (< 4.0% Ideal in green, 4.0% - 5.0% Moderate in amber, > 5.0% Elevated Risk in red).Toggleable Asset Chart Legend: Clicking legend badges on the Net Worth Composition Over Time chart (e.g. clicking "Real Estate Equity") to show/hide that slice and inspect purely liquid financial assets.Net Estate Waterfall: A compact breakdown showing estimated final probate, deemed disposition tax on RRSP/RRIF/Non-Reg, and clean after-tax inheritance.4. Projection Tab5-Year Milestone Filter: A toggle switch (All Years vs 5-Year Milestones) so users can scan ages 55, 60, 65, 70, 75, 80, 85, 90 without scrolling through 45 rows.Sticky Year Column on Mobile / Narrow Screens: Pinning the Year & Events column to the left during horizontal scrolling so row context is never lost.Net Cash Margin Column: A subtle column showing annual discretionary wiggle room (Cash Sourced - Necessary Expenses & Taxes).5. Cash Flow TabPlayback Speed Toggle: Adding a speed control (1x / 2x) beside the timeline play button to scrub across 40 years smoothly.Annual Net Balance Badge: A quick header chip next to the year (Surplus: +$14,200 Re-invested or Deficit: Covered by Portfolio W/D) for instant clarity before opening the diagram.6. Risk Tab (Stress Testing)Median Depletion Age: When Monte Carlo success is under 100%, show the median age money ran out (e.g. Median Depletion: Age 87) so users know when the plan needs bolstering.Quick Scenario Comparison Cards: A 3-card summary comparing baseline success vs. Historical Stagflation vs. High Volatility (16%).7. Compare TabDifferences-Only Filter: A toggle on the side-by-side plan comparator (Show All Inputs vs Show Changed Inputs Only) that hides identical fields and highlights what actually changed (e.g. Retiring at 60 vs 63).8. Global UI & ReportingOne-Click Printable Executive Summary (@media print): A clean, printer-friendly style sheet that prints the Dashboard, Asset Mix, and 5-Year Projection onto 2–3 standard letter pages with dark ink stripped out.


Please implement the following three features in Planfolio:

1. One-Click "Pause" Scenario Toggles (What-If Sandbox)
- Add an active toggle switch (Pause / Active) next to each line item in Additional Incomes / Side Hustles, Rental Properties, and Expense Categories.
- When an item is paused, dim its row visually and exclude its cash flow from the active financeEngine projection without deleting or resetting the saved numbers.
- Allow users to quickly test scenarios (e.g., "What if I pause my side business?" or "What if we eliminate our second vehicle?") with a single click.

2. QR Code Instant Plan Transfer (Phone-to-Desktop Sync)
- In the GlobalHeader Save/Load menu, add an option to "Sync to Mobile via QR Code".
- Compress the current plan's JSON data (using lightweight lz-string or gzip compression) and render it as a scannable on-screen QR code.
- Add a corresponding "Scan / Import QR Code" camera or image reader option so users can point their phone camera at the screen and instantly load their entire financial plan onto their mobile browser with zero sign-up or cloud database needed.

3. Automatic Downsizing Cost Scaler (Housing Transitions)
- In the Housing Transitions card, add an optional "Downsizing Housing Cost Reduction" slider (e.g., 0% to 50%, defaulting to -25%) whenever a property sale or downsize event is scheduled.
- In financeEngine.ts, automatically scale down ongoing housing-related expenses (property taxes, utilities, and maintenance) by that percentage starting in the transition year, removing the need to manually build separate post-downsize expense phases.

I want to expand Planfolio by implementing the top-requested features identified from Canadian DIY retirement planning communities (including r/adviice). Please implement these features across our planner engine, standalone calculators, and UI:

### 1. Printable 2-Page Executive PDF Summary Report
- Add a clean "Download PDF Report" action in the planner that generates a printable 2-page executive summary.
- Page 1: Plan Summary & Executive KPIs (funded ratio, estimated retirement freedom age, net estate after terminal tax, annual spending target, and lifelong net worth chart).
- Page 2: 10-Year Decumulation Snapshot Table (CPP/OAS starting ages, annual tax brackets, registered vs non-registered withdrawals, and spousal income splitting balance).
- Format: Clean, high-contrast, print-friendly stylesheet (black/slate on white canvas) with Planfolio branding and zero reliance on external print servers.

### 2. Multi-Year Capital Expense Pre-Funding ("Expense Smoothing")
- Add an interactive optimizer for large lump-sum future goals (e.g., child home down payment gift, major renovation, vehicle upgrade, or bucket-list trip).
- Logic: Instead of taking a single-year withdrawal that spikes marginal tax brackets to 53.5% and triggers OAS clawbacks, calculate the tax savings of pre-funding the expense over a 3–5 year ramp-up period (e.g., pulling $25k/yr from RRSP within lower brackets into a TFSA/cash buffer).
- Output: Side-by-side comparison showing "Lump-Sum in Target Year" vs. "3-to-5 Year Tax-Smoothed Pre-Funding" with exact lifetime tax dollars saved and OAS clawback preserved.

### 3. Native Canadian RDSP (Registered Disability Savings Plan) Calculator
- Create a standalone calculator at `/tools/rdsp-maximizer` and integrate RDSP accounts into the full simulator.
- Statutory Rules:
  - Canada Disability Savings Grant (CDSG): 300% on first $500, 200% on next $1,000, up to $3,500/yr (with carry-forward tracking up to $10,500/yr).
  - Canada Disability Savings Bond (CDSB): Up to $1,000/yr for lower-income households.
  - 10-Year Proportional Repayment Rule (Assistance Holdback Amount).
  - Lifetime Disability Assistance Payment (LDAP) statutory formula: Balance ÷ (83 - Beneficiary Age + 1).

### 4. Quebec QPP Deferral Extension (Up to Age 72)
- Update provincial pension settings to allow Quebec Pension Plan (QPP) recipients to model deferral up to age 72 under Quebec Bill 17 (+0.7%/month or +8.4%/year bonus beyond age 65, reaching +58.8% permanent boost at age 72).
- Add automatic provincial toggle between federal CPP (caps at age 70) and Quebec QPP (caps at age 72).

### 5. Early Lifetime Gifting vs. Estate Terminal Tax Optimizer
- Build a standalone optimizer at `/tools/lifetime-gifting-vs-estate-tax`.
- Compare the family wealth impact of:
  - Keeping capital in registered accounts / taxable non-reg until death (subject to terminal RRSP liquidation up to 53.5% + 50% capital gains inclusion + provincial probate).
  - Systematically gifting annual sums to adult children during retirement to maximize their own TFSAs, FHSAs, or mortgage prepayments while the parents are in lower tax brackets.

### 6. Corporate HoldCo / OpCo Decumulation & Dividend Meltdown Tool
- Add a specialized calculator at `/tools/corporate-dividend-meltdown` for incorporated Canadian business owners and professionals (physicians, tech consultants).
- Model:
  - Capital Dividend Account (CDA) tax-free distributions.
  - Optimal balance between salary (to generate RRSP room/CPP) vs. eligible/non-eligible dividends.
  - Refundable Dividend Tax on Hand (RDTOH) refund capture.
  - Avoidance of the passive investment income grind on the $500,000 Small Business Deduction (SBD).

### 7. Projection Table Usability Upgrades
- Undo / Redo: Add simple history stack so users can test overrides without fearing data loss.
- Cell Notes: Allow users to click or hover over any overridden cell in the projection table to leave a brief text note (e.g., "Downsized primary residence").
- Auto-Hide Empty Accounts: Add a toggle to automatically collapse columns with $0 balances across all 40 years to eliminate unnecessary horizontal scrolling.
- Dismissible Alerts: Allow users to click "Acknowledge" on diagnostic warnings so they stay hidden once reviewed.

Please start by outlining the architecture changes, update `lib/toolsData.ts` and `app/sitemap.ts` to register new tools, and implement the features cleanly using our existing local-first design.