/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: lib/toolsData.ts
 * PURPOSE: Pure Standalone Canadian Calculators Dataset (21 Tools)
 * INSTRUCTION: Replace your existing 'lib/toolsData.ts' with this file.
 * NOTE: Fully typed with overview, faqs, badge, and icon for Next.js SSR.
 * =========================================================================
 */

export interface ToolFaq {
    q: string;
    a: string;
}

export interface ToolMeta {
    slug: string;
    title: string;
    subtitle: string;
    category: string;
    toolKey: string;
    badge: string;
    icon: string;
    overview: string;
    faqs: ToolFaq[];
}

export const TOOLS_DATA: ToolMeta[] = [
    // --- 1. Pensions & Retirement Income ---
    {
        slug: 'retirement-sensitivity-heatmap',
        title: 'Retirement Age vs. Spend Heatmap & Max Safe Spend Solver',
        subtitle: 'Test 25 combinations of retirement age and monthly spending in a 5×5 Canadian tax-aware sensitivity matrix, and solve for your maximum sustainable retirement budget.',
        category: 'Pensions & Retirement Income',
        toolKey: 'sensitivity',
        badge: '5×5 Sensitivity Matrix',
        icon: 'bi-grid-3x3-gap-fill',
        overview: 'Small shifts in retirement age or monthly spending can swing your lifetime Canadian estate by hundreds of thousands of dollars due to compounding, CPP/OAS deferral effects, and progressive tax brackets. This tool runs 25 full CRA-accurate retirement simulations across retire age (−4 to +4 years) and spending (−20% to +20%), alongside a binary-search Max Safe Spend Solver for a $0 (Die With Zero), $250k, or $500k target estate.',
        faqs: [
            {
                q: 'How does the Max Safe Retirement Spend Solver work?',
                a: 'It runs a 14-iteration binary search over your full Canadian retirement projection—including RRSP/RRIF withdrawals, TFSA draws, CPP/OAS, and provincial taxes—to find the highest monthly retirement budget that still ends with at least your chosen target estate.'
            },
            {
                q: 'What does the 5×5 Retirement Sensitivity Heatmap show?',
                a: 'Each cell runs an independent full-lifecycle simulation combining a retirement age offset (−4, −2, 0, +2, +4 years) with a retirement spending adjustment (−20%, −10%, 0%, +10%, +20%), showing your projected after-tax estate or exact shortfall age.'
            },
            {
                q: 'Are the results adjusted for Canadian inflation?',
                a: 'Yes. When Real Dollars mode is enabled in Planfolio, both the Max Safe Monthly Spend and the projected after-tax estate values in the heatmap are discounted back to today’s purchasing power.'
            }
        ]
    },
    {
        slug: 'coast-fire-calculator',
        title: 'Canadian Coast FIRE & Barista FIRE Calculator',
        subtitle: 'Find the exact portfolio size today where you can stop saving and let compounding carry you to retirement—or calculate your Barista FIRE semi-retirement target with CPP & OAS.',
        category: 'Pensions & Retirement Income',
        toolKey: 'coast-fire',
        badge: 'FIRE & Early Retirement',
        icon: 'bi-compass-fill',
        overview: 'Coast FIRE is the milestone where your existing invested portfolio (TFSA, RRSP, FHSA, Non-Registered) will grow to your full Financial Independence target by retirement age without adding another dollar of savings. Barista FIRE models stepping back to lower-stress part-time income while covering the rest from your portfolio. Unlike generic US calculators, this tool lets you factor in estimated Canadian CPP and OAS government pensions so you do not over-save.',
        faqs: [
            {
                q: 'What is a Coast FIRE number in Canada?',
                a: 'Your Coast FIRE number is your target FI portfolio discounted back to today using your expected real (inflation-adjusted) rate of return. Once your TFSA, RRSP, and investments cross this threshold, you only need to earn enough to cover current living expenses.'
            },
            {
                q: 'Should I include CPP and OAS in my Coast FIRE calculation?',
                a: 'Yes, for most Canadians planning to retire around age 60–65, CPP and OAS can cover $19,000–$34,000+ per year in inflation-indexed retirement income, dramatically reducing the portfolio you need to accumulate.'
            },
            {
                q: 'What is the difference between Coast FIRE and Barista FIRE?',
                a: 'With Coast FIRE, you stop contributing to investments and cover 100% of current expenses with work income until full retirement. With Barista FIRE, you begin drawing modestly from your portfolio early while part-time work covers the remaining living expenses.'
            }
        ]
    },
    {
        slug: 'pension-buyback',
        title: 'Defined Benefit Pension Buyback Calculator',
        subtitle: 'Evaluate if buying back past credited service is worth the upfront lump-sum cost, factoring in CRA tax deductions, early retirement dates, and guaranteed lifetime payouts.',
        category: 'Pensions & Retirement Income',
        toolKey: 'pensionbb',
        badge: 'CRA Line 20700',
        icon: 'bi-clock-history',
        overview: 'Buying back pensionable service in Canadian public and private defined benefit plans (such as OMERS, HOOPP, OTPP, and federal public service) allows you to purchase uncredited years of service. Under CRA rules (ITA 60(j) and Line 20700), qualified past service pension buybacks are 100% tax-deductible against your employment income. This calculator determines the net after-tax cost, internal rate of return (IRR), and the exact break-even age for the buyback.',
        faqs: [
            {
                q: 'Is a defined benefit pension buyback tax deductible in Canada?',
                a: 'Yes. Qualifying past service pension contributions for post-1989 service are fully tax-deductible on Line 20700 of your T1 General return. For large buybacks, you can carry forward unused deductions or fund the purchase via a direct tax-free transfer from an existing RRSP.'
            },
            {
                q: 'What is a Past Service Pension Adjustment (PSPA)?',
                a: 'When you buy back pension service, your employer submits a PSPA to the CRA, which reduces your current accumulated RRSP contribution room to reflect the additional lifetime retirement benefits earned.'
            },
            {
                q: 'How do I know if buying back pension years is worth it?',
                a: 'A buyback is generally financially advantageous if you plan to stay with your employer until retirement, if it allows you to hit an unreduced pension threshold (such as Factor 85 or 90) several years earlier, or if the guaranteed indexed payout exceeds conservative portfolio return assumptions.'
            }
        ]
    },
    {
        slug: 'pension-commuted-value-vs-annuity',
        title: 'Pension Commuted Value vs Monthly Pension',
        subtitle: 'Evaluate whether to accept a commuted value lump-sum transfer to a LIRA or keep a guaranteed defined benefit monthly pension for life.',
        category: 'Pensions & Retirement Income',
        toolKey: 'pensioncv',
        badge: 'Lump Sum vs Annuity',
        icon: 'bi-briefcase',
        overview: 'When departing a defined benefit pension employer in Canada, you must choose between keeping a deferred monthly pension annuity or taking the Commuted Value (CV). The CV lump sum is split into an in-plan tax-sheltered transfer to a Locked-in Retirement Account (LIRA) under Maximum Transfer Value (MTV) rules, with any excess paid out as immediately taxable cash. This tool models the required annualized rate of return needed on the LIRA to replicate the pension annuity.',
        faqs: [
            {
                q: 'What is the Maximum Transfer Value (MTV) limit?',
                a: 'Section 8517 of the federal Income Tax Regulations sets the Maximum Transfer Value limit based on your age and pension benefit. Any portion of the commuted value exceeding this cap cannot enter a LIRA and is taxed as regular income in the year received unless offset by RRSP room.'
            },
            {
                q: 'Why do interest rates affect my pension commuted value?',
                a: 'Under Canadian Institute of Actuaries (CIA) standards, commuted values move inversely to bond yields. When benchmark interest rates decline, commuted value payout calculations rise substantially.'
            },
            {
                q: 'Who assumes investment and longevity risk with a commuted value?',
                a: 'Taking the commuted value shifts 100% of market return risk, sequence of returns risk, and longevity risk onto you. The monthly DB pension guarantees lifetime income backed by the pension fund.'
            }
        ]
    },
    {
        slug: 'lif-to-rrif-unlocking',
        title: 'LIF to RRIF 50% Unlocking Calculator',
        subtitle: 'Calculate your one-time 50% unlocking limit from a locked-in LIF or LIRA into an unlocked RRIF, eliminating future maximum withdrawal caps.',
        category: 'Pensions & Retirement Income',
        toolKey: 'lif-unlock',
        badge: 'ITA 60(l) Transfer',
        icon: 'bi-unlock',
        overview: 'Locked-in accounts (LIRA and LIF) originate from registered pension transfers and are governed by strict provincial or federal pension legislation. Most Canadian jurisdictions (including Federal, Ontario, and Alberta) permit a one-time 50% unlocking provision upon converting a LIRA to a Life Income Fund (LIF). The unlocked capital can be transferred tax-free into a regular RRIF, eliminating provincial maximum annual withdrawal ceilings.',
        faqs: [
            {
                q: 'When am I eligible to unlock 50% of my locked-in pension funds?',
                a: 'Under Ontario (FSRA) and Federal (OSFI) pension rules, you are eligible to execute a one-time 50% unlocking transfer within 60 days of converting your LIRA into a LIF or Life Annuity, typically after reaching age 55.'
            },
            {
                q: 'Do I have to pay income tax on the unlocked 50% amount?',
                a: 'No, provided the unlocked portion is rolled directly into an unlocked Registered Retirement Income Fund (RRIF) or regular RRSP via a direct T2033 tax-sheltered transfer.'
            },
            {
                q: 'Why would someone want to unlock 50% of their LIF?',
                a: 'Regular LIFs impose a mandatory maximum withdrawal cap each year to prevent premature exhaustion of pension funds. Unlocking 50% into a standard RRIF provides greater annual withdrawal flexibility for early retirement spending spikes.'
            }
        ]
    },

    // --- 2. Taxes, Registered Accounts & Government Benefits ---
    {
        slug: 'tfsa-contribution-room',
        title: 'TFSA Contribution Room & Penalty Calculator',
        subtitle: 'Calculate lifetime cumulative TFSA limit, track historical withdrawals, and prevent CRA 1%-per-month over-contribution penalties.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'tfsa-room',
        badge: 'CRA Limits',
        icon: 'bi-calendar-check',
        overview: 'The Tax-Free Savings Account (TFSA) limit accumulates annually for Canadian residents aged 18 and older. Any amount withdrawn from a TFSA is re-credited to your contribution room on January 1st of the following calendar year. Depositing money back in the same calendar year without available headroom results in a mandatory CRA 1% monthly penalty tax on the excess capital.',
        faqs: [
            {
                q: 'What is the lifetime TFSA limit for an eligible Canadian in 2026?',
                a: 'For an individual who turned 18 prior to 2009 and has resided in Canada continuously, cumulative statutory TFSA contribution room exceeds $100,000 as of 2026.'
            },
            {
                q: 'How does the CRA penalize TFSA over-contributions?',
                a: 'The CRA assesses a strict 1% tax per month on the highest excess TFSA amount for every month (or part month) the excess capital remains in the account under Form RC243.'
            },
            {
                q: 'When do my TFSA withdrawals get added back to my contribution room?',
                a: 'TFSA withdrawals do not create immediate replacement room. All withdrawals are added back to your contribution room on January 1 of the following calendar year.'
            }
        ]
    },
    {
        slug: 'rrsp-sweet-spot',
        title: 'RRSP Tax Deduction Sweet Spot Calculator',
        subtitle: 'Find the exact dollar contribution that maximizes tax relief without dropping income into a lower federal or provincial marginal tax bracket.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'sweetspot',
        badge: 'CRA Sweet Spot',
        icon: 'bi-bullseye',
        overview: 'Because Canada uses progressive federal and provincial tax brackets, contributing excessively to an RRSP in a single tax year can push your net income into a much lower marginal tax bracket where tax relief diminishes. This optimizer calculates the exact dollar threshold where your marginal tax savings drop, and recommends carrying forward remaining deduction room to future higher-earning years.',
        faqs: [
            {
                q: 'What is the RRSP deduction sweet spot?',
                a: 'The sweet spot is the exact contribution amount that reduces your taxable income down to the edge of your current marginal tax bracket, capturing the maximum tax refund percentage on every dollar deposited.'
            },
            {
                q: 'Can I contribute to my RRSP now and deduct it in a future tax year?',
                a: 'Yes. You can report your RRSP contribution on Schedule 7 of your current T1 return to establish eligibility, but choose to defer claiming the deduction until a future tax year when your income is higher.'
            },
            {
                q: 'What is the annual CRA RRSP contribution ceiling?',
                a: 'The annual limit is 18% of your previous year earned income up to the statutory CRA maximum dollar threshold ($32,490 for 2025, indexed for 2026), plus any unused contribution room carried forward.'
            }
        ]
    },
    {
        slug: 'rrsp-refund-gross-up',
        title: 'RRSP Refund Gross-Up Calculator',
        subtitle: 'Calculate the short-term catch-up loan required to pre-fund and reinvest your tax refund back into your RRSP in the same tax year.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'grossup',
        badge: 'Refund Catch-Up',
        icon: 'bi-graph-up-arrow',
        overview: 'An RRSP gross-up is an advanced financial technique where you borrow a calculated lump sum (often via a short-term line of credit or 90-day RRSP loan) to top up your personal contribution before the annual 60-day March deadline. When your CRA tax refund arrives 4 to 6 weeks later, it matches the borrowed principal exactly, paying off the loan in full with minimal interest cost.',
        faqs: [
            {
                q: 'How is the gross-up contribution calculated?',
                a: 'The formula is: Total Contribution = Out-of-Pocket Cash / (1 - Marginal Tax Rate). For example, at a 40% marginal rate, $6,000 cash allows a total gross-up contribution of $10,000 ($6,000 cash + $4,000 loan), generating a $4,000 tax refund to repay the loan.'
            },
            {
                q: 'Is the interest on an RRSP catch-up loan tax-deductible in Canada?',
                a: 'No. Under Paragraph 18(11)(b) of the Income Tax Act, interest on funds borrowed to contribute to an RRSP, TFSA, FHSA, or RESP cannot be deducted against income.'
            },
            {
                q: 'What is the risk of an RRSP gross-up strategy?',
                a: 'The primary risk is unexpected tax liabilities elsewhere on your T1 return (e.g. self-employment tax, unwithheld capital gains) that reduce your net refund below the loan balance, requiring cash out of pocket.'
            }
        ]
    },
    {
        slug: 'fhsa-vs-rrsp',
        title: 'FHSA vs RRSP Home Buyers\' Plan Calculator',
        subtitle: 'Compare the tax-free growth and withdrawal benefits of the First Home Savings Account (FHSA) against the traditional $60k RRSP HBP.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'fhsa',
        badge: 'First-Time Buyer',
        icon: 'bi-house-check',
        overview: 'The First Home Savings Account (FHSA) combines the best tax features of an RRSP and a TFSA: contributions are 100% tax-deductible upon deposit, and qualifying home purchase withdrawals are 100% tax-free with zero repayment obligations. By contrast, the RRSP Home Buyers\' Plan (HBP) allows up to $60,000 of borrowing but mandates scheduled 15-year repayments back into your RRSP.',
        faqs: [
            {
                q: 'Can I use both the FHSA and the RRSP HBP on the same home purchase?',
                a: 'Yes. Eligible first-time Canadian homebuyers can combine their full FHSA balance with the $60,000 RRSP HBP withdrawal for a single residential real estate purchase.'
            },
            {
                q: 'Do I have to repay qualifying FHSA withdrawals?',
                a: 'No. Unlike the RRSP Home Buyers\' Plan, qualifying FHSA withdrawals for your first home are permanent and do not require any repayment.'
            },
            {
                q: 'What happens to my FHSA if I do not buy a home within 15 years?',
                a: 'You can transfer unused FHSA funds directly into your RRSP or RRIF tax-free on a rollover basis without using or requiring available RRSP contribution room.'
            }
        ]
    },
    {
        slug: 'resp-grant-maximizer',
        title: 'RESP CESG Grant Maximizer Calculator',
        subtitle: 'Optimize annual contributions to capture the maximum lifetime $7,200 Canada Education Savings Grant (CESG) match from the federal government.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'resp',
        badge: 'Education Match',
        icon: 'bi-mortarboard',
        overview: 'A Registered Education Savings Plan (RESP) allows parents and benefactors to save for a child post-secondary schooling. The Government of Canada provides the Canada Education Savings Grant (CESG), matching 20% on the first $2,500 of annual contributions per child ($500/year) up to a lifetime ceiling of $7,200. This tool designs the optimal contribution schedule to capture 100% of available grant funds.',
        faqs: [
            {
                q: 'Can I catch up on missed CESG grants from prior years?',
                a: 'Yes. If you missed contributions in past years, you can catch up on one previous year of unused entitlement per calendar year, contributing up to $5,000 to receive up to $1,000 in annual CESG.'
            },
            {
                q: 'What is the lifetime RESP contribution limit per child?',
                a: 'The lifetime contribution limit is $50,000 per beneficiary. Contributions are not tax-deductible, but investment growth is tax-sheltered until withdrawn.'
            },
            {
                q: 'How are RESP funds taxed upon withdrawal for university or college?',
                a: 'Original principal contributions (PSE) are withdrawn completely tax-free. Accumulated investment growth and CESG grants (EAP) are taxable in the student hands, who typically pays little to zero tax due to basic personal and tuition tax credits.'
            }
        ]
    },
    {
        slug: 'ccb-maximizer',
        title: 'Canada Child Benefit (CCB) Maximizer',
        subtitle: 'Calculate how reducing family net income through strategic RRSP contributions increases your tax-free monthly Canada Child Benefit checks.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'ccb',
        badge: 'Tax-Free Child Benefit',
        icon: 'bi-people',
        overview: 'The Canada Child Benefit (CCB) is a tax-free monthly federal payment for families raising children under age 18. CCB payments are calculated based on your prior year Adjusted Family Net Income (AFNI). Because RRSP contributions directly lower your Net Income (Line 23600), contributing to an RRSP can create an effective marginal return boost of 3.2% to 23% in additional tax-free CCB payments.',
        faqs: [
            {
                q: 'How does an RRSP contribution increase my Canada Child Benefit?',
                a: 'The CRA calculates CCB phase-outs based on Adjusted Family Net Income. An RRSP contribution directly reduces Line 23600, shrinking your clawback and increasing monthly CCB payments starting in July of the following benefit year.'
            },
            {
                q: 'Are Canada Child Benefit payments taxable as income?',
                a: 'No. All Canada Child Benefit (CCB) payments received from the CRA are 100% non-taxable and do not need to be reported as income on your T1 return.'
            },
            {
                q: 'What is the CCB clawback rate for two children?',
                a: 'Depending on your family net income bracket, the CCB clawback rate ranges between 3.2% and 23.0% of family income above statutory income thresholds, creating significant leverage for RRSP deductions.'
            }
        ]
    },
    {
        slug: 'medical-expense-optimizer',
        title: 'Medical Expense Tax Credit (METC) Optimizer',
        subtitle: 'Determine whether the lower-income spouse should claim household medical expenses to surpass the CRA 3% net income clawback threshold.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'medical',
        badge: 'Tax Deduction',
        icon: 'bi-heart-pulse',
        overview: 'The Medical Expense Tax Credit (METC) is a non-refundable federal credit on Line 33099/33199. Eligible medical costs must surpass an annual threshold: either 3% of your net income (Line 23600) or statutory dollar cap (indexed around $2,759), whichever is lower. Pooling all family medical receipts on the lower-income spouse return lowers the 3% barrier and produces a larger non-refundable tax credit.',
        faqs: [
            {
                q: 'Can spouses combine medical expenses on one tax return?',
                a: 'Yes. The CRA permits either spouse to claim all eligible medical expenses paid for themselves, their spouse or common-law partner, and dependent children under 18 in any 12-month period ending in the tax year.'
            },
            {
                q: 'Why should the lower-income spouse claim medical expenses?',
                a: 'Because the non-deductible threshold is 3% of net income, a spouse earning $40,000 only needs $1,200 of medical expenses to begin generating tax credits, compared to $3,000 for a spouse earning $100,000.'
            },
            {
                q: 'What medical expenses qualify for the METC in Canada?',
                a: 'Prescription drugs, dental services, vision care, private health insurance premiums (including payroll deductions), fertility treatments, and medically required travel qualify under CRA guidelines.'
            }
        ]
    },

    // --- 3. Mortgages, Real Estate & Cash Flow ---
    {
        slug: 'buy-vs-rent',
        title: 'Buy vs Rent Canadian Real Estate Analyzer',
        subtitle: 'Compare lifetime net worth between home ownership and renting while investing the down payment difference into low-cost index funds.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'buyvsrent',
        badge: 'Real Estate ROI',
        icon: 'bi-building',
        overview: 'Deciding whether to buy a home or rent and invest in Canada involves more than comparing monthly rent to a mortgage payment. This analyzer factors in unrecoverable homeownership costs (property taxes, condo maintenance fees, mortgage interest, transfer taxes, and 1% annual maintenance) against rent inflation, while projecting the compounded growth of an invested down payment in a TFSA/RRSP.',
        faqs: [
            {
                q: 'How does the Canadian Principal Residence Exemption impact the buy vs rent math?',
                a: 'Canada exempts capital gains on your primary home from income tax. However, investing inside a TFSA or primary RRSP also provides tax-sheltered compounding, making down payment opportunity costs a decisive factor.'
            },
            {
                q: 'What is the 5% rule in Canadian real estate?',
                a: 'The 5% rule estimates annual unrecoverable home costs: ~1% property tax + ~1% maintenance + ~3% cost of capital (mortgage interest or invested equity). If monthly rent is lower than 5% of home value divided by 12, renting is mathematically competitive.'
            },
            {
                q: 'What unrecoverable costs are unique to homeownership in Canada?',
                a: 'Provincial and municipal Land Transfer Taxes (especially in Toronto where double tax applies), realtor commissions on exit (typically 5% + HST), CMHC mortgage insurance premiums, and condo special assessments.'
            }
        ]
    },
    {
        slug: 'mortgage-affordability',
        title: 'Mortgage Affordability & Stress Test Calculator',
        subtitle: 'Calculate maximum borrowing limits under OSFI stress testing rules (contract rate + 2%) with strict GDS/TDS debt service ratio guardrails.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'afford',
        badge: 'OSFI B-20 Stress Test',
        icon: 'bi-shield-check',
        overview: 'Federally regulated Canadian mortgage lenders must qualify borrowers under OSFI Guideline B-20. The qualifying interest rate is the greater of your contract rate plus 2.00% or the Bank of Canada benchmark rate (5.25%). Borrowers must also satisfy strict Gross Debt Service (GDS ≤ 39%) and Total Debt Service (TDS ≤ 44%) ratios including property taxes and heating costs.',
        faqs: [
            {
                q: 'What is the OSFI Mortgage Stress Test in Canada?',
                a: 'The stress test requires mortgage applicants at chartered banks to prove they can afford monthly payments at an interest rate 2% higher than their offered contract rate, or 5.25%, whichever is higher.'
            },
            {
                q: 'What is the difference between GDS and TDS ratios?',
                a: 'GDS (Gross Debt Service) measures housing costs (mortgage + property tax + heating + 50% condo fees) against gross income (max 39%). TDS (Total Debt Service) includes housing costs PLUS all other consumer debts like car loans and credit cards (max 44%).'
            },
            {
                q: 'When is CMHC mortgage default insurance mandatory in Canada?',
                a: 'Default insurance (provided by CMHC, Sagen, or Canada Guaranty) is legally required on residential purchases where the down payment is less than 20% of the purchase price on homes under $1.5 million.'
            }
        ]
    },
    {
        slug: 'mortgage-renewal',
        title: 'Mortgage Renewal Rate Shock Calculator',
        subtitle: 'Model the payment jump on renewing low fixed-rate mortgages into current interest rate environments, and evaluate lump-sum prepayments.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'renewal',
        badge: 'Payment Shock',
        icon: 'bi-exclamation-triangle',
        overview: 'Hundreds of thousands of Canadian homeowners who locked in ultra-low mortgage rates during 2020-2021 are renewing at prevailing higher interest rates. This calculator quantifies the exact monthly payment jump upon renewal, and evaluates how executing an annual 10% to 20% penalty-free prepayment prior to renewal mitigates rate shock.',
        faqs: [
            {
                q: 'Can my existing lender decline my mortgage renewal?',
                a: 'In Canada, if your payments are in good standing, your existing lender will almost universally offer an automatic renewal without requiring you to re-qualify under the OSFI stress test.'
            },
            {
                q: 'Do I have to re-qualify under the stress test if I switch lenders at renewal?',
                a: 'Under recent OSFI rules, insured and uninsured borrowers switching lenders at renewal for a straight mortgage transfer with identical amortization no longer have to undergo the stress test at the new institution.'
            },
            {
                q: 'How much can I prepay on my mortgage without penalty before renewal?',
                a: 'Most Canadian standard closed mortgages permit annual penalty-free prepayments of 10% to 20% of the original principal balance, which goes directly toward paying down principal.'
            }
        ]
    },
    {
        slug: 'home-move-up',
        title: 'Home Move-Up & Closing Cost Calculator',
        subtitle: 'Quantify real estate realtor commissions, provincial land transfer taxes, and legal closing fees when upgrading to a larger home.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'moveup',
        badge: 'Real Estate Upsizing',
        icon: 'bi-house-up',
        overview: 'Trading up from a starter condo or townhouse to a detached home in Canada carries substantial friction costs that erode home equity. This tool calculates the combined impact of selling commissions (typically 5% + HST), municipal and provincial land transfer taxes on the new property, mortgage porting fees, legal disbursements, and title insurance.',
        faqs: [
            {
                q: 'Can I port my existing mortgage to a new home in Canada?',
                a: 'Most Canadian lenders offer mortgage porting, allowing you to transfer your existing balance, interest rate, and remaining term to your new property to avoid costly prepayment penalties.'
            },
            {
                q: 'How are Land Transfer Taxes calculated in Ontario and Toronto?',
                a: 'Ontario charges a tiered provincial land transfer tax up to 2.5% on amounts over $2 million. Buyers in Toronto pay an identical additional municipal land transfer tax, effectively doubling closing tax costs.'
            },
            {
                q: 'What is bridge financing in Canadian real estate?',
                a: 'Bridge financing is a short-term bank loan used when your new purchase closes before the sale of your existing home closes, bridging the temporary equity gap between transactions.'
            }
        ]
    },
    {
        slug: 'mortgage-vs-invest',
        title: 'Mortgage Payoff vs Investing Calculator',
        subtitle: 'Determine whether paying down a non-deductible mortgage yields higher risk-adjusted net worth than investing excess cash flow in registered accounts.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'mvi',
        badge: 'Debt vs Equity',
        icon: 'bi-piggy-bank',
        overview: 'Paying down your Canadian mortgage provides a 100% guaranteed, tax-free rate of return equal to your mortgage interest rate. To beat an accelerated mortgage prepayment, a non-registered investment portfolio must generate a substantially higher pre-tax return to account for taxes and market volatility. This tool compares mortgage prepayment against TFSA/RRSP and non-registered market returns.',
        faqs: [
            {
                q: 'Is mortgage prepayment return taxable in Canada?',
                a: 'No. Every dollar of mortgage interest avoided through prepayment is a guaranteed return that is 100% tax-free, making a 5.0% mortgage equivalent to a ~7.5% to 9.5% pre-tax investment return for high earners.'
            },
            {
                q: 'Should I prioritize my TFSA before paying extra on my mortgage?',
                a: 'If your expected long-term compounded return inside a tax-sheltered TFSA index fund (e.g. 7%-8%) exceeds your fixed mortgage rate, investing inside the TFSA typically yields higher lifetime net worth over 15+ years.'
            },
            {
                q: 'Is residential primary mortgage interest tax-deductible in Canada?',
                a: 'No. Unlike in the United States, mortgage interest paid on personal residences in Canada is non-deductible under the CRA Income Tax Act unless converted via the Smith Maneuver.'
            }
        ]
    },
    {
        slug: 'smith-maneuver',
        title: 'Smith Maneuver Debt Conversion Calculator',
        subtitle: 'Simulate converting non-deductible residential mortgage principal into tax-deductible investment debt via a readvanceable HELOC.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'smith',
        badge: 'HELOC Conversion',
        icon: 'bi-diagram-3',
        overview: 'The Smith Maneuver is a legal Canadian financial strategy developed under the Lipson and Singleton Supreme Court precedents. By using a readvanceable Home Equity Line of Credit (HELOC), every dollar of mortgage principal paid down is immediately re-borrowed to purchase income-producing non-registered investments. Under CRA Paragraph 20(1)(c), the HELOC interest becomes 100% tax-deductible against employment income.',
        faqs: [
            {
                q: 'What makes interest tax-deductible under CRA Paragraph 20(1)(c)?',
                a: 'Under the Income Tax Act, interest deductibility is determined solely by the current use of the borrowed funds: money must be borrowed with a reasonable expectation of earning gross income (dividends, interest, or rental income) from property.'
            },
            {
                q: 'Can I use Smith Maneuver borrowings to invest inside a TFSA or RRSP?',
                a: 'NO. Interest on money borrowed to invest inside registered accounts (TFSA, RRSP, FHSA, RESP) is strictly prohibited from being deducted against taxable income under Section 18(11) of the Income Tax Act.'
            },
            {
                q: 'What is a readvanceable mortgage in Canada?',
                a: 'A readvanceable mortgage couples an amortizing first mortgage with a linked HELOC. As regular monthly mortgage payments reduce loan principal, the HELOC credit limit automatically expands dollar-for-dollar up to OSFI regulatory limits.'
            }
        ]
    },
    {
        slug: 'reverse-mortgage',
        title: 'CHIP Reverse Mortgage Runout Calculator',
        subtitle: 'Forecast compounding interest and home equity erosion over 10 to 25 years when drawing non-taxable cash through a reverse mortgage.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'reversemortgage',
        badge: 'Home Equity',
        icon: 'bi-hourglass-split',
        overview: 'A Canadian reverse mortgage (provided by HomeEquity Bank or Equitable Bank) allows homeowners aged 55 and older to borrow up to 55% of their appraised home equity without making monthly mortgage payments. Interest compounds on the loan balance over time, with the debt repaid only when the property is sold or upon estate transfer. This calculator models loan compounding against home price appreciation.',
        faqs: [
            {
                q: 'Are reverse mortgage proceeds taxable as income in Canada?',
                a: 'No. All funds drawn from a reverse mortgage are borrowed capital and are 100% tax-free. They do not count as income for OAS or GIS pension clawback calculations.'
            },
            {
                q: 'What is the "No Negative Equity" guarantee in Canada?',
                a: 'Major Canadian reverse mortgage lenders guarantee that the total repayment amount will never exceed the fair market value of the home upon sale, protecting the borrower and estate from personal liability.'
            },
            {
                q: 'How does reverse mortgage interest compare to regular mortgage rates?',
                a: 'Reverse mortgage interest rates typically carry a premium of 1.5% to 2.5% above standard fixed or variable conventional mortgage rates due to the absence of ongoing principal and interest payments.'
            }
        ]
    },
    {
        slug: 'emergency-fund',
        title: 'Emergency Fund Lifestyle Runway Calculator',
        subtitle: 'Determine your true monthly non-discretionary baseline spending and required liquid safety buffer for 3, 6, or 12 months.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'emerg',
        badge: 'Liquidity Buffer',
        icon: 'bi-shield',
        overview: 'An emergency fund protects Canadian households against job loss, disability, or unexpected home/auto repairs without being forced to sell depressed equity holdings or carry 19.99% credit card balances. This calculator separates non-discretionary survival overhead (mortgage, groceries, utilities, insurance) from discretionary lifestyle spending to calculate true monthly runway.',
        faqs: [
            {
                q: 'Where is the best place to hold an emergency fund in Canada?',
                a: 'High-Interest Savings Accounts (HISA) or Cash-Alternative ETFs (e.g. CASH.TO, PSA, CSAV) held within a TFSA provide maximum liquidity and CDIC/CIPF safety with zero capital volatility.'
            },
            {
                q: 'How many months of living expenses should Canadians keep in cash?',
                a: 'Dual-income households with secure employment generally need 3 months of essential expenses, while sole proprietors, commissioned sales workers, or single-earner households should hold 6 to 9 months.'
            },
            {
                q: 'Should I use a HELOC as my primary emergency fund?',
                a: 'A HELOC can serve as a secondary liquidity backup, but Canadian chartered banks possess the legal right to reduce, freeze, or recall lines of credit at their discretion during macro credit crunches.'
            }
        ]
    },
    {
        slug: 'car-lease-vs-finance',
        title: 'Car Lease vs Finance & EV Incentive Calculator',
        subtitle: 'Evaluate total lifecycle cost between leasing, financing, or paying cash for a new vehicle, incorporating federal iZEV rebates.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'car',
        badge: 'Auto Finance',
        icon: 'bi-car-front',
        overview: 'Deciding whether to lease, finance, or purchase a new vehicle in Canada involves analyzing money factors, residual values, provincial sales tax (GST/PST/HST), and federal iZEV electric vehicle incentives up to $5,000. This tool projects total cost of ownership across 3 to 7 years, factoring in depreciation and opportunity cost of capital.',
        faqs: [
            {
                q: 'How does sales tax apply to car leases vs financing in Canada?',
                a: 'When you finance a car, you pay full provincial sales tax upfront on the entire purchase price. On a lease, you only pay sales tax each month on the monthly depreciation payment portion.'
            },
            {
                q: 'Can self-employed Canadians write off auto lease payments?',
                a: 'Yes. Under CRA rules (ITA Section 67.3), self-employed individuals and corporations can deduct qualifying vehicle lease costs up to monthly statutory caps (approx $1,050/mo + sales tax) based on verified business mileage logs.'
            },
            {
                q: 'What is the federal iZEV rebate in Canada?',
                a: 'The Transport Canada iZEV program provides point-of-sale purchase or lease incentives of up to $5,000 for qualifying zero-emission battery electric vehicles and long-range plug-in hybrids.'
            }
        ]
    },
    {
        slug: 'side-hustle-roi',
        title: 'Side Hustle & Self-Employment Tax ROI',
        subtitle: 'Calculate after-tax net profit from secondary 1099/T2125 business revenue after deducting CPP self-employment contributions and tax write-offs.',
        category: 'Mortgages, Real Estate & Cash Flow',
        toolKey: 'sidehustle',
        badge: 'T2125 Sole Prop',
        icon: 'bi-cash-coin',
        overview: 'Running a sole proprietorship, freelance business, or gig-economy side hustle in Canada requires reporting gross revenue and deducting business expenses on CRA Form T2125. Sole proprietors are legally required to pay both the employee and employer portions of Canada Pension Plan (CPP) contributions (approx 11.9% on net earnings between $3,500 and the YMPE limit), significantly impacting true net hourly return.',
        faqs: [
            {
                q: 'Do I have to pay double CPP on self-employment income in Canada?',
                a: 'Yes. As a self-employed Canadian, you must contribute both the employer (5.95%) and employee (5.95%) shares of CPP, totaling 11.9% on net business income between $3,500 and the annual CRA YMPE threshold on Schedule 8.'
            },
            {
                q: 'When am I legally required to register for GST/HST in Canada?',
                a: 'Under CRA rules, once your worldwide gross taxable revenue exceeds $30,000 across any single calendar quarter or four consecutive calendar quarters, you must register for and collect GST/HST.'
            },
            {
                q: 'What expenses can a Canadian sole proprietor write off on Form T2125?',
                a: 'Eligible deductions include home office expenses (calculated on square footage percentage), cell phone and internet costs, advertising and software subscriptions, professional dues, and vehicle business mileage.'
            }
        ]
    },
    {
        slug: 'oas-clawback-calculator',
        title: '2026 OAS Clawback & Effective Marginal Tax Rate Calculator',
        subtitle: 'Model the 15% Old Age Security recovery tax above $95,323, provincial surtaxes, GIS phase-outs, and true effective marginal tax rates across all 13 Canadian jurisdictions.',
        category: 'Tax & Registered Accounts',
        toolKey: 'tax-curve',
        badge: '2026 CRA Clawback',
        icon: 'bi-graph-up-arrow',
        overview: 'Statutory tax brackets hide the real cost of earning an extra dollar in Canadian retirement. Once Line 23400 net world income—including the 38% gross-up on eligible Canadian dividends—exceeds the 2026 CRA threshold of $95,323, Service Canada claws back 15 cents of Old Age Security per dollar (deductible on Line 23500). Combined with Ontario’s stacked 20%/36% surtaxes or low-income GIS phase-outs, effective marginal rates can spike past 50%–70%.',
        faqs: [
            {
                q: 'What is the OAS clawback threshold for the 2026 tax year?',
                a: 'For the 2026 tax year, the Old Age Security (OAS) recovery tax begins when individual net world income (Line 23400) exceeds $95,323, clawing back 15% of every dollar above that threshold until OAS is fully repaid.'
            },
            {
                q: 'Do Canadian dividends and TFSA withdrawals count toward OAS clawback?',
                a: 'TFSA withdrawals are 100% tax-free and excluded from OAS clawback. Eligible Canadian dividends, however, are included at 138% of the cash dividend received (the grossed-up taxable amount), which can unexpectedly push retirees over the $95,323 threshold.'
            },
            {
                q: 'Does the 15% OAS recovery tax reduce my taxable income?',
                a: 'Yes. On your T1 return, the OAS social benefits repayment is deducted on Line 23500 when calculating Line 23600 Net Income and Line 26000 Taxable Income, meaning the net combined marginal tax impact is 15% × (1 − your marginal income tax rate).'
            }
        ]
    },
    {
        slug: 'cpp-at-60-vs-65-vs-70',
        title: 'CPP & OAS Timing Optimizer: Age 60 vs. 65 vs. 70 Calculator',
        subtitle: 'Run a full lifecycle grid search across CPP (ages 60–70) and OAS (ages 65–70) start ages to find your exact break-even age and highest after-tax estate.',
        category: 'Pensions & Retirement Income',
        toolKey: 'cpp',
        badge: 'CPP/OAS Grid Search',
        icon: 'bi-calendar2-range-fill',
        overview: 'Taking Canada Pension Plan (CPP) early at age 60 permanently reduces benefits by 0.6% per month (−36%), while deferring to age 70 permanently increases CPP by 0.7% per month (+42%) and OAS by 0.6% per month (+36%, plus the automatic 10% boost at age 75). This optimizer tests every start-age combination against your RRSP meltdown, provincial tax brackets, and longevity horizon.',
        faqs: [
            {
                q: 'How much does deferring CPP from age 65 to 70 increase my pension?',
                a: 'Service Canada increases your inflation-indexed CPP retirement pension by 0.7% for each month you delay past age 65, up to a permanent 42% enhancement at age 70—on top of CPI wage/inflation adjustments.'
            },
            {
                q: 'Why can delaying CPP to age 70 reduce lifetime taxes?',
                a: 'Deferring CPP and OAS creates a low-income window in your 60s to melt down RRSP/RRIF balances in the 14% lowest federal tax bracket, shrinking future mandatory RRIF minimums at age 72 and avoiding the 15% OAS clawback.'
            },
            {
                q: 'What is the typical break-even age for taking CPP at 65 vs. 70?',
                a: 'On a pre-tax cash-flow basis, deferring CPP from 65 to 70 typically breaks even around age 81–83, though portfolio opportunity cost and RRSP tax-bracket arbitrage can shift your household break-even earlier or later.'
            }
        ]
    },
    {
        slug: 'rrsp-vs-tfsa',
        title: 'RRSP vs. TFSA Calculator Canada (2026)',
        subtitle: 'Compare after-tax retirement wealth between contributing to an RRSP (with tax-refund reinvestment) versus a TFSA under 2026 federal and provincial tax brackets.',
        category: 'Tax & Registered Accounts',
        toolKey: 'tfsavsrrsp',
        badge: 'RRSP vs. TFSA',
        icon: 'bi-intersect',
        overview: 'When your contribution marginal tax rate equals your retirement withdrawal marginal tax rate—and you reinvest the RRSP tax refund—an RRSP and TFSA produce identical after-tax wealth. In practice, progressive 2026 brackets ($33,810 RRSP limit, $7,000 TFSA limit), CCB income testing, and retirement OAS/GIS clawbacks tilt the math decisively toward one account depending on your career vs. retirement income.',
        faqs: [
            {
                q: 'When does an RRSP beat a TFSA in Canada?',
                a: 'An RRSP outperforms a TFSA when your current marginal tax rate (including any CCB boost from lowering AFNI) is higher than your expected effective marginal tax rate in retirement—provided you invest the tax refund rather than spending it.'
            },
            {
                q: 'When should Canadians prioritize a TFSA over an RRSP?',
                a: 'Prioritize a TFSA if you are in the lowest 14% federal bracket ($58,523 or less in 2026), expect higher income later in your career, or anticipate receiving income-tested GIS or hitting the $95,323 OAS clawback zone in retirement.'
            },
            {
                q: 'What are the 2026 RRSP and TFSA contribution limits?',
                a: 'For 2026, the CRA TFSA annual limit is $7,000 (plus unused carry-forward room and prior-year withdrawals), and new RRSP deduction room is 18% of prior-year earned income up to a maximum of $33,810.'
            }
        ]
    },
    {
        slug: 'gis-clawback-maximizer',
        title: 'GIS Clawback Shield & Low-Income Retirement Optimizer',
        subtitle: 'Protect Guaranteed Income Supplement (GIS) benefits from 50%–75% clawbacks by timing pre-65 RRSP meltdowns and TFSA-first retirement spending.',
        category: 'Pensions & Retirement Income',
        toolKey: 'gis-maximizer',
        badge: 'GIS Shield',
        icon: 'bi-shield-lock-fill',
        overview: 'For modest-income Canadian retirees, the Guaranteed Income Supplement (GIS) claws back 50 cents (and up to 75 cents with provincial top-ups) for every $1 of taxable RRIF or CPP income above statutory exemptions. Depleting modest RRSPs before age 65 and sheltering capital inside a TFSA can preserve thousands of dollars in tax-free annual GIS benefits.',
        faqs: [
            {
                q: 'Which retirement income sources trigger the 50% GIS clawback?',
                a: 'CPP benefits, RRSP/RRIF withdrawals, DB pensions, non-registered interest, capital gains, and grossed-up Canadian dividends all reduce GIS, whereas OAS payments and TFSA withdrawals are exempt.'
            },
            {
                q: 'Is employment income partially exempt from GIS clawback?',
                a: 'Yes. Service Canada exempts the first $5,000 of annual employment or self-employment income, and applies a 50% exemption on the next $10,000 (between $5,000 and $15,000), encouraging part-time work after age 65.'
            },
            {
                q: 'Why can holding a small RRSP past age 65 hurt low-income seniors?',
                a: 'Mandatory RRIF withdrawals starting at age 72 face an effective marginal rate exceeding 50%–70% once GIS clawback is included—far higher than the ~20% tax refund received when contributing in a modest bracket.'
            }
        ]
    },
    {
        slug: 'estate-terminal-tax',
        title: 'Canadian Estate & Terminal RRSP/RRIF Tax Calculator',
        subtitle: 'Estimate the CRA deemed-disposition tax bill on unspent RRSP/RRIF balances and unrealized non-registered capital gains on your final T1 return.',
        category: 'Tax & Registered Accounts',
        toolKey: 'estate-tax',
        badge: 'Terminal Return',
        icon: 'bi-file-earmark-Lock2',
        overview: 'Canada has no formal inheritance tax, yet the CRA treats death of the surviving spouse as a full cash-out event (ITA s. 70(5) and s. 146(8.8)). One hundred percent of remaining RRSP/RRIF/LIF balances and 50% of unrealized non-registered capital gains are added to income in a single tax year—often pushing estates into 50%+ top provincial brackets.',
        faqs: [
            {
                q: 'How are RRSPs and RRIFs taxed at death in Canada?',
                a: 'When the first spouse dies, RRSPs and RRIFs can roll over tax-deferred to a surviving spouse. On the death of the surviving (or single) spouse, 100% of the fair market value is taxed as ordinary income on the terminal T1 return.'
            },
            {
                q: 'What is the capital gains inclusion rate on deemed disposition at death in 2026?',
                a: 'Under 2026 CRA rules (following the March 2025 cancellation of the proposed tiered hike), 50% of unrealized capital gains on non-registered investments and secondary properties are taxable on the final return, while the principal residence remains exempt.'
            },
            {
                q: 'How does an RRSP meltdown reduce terminal estate taxes?',
                a: 'Systematically drawing down RRSP/RRIF funds in lower 20%–30% tax brackets during your 60s and 70s—and shifting surplus cash into TFSAs—prevents a massive lump-sum balance from being taxed at ~53% at death.'
            }
        ]
    },
    {
        slug: 'consumption-smoothing',
        title: 'Consumption Smoothing & Die With Zero Calculator',
        subtitle: 'Solve for your highest sustainable inflation-adjusted lifestyle spending from retirement through longevity, with an optional $0 Die With Zero or custom legacy target.',
        category: 'Pensions & Retirement Income',
        toolKey: 'smoother',
        badge: 'Die With Zero',
        icon: 'bi-sliders2',
        overview: 'Many diligent Canadian savers underspend in their healthiest Go-Go retirement years and unintentionally leave seven-figure taxable estates. This solver iterates across your full tax-adjusted retirement timeline—factoring in CPP/OAS start ages, RRIF minimums, and provincial taxes—to find the smooth real spending ceiling that hits your exact legacy goal.',
        faqs: [
            {
                q: 'What is consumption smoothing in retirement planning?',
                a: 'Consumption smoothing aligns your real inflation-adjusted spending power across pre-retirement and retirement years so you avoid over-saving early at the expense of life experiences or running short late in life.'
            },
            {
                q: 'How does the Die With Zero ($0 Legacy) preset work?',
                a: 'Setting Target Legacy to $0 instructs the binary-search solver to find the maximum annual after-tax lifestyle budget that exhausts liquid portfolio assets right at your chosen planning horizon while keeping housing equity intact unless downsized.'
            },
            {
                q: 'Does this solver account for taxes and OAS clawbacks on higher withdrawals?',
                a: 'Yes. Every candidate spending level runs through the full 2026 CRA progressive tax, RRIF minimum, and OAS recovery tax engine rather than a simplified 4% rule.'
            }
        ]
    },
    {
        slug: 'cpp-statement-calculator',
        title: 'Service Canada CPP Statement & CPP2 Benefit Calculator',
        subtitle: 'Import or enter your annual pensionable earnings history (1966–2026) to calculate exact base CPP, general drop-out years, and enhanced CPP2 retirement benefits.',
        category: 'Pensions & Retirement Income',
        toolKey: 'cppimport',
        badge: 'CPP & CPP2 Math',
        icon: 'bi-file-earmark-spreadsheet',
        overview: 'Service Canada’s online CPP estimates assume you keep earning your historical average right until age 65—significantly overstating benefits for early retirees (FIRE). By applying historical YMPE/YAMPE ceilings (up to $74,600 YMPE and $85,000 YAMPE in 2026) and the 17% general drop-out provision, this calculator computes your true CPP entitlement even if you stop working at 45, 50, or 55.',
        faqs: [
            {
                q: 'Why is My Service Canada Account’s CPP estimate wrong if I retire early?',
                a: 'Service Canada projects future earnings forward to age 65 at your past average. Every zero-earning year between early retirement and age 65 beyond your 17% general drop-out allowance (~8 years) reduces your base CPP by roughly 2.5% per year.'
            },
            {
                q: 'What are the 2026 YMPE and YAMPE limits for CPP and CPP2?',
                a: 'For 2026, the Year’s Maximum Pensionable Earnings (YMPE) is $74,600 (5.95% employee CPP contribution above the $3,500 basic exemption), and the Year’s Additional Maximum Pensionable Earnings (YAMPE) for Tier-2 CPP2 is $85,000 (4.0% contribution between $74,600 and $85,000).'
            },
            {
                q: 'How does the 17% CPP general drop-out provision work?',
                a: 'Between age 18 and 65 (47 contributory years), Service Canada automatically drops your lowest 17% of earning months (up to 8 years / 96 months) before averaging your pensionable earnings.'
            }
        ]
    }
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
    return TOOLS_BY_SLUG[slug] || TOOLS_DATA.find((t) => t.slug === slug);
}

const EXTRA_ALIASES: Record<string, string> = {
    'oas-clawback-calculator-2026': 'oas-clawback-calculator',
    'marginal-tax-rate-calculator': 'oas-clawback-calculator',
    'rrsp-vs-tfsa-calculator-canada': 'rrsp-vs-tfsa',
    'cpp-60-vs-65-vs-70': 'cpp-at-60-vs-65-vs-70',
    'die-with-zero': 'consumption-smoothing',
    'die-with-zero-calculator': 'consumption-smoothing',
};

// Map both original slugs and canonical aliases so URLs like /tools/pension-buyback and /tools/pension-buyback-calculator both resolve
export const TOOLS_BY_SLUG: Record<string, ToolMeta> = TOOLS_DATA.reduce((acc, tool) => {
    acc[tool.slug] = tool;
    if (tool.slug.endsWith('-calculator')) {
        acc[tool.slug.replace(/-calculator$/, '')] = tool;
    } else {
        acc[`${tool.slug}-calculator`] = tool;
    }
    return acc;
}, {} as Record<string, ToolMeta>);

for (const [alias, canonicalSlug] of Object.entries(EXTRA_ALIASES)) {
    if (TOOLS_BY_SLUG[canonicalSlug]) {
        TOOLS_BY_SLUG[alias] = TOOLS_BY_SLUG[canonicalSlug];
    }
}

export const ALL_TOOL_SLUGS: string[] = Array.from(new Set([
    ...TOOLS_DATA.map((t) => t.slug),
    ...TOOLS_DATA.map((t) => t.slug.endsWith('-calculator') ? t.slug.replace(/-calculator$/, '') : `${t.slug}-calculator`),
    ...Object.keys(EXTRA_ALIASES),
]));