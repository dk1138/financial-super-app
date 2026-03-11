"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Check if the user has visited before
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsFadingOut(true);
    // Wait for the fade-out animation to finish before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("hasSeenSplash", "true");
    }, 500); // 500ms matches the CSS transition duration
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 transition-opacity duration-500 ease-in-out ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="max-w-md px-6 py-8 mx-auto text-center bg-white rounded-2xl shadow-xl border border-slate-100">
        {/* Calming, welcoming illustration/icon placeholder */}
        <div className="w-20 h-20 mx-auto mb-6 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mb-3">
          Confident Decumulation.
        </h1>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          Balancing today's family costs with tomorrow's retirement is stressful enough. We help you navigate 2026 CRA limits, optimize your CPP, and build a safe withdrawal strategy.
        </p>

        {/* Trust Badges - Crucial for FinTech onboarding */}
        <div className="flex flex-col items-center gap-2 mb-8 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Bank-Level 256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>100% Canadian Data Residency</span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Start Planning
        </button>
      </div>
    </div>
  );
}