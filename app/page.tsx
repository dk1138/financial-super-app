'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const slides = [
    { id: 1, name: "Plan Summary", icon: "bi-clipboard2-data", img: "/preview-summary.png" }, // Re-mapped to active preview file asset
    { id: 2, name: "Strategy & Optimization", icon: "bi-sliders", img: "/preview-strategy.png" },
    { id: 3, name: "Timeline Projection", icon: "bi-table", img: "/preview-projection.png" },
    { id: 4, name: "Cash Flow Analysis", icon: "bi-diagram-3", img: "/preview-cashflow.png" },
    { id: 5, name: "Risk Assessment", icon: "bi-activity", img: "/preview-risk.png" },
    { id: 6, name: "Tools & Calculators", icon: "bi-magic", img: "/preview-tools.png" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30 font-sans">
      
      {/* HEADER */}
      <nav className="fixed top-0 w-full z-50 bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-decoration-none">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
              <i className="bi bi-graph-up-arrow text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Planfolio</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-semibold">
            <a href="#about" className="text-slate-400 hover:text-white transition-colors text-decoration-none">About</a>
            <Link href="/features" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Features</Link>
            <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              disabled 
              className="text-sm font-semibold text-slate-500 cursor-not-allowed opacity-50 px-4 py-2"
            >
              Log In
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-48 pb-24 overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
            Master Your Financial Future,<br/>
            <span className="text-blue-500">One Decision at a Time.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-10 leading-relaxed">
            The only platform that bridges the gap between today's spending and tomorrow's wealth. Advanced CRA-ready forecasting for the modern Canadian.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/planner" className="bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-slate-100 transition-all text-lg shadow-xl text-decoration-none text-center">
              Start Your Plan
            </Link>
            <Link href="/features" className="bg-slate-800/50 text-white px-10 py-4 rounded-full font-bold border border-slate-700 hover:bg-slate-800 transition-all text-lg text-decoration-none text-center">
              Explore Features
            </Link>
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10"></div>
      </header>

      {/* GALLERY SECTION */}
      <section id="about" className="py-24 border-t border-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Built for Accuracy. <br/>Built for Canadians.</h2>
              <p className="text-slate-400 mb-6 leading-relaxed text-lg">
                Generic retirement tools don't understand the complexities of Canadian taxation. Planfolio handles <b>RRSP vs TFSA</b> optimizations, <b>OAS Clawbacks</b>, and the <b>Smith Maneuver</b> out of the box.
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

            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-[2rem] shadow-2xl">
              <div className="bg-[#0f172a] rounded-3xl border border-slate-700 relative overflow-hidden aspect-[16/10] flex flex-col group">
                 <div className="flex-1 w-full h-full relative bg-slate-900">
                    {slides.map((slide, i) => (
                      <div key={slide.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${i === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                        <Image 
                          src={slide.img} 
                          alt={slide.name}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          priority={i === 0}
                          className="object-cover object-top opacity-90 group-hover:opacity-100 transition-opacity"
                        />
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent pt-20 pb-6 px-8">
                          <h3 className="text-xl font-bold text-white tracking-wide flex items-center gap-3">
                            <i className={`bi ${slide.icon} text-blue-400`}></i> {slide.name}
                          </h3>
                        </div>
                      </div>
                    ))}
                 </div>
                 <div className="absolute top-4 right-6 flex gap-2 z-20">
                   {slides.map((_, i) => (
                      <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-6 bg-blue-500' : 'w-2 bg-slate-600/80 backdrop-blur-sm'}`}></div>
                   ))}
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 bg-slate-900/50 border-t border-slate-800">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Straightforward Pricing</h2>
          <p className="text-slate-400 mb-16">Professional planning, accessible to everyone.</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-[#0f172a] border-2 border-blue-600 rounded-[2.5rem] p-10 shadow-2xl shadow-blue-500/10 text-start">
              <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Active</span>
              <h3 className="text-2xl font-bold text-white mt-4">Early Access</h3>
              <div className="text-5xl font-black text-white my-6">$0 <span className="text-lg font-medium text-slate-500">/ development</span></div>
              <p className="text-slate-400 text-sm mb-8">Full access to all features while we refine the platform. Your feedback helps shape our future.</p>
              <Link href="/planner" className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all text-decoration-none">
                Get Started Now
              </Link>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 opacity-50 cursor-not-allowed text-start">
              <span className="bg-slate-700 text-slate-300 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Future</span>
              <h3 className="text-2xl font-bold text-slate-400 mt-4">Standard Plan</h3>
              <div className="text-5xl font-black text-slate-500 my-6">$5 <span className="text-lg font-medium text-slate-600">/ per month</span></div>
              <p className="text-slate-500 text-sm mb-8">Full access once the platform moves out of early development. Simple, predictable pricing.</p>
              <div className="w-full text-center bg-slate-800 text-slate-500 font-bold py-4 rounded-2xl">
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 border-t border-slate-800 bg-[#0a0f1c]">
        <div className="container mx-auto px-6 text-start">
          <div className="flex items-center gap-2 mb-12">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <i className="bi bi-graph-up-arrow text-white"></i>
            </div>
            <span className="font-bold text-white text-xl">Planfolio</span>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 text-xs text-slate-500 border-t border-slate-800/60 pt-10">
            <div>
              <h4 className="text-slate-400 font-bold mb-3 uppercase tracking-widest">Terms of Use</h4>
              <p className="leading-relaxed">
                Planfolio is an educational simulation tool intended for informational use only. It does not provide professional financial, legal, or tax advice. All projections are based on user data and historical market assumptions; actual results will vary.
              </p>
            </div>
            <div>
              <h4 className="text-slate-400 font-bold mb-3 uppercase tracking-widest">Privacy Policy</h4>
              <p className="leading-relaxed">
                Planfolio follows a local-first philosophy. Your sensitive financial data is processed and stored locally within your browser. We do not transmit your personal financial scenarios to our servers, nor do we sell your data to third parties.
              </p>
            </div>
          </div>
          <p className="text-slate-600 text-[10px] mt-12">© {new Date().getFullYear()} Planfolio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}