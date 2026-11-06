/**
 * =========================================================================
 * TARGET PATH IN YOUR PROJECT: app/page.tsx
 * PURPOSE: Main Home / Landing Page (Planfolio Canada)
 * INSTRUCTION: Rename this file to 'page.tsx' and place it in 'app/'
 * =========================================================================
 */
'use client';
import MarketingHeader from '@/components/MarketingHeader';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { id: 1, name: "Plan Summary", icon: "bi-clipboard2-data", img: "/preview-summary.png", tag: "Overview", desc: "Executive KPI dashboard with wealth trajectory, funded ratio, and milestone tracker." },
    { id: 2, name: "Strategy & Optimization", icon: "bi-sliders", img: "/preview-strategy.png", tag: "Decumulation", desc: "Custom accumulation, shortfall, and tax-smart decumulation drawdown sequences." },
    { id: 3, name: "Timeline & Estate Projection", icon: "bi-table", img: "/preview-projection.png", tag: "Granular", desc: "Year-by-year cash flows, tax brackets, spousal survivorship, and after-tax estate." },
    { id: 4, name: "Cash Flow & Spending", icon: "bi-diagram-3", img: "/preview-cashflow.png", tag: "Cash Flow", desc: "Interactive Sankey diagram visualizing income sources, deductions, and living expenses." },
    { id: 5, name: "Risk Assessment & Stress Testing", icon: "bi-activity", img: "/preview-risk.png", tag: "Robustness", desc: "1,000+ run Monte Carlo simulations, Sequence of Returns Risk, and macro shocks." },
    { id: 6, name: "Tools & Calculators", icon: "bi-magic", img: "/preview-tools.png", tag: "Calculators", desc: "Specialized optimizers for RRSP vs TFSA, Smith Maneuver, Marginal Tax Curve, and CCB." }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30 font-sans">
      
      {/* ========================================================= */}
      {/* HEADER / NAVIGATION                                       */}
      {/* ========================================================= */}
      <MarketingHeader />

      {/* ========================================================= */}
      {/* HERO SECTION                                              */}
      {/* ========================================================= */}
      <header id="about" className="relative pt-44 pb-20 overflow-hidden scroll-mt-28">
        <div className="container mx-auto px-6 text-center relative z-10 max-w-5xl">
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-[1.08] tracking-tight text-center w-full">
            <span className="block text-center w-full">The Financial Command Center</span>
            <span className="block text-center w-full text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400">
              Built for Modern Canadians.
            </span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10 leading-relaxed font-normal">
            From cash flow forecasting to lifetime decumulation, CRA tax minimization, spousal survivorship, and annual roll-forward calibration — Planfolio delivers institutional-grade modeling directly to your browser with zero cloud tracking.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
            <Link 
              href="/planner" 
              className="w-full sm:w-auto bg-white text-slate-900 px-9 py-4 rounded-full font-bold hover:bg-slate-100 transition-all text-base shadow-xl shadow-white/10 text-decoration-none text-center flex items-center justify-center gap-2 group"
            >
              <span>Start Your Plan (Free)</span>
              <i className="bi bi-arrow-right text-slate-900 group-hover:translate-x-1 transition-transform"></i>
            </Link>
            
            <Link 
              href="/tools" 
              className="w-full sm:w-auto bg-slate-800/80 text-white px-8 py-4 rounded-full font-bold border border-slate-700 hover:bg-slate-800 hover:border-slate-600 transition-all text-base text-decoration-none text-center flex items-center justify-center gap-2"
            >
              <span>Tools</span>
            </Link>
            <Link 
              href="/features" 
              className="w-full sm:w-auto bg-slate-800/50 text-slate-300 hover:text-white px-8 py-4 rounded-full font-semibold border border-slate-700/60 hover:bg-slate-800/80 transition-all text-base text-decoration-none text-center flex items-center justify-center gap-2"
            >
              <span>Explore Features</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-sm max-w-4xl mx-auto text-start">
            <div className="border-r border-slate-800/80 pr-4">
              <div className="text-2xl font-black text-white mb-0.5">2026 Ready</div>
              <div className="text-xs text-slate-400 font-medium">Federal & Provincial CRA Tax Brackets + OAS Clawback Logic</div>
            </div>
            <div className="border-r border-slate-800/80 pr-4">
              <div className="text-2xl font-black text-emerald-400 mb-0.5">100% Private</div>
              <div className="text-xs text-slate-400 font-medium">Zero server storage; data stays on your local machine</div>
            </div>
            <div className="border-r border-slate-800/80 pr-4">
              <div className="text-2xl font-black text-blue-400 mb-0.5">1,000+ Runs</div>
              <div className="text-xs text-slate-400 font-medium">Monte Carlo & Sequence of Returns market stress testing</div>
            </div>
            <div>
              <div className="text-2xl font-black text-cyan-400 mb-0.5">Data Bank</div>
              <div className="text-xs text-slate-400 font-medium">Annual actuals archive & benchmark calibration</div>
            </div>
          </div>

        </div>
        
        {/* Glow ambient background */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[520px] bg-blue-600/10 blur-[140px] rounded-full -z-10 pointer-events-none"></div>
      </header>

      {/* ========================================================= */}
      {/* THE 6 CORE PILLARS (BENTO FEATURE GRID)                   */}
      {/* ========================================================= */}
      <section id="features" className="py-24 border-t border-slate-800 relative bg-[#0b1220] scroll-mt-28">
        <div className="container mx-auto px-6">
          
          <div className="text-center max-w-3xl mx-auto mb-16">

            <h2 className="text-3xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
              Engineered for the Realities of Canadian Wealth
            </h2>
            <p className="text-slate-400 text-base md:text-lg">
              Generic calculators assume a flat tax rate and static growth. Planfolio models true legislative rules, tax-sheltered accounts, spousal survivorship, and real-world portfolio tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* PILLAR 1: DATA BANK & CALIBRATION (HIGHLIGHTED) */}
            <div id="databank" className="lg:col-span-2 scroll-mt-28 bg-gradient-to-br from-slate-900 to-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/60 rounded-3xl p-8 transition-all group shadow-xl relative overflow-hidden text-start">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 blur-3xl -z-0"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
                    <i className="bi bi-clock-history"></i>
                  </div>
                  <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Signature Feature
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  Annual Data Bank & Real-World Calibration
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Your plan shouldn't gather dust after day one. When calendar years conclude, the <b>Annual Roll-Forward Wizard</b> snapshots your December 31 statement actuals, advances household ages, and calculates your true compound investment returns.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-300 mb-6">
                  <div className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <i className="bi bi-check2-circle text-emerald-400 text-base flex-shrink-0 mt-0.5"></i>
                    <span><b>Plan Assumption Calibration:</b> Directly compare real-world actual returns against your plan's benchmark growth rate.</span>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <i className="bi bi-check2-circle text-emerald-400 text-base flex-shrink-0 mt-0.5"></i>
                    <span><b>Automatic Balance Chaining:</b> Jan 1 opening net worth chains seamlessly from prior year-end closes.</span>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <i className="bi bi-check2-circle text-emerald-400 text-base flex-shrink-0 mt-0.5"></i>
                    <span><b>Baseline Isolation:</b> Separates initial starting snapshots so historical averages reflect true performance.</span>
                  </div>
                  <div className="flex items-start gap-2 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                    <i className="bi bi-check2-circle text-emerald-400 text-base flex-shrink-0 mt-0.5"></i>
                    <span><b>Automated Safety Backups:</b> Creates immutable local storage restore points before executing roll-forwards.</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link href="/databank" className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 text-decoration-none">
                    <span>Explore Data Bank & Roll-Forward</span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* PILLAR 2: CRA TAX & PENSIONS */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 transition-all text-start flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xl mb-6">
                  <i className="bi bi-bank2"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">CRA Tax Engine & Pensions</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Full 2026 federal and provincial tax brackets, non-refundable credits, CPP & OAS timing (ages 60–70), spousal pension splitting, and automatic OAS clawback recovery modeling.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-blue-400"></i> Provincial Indexation (ON, BC, AB, etc.)</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-blue-400"></i> OAS Clawback Threshold Protection</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-blue-400"></i> Up to 50% Eligible Pension Splitting</li>
              </ul>
            </div>

            {/* PILLAR 3: DEEP ACCOUNT MODELING */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 transition-all text-start flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-xl mb-6">
                  <i className="bi bi-piggy-bank-fill"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Full Account Architecture</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Granular rules for TFSA, RRSP, FHSA, RESP, LIRA/LIRF, and LIF accounts. Models statutory LIF maximum withdrawal ceilings, minimum RRIF factors, and non-registered Adjusted Cost Base (ACB).
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-purple-400"></i> LIF Max Ceiling & Prior Gain Tracking</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-purple-400"></i> Capital Gains & Dividend Tax Credits</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-purple-400"></i> Non-Reg & Crypto Cost-Base (ACB)</li>
              </ul>
            </div>

            {/* PILLAR 4: ESTATE & SURVIVORSHIP */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 transition-all text-start flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xl mb-6">
                  <i className="bi bi-person-heart"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Estate & Survivorship</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Know exactly what happens upon death. Forecasts net after-tax estate values with complete tax math transparency and simulates P1 vs P2 survivorship scenarios to protect the surviving spouse.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-rose-400"></i> Transparent Tax Math Formula Modal</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-rose-400"></i> P1 / P2 Independent Mortality Sequencing</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-rose-400"></i> Deemed Disposition on RRSP/RRIF Assets</li>
              </ul>
            </div>

            {/* PILLAR 5: MONTE CARLO & RISK */}
            <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-8 transition-all text-start flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xl mb-6">
                  <i className="bi bi-activity"></i>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Risk & Stress Testing</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Institutional stress-testing at your fingertips. Run 1,000+ stochastic simulations to measure probability of plan success, test Sequence of Returns Risk (early retirement crashes), and shock test inflation.
                </p>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-4 border-t border-slate-800">
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-amber-400"></i> 1,000-Trial Monte Carlo Engine</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-amber-400"></i> 1970s & 2008 Bear Market Stress Testing</li>
                <li className="flex items-center gap-2"><i className="bi bi-check-lg text-amber-400"></i> Emergency Cash Buffer Depletion Alerts</li>
              </ul>
            </div>

            {/* PILLAR 6: SCENARIO COMPARE & OPTIMIZERS (WIDE) */}
            <div className="lg:col-span-3 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800 hover:border-blue-500/40 rounded-3xl p-8 transition-all text-start">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-sm">
                      <i className="bi bi-bar-chart-line"></i>
                    </span>
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Multi-Plan Comparison & Tools</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Compare Scenarios Side-by-Side & Optimize Every Dollar</h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Test critical financial forks in the road: retiring at 55 vs 60, aggressive equity vs conservative allocation, or downsizing home equity. Plus, utilize dedicated calculators for the <b>Smith Maneuver</b>, <b>RRSP vs TFSA advantage</b>, <b>Marginal Tax Curves</b>, and <b>Canada Child Benefit (CCB) maximization</b>.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
                  <Link href="/planner?tab=compare" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl text-center text-sm transition-all text-decoration-none shadow-lg shadow-blue-500/20">
                    Compare Saved Plans
                  </Link>
                  <Link href="/tools" className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-3 px-6 rounded-2xl text-center text-sm transition-all text-decoration-none border border-slate-700">
                    Explore Tools
                  </Link>
                </div>
              </div>
            </div>

          </div>



        </div>
      </section>

      {/* ========================================================= */}
      {/* SYSTEM WALKTHROUGH & SLIDER CAROUSEL                      */}
      {/* ========================================================= */}
      <section className="py-24 border-t border-slate-800 bg-[#0f172a]">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto">
            
            <div className="lg:col-span-5 text-start">

              <h2 className="text-3xl md:text-4xl font-bold text-white mt-4 mb-4">
                A Unified Dashboard for Every Life Milestone
              </h2>
              <p className="text-slate-400 text-base leading-relaxed mb-8">
                Planfolio combines high-level KPI summaries with deep, cell-by-cell transparency. Click through the preview cards to tour the system modules.
              </p>

              <div className="space-y-2">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`w-full text-start p-3.5 rounded-2xl transition-all border flex items-center justify-between ${
                      idx === currentSlide 
                        ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-sm' 
                        : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <i className={`bi ${s.icon} ${idx === currentSlide ? 'text-blue-400' : 'text-slate-500'}`}></i>
                      <span className="text-sm font-semibold">{s.name}</span>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {s.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-slate-800/40 border border-slate-700/80 p-3 rounded-[2.5rem] shadow-2xl">
                <div className="bg-[#0b1220] rounded-[2rem] border border-slate-700/80 relative overflow-hidden aspect-[16/10] flex flex-col group">
                  <div className="flex-1 w-full h-full relative bg-slate-950">
                    {slides.map((slide, i) => (
                      <div 
                        key={slide.id} 
                        className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
                          i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                      >
                        <Image 
                          src={slide.img} 
                          alt={slide.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 60vw"
                          priority={i === 0}
                          className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0b1220] via-[#0b1220]/90 to-transparent pt-16 pb-6 px-8 text-start">
                          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">{slide.tag} Module</span>
                          <h3 className="text-xl font-bold text-white tracking-wide mt-1 flex items-center gap-2.5">
                            <i className={`bi ${slide.icon} text-blue-400`}></i> {slide.name}
                          </h3>
                          <p className="text-slate-300 text-xs mt-1 max-w-lg mb-0">{slide.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dot indicators */}
                  <div className="absolute top-4 right-6 flex gap-1.5 z-20">
                    {slides.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCurrentSlide(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 border-0 p-0 ${
                          i === currentSlide ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600/60 hover:bg-slate-400'
                        }`}
                        aria-label={`Slide ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* HOW IT WORKS (THE 3-STEP LIFECYCLE)                       */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-24 border-t border-slate-800 bg-[#0b1220] scroll-mt-28">
        <div className="container mx-auto px-6 text-center max-w-5xl">
          

          <h2 className="text-3xl md:text-5xl font-black text-white mt-4 mb-4 tracking-tight">
            How Planfolio Works Across Your Life
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto mb-16">
            A continuous loop of planning, stress-testing, and real-world calibration as your wealth evolves.
          </p>

          <div className="grid md:grid-cols-3 gap-8 text-start relative">
            
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Model Your Baseline</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Enter your household details, investment balances (TFSA, RRSP, FHSA, Non-Reg), pensions, real estate mortgages, and desired retirement lifestyle.
              </p>
              <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                <i className="bi bi-shield-check"></i> 100% saved in your browser
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl relative">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Optimize & Stress Test</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Explore tax-minimizing drawdown orders, test early vs late CPP/OAS timing, run 1,000 Monte Carlo runs, and review your net after-tax estate breakdown.
              </p>
              <span className="text-xs text-blue-400 font-semibold flex items-center gap-1">
                <i className="bi bi-sliders"></i> Algorithmic CRA Tax Optimization
              </span>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 p-8 rounded-3xl relative shadow-xl shadow-emerald-500/5">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Calibrate & Roll Forward</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                At year-end, use the Data Bank's 1-Click Wizard to archive your actual statement closes, calibrate real returns against your 6% plan benchmark, and roll forward +1 year.
              </p>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <i className="bi bi-arrow-repeat"></i> Closes the plan vs reality gap
              </span>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* LOCAL-FIRST PRIVACY PROMISE                               */}
      {/* ========================================================= */}
      <section id="privacy" className="py-20 border-t border-slate-800 bg-[#0f172a] scroll-mt-28">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-700/80 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden text-start">
            
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>

                <h2 className="text-3xl md:text-4xl font-black text-white mt-4 mb-4 tracking-tight">
                  Your Net Worth Belongs to You. Not Our Cloud.
                </h2>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Most modern financial tools require connecting bank credentials or saving your entire lifetime balance sheet on foreign servers. Planfolio runs on a strict <b>Local-First Philosophy</b>:
                </p>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <i className="bi bi-check-circle-fill text-emerald-400 text-base"></i>
                    <span><b>Processed On-Device:</b> Tax math and Monte Carlo simulations execute inside your browser using client web workers.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <i className="bi bi-check-circle-fill text-emerald-400 text-base"></i>
                    <span><b>Zero Telemetry or Data Selling:</b> We never sell, transmit, or aggregate your net worth or scenario records.</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <i className="bi bi-check-circle-fill text-emerald-400 text-base"></i>
                    <span><b>Full Exportability:</b> Back up your entire plan and historical ledger anytime in open JSON or CSV formats.</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0b1220] border border-slate-800 rounded-2xl p-6 text-xs font-mono space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 font-sans">
                  <span className="font-bold flex items-center gap-2 text-white">
                    <i className="bi bi-shield-check text-emerald-400"></i> Planfolio Storage Audit
                  </span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">CLIENT LOCAL STORAGE</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-blue-400">User Data:</span> <span className="text-emerald-300">localStorage['retirement_plan_data']</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-blue-400">Local Cache:</span> <span className="text-emerald-300">IndexedDB['PlanfolioLocalDB']</span>
                </div>
                <div className="text-slate-400">
                  <span className="text-blue-400">Network Transmission:</span> <span className="text-red-400 font-bold">0 bytes sent to external servers</span>
                </div>
                <div className="pt-2 text-[11px] font-sans text-slate-400 border-t border-slate-800 leading-relaxed">
                  You can even disconnect your internet entirely after loading — Planfolio will continue running simulations without interruption.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ========================================================= */}
      {/* HOW PLANFOLIO COMPARES (CANADIAN RETIREMENT TOOLS)         */}
      {/* ========================================================= */}
      <section id="compare" className="py-24 border-t border-slate-800 bg-[#0b1220] scroll-mt-28">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
              How Planfolio Compares
            </h2>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed font-normal">
              Compare Planfolio directly against the most popular Canadian retirement platforms, advisor software, and DIY spreadsheets.
            </p>
          </div>

          {/* COMPARISON MATRIX TABLE */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm shadow-2xl mb-12">
            <table className="w-full text-start text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300">
                  <th className="p-4 sm:p-5 font-bold text-left min-w-[170px]">Feature</th>
                  <th className="p-4 sm:p-5 font-black text-center min-w-[170px] bg-blue-600/15 border-x border-blue-500/30 text-white relative">
                    <span className="block text-xs uppercase tracking-widest text-blue-400 font-bold mb-0.5">Recommended</span>
                    <span className="text-base font-extrabold text-blue-300">Planfolio Canada 🇨🇦</span>
                  </th>
                  <th className="p-4 sm:p-5 font-bold text-center min-w-[130px] text-slate-300">MayRetire</th>
                  <th className="p-4 sm:p-5 font-bold text-center min-w-[130px] text-slate-300">Adviice</th>
                  <th className="p-4 sm:p-5 font-bold text-center min-w-[140px] text-slate-300">ProjectionLab</th>
                  <th className="p-4 sm:p-5 font-bold text-center min-w-[150px] text-slate-300">Snap Projections</th>
                  <th className="p-4 sm:p-5 font-bold text-center min-w-[130px] text-slate-300">DIY Spreadsheets</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
                {/* Pricing */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Pricing</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    Free
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400 font-semibold">Free</td>
                  <td className="p-4 sm:p-5 text-center">$99 – $150+/yr</td>
                  <td className="p-4 sm:p-5 text-center">$108 – $500+/yr</td>
                  <td className="p-4 sm:p-5 text-center">$1,200 – $2,400+/yr</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Free</td>
                </tr>

                {/* Data Privacy & Multi-Device Sync Combined */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Data Privacy & Sync</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    100% Local (Manual File Transfer)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Cloud Sync</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Cloud Sync</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Cloud Sync</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Cloud Sync</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Local File</td>
                </tr>

                {/* Account Requirement */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Account Required</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    No Account (Zero Sign-Up)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Account Required</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Account Required</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Account Required</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Account Required</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">No Account</td>
                </tr>

                {/* CRA Tax Engine */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">CRA 2026 Tax Rules</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    All 13 Provinces
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">All 13 Provinces</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">All 13 Provinces</td>
                  <td className="p-4 sm:p-5 text-center text-amber-400">Basic Presets (US Focus)</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">All 13 Provinces</td>
                  <td className="p-4 sm:p-5 text-center text-rose-400">Manual Formulas</td>
                </tr>

                {/* CPP/OAS */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">CPP & OAS Optimization</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    Supported
                  </td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported</td>
                  <td className="p-4 sm:p-5 text-center text-amber-400">Basic Estimates</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported</td>
                  <td className="p-4 sm:p-5 text-center text-rose-400">Manual Formulas</td>
                </tr>

                {/* 50% LIF Unlocking */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">50% LIF / LIRA Unlocking</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    Supported
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Not Supported</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Not Supported</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Not Supported</td>
                </tr>

                {/* Corporate / HoldCo Planning */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Corporate / HoldCo Planning</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-slate-400">
                    Personal Accounts Only
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">Personal Accounts Only</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported (Full CCPC)</td>
                  <td className="p-4 sm:p-5 text-center text-amber-400">Basic</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Supported (Full CCPC)</td>
                  <td className="p-4 sm:p-5 text-center text-rose-400">Manual Formulas</td>
                </tr>

                {/* CFP Advisor Network */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">CFP Advisor Network</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-slate-400">
                    None (100% Self-Directed)
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Available (Partner Directory)</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Built for CFPs (Advisor Platform)</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                </tr>

                {/* 20+ Free Standalone Tools */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">20+ Free Standalone Tools</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    Included
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                </tr>

                {/* Annual Track Record Calibration */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Annual Actuals Data Bank</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    Included
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                  <td className="p-4 sm:p-5 text-center text-slate-500">None</td>
                </tr>

                {/* Data Backup & Portability */}
                <tr className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-white">Plan Backup & Restore</td>
                  <td className="p-4 sm:p-5 text-center font-bold bg-blue-600/10 border-x border-blue-500/30 text-emerald-400">
                    1-Click JSON Backup
                  </td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">CSV Export Only</td>
                  <td className="p-4 sm:p-5 text-center text-rose-400">No Re-Import</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">JSON Export</td>
                  <td className="p-4 sm:p-5 text-center text-slate-400">Advisor Controlled</td>
                  <td className="p-4 sm:p-5 text-center text-emerald-400">Local File</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3 HIGHLIGHT CARDS */}
          <div className="grid md:grid-cols-3 gap-6 text-start">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-2">vs. Subscription Software (Adviice)</div>
              <h3 className="text-base font-bold text-white mb-2">No Subscription Paywall or Data Traps</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-0">
                Platforms like Adviice charge $99–$150+/year and delete your data if you pause your subscription. Planfolio gives you full institutional-grade modeling for free with 1-click encrypted JSON export/restore.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-purple-400 font-bold text-xs uppercase tracking-wider mb-2">vs. Global / US Tools (ProjectionLab)</div>
              <h3 className="text-base font-bold text-white mb-2">Built for 2026 CRA Statutory Tax Law</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-0">
                US-centric tools use generic estimates that miscalculate Canadian provincial brackets, OAS clawback recovery tax, and 50% LIF unlocking limits. Planfolio models all 13 Canadian provinces and territories down to the dollar.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
              <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">vs. DIY Excel Spreadsheets</div>
              <h3 className="text-base font-bold text-white mb-2">Decades of Modeling in Seconds</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-0">
                Stop maintaining broken 40-year spreadsheet macros. Planfolio automates spousal pension income splitting, Monte Carlo stress testing, and real-world statement calibration with zero formula maintenance.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* PRICING SECTION                                           */}
      {/* ========================================================= */}
      <section id="pricing" className="py-24 bg-slate-900/40 border-t border-slate-800 scroll-mt-28">
        <div className="container mx-auto px-6 text-center">

          <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-4">Straightforward, 100% Free Access</h2>
          <p className="text-slate-400 mb-14 max-w-xl mx-auto text-base">
            Professional-grade Canadian financial planning, made accessible to all households without expensive subscriptions or advisor retainers.
          </p>
          
          <div className="max-w-xl mx-auto">
            
            {/* 100% FREE CARD */}
            <div className="bg-[#0f172a] border-2 border-blue-600 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl shadow-blue-500/10 text-start relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 blur-2xl rounded-full"></div>
              
              <div>
                <div className="flex justify-between items-center">
                  <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                    Free & Local-First
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                    <i className="bi bi-shield-check"></i> No Credit Card Needed
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mt-4">Full Access Canadian Simulator</h3>
                <div className="text-5xl font-black text-white my-6">
                  $0 <span className="text-base font-normal text-slate-400">/ forever free to use</span>
                </div>
                
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                  Complete access to all core simulation modules, the Annual Data Bank, and CRA multi-province tax optimizations with zero cloud storage.
                </p>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                  <li className="flex items-center gap-2.5"><i className="bi bi-check-circle-fill text-emerald-400 font-bold"></i> All 9 Core Planning Tabs & Smart Optimizers</li>
                  <li className="flex items-center gap-2.5"><i className="bi bi-check-circle-fill text-emerald-400 font-bold"></i> Annual Roll-Forward Wizard & Actuals Data Bank</li>
                  <li className="flex items-center gap-2.5"><i className="bi bi-check-circle-fill text-emerald-400 font-bold"></i> 2026 CRA Tax Engine (Federal & All 13 Provinces)</li>
                  <li className="flex items-center gap-2.5"><i className="bi bi-check-circle-fill text-emerald-400 font-bold"></i> 20+ Free Standalone Financial Calculators</li>
                  <li className="flex items-center gap-2.5"><i className="bi bi-check-circle-fill text-emerald-400 font-bold"></i> 100% Local-First Storage (Zero Cloud Tracking)</li>
                  <li className="flex items-center gap-2.5"><i className="bi bi-check-circle-fill text-emerald-400 font-bold"></i> 1-Click Encrypted JSON Backup & Restore</li>
                </ul>
              </div>

              <Link 
                href="/planner" 
                className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all text-decoration-none shadow-lg shadow-blue-600/30 text-base"
              >
                Launch Free Planner Now
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FREQUENTLY ASKED QUESTIONS (SEO & FAQ SCHEMA)             */}
      {/* ========================================================= */}
      <section id="faq" className="py-20 border-t border-slate-800 bg-[#0d1527] scroll-mt-28">
        <div className="container mx-auto px-6 max-w-4xl text-start">
          <div className="text-center mb-12">

            <h2 className="text-3xl md:text-4xl font-black text-white mt-3 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
              Everything you need to know about Canada's most accurate DIY retirement planner.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">What is Planfolio and who is it for?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-0">
                Planfolio is a free, local-first Canadian retirement and financial independence planner. It is built for Canadians looking for an uncompromising, structurally sound tool to simulate multi-decade cash flows, evaluate early retirement, and optimize government pensions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">Is Planfolio really 100% free?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-0">
                Yes. All core engines, tax brackets, decumulation optimizers, and Monte Carlo simulations are completely free to use with zero subscriptions, paywalls, or hidden tiers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">Does Planfolio connect to my bank account?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-0">
                No. Planfolio operates on a strict client-side privacy architecture. We never request bank credentials or store your balances on remote cloud servers. All plan figures are saved safely within your browser's local memory.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">How does Planfolio handle Canadian taxes and all 13 provinces?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-0">
                Planfolio incorporates full statutory marginal tax formulas for all 10 provinces and 3 territories (including Ontario Health Premium, provincial surtaxes, and indexation), Federal and Provincial Basic Personal Amounts (BPA), age credits, and dividend tax credits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">How accurate are the CPP and OAS calculations?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-0">
                Planfolio applies exact CRA early/late actuarial adjustments (-0.6%/mo early penalty from age 60–65, +0.7%/mo late bonus for CPP, +0.6%/mo for OAS), the permanent 10% OAS boost at age 75, and dynamic 15% OAS recovery tax (clawback) thresholds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-base font-bold text-white mb-2">Can Planfolio handle couples and spousal pension splitting?</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-0">
                Yes. Planfolio fully supports single profiles and couples, simulating joint cash flows, spousal survivorship milestones, and algorithmically splitting up to 50% of eligible pension income to minimize joint taxes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FINAL CALL TO ACTION BANNER                               */}
      {/* ========================================================= */}
      <section className="py-20 border-t border-slate-800 bg-gradient-to-b from-[#0f172a] to-[#0a0f1c] text-center">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="p-10 md:p-16 rounded-[3rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-2xl shadow-blue-500/25 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Ready to take complete control of your financial destiny?
              </h2>
              <p className="text-blue-100 text-base md:text-lg mb-8 max-w-2xl mx-auto opacity-90 font-normal">
                No credit cards. No bank credentials required. Start your simulation in under two minutes.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/planner" 
                  className="bg-white text-blue-900 px-10 py-4 rounded-full font-bold text-base hover:bg-slate-100 transition-all shadow-xl text-decoration-none"
                >
                  Start Your Free Plan
                </Link>
                <Link 
                  href="/features" 
                  className="bg-blue-800/60 hover:bg-blue-800 text-white px-8 py-4 rounded-full font-bold text-base border border-blue-400/30 transition-all text-decoration-none"
                >
                  View Feature Details
                </Link>
              </div>
            </div>
            
            {/* Ambient circle glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/10 blur-3xl rounded-full pointer-events-none"></div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}
      <footer className="py-16 border-t border-slate-800 bg-[#080d19]">
        <div className="container mx-auto px-6 text-start max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
            <div className="flex items-center gap-2.5">
              <div className="bg-blue-600 p-2 rounded-xl">
                <i className="bi bi-graph-up-arrow text-white"></i>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-xl leading-none">Planfolio</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Retirement & Financial Simulator</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-slate-400 font-semibold">
              <Link href="/planner" className="hover:text-white transition-colors text-decoration-none">Launch Planner</Link>
              <Link href="/features" className="hover:text-white transition-colors text-decoration-none">Feature Directory</Link>
              <Link href="/tools" className="hover:text-white transition-colors text-decoration-none">Tools</Link>
              <a href="#compare" className="hover:text-white transition-colors text-decoration-none">Compare</a>
              <a href="#faq" className="hover:text-white transition-colors text-decoration-none">FAQ</a>
              <a href="#about" className="hover:text-white transition-colors text-decoration-none">Back to Top</a>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 text-xs text-slate-500 border-t border-slate-800/80 pt-10">
            <div>
              <h4 className="text-slate-400 font-bold mb-3 uppercase tracking-widest text-[11px]">Educational Disclaimer</h4>
              <p className="leading-relaxed">
                Planfolio is an educational simulation tool designed to help Canadians model long-term financial scenarios. It does not provide certified legal, tax, or investment advisory services. Projections are based on user inputs, current CRA statutory rules, and general economic assumptions; real-world market outcomes and tax legislation will fluctuate.
              </p>
            </div>
            <div>
              <h4 className="text-slate-400 font-bold mb-3 uppercase tracking-widest text-[11px]">Privacy & Data Sovereignty</h4>
              <p className="leading-relaxed">
                Planfolio adheres to a strict client-side data architecture. Financial data, custom assets, mortgages, and historical actuals are stored within your device's browser memory (<code>localStorage</code> and <code>IndexedDB</code>). We maintain zero access to your figures, use no third-party tracking pixels, and never sell personal data.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center text-slate-600 text-[11px] mt-12 pt-6 border-t border-slate-800/40 gap-4">
            <p className="mb-0">© {new Date().getFullYear()} Planfolio. Built with pride for Canadians from coast to coast.</p>
            <p className="mb-0 flex items-center gap-1.5 text-slate-500">
              <i className="bi bi-shield-check text-emerald-500"></i>
              <span>100% Client-Side Simulation</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Structured Data (Schema.org) for Google Search Engine Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebApplication",
                "@id": "https://www.planfolio.ca/#webapp",
                "name": "Planfolio",
                "url": "https://www.planfolio.ca",
                "applicationCategory": "FinanceApplication",
                "operatingSystem": "All",
                "description": "Free, local-first Canadian retirement and cash flow planner. Model CPP, OAS, all 13 provincial tax brackets, TFSA vs RRSP, LIF unlocking, and financial tools & calculators.",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "CAD"
                },
                "featureList": [
                  "13 Canadian Provincial and Territorial Tax Schedules",
                  "CPP & OAS Actuarial Early/Late Multipliers and OAS Recovery Tax",
                  "LIF to RRIF 50% Unlocking and Maximum Ceilings",
                  "TFSA, RRSP, FHSA, RESP, and Non-Reg ACB Tracking",
                  "Canadian Financial & Debt Tools",
                  "Monte Carlo and Sequence of Returns Risk Simulation",
                  "Local-First Zero Sign-Up Architecture"
                ]
              },
              {
                "@type": "FAQPage",
                "@id": "https://www.planfolio.ca/#faq",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "How does Planfolio compare to Adviice, MayRetire, Snap Projections, and ProjectionLab?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Planfolio is 100% free with zero sign-up required and operates on a strict local-first privacy model where zero bytes of your financial data are stored on remote cloud servers. Unlike Adviice ($99–$150+/year) or Snap Projections ($1,200+/year advisor software), Planfolio provides institutional-grade 2026 CRA tax modeling across all 13 provinces, 20+ standalone financial calculators, and full decumulation planning without subscriptions or account lock-in. Unlike MayRetire, Planfolio includes 20+ free standalone calculators, multi-scenario comparisons, and the signature Annual Data Bank calibration engine. Unlike US-centric tools like ProjectionLab, Planfolio is engineered specifically for Canadian statutory rules, including 50% LIF unlocking, OAS clawback recovery tax, and spousal pension splitting."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "What is Planfolio and who is it for?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Planfolio is a free, local-first Canadian retirement and financial independence planner. It is built for Canadians looking for an uncompromising, structurally sound tool to simulate multi-decade cash flows, evaluate early retirement, and optimize government pensions."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Is Planfolio really 100% free?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. All core engines, tax brackets, decumulation optimizers, and Monte Carlo simulations are completely free to use with zero subscriptions, paywalls, or hidden tiers."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Does Planfolio connect to my bank account?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "No. Planfolio operates on a strict client-side privacy architecture. We never request bank credentials or store your balances on remote cloud servers. All plan figures are saved safely within your browser's local memory."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How does Planfolio handle Canadian taxes across all 13 provinces and territories?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Planfolio incorporates full statutory marginal tax formulas for all 10 provinces and 3 territories, including Ontario Health Premium, provincial surtaxes, Basic Personal Amounts (BPA), age credits, and dividend tax credits."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "How accurate are the CPP and OAS calculations?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Planfolio applies exact CRA early/late actuarial adjustments (-0.6%/mo early penalty from age 60 to 65, +0.7%/mo late bonus for CPP, +0.6%/mo for OAS), the permanent 10% OAS boost at age 75, and dynamic 15% OAS recovery tax (clawback) thresholds."
                    }
                  },
                  {
                    "@type": "Question",
                    "name": "Can Planfolio handle couples and spousal pension splitting?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "Yes. Planfolio fully supports single profiles and couples, simulating joint cash flows, spousal survivorship milestones, and algorithmically splitting up to 50% of eligible pension income to minimize joint taxes."
                    }
                  }
                ]
              }
            ]
          })
        }}
      />
    </div>
  );
}