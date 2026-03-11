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
    }, 500); 
  };

  if (!isVisible) return null;

  return (
    // 1. The 50% opaque grey background covering the whole screen
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-500 ease-in-out ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* 2. The distinct Dialog Box */}
      <div className="max-w-lg w-full mx-4 p-8 text-center bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative">
        
        {/* Logo / Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Welcome to Retirement Planner Pro
        </h2>
        
        {/* Tool Explanation */}
        <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed text-left">
          This advanced financial forecasting engine is designed specifically for Canadians to help you transition from saving to spending.
          <br /><br />
          <strong>What this tool does:</strong>
          <ul className="list-disc text-left pl-5 mt-2 space-y-1">
            <li>Projects your net worth and cash flow through retirement.</li>
            <li>Optimizes tax strategies across RRSPs, TFSAs, and non-registered accounts.</li>
            <li>Calculates precise CRA withdrawal minimums and benefit phase-outs (CPP, OAS, CCB).</li>
            <li>Stress-tests your plan against inflation and market volatility.</li>
          </ul>
        </p>

        {/* Security Reassurance */}
        <div className="flex justify-center gap-6 mb-8 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
            256-bit Encryption
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Canadian Data Residency
          </span>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        >
          Acknowledge & Start Planning
        </button>
      </div>
    </div>
  );
}