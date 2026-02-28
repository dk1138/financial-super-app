import React, { useState } from 'react';
import { useFinance } from '../lib/FinanceContext';

const InfoBtn = ({ title, text, align = 'center' }: { title: string, text: string, align?: 'center'|'right'|'left' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { top: '140%', backgroundColor: 'var(--bg-card)', minWidth: '260px' };
    if (align === 'right') { posStyles.right = '0'; }
    else if (align === 'left') { posStyles.left = '0'; }
    else { posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }

    return (
        <div className="position-relative d-inline-flex align-items-center ms-2" style={{zIndex: open ? 1050 : 1}}>
            <button type="button" className="btn btn-link p-0 text-muted info-btn text-decoration-none" onClick={(e) => { e.preventDefault(); setOpen(!open); }} onBlur={() => setTimeout(() => setOpen(false), 200)}>
                <i className="bi bi-info-circle" style={{fontSize: '0.85rem'}}></i>
            </button>
            {open && (
                <div className="position-absolute border border-secondary rounded-3 shadow-lg p-3 text-none-uppercase text-start" style={posStyles}>
                    <h6 className="fw-bold mb-2 text-main border-bottom border-secondary pb-1 text-capitalize" style={{fontSize: '0.85rem'}}>{title}</h6>
                    <div className="small text-muted fw-normal text-none-uppercase" style={{fontSize: '0.75rem', lineHeight: '1.5', whiteSpace: 'normal', textTransform: 'none'}} dangerouslySetInnerHTML={{__html: text}}></div>
                </div>
            )}
        </div>
    );
};

export default function DashboardTab() {
  const { data, results } = useFinance();

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <i className="bi bi-hourglass-split fs-1 mb-3 d-block text-primary opacity-50"></i>
        <h5>Waiting for calculation...</h5>
      </div>
    );
  }

  // --- Real Dollars Discounting Math ---
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

  // --- Dashboard Aggregations ---
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

      // Retirement specific aggregations
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

  // --- Milestones ---
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

  const finalEstateRaw = results.timeline[results.timeline.length - 1].liquidNW + (results.timeline[results.timeline.length - 1].reIncludedEq || 0);
  const finalEstate = getRealValue(finalEstateRaw, results.timeline[results.timeline.length - 1].year);
  const planHealth = finalEstateRaw > 0 ? "Success" : "Failed";

  // --- Donut Chart 1: Lifetime Cash Distribution ---
  const pieData = [
      { label: 'Living & Debt', value: totalExpenses, color: '#f59e0b' },
      { label: 'Taxes Paid', value: totalTaxPaid, color: '#ef4444' },
      { label: 'Final Estate', value: Math.max(0, finalEstate), color: '#10b981' }
  ].filter(d => d.value > 0);
  
  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0) || 1; 
  let cumulativePercent1 = 0;
  const conicStr1 = pieData.map(d => {
      const pct = (d.value / totalPie) * 100;
      const start = cumulativePercent1;
      cumulativePercent1 += pct;
      return `${d.color} ${start}% ${cumulativePercent1}%`;
  }).join(', ');

  // --- Donut Chart 2: Retirement Funding Sources ---
  const fundData = [
      { label: 'Portfolio W/D', value: retPortfolioWd, color: '#3b82f6' },
      { label: 'Govt Benefits', value: retGovtBen, color: '#8b5cf6' },
      { label: 'Pensions', value: retPensions, color: '#06b6d4' },
      { label: 'Work/Yield', value: retOtherInc, color: '#ec4899' }
  ].filter(d => d.value > 0);

  const totalFund = fundData.reduce((sum, d) => sum + d.value, 0) || 1; 
  let cumulativePercent2 = 0;
  const conicStr2 = fundData.map(d => {
      const pct = (d.value / totalFund) * 100;
      const start = cumulativePercent2;
      cumulativePercent2 += pct;
      return `${d.color} ${start}% ${cumulativePercent2}%`;
  }).join(', ');

  // --- Stacked Composition Chart Over Time ---
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
      const nreg = Math.max(0, getRealValue((p1.nreg||0) + (p2.nreg||0), y.year) || 0);
      const cash = Math.max(0, getRealValue((p1.cash||0) + (p2.cash||0), y.year) || 0);
      const crypto = Math.max(0, getRealValue((p1.crypto||0) + (p2.crypto||0), y.year) || 0);
      const realEstate = Math.max(0, getRealValue(y.reIncludedEq || 0, y.year) || 0);
      
      const total = tfsa + fhsa + rrsp_rrif + lira_lif + nreg + cash + crypto + realEstate;

      return { year: y.year, age: y.p1Age, tfsa, fhsa, rrsp_rrif, lira_lif, nreg, cash, crypto, realEstate, total };
  });

  const rawMaxNW = Math.max(1, ...chartData.map((d: any) => d.total));
  const maxTotalNW = rawMaxNW * 1.05; // 5% buffer at the top
  const yAxisTicks = [1, 0.75, 0.5, 0.25, 0].map(f => maxTotalNW * f);

  return (
    <div className="p-3 p-md-4 pb-5 mb-5">
      <h5 className="fw-bold text-uppercase ls-1 text-primary mb-4 d-flex align-items-center">
          <i className="bi bi-clipboard2-data me-2"></i> Executive Summary
      </h5>

      {/* 6 Top Metric Cards - Centered */}
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

          <div className="col-12 col-md-6 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 d-flex flex-column align-items-center justify-content-center text-center shadow-sm">
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

      <div className="row g-4 mb-4">
          
          {/* Milestones Panel */}
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
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                          <span className="text-muted fw-bold">Peak Net Worth</span>
                          <span className="fw-bold text-success" title={formatExact(peakNW)}>{formatCurrency(peakNW)} <span className="text-muted small fw-normal ms-1">(Age {peakAge})</span></span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                          <span className="text-muted fw-bold">Mortgage Free</span>
                          <span className="fw-bold text-primary">{mortgageFreeYear}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center p-3 border-bottom border-secondary border-opacity-50">
                          <span className="text-muted fw-bold">Final Estate Value</span>
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

          {/* Double Donut Charts Container */}
          <div className="col-12 col-xl-8">
              <div className="row g-4 h-100">
                  
                  {/* Lifetime Cash Distribution Donut */}
                  <div className="col-12 col-md-6">
                      <div className="rp-card border-secondary rounded-4 h-100 p-4 shadow-sm d-flex flex-column align-items-center justify-content-center">
                          <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-pie-chart-fill text-primary me-2"></i>Cash Distribution</h6>
                          
                          {totalPie > 1 ? (
                              <div className="d-flex flex-column align-items-center justify-content-center gap-4 mt-2 w-100">
                                  {/* Pure CSS Donut Chart */}
                                  <div className="position-relative d-flex align-items-center justify-content-center shadow-sm" style={{width: '180px', height: '180px', borderRadius: '50%', background: `conic-gradient(${conicStr1})`, flexShrink: 0}}>
                                      <div className="rounded-circle d-flex flex-column align-items-center justify-content-center shadow-inner" style={{width: '110px', height: '110px', backgroundColor: 'var(--bg-card)'}}>
                                          <span className="small text-muted fw-bold" style={{fontSize: '0.65rem'}}>TOTAL</span>
                                          <span className="fw-bold text-main lh-1" style={{fontSize: '0.9rem'}}>{formatCurrency(totalExpenses + totalTaxPaid + finalEstate)}</span>
                                      </div>
                                  </div>
                                  
                                  {/* Legend */}
                                  <div className="d-flex flex-column gap-2 w-100" style={{maxWidth: '220px'}}>
                                      {pieData.map((d, i) => (
                                          <div className="d-flex justify-content-between align-items-center" key={i}>
                                              <div className="d-flex align-items-center">
                                                  <span className="rounded-circle me-2 shadow-sm" style={{width: '12px', height: '12px', backgroundColor: d.color, display: 'inline-block'}}></span>
                                                  <span className="small text-muted fw-bold">{d.label}</span>
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

                  {/* Retirement Funding Sources Donut */}
                  <div className="col-12 col-md-6">
                      <div className="rp-card border-secondary rounded-4 h-100 p-4 shadow-sm d-flex flex-column align-items-center justify-content-center">
                          <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-wallet-fill text-info me-2"></i>Retirement Funding</h6>
                          
                          {totalFund > 1 ? (
                              <div className="d-flex flex-column align-items-center justify-content-center gap-4 mt-2 w-100">
                                  {/* Pure CSS Donut Chart */}
                                  <div className="position-relative d-flex align-items-center justify-content-center shadow-sm" style={{width: '180px', height: '180px', borderRadius: '50%', background: `conic-gradient(${conicStr2})`, flexShrink: 0}}>
                                      <div className="rounded-circle d-flex flex-column align-items-center justify-content-center shadow-inner" style={{width: '110px', height: '110px', backgroundColor: 'var(--bg-card)'}}>
                                          <span className="small text-muted fw-bold text-center lh-1 mb-1" style={{fontSize: '0.65rem'}}>RETIREMENT<br/>INCOME</span>
                                          <span className="fw-bold text-main lh-1" style={{fontSize: '0.9rem'}}>{formatCurrency(totalFund)}</span>
                                      </div>
                                  </div>
                                  
                                  {/* Legend */}
                                  <div className="d-flex flex-column gap-2 w-100" style={{maxWidth: '220px'}}>
                                      {fundData.map((d, i) => (
                                          <div className="d-flex justify-content-between align-items-center" key={i}>
                                              <div className="d-flex align-items-center">
                                                  <span className="rounded-circle me-2 shadow-sm" style={{width: '12px', height: '12px', backgroundColor: d.color, display: 'inline-block'}}></span>
                                                  <span className="small text-muted fw-bold">{d.label}</span>
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

      {/* FULL WIDTH: Timeline Stacked Bar Chart */}
      <div className="row mt-2">
          <div className="col-12">
              <div className="rp-card border-secondary rounded-4 p-4 shadow-sm" style={{ height: '560px' }}>
                  <h6 className="fw-bold text-uppercase ls-1 mb-4 text-center text-muted"><i className="bi bi-bar-chart-line-fill text-primary me-2"></i>Net Worth Composition Over Time</h6>
                  
                  {maxTotalNW > 1 ? (
                      <div className="d-flex flex-column h-100 w-100" style={{ paddingBottom: '75px' }}>
                          
                          {/* Legend Grid */}
                          <div className="d-flex flex-wrap justify-content-center gap-3 mb-4 pb-3 border-bottom border-secondary flex-shrink-0">
                              {[...categories].reverse().map(c => (
                                  <div className="d-flex align-items-center" key={c.key}>
                                      <span className="rounded-circle me-2 shadow-sm border border-secondary border-opacity-25" style={{width: '12px', height: '12px', backgroundColor: c.color, display: 'inline-block'}}></span>
                                      <span className="small text-muted fw-bold ls-1" style={{fontSize: '0.75rem'}}>{c.label}</span>
                                  </div>
                              ))}
                          </div>

                          {/* Chart Area with Left Y-Axis */}
                          <div className="d-flex w-100 flex-grow-1 h-100">
                              
                              {/* Y-Axis */}
                              <div className="d-flex flex-column justify-content-between align-items-end pe-2 h-100 border-end border-secondary border-opacity-50" style={{ width: '55px', flexShrink: 0 }}>
                                  {yAxisTicks.map((tick, i) => (
                                      <span key={i} className="text-muted fw-bold lh-1" style={{ fontSize: '0.65rem', position: 'relative', top: i===0 ? '0' : (i===4 ? '0' : '-6px') }}>
                                          {formatYAxis(tick)}
                                      </span>
                                  ))}
                              </div>

                              {/* CSS Stacked Bar Chart */}
                              <div className="w-100 flex-grow-1 d-flex align-items-end ps-2" style={{ gap: '2px' }}>
                                  {chartData.map((d: any, i: number) => {
                                      const showLabel = i === 0 || i === chartData.length - 1 || d.year % 5 === 0;
                                      
                                      return (
                                          <div key={d.year} className="d-flex flex-column justify-content-end align-items-center h-100 flex-grow-1 position-relative group" title={`Year: ${d.year} (Age ${d.age})\nTotal Net Worth: ${formatExact(d.total)}`}>
                                              
                                              {/* The Bar - Stacked from Bottom Up */}
                                              <div className="d-flex flex-column-reverse w-100 rounded-top overflow-hidden shadow-sm transition-all hover-opacity-75 bg-black bg-opacity-25 mt-auto" style={{ height: `${(d.total / maxTotalNW) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}>
                                                  {[...categories].map(c => {
                                                      const val = d[c.key as keyof typeof d] as number;
                                                      if (val <= 0) return null;
                                                      return (
                                                          <div 
                                                              key={c.key} 
                                                              style={{ height: `${(val / d.total) * 100}%`, backgroundColor: c.color }} 
                                                              className="w-100 border-top border-black border-opacity-25 flex-shrink-0" 
                                                              title={`${c.label}: ${formatExact(val)}`}
                                                          ></div>
                                                      );
                                                  })}
                                              </div>
                                              
                                              {/* X-Axis Label - Rotated Vertically and positioned absolutely to prevent stretching */}
                                              <div className="position-absolute text-muted fw-bold" style={{ 
                                                  fontSize: '0.65rem', 
                                                  top: '100%', 
                                                  left: '50%', 
                                                  transform: 'translateX(-50%) rotate(-90deg)', 
                                                  transformOrigin: 'center center',
                                                  marginTop: '25px', 
                                                  visibility: showLabel ? 'visible' : 'hidden', 
                                                  pointerEvents: 'none',
                                                  whiteSpace: 'nowrap'
                                              }}>
                                                  {d.year}
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>

                      </div>
                  ) : (
                      <div className="text-center text-muted fst-italic py-5 my-auto">No assets tracked.</div>
                  )}
              </div>
          </div>
      </div>

    </div>
  );
}