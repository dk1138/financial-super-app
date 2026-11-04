/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: lib/toolsData.ts
 * PURPOSE: Pure Standalone Canadian Calculators Dataset (21 Tools)
 * INSTRUCTION: Replace your existing 'lib/toolsData.ts' with this file.
 * NOTE: All non-standalone optimizers (CPP/OAS Grid Search, Die With Zero,
 * Consumption Smoothing, etc.) have been removed from this dataset.
 * =========================================================================
 */

export interface ToolMeta {
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    toolKey: string;
    badge: string;
    icon?: string;
}

export const TOOLS_DATA: ToolMeta[] = [
    // --- 1. Pensions & Retirement Income ---
    {
        slug: 'pension-buyback-calculator',
        title: 'Defined Benefit Pension Buyback Calculator',
        subtitle: 'Evaluate if buying back past credited service is worth the upfront lump-sum cost, factoring in CRA tax deductions, early retirement dates, and guaranteed lifetime payouts.',
        category: 'Pensions & Retirement Income',
        toolKey: 'pensionbb',
        badge: 'CRA Line 20700',
        icon: 'bi-clock-history',
    },
    {
        slug: 'pension-commuted-value-vs-annuity',
        title: 'Pension Commuted Value vs Monthly Pension',
        subtitle: 'Evaluate whether to accept a commuted value lump-sum transfer to a LIRA or keep a guaranteed defined benefit monthly pension for life.',
        category: 'Pensions & Retirement Income',
        toolKey: 'pensioncv',
        badge: 'Lump Sum vs Annuity',
        icon: 'bi-briefcase',
    },
    {
        slug: 'lif-to-rrif-unlocking-calculator',
        title: 'LIF to RRIF 50% Unlocking Calculator',
        subtitle: 'Calculate your one-time 50% unlocking limit from a locked-in LIF or LIRA into an unlocked RRIF, eliminating future maximum withdrawal caps.',
        category: 'Pensions & Retirement Income',
        toolKey: 'lif-unlock',
        badge: 'ITA 60(l) Transfer',
        icon: 'bi-unlock',
    },

    // --- 2. Taxes, Registered Accounts & Government Benefits ---
    {
        slug: 'tfsa-vs-rrsp-calculator',
        title: 'TFSA vs RRSP Comparison Calculator',
        subtitle: 'Compare the long-term wealth outcomes of investing in a Tax-Free Savings Account (TFSA) vs. a Registered Retirement Savings Plan (RRSP) based on your current and future tax brackets.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'tfsavsrrsp',
        badge: 'Tax Efficiency',
        icon: 'bi-arrow-left-right',
    },
    {
        slug: 'tfsa-contribution-room-calculator',
        title: 'TFSA Contribution Room & Penalty Calculator',
        subtitle: 'Calculate lifetime cumulative TFSA limit, track historical withdrawals, and prevent CRA 1%-per-month over-contribution penalties.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'tfsa-room',
        badge: 'CRA Limits',
        icon: 'bi-calendar-check',
    },
    {
        slug: 'rrsp-tax-sweet-spot-calculator',
        title: 'RRSP Tax Deduction Sweet Spot Calculator',
        subtitle: 'Find the exact dollar contribution that maximizes tax relief without dropping income into a lower federal or provincial marginal tax bracket.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'sweetspot',
        badge: 'CRA Sweet Spot',
        icon: 'bi-bullseye',
    },
    {
        slug: 'rrsp-refund-gross-up-calculator',
        title: 'RRSP Refund Gross-Up Calculator',
        subtitle: 'Calculate the short-term catch-up loan required to pre-fund and reinvest your tax refund back into your RRSP in the same tax year.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'grossup',
        badge: 'Refund Catch-Up',
        icon: 'bi-graph-up-arrow',
    },
    {
        slug: 'fhsa-vs-rrsp-first-time-home-buyer',
        title: 'FHSA vs RRSP Home Buyers\' Plan Calculator',
        subtitle: 'Compare the tax-free growth and withdrawal benefits of the First Home Savings Account (FHSA) against the traditional $60k RRSP HBP.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'fhsa',
        badge: 'First-Time Buyer',
        icon: 'bi-house-check',
    },
    {
        slug: 'resp-cesg-grant-maximizer',
        title: 'RESP CESG Grant Maximizer Calculator',
        subtitle: 'Optimize annual contributions to capture the maximum lifetime $7,200 Canada Education Savings Grant (CESG) match from the federal government.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'resp',
        badge: 'Education Match',
        icon: 'bi-mortarboard',
    },
    {
        slug: 'ccb-child-benefit-maximizer',
        title: 'Canada Child Benefit (CCB) Maximizer',
        subtitle: 'Calculate how reducing family net income through strategic RRSP contributions increases your tax-free monthly Canada Child Benefit checks.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'ccb',
        badge: 'Tax-Free Child Benefit',
        icon: 'bi-people',
    },
    {
        slug: 'medical-expense-tax-credit-optimizer',
        title: 'Medical Expense Tax Credit (METC) Optimizer',
        subtitle: 'Determine whether the lower-income spouse should claim household medical expenses to surpass the CRA 3% net income clawback threshold.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'medical',
        badge: 'Tax Deduction',
        icon: 'bi-heart-pulse',
    },

    // --- 3. Mortgages, Real Estate & Cash Flow ---
    {
        slug: 'buy-vs-rent-calculator',
        title: 'Buy vs Rent Canadian Real Estate Analyzer',
        subtitle: 'Compare lifetime net worth between home ownership and renting while investing the down payment difference into low-cost index funds.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'buyvsrent',
        badge: 'Real Estate ROI',
        icon: 'bi-building',
    },
    {
        slug: 'mortgage-affordability-stress-test',
        title: 'Mortgage Affordability & Stress Test Calculator',
        subtitle: 'Calculate maximum borrowing limits under OSFI stress testing rules (contract rate + 2%) with strict GDS/TDS debt service ratio guardrails.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'afford',
        badge: 'OSFI B-20 Stress Test',
        icon: 'bi-shield-check',
    },
    {
        slug: 'mortgage-renewal-rate-shock-calculator',
        title: 'Mortgage Renewal Rate Shock Calculator',
        subtitle: 'Model the payment jump on renewing low fixed-rate mortgages into current interest rate environments, and evaluate lump-sum prepayments.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'renewal',
        badge: 'Payment Shock',
        icon: 'bi-exclamation-triangle',
    },
    {
        slug: 'home-move-up-cost-calculator',
        title: 'Home Move-Up & Closing Cost Calculator',
        subtitle: 'Quantify real estate realtor commissions, provincial land transfer taxes, and legal closing fees when upgrading to a larger home.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'moveup',
        badge: 'Real Estate Upsizing',
        icon: 'bi-house-up',
    },
    {
        slug: 'mortgage-payoff-vs-investing-calculator',
        title: 'Mortgage Payoff vs Investing Calculator',
        subtitle: 'Determine whether paying down a non-deductible mortgage yields higher risk-adjusted net worth than investing excess cash flow in registered accounts.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'mvi',
        badge: 'Debt vs Equity',
        icon: 'bi-piggy-bank',
    },
    {
        slug: 'smith-maneuver-tax-deductible-debt-calculator',
        title: 'Smith Maneuver Debt Conversion Calculator',
        subtitle: 'Simulate converting non-deductible residential mortgage principal into tax-deductible investment debt via a readvanceable HELOC.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'smith',
        badge: 'HELOC Conversion',
        icon: 'bi-diagram-3',
    },
    {
        slug: 'reverse-mortgage-runout-calculator',
        title: 'CHIP Reverse Mortgage Runout Calculator',
        subtitle: 'Forecast compounding interest and home equity erosion over 10 to 25 years when drawing non-taxable cash through a reverse mortgage.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'reversemortgage',
        badge: 'Home Equity',
        icon: 'bi-hourglass-split',
    },
    {
        slug: 'emergency-fund-lifestyle-calculator',
        title: 'Emergency Fund Lifestyle Runway Calculator',
        subtitle: 'Determine your true monthly non-discretionary baseline spending and required liquid safety buffer for 3, 6, or 12 months.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'emerg',
        badge: 'Liquidity Buffer',
        icon: 'bi-shield',
    },
    {
        slug: 'car-lease-vs-finance-calculator',
        title: 'Car Lease vs Finance & EV Incentive Calculator',
        subtitle: 'Evaluate total lifecycle cost between leasing, financing, or paying cash for a new vehicle, incorporating federal iZEV rebates.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'car',
        badge: 'Auto Finance',
        icon: 'bi-car-front',
    },
    {
        slug: 'side-hustle-sole-proprietorship-roi',
        title: 'Side Hustle & Self-Employment Tax ROI',
        subtitle: 'Calculate after-tax net profit from secondary 1099/T2125 business revenue after deducting CPP self-employment contributions and tax write-offs.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'sidehustle',
        badge: 'T2125 Sole Prop',
        icon: 'bi-cash-coin',
    },
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
    return TOOLS_DATA.find((t) => t.slug === slug);
}

export const TOOLS_BY_SLUG: Record<string, ToolMeta> = TOOLS_DATA.reduce((acc, tool) => {
    acc[tool.slug] = tool;
    return acc;
}, {} as Record<string, ToolMeta>);

export const ALL_TOOL_SLUGS: string[] = TOOLS_DATA.map((t) => t.slug);