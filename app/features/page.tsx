'use client';
import React from 'react';
import Link from 'next/link';

export default function FeaturesPage() {
  const featureGroups = [
    {
      title: "Core Planning Engine",
      description: "Comprehensive data modeling tailored for the Canadian financial landscape.",
      features: [
        { name: "CRA Tax Engine", desc: "Detailed provincial and federal tax calculations including 2026 brackets.", icon: "bi-bank" },
        { name: "CPP & OAS Modeling", desc: "Accurate benefit estimation with start-age adjustments and clawback logic.", icon: "bi-calculator" },
        { name: "Real Estate & Mortgage", desc: "Track primary residences and rentals with integrated amortization schedules.", icon: "bi-house" }
      ]
    },
    {
      title: "Advanced Projections",
      description: "Visualizing your financial journey over decades with deep granularity.",
      features: [
        { name: "Timeline Projection", desc: "Year-by-year breakdown of Net Worth, Cash Flow, and Taxable Income.", icon: "bi-table" },
        { name: "Liquid vs. Total NW", desc: "Separate your spendable assets from home equity for a realistic view.", icon: "bi-layers" },
        { name: "Estate Analysis", desc: "Forecast your after-tax estate value for legacy and inheritance planning.", icon: "bi-person-heart" }
      ]
    },
    {
      title: "Risk & Stress Testing",
      description: "Preparing for the unexpected with institutional-grade modeling.",
      features: [
        { name: "Monte Carlo Simulations", desc: "Run 1,000+ scenarios to determine your plan's probability of success.", icon: "bi-graph-up" },
        { name: "Sequence of Returns Risk", desc: "Visualize the impact of market crashes early in retirement.", icon: "bi-activity" },
        { name: "Macro Shocks", desc: "Stress test your plan against high inflation or sudden interest rate hikes.", icon: "bi-lightning-charge" }
      ]
    },
    {
      title: "Optimization Tools",
      description: "Specialized calculators to fine-tune every dollar.",
      features: [
        { name: "RRSP vs TFSA", desc: "Algorithmically determine which account offers the best marginal tax advantage.", icon: "bi-arrow-left-right" },
        { name: "Smith Maneuver", desc: "Model the conversion of mortgage debt into tax-deductible investment debt.", icon: "bi-shield-check" },
        { name: "CCB Maximizer", desc: "Optimize income reporting to maximize Canada Child Benefit payments.", icon: "bi-people" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <i className="bi bi-graph-up-arrow text-white"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Planfolio</span>
          </Link>
          <Link href="/planner" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold transition-all">
            Open Planner
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-16">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">Designed for the <span className="text-blue-500">Sophisticated</span> Canadian.</h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Planfolio is more than just a calculator. It is a full-scale simulation environment that respects the unique complexities of our tax system.
            </p>
          </div>

          <div className="space-y-24">
            {featureGroups.map((group, idx) => (
              <div key={idx} className="border-t border-slate-800 pt-12">
                <div className="mb-10">
                  <h2 className="text-2xl font-bold text-white mb-2">{group.title}</h2>
                  <p className="text-slate-400">{group.description}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.features.map((feature, fIdx) => (
                    <div key={fIdx} className="bg-slate-800/30 border border-slate-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors group">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                        <i className={`bi ${feature.icon} text-blue-500 text-xl`}></i>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{feature.name}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-blue-600 to-blue-800 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to see the full picture?</h2>
            <Link href="/planner" className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-xl">
              Start Free Simulation
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800 bg-[#0a0f1c]">
        <div className="container mx-auto px-6 text-center">
           <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Planfolio. Built for educational use.</p>
        </div>
      </footer>
    </div>
  );
}