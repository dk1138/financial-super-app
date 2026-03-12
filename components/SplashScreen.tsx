"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
  onLoadDummyData: () => void;
  onStartBlankPlan: () => void;
}

export default function SplashScreen({ onLoadDummyData, onStartBlankPlan }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  useEffect(() => {
    // 1. Check if the user has permanently opted out of the splash screen
    const skipPermanently = localStorage.getItem("neverShowSplash") === "true";
    if (skipPermanently) {
      setIsVisible(false);
      return;
    }

    // 2. Otherwise, check standard session/version visit status
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setIsVisible(true);
    }
  }, []);

  const savePreferences = () => {
    if (neverShowAgain) {
      localStorage.setItem("neverShowSplash", "true");
    } else {
      localStorage.setItem("hasSeenSplash", "true");
    }
  };

  const handleDismiss = () => {
    savePreferences();
    setIsVisible(false);
  };

  const handleStartBlankClick = () => {
    savePreferences();
    setIsVisible(false);
    onStartBlankPlan(); 
  };

  const handleDummyDataClick = () => {
    savePreferences();
    setIsVisible(false);
    onLoadDummyData(); 
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem"
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#212529",
          maxWidth: "550px",
          width: "100%",
          padding: "2.5rem",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
          maxHeight: "90vh",
          overflowY: "auto"
        }}
      >
        <div style={{ marginBottom: "1rem", color: "#0d6efd" }}>
          <svg width="56" height="56" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Welcome to Retirement Planner Pro
        </h2>
        
        <div style={{ display: "inline-block", backgroundColor: "#e9ecef", color: "#495057", padding: "0.25rem 0.75rem", borderRadius: "50px", fontSize: "0.85rem", fontWeight: "600", marginBottom: "1.25rem" }}>
          🔒 Local Data Only - Your data never leaves your browser
        </div>

        {/* WORK IN PROGRESS / BUG WARNING */}
        <div style={{ display: "flex", alignItems: "flex-start", backgroundColor: "#f8d7da", color: "#842029", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #f5c2c7", marginBottom: "1rem", fontSize: "0.85rem", textAlign: "left", lineHeight: "1.5" }}>
          <i className="bi bi-tools text-danger fs-5 me-3" style={{ lineHeight: 1, marginTop: "0.1rem" }}></i>
          <div>
            <strong>Work in Progress:</strong> This tool is in active development. You may encounter bugs, calculation adjustments, or unexpected behavior as we continue to build it.
          </div>
        </div>

        {/* DESKTOP OPTIMIZATION WARNING */}
        <div style={{ display: "flex", alignItems: "flex-start", backgroundColor: "#fff3cd", color: "#664d03", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ffecb5", marginBottom: "1rem", fontSize: "0.85rem", textAlign: "left", lineHeight: "1.5" }}>
          <i className="bi bi-display text-warning fs-5 me-3" style={{ lineHeight: 1, marginTop: "0.1rem" }}></i>
          <div>
            <strong>Desktop Recommended:</strong> This tool features complex data tables and interactive charts that are optimized for larger screens. <strong>Mobile viewing is not supported.</strong>
          </div>
        </div>
        
        {/* DISCLAIMER CARD */}
        <div style={{ display: "flex", alignItems: "flex-start", backgroundColor: "#f8f9fa", color: "#495057", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #dee2e6", marginBottom: "1.5rem", fontSize: "0.85rem", textAlign: "left", lineHeight: "1.5" }}>
          <i className="bi bi-info-circle-fill text-secondary fs-5 me-3" style={{ lineHeight: 1, marginTop: "0.1rem" }}></i>
          <div>
            <strong>Disclaimer:</strong> This tool is for educational and informational purposes only and does not constitute professional financial, tax, or legal advice. Projections are based on estimated assumptions and historical data. Always consult with a Certified Financial Planner (CFP) or tax professional before making financial decisions. For support, feedback, or inquiries, contact <a href="mailto:retirementplannerpro@gmail.com" style={{ color: "#0d6efd", textDecoration: "none", fontWeight: "600" }}>retirementplannerpro@gmail.com</a>.
          </div>
        </div>

        {/* NEVER SHOW AGAIN CHECKBOX */}
        <div className="form-check d-flex justify-content-center align-items-center mb-3">
          <input 
            className="form-check-input me-2 mt-0" 
            type="checkbox" 
            id="neverShowAgain" 
            checked={neverShowAgain}
            onChange={(e) => setNeverShowAgain(e.target.checked)}
            style={{ cursor: "pointer" }}
          />
          <label className="form-check-label text-secondary" htmlFor="neverShowAgain" style={{ cursor: "pointer", fontSize: "0.9rem", userSelect: "none" }}>
            Never show this screen again
          </label>
        </div>

        {/* SIDE-BY-SIDE BUTTONS (3-COL) */}
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          
          <button
            onClick={handleDismiss}
            className="btn btn-success d-flex align-items-center justify-content-center px-2"
            style={{ flex: 1, padding: "0.75rem 0", fontSize: "0.9rem", borderRadius: "8px", fontWeight: "600" }}
            title="Continue with your currently saved browser data"
          >
            <i className="bi bi-arrow-right-circle me-1 fs-5"></i> Continue
          </button>

          <button
            onClick={handleStartBlankClick}
            className="btn btn-primary d-flex align-items-center justify-content-center px-2"
            style={{ flex: 1, padding: "0.75rem 0", fontSize: "0.9rem", borderRadius: "8px", fontWeight: "600" }}
            title="Clear all data and start a new blank plan"
          >
            <i className="bi bi-file-earmark-plus me-1 fs-5"></i> Blank Plan
          </button>
          
          <button
            onClick={handleDummyDataClick}
            className="btn btn-outline-secondary d-flex align-items-center justify-content-center px-2"
            style={{ flex: 1, padding: "0.75rem 0", fontSize: "0.9rem", borderRadius: "8px", fontWeight: "600" }}
            title="Load the app with fake demo data"
          >
            <i className="bi bi-people me-1 fs-5"></i> Sample Data
          </button>

        </div>
      </div>
    </div>
  );
}