"use client";

import { useState, useEffect } from "react";

interface SplashScreenProps {
  onLoadDummyData: () => void;
}

export default function SplashScreen({ onLoadDummyData }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has visited before
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (!hasSeenSplash) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("hasSeenSplash", "true");
  };

  const handleDummyDataClick = () => {
    setIsVisible(false);
    localStorage.setItem("hasSeenSplash", "true");
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
        <div style={{ backgroundColor: "#f8d7da", color: "#842029", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #f5c2c7", marginBottom: "1rem", fontSize: "0.85rem", textAlign: "left", lineHeight: "1.5" }}>
          <i className="bi bi-tools text-danger fs-5 me-2" style={{ verticalAlign: "middle" }}></i>
          <strong>Work in Progress:</strong> This tool is in active development. You may encounter bugs, calculation adjustments, or unexpected behavior as we continue to build it.
        </div>

        {/* DESKTOP OPTIMIZATION WARNING */}
        <div style={{ backgroundColor: "#fff3cd", color: "#664d03", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #ffecb5", marginBottom: "1.5rem", fontSize: "0.85rem", textAlign: "left", lineHeight: "1.5" }}>
          <i className="bi bi-display text-warning fs-5 me-2" style={{ verticalAlign: "middle" }}></i>
          <strong>Desktop Recommended:</strong> This tool features complex data tables and interactive charts that are optimized for larger screens. <strong>Mobile viewing is not supported.</strong>
        </div>
        
        <div style={{ backgroundColor: "#f8f9fa", padding: "1.25rem", borderRadius: "8px", border: "1px solid #dee2e6", marginBottom: "1.5rem", textAlign: "left" }}>
          <strong style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.95rem" }}>Key Features:</strong>
          <ul style={{ paddingLeft: "1.5rem", margin: 0, fontSize: "0.9rem", lineHeight: "1.6" }}>
            <li><strong>Cash Flow Engine:</strong> Project your net worth and spending power through retirement.</li>
            <li><strong>Tax Optimization:</strong> Smart withdrawal strategies across RRSPs, TFSAs, and Non-Reg.</li>
            <li><strong>Built-in CRA Limits:</strong> Accurate CPP, OAS clawbacks, and CCB calculations.</li>
          </ul>
        </div>

        <p style={{ fontSize: "0.75rem", color: "#6c757d", marginBottom: "1.5rem", lineHeight: "1.5", textAlign: "justify" }}>
          <strong>Disclaimer:</strong> This tool is for educational and informational purposes only and does not constitute professional financial, tax, or legal advice. Projections are based on estimated assumptions and historical data. Always consult with a Certified Financial Planner (CFP) or tax professional before making financial decisions.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button
            onClick={handleDismiss}
            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
            style={{ padding: "0.75rem", fontSize: "1rem", borderRadius: "8px", fontWeight: "600" }}
          >
            <i className="bi bi-calculator me-2 fs-5"></i> Start Blank Plan
          </button>
          
          <button
            onClick={handleDummyDataClick}
            className="btn btn-outline-secondary w-100 d-flex align-items-center justify-content-center"
            style={{ padding: "0.75rem", fontSize: "1rem", borderRadius: "8px", fontWeight: "600" }}
          >
            <i className="bi bi-file-earmark-person me-2 fs-5"></i> Load Sample Data
          </button>
        </div>
      </div>
    </div>
  );
}