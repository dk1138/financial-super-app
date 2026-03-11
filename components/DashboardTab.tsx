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
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 4000);
  };

  const handleCopyToClipboard = async () => {
      if (!dashboardRef.current) return;
      setIsExporting(true);
      showToast('Generating high-res image...');
      try {
          setTimeout(async () => {
              const canvas = await html2canvas(dashboardRef.current!, { backgroundColor: '#16181d', scale: 2 });
              canvas.toBlob(async (blob) => {
                  if (blob) {
                      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                      showToast('✅ Copied to clipboard! Ready to paste (Ctrl+V) into Reddit/Discord.');
                  }
              });
              setIsExporting(false);
          }, 300);
      } catch (err) {
          console.error(err);
          showToast('❌ Failed to copy image.');
          setIsExporting(false);
      }
  };

  const handleDownloadPNG = async () => {
      if (!dashboardRef.current) return;
      setIsExporting(true);
      showToast('Generating high-res image...');
      try {
          setTimeout(async () => {
              const canvas = await html2canvas(dashboardRef.current!, { backgroundColor: '#16181d', scale: 2 });
              const url = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = url;
              link.download = 'Retirement_Summary.png';
              link.click();
              showToast('✅ Image downloaded successfully!');
              setIsExporting(false);
          }, 300);
      } catch (err) {
          console.error(err);
          showToast('❌ Failed to download image.');
          setIsExporting(false);
      }
  };

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <i className="bi bi-hourglass-split fs-1 mb-3 d-block text-primary opacity-50"></i>
        <h5>Waiting for calculation...</h5>
      </div>
    );
  }

  const baseYear = results.timeline[0]?.year || new Date().getFullYear();
  const inflation = (data.inputs.inflation_rate || 2.1) / 100;

  const getRealValue = (nominalValue: number, year?: number) => {
      if (!data.useRealDollars || year === undefined) return nominalValue;
      const yearsOut = Math.max(0, year - baseYear);
      return nominalValue / Math.pow(1 + inflation, yearsOut);
  };

  const formatCurrency = (val: number) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatExact = (val: number) => {
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
  };

  const formatYAxis = (val: number) => {
      if (val === 0) return "$0";
      if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
      return `$${Math.round(val)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
          return (
              <div className="bg-input border border-secondary p-3 rounded-4 shadow-lg" style={{ minWidth: '220px' }}>
                  {label && <p className="fw-bold mb-2 border-bottom border-secondary pb-2 text-muted text-uppercase ls-1" style={{fontSize: '0.75rem'}}>Year: {label}</p>}
                  <div className="d-flex flex-column gap-1 mb-2">
                      {[...payload].reverse().map((entry: any, index: number) => {
                          if (entry.value === 0) return null;
                          return (
                              <div key={index} className="d-flex justify-content-between align-items-center gap-4">
                                  <div className="d-flex align-items-center">
                                      <span className="rounded-circle me-2" style={{width: '8px', height: '8px', backgroundColor: entry.color}}></span>
                                      <span className="fw-medium small text-muted">{entry.name}</span>
                                  </div>
                                  <span className="fw-bold text-main small">{formatExact(entry.value)}</span>
                              </div>
                          );
                      })}
                  </div>
                  {payload.length > 1 && (
                      <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-50">
                          <span className="fw-bold small text-muted text-uppercase ls-1" style={{fontSize: '0.7rem'}}>Total</span>
                          <span className="fw-bolder text-main">{formatExact(total)}</span>
                      </div>
                  )}
              </div>
          );
      }
      return null;
  };

  const getScoreColorText = (score: number) => {
      if (score >= 80) return 'text-success';
      if (score >= 60) return 'text-warning';
      return 'text-danger';
  };

  const getScoreGradient = (score: number) => {
      if (score >= 80) return 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'; 
      if (score >= 60) return 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)'; 
      return 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'; 
  };

  const getScoreShadow = (score: number) => {
      if (score >= 80) return '0 0 15px rgba(52, 211, 153, 0.4)';
      if (score >= 60) return '0 0 15px rgba(245, 158, 11, 0.4)';
      return '0 0 15px rgba(239, 68, 68, 0.4)';
  };

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

      return { year: y.year, age: y.p1Age, tfsa, fhsa, rrsp_rrif, lira_lif, nreg, cash, crypto, realEstate, total };
  });

  const activeCategories = categories.filter(c => chartData.some((d: any) => d[c.key] > 0));

  const rawMaxNW = Math.max(1, ...chartData.map((d: any) => d.total));
  const maxTotalNW = rawMaxNW * 1.05; 
  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map(f => maxTotalNW * f);

  const firstRetYearObj = results.timeline.find((y: any) => y.p1Age >= data.inputs.p1_retireAge) || results.timeline[results.timeline.length - 1];
  const firstRetNominalSpend = (firstRetYearObj.expenses || 0) + (firstRetYearObj.mortgagePay || 0);
  const yearsToRet = Math.max(0, firstRetYearObj.year - baseYear);
  const firstRetRealSpend = firstRetNominalSpend / Math.pow(1 + inflation, yearsToRet);
  
  const fiTarget = firstRetRealSpend * 25;
  const currentLiquidNW = results.timeline[0].liquidNW; 
  const fiPercent = fiTarget > 0 ? (currentLiquidNW / fiTarget) * 100 : 0;
  const isFI = fiPercent >= 100;

  return (
    <div className="p-3 p-md-4 pb-5 mb-5 position-relative">
        
      {toastMsg && (
          <div className="position-fixed top-0 start-50 translate-middle-x mt-4 transition-all" style={{zIndex: 9999}}>
              <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                  {toastMsg}
              </div>
          </div>
      )}

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <h5 className="fw-bold text-uppercase ls-1 text-primary mb-0 d-flex align-items-center">
              <i className="bi bi-clipboard2-data me-2"></i> Executive Summary
          </h5>
          
          <div className="d-flex gap-2" data-html2canvas-ignore>
              <button 
                  className="btn btn-sm btn-outline-info fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center" 
                  onClick={handleCopyToClipboard}
                  disabled={isExporting}
              >
                  {isExporting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-clipboard me-2"></i>}
                  Copy Image to Clipboard
              </button>
              <button 
                  className="btn btn-sm btn-primary fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center" 
                  onClick={handleDownloadPNG}
                  disabled={isExporting}
              >
                  <i className="bi bi-download me-2"></i> Save PNG
              </button>
          </div>
      </div>

      <div ref={dashboardRef}>
          
          {isExporting && (
              <div className="text-center text-muted fw-bold small text-uppercase ls-1 mb-4 pb-2 border-bottom border-secondary">
                  Generated by Retirement Planner Pro
              </div>
          )}

          {planScore && (
            <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
              <h6 className="fw-bold text-uppercase ls-1 text-muted mb-4 d-flex align-items-center border-bottom border-secondary pb-3">
                  <i className="bi bi-shield-check text-primary me-2"></i> Quick Overview
              </h6>
              
              <div className="row g-5 mb-2">
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
                          <span className="me-1">Investment Growth</span>
                          <InfoBtn align="center" title="Investment Growth" text="Total compound interest and market growth generated by your portfolio over the entire simulation." />
                      </div>
                      <div className="fs-3 fw-bold text-primary" title={formatExact(totalInvestmentGrowth)}>{formatCurrency(totalInvestmentGrowth)}</div>
                  </div>
              </div>

              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-bank text-purple me-2" style={{color:'var(--bs-purple)'}}></i>
                          <span className="me-1" style={{color:'var(--bs-purple)'}}>Govt Benefits Collected</span>
                          <InfoBtn align="center" title="Govt Benefits" text="Total CPP and OAS collected over your lifetime." />
                      </div>
                      <div className="fs-3 fw-bold" style={{color:'var(--bs-purple)'}} title={formatExact(totalBenefits)}>{formatCurrency(totalBenefits)}</div>
                  </div>
              </div>

              {/* TARGET: tour-tax-breakdown added here */}
              <div className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm tour-tax-breakdown">
                      <div className="text-muted fw-bold text-uppercase ls-1 small mb-2 d-flex align-items-center justify-content-center w-100">
                          <i className="bi bi-receipt text-danger me-2"></i>
                          <span className="me-1">Lifetime Tax Paid</span>
                          <InfoBtn align="center" title="Lifetime Tax" text="Total federal and provincial tax paid, including capital gains taxes and OAS clawbacks." />
                      </div>
                      <div className="fs-3 fw-bold text-danger" title={formatExact(totalTaxPaid)}>
                          {formatCurrency(totalTaxPaid)} 
                          <span className="fs-6 text-muted ms-2 fw-medium">({effTaxRate.toFixed(1)}% Eff.)</span>
                      </div>
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

          <div className="row mb-4">
              <div className="col-12 col-xl-4 mb-4 mb-xl-0">
                  <div className="rp-card border-secondary rounded-4 h-100 overflow-hidden shadow-sm">
                      <div className="card-header bg-black bg-opacity-25 border-bottom border-secondary p-3">
                          <h6 className="mb-0 fw-bold text-uppercase ls-1 text-center"><i className="bi bi-flag-fill text-warning me-2"></i>Milestones & Estate</h6>
                      </div>
                      <div className="card-body p-0">
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold">Retirement Day NW <span className="small fw-normal ms-1">(Age {data.inputs.p1_retireAge})</span></span>
                              <span className="fw-bold text-info" title={formatExact(retDayNW)}>{formatCurrency(retDayNW)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold">Peak Net Worth</span>
                              <span className="fw-bold text-success" title={formatExact(peakNW)}>{formatCurrency(peakNW)} <span className="text-muted small fw-normal ms-1">(Age {peakAge})</span></span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold">Mortgage Free</span>
                              <span className="fw-bold text-primary">{mortgageFreeYear}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold d-flex align-items-center">Final Estate Value <InfoBtn align="left" title="After-Tax Estate" text="The final value of your entire portfolio and real estate <b>after</b> applying the terminal tax on remaining RRSPs/RRIFs and Capital Gains at death."/></span>
                              <span className="fw-bold fs-5 text-success" title={formatExact(finalEstate)}>{formatCurrency(finalEstate)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center p-3 bg-black bg-opacity-10">
                              <span className="text-muted fw-bold">Plan Health</span>
                              {planHealth === "Success" 
                                ? <span className="badge bg-success bg-opacity-25 text-success border border-success px-3 py-2 fs-6 shadow-sm">SUCCESS</span>
                                : <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-3 py-2 fs-6 shadow-sm">FAILED</span>
                              }
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
                                                          isAnimationActive={!isExporting}
                                                      >
                                                          {pieData.map((entry, index) => (
                                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                                          ))}
                                                      </Pie>
                                                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} offset={20} wrapperStyle={{ zIndex: 1000 }} />
                                                  </PieChart>
                                              </ResponsiveContainer>
                                          </div>
                                      </div>
                                      
                                      <div className="d-flex flex-column gap-2 w-100" style={{maxWidth: '220px'}}>
                                          {pieData.map((d, i) => (
                                              <div className="d-flex justify-content-between align-items-center" key={i}>
                                                  <div className="d-flex align-items-center">
                                                      <span className="rounded-circle me-2 shadow-sm" style={{width: '12px', height: '12px', backgroundColor: d.color, display: 'inline-block'}}></span>
                                                      <span className="small text-muted fw-bold">{d.name}</span>
                                                  </div>
                                                  <span className="fw-bold text-main small">{((d.value / totalPie) * 100).toFixed(1)}%</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center text-muted fst-italic py-4">Not enough data.</div>
                              )}
                          </div>
                      </div>

                      <div className="col-12 col-md-6">
                          <div className="rp-card border-secondary rounded-4 h-100 p-4 shadow-sm d-flex flex-column align-items-center justify-content-center">
                              <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-wallet-fill text-info me-2"></i>Retirement Funding</h6>
                              
                              {totalFund > 1 ? (
                                  <div className="d-flex flex-column align-items-center justify-content-center gap-4 mt-2 w-100">
                                      <div className="position-relative d-flex align-items-center justify-content-center w-100" style={{height: '200px'}}>
                                          <div className="position-absolute d-flex flex-column align-items-center justify-content-center pointer-events-none text-center" style={{ zIndex: 1 }}>
                                              <span className="small text-muted fw-bold text-center lh-1 mb-1" style={{fontSize: '0.65rem'}}>RETIREMENT<br/>INCOME</span>
                                              <span className="fw-bold text-main lh-1" style={{fontSize: '0.9rem'}}>{formatCurrency(totalFund)}</span>
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
                                                          isAnimationActive={!isExporting}
                                                      >
                                                          {fundData.map((entry, index) => (
                                                              <Cell key={`cell-${index}`} fill={entry.color} />
                                                          ))}
                                                      </Pie>
                                                      <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} offset={20} wrapperStyle={{ zIndex: 1000 }} />
                                                  </PieChart>
                                              </ResponsiveContainer>
                                          </div>
                                      </div>
                                      
                                      <div className="d-flex flex-column gap-2 w-100" style={{maxWidth: '220px'}}>
                                          {fundData.map((d, i) => (
                                              <div className="d-flex justify-content-between align-items-center" key={i}>
                                                  <div className="d-flex align-items-center">
                                                      <span className="rounded-circle me-2 shadow-sm" style={{width: '12px', height: '12px', backgroundColor: d.color, display: 'inline-block'}}></span>
                                                      <span className="small text-muted fw-bold">{d.name}</span>
                                                  </div>
                                                  <span className="fw-bold text-main small">{((d.value / totalFund) * 100).toFixed(1)}%</span>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center text-muted fst-italic py-4">No retirement data.</div>
                              )}
                          </div>
                      </div>

                  </div>
              </div>

          </div>

          <div className="row mt-2">
              <div className="col-12">
                  {/* TARGET: tour-cashflow-chart added here */}
                  <div className="rp-card border-secondary rounded-4 p-4 shadow-sm d-flex flex-column tour-cashflow-chart" style={{ height: '600px' }}>
                      <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-bar-chart-line-fill text-primary me-2"></i>Net Worth Composition Over Time</h6>
                      
                      {maxTotalNW > 1 ? (
                          <>
                              <div className="d-flex flex-wrap justify-content-center gap-3 mb-4 pb-3 border-bottom border-secondary flex-shrink-0">
                                  {[...activeCategories].reverse().map(c => (
                                      <div className="d-flex align-items-center" key={c.key}>
                                          <span className="rounded-circle me-2 shadow-sm border border-secondary border-opacity-25" style={{width: '12px', height: '12px', backgroundColor: c.color, display: 'inline-block'}}></span>
                                          <span className="small text-muted fw-bold ls-1" style={{fontSize: '0.75rem'}}>{c.label}</span>
                                      </div>
                                  ))}
                              </div>

                              <div className="w-100 flex-grow-1" style={{ minHeight: 0 }}>
                                  <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                                          <XAxis 
                                              dataKey="year" 
                                              stroke="#888" 
                                              tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} 
                                              tickMargin={12} 
                                              minTickGap={25} 
                                          />
                                          <YAxis 
                                              tickFormatter={(val) => formatYAxis(val)} 
                                              stroke="#888" 
                                              tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} 
                                              width={65} 
                                              axisLine={false}
                                              tickLine={false}
                                          />
                                          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bs-primary)', opacity: 0.1 }} offset={20} wrapperStyle={{ zIndex: 1000 }} />
                                          
                                          {[...activeCategories].map(c => (
                                              <Bar 
                                                  key={c.key} 
                                                  dataKey={c.key} 
                                                  name={c.label} 
                                                  stackId="a" 
                                                  fill={c.color} 
                                                  isAnimationActive={!isExporting} 
                                              />
                                          ))}
                                      </BarChart>
                                  </ResponsiveContainer>
                              </div>
                          </>
                      ) : (
                          <div className="text-center text-muted fst-italic py-5 my-auto">No assets tracked.</div>
                      )}
                  </div>
              </div>
          </div>
          
      </div>

    </div>
  );
}