import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30 font-sans">
      
      {/* CLEAN MARKETING HEADER */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <i className="bi bi-graph-up-arrow text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">SuperApp</span>
          </div>
          
          {/* Main Links */}
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold">
            <a href="#about" className="text-slate-400 hover:text-white transition-colors">About</a>
            <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/api/auth/signin" className="text-sm font-semibold text-slate-400 hover:text-white hidden sm:block">Log In</Link>
            <Link href="/planner" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/25">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-40 pb-24 overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-8">
            <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">The Future of Canadian Planning</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
            Master Your Financial Future,<br/>
            <span className="text-blue-500">One Decision at a Time.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            The only platform that bridges the gap between today's spending and tomorrow's wealth. Advanced CRA-ready forecasting for the modern Canadian.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/planner" className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-100 transition-all text-lg shadow-xl">
              Start Your Plan
            </Link>
            <a href="#features" className="bg-slate-800/50 text-white px-10 py-4 rounded-full font-bold border border-slate-700 hover:bg-slate-800 transition-all text-lg">
              Explore Features
            </a>
          </div>
        </div>
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
      </header>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Built for Accuracy. <br/>Built for Canadians.</h2>
              <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                Generic retirement tools don't understand the complexities of Canadian taxation. SuperApp is built from the ground up to handle <b>RRSP vs TFSA</b> optimizations, <b>OAS Clawbacks</b>, and the <b>Smith Maneuver</b>.
              </p>
              <ul className="space-y-4">
                {['Hyper-accurate 2026 CRA Tax Engine', 'CPP & OAS Benefit Estimators', 'Institutional-grade Risk Modeling'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-200">
                    <i className="bi bi-check2-circle text-blue-500 text-xl"></i>
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-3xl shadow-2xl">
              <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-700">
                 {/* Placeholder for your UI Screenshot */}
                 <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 italic">
                    [App Interface Preview]
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-slate-900/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Straightforward Pricing</h2>
          <p className="text-slate-400 mb-12">No hidden fees. Just clear, professional planning.</p>
          
          <div className="max-w-md mx-auto bg-blue-600 rounded-[2.5rem] p-1 shadow-2xl shadow-blue-500/20 transform hover:scale-[1.02] transition-transform">
            <div className="bg-[#0f172a] rounded-[2.3rem] p-10">
              <span className="text-blue-500 font-bold uppercase tracking-widest text-xs">Full Access</span>
              <div className="text-5xl font-black text-white my-4">$0 <span className="text-lg font-medium text-slate-500">/ forever</span></div>
              <p className="text-slate-400 mb-8 text-sm">We are currently in Early Access. All features are free for our first 1,000 users.</p>
              <Link href="/planner" className="block w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all">
                Claim Free Access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-800">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1.5 rounded-lg">
              <i className="bi bi-graph-up-arrow text-slate-400"></i>
            </div>
            <span className="font-bold text-white">SuperApp</span>
          </div>
          <p className="text-slate-500 text-xs">© 2026 SuperApp. Data sourced from CRA and Bank of Canada.</p>
          <div className="flex gap-6 text-sm font-medium text-slate-400">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/methodology" className="hover:text-white">Methodology</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}