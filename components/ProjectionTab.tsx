'use client';

import React, { useState, useRef } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn } from './SharedUI';
import { calculateTaxDetailed, getInflatedTaxData, getRrifFactor } from '../lib/taxEngine';
import { toPng } from 'html-to-image';

export default function ProjectionTab() {
  const { data, results, useRealDollars } = useFinance();
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const tableRef = useRef<HTMLDivElement>(null);

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="text-center p-5 text-muted">
        <i className="bi bi-clock-history fs-1 mb-3 opacity-50 d-block"></i>
        <h5>No Projection Data Available</h5>
        <p className="small">Please configure your plan parameters and check back.</p>
      </div>
    );
  }

  const p1Name = data.inputs.p1_name || 'Player 1';
  const p2Name = data.inputs.p2_name || 'Player 2';
  const isCouple = data.mode === 'Couple';
  const inflationRate = (data.inputs.inflation_rate || 2.1) / 100;
  const startYear = results.timeline[0]?.year || new Date().getFullYear();

  const getRealValue = (val: number, year: number) => {
    if (!useRealDollars) return val;
    const yearsOut = Math.max(0, year - startYear);
    return val / Math.pow(1 + inflationRate, yearsOut);
  };

  const formatCurrency = (val: number, year: number) => {
    const adjusted = getRealValue(val, year);
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(adjusted);
  };

  const formatStr = (val: number, year: number) => {
      const adjusted = getRealValue(val, year);
      return Math.round(adjusted).toLocaleString();
  };

  const getPhaseBadge = (y: any) => {
    const p1Age = y.p1Age || y.ageP1;
    const p1Ret = data.inputs.p1_retireAge || 60;
    
    if (p1Age < p1Ret) {
      return <span className="badge bg-primary bg-opacity-25 text-primary border border-primary fw-medium px-2 py-1">Accumulation</span>;
    }
    
    const gogoAge = data.inputs.exp_gogo_age || 75;
    const slowgoAge = data.inputs.exp_slow_age || 85;
    
    if (p1Age <= gogoAge) {
      return <span className="badge bg-success bg-opacity-25 text-success border border-success fw-medium px-2 py-1">Go-Go</span>;
    }
    if (p1Age <= slowgoAge) {
      return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning fw-medium px-2 py-1">Slow-Go</span>;
    }
    return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger fw-medium px-2 py-1">No-Go</span>;
  };

  const handleExportCSV = () => {
      if (!results || !results.timeline) return;

      const headers = [
          "Year", `${p1Name} Age`, isCouple ? `${p2Name} Age` : "P2 Age", "Phase", "Net Income", "Taxes Paid (Excl. OAS Clawback)",
          "Living Expenses", "Debt/Mortgage Payments", "Education Expenses", "Lifestyle Outflow", "Portfolio Savings", 
          "Portfolio Withdrawals", "Liquid Net Worth", "Real Estate Equity", "Estate After Tax"
      ];

      const rows = results.timeline.map((y: any) => {
          const p1Age = y.p1Age || y.ageP1;
          const p1Ret = data.inputs.p1_retireAge || 60;
          let phase = "Accumulation";
          if (p1Age >= p1Ret) {
              const gogoAge = data.inputs.exp_gogo_age || 75;
              const slowgoAge = data.inputs.exp_slow_age || 85;
              if (p1Age <= gogoAge) phase = "Go-Go";
              else if (p1Age <= slowgoAge) phase = "Slow-Go";
              else phase = "No-Go";
          }

          let engineContributions = 0;
          if (y.flows && y.flows.contributions) {
              engineContributions += Object.entries(y.flows.contributions.p1 || {}).filter(([k]) => k !== 'spending_cash').reduce((a: any, [, b]: any) => a + b, 0) as number;
              if (isCouple) engineContributions += Object.entries(y.flows.contributions.p2 || {}).filter(([k]) => k !== 'spending_cash').reduce((a: any, [, b]: any) => a + b, 0) as number;
          }

          const totalWithdrawals = y.flows && y.flows.withdrawals ? Object.values(y.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) : 0;

          const lifestyleSpendingCash = y.flows?.contributions?.shared?.spending_cash || 0;

          return [
              y.year,
              y.p1Age || y.ageP1 || '',
              isCouple ? (y.p2Age || y.ageP2 || '') : 'N/A',
              phase,
              Math.round(getRealValue((y.grossInflow || 0) - ((y.taxDetailsP1?.oas_clawback || 0) + (y.taxDetailsP2?.oas_clawback || 0)), y.year)),
              Math.round(getRealValue((y.taxP1 || 0) + (y.taxP2 || 0) - ((y.taxDetailsP1?.oas_clawback || 0) + (y.taxDetailsP2?.oas_clawback || 0)), y.year)),
              Math.round(getRealValue(y.expenses || 0, y.year)),
              Math.round(getRealValue((y.mortgagePay || 0) + Math.max(0, (y.debtRepayment || 0) - Math.max(0, (y.eduExpense || 0) - ((y.flows?.withdrawals?.['P1 RESP'] || 0) + (y.flows?.withdrawals?.['P2 RESP'] || 0)))), y.year)),
              Math.round(getRealValue(y.eduExpense || 0, y.year)),
              Math.round(getRealValue(lifestyleSpendingCash, y.year)),
              Math.round(getRealValue(engineContributions, y.year)),
              Math.round(getRealValue(totalWithdrawals as number, y.year)),
              Math.round(getRealValue(y.liquidNW || 0, y.year)),
              Math.round(getRealValue((y.reIncludedEq || 0) + (y.reNonIncludedEq || 0), y.year)),
              Math.round(getRealValue((y.afterTaxEstate !== undefined ? y.afterTaxEstate : (y.liquidNW + (y.reIncludedEq || 0))), y.year))
          ].join(",");
      });

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `Retirement_Projection_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleExportPNG = async () => {
      if (!tableRef.current) return;
      setIsExporting(true);
      
      const scrollContainer = tableRef.current.querySelector('.table-responsive') as HTMLElement;
      let originalMaxHeight = '';
      let originalOverflow = '';
      
      if (scrollContainer) {
          originalMaxHeight = scrollContainer.style.maxHeight;
          originalOverflow = scrollContainer.style.overflow;
          scrollContainer.style.maxHeight = 'none';
          scrollContainer.style.overflow = 'visible';
      }

      try {
          const dataUrl = await toPng(tableRef.current, {
              backgroundColor: '#16181d',
              pixelRatio: 2,
              style: {
                  margin: '0',
                  borderRadius: '0'
              }
          });
          
          const link = document.createElement('a');
          link.download = `Retirement_Projection_${new Date().toISOString().split('T')[0]}.png`;
          link.href = dataUrl;
          link.click();
      } catch (err) {
          console.error("Export PNG Failed:", err);
          alert("Failed to export table as PNG. Try standard browser print.");
      } finally {
          if (scrollContainer) {
              scrollContainer.style.maxHeight = originalMaxHeight;
              scrollContainer.style.overflow = originalOverflow;
          }
          setIsExporting(false);
      }
  };

  let totalGrossInflow = 0;
  let totalTaxPaid = 0;
  let totalExpensesSum = 0;
  let totalSaved = 0;
  let totalWithdrawn = 0;
  let retYears = 0;
  let hasShortfall = false;

  results.timeline.forEach((y: any) => {
      const wdsRaw = y.flows && y.flows.withdrawals ? Object.values(y.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) as number : 0;
      const yrInflowRaw = (y.incomeP1||0) + (y.incomeP2||0) + (y.cppP1||0) + (y.cppP2||0) + (y.oasP1||0) + (y.oasP2||0) + (y.dbP1||0) + (y.dbP2||0) + (y.windfall||0) + (y.invIncP1||0) + (y.invIncP2||0) + (y.rrspRefundP1||0) + (y.rrspRefundP2||0);
      
      totalGrossInflow += getRealValue(yrInflowRaw + wdsRaw, y.year);
      totalTaxPaid += getRealValue((y.taxP1||0) + (y.taxP2||0), y.year);
      totalExpensesSum += getRealValue((y.expenses||0) + (y.mortgagePay||0) + (y.debtRepayment||0), y.year);
      totalWithdrawn += getRealValue(wdsRaw, y.year);

      let contsRaw = 0;
      if (y.flows && y.flows.contributions) {
          contsRaw += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          if (isCouple) contsRaw += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          if (y.flows.contributions.shared) contsRaw += Object.values(y.flows.contributions.shared).reduce((a: any, b: any) => a + b, 0) as number;
      }

      const respWd = (y.flows?.withdrawals?.['P1 RESP'] || 0) + (y.flows?.withdrawals?.['P2 RESP'] || 0);
      const totalSourced = y.grossInflow || 0;
      const totalSpent = (y.expenses || 0) + (y.mortgagePay || 0) + (y.debtRepayment || 0) + respWd + (y.taxP1 || 0) + (y.taxP2 || 0) + contsRaw;
      
      if (totalSourced < totalSpent - 1) {
          hasShortfall = true;
      }

      if (y.p1Age >= (data.inputs.p1_retireAge || 65)) {
          retYears++;
      }
  });

  const toggleRow = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  const getEventIcons = (rawEvents: string[] | undefined, y?: any, index?: number, timeline?: any[]) => {
      const eventList: string[] = [...(rawEvents || [])];

      if (y) {
          const p1Age = y.p1Age || y.ageP1;
          const p2Age = y.p2Age || y.ageP2;
          const prevY = (index !== undefined && index > 0 && timeline) ? timeline[index - 1] : null;

          // 1. Retirement start
          const p1Ret = Number(data.inputs.p1_retireAge) || 65;
          if (p1Age === p1Ret && !eventList.some(e => e.includes('P1') && e.includes('Retire'))) {
              eventList.push('P1 Retires');
          }
          if (isCouple && p2Age === (Number(data.inputs.p2_retireAge) || 65) && !eventList.some(e => e.includes('P2') && e.includes('Retire'))) {
              eventList.push('P2 Retires');
          }

          // 2. CPP start
          const p1CppStart = Number(data.inputs.p1_cpp_start) || 65;
          if (data.inputs.p1_cpp_enabled && p1Age === p1CppStart && !eventList.some(e => e.includes('P1') && e.includes('CPP'))) {
              eventList.push('P1 Starts CPP');
          }
          if (isCouple && data.inputs.p2_cpp_enabled && p2Age === (Number(data.inputs.p2_cpp_start) || 65) && !eventList.some(e => e.includes('P2') && e.includes('CPP'))) {
              eventList.push('P2 Starts CPP');
          }

          // 3. OAS start
          const p1OasStart = Number(data.inputs.p1_oas_start) || 65;
          if (data.inputs.p1_oas_enabled && p1Age === p1OasStart && !eventList.some(e => e.includes('P1') && e.includes('OAS'))) {
              eventList.push('P1 Starts OAS');
          }
          if (isCouple && data.inputs.p2_oas_enabled && p2Age === (Number(data.inputs.p2_oas_start) || 65) && !eventList.some(e => e.includes('P2') && e.includes('OAS'))) {
              eventList.push('P2 Starts OAS');
          }

          // 4. RRIF mandatory conversion (age 71 year-end / age 72 mandatory minimum)
          const rrifAge = 72;
          if (p1Age === rrifAge && !eventList.some(e => e.includes('P1') && e.includes('RRIF'))) {
              eventList.push('P1 RRIF Conversion');
          }
          if (isCouple && p2Age === rrifAge && !eventList.some(e => e.includes('P2') && e.includes('RRIF'))) {
              eventList.push('P2 RRIF Conversion');
          }

          // 5. Mortgage paid off
          if (prevY && (prevY.mortgage || 0) > 0 && (y.mortgage || 0) === 0 && !eventList.some(e => e.includes('Mortgage Paid'))) {
              eventList.push('Mortgage Paid');
          }
      }

      if (eventList.length === 0) return null;

      return (
          <div className="d-inline-flex align-items-center gap-1 ms-2 flex-wrap">
              {eventList.map((ev, i) => {
                  let colorClass = "text-secondary";
                  let icon = "bi-info-circle-fill";

                  if (ev.includes('Retire')) {
                      colorClass = "text-primary";
                      icon = "bi-cup-hot-fill";
                  } else if (ev.includes('CPP')) {
                      colorClass = "text-success";
                      icon = "bi-shield-fill-check";
                  } else if (ev.includes('OAS')) {
                      colorClass = "text-warning";
                      icon = "bi-sun-fill";
                  } else if (ev.includes('RRIF') || ev.includes('LIF Unlocked')) {
                      colorClass = "text-info";
                      icon = "bi-arrow-repeat";
                  } else if (ev.includes('Mortgage Paid')) {
                      colorClass = "text-success";
                      icon = "bi-house-check-fill";
                  } else if (ev.includes('Windfall')) {
                      colorClass = "text-success";
                      icon = "bi-cash-coin";
                  } else if (ev.includes('Purchased') || ev.includes('Property')) {
                      colorClass = "text-info";
                      icon = "bi-house-add-fill";
                  } else if (ev.includes('Sold') || ev.includes('Downsize')) {
                      colorClass = "text-danger";
                      icon = "bi-house-down-fill";
                  } else if (ev.includes('Kept Previous')) {
                      colorClass = "text-primary";
                      icon = "bi-houses-fill";
                  } else if (ev.includes('Dies')) {
                      colorClass = "text-danger";
                      icon = "bi-heartbreak-fill";
                  } else if (ev.includes('Leave')) {
                      colorClass = "text-info";
                      icon = "bi-person-hearts";
                  } else if (ev.includes('Guardrail')) {
                      colorClass = "text-warning";
                      icon = "bi-shield-exclamation";
                  } else if (ev.includes('RRSP')) {
                      colorClass = "text-secondary";
                      icon = "bi-arrow-left-right";
                  }

                  const dynamicText = ev
                      .replace(/\bP1\b/g, p1Name)
                      .replace(/\bP2\b/g, p2Name);

                  return (
                      <i 
                          key={i} 
                          className={`bi ${icon} ${colorClass}`} 
                          title={dynamicText} 
                          style={{ cursor: 'help', fontSize: '0.95rem' }}
                      />
                  );
              })}
          </div>
      );
  };

  const renderAges = (y: any) => {
      let ages = [];
      ages.push(<span key="p1" className="text-info fw-bold">{y.p1Age || y.ageP1}</span>);
      if (isCouple && (y.p2Age !== null || y.ageP2 !== null)) {
          ages.push(<span key="sep" className="ms-1 me-1 text-secondary">/</span>);
          ages.push(<span key="p2" className="fw-bold" style={{color: 'var(--bs-purple)'}}>{y.p2Age || y.ageP2}</span>);
      }
      if (data.dependents && data.dependents.length > 0) {
          const childAges = data.dependents.map((dep: any) => {
              const byear = parseInt(dep.dob.split('-')[0]);
              return Math.max(0, y.year - byear);
          });
          ages.push(<span key="kids" className="d-block text-muted fw-medium mt-1" style={{fontSize: '0.7rem'}}>Kids: {childAges.join(', ')}</span>);
      }
      return <div className="d-flex flex-column align-items-center justify-content-center"><div>{ages}</div></div>;
  };

  const sumAccounts = (assets: any) => {
    if (!assets) return 0;
    return (assets.tfsa || 0) + (assets.tfsa_successor || 0) + (assets.fhsa || 0) + (assets.rrsp || 0) + (assets.rrif_acct || 0) + (assets.lirf || 0) + (assets.lif || 0) + (assets.nonreg || 0) + (assets.cash || 0) + (assets.crypto || 0);
  };

  const getAccountFlow = (y: any, player: 'p1'|'p2', contribKeys: string[], wdMatchKeys: string[], year: number) => {
      let deposited = 0;
      let withdrawn = 0;
      const prefix = player.toUpperCase() + ' ';
      
      if (y.flows && y.flows.contributions && y.flows.contributions[player]) {
          contribKeys.forEach(k => deposited += (y.flows.contributions[player][k] || 0));
      }
      if (y.flows && y.flows.withdrawals) {
          const wdKeys = Object.keys(y.flows.withdrawals).filter(k => k.startsWith(prefix) && wdMatchKeys.some(m => k.includes(m)));
          wdKeys.forEach(k => withdrawn += (y.flows.withdrawals[k] || 0));
          if (wdMatchKeys.includes('RESP') && y.flows.withdrawals[`${prefix}RESP`]) {
              withdrawn += y.flows.withdrawals[`${prefix}RESP`];
          }
      }
      const net = deposited - withdrawn;
      if (Math.abs(net) < 1) return null;
      const isPos = net > 0;
      const absNet = Math.abs(getRealValue(net, year));
      const formatted = absNet >= 1000 ? `${(absNet/1000).toFixed(1).replace('.0', '')}k` : Math.round(absNet);
      
      return (
          <span className={`fw-bold ${isPos ? 'text-success' : 'text-danger'} text-end me-2 text-nowrap flex-shrink-0`} style={{fontSize: '0.65rem', minWidth: '45px', display: 'inline-block'}}>
              {isPos ? `+${formatted}` : `-${formatted}`}
          </span>
      );
  };

  const buildTaxTooltip = (y: any, player: 'p1'|'p2', taxData: any, taxableIncome: number, actualGross: number, year: number) => {
      if (!taxData) return "No tax details available.";
      
      const isP1 = player === 'p1';
      const prefix = isP1 ? 'P1 ' : 'P2 ';
      const salary = isP1 ? (y.incomeP1 - (y.rrspMatchP1 || 0)) : (y.incomeP2 - (y.rrspMatchP2 || 0));
      const match = isP1 ? y.rrspMatchP1 : y.rrspMatchP2;
      const cpp = isP1 ? y.cppP1 : y.cppP2;
      const oas = isP1 ? y.oasP1 : y.oasP2;
      const db = isP1 ? y.dbP1 : y.dbP2;
      const invInc = isP1 ? y.invIncP1 : y.invIncP2;
      
      let breakdownStr = '';
      let sum = 0;
      if (salary > 0) { breakdownStr += `<div class="d-flex justify-content-between"><span>Salary:</span> <span>$${formatStr(salary, year)}</span></div>`; sum += salary; }
      if (match > 0) { breakdownStr += `<div class="d-flex justify-content-between"><span>Employer Match:</span> <span>$${formatStr(match, year)}</span></div>`; sum += match; }
      if (cpp > 0) { breakdownStr += `<div class="d-flex justify-content-between"><span>CPP:</span> <span>$${formatStr(cpp, year)}</span></div>`; sum += cpp; }
      if (oas > 0) { breakdownStr += `<div class="d-flex justify-content-between"><span>OAS:</span> <span>$${formatStr(oas, year)}</span></div>`; sum += oas; }
      if (db > 0) { breakdownStr += `<div class="d-flex justify-content-between"><span>Pension:</span> <span>$${formatStr(db, year)}</span></div>`; sum += db; }
      if (invInc > 0) { breakdownStr += `<div class="d-flex justify-content-between"><span>Inv. Yield:</span> <span>$${formatStr(invInc, year)}</span></div>`; sum += invInc; }
      
      const wdKeys = Object.keys(y.flows?.withdrawals || {}).filter(k => k.startsWith(prefix) && y.flows.withdrawals[k] > 0);
      wdKeys.forEach(k => {
          const amt = y.flows.withdrawals[k];
          const cleanName = k.replace(prefix, '');
          if (cleanName.includes('RRSP') || cleanName.includes('RRIF') || cleanName.includes('LIF')) {
              breakdownStr += `<div class="d-flex justify-content-between"><span>${cleanName} W/D:</span> <span>$${formatStr(amt, year)}</span></div>`;
              sum += amt;
          } else if (cleanName.match(/Non-?Reg/i) || cleanName.match(/Crypto/i) || cleanName.match(/NONREG/i)) {
              const breakdown = y.wdBreakdown || y.withdrawalBreakdown;
              const targetKey = cleanName.match(/Crypto/i) ? 'Crypto' : 'Non-Reg';
              const mathObj = breakdown?.[player]?.[`${targetKey}_math`] || breakdown?.[player]?.[`NONREG_math`];
              if (mathObj && mathObj.tax > 0) {
                  breakdownStr += `<div class="d-flex justify-content-between"><span>${cleanName} Taxable:</span> <span>$${formatStr(mathObj.tax, year)}</span></div>`;
                  sum += mathObj.tax;
              }
          }
      });

      let incStr = `<b>Gross Income:</b> $${formatStr(actualGross, year)}<br>`;
      if (breakdownStr) {
           incStr += `<div class="text-muted border-start border-2 border-secondary ms-1 ps-2 my-2" style="font-size: 0.75rem; line-height: 1.4;">${breakdownStr}</div>`;
      }
      
      const rrspCont = isP1 ? y.flows?.contributions?.p1?.rrsp || 0 : y.flows?.contributions?.p2?.rrsp || 0;
      const fhsaCont = isP1 ? y.flows?.contributions?.p1?.fhsa || 0 : y.flows?.contributions?.p2?.fhsa || 0;
      const empMatch = isP1 ? y.rrspMatchP1 || 0 : y.rrspMatchP2 || 0;
      const totalDeductions = rrspCont + fhsaCont;
      
      if (totalDeductions > 0) {
          incStr += `<b>Total Deductions:</b> -$${formatStr(totalDeductions, year)}<br>`;
          let dedStr = '';
          if (rrspCont > 0) {
              if (empMatch > 0) {
                  const ownCont = Math.max(0, rrspCont - empMatch);
                  dedStr += `<div class="d-flex justify-content-between"><span>RRSP (Employer Match):</span> <span>-$${formatStr(empMatch, year)}</span></div>`;
                  if (ownCont > 0) {
                      dedStr += `<div class="d-flex justify-content-between"><span>RRSP (Own Contrib):</span> <span>-$${formatStr(ownCont, year)}</span></div>`;
                  }
              } else {
                  dedStr += `<div class="d-flex justify-content-between"><span>RRSP Contributions:</span> <span>-$${formatStr(rrspCont, year)}</span></div>`;
              }
          }
          if (fhsaCont > 0) {
              dedStr += `<div class="d-flex justify-content-between"><span>FHSA Contributions:</span> <span>-$${formatStr(fhsaCont, year)}</span></div>`;
          }
          incStr += `<div class="text-muted border-start border-2 border-secondary ms-1 ps-2 my-2" style="font-size: 0.75rem; line-height: 1.4;">${dedStr}</div>`;
      }
      
      const splitAmt = isP1 ? (y.pensionSplit?.p2ToP1 || 0) - (y.pensionSplit?.p1ToP2 || 0) : (y.pensionSplit?.p1ToP2 || 0) - (y.pensionSplit?.p2ToP1 || 0);
      if (Math.abs(splitAmt) > 0) {
          incStr += `<b>Pension Split:</b> ${splitAmt > 0 ? '+' : '-'}$${formatStr(Math.abs(splitAmt), year)}<br>`;
      }
      const taxIncAfter = taxableIncome;
      incStr += `<b>Net Taxable Income:</b> $${formatStr(taxIncAfter, year)}<hr class="my-1 border-secondary">`;

      let clawbackStr = taxData.oas_clawback > 0 ? `<br><b>OAS Clawback:</b> $${formatStr(taxData.oas_clawback, year)}` : '';
      
      const baseFedTax = (taxData.fed || 0) + (taxData.fedCredits || 0);
      const baseProvTax = (taxData.prov || 0) + (taxData.provCredits || 0);
      const preCreditTaxTotal = baseFedTax + baseProvTax + (taxData.cpp_ei || 0) + (taxData.oas_clawback || 0);

      const nrtcObj = taxData.nrtcDetails || {};
      let reductionsList: string[] = [];
      let totalCurrentReductions = (taxData.fedCredits || 0) + (taxData.provCredits || 0);
      
      let mathStr = `${incStr}<b>Federal Tax:</b> $${formatStr(baseFedTax, year)}<br><b>Provincial Tax:</b> $${formatStr(baseProvTax, year)}<br><b>CPP/EI Premiums:</b> $${formatStr(taxData.cpp_ei, year)}${clawbackStr}<hr class="my-1 border-secondary"><b>Gross Tax Generated:</b> $${formatStr(preCreditTaxTotal, year)}<br>`;
      
      if (totalCurrentReductions > 0) {
          mathStr += `<b>Tax Reductions Applied:</b> <span class="text-success">-$${formatStr(totalCurrentReductions, year)}</span><hr class="my-1 border-secondary">`;
      }
      
      mathStr += `<b>Net Tax Paid:</b> <span class="text-danger">$${formatStr(taxData.totalTax, year)}</span><br><b>Marginal Rate:</b> ${(taxData.margRate * 100).toFixed(1)}%`;
      return mathStr;
  };

  const buildContributionTooltip = (flows: any, couple: boolean, year: number) => {
      if (!flows || !flows.contributions) return "No savings breakdown available.";
      let text = "<b>Invested Breakdown:</b><hr class='my-1 border-secondary'>";
      const p1Conts = flows.contributions.p1 || {};
      Object.entries(p1Conts).forEach(([k, v]) => {
          if ((v as number) > 0 && k !== 'spending_cash') text += `<div class="d-flex justify-content-between"><span>${p1Name} ${k.toUpperCase()}:</span><span>$${formatStr(v as number, year)}</span></div>`;
      });
      if (couple) {
          const p2Conts = flows.contributions.p2 || {};
          Object.entries(p2Conts).forEach(([k, v]) => {
              if ((v as number) > 0 && k !== 'spending_cash') text += `<div class="d-flex justify-content-between"><span>${p2Name} ${k.toUpperCase()}:</span><span>$${formatStr(v as number, year)}</span></div>`;
          });
      }
      return text;
  };

  const buildYieldTooltip = (math: any, year: number, isReal: boolean) => {
      if (!math || !math.bal) return "Yield calculated from portfolio holdings.";
      const rateStr = `${(math.rate * 100).toFixed(1)}%`;
      if (isReal) {
          return `Nominal Math: $${Math.round(math.bal).toLocaleString()} × ${rateStr} = $${Math.round(math.amt).toLocaleString()}<br><b>Portfolio Balance (Today's $):</b> $${formatStr(math.bal, year)}<br><b>Yield Payout (Today's $):</b> $${formatStr(math.amt, year)}`;
      }
      return `Holdings Balance: $${formatStr(math.bal, year)}<br>Yield Rate: ${rateStr}<br><b>Annual Yield:</b> $${formatStr(math.amt, year)}`;
  };

  const buildOasTooltip = (oasGross: number, oasClawback: number, taxInc: number, year: number, thresh: number) => {
      if (oasClawback > 0) {
          const diff = Math.max(0, taxInc - thresh);
          return `<b>Gross OAS:</b> $${formatStr(oasGross, year)}<br><b>CRA Threshold:</b> $${formatStr(thresh, year)}<br><b>Income Excess:</b> $${formatStr(diff, year)}<br><b>Clawback (15%):</b> <span class="text-danger">-$${formatStr(oasClawback, year)}</span><hr class="my-1 border-secondary"><b>Net OAS Received:</b> <span class="text-success">$${formatStr(oasGross - oasClawback, year)}</span>`;
      }
      return `<span class='text-info fw-bold'>100% Taxable.</span><br>Base OAS: $${formatStr(oasGross, year)}<br>Income is below the recovery threshold ($${formatStr(thresh, year)}).<br><b>Net Received:</b> $${formatStr(oasGross, year)}`;
  };

  const renderPlayerInflows = (player: 'p1'|'p2', y: any, year: number, index: number, timeline: any[]) => {
      const isP1 = player === 'p1';
      const nameRef = isP1 ? p1Name : p2Name;
      const prefix = isP1 ? 'P1 ' : 'P2 ';
      const age = isP1 ? (y.p1Age || y.ageP1) : (y.p2Age || y.ageP2);
      
      const salary = isP1 ? y.incomeP1 - (y.rrspMatchP1 || 0) : y.incomeP2 - (y.rrspMatchP2 || 0);
      const match = isP1 ? y.rrspMatchP1 : y.rrspMatchP2;
      const cpp = isP1 ? y.cppP1 : y.cppP2;
      const oas = isP1 ? y.oasP1 : y.oasP2;
      const db = isP1 ? y.dbP1 : y.dbP2;
      const ccb = isP1 ? (y.ccbP1 || 0) : 0;
      const invInc = isP1 ? y.invIncP1 : y.invIncP2;
      const taxInc = isP1 ? y.taxIncP1 : y.taxIncP2;
      const invYieldMath = isP1 ? y.invYieldMathP1 : y.invYieldMathP2;
      const cppStart = isP1 ? data.inputs.p1_cpp_start : data.inputs.p2_cpp_start;
      const refund = isP1 ? y.rrspRefundP1 : y.rrspRefundP2;

      const wdKeys = Object.keys(y.flows?.withdrawals || {}).filter(k => k.startsWith(prefix) && y.flows.withdrawals[k] > 0);
      const taxableWds = wdKeys.filter(k => !k.includes('TFSA') && !k.includes('FHSA') && !k.includes('Cash') && !k.includes('RESP'));
      const nonTaxWds = wdKeys.filter(k => k.includes('TFSA') || k.includes('FHSA') || k.includes('Cash') || k.includes('RESP'));

      const taxDetails = isP1 ? y.taxDetailsP1 : y.taxDetailsP2;
      const oasClawback = taxDetails?.oas_clawback || 0;
      const netOas = Math.max(0, oas - oasClawback);

      let priorRrifBal = 0;
      const prevYear = index > 0 ? timeline[index - 1] : null;
      const assetKey = isP1 ? 'assetsP1' : 'assetsP2';
      if (prevYear) {
          priorRrifBal = (prevYear[assetKey]?.rrif_acct || 0) + (prevYear[assetKey]?.rrsp || 0);
      } else {
          priorRrifBal = (Number(data.inputs[`${player}_rrif_acct`]) || 0) + (Number(data.inputs[`${player}_rrsp`]) || 0);
      }

      return (
          <div className="mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              <div className="fw-bold text-uppercase ls-1 mb-2" style={{fontSize: '0.75rem', color: isP1 ? 'var(--bs-info)' : 'var(--bs-purple)'}}>{nameRef} Inflows</div>
              
              {salary > 0 && (
                  <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Base Salary <InfoBtn title="Base Salary" text="<span class='text-info fw-bold'>100% Taxable.</span><br>Base employment/other income." align="left" /></span>
                      <span className="fw-medium text-nowrap">{formatCurrency(salary, year)}</span>
                  </div>
              )}
              {match > 0 && (
                  <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Employer Match <InfoBtn title="Employer Match" text="<span class='text-info fw-bold'>Taxable Benefit.</span><br>Offset by RRSP deduction." align="left" /></span>
                      <span className="text-success text-nowrap">+{formatCurrency(match, year)}</span>
                  </div>
              )}
              {cpp > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">CPP <InfoBtn title="CPP Benefit" text={`<span class='text-info fw-bold'>100% Taxable.</span><br>Base CPP adjusted for start age (${cppStart}).`} align="left" /></span>
                      <span className="text-nowrap">{formatCurrency(cpp, year)}</span>
                  </div>
              )}
              {oas > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">OAS <InfoBtn title="OAS Math" text={buildOasTooltip(oas, oasClawback, taxInc, year, y.oasThreshold)} align="left" /></span>
                      <span className="text-nowrap">{formatCurrency(netOas, year)}</span>
                  </div>
              )}
              {db > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Pension (DB) <InfoBtn title="Pension" text="<span class='text-info fw-bold'>100% Taxable.</span><br>Defined Benefit Pension payout." align="left" /></span>
                      <span className="text-nowrap">{formatCurrency(db, year)}</span>
                  </div>
              )}
              {ccb > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">CCB <InfoBtn title="Canada Child Benefit" text="<span class='text-info fw-bold'>0% Taxable.</span><br>Tax-free monthly payment for eligible children." align="left" /></span>
                      <span className="text-success text-nowrap">+{formatCurrency(ccb, year)}</span>
                  </div>
              )}
              {invInc > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="d-flex align-items-center text-muted ms-2">Non-Reg Yield <InfoBtn title="Yield Calc" text={`<span class='text-info fw-bold'>Partially Taxable.</span><br>Taxed as interest, dividends, or capital gains.<hr class="my-1 border-secondary">${buildYieldTooltip(invYieldMath, year, useRealDollars)}`} align="left" /></span>
                      <span className="text-success text-nowrap">+{formatCurrency(invInc, year)}</span>
                  </div>
              )}

              {taxableWds.map(k => {
                  const val = y.flows.withdrawals[k];
                  const cleanName = k.replace(prefix, '');
                  let info = "";
                  
                  if (k.includes('RRIF')) {
                      const factor = getRrifFactor(age - 1);
                      const minAmount = priorRrifBal * factor;
                      if (useRealDollars) {
                          info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor*100).toFixed(2)}%).<hr class="my-1 border-secondary"><span class='text-muted small'>Nominal Math: $${Math.round(priorRrifBal).toLocaleString()} × ${(factor * 100).toFixed(2)}% = $${Math.round(minAmount).toLocaleString()}</span><br><b>Balance (Today's $):</b> $${formatStr(priorRrifBal, year)}<br><b>Withdrawal (Today's $):</b> $${formatStr(minAmount, year)}`;
                      } else {
                          info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor*100).toFixed(2)}%).<hr class="my-1 border-secondary"><i>Math: $${formatStr(priorRrifBal, year)} × ${(factor * 100).toFixed(2)}% = $${formatStr(minAmount, year)}</i>`;
                      }
                  }
                  else if (k.includes('LIF')) {
                      info = `<span class='text-info fw-bold'>100% Taxable.</span><br>LIF withdrawal bound by provincial limits.`;
                  }
                  else if (k.includes('RRSP')) {
                      info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Added directly to taxable income.`;
                  }
                  else if (k.match(/Non-?Reg/i) || k.match(/Crypto/i) || k.match(/NONREG/i)) {
                      const breakdown = y.wdBreakdown || y.withdrawalBreakdown;
                      const targetKey = k.match(/Crypto/i) ? 'Crypto' : 'Non-Reg';
                      const mathObj = breakdown?.[player]?.[`${targetKey}_math`] || breakdown?.[player]?.[`NONREG_math`];
                      
                      if (mathObj) {
                          if (useRealDollars) {
                              info = `<span class='text-info fw-bold'>Partially Taxable.</span><br><span class='text-muted small'>Nominal Math:</span><br><div class="d-flex justify-content-between text-muted small"><span>Gross W/D:</span><span>$${Math.round(mathObj.wd).toLocaleString()}</span></div><div class="d-flex justify-content-between text-muted small"><span>ACB Disposed:</span><span>-$${Math.round(mathObj.acb).toLocaleString()}</span></div><hr class="my-1 border-secondary"><div class="d-flex justify-content-between text-muted small"><span>Nominal Gain:</span><span>$${Math.round(mathObj.gain).toLocaleString()}</span></div><div class="d-flex justify-content-between text-muted small mb-1"><span>Nominal Taxable (50%):</span><span>$${Math.round(mathObj.tax).toLocaleString()}</span></div><hr class="my-1 border-secondary"><b>Taxable in Today's $:</b> <span class="text-danger">+$${formatStr(mathObj.tax, year)}</span>`;
                          } else {
                              info = `<span class='text-info fw-bold'>Partially Taxable.</span><br>Gross Withdrawal: $${formatStr(mathObj.wd, year)}<br>ACB Withdrawn: -$${formatStr(mathObj.acb, year)}<hr class="my-1 border-secondary"><b>Capital Gain:</b> $${formatStr(mathObj.gain, year)}<br><b>Taxable (50% Inclusion):</b> <span class="text-danger">+$${formatStr(mathObj.tax, year)}</span>`;
                          }
                      } else {
                          info = `<span class='text-info fw-bold'>Partially Taxable.</span><br>Withdrawal includes principal and capital gains. Only 50% of the capital gain is added to taxable income.`;
                      }
                  }

                  return (
                      <div className="d-flex justify-content-between small mb-1 align-items-center" key={k}>
                          <span className="text-muted ms-2 d-flex align-items-center">{cleanName} W/D <InfoBtn align="left" title={`${cleanName} Math`} text={info} /></span>
                          <span className="text-primary text-nowrap">+{formatCurrency(val, year)}</span>
                      </div>
                  );
              })}

              {(nonTaxWds.length > 0 || refund > 0) && (
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-25">
                      <div className="text-muted fw-bold small mb-1 ls-1" style={{fontSize: '0.65rem'}}>NON-TAXABLE INFLOWS</div>
                      
                      {refund > 0 && (
                          <div className="d-flex justify-content-between small mb-1 align-items-center">
                              <span className="text-muted ms-2 d-flex align-items-center">Tax Refund <InfoBtn align="left" title="Tax Refund" text="<span class='text-info fw-bold'>0% Taxable.</span><br>Refund generated from prior year RRSP/FHSA contributions." /></span>
                              <span className="text-success text-nowrap">+{formatCurrency(refund, year)}</span>
                          </div>
                      )}

                      {nonTaxWds.map(k => {
                          const val = y.flows.withdrawals[k];
                          const cleanName = k.replace(prefix, '');
                          let info = `<span class='text-info fw-bold'>0% Taxable.</span><br>Tax-free withdrawal. Does not affect taxable income.`;
                          
                          if (k.includes('RESP')) {
                              info = `<span class='text-info fw-bold'>Effectively Tax-Free.</span><br>Withdrawn to fund post-secondary education. The EAP portion is technically taxable to the student, but usually results in $0 tax due to the student's low income and tuition credits.`;
                          }

                          return (
                              <div className="d-flex justify-content-between small mb-1 align-items-center" key={k}>
                                  <span className="text-muted ms-2 d-flex align-items-center">{cleanName} W/D <InfoBtn align="left" title={`${cleanName} Withdrawal`} text={info} /></span>
                                  <span className="text-primary text-nowrap">+{formatCurrency(val, year)}</span>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="fade-in">
      
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
              <h5 className="text-main fw-bold mb-1">Annual Cash Flow & Net Worth Ledger</h5>
              <div className="text-muted small">
                  Comprehensive year-by-year chronological audit of your gross incomes, statutory taxes, lifestyle expenses, and total asset accumulation.
              </div>
          </div>
          
          <div className="d-flex gap-2">
              <button 
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm"
                  onClick={handleExportCSV}
              >
                  <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i> Export CSV
              </button>
              <button 
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm"
                  onClick={handleExportPNG}
                  disabled={isExporting}
              >
                  <i className="bi bi-image me-2"></i> Export PNG
              </button>
          </div>
      </div>

      <div className="rp-card border border-secondary rounded-4 overflow-hidden shadow-sm" ref={tableRef}>
        <div className="table-responsive hide-scrollbar" style={{ maxHeight: '75vh' }}>
          
          <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', minWidth: '1100px', width: '100%' }}>
            
            <thead className="surface-card" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <th className="py-3 ps-3 text-center text-primary border-bottom border-secondary" style={{ width: '4%' }}></th>
                <th className="py-3 text-muted text-uppercase text-start ps-2 border-bottom border-secondary" style={{ width: '16%' }}>Year & Events</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '12%' }}>Phase</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '12%' }}>Ages ({p1Name}{isCouple ? ` / ${p2Name}` : ''})</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '14%' }}>Gross Income</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary text-danger" style={{ width: '14%' }}>Taxes</th>
                <th className="py-3 text-uppercase text-center border-bottom border-secondary" style={{ color: '#d97706', width: '14%' }}>Expenses</th>
                <th className="py-3 pe-4 text-muted text-uppercase text-center border-bottom border-secondary text-success" style={{ width: '14%' }}>Net Worth</th>
              </tr>
            </thead>
            
            <tbody>
              {results.timeline.map((y: any, index: number) => {
                const isExpanded = expandedYear === y.year;
                
                const p1Clawback = y.taxDetailsP1?.oas_clawback || 0;
                const p2Clawback = y.taxDetailsP2?.oas_clawback || 0;
                const totalClawback = p1Clawback + p2Clawback;

                const totalWithdrawals = y.flows && y.flows.withdrawals ? Object.values(y.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) : 0;
                
                const totalIncome = (y.grossInflow || 0) - (totalWithdrawals as number) - totalClawback;
                const totalTaxes = (y.taxP1 || 0) + (y.taxP2 || 0) - totalClawback;
                
                const respWd = (y.flows?.withdrawals?.['P1 RESP'] || 0) + (y.flows?.withdrawals?.['P2 RESP'] || 0);
                const unfundedEdu = Math.max(0, (y.eduExpense || 0) - respWd);
                const baseDebtRepayment = Math.max(0, (y.debtRepayment || 0) - unfundedEdu);
                
                // Exclude lifestyleSpendingCash from the generic 'Expenses' column
                const totalExpenses = (y.expenses || 0) + (y.mortgagePay || 0) + baseDebtRepayment + (y.eduExpense || 0);

                const respBal = (y.assetsP1?.resp || 0) + (y.assetsP2?.resp || 0);
                const totalNW = y.liquidNW + (y.reIncludedEq || 0); 
                
                let engineContributions = 0;
                if (y.flows && y.flows.contributions) {
                    engineContributions += Object.entries(y.flows.contributions.p1 || {}).filter(([k]) => k !== 'spending_cash').reduce((a: any, [, b]: any) => a + b, 0) as number;
                    if (isCouple) engineContributions += Object.entries(y.flows.contributions.p2 || {}).filter(([k]) => k !== 'spending_cash').reduce((a: any, [, b]: any) => a + b, 0) as number;
                }

                const lifestyleSpendingCash = y.flows?.contributions?.shared?.spending_cash || 0;

                const totalSourcedRaw = totalIncome + (totalWithdrawals as number);
                const totalSpentRaw = totalExpenses + totalTaxes + engineContributions + lifestyleSpendingCash;
                
                let shortfall = 0;
                let unallocated = 0;
                
                if (totalSourcedRaw < totalSpentRaw - 0.5) shortfall = totalSpentRaw - totalSourcedRaw;
                else if (totalSourcedRaw > totalSpentRaw + 0.5) unallocated = totalSourcedRaw - totalSpentRaw;

                const finalBalancedTotal = Math.max(totalSourcedRaw, totalSpentRaw);

                const p1BeforeSplit = y.taxIncP1 + (y.pensionSplit?.p1ToP2 || 0) - (y.pensionSplit?.p2ToP1 || 0);
                const p2BeforeSplit = y.taxIncP2 + (y.pensionSplit?.p2ToP1 || 0) - (y.pensionSplit?.p1ToP2 || 0);

                return (
                  <React.Fragment key={y.year}>
                    
                    <tr className={`cursor-pointer transition-all ${isExpanded ? 'bg-primary bg-opacity-10' : ''}`} onClick={() => toggleRow(y.year)}>
                      <td className="py-3 ps-3 text-center text-primary border-bottom border-secondary border-opacity-25">
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} transition-all`}></i>
                      </td>
                      <td className="py-3 fw-bold text-start ps-2 text-main border-bottom border-secondary border-opacity-25">
                        <div className="d-flex align-items-center">
                            <span className="fs-6">{y.year}</span>
                            {getEventIcons(y.events, y, index, results.timeline)}
                        </div>
                      </td>
                      <td className="py-3 text-center border-bottom border-secondary border-opacity-25 px-2">
                        {getPhaseBadge(y)}
                      </td>
                      <td className="py-3 text-center border-bottom border-secondary border-opacity-25">
                        {renderAges(y)}
                      </td>
                      <td className="py-3 text-center fw-medium text-nowrap border-bottom border-secondary border-opacity-25">{formatCurrency(totalIncome, y.year)}</td>
                      <td className="py-3 text-center text-danger fw-medium text-nowrap border-bottom border-secondary border-opacity-25">{formatCurrency(totalTaxes, y.year)}</td>
                      <td className="py-3 text-center fw-medium text-nowrap border-bottom border-secondary border-opacity-25" style={{ color: '#d97706' }}>{formatCurrency(totalExpenses + lifestyleSpendingCash, y.year)}</td>
                      <td className="py-3 pe-4 text-center text-success fw-bold fs-6 text-nowrap border-bottom border-secondary border-opacity-25">{formatCurrency(totalNW, y.year)}</td>
                    </tr>

                    {isExpanded && (
                      <tr style={{ position: 'relative', zIndex: 999 }}>
                        <td colSpan={8} className="p-0 border-bottom border-secondary border-opacity-50 position-relative" style={{ zIndex: 999 }}>
                          <div className="m-0 m-md-2 rounded-4 surface-card border border-primary border-opacity-25 shadow-inner slide-down position-relative" style={{ zIndex: 999 }}>
                            
                            <div className="row g-0 align-items-stretch">
                                
                                <div className="col-12 col-lg-4 border-end border-secondary border-opacity-50 p-3 p-md-4 d-flex flex-column">
                                    <h6 className="text-success fw-bold ls-1 mb-3 border-bottom border-secondary pb-2 d-flex align-items-center">
                                        <i className="bi bi-box-arrow-in-right me-2"></i>
                                        <span className="text-uppercase">Cash Inflows</span>
                                        <InfoBtn align="left" title="Cash Inflows" text="All sources of cash generated during the year, including employment income, pensions, windfalls, and portfolio withdrawals required to fund your lifestyle." />
                                    </h6>
                                    
                                    <div className="flex-grow-1">
                                        {y.p1Alive && renderPlayerInflows('p1', y, y.year, index, results.timeline)}
                                        {isCouple && y.p2Alive && renderPlayerInflows('p2', y, y.year, index, results.timeline)}

                                        {y.windfall > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2">
                                                <span className="text-muted fw-bold text-success d-flex align-items-center">Windfalls / Property Sale <InfoBtn align="left" title="Windfalls" text="Taxable status depends on the source. Mapped accordingly in Net Worth." /></span>
                                                <span className="fw-medium text-success text-nowrap">{formatCurrency(y.windfall, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        {shortfall > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="text-danger fw-bold d-flex align-items-center">Shortfall (Cash Deficit) <InfoBtn align="left" title="Shortfall" text="Expenses exceeded total available cash flow and withdrawals. The simulation mathematically borrows this to keep running." /></span>
                                                <span className="fw-medium text-danger text-nowrap">+{formatCurrency(shortfall, y.year)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-3"></div>
                                </div>

                                <div className="col-12 col-lg-4 border-end border-secondary border-opacity-50 p-3 p-md-4 d-flex flex-column">
                                    <h6 className="fw-bold ls-1 mb-3 border-bottom border-secondary pb-2 d-flex align-items-center" style={{ color: '#d97706' }}>
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        <span className="text-uppercase">Cash Outflows</span>
                                        <InfoBtn align="center" title="Cash Outflows" text="All cash spent or allocated during the year, including living expenses, taxes, mortgage payments, education costs, and lifestyle spending items." />
                                    </h6>
                                    
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold">Living Expenses</span><span className="fw-medium text-nowrap">{formatCurrency(y.expenses, y.year)}</span></div>
                                        
                                        {/* Breakout Lifestyle Spending Row Block */}
                                        {lifestyleSpendingCash > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center bg-warning bg-opacity-10 px-2 py-1 rounded-2 my-2 border border-warning border-opacity-25">
                                                <span className="d-flex align-items-center text-warning-emphasis fw-bold">
                                                    <i className="bi bi-bag-heart-fill me-2 text-warning"></i>
                                                    Lifestyle Spending Cash 
                                                    <InfoBtn align="center" title="Lifestyle Cash Outflow" text="Discretionary cash drawn sequentially from accumulation funds to process unbudgeted cash items." />
                                                </span>
                                                <span className="text-warning-emphasis fw-bold text-nowrap">{formatCurrency(lifestyleSpendingCash, y.year)}</span>
                                            </div>
                                        )}

                                        {y.mortgagePay > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                <span className="d-flex align-items-center text-muted ms-2">Mortgage Payments <InfoBtn align="right" title="Mortgage" text="Principal and interest payments for the year based on your amortization schedule."/></span>
                                                <span className="text-nowrap">{formatCurrency(y.mortgagePay, y.year)}</span>
                                            </div>
                                        )}
                                        {y.eduExpense > 0 && (
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="text-muted ms-2 fw-bold text-info">Education Costs</span>
                                                <span className="fw-medium text-info text-nowrap">{formatCurrency(y.eduExpense, y.year)}</span>
                                            </div>
                                        )}
                                        {baseDebtRepayment > 0 && (
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="text-muted ms-2 fw-bold" style={{ color: '#d97706' }}>Large Purchases/Debt</span>
                                                <span className="fw-medium text-nowrap" style={{ color: '#d97706' }}>{formatCurrency(baseDebtRepayment, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="mb-2 mt-2 pt-2 border-top border-secondary border-opacity-25">
                                            <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                <span className="d-flex align-items-center text-muted fw-bold text-danger">{p1Name} Taxes <InfoBtn align="right" title={`${p1Name} Tax Breakdown`} text={buildTaxTooltip(y, 'p1', y.taxDetailsP1, y.taxIncP1, p1BeforeSplit, y.year)} /></span>
                                                <span className="text-danger fw-medium text-nowrap">{formatCurrency(y.taxP1 - (y.taxDetailsP1?.oas_clawback || 0), y.year)}</span>
                                            </div>
                                            {isCouple && (
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="d-flex align-items-center text-muted fw-bold text-danger">{p2Name} Taxes <InfoBtn align="right" title={`${p2Name} Tax Breakdown`} text={buildTaxTooltip(y, 'p2', y.taxDetailsP2, y.taxIncP2, p2BeforeSplit, y.year)} /></span>
                                                    <span className="text-danger fw-medium text-nowrap">{formatCurrency(y.taxP2 - (y.taxDetailsP2?.oas_clawback || 0), y.year)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {engineContributions > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center mt-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="d-flex align-items-center text-primary fw-bold">Surplus Invested <InfoBtn align="right" title="Contributions" text={buildContributionTooltip(y.flows, isCouple, y.year)} /></span>
                                                <span className="text-primary fw-medium text-nowrap">{formatCurrency(engineContributions, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        {unallocated > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="text-success fw-bold d-flex align-items-center">Unallocated Surplus <InfoBtn align="right" title="Surplus" text="Cash generated that wasn't spent or automatically routed into a tracked investment account." /></span>
                                                <span className="fw-medium text-success text-nowrap">+{formatCurrency(unallocated, y.year)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3"></div>
                                </div>

                                <div className="col-12 col-lg-4 p-3 p-md-4 d-flex flex-column">
                                    <h6 className="text-info fw-bold ls-1 mb-3 border-bottom border-secondary pb-2 d-flex align-items-center">
                                        <i className="bi bi-wallet2 me-2"></i>
                                        <span className="text-uppercase">Portfolio & Net Worth</span>
                                        <InfoBtn align="right" title="Portfolio & Net Worth" text="End-of-year balances for registered, non-registered, and family accounts, including property equity." />
                                    </h6>
                                    
                                    <div className="flex-grow-1">
                                        {y.p1Alive && (
                                            <div className="mb-2">
                                                <div className="d-flex justify-content-between small mb-1"><span className="fw-bold text-uppercase ls-1" style={{fontSize: '0.75rem', color: 'var(--bs-info)'}}>{p1Name} Portfolio</span><span className="fw-bold text-nowrap" style={{color: 'var(--bs-info)'}}>{formatCurrency(sumAccounts(y.assetsP1), y.year)}</span></div>
                                                
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">TFSA</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['tfsa'], ['TFSA', 'TFSA (Successor)'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency((y.assetsP1?.tfsa||0) + (y.assetsP1?.tfsa_successor||0), y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP1?.fhsa > 0 || y.flows?.contributions?.p1?.fhsa > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">FHSA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', ['fhsa'], ['FHSA'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.fhsa||0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p1Age || y.ageP1) < 72 && (y.assetsP1?.rrsp > 0 || y.flows?.contributions?.p1?.rrsp > 0)) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="d-flex align-items-center text-muted ms-2">RRSP</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', ['rrsp'], ['RRSP'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.rrsp || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p1Age || y.ageP1) >= 72 || y.assetsP1?.rrif_acct > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2 d-flex align-items-center">RRIF <InfoBtn title="RRIF" text="Registered Retirement Income Fund.<br>Converted from RRSP at age 71." align="left" /></span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['RRIF'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.rrif_acct || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {y.assetsP1?.lirf > 0 && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIRA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['LIRF'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.lirf || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {(y.assetsP1?.lif > 0 || y.flows?.withdrawals?.['P1 LIF'] > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIF</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['LIF'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.lif || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Non-Reg</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['nonreg'], ['Non-Reg'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.nonreg || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Cash</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['cash'], ['Cash'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.cash || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP1?.crypto > 0 || y.flows?.withdrawals?.['P1 Crypto'] > 0 || y.flows?.contributions?.p1?.crypto > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">Crypto</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', ['crypto'], ['Crypto'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP1?.crypto || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isCouple && y.p2Alive && (
                                            <div className="mb-2 border-top border-secondary border-opacity-25 pt-2">
                                                <div className="d-flex justify-content-between small mb-1"><span className="fw-bold text-uppercase ls-1" style={{fontSize: '0.75rem', color: 'var(--bs-purple)'}}>{p2Name} Portfolio</span><span className="fw-bold text-nowrap" style={{color: 'var(--bs-purple)'}}>{formatCurrency(sumAccounts(y.assetsP2), y.year)}</span></div>
                                                
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">TFSA</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['tfsa'], ['TFSA', 'TFSA (Successor)'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency((y.assetsP2?.tfsa||0) + (y.assetsP2?.tfsa_successor||0), y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP2?.fhsa > 0 || y.flows?.contributions?.p2?.fhsa > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">FHSA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', ['fhsa'], ['FHSA'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.fhsa||0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p2Age || y.ageP2) < 72 && (y.assetsP2?.rrsp > 0 || y.flows?.contributions?.p2?.rrsp > 0)) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="d-flex align-items-center text-muted ms-2">RRSP</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', ['rrsp'], ['RRSP'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.rrsp || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p2Age || y.ageP2) >= 72 || y.assetsP2?.rrif_acct > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2 d-flex align-items-center">RRIF <InfoBtn title="RRIF" text="Registered Retirement Income Fund.<br>Converted from RRSP at age 71." align="left" /></span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['RRIF'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.rrif_acct || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {y.assetsP2?.lirf > 0 && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIRA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['LIRF'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.lirf || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {(y.assetsP2?.lif > 0 || y.flows?.withdrawals?.['P2 LIF'] > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIF</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['LIF'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.lif || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Non-Reg</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['nonreg'], ['Non-Reg'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.nonreg || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Cash</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['cash'], ['Cash'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.cash || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP2?.crypto > 0 || y.flows?.withdrawals?.['P2 Crypto'] > 0 || y.flows?.contributions?.p2?.crypto > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">Crypto</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', ['crypto'], ['Crypto'], y.year)}
                                                            <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(y.assetsP2?.crypto || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {respBal > 0 && (
                                            <div className="mb-2 mt-3 pt-2 border-top border-secondary border-opacity-25">
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted fw-bold d-flex align-items-center">Family RESP</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['resp'], ['RESP'], y.year)}
                                                        <span className="text-end text-nowrap flex-shrink-0" style={{minWidth: '75px'}}>{formatCurrency(respBal, y.year)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-between small mb-1 mt-3">
                                            <span className="text-muted fw-bold">Liquid Portfolio Assets</span>
                                            <span className="fw-medium text-nowrap">{formatCurrency(y.liquidNW, y.year)}</span>
                                        </div>
                                        
                                        {y.reIncludedEq > 0 && (
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="text-muted d-flex align-items-center">Real Estate Equity</span>
                                                <span className="d-flex align-items-center">
                                                    <span className="badge bg-success bg-opacity-25 text-success border border-success fw-normal py-0 px-1 me-2" style={{fontSize: '0.55rem'}}>IN NW</span>
                                                    <span className="text-nowrap">{formatCurrency(y.reIncludedEq, y.year)}</span>
                                                </span>
                                            </div>
                                        )}
                                        {y.reExcludedEq > 0 && (
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="text-muted d-flex align-items-center">Excluded RE Equity <InfoBtn align="right" title="Excluded Equity" text="Property equity that is tracked but explicitly toggled off from being included in your net worth."/></span>
                                                <span className="d-flex align-items-center opacity-75">
                                                    <span className="badge bg-secondary bg-opacity-25 text-muted border border-secondary fw-normal py-0 px-1 me-2" style={{fontSize: '0.55rem'}}>HIDDEN</span>
                                                    <span className="text-nowrap">{formatCurrency(y.reExcludedEq, y.year)}</span>
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3"></div>
                                </div>
                            </div>
                            
                            <div className="row g-0 bg-black bg-opacity-25 border-top border-secondary mt-auto" style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                                <div className="col-12 col-lg-4 p-3 px-md-4 d-flex justify-content-between align-items-center border-end border-secondary border-opacity-50">
                                    <span className="text-main fw-bold small">Total Cash Sourced</span>
                                    <span className="text-main fw-bold text-nowrap">{formatCurrency(finalBalancedTotal, y.year)}</span>
                                </div>
                                <div className="col-12 col-lg-4 p-3 px-md-4 d-flex justify-content-between align-items-center border-end border-secondary border-opacity-50">
                                    <span className="text-main fw-bold small">Total Cash Spent/Saved</span>
                                    <span className="text-main fw-bold text-nowrap">{formatCurrency(finalBalancedTotal, y.year)}</span>
                                </div>
                                <div className="col-12 col-lg-4 p-3 px-md-4 d-flex justify-content-between align-items-center">
                                    <span className="text-main fw-bold small">Total Net Worth</span>
                                    <span className="text-success fw-bold fs-6 text-nowrap">{formatCurrency(totalNW, y.year)}</span>
                                </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}