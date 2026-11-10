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
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
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

    // Filter milestones for 5-year ledger table
    const milestoneYears = timeline.filter((y: any, idx: number) => {
      const isFirst = idx === 0;
      const isLast = idx === timeline.length - 1;
      const isRetire = y.p1Age === p1RetAge;
      const isCPP = y.p1Age === (data?.inputs?.p1_cpp_start || 65);
      const isFiveYear = y.year % 5 === 0;
      return isFirst || isLast || isRetire || isCPP || isFiveYear;
    });

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

  const handlePrint = () => {
    window.print();
  };

  const p1Name = data?.inputs?.p1_name || 'Player 1';
  const p2Name = data?.inputs?.p2_name || 'Player 2';
  const clientNames = isCouple ? `${p1Name} & ${p2Name}` : p1Name;

  const modalContent = (
    <>
      {/* SCOPED REPORT CSS: Screen dark/light theme + clean white print */}
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
            padding: 2.5rem 1rem;
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
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide main app shell, headers, footers and screen-only elements */
          #__next, nav, header, footer, .no-print {
            display: none !important;
          }
          .report-modal-backdrop {
            position: static !important;
            display: block !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }
          .report-paper-container {
            max-width: 100% !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .report-printable-area {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
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
          .report-page-break {
            page-break-before: always;
            break-before: page;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
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
          <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom report-surface-panel rounded-top-4 no-print">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-file-earmark-pdf-fill text-danger fs-5"></i>
              <span className="fw-bold" style={{ fontSize: '0.95rem' }}>Executive PDF Planning Report</span>
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

          {/* REPORT CONTENT (THEMED ON SCREEN, CRISP WHITE ON PRINT) */}
          <div ref={printContentRef} className="report-printable-area p-4 p-sm-5">
            
            {/* ========================================================= */}
            {/* PAGE 1: EXECUTIVE COVER & READINESS SCORECARD             */}
            {/* ========================================================= */}
            <div className="pb-4 mb-4 border-bottom" style={{ borderColor: 'var(--border-color, #2c3b52)' }}>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div className="d-flex align-items-center gap-2.5">
                  <div 
                    className="d-flex align-items-center justify-content-center text-white shadow-sm"
                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}
                  >
                    <i className="bi bi-graph-up-arrow fs-5"></i>
                  </div>
                  <div>
                    <h4 className="fw-bolder m-0" style={{ letterSpacing: '-0.02em' }}>Planfolio Canada</h4>
                    <span className="text-muted small fw-semibold" style={{ fontSize: '0.72rem' }}>Comprehensive Retirement Plan</span>
                  </div>
                </div>

                <div className="text-end">
                  {/* HIGH-CONTRAST CRA ENGINE BADGE */}
                  <div 
                    className="badge rounded-pill fw-bold d-inline-flex align-items-center"
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.12)', 
                      color: '#dc2626', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      fontSize: '0.75rem',
                      padding: '5px 12px'
                    }}
                  >
                    🍁 Official CRA 2026 Engine
                  </div>
                  <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>Date: {currentDate}</div>
                </div>
              </div>

              {/* CLIENT & PLAN BANNER */}
              <div className="p-3 rounded-3 report-surface-panel mt-3 d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Prepared For</div>
                  <h5 className="fw-bold mb-0">{clientNames}</h5>
                </div>
                <div className="text-end">
                  <div className="text-uppercase text-muted fw-bold" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>Plan Scenario</div>
                  <div className="fw-bold text-primary">{planName}</div>
                </div>
              </div>
            </div>

            {/* 1. HEALTH STATUS & 4 CORE METRICS */}
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted mb-3" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                1. Executive Readiness Overview
              </h6>

              <div className="row g-3">
                {/* Health Card */}
                <div className="col-12 col-sm-6">
                  <div 
                    className="p-3 rounded-3 h-100"
                    style={{
                      background: metrics.isFullyFunded ? 'rgba(34, 197, 94, 0.10)' : 'rgba(239, 68, 68, 0.10)',
                      border: `1px solid ${metrics.isFullyFunded ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem' }}>Plan Longevity</span>
                      {metrics.useRealDollars && (
                        <span 
                          className="badge rounded-pill fw-bold"
                          style={{ background: '#0284c7', color: '#ffffff', fontSize: '0.68rem', padding: '3px 9px' }}
                        >
                          Today's $
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <i className={`bi ${metrics.isFullyFunded ? 'bi-shield-check text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-4`}></i>
                      <h5 className={`fw-bold mb-0 ${metrics.isFullyFunded ? 'text-success' : 'text-danger'}`}>
                        {metrics.isFullyFunded ? `Fully Funded (to Age ${metrics.lifeExp})` : `Depletes at Age ${metrics.failureAge}`}
                      </h5>
                    </div>
                    <p className="text-muted small mb-0 mt-1" style={{ fontSize: '0.78rem' }}>
                      {metrics.isFullyFunded 
                        ? 'Your projected portfolio and government pensions sustain 100% of your targeted retirement spending.' 
                        : `Estimated asset shortfall begins at age ${metrics.failureAge}. Consider adjusting spending, return rates, or retirement age.`}
                    </p>
                  </div>
                </div>

                {/* Score Card: All 4 Pillars Adding to 100 */}
                <div className="col-12 col-sm-6">
                  <div className="p-3 rounded-3 report-surface-panel h-100">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-uppercase fw-bold text-muted" style={{ fontSize: '0.65rem' }}>Plan Health Score</span>
                      <span className="fw-bold text-primary fs-5">{planScore?.totalScore || 85} / 100</span>
                    </div>
                    <div className="mt-2 small space-y-1" style={{ fontSize: '0.75rem' }}>
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
                  <div className="p-2.5 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem' }}>Liquid at Retirement</div>
                    <div className="fw-bolder fs-6 mt-0.5">{metrics.shortLiquidAtRet}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem' }}>Peak Net Worth</div>
                    <div className="fw-bolder fs-6 mt-0.5">{metrics.peakNW} <span className="small fw-normal text-muted">(@{metrics.peakAge})</span></div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem' }}>Final Estate Value</div>
                    <div className="fw-bolder text-success fs-6 mt-0.5">{metrics.shortEstate}</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="p-2.5 rounded-3 report-surface-panel text-center">
                    <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem' }}>Avg Effective Tax</div>
                    <div className="fw-bolder fs-6 mt-0.5">{metrics.effTaxRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. CORE ASSUMPTIONS & TIMELINE SCHEDULE */}
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                2. Key Planning Parameters & Statutory Assumptions
              </h6>

              <div className="table-responsive">
                <table className="table table-sm table-bordered text-center mb-0 align-middle report-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th className="text-start">Parameter</th>
                      <th>Player 1 ({p1Name})</th>
                      {isCouple && <th>Player 2 ({p2Name})</th>}
                      <th>Household Global</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="text-start fw-semibold">Current Age / Retirement Age</td>
                      <td>{data?.inputs?.p1_age || 38} / Age {metrics.retAge}</td>
                      {isCouple && <td>{data?.inputs?.p2_age || 34} / Age {metrics.p2RetAge}</td>}
                      <td className="text-muted">Life Expectancy: Age {metrics.lifeExp}</td>
                    </tr>
                    <tr>
                      <td className="text-start fw-semibold">CPP / OAS Start Age</td>
                      <td>Age {data?.inputs?.p1_cpp_start || 65} / Age {data?.inputs?.p1_oas_start || 65}</td>
                      {isCouple && <td>Age {data?.inputs?.p2_cpp_start || 65} / Age {data?.inputs?.p2_oas_start || 65}</td>}
                      <td className="text-muted">CRA Tax Province: {data?.inputs?.tax_province || 'ON'}</td>
                    </tr>
                    <tr>
                      <td className="text-start fw-semibold">Economic & Market Rates</td>
                      <td>TFSA: {data?.inputs?.p1_tfsa_ret || 6}% | RRSP: {data?.inputs?.p1_rrsp_ret || 6}%</td>
                      {isCouple && <td>TFSA: {data?.inputs?.p2_tfsa_ret || 6}% | RRSP: {data?.inputs?.p2_rrsp_ret || 6}%</td>}
                      <td>Inflation Assumption: <strong>{data?.inputs?.inflation_rate || 2.1}%</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGE BREAK FOR PRINT */}
            <div className="report-page-break"></div>

            {/* ========================================================= */}
            {/* PAGE 2: 5-YEAR MULTI-DECADE MILESTONE LEDGER TABLE        */}
            {/* ========================================================= */}
            <div className="pt-2 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-bold text-uppercase text-muted m-0" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                  3. Multi-Decade Cash Flow & Net Worth Milestone Ledger
                </h6>
                <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
                  Values in {metrics.useRealDollars ? "Today's Purchasing Power (Real $)" : "Future Nominal CAD"}
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-sm table-striped table-bordered text-center align-middle report-table report-table-striped" style={{ fontSize: '0.72rem' }}>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>P1 Age</th>
                      {isCouple && <th>P2 Age</th>}
                      <th>Status</th>
                      <th>Total Inflow</th>
                      <th>Living Spend</th>
                      <th>Taxes Paid</th>
                      <th>Liquid Portfolio</th>
                      <th>Total Net Worth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.milestoneYears.map((yr: any) => {
                      const isRetired = yr.p1Age >= metrics.retAge;
                      const liquidNW = Math.round(yr.liquidNW || 0);
                      const totalNW = Math.round((yr.liquidNW || 0) + (yr.reIncludedEq || 0));

                      return (
                        <tr key={yr.year}>
                          <td className="fw-bold">{yr.year}</td>
                          <td>{yr.p1Age}</td>
                          {isCouple && <td>{yr.p2Age}</td>}
                          <td>
                            <span className={`badge ${isRetired ? 'bg-primary' : 'bg-secondary'} rounded-pill`} style={{ fontSize: '0.62rem' }}>
                              {isRetired ? 'Retired' : 'Working'}
                            </span>
                          </td>
                          <td className="text-end">{metrics.formatShort(yr.grossInflow || 0)}</td>
                          <td className="text-end">{metrics.formatShort((yr.expenses || 0) + (yr.mortgagePay || 0))}</td>
                          <td className="text-end text-danger">{metrics.formatShort((yr.taxP1 || 0) + (yr.taxP2 || 0))}</td>
                          <td className={`text-end fw-semibold ${liquidNW <= 0 && isRetired ? 'text-danger' : ''}`}>
                            {metrics.formatShort(liquidNW)}
                          </td>
                          <td className="text-end fw-bold text-success">
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
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted mb-2" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                4. Canadian Tax & Account Optimization Strategy
              </h6>

              <div className="p-3 rounded-3 report-surface-panel">
                <div className="row g-3" style={{ fontSize: '0.75rem' }}>
                  <div className="col-12 col-md-4">
                    <div className="fw-bold mb-1">
                      <i className="bi bi-diagram-3-fill text-primary me-1"></i> Decumulation Sequence
                    </div>
                    <div className="text-muted">
                      Standard tax-bracket smoothing deploys non-registered capital first, preserving TFSA tax-free compounding until later years.
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="fw-bold mb-1">
                      <i className="bi bi-people-fill text-success me-1"></i> Pension Income Splitting
                    </div>
                    <div className="text-muted">
                      {isCouple 
                        ? 'Simulates eligible pension transfer (up to 50% at age 65) to equalize marginal brackets and minimize combined household tax.' 
                        : 'Single individual filing strategy. Focuses on RRSP/RRIF drawdown before age 72 to prevent OAS clawbacks.'}
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="fw-bold mb-1">
                      <i className="bi bi-unlock-fill text-info me-1"></i> 50% LIF / LIRA Unlocking
                    </div>
                    <div className="text-muted">
                      Evaluates one-time 50% unlocking of locked-in retirement funds into RRSP/RRIF based on provincial statutory jurisdiction.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 5. DISCLAIMER & FOOTER */}
            <div className="pt-3 border-top text-muted" style={{ fontSize: '0.68rem', lineHeight: '1.45', borderColor: 'var(--border-color, #2c3b52)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong className="text-main">Planfolio Canada — local-first financial planning</strong>
                <span>Generated locally on-device • Zero cloud tracking</span>
              </div>
              <p className="mb-0 text-muted">
                Disclaimer: This report is generated strictly for informational and educational simulation purposes and does not constitute formal financial, accounting, legal, or tax advice. Projections are based on estimated historical returns and current CRA tax statutory rates. Consult with a qualified Certified Financial Planner (CFP) or CPA before executing major financial decisions.
              </p>
            </div>

          </div>

        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}