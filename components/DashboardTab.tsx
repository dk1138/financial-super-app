import React, { useState, useRef } from 'react';
import { useFinance } from '../lib/FinanceContext';
import html2canvas from 'html2canvas';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { InfoBtn } from './SharedUI';

function ScoreCard({ title, score, max, tooltip }: { title: string, score: number, max: number, tooltip?: string }) {
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  
  let colorClass = 'text-danger';
  let bgClass = 'bg-danger';
  if (pct >= 80) { colorClass = 'text-success'; bgClass = 'bg-success'; }
  else if (pct >= 60) { colorClass = 'text-warning'; bgClass = 'bg-warning'; }

  return (
    <div className="p-3 border border-secondary rounded-4 bg-input shadow-sm h-100 d-flex flex-column justify-content-between transition-all">
      <div className="d-flex justify-content-between align-items-start mb-2">
        <div className="text-muted fw-bold text-uppercase ls-1 d-flex align-items-center" style={{fontSize: '0.65rem'}}>
          {title}
          {tooltip && <InfoBtn align="left" title={title} text={tooltip} />}
        </div>
      </div>
      
      <div>
          <div className="d-flex align-items-end mb-2">
              <span className={`fw-bolder ${colorClass} lh-1`} style={{fontSize: '1.5rem'}}>{Math.round(score)}</span>
              <span className="text-muted fw-bold ms-1 mb-1" style={{fontSize: '0.75rem'}}>/ {max}</span>
          </div>
          
          <div className="progress bg-black bg-opacity-25 w-100 rounded-pill overflow-hidden" style={{ height: '6px' }}>
            <div className={`progress-bar rounded-pill ${bgClass}`} style={{ width: `${pct}%`, opacity: 0.85, transition: 'width 1s ease-in-out' }}></div>
          </div>
      </div>
    </div>
  );
}

export default function DashboardTab() {
  const { data, results, planScore } = useFinance();
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [activeAssetView, setActiveAssetView] = useState<'nominal' | 'real'>('real');
  const [activeSpendView, setActiveSpendView] = useState<'nominal' | 'real'>('real');
  const [chartView, setChartView] = useState<'stacked' | 'total'>('stacked');
  const [isExporting, setIsExporting] = useState(false);

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
    return `$${Math.round(val)}`;
  };

  const formatExact = (val: number) => {
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
  };

  const handleExportPNG = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
        const canvas = await html2canvas(dashboardRef.current, {
            backgroundColor: '#0f172a',
            scale: 2,
            useCORS: true,
            logging: false,
            ignoreElements: (el) => el.classList.contains('no-export')
        });
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Retirement_Executive_Summary_${new Date().toISOString().split('T')[0]}.png`;
        link.href = imgData;
        link.click();
    } catch (err) {
        console.error("Export failed", err);
        alert("Failed to export summary. Please try again.");
    } finally {
        setIsExporting(false);
    }
  };

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="p-4 text-center text-muted">
        <i className="bi bi-hourglass-split fs-1 mb-3 d-block text-primary"></i>
        <h5>Calculating Projections...</h5>
      </div>
    );
  }

  const getRealValue = (val: number, year: number) => {
      if (!data.useRealDollars) return val;
      const yrIndex = year - results.timeline[0].year;
      const infRate = (data.inputs.inflation || 2.0) / 100;
      return val / Math.pow(1 + infRate, yrIndex);
  };

  const getCustomRealValue = (val: number, year: number, forceReal: boolean) => {
      if (!forceReal) return val;
      const yrIndex = year - results.timeline[0].year;
      const infRate = (data.inputs.inflation || 2.0) / 100;
      return val / Math.pow(1 + infRate, yrIndex);
  };

  const getScoreColorText = (score: number) => {
      if (score >= 80) return 'text-success';
      if (score >= 60) return 'text-warning';
      return 'text-danger';
  };

  const getScoreGradient = (score: number) => {
      if (score >= 80) return 'linear-gradient(90deg, #10b981 0%, #059669 100%)';
      if (score >= 60) return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
      return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
  };

  const getScoreShadow = (score: number) => {
      if (score >= 80) return '0 0 15px rgba(16, 185, 129, 0.4)';
      if (score >= 60) return '0 0 15px rgba(245, 158, 11, 0.4)';
      return '0 0 15px rgba(239, 68, 68, 0.4)';
  };

  // --- FI TARGET CALCULATION (Rule of 25) ---
  const currentLiquidNW = results.timeline[0].liquidNW;
  
  let targetAnnualRetireSpend = 0;
  const retYear = results.timeline.find((y: any) => y.p1Age === data.inputs.p1_retireAge);
  if (retYear) {
      targetAnnualRetireSpend = getRealValue(retYear.expenses + retYear.mortgagePay, retYear.year);
  } else {
      targetAnnualRetireSpend = getRealValue(results.timeline[0].expenses + results.timeline[0].mortgagePay, results.timeline[0].year);
  }
  const fiTarget = targetAnnualRetireSpend * 25;
  const fiPercent = fiTarget > 0 ? (currentLiquidNW / fiTarget) * 100 : 0;
  const isFI = currentLiquidNW >= fiTarget;

  // --- LIFETIME AGGREGATES & ADVANCED METRICS ---
  let totalGrossInflow = 0;
  let totalTaxPaid = 0;
  let totalExpenses = 0;
  let totalBenefits = 0;
  
  let retSpent = 0;
  let retYears = 0;

  let retPortfolioWd = 0;
  let retGovtBen = 0;
  let retPensions = 0;
  let retOtherInc = 0;

  let totalContributions = 0;
  let totalWithdrawals = 0;
  let hasShortfall = false;
  let firstShortfallYear: number | null = null;
  let firstShortfallAge: number | null = null;

  results.timeline.forEach((y: any) => {
      const wdsRaw = y.flows && y.flows.withdrawals ? Object.values(y.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) as number : 0;
      const yrInflowRaw = (y.incomeP1||0) + (y.incomeP2||0) + (y.cppP1||0) + (y.cppP2||0) + (y.oasP1||0) + (y.oasP2||0) + (y.dbP1||0) + (y.dbP2||0) + (y.windfall||0) + (y.invIncP1||0) + (y.invIncP2||0) + (y.rrspRefundP1||0) + (y.rrspRefundP2||0);
      
      let contsRaw = 0;
      if (y.flows && y.flows.contributions) {
          contsRaw += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          if (data.mode === 'Couple') contsRaw += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
      }
      
      const yrTaxRaw = (y.taxP1||0) + (y.taxP2||0);
      const yrExpRaw = (y.expenses||0) + (y.mortgagePay||0) + (y.debtRepayment||0);
      const yrBenRaw = (y.cppP1||0) + (y.cppP2||0) + (y.oasP1||0) + (y.oasP2||0);
      
      totalGrossInflow += getRealValue(yrInflowRaw + wdsRaw, y.year);
      totalTaxPaid += getRealValue(yrTaxRaw, y.year);
      totalExpenses += getRealValue(yrExpRaw, y.year);
      totalBenefits += getRealValue(yrBenRaw, y.year);
      
      totalContributions += getRealValue(contsRaw, y.year);
      totalWithdrawals += getRealValue(wdsRaw, y.year);

      const totalSourcedRaw = y.grossInflow || 0;
      const totalSpentRaw = yrExpRaw + yrTaxRaw + contsRaw;
      if (totalSourcedRaw < totalSpentRaw - 1) {
          hasShortfall = true;
          if (firstShortfallYear === null) {
              firstShortfallYear = y.year;
              firstShortfallAge = y.p1Age;
          }
      }

      if (y.p1Age >= data.inputs.p1_retireAge) {
          retYears++;
          retSpent += getRealValue(y.expenses + y.mortgagePay, y.year); 
          retPortfolioWd += getRealValue(wdsRaw, y.year);
          retGovtBen += getRealValue(yrBenRaw, y.year);
          retPensions += getRealValue((y.dbP1||0) + (y.dbP2||0), y.year);
          retOtherInc += getRealValue((y.incomeP1||0) + (y.incomeP2||0) + (y.invIncP1||0) + (y.invIncP2||0), y.year);
      }
  });

  const avgRetSpending = retYears > 0 ? retSpent / retYears : 0;
  const initialPort = getRealValue(results.timeline[0].liquidNW, results.timeline[0].year);
  const finalPort = getRealValue(results.timeline[results.timeline.length - 1].liquidNW, results.timeline[results.timeline.length - 1].year);
  
  const totalInvestmentGrowth = finalPort - initialPort - totalContributions + totalWithdrawals;
  const effTaxRate = totalGrossInflow > 0 ? (totalTaxPaid / totalGrossInflow) * 100 : 0;

  const retYearData = results.timeline.find((y: any) => y.p1Age === data.inputs.p1_retireAge) || results.timeline[0];
  const retDayNW = getRealValue(retYearData.liquidNW + (retYearData.reIncludedEq || 0), retYearData.year);
  const retYearWds = retYearData.flows && retYearData.flows.withdrawals 
      ? (Object.values(retYearData.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) as number) 
      : 0;
  const retStartLiquid = (retYearData.liquidNW || 0) + retYearWds;
  const initialWdRate = retStartLiquid > 0 ? (retYearWds / retStartLiquid) * 100 : 0;

  let peakNW = 0;
  let peakAge = 0;
  results.timeline.forEach((y: any) => {
      const nw = getRealValue(y.liquidNW + (y.reIncludedEq || 0), y.year);
      if (nw > peakNW) {
          peakNW = nw;
          peakAge = y.p1Age;
      }
  });

  let mortgageFreeYear = "Already Free";
  let hasMortgage = results.timeline[0].mortgage > 0;
  if (hasMortgage) {
      const freeYear = results.timeline.find((y: any) => y.mortgage <= 0);
      mortgageFreeYear = freeYear ? `${freeYear.year} (Age ${freeYear.p1Age})` : "Never";
  }

  const finalEstateObj = results.timeline[results.timeline.length - 1];
  const finalEstateRaw = finalEstateObj.afterTaxEstate !== undefined ? finalEstateObj.afterTaxEstate : (finalEstateObj.liquidNW + (finalEstateObj.reIncludedEq || 0));
  const finalEstate = getRealValue(finalEstateRaw, finalEstateObj.year);
  const finalLiquidNW = getRealValue(Math.max(0, finalEstateObj.liquidNW || 0), finalEstateObj.year);
  const finalReEquity = getRealValue(Math.max(0, finalEstateObj.reIncludedEq || 0), finalEstateObj.year);
  const isHouseRichCashPoor = hasShortfall && finalReEquity > 0 && finalLiquidNW <= 0;
  const planHealth = hasShortfall ? "Failed" : "Success";

  const pieData = [
      { name: 'Living & Debt', value: totalExpenses, color: '#f59e0b' },
      { name: 'Taxes Paid', value: totalTaxPaid, color: '#ef4444' },
      { name: 'Final Estate', value: Math.max(0, finalEstate), color: '#10b981' }
  ].filter(d => d.value > 0);
  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0) || 1; 

  const fundData = [
      { name: 'Portfolio W/D', value: retPortfolioWd, color: '#3b82f6' },
      { name: 'Govt Benefits', value: retGovtBen, color: '#8b5cf6' },
      { name: 'Pensions', value: retPensions, color: '#06b6d4' },
      { name: 'Work/Yield', value: retOtherInc, color: '#ec4899' }
  ].filter(d => d.value > 0);
  const totalFund = fundData.reduce((sum, d) => sum + d.value, 0) || 1; 

  const categories = [
      { key: 'realEstate', label: 'Real Estate', color: '#0ea5e9' },
      { key: 'nreg', label: 'Non-Reg', color: '#10b981' },
      { key: 'cash', label: 'Cash', color: '#64748b' },
      { key: 'crypto', label: 'Crypto', color: '#f43f5e' },
      { key: 'lira_lif', label: 'LIRA/LIF', color: '#f59e0b' },
      { key: 'rrsp_rrif', label: 'RRSP/RRIF', color: '#8b5cf6' },
      { key: 'fhsa', label: 'FHSA', color: '#06b6d4' },
      { key: 'tfsa', label: 'TFSA', color: '#3b82f6' }
  ];

  const chartData = results.timeline.map((y: any) => {
      const p1 = y.assetsP1 || {};
      const p2 = y.assetsP2 || {};
      
      const tfsa = Math.max(0, getRealValue((p1.tfsa||0) + (p1.tfsa_successor||0) + (p2.tfsa||0) + (p2.tfsa_successor||0), y.year) || 0);
      const fhsa = Math.max(0, getRealValue((p1.fhsa||0) + (p2.fhsa||0), y.year) || 0);
      const rrsp_rrif = Math.max(0, getRealValue((p1.rrsp||0) + (p1.rrif_acct||0) + (p2.rrsp||0) + (p2.rrif_acct||0), y.year) || 0);
      const lira_lif = Math.max(0, getRealValue((p1.lirf||0) + (p1.lif||0) + (p2.lirf||0) + (p2.lif||0), y.year) || 0);
      const nreg = Math.max(0, getRealValue((p1.nonreg||0) + (p2.nonreg||0), y.year) || 0);
      const cash = Math.max(0, getRealValue((p1.cash||0) + (p2.cash||0), y.year) || 0);
      const crypto = Math.max(0, getRealValue((p1.crypto||0) + (p2.crypto||0), y.year) || 0);
      const realEstate = Math.max(0, getRealValue(y.reIncludedEq || 0, y.year) || 0);
      
      const total = tfsa + fhsa + rrsp_rrif + lira_lif + nreg + cash + crypto + realEstate;

      return {
          year: y.year,
          age: y.p1Age,
          tfsa, fhsa, rrsp_rrif, lira_lif, nreg, cash, crypto, realEstate,
          total
      };
  });

  const spendCategories = [
      { key: 'debt', label: 'Debt Payments', color: '#ef4444' },
      { key: 'mortgage', label: 'Mortgage', color: '#f59e0b' },
      { key: 'living', label: 'Living & Lifestyle', color: '#3b82f6' },
      { key: 'savings', label: 'Savings & Invest', color: '#10b981' }
  ];

  const spendChartData = results.timeline.map((y: any) => {
      const isReal = activeSpendView === 'real';
      const living = Math.max(0, getCustomRealValue(y.expenses || 0, y.year, isReal));
      const mortgage = Math.max(0, getCustomRealValue(y.mortgagePay || 0, y.year, isReal));
      const debt = Math.max(0, getCustomRealValue(y.debtRepayment || 0, y.year, isReal));
      
      let conts = 0;
      if (y.flows && y.flows.contributions) {
          conts += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          if (data.mode === 'Couple') conts += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
      }
      const savings = Math.max(0, getCustomRealValue(conts, y.year, isReal));
      const total = living + mortgage + debt + savings;

      return {
          year: y.year,
          age: y.p1Age,
          living, mortgage, debt, savings, total
      };
  });

  return (
    <div className="p-3 p-md-4">
      
      {/* Header with Title and Export Button */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 no-export">
          <div>
              <h4 className="fw-bold mb-1 d-flex align-items-center">
                  <i className="bi bi-clipboard2-data text-primary me-2"></i>Executive Summary
              </h4>
              <p className="text-muted small mb-0">High-level overview of your retirement feasibility, tax efficiency, and lifetime cash flow.</p>
          </div>
          
          <div className="d-flex gap-2">
              <button 
                  type="button" 
                  className="btn btn-outline-secondary btn-sm bg-input d-flex align-items-center rounded-pill px-3 shadow-sm"
                  onClick={handleExportPNG}
                  disabled={isExporting}
              >
                  <i className="bi bi-camera-fill me-2 text-info"></i>
                  {isExporting ? 'Generating Image...' : 'Save as Image'}
              </button>
          </div>
      </div>

      <div ref={dashboardRef}>
          
          {isExporting && (
              <div className="text-center text-muted fw-bold small text-uppercase ls-1 mb-4 pb-2 border-bottom border-secondary">
                  Generated by Retirement Planner Pro
              </div>
          )}

          {/* COMBINED PLAN HEALTH & FI READINESS OVERVIEW */}
          {planScore && (
            <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
              <h6 className="fw-bold text-uppercase ls-1 text-muted mb-4 d-flex align-items-center border-bottom border-secondary pb-3">
                  <i className="bi bi-shield-check text-primary me-2"></i> Quick Overview
              </h6>
              
              <div className="row g-5 mb-2">
                  {/* Overall Plan Health Pill */}
                  <div className="col-12 col-md-6 d-flex flex-column justify-content-center border-end-md border-secondary">
                      <div className="d-flex flex-column gap-1 mb-2">
                          <h6 className="fw-bold mb-0 text-uppercase ls-1 d-flex align-items-center text-main">
                              Overall Plan Health
                              <InfoBtn align="left" title="Plan Health" text="A comprehensive score out of 100 based on your savings rate, debt-load, emergency reserves, and projected retirement trajectory." />
                          </h6>
                          <div className="d-flex justify-content-between align-items-end mt-2">
                              <span className="text-muted small fw-medium">Based on 4 Core Pillars</span>
                              <span className={`fw-bold fs-5 ${getScoreColorText(planScore.totalScore)}`}>{planScore.totalScore} / 100</span>
                          </div>
                      </div>
                      
                      <div className="position-relative" style={{ height: '36px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '100px', padding: '4px' }}>
                          <div 
                              className="h-100 rounded-pill d-flex align-items-center justify-content-end px-3 transition-all"
                              style={{ 
                                  width: `${Math.max(planScore.totalScore, 2)}%`, 
                                  background: getScoreGradient(planScore.totalScore),
                                  boxShadow: getScoreShadow(planScore.totalScore),
                              }} 
                          >
                          </div>
                      </div>
                  </div>

                  {/* FI Readiness Pill */}
                  <div className="col-12 col-md-6 d-flex flex-column justify-content-center">
                      <div className="d-flex flex-column gap-1 mb-2">
                          <h6 className="fw-bold mb-0 text-uppercase ls-1 d-flex align-items-center text-primary">
                              Freedom Target (FI) Readiness
                              <InfoBtn align="left" title="Financial Independence Target" text="Your Freedom Target is 25x your projected annual retirement spending (The 4% Rule) calculated in today's dollars.<br><br>This bar shows your current liquid net worth vs your target, focusing purely on present-day readiness instead of backward-looking estimates." />
                          </h6>
                          <div className="d-flex justify-content-between align-items-end mt-2">
                              <span className="text-muted small fw-medium">Target: {formatCurrency(fiTarget)}</span>
                              <div className="text-md-end lh-1">
                                  <span className="fw-bold fs-5 text-main">{formatCurrency(currentLiquidNW)}</span>
                              </div>
                          </div>
                      </div>
                      
                      <div className="position-relative" style={{ height: '36px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '100px', padding: '4px' }}>
                          <div 
                              className="h-100 rounded-pill d-flex align-items-center justify-content-end px-3 transition-all"
                              style={{ 
                                  width: `${Math.min(Math.max(fiPercent, 2), 100)}%`, 
                                  background: isFI ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)' : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                                  boxShadow: isFI ? '0 0 15px rgba(52, 211, 153, 0.4)' : '0 0 15px rgba(96, 165, 250, 0.4)',
                              }} 
                          >
                              {fiPercent >= 10 && <span className="fw-bolder text-white small" style={{textShadow: '0 1px 2px rgba(0,0,0,0.4)', letterSpacing: '0.5px'}}>{fiPercent.toFixed(1)}%</span>}
                          </div>
                      </div>
                  </div>
              </div>

              {/* 4 Health Breakdown Cards */}
              <div className="row g-3 pt-4 mt-1 border-top border-secondary border-opacity-50">
                  <div className="col-6 col-md-3">
                      <ScoreCard title="Retirement Funding" score={planScore.retirementReadiness} max={50} tooltip="Measures your projected trajectory towards FI and funding a safe retirement without cash shortfalls." />
                  </div>
                  <div className="col-6 col-md-3">
                      <ScoreCard title="Debt Health" score={planScore.debtHealth} max={20} tooltip="Evaluates your Debt-to-Income (DTI) ratio to ensure sustainable cash flow." />
                  </div>
                  <div className="col-6 col-md-3">
                      <ScoreCard title="Savings Rate" score={planScore.savingsRate} max={20} tooltip="Measures what percentage of your gross household income is being automatically saved and invested." />
                  </div>
                  <div className="col-6 col-md-3">
                      <ScoreCard title="Emergency Fund" score={planScore.emergencyFund} max={10} tooltip="Checks if your current liquid cash reserves cover at least 6 months of baseline living expenses." />
                  </div>
              </div>
            </div>
          )}

          {/* Core Dashboard Metric Cards */}
          <div className="row g-4 mb-4">
              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-cash-stack text-success me-2"></i>
                          <span className="me-1">Total Gross Inflow</span>
                          <InfoBtn align="center" title="Gross Inflow" text="All cash sourced over your lifetime, including salaries, pensions, benefits, and portfolio withdrawals." />
                      </div>
                      <div className="fs-3 fw-bold text-main" title={formatExact(totalGrossInflow)}>{formatCurrency(totalGrossInflow)}</div>
                  </div>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-graph-up-arrow text-primary me-2"></i>
                          <span className="me-1">Total Compounding Growth</span>
                          <InfoBtn align="center" title="Compounding Growth" text="Total investment returns generated across all accounts above and beyond your contributions." />
                      </div>
                      <div className="fs-3 fw-bold text-success" title={formatExact(totalInvestmentGrowth)}>{formatCurrency(totalInvestmentGrowth)}</div>
                  </div>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-receipt-cutoff text-danger me-2"></i>
                          <span className="me-1">Total Taxes Paid</span>
                          <InfoBtn align="center" title="Taxes Paid" text="Cumulative income taxes paid to CRA and provincial governments over the projection." />
                      </div>
                      <div className="fs-3 fw-bold text-danger" title={formatExact(totalTaxPaid)}>{formatCurrency(totalTaxPaid)}</div>
                  </div>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-percent text-purple me-2"></i>
                          <span className="me-1">Lifetime Effective Tax</span>
                          <InfoBtn align="center" title="Effective Tax" text="Average proportion of your total lifetime gross inflow that went directly toward taxes." />
                      </div>
                      <div className="fs-3 fw-bold text-purple">{effTaxRate.toFixed(1)}%</div>
                  </div>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-cart-dash text-warning me-2"></i>
                          <span className="me-1">Total Living Expenses</span>
                          <InfoBtn align="center" title="Living Expenses" text="Total amount spent on lifestyle, debt, and baseline expenses over the simulation." />
                      </div>
                      <div className="fs-3 fw-bold text-warning" title={formatExact(totalExpenses)}>{formatCurrency(totalExpenses)}</div>
                  </div>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-calendar-heart text-info me-2"></i>
                          <span className="me-1">Avg Retirement Spend</span>
                          <InfoBtn align="center" title="Retirement Spend" text="Average annual spending during your retirement years, adjusted for today's dollars if toggled." />
                      </div>
                      <div className="fs-3 fw-bold text-info" title={formatExact(avgRetSpending)}>{formatCurrency(avgRetSpending)} <span className="fs-6 text-muted fw-normal">/yr</span></div>
                  </div>
              </div>
          </div>

          <div className="row g-4 mb-4">
              <div className="col-12 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 h-100 overflow-hidden shadow-sm">
                      <div className="card-header bg-black bg-opacity-25 border-bottom border-secondary p-3">
                          <h6 className="mb-0 fw-bold text-uppercase ls-1 text-center"><i className="bi bi-flag-fill text-warning me-2"></i>Milestones & Estate</h6>
                      </div>
                      <div className="card-body p-0">
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold">Retirement Day NW <span className="small fw-normal ms-1">(Age {data.inputs.p1_retireAge})</span></span>
                              <span className="fw-bold text-info" title={formatExact(retDayNW)}>{formatCurrency(retDayNW)}</span>
                          </div>
                          {initialWdRate > 0 && (
                              <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                                  <span className="text-muted fw-bold d-flex align-items-center">
                                      Initial Withdrawal Rate 
                                      <InfoBtn align="left" title="Initial Withdrawal Rate" text="Percentage of your liquid portfolio withdrawn in your first year of retirement. Rates above 5% significantly increase the risk of running out of money prematurely." />
                                  </span>
                                  <span className={`fw-bold ${initialWdRate > 5 ? 'text-warning' : 'text-success'}`}>
                                      {initialWdRate > 5 && <i className="bi bi-exclamation-triangle-fill text-warning me-1"></i>}
                                      {initialWdRate.toFixed(1)}%
                                  </span>
                              </div>
                          )}
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold">Peak Net Worth</span>
                              <span className="fw-bold text-success" title={formatExact(peakNW)}>{formatCurrency(peakNW)} <span className="text-muted small fw-normal ms-1">(Age {peakAge})</span></span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold">Mortgage Free</span>
                              <span className="fw-bold text-primary">{mortgageFreeYear}</span>
                          </div>
                          <div className="p-3 border-bottom border-secondary border-opacity-50">
                              <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-muted fw-bold d-flex align-items-center">
                                      Final Estate Value 
                                      <InfoBtn align="left" title="After-Tax Estate" text="The final value of your entire portfolio and real estate <b>after</b> applying the terminal tax on remaining RRSPs/RRIFs and Capital Gains at death."/>
                                  </span>
                                  <span className="fw-bold fs-5 text-success" title={formatExact(finalEstate)}>{formatCurrency(finalEstate)}</span>
                              </div>
                              {finalReEquity > 0 && (
                                  <div className="d-flex justify-content-between text-muted mt-2 pt-2 border-top border-secondary border-opacity-25 small" style={{ fontSize: '0.75rem' }}>
                                      <span><i className="bi bi-wallet2 me-1"></i>Liquid: <strong className={finalLiquidNW <= 0 ? "text-danger" : "text-main"}>{formatCurrency(finalLiquidNW)}</strong></span>
                                      <span><i className="bi bi-house-door me-1"></i>Real Estate: <strong className="text-info">{formatCurrency(finalReEquity)}</strong></span>
                                  </div>
                              )}
                          </div>
                          <div className="p-3 bg-black bg-opacity-10">
                              <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-muted fw-bold d-flex align-items-center">
                                      Plan Health
                                      <InfoBtn align="left" title="Plan Health Status" text={hasShortfall 
                                          ? `A cash deficit occurred starting in ${firstShortfallYear} (Age ${firstShortfallAge}) because available income and portfolio withdrawals were insufficient to cover living expenses, debt, and taxes.`
                                          : "All living expenses, debt payments, and taxes were successfully funded throughout retirement."} 
                                      />
                                  </span>
                                  {planHealth === "Success" ? (
                                      <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 fs-6 shadow-sm">
                                          <i className="bi bi-check-circle-fill me-1"></i>SUCCESS
                                      </span>
                                  ) : (
                                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-3 py-2 fs-6 shadow-sm">
                                          <i className="bi bi-x-circle-fill me-1"></i>FAILED
                                      </span>
                                  )}
                              </div>
                              {hasShortfall && firstShortfallAge && (
                                  <div className="mt-2 text-danger small d-flex align-items-start gap-2 pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                                      <i className="bi bi-exclamation-triangle-fill text-warning flex-shrink-0 mt-0.5"></i>
                                      <div>
                                          Liquid assets depleted at <strong>Age {firstShortfallAge} ({firstShortfallYear})</strong>.
                                          {isHouseRichCashPoor ? (
                                              <div className="text-warning-emphasis fst-italic mt-0.5">
                                                  House-rich, cash-poor: Portfolio hit \$0 while real estate equity remains.
                                              </div>
                                          ) : (
                                              <div className="text-muted mt-0.5">
                                                  Annual cash inflows were insufficient to cover living expenses.
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="col-12 col-xl-8">
                  <div className="row g-4 h-100">
                      
                      <div className="col-12 col-md-6">
                          <div className="rp-card border-secondary rounded-4 h-100 p-4 shadow-sm d-flex flex-column align-items-center justify-content-center">
                              <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-pie-chart-fill text-primary me-2"></i>Cash Distribution</h6>
                              
                              {totalPie > 1 ? (
                                  <div className="d-flex flex-column align-items-center justify-content-center gap-4 mt-2 w-100">
                                      <div className="position-relative d-flex align-items-center justify-content-center w-100" style={{height: '200px'}}>
                                          <div className="position-absolute d-flex flex-column align-items-center justify-content-center pointer-events-none text-center" style={{ zIndex: 1 }}>
                                              <span className="small text-muted fw-bold" style={{fontSize: '0.65rem'}}>TOTAL</span>
                                              <span className="fw-bold text-main lh-1" style={{fontSize: '0.9rem'}}>{formatCurrency(totalExpenses + totalTaxPaid + finalEstate)}</span>
                                          </div>
                                          <div className="w-100 h-100 position-relative" style={{ zIndex: 2 }}>
                                              <ResponsiveContainer width="100%" height="100%">
                                                  <PieChart>
                                                      <Pie 
                                                          data={pieData} 
                                                          innerRadius={75} 
                                                          outerRadius={95} 
                                                          paddingAngle={4} 
                                                          dataKey="value" 
                                                          stroke="none"
                                                      >
                                                          {pieData.map((entry, index) => (
                                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                                          ))}
                                                      </Pie>
                                                      <Tooltip 
                                                          formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                                                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontWeight: 'bold' }}
                                                          itemStyle={{ color: '#f8fafc' }}
                                                      />
                                                  </PieChart>
                                              </ResponsiveContainer>
                                          </div>
                                      </div>

                                      <div className="d-flex flex-column gap-2 w-100 px-3">
                                          {pieData.map(d => (
                                              <div key={d.name} className="d-flex justify-content-between align-items-center small">
                                                  <span className="d-flex align-items-center text-muted fw-bold">
                                                      <span className="rounded-circle me-2" style={{ width: '10px', height: '10px', backgroundColor: d.color }}></span>
                                                      {d.name}
                                                  </span>
                                                  <span className="fw-bold text-main">{((d.value / totalPie) * 100).toFixed(1)}%</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-muted small py-5">No distribution data available.</div>
                              )}
                          </div>
                      </div>

                      <div className="col-12 col-md-6">
                          <div className="rp-card border-secondary rounded-4 h-100 p-4 shadow-sm d-flex flex-column align-items-center justify-content-center">
                              <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-wallet2 text-info me-2"></i>Retirement Sourcing</h6>
                              
                              {totalFund > 1 ? (
                                  <div className="d-flex flex-column align-items-center justify-content-center gap-4 mt-2 w-100">
                                      <div className="position-relative d-flex align-items-center justify-content-center w-100" style={{height: '200px'}}>
                                          <div className="position-absolute d-flex flex-column align-items-center justify-content-center pointer-events-none text-center" style={{ zIndex: 1 }}>
                                              <span className="small text-muted fw-bold" style={{fontSize: '0.65rem'}}>SOURCED</span>
                                              <span className="fw-bold text-main lh-1" style={{fontSize: '0.9rem'}}>{formatCurrency(retSpent)}</span>
                                          </div>
                                          <div className="w-100 h-100 position-relative" style={{ zIndex: 2 }}>
                                              <ResponsiveContainer width="100%" height="100%">
                                                  <PieChart>
                                                      <Pie 
                                                          data={fundData} 
                                                          innerRadius={75} 
                                                          outerRadius={95} 
                                                          paddingAngle={4} 
                                                          dataKey="value" 
                                                          stroke="none"
                                                      >
                                                          {fundData.map((entry, index) => (
                                                              <Cell key={`cell-fund-${index}`} fill={entry.color} />
                                                          ))}
                                                      </Pie>
                                                      <Tooltip 
                                                          formatter={(value: any) => [formatCurrency(Number(value)), 'Amount']}
                                                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', fontWeight: 'bold' }}
                                                          itemStyle={{ color: '#f8fafc' }}
                                                      />
                                                  </PieChart>
                                              </ResponsiveContainer>
                                          </div>
                                      </div>

                                      <div className="d-flex flex-column gap-2 w-100 px-3">
                                          {fundData.map(d => (
                                              <div key={d.name} className="d-flex justify-content-between align-items-center small">
                                                  <span className="d-flex align-items-center text-muted fw-bold">
                                                      <span className="rounded-circle me-2" style={{ width: '10px', height: '10px', backgroundColor: d.color }}></span>
                                                      {d.name}
                                                  </span>
                                                  <span className="fw-bold text-main">{((d.value / totalFund) * 100).toFixed(1)}%</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-muted small py-5">No retirement funding data yet.</div>
                              )}
                          </div>
                      </div>

                  </div>
              </div>
          </div>

          {/* NET WORTH ACCUMULATION / DECUMULATION TRAJECTORY */}
          <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                  <div>
                      <h6 className="fw-bold text-uppercase ls-1 text-muted mb-1 d-flex align-items-center">
                          <i className="bi bi-graph-up text-primary me-2"></i>Net Worth Trajectory
                      </h6>
                      <span className="text-muted small">Visualizing portfolio drawdown and asset allocation shifts over time.</span>
                  </div>

                  <div className="d-flex gap-2">
                      <div className="btn-group btn-group-sm bg-input border border-secondary rounded-pill p-1 shadow-sm">
                          <button 
                              className={`btn btn-sm rounded-pill fw-bold px-3 ${chartView === 'stacked' ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'}`}
                              onClick={() => setChartView('stacked')}
                          >
                              Asset Breakdown
                          </button>
                          <button 
                              className={`btn btn-sm rounded-pill fw-bold px-3 ${chartView === 'total' ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'}`}
                              onClick={() => setChartView('total')}
                          >
                              Total Trajectory
                          </button>
                      </div>

                      <div className="btn-group btn-group-sm bg-input border border-secondary rounded-pill p-1 shadow-sm">
                          <button 
                              className={`btn btn-sm rounded-pill fw-bold px-3 ${activeAssetView === 'real' ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'}`}
                              onClick={() => setActiveAssetView('real')}
                          >
                              Today's \$
                          </button>
                          <button 
                              className={`btn btn-sm rounded-pill fw-bold px-3 ${activeAssetView === 'nominal' ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'}`}
                              onClick={() => setActiveAssetView('nominal')}
                          >
                              Future \$
                          </button>
                      </div>
                  </div>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                          <XAxis 
                              dataKey="age" 
                              stroke="#94a3b8" 
                              fontSize={12} 
                              tickLine={false}
                              tickFormatter={(age) => `Age ${age}`}
                          />
                          <YAxis 
                              stroke="#94a3b8" 
                              fontSize={12} 
                              tickLine={false}
                              tickFormatter={(val) => formatCurrency(val)}
                          />
                          <Tooltip 
                              content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                      const dataObj = payload[0].payload;
                                      return (
                                          <div className="p-3 border border-secondary rounded-3 shadow-lg" style={{ backgroundColor: '#1e293b', minWidth: '220px' }}>
                                              <div className="fw-bold text-main border-bottom border-secondary pb-1 mb-2 d-flex justify-content-between">
                                                  <span>Age {label}</span>
                                                  <span className="text-muted">{dataObj.year}</span>
                                              </div>
                                              {chartView === 'stacked' ? (
                                                  <>
                                                      {categories.map(c => {
                                                          const val = dataObj[c.key] || 0;
                                                          if (val <= 0) return null;
                                                          return (
                                                              <div key={c.key} className="d-flex justify-content-between small py-0.5">
                                                                  <span style={{ color: c.color }} className="fw-bold">{c.label}:</span>
                                                                  <span className="text-main fw-bold">{formatCurrency(val)}</span>
                                                              </div>
                                                          );
                                                      })}
                                                      <div className="border-top border-secondary pt-1 mt-2 d-flex justify-content-between fw-bold text-main">
                                                          <span>Total:</span>
                                                          <span className="text-info">{formatCurrency(dataObj.total)}</span>
                                                      </div>
                                                  </>
                                              ) : (
                                                  <div className="d-flex justify-content-between fw-bold text-main py-1">
                                                      <span>Net Worth:</span>
                                                      <span className="text-info">{formatCurrency(dataObj.total)}</span>
                                                  </div>
                                              )}
                                          </div>
                                      );
                                  }
                                  return null;
                              }}
                          />
                          
                          {chartView === 'stacked' ? (
                              categories.map((c) => (
                                  <Bar 
                                      key={c.key} 
                                      dataKey={c.key} 
                                      stackId="a" 
                                      fill={c.color} 
                                      radius={c.key === 'realEstate' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                  />
                              ))
                          ) : (
                              <Bar 
                                  dataKey="total" 
                                  fill="#0ea5e9" 
                                  radius={[6, 6, 0, 0]}
                              />
                          )}
                      </BarChart>
                  </ResponsiveContainer>
              </div>

              {chartView === 'stacked' && (
                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-4 pt-2 border-top border-secondary border-opacity-25">
                      {categories.map(c => (
                          <div key={c.key} className="d-flex align-items-center small text-muted">
                              <span className="rounded-circle me-2" style={{ width: '10px', height: '10px', backgroundColor: c.color }}></span>
                              <span className="fw-bold">{c.label}</span>
                          </div>
                      ))}
                  </div>
              )}
          </div>

          {/* ANNUAL CASH OUTFLOWS & SAVINGS PROFILE */}
          <div className="rp-card border-secondary rounded-4 p-4 shadow-sm">
              <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
                  <div>
                      <h6 className="fw-bold text-uppercase ls-1 text-muted mb-1 d-flex align-items-center">
                          <i className="bi bi-cart-check text-warning me-2"></i>Annual Outflows & Savings Profile
                      </h6>
                      <span className="text-muted small">Tracking living costs, mortgage payments, debt repayment, and portfolio additions.</span>
                  </div>

                  <div className="d-flex gap-2">
                      <div className="btn-group btn-group-sm bg-input border border-secondary rounded-pill p-1 shadow-sm">
                          <button 
                              className={`btn btn-sm rounded-pill fw-bold px-3 ${activeSpendView === 'real' ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'}`}
                              onClick={() => setActiveSpendView('real')}
                          >
                              Today's $
                          </button>
                          <button 
                              className={`btn btn-sm rounded-pill fw-bold px-3 ${activeSpendView === 'nominal' ? 'btn-primary text-white' : 'btn-link text-muted text-decoration-none'}`}
                              onClick={() => setActiveSpendView('nominal')}
                          >
                              Future $
                          </button>
                      </div>
                  </div>
              </div>

              <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                      <BarChart data={spendChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                          <XAxis 
                              dataKey="age" 
                              stroke="#94a3b8" 
                              fontSize={12} 
                              tickLine={false}
                              tickFormatter={(age) => `Age ${age}`}
                          />
                          <YAxis 
                              stroke="#94a3b8" 
                              fontSize={12} 
                              tickLine={false}
                              tickFormatter={(val) => formatCurrency(val)}
                          />
                          <Tooltip 
                              content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                      const dataObj = payload[0].payload;
                                      return (
                                          <div className="p-3 border border-secondary rounded-3 shadow-lg" style={{ backgroundColor: '#1e293b', minWidth: '220px' }}>
                                              <div className="fw-bold text-main border-bottom border-secondary pb-1 mb-2 d-flex justify-content-between">
                                                  <span>Age {label}</span>
                                                  <span className="text-muted">{dataObj.year}</span>
                                              </div>
                                              {spendCategories.map(c => {
                                                  const val = dataObj[c.key] || 0;
                                                  if (val <= 0) return null;
                                                  return (
                                                      <div key={c.key} className="d-flex justify-content-between small py-0.5">
                                                          <span style={{ color: c.color }} className="fw-bold">{c.label}:</span>
                                                          <span className="text-main fw-bold">{formatCurrency(val)}</span>
                                                      </div>
                                                  );
                                              })}
                                              <div className="border-top border-secondary pt-1 mt-2 d-flex justify-content-between fw-bold text-main">
                                                  <span>Total Outflow:</span>
                                                  <span className="text-warning">{formatCurrency(dataObj.total)}</span>
                                              </div>
                                          </div>
                                      );
                                  }
                                  return null;
                              }}
                          />
                          
                          {spendCategories.map((c) => (
                              <Bar 
                                  key={c.key} 
                                  dataKey={c.key} 
                                  stackId="a" 
                                  fill={c.color} 
                                  radius={c.key === 'savings' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                              />
                          ))}
                      </BarChart>
                  </ResponsiveContainer>
              </div>

              <div className="d-flex flex-wrap justify-content-center gap-3 mt-4 pt-2 border-top border-secondary border-opacity-25">
                  {spendCategories.map(c => (
                      <div key={c.key} className="d-flex align-items-center small text-muted">
                          <span className="rounded-circle me-2" style={{ width: '10px', height: '10px', backgroundColor: c.color }}></span>
                          <span className="fw-bold">{c.label}</span>
                      </div>
                  ))}
              </div>
          </div>

      </div>

    </div>
  );
}

```