'use client';

import React, { useState } from 'react';

interface SplashScreenProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSampleData?: () => void;
  onStartBlankPlan?: () => void;
  onOpenFeedback?: () => void;
}

export default function SplashScreen({
  isOpen,
  onClose,
  onLoadSampleData,
  onStartBlankPlan,
  onOpenFeedback,
}: SplashScreenProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = (actionCallback?: () => void) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('has_seen_splash', 'true');
      } catch (e) {
        console.error('Failed to save splash preference', e);
      }
    }
    if (actionCallback) {
      actionCallback();
    }
    onClose();
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content surface-card border border-secondary shadow-2xl rounded-4 overflow-hidden">
          
          {/* HEADER WITH MATCHING SITE BRAND LOGO */}
          <div className="modal-header border-bottom border-secondary px-4 py-3 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2.5">
              {/* Site-matching Logo Badge */}
              <div 
                className="d-flex align-items-center justify-content-center text-white shadow-sm" 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <i className="bi bi-graph-up-arrow" style={{ fontSize: '1.05rem' }}></i>
              </div>
              <span className="fw-bold text-main" style={{ fontSize: '1.35rem', letterSpacing: '-0.02em', fontWeight: 800 }}>
                Planfolio
              </span>
            </div>

            {/* Local-first Privacy Badge */}
            <span 
              className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fw-semibold d-flex align-items-center"
              style={{ fontSize: '0.78rem', letterSpacing: '0.2px' }}
            >
              <i className="bi bi-shield-lock-fill me-1.5"></i>
              Local Data Only — Your data never leaves your browser
            </span>
          </div>

          {/* BODY */}
          <div className="modal-body p-4">
            
            {/* 1. WORK IN PROGRESS CALLOUT */}
            <div 
              className="p-3 rounded-3 mb-3 border border-danger border-opacity-25 d-flex align-items-start gap-3" 
              style={{ backgroundColor: 'rgba(220, 53, 69, 0.08)' }}
            >
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '32px', height: '32px', backgroundColor: 'rgba(220, 53, 69, 0.15)' }}
              >
                <i className="bi bi-scissors text-danger fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold text-danger mb-1" style={{ fontSize: '0.92rem' }}>
                  Work in Progress
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  This tool is in active development. You may encounter bugs, calculation adjustments, or unexpected behavior as we continue to build it.
                </p>
              </div>
            </div>

            {/* 2. DESKTOP RECOMMENDED CALLOUT */}
            <div 
              className="p-3 rounded-3 mb-3 border border-warning border-opacity-25 d-flex align-items-start gap-3" 
              style={{ backgroundColor: 'rgba(255, 193, 7, 0.08)' }}
            >
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255, 193, 7, 0.15)' }}
              >
                <i className="bi bi-display text-warning fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold text-warning mb-1" style={{ fontSize: '0.92rem' }}>
                  Desktop Recommended
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                  This tool features complex data tables and interactive charts that are optimized for larger screens. Mobile viewing is not supported.
                </p>
              </div>
            </div>

            {/* 3. DISCLAIMER CALLOUT (UPDATED TO USE FEEDBACK BUTTON) */}
            <div 
              className="p-3 rounded-3 mb-3 border border-secondary border-opacity-25 d-flex align-items-start gap-3" 
              style={{ backgroundColor: 'rgba(108, 117, 125, 0.08)' }}
            >
              <div 
                className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                style={{ width: '32px', height: '32px', backgroundColor: 'rgba(13, 202, 240, 0.15)' }}
              >
                <i className="bi bi-info-circle text-info fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold text-main mb-1" style={{ fontSize: '0.92rem' }}>
                  Disclaimer & Support
                </h6>
                <p className="text-muted small mb-0" style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
                  This tool is for educational and informational purposes only and does not constitute professional financial, tax, or legal advice. Projections are based on estimated assumptions and historical data. Always consult with a Certified Financial Planner (CFP) or tax professional before making financial decisions. For support, questions, or bug reports, please use the{' '}
                  <button 
                    type="button" 
                    className="btn btn-link p-0 text-primary fw-bold text-decoration-underline align-baseline"
                    style={{ fontSize: 'inherit' }}
                    onClick={() => {
                      onClose();
                      if (onOpenFeedback) onOpenFeedback();
                    }}
                  >
                    Send Feedback
                  </button>{' '}
                  button in the bottom right corner of the screen.
                </p>
              </div>
            </div>

            {/* NEVER SHOW AGAIN CHECKBOX */}
            <div className="form-check mt-3 mb-2 ps-4">
              <input 
                className="form-check-input cursor-pointer shadow-none" 
                type="checkbox" 
                id="dontShowSplashAgain" 
                checked={dontShowAgain} 
                onChange={(e) => setDontShowAgain(e.target.checked)} 
              />
              <label className="form-check-label small text-muted cursor-pointer user-select-none" htmlFor="dontShowSplashAgain">
                Never show this screen again
              </label>
            </div>

          </div>

          {/* FOOTER ACTIONS */}
          <div className="modal-footer border-top border-secondary px-4 py-3 bg-input d-flex justify-content-end gap-2">
            <button 
              type="button" 
              className="btn btn-outline-secondary rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center shadow-sm"
              onClick={() => handleDismiss(onLoadSampleData)}
            >
              <i className="bi bi-people-fill me-2 text-info"></i> Sample Data
            </button>
            <button 
              type="button" 
              className="btn btn-outline-primary rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center shadow-sm"
              onClick={() => handleDismiss(onStartBlankPlan)}
            >
              <i className="bi bi-file-earmark-plus me-2"></i> Blank Plan
            </button>
            <button 
              type="button" 
              className="btn btn-success rounded-pill px-4 py-1.5 fw-bold d-flex align-items-center shadow"
              onClick={() => handleDismiss()}
            >
              Continue <i className="bi bi-arrow-right ms-2"></i>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}