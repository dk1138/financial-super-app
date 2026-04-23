'use client';
import React from 'react';
import Link from 'next/link';

export default function FeaturesPage() {
  const featureGroups = [
    // ... same featureGroups array as before ...
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      
      {/* HEADER - Kept for navigation */}
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
            <Link href="/features" className="text-white transition-colors text-decoration-none border-b-2 border-blue-500">Features</Link>
            <Link href="/#pricing" className="text-slate-400 hover:text-white transition-colors text-decoration-none">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/api/auth/signin" className="text-sm font-semibold text-slate-400 hover:text-white hidden sm:block text-decoration-none">Log In</Link>
            <Link href="/planner" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-blue-500/25 text-decoration-none">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-48 pb-24">
        {/* ... Feature grid code here (same as before) ... */}
        
        {/* Pricing section REMOVED from this page */}
        
        <div className="mt-24 p-12 rounded-[3rem] bg-gradient-to-br from-blue-600 to-blue-800 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Ready to see the full picture?</h2>
          <Link href="/planner" className="inline-block bg-white text-blue-600 px-10 py-4 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-xl text-decoration-none">
            Start Your Simulation
          </Link>
        </div>
      </main>

      {/* FOOTER - Updated with Legal Blocks */}
      <footer className="py-16 border-t border-slate-800 bg-[#0a0f1c]">
        <div className="container mx-auto px-6">
          {/* ... footer branding and legal blocks as provided in landing page ... */}
        </div>
      </footer>
    </div>
  );
}