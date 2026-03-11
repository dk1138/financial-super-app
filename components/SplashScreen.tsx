"use client";

import { useState, useEffect } from "react";

export default function SplashScreen() {
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

  if (!isVisible) return null;

  return (
    // 1. The Overlay: Inline styles guarantee a full-screen, 75% dark overlay
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
      }}
    >
      {/* 2. The Text Popup Dialog: Forced to have a white background and centered text */}
      <div
        style={{
          backgroundColor: "#ffffff",
          color: "#212529", // Dark Bootstrap text color
          maxWidth: "500px",
          width: "90%",
          padding: "2rem",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: "1.5rem", color: "#0d6efd" }}>
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>

        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}>
          Welcome to Retirement Planner Pro
        </h2>
        
        <p style={{ marginBottom: "1.5rem", lineHeight: "1.6" }}>
          This advanced financial forecasting engine is designed specifically for Canadians to help you transition from saving to spending.
        </p>
        
        {/* Information Box */}
        <div style={{ backgroundColor: "#f8f9fa", padding: "1rem", borderRadius: "8px", border: "1px solid #dee2e6", marginBottom: "1.5rem", textAlign: "left" }}>
          <strong style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>What this tool does:</strong>
          <ul style={{ paddingLeft: "1.5rem", margin: 0, fontSize: "0.9rem", lineHeight: "1.6" }}>
            <li>Projects your net worth and cash flow through retirement.</li>
            <li>Optimizes tax strategies across RRSPs, TFSAs, and non-registered accounts.</li>
            <li>Calculates precise CRA withdrawal minimums and benefit phase-outs.</li>
          </ul>
        </div>

        {/* Security Reassurance */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "2rem", fontSize: "0.85rem", color: "#6c757d", fontWeight: "500" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ color: "#198754", fontSize: "1.1rem" }}>✔</span> 256-bit Encryption
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ color: "#dc3545", fontSize: "1.1rem" }}>✔</span> Canadian Data Residency
          </span>
        </div>

        {/* Button using standard Bootstrap classes */}
        <button
          onClick={handleDismiss}
          className="btn btn-primary w-100"
          style={{ padding: "0.75rem", fontSize: "1rem", borderRadius: "8px", fontWeight: "600" }}
        >
          Acknowledge & Start Planning
        </button>
      </div>
    </div>
  );
}