"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem("hasSeenSplash", "true");
    }, 500);
  };

  if (!isVisible) return null;

  return (
    // 1. The Overlay: Forced to full screen width/height, pinned to top-left, dark grey with 75% opacity
    <div
      className={`fixed top-0 left-0 w-screen h-screen z-[9999] bg-gray-900 bg-opacity-75 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
        isFadingOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* 2. The Text Popup Dialog: Solid white box centered in the middle of the grey overlay */}
      <div className="bg-white text-slate-900 max-w-lg w-full mx-4 p-8 rounded-2xl shadow-2xl relative">
        
        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold mb-4 text-center">
          Welcome to Retirement Planner Pro
        </h2>
        
        <p className="text-slate-600 mb-6 leading-relaxed">
          This advanced financial forecasting engine is designed specifically for Canadians to help you transition from saving to spending.
        </p>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
          <strong className="block mb-2 text-sm text-slate-800">What this tool does:</strong>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600">
            <li>Projects your net worth and cash flow through retirement.</li>
            <li>Optimizes tax strategies across RRSPs, TFSAs, and non-registered accounts.</li>
            <li>Calculates precise CRA withdrawal minimums and benefit phase-outs.</li>
          </ul>
        </div>

        {/* Security Reassurance */}
        <div className="flex justify-center gap-6 mb-8 text-xs font-medium text-slate-500">
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