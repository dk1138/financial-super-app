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
        slug: 'tfsa-vs-rrsp',
        title: 'TFSA vs RRSP Comparison Calculator',
        subtitle: 'Compare the long-term wealth outcomes of investing in a Tax-Free Savings Account (TFSA) vs. a Registered Retirement Savings Plan (RRSP) based on your current and future tax brackets.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'tfsavsrrsp',
        badge: 'Tax Efficiency',
        icon: 'bi-arrow-left-right',
        overview: 'The fundamental mathematical difference between a TFSA and RRSP in Canada depends on the relationship between your marginal tax rate when contributing and your marginal tax rate when withdrawing. If your tax rate in retirement will be lower than today, the RRSP mathematically wins. If your tax rate will be equal or higher, the TFSA is superior or equal without triggering OAS pension clawbacks.',
        faqs: [
            {
                q: 'When does a TFSA beat an RRSP in Canada?',
                a: 'A TFSA outperforms an RRSP when your marginal tax rate at withdrawal is higher than when contributing (e.g. entry-level earners), or if future RRSP withdrawals would trigger the 15% Old Age Security (OAS) recovery tax or GIS clawbacks.'
            },
            {
                q: 'Do RRSP tax refunds count toward investment returns?',
                a: 'Yes. To make a true apples-to-apples comparison with a TFSA, the upfront tax refund generated by an RRSP contribution must be fully reinvested rather than spent on consumer goods.'
            },
            {
                q: 'Can TFSA withdrawals affect Canadian government benefit entitlements?',
                a: 'No. TFSA withdrawals are 100% tax-free and are completely excluded from net income calculations for OAS, GIS, and Canada Child Benefit (CCB) purposes.'
            }
        ]
    },
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
        title: 'FHSA vs RRSP Home Buyers' Plan Calculator',
        subtitle: 'Compare the tax-free growth and withdrawal benefits of the First Home Savings Account (FHSA) against the traditional $60k RRSP HBP.',
        category: 'Taxes, Registered Accounts & Benefits',
        toolKey: 'fhsa',
        badge: 'First-Time Buyer',
        icon: 'bi-house-check',
        overview: 'The First Home Savings Account (FHSA) combines the best tax features of an RRSP and a TFSA: contributions are 100% tax-deductible upon deposit, and qualifying home purchase withdrawals are 100% tax-free with zero repayment obligations. By contrast, the RRSP Home Buyers' Plan (HBP) allows up to $60,000 of borrowing but mandates scheduled 15-year repayments back into your RRSP.',
        faqs: [
            {
                q: 'Can I use both the FHSA and the RRSP HBP on the same home purchase?',
                a: 'Yes. Eligible first-time Canadian homebuyers can combine their full FHSA balance with the $60,000 RRSP HBP withdrawal for a single residential real estate purchase.'
            },
            {
                q: 'Do I have to repay qualifying FHSA withdrawals?',
                a: 'No. Unlike the RRSP Home Buyers' Plan, qualifying FHSA withdrawals for your first home are permanent and do not require any repayment.'
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
    }
];

export function getToolBySlug(slug: string): ToolMeta | undefined {
    return TOOLS_BY_SLUG[slug] || TOOLS_DATA.find((t) => t.slug === slug);
}

// Map both original slugs and canonical aliases so URLs like /tools/pension-buyback and /tools/pension-buyback-calculator both resolve
export const TOOLS_BY_SLUG: Record<string, ToolMeta> = TOOLS_DATA.reduce((acc, tool) => {
    acc[tool.slug] = tool;
    // Cross-register with and without -calculator suffix
    if (tool.slug.endsWith('-calculator')) {
        acc[tool.slug.replace(/-calculator$/, '')] = tool;
    } else {
        acc[`${tool.slug}-calculator`] = tool;
    }
    return acc;
}, {} as Record<string, ToolMeta>);

export const ALL_TOOL_SLUGS: string[] = Array.from(new Set([
    ...TOOLS_DATA.map((t) => t.slug),
    ...TOOLS_DATA.map((t) => t.slug.endsWith('-calculator') ? t.slug.replace(/-calculator$/, '') : `${t.slug}-calculator`)
]));