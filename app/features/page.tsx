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
      
      {/* --- UPDATED HEADER --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <i className="bi bi-graph-up-arrow text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Planfolio</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold">
            <Link href="/#about" className="text-slate-400 hover:text-white transition-colors text-decoration-none">About</Link>
            <Link href="/features" className="text-white transition-colors text-decoration-none border-b-2 border-blue-500 pb-1">Features</Link>
            <Link href="/#pricing" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            {/* GREYED OUT LOGIN - REMOVED GET STARTED */}
            <button 
              disabled 
              className="text-xs font-bold bg-slate-800/50 text-slate-500 px-5 py-2 rounded-full border border-slate-700 cursor-not-allowed opacity-60 hidden sm:block tracking-widest"
            >
              LOG IN
            </button>
          </div>
        </div>
      </nav>

      <main className="pt-48 pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mb-24 text-start">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
              Designed for the <span className="text-blue-500">Sophisticated</span> Canadian.
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed max-w-2xl">
              Planfolio is more than just a calculator. It is a full-scale simulation environment that respects the unique complexities of our tax system.
            </p>
          </div>

          <div className="space-y-32">
            {featureGroups.map((group, idx) => (
              <div key={idx} className="border-t border-slate-800 pt-12">
                <div className="mb-12">
                  <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{group.title}</h2>
                  <p className="text-lg text-slate-400 max-w-2xl">{group.description}</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {group.features.map((feature, fIdx) => (
                    <div key={fIdx} className="bg-slate-800/30 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group">
                      <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                        <i className={`bi ${feature.icon} text-blue-500 text-2xl`}></i>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{feature.name}</h3>
                      <p className="text-slate-400 leading-relaxed text-sm">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-40 p-12 rounded-[3.5rem] bg-gradient-to-br from-blue-600 to-blue-800 text-center shadow-2xl shadow-blue-500/20">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">Ready to see the full picture?</h2>
            <Link href="/planner" className="inline-block bg-white text-blue-600 px-12 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-xl text-decoration-none">
              Start Your Simulation
            </Link>
          </div>
        </div>
      </main>

      {/* --- PROFESSIONAL FOOTER --- */}
      <footer className="py-16 border-t border-slate-800 bg-[#0a0f1c]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm">
                <i className="bi bi-graph-up-arrow text-white"></i>
              </div>
              <span className="font-bold text-white text-xl">Planfolio</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} Planfolio. Data processed locally and securely.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 text-xs text-slate-500 border-t border-slate-800/60 pt-10">
            <div>
              <h4 className="text-slate-400 font-bold mb-3 uppercase tracking-widest">Terms of Use</h4>
              <p className="leading-relaxed">
                Planfolio is an educational simulation tool intended for informational use only. It does not provide professional financial, legal, or tax advice. All projections are based on user data and historical market assumptions; actual results will vary. Always consult with a certified professional before making significant financial commitments.
              </p>
            </div>
            <div>
              <h4 className="text-slate-400 font-bold mb-3 uppercase tracking-widest">Privacy Policy</h4>
              <p className="leading-relaxed">
                Planfolio follows a local-first philosophy. Your sensitive financial data is processed and stored locally within your browser. We do not transmit your personal financial scenarios to our servers, nor do we sell your data to third parties. All calculations remain private to your device.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}