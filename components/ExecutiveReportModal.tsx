'use client';

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFinance } from '../lib/FinanceContext';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExecutiveReportModal({ isOpen, onClose }: ExecutiveReportModalProps) {
  const { data, results, planScore } = useFinance() as any;
  const printContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll and prevent background shift when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('report-modal-open');
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.classList.remove('report-modal-open');
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  const isCouple = data?.mode === 'Couple';
  const planName = typeof window !== 'undefined' ? (localStorage.getItem('active_plan_name') || 'Personal Financial Plan') : 'Personal Financial Plan';
  const currentDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate high-level summary metrics
  const metrics = useMemo(() => {
    if (!results || !results.timeline || results.timeline.length === 0) return null;

    const timeline = results.timeline;
    const baseYear = timeline[0]?.year || new Date().getFullYear();
    const p1RetAge = Number(data?.inputs?.p1_retireAge) || 60;
    const inflation = (Number(data?.inputs?.inflation_rate) || 2.1) / 100;
    const useRealDollars = data?.useRealDollars ?? false;

    const getReal = (val: number, year: number) => {
      if (!useRealDollars) return val;
      const yearsOut = Math.max(0, year - baseYear);
      return val / Math.pow(1 + inflation, yearsOut);
    };

    let totalGrossInflows = 0;
    let totalTaxPaid = 0;
    let totalLivingSpent = 0;
    let totalBenefitsReceived = 0;
    let failureAge: number | null = null;
    let peakNW = 0;
    let peakAge = 0;

    timeline.forEach((y: any) => {
      const gross = y.grossInflow || 0;
      const tax = (y.taxP1 || 0) + (y.taxP2 || 0);
      const exp = (y.expenses || 0) + (y.mortgagePay || 0) + (y.debtRepayment || 0);
      const ben = (y.cppP1 || 0) + (y.cppP2 || 0) + (y.oasP1 || 0) + (y.oasP2 || 0);
      const nw = getReal(y.liquidNW + (y.reIncludedEq || 0), y.year);

      totalGrossInflows += getReal(gross, y.year);
      totalTaxPaid += getReal(tax, y.year);
      totalLivingSpent += getReal(exp, y.year);
      totalBenefitsReceived += getReal(ben, y.year);

      if (y.liquidNW <= 0 && y.p1Age >= p1RetAge && failureAge === null) {
        failureAge = y.p1Age;
      }

      if (nw > peakNW) {
        peakNW = nw;
        peakAge = y.p1Age;
      }
    });

    const retItem = timeline.find((y: any) => y.p1Age >= p1RetAge) || timeline[0];
    const finalItem = timeline[timeline.length - 1];

    const liquidAtRet = retItem ? getReal(retItem.liquidNW || 0, retItem.year) : 0;
    const finalEstate = finalItem ? getReal((finalItem.liquidNW || 0) + (finalItem.reIncludedEq || 0), finalItem.year) : 0;
    const effTaxRate = totalGrossInflows > 0 ? (totalTaxPaid / totalGrossInflows) * 100 : 0;

    // Strategic lifecycle milestones tailored to fit cleanly on 1 Letter size page (5 to 6 rows)
    const milestoneIndices = new Set<number>();
    milestoneIndices.add(0); // Start / Today
    
    // Retirement year
    const retIdx = timeline.findIndex((y: any) => y.p1Age >= p1RetAge);
    if (retIdx !== -1) milestoneIndices.add(retIdx);

    // CPP / OAS start year (if different from retirement)
    const cppAge = data?.inputs?.p1_cpp_start || 65;
    const cppIdx = timeline.findIndex((y: any) => y.p1Age >= cppAge);
    if (cppIdx !== -1) milestoneIndices.add(cppIdx);

    // Peak Net Worth milestone
    const peakIdx = timeline.findIndex((y: any) => y.p1Age === peakAge);
    if (peakIdx !== -1) milestoneIndices.add(peakIdx);

    // Mid-retirement milestone (e.g. Age 75 or 80)
    const midIdx = timeline.findIndex((y: any) => y.p1Age >= 75);
    if (midIdx !== -1) milestoneIndices.add(midIdx);

    // Final plan life expectancy year
    milestoneIndices.add(timeline.length - 1);

    const milestoneYears = Array.from(milestoneIndices)
      .sort((a, b) => a - b)
      .map(idx => timeline[idx])
      .filter(Boolean);

    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    const formatShort = (val: number) => {
      if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
      return formatCurrency(val);
    };

    return {
      isFullyFunded: failureAge === null,
      failureAge,
      lifeExp: finalItem?.p1Age || 90,
      retAge: p1RetAge,
      p2RetAge: Number(data?.inputs?.p2_retireAge) || 60,
      liquidAtRet: formatCurrency(liquidAtRet),
      shortLiquidAtRet: formatShort(liquidAtRet),
      finalEstate: formatCurrency(finalEstate),
      shortEstate: formatShort(finalEstate),
      peakNW: formatShort(peakNW),
      peakAge,
      totalGrossInflows: formatCurrency(totalGrossInflows),
      totalTaxPaid: formatCurrency(totalTaxPaid),
      totalLivingSpent: formatCurrency(totalLivingSpent),
      totalBenefitsReceived: formatCurrency(totalBenefitsReceived),
      effTaxRate: effTaxRate.toFixed(1),
      milestoneYears,
      useRealDollars,
      formatCurrency,
      formatShort,
    };
  }, [results, data]);

  if (!mounted || !isOpen || !metrics) return null;

  // Bulletproof print handler: hides all background page elements and triggers window.print()
  const handlePrint = () => {
    // 1. Temporarily allow body overflow so printing doesn't cut off pages
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'visible';

    // 2. Mark all siblings of report-modal-backdrop with data-print-hidden
    const siblings = Array.from(document.body.children).filter(
      (el) => !el.classList.contains('report-modal-backdrop') && 
              el.tagName !== 'SCRIPT' && 
              el.tagName !== 'STYLE'
    ) as HTMLElement[];

    siblings.forEach((el) => el.setAttribute('data-print-hidden', 'true'));

    // 3. Trigger native print dialog
    window.print();

    // 4. Restore DOM state after print dialog is closed
    const cleanup = () => {
      siblings.forEach((el) => el.removeAttribute('data-print-hidden'));
      if (isOpen) {
        document.body.style.overflow = origOverflow || 'hidden';
      }
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2000);
  };

  const p1Name = data?.inputs?.p1_name || 'Player 1';
  const p2Name = data?.inputs?.p2_name || 'Player 2';
  const clientNames = isCouple ? `${p1Name} & ${p2Name}` : p1Name;

  const modalContent = (
    <>
      {/* SCOPED REPORT CSS: Screen dark/light theme + 1-Page Letter Size Print with Breathing Room */}
      <style>{`
        @media screen {
          .report-modal-backdrop {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(11, 15, 23, 0.65);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: flex;
            align-items: flex-start;
            justify-content: center;
            padding: 2rem 1rem;
            overflow-y: auto;
            overflow-x: hidden;
          }
          .report-paper-container {
            max-width: 860px;
            width: 100%;
            margin: 0 auto;
            background: var(--bg-card, #141c2b);
            color: var(--text-main, #f9fafb);
            border: 1px solid var(--border-color, #2c3b52);
            border-radius: 16px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
            position: relative;
          }
          .report-surface-panel {
            background: var(--bg-surface, #1c273c);
            border: 1px solid var(--border-color, #2c3b52);
            color: var(--text-main, #f9fafb);
          }
          .report-table {
            color: var(--text-main, #f9fafb);
            border-color: var(--border-color, #2c3b52);
          }
          .report-table th {
            background: var(--bg-surface, #1c273c);
            color: var(--text-main, #f9fafb);
            border-color: var(--border-color, #2c3b52);
          }
          .report-table td {
            background: var(--bg-card, #141c2b);
            color: var(--text-main, #f9fafb);
            border-color: var(--border-color, #2c3b52);
          }
          .report-table-striped tbody tr:nth-of-type(odd) td {
            background: var(--bg-surface, #1c273c);
          }
        }

        @media print {
          @page {
            size: letter portrait;
            margin: 8mm 10mm;
          }

          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }

          /* Completely hide all background elements and dashboard siblings */
          body > *:not(.report-modal-backdrop),
          [data-print-hidden="true"],
          nav, header, footer, .no-print {
            display: none !important;
          }

          /* Force modal backdrop to be a clean static full-width printable page */
          .report-modal-backdrop {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
          }

          /* Paper container spans full 1-page printable area */
          .report-paper-container {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 100% !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Breathing room on printed page (even with minimum margin printer settings) */
          .report-printable-area {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            padding: 6mm 8mm !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            overflow: visible !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .report-printable-area * {
            color: #0f172a !important;
          }

          .report-surface-panel {
            background: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
            color: #0f172a !important;
          }

          .report-table {
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }

          .report-table th {
            background: #f1f5f9 !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }

          .report-table td {
            background: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }

          .report-table-striped tbody tr:nth-of-type(odd) td {
            background: #f8fafc !important;
          }
        }
      `}</style>

      {/* SCREEN MODAL BACKDROP (PORTALED DIRECTLY TO BODY FOR TRUE CENTERING) */}
      <div 
        className="report-modal-backdrop fade-in" 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="report-paper-container d-flex flex-column">
          
          {/* TOP TOOLBAR (NO PRINT) */}
          <div className="d-flex justify-content-between align-items-center px-4 py-2.5 border-bottom report-surface-panel rounded-top-4 no-print">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
              <span className="fw-bold" style={{ fontSize: '0.92rem' }}>Executive PDF Planning Report</span>
              <span className="badge bg-secondary bg-opacity-25 text-muted px-2 py-0.5 rounded-pill" style={{ fontSize: '0.68rem' }}>1-Page Summary</span>
            </div>

            <div className="d-flex align-items-center gap-2">
              <button 
                type="button" 
                className="btn btn-primary btn-sm rounded-pill fw-bold px-3 py-1.5 d-flex align-items-center shadow-sm"
                onClick={handlePrint}
              >
                <i className="bi bi-printer-fill me-1.5"></i> Print / Save as PDF
              </button>
              <button 
                type="button" 
                className="btn-close btn-close-white shadow-none ms-2"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
          </div>

          {/* 1-PAGE REPORT CONTENT (COMFORTABLE MARGINS & BALANCED BREATHING ROOM) */}
          <div ref={printContentRef} className="report-printable-area p-4 p-sm-4.5">
            
            {/* HEADER: LOGO, CRA ENGINE & CLIENT SCENARIO */}
            <div className="pb-2.5 mb-2.5 border-bottom" style={{ borderColor: 'var(--border-color, #2c3b52)' }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="d-flex align-items-center gap-2">
                  <div 
                    className="d-flex align-items-center justify-content-center text-white shadow-sm"
                    style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
                  >
                    <i className="bi bi-graph-up-arrow fs-6"></i>
                  </div>
                  <div>
                    <h5 className="fw-bolder m-0" style={{ letterSpacing: '-0.02em', fontSize: '1.05rem' }}>Planfolio Canada</h5>
                    <span className="text-muted small fw-semibold" style={{ fontSize: '0.68rem' }}>Comprehensive Retirement Plan</span>
                  </div>
                </div>

                <div className="text-end">
                  <div 
                    className="badge rounded-pill fw-bold d-inline-flex align-items-center"
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.12)', 
                      color: '#dc2626', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      fontSize: '0.72rem',
                      padding: '4px 10px'
                    }}
                  >
                    🍁 Official CRA 2026 Engine
                  </div>
                  <div className="text-muted small mt-0.5" style={{ fontSize: '0.68rem' }}>Date: {currentDate}</div>
                </div>
              </div>

              {/* CLIENT & PLAN BANNER */}
              <div className="p-2.5 rounded-3 report-surface-panel d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>Prepared For</div>
                  <h6 className="fw-bold mb-0" style={{ fontSize: '0.9rem' }}>{clientNames}</h6>
                </div>
                <div className="text-end">
                  <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>Plan Scenario</div>
                  <div className="fw-bold text-primary" style={{ fontSize: '0.88rem' }}>{planName}</div>
                </div>
              </div>
            </div>

            {/* 1. HEALTH STATUS & 4 CORE METRICS */}
            <div className="mb-2.5">
              <h6 className="fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                1. Executive Readiness Overview
              </h6>

              <div className="row g-2">
                {/* Health Card */}
                <div className="col-12 col-sm-6">
                  <div 
                    className="p-2.5 rounded-3 h-100 d-flex flex-column justify-content-between"
                    style={{
                      background: metrics.isFullyFunded ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.10)',
                      border: `1px solid ${metrics.isFullyFunded ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.62rem' }}>Plan Longevity</span>
                      {metrics.useRealDollars && (
                        <span 
                          className="badge rounded-pill fw-bold"
                          style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.65rem', padding: '2px 8px' }}
                        >
                          Today's $
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <i className={`bi ${metrics.isFullyFunded ? 'bi-shield-check text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-5`}></i>
                      <h6 className={`fw-bold mb-0 ${metrics.isFullyFunded ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.92rem' }}>
                        {metrics.isFullyFunded ? `Fully Funded (to Age ${metrics.lifeExp})` : `Depletes at Age ${metrics.failureAge}`}
                      </h6>
                    </div>
                    <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.72rem', lineHeight: '1.3' }}>
                      {metrics.isFullyFunded 
                        ? 'Projected portfolio and government pensions sustain 100% of targeted retirement spending.' 
                        : `Estimated asset shortfall begins at age ${metrics.failureAge}. Adjust spending, return rates, or retirement age.`}
                    </p>
                  </div>
                </div>

                {/* Score Card: All 4 Pillars Adding to 100 */}
                <div className="col-12 col-sm-6">
                  <div className="p-2.5 rounded-3 report-surface-panel h-100 d-flex flex-column justify-content-between">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.62rem' }}>Plan Health Score</span>
                      <span className="fw-bold text-primary fs-6">{planScore?.totalScore || 85} / 100</span>
                    </div>
                    <div className="mt-1 small space-y-0.5" style={{ fontSize: '0.7rem' }}>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Retirement Readiness:</span>
                        <span className="fw-semibold">{planScore?.retirementReadiness ?? 45} / 50</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Savings Rate Target:</span>
                        <span className="fw-semibold">{planScore?.savingsRate ?? 20} / 20</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Debt Health:</span>
                        <span className="fw-semibold">{planScore?.debtHealth ?? 20} / 20</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted">Emergency Fund:</span>
                        <span className="fw-semibold">{planScore?.emergencyFund ?? 10} / 10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 HIGHLIGHT PILLS */}
              <div className="row g-2 mt-1">
                <div className="col-6 col-md-3">
                  <div className="p-2 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.58rem' }}>Liquid at Retirement</div>
                    <div className="fw-bolder mt-0.5" style={{ fontSize: '0.85rem' }}>{metrics.shortLiquidAtRet}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-2 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.58rem' }}>Peak Net Worth</div>
                    <div className="fw-bolder mt-0.5" style={{ fontSize: '0.85rem' }}>{metrics.peakNW} <span className="small fw-normal text-muted" style={{ fontSize: '0.68rem' }}>(@{metrics.peakAge})</span></div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-2 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.58rem' }}>Final Estate Value</div>
                    <div className="fw-bolder text-success mt-0.5" style={{ fontSize: '0.85rem' }}>{metrics.shortEstate}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-2 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.58rem' }}>Avg Effective Tax</div>
                    <div className="fw-bolder mt-0.5" style={{ fontSize: '0.85rem' }}>{metrics.effTaxRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CORE ASSUMPTIONS & TIMELINE SCHEDULE */}
            <div className="mb-2.5">
              <h6 className="fw-bold text-uppercase text-muted mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                2. Key Planning Parameters & Statutory Assumptions
              </h6>

              <div className="table-responsive">
                <table className="table table-sm table-bordered text-center mb-0 align-middle report-table" style={{ fontSize: '0.7rem' }}>
                  <thead>
                    <tr>
                      <th className="text-start py-1">Parameter</th>
                      <th className="py-1">Player 1 ({p1Name})</th>
                      {isCouple && <th className="py-1">Player 2 ({p2Name})</th>}
                      <th className="py-1">Household Global</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-start fw-semibold py-1">Current Age / Retirement Age</td>
                      <td className="py-1">{data?.inputs?.p1_age || 38} / Age {metrics.retAge}</td>
                      {isCouple && <td className="py-1">{data?.inputs?.p2_age || 34} / Age {metrics.p2RetAge}</td>}
                      <td className="text-muted py-1">Life Expectancy: Age {metrics.lifeExp}</td>
                    </tr>
                    <tr>
                      <td className="text-start fw-semibold py-1">CPP / OAS Start Age</td>
                      <td className="py-1">Age {data?.inputs?.p1_cpp_start || 65} / Age {data?.inputs?.p1_oas_start || 65}</td>
                      {isCouple && <td className="py-1">Age {data?.inputs?.p2_cpp_start || 65} / Age {data?.inputs?.p2_oas_start || 65}</td>}
                      <td className="text-muted py-1">CRA Tax Province: {data?.inputs?.tax_province || 'ON'}</td>
                    </tr>
                    <tr>
                      <td className="text-start fw-semibold py-1">Economic & Market Rates</td>
                      <td className="py-1">TFSA: {data?.inputs?.p1_tfsa_ret || 6}% | RRSP: {data?.inputs?.p1_rrsp_ret || 6}%</td>
                      {isCouple && <td className="py-1">TFSA: {data?.inputs?.p2_tfsa_ret || 6}% | RRSP: {data?.inputs?.p2_rrsp_ret || 6}%</td>}
                      <td className="py-1">Inflation Assumption: <strong>{data?.inputs?.inflation_rate || 2.1}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. MULTI-DECADE MILESTONE LEDGER TABLE (STRATEGIC MILESTONES) */}
            <div className="mb-2.5">
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <h6 className="fw-bold text-uppercase text-muted m-0" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                  3. Multi-Decade Cash Flow & Net Worth Milestone Ledger
                </h6>
                <span className="text-muted small" style={{ fontSize: '0.65rem' }}>
                  Values in {metrics.useRealDollars ? "Today's Purchasing Power (Real $)" : "Future Nominal CAD"}
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-striped table-bordered text-center align-middle report-table report-table-striped" style={{ fontSize: '0.68rem' }}>
                  <thead>
                    <tr>
                      <th className="py-1">Year</th>
                      <th className="py-1">P1 Age</th>
                      {isCouple && <th className="py-1">P2 Age</th>}
                      <th className="py-1">Status</th>
                      <th className="py-1">Total Inflow</th>
                      <th className="py-1">Living Spend</th>
                      <th className="py-1">Taxes Paid</th>
                      <th className="py-1">Liquid Portfolio</th>
                      <th className="py-1">Total Net Worth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.milestoneYears.map((yr: any) => {
                      const isRetired = yr.p1Age >= metrics.retAge;
                      const liquidNW = Math.round(yr.liquidNW || 0);
                      const totalNW = Math.round((yr.liquidNW || 0) + (yr.reIncludedEq || 0));

                      return (
                        <tr key={yr.year}>
                          <td className="fw-bold py-1">{yr.year}</td>
                          <td className="py-1">{yr.p1Age}</td>
                          {isCouple && <td className="py-1">{yr.p2Age}</td>}
                          <td className="py-1">
                            <span className={`badge ${isRetired ? 'bg-primary' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '0.58rem', padding: '2px 6px' }}>
                              {isRetired ? 'Retired' : 'Working'}
                            </span>
                          </td>
                          <td className="text-end py-1">{metrics.formatShort(yr.grossInflow || 0)}</td>
                          <td className="text-end py-1">{metrics.formatShort((yr.expenses || 0) + (yr.mortgagePay || 0))}</td>
                          <td className="text-end text-danger py-1">{metrics.formatShort((yr.taxP1 || 0) + (yr.taxP2 || 0))}</td>
                          <td className={`text-end fw-semibold py-1 ${liquidNW <= 0 && isRetired ? 'text-danger' : ''}`}>
                            {metrics.formatShort(liquidNW)}
                          </td>
                          <td className="text-end fw-bold text-success py-1">
                            {metrics.formatShort(totalNW)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. CANADIAN TAX & ACCOUNT STRATEGY SUMMARY */}
            <div className="mb-2.5">
              <h6 className="fw-bold text-uppercase text-muted mb-1.5" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                4. Canadian Tax & Account Optimization Strategy
              </h6>

              <div className="p-2 rounded-3 report-surface-panel">
                <div className="row g-2" style={{ fontSize: '0.68rem', lineHeight: '1.3' }}>
                  <div className="col-12 col-md-4">
                    <div className="fw-bold mb-0.5">
                      <i className="bi bi-diagram-3-fill text-primary me-1"></i> Decumulation Sequence
                    </div>
                    <div className="text-muted">
                      Tax-bracket smoothing deploys non-registered funds first, preserving TFSA tax-free compounding.
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="fw-bold mb-0.5">
                      <i className="bi bi-people-fill text-success me-1"></i> Pension Income Splitting
                    </div>
                    <div className="text-muted">
                      {isCouple 
                        ? 'Simulates eligible pension transfer (up to 50% at 65) to equalize brackets and reduce household tax.' 
                        : 'Single filing: RRSP/RRIF drawdown before 72 to prevent OAS clawbacks and estate terminal tax.'}
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="fw-bold mb-0.5">
                      <i className="bi bi-unlock-fill text-info me-1"></i> 50% LIF / LIRA Unlocking
                    </div>
                    <div className="text-muted">
                      Evaluates statutory 50% unlocking of locked-in retirement capital into RRSP/RRIF by province.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. DISCLAIMER & FOOTER */}
            <div className="pt-2 border-top text-muted" style={{ fontSize: '0.62rem', lineHeight: '1.35', borderColor: 'var(--border-color, #2c3b52)' }}>
              <div className="d-flex justify-content-between align-items-center mb-0.5">
                <strong className="text-main">Planfolio Canada — local-first financial planning</strong>
                <span>Generated locally on-device • Zero cloud tracking</span>
              </div>
              <p className="mb-0 text-muted" style={{ fontSize: '0.6rem' }}>
                Disclaimer: Informational simulation only; not formal financial, tax, or legal advice. Projections based on estimated returns and current statutory CRA rates. Consult a certified financial planner (CFP) or CPA.
              </p>
            </div>

          </div>

        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}