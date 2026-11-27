'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

const SLIDES = [
  { id: 1, name: 'Plan Summary', icon: 'bi-clipboard2-data', img: '/preview-summary.png', tag: 'Overview', desc: 'Executive KPI dashboard with wealth trajectory, funded ratio, and milestone tracker.' },
  { id: 2, name: 'Strategy & Optimization', icon: 'bi-sliders', img: '/preview-strategy.png', tag: 'Decumulation', desc: 'Custom accumulation, shortfall, and tax-smart decumulation drawdown sequences.' },
  { id: 3, name: 'Timeline & Estate Projection', icon: 'bi-table', img: '/preview-projection.png', tag: 'Granular', desc: 'Year-by-year cash flows, tax brackets, spousal survivorship, and after-tax estate.' },
  { id: 4, name: 'Cash Flow & Spending', icon: 'bi-diagram-3', img: '/preview-cashflow.png', tag: 'Cash Flow', desc: 'Interactive Sankey diagram visualizing income sources, deductions, and living expenses.' },
  { id: 5, name: 'Risk Assessment & Stress Testing', icon: 'bi-activity', img: '/preview-risk.png', tag: 'Robustness', desc: '1,000+ run Monte Carlo simulations, Sequence of Returns Risk, and macro shocks.' },
  { id: 6, name: 'Tools & Calculators', icon: 'bi-magic', img: '/preview-tools.png', tag: 'Calculators', desc: 'Specialized optimizers for RRSP vs TFSA, Smith Maneuver, Marginal Tax Curve, and CCB.' },
];

export default function LandingCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
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
              {SLIDES.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Preview ${s.name} module`}
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
                  {SLIDES.map((slide, i) => (
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

                <div className="absolute top-4 right-6 flex gap-1.5 z-20">
                  {SLIDES.map((_, i) => (
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
  );
}
