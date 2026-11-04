// lib/toolsData.ts

export interface ToolFAQ {
    q: string;
    a: string;
}

export interface ToolItem {
    slug: string;
    toolKey: string;
    title: string;
    category: string;
    icon: string;
    badge: string;
    subtitle: string;
    overview: string;
    faqs: ToolFAQ[];
}

export const TOOLS_DATA: ToolItem[] = [
  {
    "slug": "pension-buyback",
    "toolKey": "pensionbb",
    "title": "Defined Benefit Pension Buyback Calculator",
    "category": "Master Simulations",
    "icon": "bi-clock-history",
    "badge": "CRA Line 20700",
    "subtitle": "Evaluate if buying back past credited service is worth the upfront lump-sum cost, factoring in CRA tax deductions, early retirement dates, and guaranteed lifetime payouts.",
    "overview": "Defined Benefit (DB) pension buybacks allow Canadian employees (such as OMERS, HOOPP, OTPP, federal public service, and municipal workers) to purchase uncredited past service, parental leaves, or probation periods. This calculator weighs the net out-of-pocket cash cost after tax deductions against the ongoing monthly pension boost and early retirement dates.",
    "faqs": [
      {
        "q": "Is a pension service buyback tax deductible in Canada?",
        "a": "Yes. Lump-sum cash buybacks for post-1989 service are 100% tax-deductible against your employment income on CRA Line 20700 (RPP deduction), yielding a significant tax refund in the year paid."
      },
      {
        "q": "Can I transfer money from my RRSP to buy back pension service?",
        "a": "Yes. You can execute a direct tax-free transfer from an RRSP to your registered pension plan using CRA Form T2151. This requires $0 cash out of pocket, though no additional tax refund is generated since the RRSP funds were already pre-tax."
      },
      {
        "q": "How does retiring earlier impact the buyback math?",
        "a": "If buying service allows you to hit your unreduced factor (such as an 85 or 90 factor) earlier, collecting your full pension even 2 to 6 months early can completely self-fund the net buyback cost upfront, creating an immediate net cash profit."
      }
    ]
  },
  {
    "slug": "lif-to-rrif-unlocking",
    "toolKey": "lif-unlock",
    "title": "LIF to RRIF 50% Unlocking Calculator",
    "category": "Tax & Registered",
    "icon": "bi-safe2-fill",
    "badge": "ITA 60(l) Transfer",
    "subtitle": "Calculate your one-time 50% unlocking limit from a locked-in LIF or LIRA into an unlocked RRIF, eliminating future maximum withdrawal caps.",
    "overview": "Under Canadian pension legislation, individuals holding locked-in retirement funds (LIRA or LIF) can execute a one-time 50% unlocking transfer into an unlocked regular RRIF under CRA Section 60(l) of the Income Tax Act upon converting at age 55 or older. This tool calculates the exact eligible transfer amount and models the ongoing flexibility.",
    "faqs": [
      {
        "q": "What is the 50% unlocking rule in Canada?",
        "a": "In jurisdictions like Ontario, Alberta, and the federal pension framework, you are permitted to transfer up to 50% of your locked-in account value into a regular RRIF or tax-deferred vehicle within 60 days of establishing a LIF."
      },
      {
        "q": "Does unlocking trigger immediate income tax?",
        "a": "No. As long as the unlocked funds are rolled directly into a regular RRIF, the transfer is 100% tax-deferred and reported on CRA Line 23200 with zero immediate tax drag."
      },
      {
        "q": "Why should I unlock my LIF into a RRIF?",
        "a": "Regular RRIFs have no maximum annual withdrawal limits. Unlocking 50% frees your capital from restrictive statutory LIF ceilings, allowing discretionary withdrawals or lump sums whenever needed."
      }
    ]
  },
  {
    "slug": "tfsa-vs-rrsp",
    "toolKey": "tfsavsrrsp",
    "title": "TFSA vs RRSP Comparison Calculator",
    "category": "Tax & Registered",
    "icon": "bi-arrow-left-right",
    "badge": "Tax Efficiency",
    "subtitle": "Compare the long-term wealth outcomes of investing in a Tax-Free Savings Account (TFSA) vs. a Registered Retirement Savings Plan (RRSP) based on your current and future tax brackets.",
    "overview": "The classic Canadian financial debate hinges on marginal tax arbitrage. If your marginal tax rate at contribution is higher than your expected tax rate at withdrawal, the RRSP wins. If your retirement tax rate will be equal or higher, or you risk OAS clawbacks, the TFSA is mathematically superior.",
    "faqs": [
      {
        "q": "Which is better for retirement: TFSA or RRSP?",
        "a": "If your income is over ~$55,000 to $111,000 today and you expect lower income in retirement, the upfront RRSP tax deduction provides high leverage. For lower tax brackets, or if you want to avoid OAS clawback in retirement, the TFSA is typically better."
      },
      {
        "q": "Do TFSA withdrawals count as income for government benefits?",
        "a": "No. TFSA withdrawals are 100% tax-free and are completely excluded from net world income, meaning they never trigger OAS clawback, GIS reduction, or income-tested benefit penalties."
      },
      {
        "q": "Can I invest in the same funds in both accounts?",
        "a": "Yes. Both TFSAs and RRSPs can hold the exact same Canadian and US stocks, ETFs, mutual funds, GICs, and bonds."
      }
    ]
  },
  {
    "slug": "cpp-optimizer",
    "toolKey": "cpp",
    "title": "CPP & OAS Claiming Age Optimizer",
    "category": "Master Simulations",
    "icon": "bi-calendar-check",
    "badge": "Actuarial Analysis",
    "subtitle": "Optimize your Canada Pension Plan (CPP) and Old Age Security (OAS) start age between 60 and 70 to maximize lifetime benefits and minimize clawbacks.",
    "overview": "Delaying CPP increases payments by 0.7% per month (+8.4% per year) after age 65 up to age 70. Starting early at age 60 penalizes payments by 0.6% per month (-36% reduction). This optimizer calculates your exact actuarial crossover age and cumulative lifetime value.",
    "faqs": [
      {
        "q": "What is the breakeven age for delaying CPP to age 70?",
        "a": "For most Canadians with average health and normal investment returns, the nominal breakeven age for delaying CPP from 65 to 70 is between age 81 and 84. Accounting for longevity risk and guaranteed inflation protection, delaying is often viewed as buying an inexpensive government-backed annuity."
      },
      {
        "q": "Can I take CPP at 60 while still working?",
        "a": "Yes. Under the Post-Retirement Benefit (PRB) rules, you can receive CPP while continuing to work between ages 60 and 70. Contributions to the PRB are mandatory until age 65 and optional until 70."
      },
      {
        "q": "How does delaying OAS differ from CPP?",
        "a": "OAS can be delayed from age 65 up to age 70, gaining a 0.6% monthly bonus (+7.2% per year or +36% total). OAS cannot be taken earlier than age 65."
      }
    ]
  },
  {
    "slug": "marginal-tax-curve",
    "toolKey": "tax-curve",
    "title": "Canadian Marginal Tax Rate & Clawback Curve",
    "category": "Tax & Registered",
    "icon": "bi-graph-up-arrow",
    "badge": "Effective Marginal Tax",
    "subtitle": "Visualize your true effective marginal tax rate across income levels, highlighting Ontario surtaxes, OAS clawback cliffs, and GIS phase-outs.",
    "overview": "Your statutory tax bracket rarely tells the full story. In Canada, hidden effective marginal tax rates (EMTR) spike due to Ontario surtaxes (which create effective marginal rates above 53.53%), the 15% OAS recovery tax clawback between ~$90k and ~$148k, and the 50% GIS clawback for low-income seniors.",
    "faqs": [
      {
        "q": "What is an effective marginal tax rate (EMTR)?",
        "a": "EMTR is the combined percentage of tax paid plus lost government benefits on the next dollar you earn or withdraw. For low-income seniors, the 50% GIS clawback plus 20% provincial tax creates an EMTR of over 70%."
      },
      {
        "q": "What is the OAS clawback threshold for 2026?",
        "a": "For recent tax years, the OAS recovery tax begins when net individual income exceeds approximately $90,997 and fully eliminates OAS payments around $148,000."
      },
      {
        "q": "How do Ontario surtaxes work?",
        "a": "Ontario applies an extra 20% surtax on provincial tax above $5,315 and an additional 36% surtax (56% total) on provincial tax above $6,802, causing unexpected tax bracket jumps."
      }
    ]
  },
  {
    "slug": "rrsp-sweet-spot",
    "toolKey": "sweetspot",
    "title": "RRSP Tax Deduction Sweet Spot Calculator",
    "category": "Tax & Registered",
    "icon": "bi-bullseye",
    "badge": "Bracket Optimization",
    "subtitle": "Find the exact optimal RRSP contribution amount that brings your taxable income down to the boundary of your lowest marginal bracket without wasting deductions.",
    "overview": "Contributing to an RRSP is most effective when deductions offset income taxed in your highest marginal bracket. Contributing too much can push your taxable income into a lower bracket where deductions generate a smaller refund.",
    "faqs": [
      {
        "q": "What is the RRSP sweet spot?",
        "a": "The sweet spot is the exact contribution amount that offsets only income taxed in your top marginal bracket. Beyond that point, each additional dollar of deduction generates a smaller percentage refund."
      },
      {
        "q": "Can I contribute to my RRSP now and deduct it in a future year?",
        "a": "Yes. You can report your RRSP contribution on Schedule 7 of your tax return and choose to delay claiming the deduction until a future year when your income and marginal tax rate are higher."
      }
    ]
  },
  {
    "slug": "rrsp-gross-up",
    "toolKey": "grossup",
    "title": "RRSP Gross-Up & Refund Loan Maximizer",
    "category": "Tax & Registered",
    "icon": "bi-cash-stack",
    "badge": "Leveraged Refund",
    "subtitle": "Calculate how much additional short-term loan you can borrow to maximize your RRSP contribution and have the resulting CRA tax refund pay off the loan in 90 days.",
    "overview": "The RRSP Gross-Up strategy uses a temporary 90-day bank loan to top up your RRSP before the March deadline. When your CRA tax refund arrives in May, the entire refund is used to extinguish the loan, leaving you with a significantly larger invested balance at zero net cash outlay.",
    "faqs": [
      {
        "q": "What is the RRSP gross-up formula?",
        "a": "Gross-Up Contribution = Initial Cash Savings / (1 - Marginal Tax Rate). For example, with $6,000 cash and a 40% tax rate, you can contribute $10,000 ($6k cash + $4k loan), generating a $4,000 tax refund that pays off the loan."
      },
      {
        "q": "Is an RRSP gross-up loan risky?",
        "a": "It carries minimal risk provided you file your taxes promptly and use 100% of the resulting refund to repay the loan before interest accumulates."
      }
    ]
  },
  {
    "slug": "tfsa-room-calculator",
    "toolKey": "tfsa-room",
    "title": "TFSA Contribution Room Calculator",
    "category": "Tax & Registered",
    "icon": "bi-piggy-bank-fill",
    "badge": "CRA Statutory Limits",
    "subtitle": "Calculate your cumulative lifetime TFSA contribution limit from 2009 to present based on your birth year, residency, and historical withdrawals.",
    "overview": "The Tax-Free Savings Account was introduced in 2009. Any Canadian resident aged 18 or older accumulates contribution room annually, even if they have never opened an account or filed a tax return.",
    "faqs": [
      {
        "q": "What is the maximum cumulative TFSA room in 2026?",
        "a": "For an individual who turned 18 prior to 2009 and has been a Canadian resident continuously, total cumulative lifetime TFSA room exceeds $100,000."
      },
      {
        "q": "Do TFSA withdrawals create contribution room?",
        "a": "Yes. The full dollar amount of any TFSA withdrawal is re-added to your contribution room on January 1 of the following calendar year."
      },
      {
        "q": "What is the penalty for over-contributing to a TFSA?",
        "a": "The CRA assesses a tax penalty of 1% per month on the highest excess contribution amount for each month it remains in the account."
      }
    ]
  },
  {
    "slug": "gis-maximizer",
    "toolKey": "gis-maximizer",
    "title": "GIS & Low-Income OAS Maximizer",
    "category": "Tax & Registered",
    "icon": "bi-shield-check",
    "badge": "Anti-Clawback",
    "subtitle": "Strategize early RRSP meltdowns and TFSA shielding to qualify for maximum Guaranteed Income Supplement (GIS) payments in low-income retirement years.",
    "overview": "The Guaranteed Income Supplement (GIS) provides up to ~\$1,065/month in non-taxable monthly income to low-income Canadian seniors. However, every dollar of non-OAS income (such as RRSP/RRIF withdrawals or pensions) reduces GIS by 50 cents.",
    "faqs": [
      {
        "q": "What is an RRSP meltdown for GIS optimization?",
        "a": "It involves aggressively withdrawing RRSP assets between ages 60 and 64 (before OAS/GIS begins at 65) into a TFSA, resulting in near-zero taxable income at 65 to maximize non-taxable GIS payments."
      },
      {
        "q": "Do TFSA withdrawals affect GIS eligibility?",
        "a": "No. TFSA withdrawals do not count as income on your CRA tax return and have zero clawback impact on GIS."
      }
    ]
  },
  {
    "slug": "estate-tax-calculator",
    "toolKey": "estate-tax",
    "title": "Canadian Estate & Terminal Tax Calculator",
    "category": "Tax & Registered",
    "icon": "bi-file-earmark-medical",
    "badge": "Deemed Disposition",
    "subtitle": "Estimate your final Canadian terminal tax bill upon passing, including deemed disposition of registered accounts, real estate capital gains, and probate fees.",
    "overview": "Canada does not have an inheritance or estate tax per se, but the CRA treats all assets as if they were sold at fair market value immediately prior to death (Deemed Disposition). Entire RRSP/RRIF balances become 100% taxable as regular income in the final year unless rolled over to a surviving spouse.",
    "faqs": [
      {
        "q": "How are RRSPs taxed when someone dies in Canada?",
        "a": "Unless rolled over tax-free to a surviving spouse or qualified financially dependent child/grandchild, the entire market value of the RRSP/RRIF is added to the deceased person's final terminal tax return, often taxed at the top 53.5%+ rate."
      },
      {
        "q": "Is the principal residence taxable upon death?",
        "a": "No. The Principal Residence Exemption shields 100% of capital gains on a primary home from estate terminal tax."
      },
      {
        "q": "What are probate fees in Ontario and BC?",
        "a": "In Ontario, Estate Administration Tax is roughly 1.5% on estate assets above \$50,000. In BC, it is approximately 1.4% on values above \$50,000."
      }
    ]
  },
  {
    "slug": "ccb-maximizer",
    "toolKey": "ccb",
    "title": "Canada Child Benefit (CCB) Maximizer",
    "category": "Tax & Registered",
    "icon": "bi-people-fill",
    "badge": "Family Net Income",
    "subtitle": "Model how RRSP deductions reduce your Adjusted Family Net Income (AFNI) to dramatically increase your monthly tax-free Canada Child Benefit payments.",
    "overview": "The Canada Child Benefit (CCB) is indexed and completely tax-free, but it phases out rapidly as family net income increases. Contributing to an RRSP lowers your family net income dollar-for-dollar, boosting your monthly child benefit payment while simultaneously generating a regular tax refund.",
    "faqs": [
      {
        "q": "How does an RRSP contribution increase my child benefit?",
        "a": "Because CCB is calculated based on net family income (Line 23600), reducing your net income via RRSP deductions increases your benefit payout for the upcoming benefit year."
      },
      {
        "q": "What is the combined effective return on an RRSP with CCB?",
        "a": "For families in the phase-out range with 2 or 3 young children, the effective return (tax refund + extra CCB payments) can exceed 60% to 75% on every dollar contributed."
      }
    ]
  },
  {
    "slug": "fhsa-vs-rrsp",
    "toolKey": "fhsa",
    "title": "FHSA vs RRSP Home Buyers Plan Calculator",
    "category": "Tax & Registered",
    "icon": "bi-house-heart-fill",
    "badge": "First-Time Home Buyers",
    "subtitle": "Compare the tax-deductible contribution and tax-free withdrawal benefits of the First Home Savings Account (FHSA) versus the RRSP Home Buyers Plan (HBP).",
    "overview": "The First Home Savings Account (FHSA) combines the best features of an RRSP and a TFSA: contributions are tax-deductible, and qualifying home withdrawals are 100% tax-free with zero requirement to repay.",
    "faqs": [
      {
        "q": "Can I use both the FHSA and RRSP Home Buyers Plan together?",
        "a": "Yes. First-time home buyers in Canada can combine up to \$40,000 from their FHSA and up to \$60,000 from their RRSP Home Buyers Plan (HBP) for a total of \$100,000 per person (\$200,000 for a couple)."
      },
      {
        "q": "Do I have to repay money withdrawn from an FHSA?",
        "a": "No. Unlike the RRSP Home Buyers Plan which requires 15-year repayment, qualifying withdrawals from an FHSA are never repaid."
      }
    ]
  },
  {
    "slug": "resp-maximizer",
    "toolKey": "resp",
    "title": "RESP CESG Grant & Catch-Up Maximizer",
    "category": "Tax & Registered",
    "icon": "bi-mortarboard-fill",
    "badge": "CESG 20% Matching",
    "subtitle": "Optimize contributions to your Registered Education Savings Plan (RESP) to capture the maximum lifetime \$7,200 Canada Education Savings Grant (CESG).",
    "overview": "The federal government provides a 20% Canada Education Savings Grant (CESG) on the first \$2,500 contributed per child annually (\$500/year grant). If you missed prior years, you can catch up on one previous year per calendar year by contributing \$5,000 to capture \$1,000 in grants.",
    "faqs": [
      {
        "q": "What is the lifetime grant limit per child?",
        "a": "The lifetime maximum CESG grant per beneficiary is \$7,200."
      },
      {
        "q": "What is the catch-up rule for missed years?",
        "a": "You can catch up on one unused grant year per calendar year. Contributing \$5,000 in a catch-up year triggers a \$1,000 grant."
      }
    ]
  },
  {
    "slug": "pension-commuted-value",
    "toolKey": "pensioncv",
    "title": "Pension Commuted Value vs Monthly Pension",
    "category": "Master Simulations",
    "icon": "bi-briefcase-fill",
    "badge": "Lump Sum vs Annuity",
    "subtitle": "Evaluate whether to accept a commuted value lump-sum transfer to a LIRA or keep a guaranteed defined benefit monthly pension for life.",
    "overview": "Leaving a Defined Benefit pension plan forces a major choice: take a lump-sum commuted value (CV) transferred into a locked-in retirement account (LIRA) and manage your own investments, or keep the guaranteed lifelong monthly pension payments.",
    "faqs": [
      {
        "q": "What are the risks of taking the commuted value?",
        "a": "You take on market investment risk, sequence of returns risk, and longevity risk. If markets perform poorly or you live past age 85, a commuted value lump sum may deplete earlier than a lifelong guaranteed pension."
      },
      {
        "q": "Is the full commuted value transferred tax-free?",
        "a": "Not always. Under CRA Maximum Transfer Limit (MTL) rules, amounts exceeding statutory limits must be paid in cash and are subject to immediate income tax withholding."
      }
    ]
  },
  {
    "slug": "buy-vs-rent",
    "toolKey": "buyvsrent",
    "title": "Canadian Buy vs Rent Housing Analyzer",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-house-door-fill",
    "badge": "Total Cost of Ownership",
    "subtitle": "Compare the 25-year net worth trajectory of purchasing a home vs. renting and investing the difference in low-cost index funds across Canadian real estate markets.",
    "overview": "Homeownership involves substantial unrecoverable costs (property taxes, mortgage interest, condo fees, maintenance, and 5% selling friction). This calculator models whether buying or renting and investing surplus cash builds greater net worth over a 25-year horizon.",
    "faqs": [
      {
        "q": "Is buying always better than renting in Canada?",
        "a": "Not necessarily. When rent is significantly cheaper than carrying costs (mortgage interest, taxes, condo fees, maintenance), disciplined renters who invest the difference in low-cost index funds often build comparable or higher liquid net worth."
      }
    ]
  },
  {
    "slug": "mortgage-vs-invest",
    "toolKey": "mvi",
    "title": "Mortgage Paydown vs Investing Calculator",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-bar-chart-steps",
    "badge": "Guaranteed vs Risk",
    "subtitle": "Determine whether using surplus cash to pay down your mortgage delivers a better risk-adjusted return than investing in non-registered or registered portfolios.",
    "overview": "Paying down a mortgage provides a guaranteed, tax-free return equal to your mortgage interest rate. Investing in diversified equities offers potentially higher expected returns, but carries volatility and potential tax drag in non-registered accounts.",
    "faqs": [
      {
        "q": "What is the guaranteed return on mortgage paydown?",
        "a": "Every dollar paid against your mortgage principal yields an exact, guaranteed, tax-free return equal to your mortgage interest rate."
      }
    ]
  },
  {
    "slug": "smith-maneuver",
    "toolKey": "smith",
    "title": "Smith Maneuver Tax-Deductible Mortgage Calculator",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-arrow-repeat",
    "badge": "Tax Conversion",
    "subtitle": "Simulate converting your non-deductible Canadian residential mortgage into a tax-deductible investment loan using a re-advanceable HELOC.",
    "overview": "Under Canadian tax law, interest on money borrowed to produce taxable investment income is tax-deductible. The Smith Maneuver uses a re-advanceable mortgage: as you pay down mortgage principal, you re-borrow the equity to purchase income-producing investments, making the interest deductible.",
    "faqs": [
      {
        "q": "Is the Smith Maneuver legal in Canada?",
        "a": "Yes. It complies fully with CRA guidelines governing investment interest deductibility (ITA Paragraph 20(1)(c)), provided borrowed funds are used to purchase income-producing taxable investments."
      }
    ]
  },
  {
    "slug": "mortgage-affordability",
    "toolKey": "afford",
    "title": "Canadian Mortgage Affordability & Stress Test",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-calculator-fill",
    "badge": "GDS & TDS Limits",
    "subtitle": "Calculate maximum home purchasing power under official OSFI mortgage stress test rules and standard Gross/Total Debt Service ratios (39%/44%).",
    "overview": "The OSFI mortgage stress test requires borrowers to qualify at their contract rate plus 2.0%, or the Bank of Canada minimum qualifying rate (5.25%), whichever is higher. This tool calculates maximum borrowing capacity based on your income, property taxes, heating, and monthly debts.",
    "faqs": [
      {
        "q": "What are GDS and TDS limits?",
        "a": "Gross Debt Service (GDS) ratio cap is typically 39% of gross income for housing costs. Total Debt Service (TDS) ratio cap is 44% including all other debts."
      }
    ]
  },
  {
    "slug": "mortgage-renewal",
    "toolKey": "renewal",
    "title": "Mortgage Renewal Fixed vs Variable Analyzer",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-arrow-left-right",
    "badge": "Interest Rate Risk",
    "subtitle": "Compare fixed and variable rate options upon mortgage renewal to evaluate payment shocks, principal paydown velocity, and interest rate sensitivity.",
    "overview": "When your mortgage term ends, choosing between a 3-year or 5-year fixed rate versus a variable rate requires analyzing rate cut expectations and your personal cash flow shock tolerance.",
    "faqs": [
      {
        "q": "How does a rate change affect my payment?",
        "a": "On a \$500,000 mortgage, every 1% interest rate difference equates to approximately \$275 to \$300 in monthly payment change."
      }
    ]
  },
  {
    "slug": "home-move-up",
    "toolKey": "moveup",
    "title": "Home Move-Up & Upsizing Calculator",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-house-up-fill",
    "badge": "Real Estate Equity",
    "subtitle": "Model trading your current property for a larger home, including realtor fees, land transfer taxes, mortgage porting, and ongoing utility scaling.",
    "overview": "Upsizing involves significant friction: 5% realtor commissions on the sale, municipal and provincial land transfer taxes on the new purchase, legal fees, and ongoing increases in property taxes and maintenance.",
    "faqs": [
      {
        "q": "What are the true transaction costs of upsizing in Ontario?",
        "a": "Selling a \$1M home and buying a \$1.5M home in Toronto incurs ~\$50,000 in sales commissions plus ~\$56,000 in double land transfer taxes, totaling over \$110,000 in unrecoverable friction."
      }
    ]
  },
  {
    "slug": "reverse-mortgage",
    "toolKey": "reversemortgage",
    "title": "Canadian Reverse Mortgage (CHIP) Calculator",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-house-gear-fill",
    "badge": "Equity Release",
    "subtitle": "Model unlocking tax-free home equity via a Canadian reverse mortgage, evaluating compounding interest, remaining equity, and impact on estate inheritance.",
    "overview": "Canadian homeowners aged 55 or older can borrow up to 55% of their home value with no monthly principal or interest payments required until the home is sold or the owner passes away.",
    "faqs": [
      {
        "q": "Are reverse mortgage proceeds taxable in Canada?",
        "a": "No. Because proceeds are borrowed equity against your home, they are 100% tax-free and do not affect OAS or GIS entitlements."
      }
    ]
  },
  {
    "slug": "emergency-fund",
    "toolKey": "emerg",
    "title": "Emergency Fund Sizer Calculator",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-shield-shaded",
    "badge": "Liquidity Buffer",
    "subtitle": "Calculate your recommended liquid cash reserve (3, 6, or 9 months of non-discretionary expenses) based on job security and debt obligations.",
    "overview": "An emergency fund protects your investments from forced liquidation during market downturns. The ideal cash buffer depends on whether you have stable employment, variable income, or dual household earners.",
    "faqs": [
      {
        "q": "Where should I keep my emergency fund in Canada?",
        "a": "A high-interest savings account (HISA) or cash ETF (like CASH.TO or CBIL.TO) held inside a TFSA or non-registered account ensures zero market risk and instant liquidity."
      }
    ]
  },
  {
    "slug": "car-lease-vs-buy",
    "toolKey": "car",
    "title": "Car Lease vs Finance vs Buy Calculator",
    "category": "Debt, Real Estate & Cash",
    "icon": "bi-car-front-fill",
    "badge": "Auto Financing",
    "subtitle": "Compare the true opportunity cost and depreciation of leasing, financing, or paying cash for a new or used vehicle in Canada.",
    "overview": "Vehicles are typically a household's largest depreciating asset. This tool models upfront capital requirements, interest rates, tax implications, and residual buyouts to find the lowest total cost of vehicle ownership.",
    "faqs": [
      {
        "q": "Is leasing better than buying if I write off vehicle expenses?",
        "a": "Self-employed individuals and business owners may benefit from leasing due to CRA monthly lease write-off caps, whereas personal commuters usually find financing or buying lightly used more cost-effective."
      }
    ]
  },
  {
    "slug": "medical-expense-optimizer",
    "toolKey": "medical",
    "title": "Medical Expense Tax Credit (METC) Optimizer",
    "category": "Tax & Registered",
    "icon": "bi-heart-pulse-fill",
    "badge": "CRA Line 33099",
    "subtitle": "Maximize your Canadian non-refundable Medical Expense Tax Credit (METC) by pooling 12-month eligible receipts between spouses or lower-income earners.",
    "overview": "The Medical Expense Tax Credit has a threshold equal to 3% of net income or \$2,759 (indexed). Because the threshold is percentage-based, pooling receipts under the lower-income spouse's tax return generates a substantially larger tax credit.",
    "faqs": [
      {
        "q": "Who should claim medical expenses in a couple?",
        "a": "Almost always the spouse with the lower net income, because their 3% income threshold is lower, allowing a greater portion of expenses to qualify for the 15% federal credit."
      }
    ]
  },
  {
    "slug": "side-hustle-roi",
    "toolKey": "sidehustle",
    "title": "Canadian Side Hustle & Self-Employed Tax Calculator",
    "category": "Business & Income",
    "icon": "bi-laptop",
    "badge": "CPP & Income Tax",
    "subtitle": "Calculate after-tax net take-home from freelance or secondary business income, factoring in both employer and employee portions of CPP and marginal taxes.",
    "overview": "Self-employed Canadians must pay both the employee (5.95%) and employer (5.95%) portions of the Canada Pension Plan (11.9% total up to the YMPE), plus their top marginal income tax rate on net self-employment profits.",
    "faqs": [
      {
        "q": "Do I have to pay double CPP on side hustle income?",
        "a": "Yes. Self-employed individuals are responsible for both the employer and employee share of CPP contributions, though the employer half is a tax deduction on Line 22200."
      }
    ]
  },
  {
    "slug": "die-with-zero",
    "toolKey": "dwz",
    "title": "Die With Zero Spending & Longevity Simulator",
    "category": "Master Simulations",
    "icon": "bi-hourglass-bottom",
    "badge": "Peak Spending",
    "subtitle": "Calculate your maximum sustainable lifestyle spending rate to fully enjoy your wealth during healthy retirement years while avoiding running out of money.",
    "overview": "Inspired by Bill Perkins' philosophy, this optimizer solves the widespread problem of retirement underspending. It models front-loading discretionary travel and experiences in your 60s and 70s (the 'go-go' years) while maintaining a safety floor for late-life medical care.",
    "faqs": [
      {
        "q": "What is the core idea of Die With Zero?",
        "a": "To maximize lifetime fulfillment by spending wealth during the health windows where money has the highest utility, rather than over-accumulating and passing away with excessive unspent capital."
      }
    ]
  },
  {
    "slug": "consumption-smoothing",
    "toolKey": "smoother",
    "title": "Consumption Smoothing & Discretionary Budget Simulator",
    "category": "Master Simulations",
    "icon": "bi-water",
    "badge": "Living Standard",
    "subtitle": "Eliminate retirement income cliffs by smoothing lifetime consumption, maintaining a consistent standard of living through working and retirement phases.",
    "overview": "Based on economic life-cycle consumption theory, consumption smoothing calculates the stable baseline standard of living your lifetime human and financial capital can support, avoiding drastic lifestyle cuts when income fluctuates.",
    "faqs": [
      {
        "q": "How does consumption smoothing differ from fixed replacement rates?",
        "a": "Instead of assuming you need a rigid 70% of pre-retirement gross salary, it subtracts taxes, debt payments, and savings to isolate what you actually spend on discretionary living, then preserves that exact purchasing power for life."
      }
    ]
  },
  {
    "slug": "cpp-statement-importer",
    "toolKey": "cppimport",
    "title": "CPP Statement of Contributions (SOC) Importer",
    "category": "Data Importers",
    "icon": "bi-file-earmark-arrow-up",
    "badge": "Service Canada Data",
    "subtitle": "Parse your official Service Canada Statement of Contributions (SOC) to automatically calculate your exact historical earnings and future CPP pension entitlements.",
    "overview": "Your official Statement of Contributions from My Service Canada Account logs every dollar of pensionable earnings since age 18. This tool calculates your average unadjusted pensionable earnings to project your exact CPP payment.",
    "faqs": [
      {
        "q": "How do I download my Statement of Contributions?",
        "a": "Log into My Service Canada Account (MSCA), navigate to Canada Pension Plan > Statement of Contributions, and download your contribution record."
      }
    ]
  }
];

export const TOOLS_BY_SLUG: Record<string, ToolItem> = TOOLS_DATA.reduce((acc, tool) => {
    acc[tool.slug] = tool;
    return acc;
}, {} as Record<string, ToolItem>);

export const ALL_TOOL_SLUGS = TOOLS_DATA.map(t => t.slug);