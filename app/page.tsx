import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/80 backdrop-blur-md border-bottom border-slate-800">
        <div className="container mx-auto px-6 py-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="bi bi-graph-up-arrow text-white"></i>
            </div>
            <span className="text-xl fw-bold tracking-tight text-white">SuperApp</span>
          </div>
          <div className="hidden md-flex align-items-center gap-8 text-sm fw-medium">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#comparison" className="hover:text-blue-400 transition-colors">Compare</a>
            <Link href="/planner" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full transition-all shadow-lg shadow-blue-500/20">
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent -z-10"></div>
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex align-items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-xs fw-bold text-blue-400 tracking-wider uppercase">2026 CRA Ready</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl fw-extrabold text-white mb-6 tracking-tight leading-tight">
            Master Your Financial Future, <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              From Today’s Coffee to Tomorrow’s Retirement.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            The only Canadian "Super App" that syncs your daily spending directly into a professional-grade retirement engine. Built for the complex reality of CRA tax brackets, CPP/OAS, and advanced wealth-building strategies.
          </p>
          
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-4">
            <Link href="/planner" className="bg-white text-slate-900 px-8 py-4 rounded-xl fw-bold hover:bg-slate-100 transition-all text-lg shadow-xl">
              Build Your Free Plan
            </Link>
            <Link href="/expenses" className="bg-slate-800 text-white px-8 py-4 rounded-xl fw-bold border border-slate-700 hover:bg-slate-700 transition-all text-lg">
              Track Your Spending
            </Link>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl fw-bold text-white mb-4">Precision Engineering for Your Wealth</h2>
            <p className="text-slate-400">Advanced tools that Big Banks don't want you to have.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-slate-800/40 border border-slate-700 rounded-3xl hover:border-blue-500/50 transition-all group">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl d-flex align-items-center justify-content-center mb-6 group-hover:bg-blue-500 transition-colors">
                <i className="bi bi-magic text-blue-400 group-hover:text-white fs-4"></i>
              </div>
              <h3 className="text-xl fw-bold text-white mb-3">The "Magic Wand" Sync</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automatically pull tracked spending averages into your long-term plan with one click. No more manual data entry or guessing your retirement lifestyle.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-slate-800/40 border border-slate-700 rounded-3xl hover:border-emerald-500/50 transition-all group">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl d-flex align-items-center justify-content-center mb-6 group-hover:bg-emerald-500 transition-colors">
                <i className="bi bi-calculator text-emerald-400 group-hover:text-white fs-4"></i>
              </div>
              <h3 className="text-xl fw-bold text-white mb-3">2026 CRA Tax Engine</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Hyper-accurate provincial tax math including the Ontario Surtax and Health Premium. Optimized for RRSP, TFSA, and FHSA strategy.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-slate-800/40 border border-slate-700 rounded-3xl hover:border-purple-500/50 transition-all group">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl d-flex align-items-center justify-content-center mb-6 group-hover:bg-purple-500 transition-colors">
                <i className="bi bi-shield-check text-purple-400 group-hover:text-white fs-4"></i>
              </div>
              <h3 className="text-xl fw-bold text-white mb-3">Institutional Risk Analysis</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Stress-test your future with Monte Carlo simulations and Sequence of Returns Risk (SORR) modeling. Professional-grade risk management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto bg-slate-800/50 border border-slate-700 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-bottom border-slate-700">
              <h2 className="text-2xl fw-bold text-white">Why We Win</h2>
              <p className="text-slate-400 text-sm">Professional planning vs. standard bank trackers.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs fw-bold uppercase tracking-wider border-bottom border-slate-700/50">
                    <th className="px-8 py-4">Feature</th>
                    <th className="px-8 py-4 text-blue-400 bg-blue-400/5">Super App</th>
                    <th className="px-8 py-4">Big Banks</th>
                    <th className="px-8 py-4">Spreadsheets</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { f: "CRA Tax Math (2026 Ready)", a: true, b: false, s: false },
                    { f: "Real-Time Expense Sync", a: true, b: true, s: false },
                    { f: "CPP / OAS / GIS Estimators", a: true, b: false, s: false },
                    { f: "Monte Carlo Risk Testing", a: true, b: false, s: false },
                    { f: "Smith Maneuver Optimizer", a: true, b: false, s: false },
                    { f: "Provincial Health Premiums", a: true, b: false, s: false },
                  ].map((row, i) => (
                    <tr key={i} className="border-bottom border-slate-700/30">
                      <td className="px-8 py-5 fw-medium text-slate-300">{row.f}</td>
                      <td className="px-8 py-5 bg-blue-400/5 text-center"><i className="bi bi-check-circle-fill text-blue-400"></i></td>
                      <td className="px-8 py-5 text-center"><i className={`bi ${row.b ? 'bi-check-circle text-slate-600' : 'bi-dash text-slate-700'}`}></i></td>
                      <td className="px-8 py-5 text-center"><i className={`bi ${row.s ? 'bi-check-circle text-slate-600' : 'bi-dash text-slate-700'}`}></i></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Methodology */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-b from-slate-800/30 to-transparent p-12 rounded-[3rem] border border-slate-700/50">
            <h2 className="text-3xl fw-bold text-white mb-6">Built on Institutional Grounding</h2>
            <p className="max-w-2xl mx-auto text-slate-400 mb-8 leading-relaxed">
              Our engine is built on the latest standards from the <span className="text-white fw-medium">Canada Revenue Agency (CRA)</span> and the <span className="text-white fw-medium">Bank of Canada</span>. 
              We calculate every dollar with transparency, explaining the "why" behind every adjustment.
            </p>
            <div className="d-flex justify-content-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all">
              {/* Add logos here if available */}
              <span className="text-sm fw-bold tracking-widest text-white">CANADA.CA DATA</span>
              <span className="text-sm fw-bold tracking-widest text-white">2026 TAX READY</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-top border-slate-800">
        <div className="container mx-auto px-6 d-flex flex-column flex-md-row justify-content-between align-items-center gap-6">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg">
              <i className="bi bi-graph-up-arrow text-slate-400"></i>
            </div>
            <span className="text-lg fw-bold text-white">SuperApp</span>
          </div>
          <div className="text-slate-500 text-xs">
            © 2026 SuperApp. Not financial advice. Projections based on CRA and Bank of Canada data.
          </div>
          <div className="d-flex gap-6 text-sm">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
            <a href="#" className="hover:text-white">Methodology</a>
          </div>
        </div>
      </footer>
    </div>
  );
}