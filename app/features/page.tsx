/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: app/features/page.tsx
 * PURPOSE: Feature Matrix & Smart Optimizers Directory Page
 * INSTRUCTION: Rename this file to 'page.tsx' and place it in 'app/features/'
 * =========================================================================
 */
'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export default function FeaturesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. THE 6 CORE PLANNING ENGINES
  const coreSuites = [
    {
      title: "Annual Data Bank & Real-World Calibration",
      badge: "Signature Engine",
      badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: "bi-clock-history",
      color: "text-emerald-400",
      bgGradient: "from-emerald-950/20 to-slate-900",
      borderColor: "border-emerald-500/30",
      description: "Close the loop between theoretical financial models and real life. Each year-end, snapshot your actual statement balances, track true compound returns, and roll your plan forward +1 year.",
      features: [
        { name: "1-Click Roll-Forward Wizard", desc: "Advances household ages, archives statement actuals, and transitions starting balances to the new year." },
        { name: "Plan Assumption Calibration", desc: "Directly plots your real-world actual returns against your plan's benchmark growth rate." },
        { name: "Automatic Balance Chaining", desc: "Jan 1 opening net worth auto-chains from prior year-end closes to ensure mathematical continuity." },
        { name: "Baseline Snapshot Isolation", desc: "Separates your initial starting net worth anchor so lifetime averages reflect true investment performance." }
      ]
    },
    {
      title: "CRA 2026 Tax Engine & Benefit Optimization",
      badge: "Canadian Precision",
      badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      icon: "bi-bank2",
      color: "text-blue-400",
      bgGradient: "from-blue-950/20 to-slate-900",
      borderColor: "border-blue-500/30",
      description: "Modeled down to the dollar for all Canadian provinces and territories, incorporating 2026 indexed tax brackets, surtaxes, and benefit clawbacks.",
      features: [
        { name: "Federal & Provincial Brackets", desc: "Full statutory tax formulas including Ontario Health Premium, provincial surtaxes, and indexation." },
        { name: "CPP & OAS Flexibility", desc: "Optimize claiming ages between 60 and 70 (+8.4%/yr deferral bonus on OAS, +7.2%/yr on CPP)." },
        { name: "OAS Clawback Recovery", desc: "Models automatic 15% recovery tax thresholds when net world income exceeds statutory limits." },
        { name: "Spousal Pension Splitting", desc: "Algorithmically allocates up to 50% of eligible pension income to equalize spousal tax brackets." }
      ]
    },
    {
      title: "Account Architecture & ACB Cost-Base Tracking",
      badge: "Full Account Depth",
      badgeColor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
      icon: "bi-piggy-bank-fill",
      color: "text-purple-400",
      bgGradient: "from-purple-950/20 to-slate-900",
      borderColor: "border-purple-500/30",
      description: "Treats every Canadian account type according to its unique tax and legislative rules, from lock-in restrictions to capital gains exemptions.",
      features: [
        { name: "LIF & LIRA Statutory Limits", desc: "Calculates statutory age-based maximum withdrawal rates and integrates prior-year investment gains." },
        { name: "FHSA & RESP Integration", desc: "First Home Savings Account tax deductions and RESP Canada Education Savings Grant (CESG) captures." },
        { name: "Adjusted Cost Base (ACB)", desc: "Tracks cost basis for non-registered investment portfolios and crypto to accurately isolate taxable capital gains." },
        { name: "RRIF Minimum Drawdowns", desc: "Automates mandatory CRA minimum decumulation percentages based on age or younger spouse." }
      ]
    },
    {
      title: "After-Tax Estate & Spousal Survivorship",
      badge: "Legacy Planning",
      badgeColor: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: "bi-person-heart",
      color: "text-rose-400",
      bgGradient: "from-rose-950/20 to-slate-900",
      borderColor: "border-rose-500/30",
      description: "Plan for the full lifecycle. Calculate your true net after-tax estate value with complete tax math transparency, and model spousal survivorship scenarios.",
      features: [
        { name: "Deemed Disposition Tax Math", desc: "Calculates terminal tax liabilities on registered balances and unrealized capital gains upon second death." },
        { name: "P1 vs P2 Survivorship Sequences", desc: "Simulate whichever partner passes first to stress test single-survivor tax bracket creep and pension drops." },
        { name: "Probate & Administrative Estimates", desc: "Forecasts provincial estate administration taxes across primary and secondary wealth tiers." },
        { name: "Liquid vs Total Wealth Split", desc: "Separates real estate and private equity from liquid spendable portfolios across every projection year." }
      ]
    },
    {
      title: "Institutional Risk & Monte Carlo Stress Testing",
      badge: "Stochastic Modeling",
      badgeColor: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: "bi-activity",
      color: "text-amber-400",
      bgGradient: "from-amber-950/20 to-slate-900",
      borderColor: "border-amber-500/30",
      description: "Retirement plans fail because of volatility timing, not average returns. Planfolio stress-tests your wealth against historical crashes and stochastic trials.",
      features: [
        { name: "1,000-Trial Monte Carlo Engine", desc: "Calculates your plan's true statistical probability of success across random return paths." },
        { name: "Sequence of Returns Risk (SRR)", desc: "Simulates early retirement market drawdowns (1970s stagflation, 2000 Dot-com, 2008 GFC)." },
        { name: "Macro Inflation Shocks", desc: "Stress test sustained inflation spikes (4% to 6%) to evaluate purchasing power erosion." },
        { name: "Dynamic Cash Buffer Reserves", desc: "Models multi-year cash cushions to avoid selling equities during market downturns." }
      ]
    },
    {
      title: "Multi-Plan Scenario Compare & Milestones",
      badge: "Decision Support",
      badgeColor: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
      icon: "bi-bar-chart-line",
      color: "text-cyan-400",
      bgGradient: "from-cyan-950/20 to-slate-900",
      borderColor: "border-cyan-500/30",
      description: "Make confident life decisions. Compare saved scenarios side-by-side, test retirement ages, and evaluate milestone trade-offs.",
      features: [
        { name: "Side-by-Side Plan Comparisons", desc: "Overlay liquid assets, net worth, and annual tax curves across alternate retirement dates." },
        { name: "Multi-Plan Trajectory Overlays", desc: "Compare retiring at 55 vs 60, aggressive equity vs conservative allocation, or downsizing." },
        { name: "Granular Living Cost Integration", desc: "Feeds realistic categorized expenses (housing, lifestyle, healthcare) straight into simulation engines." },
        { name: "Instant Safety Restore Points", desc: "Save and restore plan snapshots with one click without overwriting your active baseline." }
      ]
    }
  ];

  // 2. THE COMPLETE DIRECTORY OF SPECIALIZED OPTIMIZERS (GROUPED)
  const optimizerGroups = [
    {
      groupTitle: "Master Simulations & Spending Models",
      groupIcon: "bi-cpu",
      groupColor: "text-blue-400",
      groupDesc: "Advanced stochastic engines and lifecycle spending models that solve for maximum sustainable living standards.",
      tools: [
        {
          id: "dwz",
          name: "Die With Zero Optimizer",
          badge: "Spending Model",
          icon: "bi-bullseye",
          desc: "Calculates your maximum safe annual discretionary spending curve to optimize life experiences without leaving unintended excess capital."
        },
        {
          id: "smoother",
          name: "Consumption Smoothing",
          badge: "Lifestyle",
          icon: "bi-water",
          desc: "Smooths your lifetime living standard across pre-retirement, active go-go years, and slow-down phases to eliminate lifestyle whiplash."
        },
        {
          id: "cpp",
          name: "CPP & OAS Grid Search",
          badge: "Government Pensions",
          icon: "bi-grid-3x3",
          desc: "Tests every combination of CPP & OAS start ages (60 to 70) to identify your household's mathematically optimal break-even claiming age."
        },
        {
          id: "pensioncv",
          name: "Pension Commuted Value vs Annuity",
          badge: "DB Pensions",
          icon: "bi-calculator",
          desc: "Evaluates whether taking a lump-sum Commuted Value (CV) or keeping a monthly Defined Benefit pension annuity provides higher expected lifetime income."
        },
        {
          id: "pensionbb",
          name: "Pension Service Buyback ROI",
          badge: "Service Buyback",
          icon: "bi-arrow-repeat",
          desc: "Calculates the net internal rate of return (IRR) on purchasing past pensionable service in OMERS, HOOPP, OTPP, or federal public service plans."
        }
      ]
    },
    {
      groupTitle: "Tax Minimization & Registered Accounts",
      groupIcon: "bi-percent",
      groupColor: "text-purple-400",
      groupDesc: "Precision Canadian tax tools to minimize lifetime CRA taxes, prevent clawbacks, and maximize registered account growth.",
      tools: [
        {
          id: "tax-curve",
          name: "Marginal Tax Rate & Clawback Curve",
          badge: "Tax Brackets",
          icon: "bi-graph-up",
          desc: "Plots your exact effective and marginal tax curve across income levels, highlighting Ontario surtax cliffs, OAS recovery spikes, and GIS phaseouts."
        },
        {
          id: "sweetspot",
          name: "RRSP Contribution Sweet Spot",
          badge: "RRSP",
          icon: "bi-funnel",
          desc: "Pinpoints the exact dollar amount of RRSP contributions needed to drop your taxable income to the optimal tax bracket threshold without wasting deductions."
        },
        {
          id: "grossup",
          name: "RRSP Gross-Up Maximizer",
          badge: "Tax Refund",
          icon: "bi-cash-stack",
          desc: "Models the math of taking a short-term catch-up loan to maximize your RRSP deduction, immediately paying it off with the resulting CRA tax refund."
        },
        {
          id: "tfsavsrrsp",
          name: "TFSA vs RRSP Marginal Advantage",
          badge: "Account Choice",
          icon: "bi-arrow-left-right",
          desc: "Compares current marginal tax rates against projected retirement withdrawal brackets to determine the mathematically superior registered account."
        },
        {
          id: "tfsa-room",
          name: "TFSA Room & Catch-Up Calculator",
          badge: "CRA Limits",
          icon: "bi-calendar-check",
          desc: "Tracks cumulative statutory contribution limits from 2009 to 2026, accounting for prior withdrawals and unused historical room."
        },
        {
          id: "lif-unlock",
          name: "LIF to RRIF Flexibility Optimizer",
          badge: "Locked-In",
          icon: "bi-unlock",
          desc: "Models statutory one-time 50% unlocking under federal and provincial pension legislation, transferring locked-in LIF funds to flexible RRIF accounts."
        },
        {
          id: "gis-maximizer",
          name: "GIS & Low-Income Senior Maximizer",
          badge: "Low-Income",
          icon: "bi-shield-plus",
          desc: "Optimizes early RRSP meltdowns and TFSA allocations to avoid clawing back the non-taxable Guaranteed Income Supplement (GIS) for seniors."
        },
        {
          id: "estate-tax",
          name: "Canadian Estate & Terminal Tax",
          badge: "Estate",
          icon: "bi-file-earmark-text",
          desc: "Calculates deemed disposition of registered accounts, taxable capital gains on secondary properties/cottages, and provincial probate fees upon death."
        },
        {
          id: "ccb",
          name: "CCB (Canada Child Benefit) Maximizer",
          badge: "Families",
          icon: "bi-people",
          desc: "Optimizes Adjusted Family Net Income (AFNI) deductions via strategic RRSP contributions to maximize non-taxable monthly Canada Child Benefit payments."
        },
        {
          id: "fhsa",
          name: "FHSA vs RRSP First-Time Buyer",
          badge: "First Home",
          icon: "bi-house-heart",
          desc: "Compares the First Home Savings Account (FHSA) against the RRSP Home Buyers' Plan (HBP) for first-time Canadian homebuyers."
        },
        {
          id: "resp",
          name: "RESP & CESG Grant Maximizer",
          badge: "Education",
          icon: "bi-mortarboard",
          desc: "Maps the optimal annual contribution timeline to capture the full $7,200 lifetime Canada Education Savings Grant (CESG) without leaving grant money behind."
        },
        {
          id: "medical",
          name: "Medical Expense Tax Credit (METC)",
          badge: "Tax Credit",
          icon: "bi-heart-pulse",
          desc: "Determines which spouse should claim family medical expenses to surpass the 3% net income threshold and maximize non-refundable tax credits."
        }
      ]
    },
    {
      groupTitle: "Real Estate, Mortgages & Debt",
      groupIcon: "bi-house-door",
      groupColor: "text-emerald-400",
      groupDesc: "Make informed property, borrowing, and debt payoff decisions in higher interest rate environments.",
      tools: [
        {
          id: "smith",
          name: "Smith Maneuver Debt Conversion",
          badge: "Tax Strategy",
          icon: "bi-shield-check",
          desc: "Models the conversion of non-deductible residential mortgage payments into tax-deductible investment loan debt using a re-advanceable HELOC."
        },
        {
          id: "buyvsrent",
          name: "Buy vs Rent 30-Year Deep Analyzer",
          badge: "Housing",
          icon: "bi-house",
          desc: "Comprehensive multi-decade net worth comparison accounting for property taxes, maintenance, condo fees, mortgage interest, and investment opportunity costs."
        },
        {
          id: "mvi",
          name: "Mortgage Paydown vs Invest Optimizer",
          badge: "Debt Strategy",
          icon: "bi-percent",
          desc: "Compares the guaranteed after-tax return of accelerated lump-sum mortgage paydowns against expected portfolio investment growth."
        },
        {
          id: "afford",
          name: "Mortgage Stress Test & Affordability",
          badge: "Borrowing",
          icon: "bi-speedometer2",
          desc: "Calculates maximum borrowing capacity against official OSFI qualifying stress test interest rates, Gross Debt Service (GDS), and Total Debt Service (TDS) caps."
        },
        {
          id: "renewal",
          name: "Mortgage Renewal Rate Shock",
          badge: "Mortgages",
          icon: "bi-arrow-clockwise",
          desc: "Simulates payment shocks when renewing into higher interest rate environments, with amortization extension scenarios."
        },
        {
          id: "moveup",
          name: "Home Move-Up & Upsizing Calculator",
          badge: "Real Estate",
          icon: "bi-building-up",
          desc: "Calculates the true all-in cost of trading up to a larger property, including double land transfer taxes, Realtor commissions, legal fees, and financing."
        },
        {
          id: "reversemortgage",
          name: "Reverse Mortgage vs Downsizing",
          badge: "Home Equity",
          icon: "bi-piggy-bank",
          desc: "Evaluates CHIP reverse mortgages against rightsizing/downsizing home equity in retirement, comparing compound debt vs net investable proceeds."
        },
        {
          id: "car",
          name: "Car Lease vs Finance vs Cash",
          badge: "Vehicles",
          icon: "bi-car-front",
          desc: "Analyzes Total Cost of Ownership (TCO) between vehicle leasing, dealership financing, and purchasing outright with cash."
        },
        {
          id: "emerg",
          name: "Emergency Fund Sizing Calculator",
          badge: "Liquidity",
          icon: "bi-safe",
          desc: "Determines personalized cash reserves based on employment volatility, fixed debt obligations, family dependents, and liquid buffers."
        }
      ]
    },
    {
      groupTitle: "Business, Income & Data Importers",
      groupIcon: "bi-briefcase",
      groupColor: "text-cyan-400",
      groupDesc: "Specialized tools for sole proprietors, side hustlers, and automated government data import.",
      tools: [
        {
          id: "sidehustle",
          name: "Side Hustle & Self-Employment ROI",
          badge: "Self-Employed",
          icon: "bi-briefcase",
          desc: "Calculates your true net hourly return after factoring in marginal income tax brackets, CPP self-employed contributions (9.9%–11.9%), and deductible expenses."
        },
        {
          id: "cppimport",
          name: "CPP Statement of Contributions Importer",
          badge: "Data Import",
          icon: "bi-file-earmark-arrow-up",
          desc: "Parses your official Service Canada Statement of Contributions (SOC) text to automatically populate your historical pensionable earnings record."
        }
      ]
    }
  ];

  // Flattened tools for search
  const totalToolCount = optimizerGroups.reduce((acc, g) => acc + g.tools.length, 0);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();
    const results: Array<any> = [];
    optimizerGroups.forEach(g => {
      g.tools.forEach(t => {
        if (
          t.name.toLowerCase().includes(q) ||
          t.desc.toLowerCase().includes(q) ||
          t.badge.toLowerCase().includes(q) ||
          g.groupTitle.toLowerCase().includes(q)
        ) {
          results.push({ ...t, groupTitle: g.groupTitle });
        }
      });
    });
    return results;
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* --- NAVIGATION BAR (Identical to Landing Page for seamless transitions) --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-3.5 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 text-decoration-none">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <i className="bi bi-graph-up-arrow text-white text-base"></i>
            </div>
            <div className="flex flex-col text-start">
              <span className="text-xl font-black tracking-tight text-white leading-none">Planfolio</span>
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mt-0.5">Canada</span>
            </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold">
            <Link href="/#about" className="text-slate-400 hover:text-white transition-colors text-decoration-none">About</Link>
            <Link href="/features" className="text-white border-b-2 border-blue-500 pb-1 text-decoration-none font-bold">Features</Link>
            <Link href="/tools" className="text-slate-400 hover:text-white transition-colors text-decoration-none flex items-center gap-1.5">
              <span>Tools</span>
              <span className="bg-blue-500/20 text-blue-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">Free</span>
            </Link>
            <Link href="/#databank" className="text-slate-400 hover:text-white transition-colors text-decoration-none flex items-center gap-1.5">
              <span>Data Bank</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">New</span>
            </Link>
            <Link href="/#how-it-works" className="text-slate-400 hover:text-white transition-colors text-decoration-none">How It Works</Link>
            <Link href="/#privacy" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Local-First Privacy</Link>
            <Link href="/#pricing" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Pricing</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/planner" 
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-lg shadow-blue-500/25 transition-all text-decoration-none flex items-center gap-1.5"
            >
              <span>Launch Planner</span>
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO HEADER --- */}
      <header className="pt-40 pb-16 border-b border-slate-800/80 bg-gradient-to-b from-[#0b1220] to-[#0f172a] text-center">
        <div className="container mx-auto px-6 max-w-4xl">

          
          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-white mb-6 tracking-tight leading-tight">
            6 Core Engines. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 sm:whitespace-nowrap">
              {totalToolCount} Specialized Smart Optimizers.
            </span>
          </h1>
          
          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl mx-auto mb-8 font-normal">
            Every high-stakes Canadian financial decision modeled down to statutory tax rules — from the Smith Maneuver to LIF unlocking, GIS maximization, and real-world data bank calibration.
          </p>

          <div className="flex flex-wrap justify-center gap-3 text-xs font-semibold text-slate-300 mb-8">
            <span className="bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <i className="bi bi-check-circle text-emerald-400"></i> 6 Master Planning Engines
            </span>

            <span className="bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <i className="bi bi-check-circle text-purple-400"></i> 2026 CRA Tax Engine
            </span>
            <span className="bg-slate-800/80 border border-slate-700 px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
              <i className="bi bi-shield-lock text-cyan-400"></i> 100% Local-First
            </span>
          </div>


        </div>
      </header>

      {/* --- SECTION 1: THE 6 CORE PLANNING ENGINES --- */}
      <section className="py-20 border-b border-slate-800 bg-[#0b1220]" id="core-engines">
        <div className="container mx-auto px-6 max-w-6xl">
          
          <div className="text-start mb-12">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              Foundation Modules
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-2 tracking-tight">
              The 6 Core Planning Engines
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-2xl">
              The foundational multi-decade projection and calibration engines powering Planfolio.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreSuites.map((suite, idx) => (
              <div 
                key={idx}
                className={`bg-gradient-to-br ${suite.bgGradient} border ${suite.borderColor} rounded-3xl p-7 flex flex-col justify-between text-start shadow-xl relative overflow-hidden`}
              >
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center ${suite.color} text-xl shadow-inner`}>
                      <i className={`bi ${suite.icon}`}></i>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${suite.badgeColor}`}>
                      {suite.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2.5 tracking-tight leading-snug">
                    {suite.title}
                  </h3>
                  
                  <p className="text-slate-300 text-xs leading-relaxed mb-6">
                    {suite.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-5 border-t border-slate-800/80">
                  {suite.features.map((feat, fIdx) => (
                    <div key={fIdx} className="text-xs">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <i className={`bi bi-dot ${suite.color} text-lg leading-none`}></i>
                        <span>{feat.name}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] pl-4 leading-relaxed mt-0.5">
                        {feat.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* --- SECTION 2: SPECIALIZED SMART OPTIMIZERS (FULL DIRECTORY) --- */}
      <section className="py-24 bg-[#0f172a]" id="all-calculators">
        <div className="container mx-auto px-6 max-w-6xl">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div className="text-start">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
                Interactive Directory
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-white mt-3 mb-2 tracking-tight">
                All {totalToolCount} Smart Optimizers & Calculators
              </h2>
              <p className="text-slate-400 text-sm md:text-base max-w-xl mb-0">
                Independent, precision tools designed to solve specific high-stakes questions in Canadian wealth.
              </p>
            </div>

            {/* Search Input Bar with embedded magnifying glass icon */}
            <div className="relative w-full sm:w-80 flex items-center">
              <i className="bi bi-search absolute left-3.5 text-slate-400 pointer-events-none text-xs"></i>
              <input 
                type="text"
                placeholder="Search tools (e.g. LIF, Smith, TFSA, CPP)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-full py-2.5 pl-9 pr-9 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
              />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-slate-500 hover:text-white text-xs border-0 bg-transparent p-0"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          {/* IF SEARCH IS ACTIVE, SHOW FLATTENED MATCHES */}
          {searchResults ? (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-6">
                <span className="text-sm text-slate-400">
                  Showing <b>{searchResults.length}</b> tools matching "<span className="text-blue-400">{searchQuery}</span>"
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold bg-transparent border-0 p-0"
                >
                  Clear Search
                </button>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-start">
                {searchResults.map((opt) => (
                  <div 
                    key={opt.id}
                    className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-6 rounded-2xl transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-black/30"
                  >
                    <div>
                      

                      <h4 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                        {opt.name}
                      </h4>
                      
                      <p className="text-slate-400 text-xs leading-relaxed mb-4">
                        {opt.desc}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex justify-end items-center text-[11px]">
                      <Link 
                        href={`/planner?tab=optimizers&tool=${opt.id}`} 
                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-decoration-none group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Open in Planner</span>
                        <i className="bi bi-chevron-right text-[10px]"></i>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {searchResults.length === 0 && (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl my-8">
                  <i className="bi bi-search text-slate-500 text-3xl mb-3 d-block"></i>
                  <h5 className="text-white font-bold mb-1">No Tools Found</h5>
                  <p className="text-slate-400 text-xs mb-4">No tools matched "{searchQuery}". Try searching for "tax", "mortgage", "rrsp", "cpp", or "pension".</p>
                  <button 
                    type="button" 
                    onClick={() => setSearchQuery('')}
                    className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full"
                  >
                    View All {totalToolCount} Tools
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* IF NO SEARCH, SHOW STRUCTURED CATEGORY SECTIONS */
            <div className="space-y-16">
              {optimizerGroups.map((group, gIdx) => (
                <div key={gIdx} className="text-start border-t border-slate-800/80 pt-10">
                  
                  {/* Category Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <i className={`bi ${group.groupIcon} ${group.groupColor} text-lg`}></i>
                        <h3 className="text-2xl font-bold text-white tracking-tight">{group.groupTitle}</h3>
                        <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-bold ml-2">
                          {group.tools.length} Tools
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-2xl mb-0">{group.groupDesc}</p>
                    </div>
                  </div>

                  {/* Category Tools Grid */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.tools.map((opt) => (
                      <div 
                        key={opt.id}
                        className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 p-6 rounded-2xl transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-black/30"
                      >
                        <div>
                          

                          <h4 className="text-base font-bold text-white mb-2 leading-snug group-hover:text-blue-300 transition-colors">
                            {opt.name}
                          </h4>
                          
                          <p className="text-slate-400 text-xs leading-relaxed mb-4">
                            {opt.desc}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex justify-end items-center text-[11px]">
                      <Link 
                            href={`/planner?tab=optimizers&tool=${opt.id}`} 
                            className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 text-decoration-none group-hover:translate-x-0.5 transition-transform"
                          >
                            <span>Open in Planner</span>
                            <i className="bi bi-chevron-right text-[10px]"></i>
                          </Link>
                    </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="py-20 border-t border-slate-800 bg-[#0b1220] text-center">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="p-8 sm:p-10 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl shadow-blue-500/20 relative overflow-hidden">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 tracking-tight max-w-3xl mx-auto">
              Ready to explore all {totalToolCount} optimizers?
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm md:text-base mb-8 opacity-95 font-normal max-w-2xl mx-auto leading-relaxed">
              No account required. All calculations run locally in your browser. Launch Planfolio now.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link 
                href="/planner" 
                className="bg-white text-blue-900 px-9 py-3.5 rounded-full font-bold text-sm hover:bg-slate-100 transition-all shadow-xl text-decoration-none"
              >
                Launch Planner (Free)
              </Link>
              <Link 
                href="/" 
                className="bg-blue-800/60 hover:bg-blue-800 text-white px-8 py-3.5 rounded-full font-bold text-sm border border-blue-400/30 transition-all text-decoration-none"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-12 border-t border-slate-800 bg-[#080d19] text-xs text-slate-500 text-center">
        <div className="container mx-auto px-6">
          <p className="mb-2">Planfolio provides simulation and educational modeling only and does not offer certified tax or legal counsel.</p>
          <p className="mb-0">© {new Date().getFullYear()} Planfolio. All data stored securely and privately on your device.</p>
        </div>
      </footer>

    </div>
  );
}