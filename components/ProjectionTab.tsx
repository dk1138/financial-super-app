import React, { useState, useRef } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn } from './SharedUI';
import html2canvas from 'html2canvas';

const getRrifFactor = (age: number) => {
    if (age < 71) return 1 / (90 - age);
    const f: Record<number, number> = {
        71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567, 75: 0.0582,
        76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682,
        81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851,
        86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192,
        91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879
    };
    return f[age] || 0.20;
};

export default function ProjectionTab() {
  const { data, results } = useFinance();
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  const isCouple = data.mode === 'Couple';

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 4000);
  };

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <i className="bi bi-hourglass-split fs-1 mb-3 d-block text-primary opacity-50"></i>
        <h5>Waiting for calculation...</h5>
        <p className="small">Please ensure your inputs are correct and the simulation has run.</p>
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

  const formatCurrency = (val: number, year?: number) => {
      const realVal = getRealValue(val, year);
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(realVal || 0);
  };

  const formatStr = (val: number, year?: number) => {
      return Math.round(getRealValue(val, year) || 0).toLocaleString('en-US');
  };

  const exportToCSV = () => {
      if (!results || !results.timeline) return;

      const headers = [
          "Year", "P1 Age", "P2 Age", "Phase", "Net Income", "Taxes Paid (Excl. OAS Clawback)",
          "Living Expenses", "Mortgage & Debt", "Education Costs", "Contributions", "Withdrawals",
          "Liquid Net Worth", "Real Estate Equity", "Total Estate"
      ];

      const rows = results.timeline.map((y: any) => {
          const p1Ret = Number(data.inputs.p1_retireAge) || 65;
          const p2Ret = isCouple ? (Number(data.inputs.p2_retireAge) || 65) : p1Ret;
          const isP1Ret = (y.p1Age || y.ageP1) >= p1Ret;
          const isP2Ret = isCouple ? (y.p2Age || y.ageP2) >= p2Ret : true;
          
          let phase = "Working";
          if (isP1Ret && isP2Ret) {
              const maxAge = isCouple ? Math.max(y.p1Age, y.p2Age) : y.p1Age;
              if (maxAge <= (Number(data.inputs.exp_gogo_age) || 75)) phase = "Go-Go";
              else if (maxAge <= (Number(data.inputs.exp_slow_age) || 85)) phase = "Slow-Go";
              else phase = "No-Go";
          } else if (isP1Ret !== isP2Ret) {
              phase = "Transition";
          }

          const totalWithdrawals = y.flows?.withdrawals ? Object.values(y.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) : 0;
          let engineContributions = 0;
          if (y.flows && y.flows.contributions) {
              engineContributions += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
              if (isCouple) engineContributions += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          }

          const respWd = (y.flows?.withdrawals?.['P1 RESP'] || 0) + (y.flows?.withdrawals?.['P2 RESP'] || 0);
          const unfundedEdu = Math.max(0, (y.eduExpense || 0) - respWd);
          const baseDebtRepayment = Math.max(0, (y.debtRepayment || 0) - unfundedEdu);

          const p1Clawback = y.taxDetailsP1?.oas_clawback || 0;
          const p2Clawback = y.taxDetailsP2?.oas_clawback || 0;
          const totalClawback = p1Clawback + p2Clawback;

          const totalTaxes = (y.taxP1 || 0) + (y.taxP2 || 0) - totalClawback;
          const totalEstate = (y.afterTaxEstate !== undefined ? y.afterTaxEstate : (y.liquidNW + (y.reIncludedEq || 0)));

          return [
              y.year,
              y.p1Age || y.ageP1 || '',
              isCouple ? (y.p2Age || y.ageP2 || '') : 'N/A',
              phase,
              Math.round(getRealValue((y.grossInflow || 0) - totalClawback, y.year)),
              Math.round(getRealValue(totalTaxes, y.year)),
              Math.round(getRealValue(y.expenses || 0, y.year)),
              Math.round(getRealValue((y.mortgagePay || 0) + baseDebtRepayment, y.year)),
              Math.round(getRealValue(y.eduExpense || 0, y.year)),
              Math.round(getRealValue(engineContributions, y.year)),
              Math.round(getRealValue(totalWithdrawals as number, y.year)),
              Math.round(getRealValue(y.liquidNW || 0, y.year)),
              Math.round(getRealValue((y.reIncludedEq || 0) + (y.reNonIncludedEq || 0), y.year)),
              Math.round(getRealValue(totalEstate, y.year))
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

  const exportToPNG = async () => {
      if (!tableRef.current) return;
      setIsExporting(true);
      showToast('Generating high-res image of the full table...');

      const targetEl = tableRef.current;
      const scrollContainer = targetEl.querySelector('.table-responsive') as HTMLElement;
      const originalStyle = scrollContainer ? scrollContainer.getAttribute('style') : null;

      if (scrollContainer) {
          scrollContainer.style.maxHeight = 'none';
          scrollContainer.style.overflow = 'visible';
      }

      setTimeout(async () => {
          try {
              const canvas = await html2canvas(targetEl, { 
                  backgroundColor: '#16181d', 
                  scale: 2,
                  windowHeight: targetEl.scrollHeight + 100 
              });
              
              if (scrollContainer) {
                  if (originalStyle !== null) {
                      scrollContainer.setAttribute('style', originalStyle);
                  } else {
                      scrollContainer.removeAttribute('style');
                  }
              }

              const url = canvas.toDataURL('image/png');
              const link = document.createElement('a');
              link.href = url;
              link.download = `Retirement_Projection_${new Date().toISOString().split('T')[0]}.png`;
              link.click();
              showToast('✅ Table image downloaded successfully!');
          } catch (err) {
              console.error(err);
              if (scrollContainer) {
                  if (originalStyle !== null) {
                      scrollContainer.setAttribute('style', originalStyle);
                  } else {
                      scrollContainer.removeAttribute('style');
                  }
              }
              showToast('❌ Failed to download image.');
          } finally {
              setIsExporting(false);
          }
      }, 500); 
  };

  let totalTaxPaid = 0;
  let peakNW = 0;
  let peakAge = 0;
  let hasShortfall = false;
  let retYears = 0;

  results.timeline.forEach((y: any) => {
      const p1Clawback = y.taxDetailsP1?.oas_clawback || 0;
      const p2Clawback = y.taxDetailsP2?.oas_clawback || 0;
      const totalClawback = p1Clawback + p2Clawback;

      const realTax = getRealValue((y.taxP1 || 0) + (y.taxP2 || 0) - totalClawback, y.year);
      totalTaxPaid += realTax;

      const realNW = getRealValue(y.liquidNW + (y.reIncludedEq || 0), y.year);
      if (realNW > peakNW) {
          peakNW = realNW;
          peakAge = y.p1Age;
      }
      
      let contsRaw = 0;
      if (y.flows && y.flows.contributions) {
          contsRaw += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
          if (isCouple) contsRaw += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
      }

      const respWd = (y.flows?.withdrawals?.['P1 RESP'] || 0) + (y.flows?.withdrawals?.['P2 RESP'] || 0);
      const totalSourced = y.grossInflow || 0;
      const mandatoryBills = (y.expenses || 0) + (y.mortgagePay || 0) + (y.debtRepayment || 0) + respWd + (y.taxP1 || 0) + (y.taxP2 || 0);
      
      if (totalSourced < mandatoryBills - 1) {
          hasShortfall = true;
      }

      if (y.p1Age >= (data.inputs.p1_retireAge || 65)) {
          retYears++;
      }
  });

  const planSuccess = !hasShortfall;
  const finalYear = results.timeline[results.timeline.length - 1];
  const finalEstate = finalYear.afterTaxEstate !== undefined ? finalYear.afterTaxEstate : (finalYear.liquidNW + (finalYear.reIncludedEq || 0));

  const toggleRow = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  const getEventIcons = (events: string[], y?: any) => {
      let iconElements: any[] = [];
      const evList = events || [];
      const currentYr = y?.year;

      // 1. Process Standard Engine Events (Retirement, Guardrails, Windfall, Mortgage Paid, Downsize, Dies, Leave, FHSA)
      evList.forEach((ev, i) => {
          let colorClass = "text-secondary";
          let icon = "bi-info-circle-fill";
          const lower = ev.toLowerCase();

          // Skip generic debt started/purchased events here since data.debt is handled explicitly below with clean Start & End icons
          if (lower.startsWith('started:') || lower.startsWith('purchased:')) {
              return;
          }

          if (lower.includes('retires')) {
              colorClass = "text-primary"; icon = "bi-cup-hot-fill";
          } else if (lower.includes('guardrail')) {
              colorClass = lower.includes('cut') ? "text-warning" : "text-success";
              icon = "bi-shield-shaded";
          } else if (lower.includes('mortgage paid')) {
              colorClass = "text-success"; icon = "bi-house-check-fill";
          } else if (lower.includes('sold')) {
              colorClass = "text-success"; icon = "bi-cash-coin";
          } else if (lower.includes('windfall')) {
              colorClass = "text-success"; icon = "bi-cash-coin";
          } else if (lower.includes('downsize')) {
              colorClass = "text-info"; icon = "bi-house-down-fill";
          } else if (lower.includes('dies')) {
              colorClass = "text-danger"; icon = "bi-heartbreak-fill";
          } else if (lower.includes('leave')) {
              colorClass = "text-info"; icon = "bi-person-hearts";
          } else if (lower.includes('fhsa')) {
              colorClass = "text-info"; icon = "bi-house-heart-fill";
          } else if (lower.includes('rrsp')) {
              colorClass = "text-secondary"; icon = "bi-arrow-left-right";
          } else {
              return;
          }

          iconElements.push(
              <i key={`ev-${i}`} className={`bi ${icon} ${colorClass} ms-1 fs-5`} title={ev} style={{cursor: 'help'}}></i>
          );
      });

      if (!y || !currentYr) return iconElements.length > 0 ? iconElements : null;

      // 2. Future Expenses & Debts (data.debt) — ONLY SHOW ON START YEAR AND END/PAID OFF YEAR
      if (data.debt && data.debt.length > 0) {
          data.debt.forEach((d: any, dIdx: number) => {
              const startYear = parseInt((d.start || '2026').split('-')[0]);
              const dType = d.type || 'one';
              const duration = dType === 'one' ? 1 : Math.max(1, parseInt(d.duration) || 1);
              const endYear = startYear + duration - 1;
              const lowerName = (d.name || '').toLowerCase();

              const isStudent = lowerName.includes('student') || lowerName.includes('osap') || lowerName.includes('tuition');
              const isCar = lowerName.includes('car') || lowerName.includes('auto') || lowerName.includes('vehicle');
              const isWedding = lowerName.includes('wedding');
              const isReno = lowerName.includes('reno') || lowerName.includes('home') || lowerName.includes('roof');

              if (dType === 'one') {
                  // One-time expense: only show in startYear
                  if (currentYr === startYear) {
                      let icon = 'bi-bag-check-fill';
                      let color = 'text-warning';
                      if (isStudent) icon = 'bi-mortarboard-fill';
                      else if (isCar) { icon = 'bi-car-front-fill'; color = 'text-info'; }
                      else if (isWedding) { icon = 'bi-gem'; color = 'text-primary'; }
                      else if (isReno) icon = 'bi-tools';

                      iconElements.push(
                          <i key={`debt-one-${dIdx}`} className={`bi ${icon} ${color} ms-1 fs-5`} title={`${d.name || 'Expense'}: ${formatCurrency(d.amount, currentYr)}`} style={{cursor: 'help'}}></i>
                      );
                  }
              } else {
                  // Recurring Debt / Loan: Show START and END only
                  if (currentYr === startYear) {
                      let icon = 'bi-credit-card-2-front-fill';
                      let color = 'text-warning';
                      if (isStudent) icon = 'bi-mortarboard-fill';
                      else if (isCar) { icon = 'bi-car-front-fill'; color = 'text-info'; }

                      iconElements.push(
                          <i key={`debt-start-${dIdx}`} className={`bi ${icon} ${color} ms-1 fs-5`} title={`${d.name || 'Loan'} Starts (${duration} yrs, ${formatCurrency(d.amount, currentYr)}/yr)`} style={{cursor: 'help'}}></i>
                      );
                  } else if (currentYr === endYear) {
                      let icon = 'bi-check-circle-fill';
                      let color = 'text-success';
                      if (isStudent) icon = 'bi-mortarboard-fill';
                      else if (isCar) icon = 'bi-car-front-fill';

                      iconElements.push(
                          <i key={`debt-end-${dIdx}`} className={`bi ${icon} ${color} ms-1 fs-5`} title={`${d.name || 'Loan'} Paid Off / Completed!`} style={{cursor: 'help'}}></i>
                      );
                  }
              }
          });
      }

      // 3. Kids Registered Account Funding (RESP) — ONLY SHOW ON START YEAR AND END YEAR
      if (results.timeline && results.timeline.length > 0) {
          const respYears = results.timeline
              .filter((r: any) => ((r.flows?.contributions?.p1?.resp || 0) + (r.flows?.contributions?.p2?.resp || 0)) > 0)
              .map((r: any) => r.year);

          if (respYears.length > 0) {
              const firstRespYear = respYears[0];
              const lastRespYear = respYears[respYears.length - 1];

              if (currentYr === firstRespYear) {
                  iconElements.push(
                      <i key="resp-start" className="bi bi-backpack-fill text-info ms-1 fs-5" title="Kids Registered Account (RESP) Funding Starts" style={{cursor: 'help'}}></i>
                  );
              } else if (currentYr === lastRespYear && lastRespYear !== firstRespYear) {
                  iconElements.push(
                      <i key="resp-end" className="bi bi-backpack-fill text-success ms-1 fs-5" title="Kids Registered Account (RESP) Funding Completed" style={{cursor: 'help'}}></i>
                  );
              }
          }
      }

      // 4. College / University Education (dep.hasEdu) — ONLY SHOW ON START AND END YEAR
      if (data.dependents && data.dependents.length > 0) {
          data.dependents.forEach((dep: any, kIdx: number) => {
              if (dep.hasEdu) {
                  const bYear = parseInt((dep.dob || '2020').split('-')[0]) || currentYr;
                  const eduStart = bYear + (parseInt(dep.eduStart) || 18);
                  const eduDur = parseInt(dep.eduDuration) || 4;
                  const eduEnd = eduStart + eduDur - 1;

                  if (currentYr === eduStart) {
                      iconElements.push(
                          <i key={`edu-start-${kIdx}`} className="bi bi-mortarboard-fill text-info ms-1 fs-5" title={`${dep.name || 'Child'} Starts College/University`} style={{cursor: 'help'}}></i>
                      );
                  } else if (currentYr === eduEnd) {
                      iconElements.push(
                          <i key={`edu-end-${kIdx}`} className="bi bi-mortarboard-fill text-success ms-1 fs-5" title={`${dep.name || 'Child'} Finishes College/University!`} style={{cursor: 'help'}}></i>
                      );
                  }
              }
          });
      }

      return iconElements.length > 0 ? iconElements : null;
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
      return ages;
  };

  const getPhaseBadge = (y: any) => {
      const p1Ret = Number(data.inputs.p1_retireAge) || 65;
      const p2Ret = isCouple ? (Number(data.inputs.p2_retireAge) || 65) : p1Ret;
      const p1Age = y.p1Age || y.ageP1;
      const p2Age = isCouple ? (y.p2Age || y.ageP2) : p1Age;

      const isP1Ret = p1Age >= p1Ret;
      const isP2Ret = isCouple ? p2Age >= p2Ret : true;

      if (!isP1Ret && !isP2Ret) return <span className="badge bg-secondary bg-opacity-25 text-secondary border border-secondary w-100 py-2">Working</span>;
      if (isCouple && (isP1Ret !== isP2Ret)) return <span className="badge bg-info bg-opacity-25 text-info border border-info w-100 py-2">Transition</span>;

      const maxAge = isCouple ? Math.max(p1Age, p2Age) : p1Age;
      const gogo = Number(data.inputs.exp_gogo_age) || 75;
      const slowgo = Number(data.inputs.exp_slow_age) || 85;

      if (maxAge <= gogo) return <span className="badge bg-success bg-opacity-25 text-success border border-success w-100 py-2">Go-Go Phase</span>;
      if (maxAge <= slowgo) return <span className="badge bg-opacity-25 border w-100 py-2" style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#d97706', borderColor: '#d97706' }}>Slow-Go Phase</span>;
      return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger w-100 py-2">No-Go Phase</span>;
  };

  const sumAccounts = (assets: any) => {
      if (!assets) return 0;
      return (assets.cash||0) + (assets.tfsa||0) + (assets.fhsa||0) + (assets.rrsp||0) + (assets.lirf||0) + (assets.lif||0) + (assets.rrif_acct||0) + (assets.nonreg||0) + (assets.crypto||0);
  };

  const getAccountFlow = (y: any, player: string, acctKeys: string[], wdKeys: string[], year: number) => {
      let added = 0;
      let withdrawn = 0;
      if (y.flows && y.flows.contributions && y.flows.contributions[player]) {
          acctKeys.forEach(k => added += (y.flows.contributions[player][k] || 0));
      }
      if (y.flows && y.flows.withdrawals) {
          const pUpper = player.toUpperCase();
          wdKeys.forEach(k => withdrawn += (y.flows.withdrawals[`${pUpper} ${k}`] || 0));
      }

      const lifTransfer = (player === 'p1' ? y.lifTransferP1 : y.lifTransferP2) || (y.flows?.transfers?.[player]?.lif_to_rrif || 0);
      if (wdKeys.includes('LIF') && lifTransfer > 0) {
          withdrawn += lifTransfer;
      }
      if (wdKeys.includes('RRIF') && lifTransfer > 0) {
          added += lifTransfer;
      }

      let net = added - withdrawn;
      if (Math.abs(net) < 1) return <span style={{width: '55px', display: 'inline-block'}}></span>; 
      
      net = getRealValue(net, year);
      const isPos = net > 0;
      const absNet = Math.abs(net);
      const formatted = absNet >= 1000 ? `${(absNet/1000).toFixed(1).replace('.0', '')}k` : Math.round(absNet);
      
      return (
          <span className={`fw-bold ${isPos ? 'text-success' : 'text-danger'} text-end text-nowrap me-2`} style={{fontSize: '0.65rem', minWidth: '55px', width: 'auto', whiteSpace: 'nowrap', display: 'inline-block'}}>
              ({isPos ? '+' : '-'}{formatted})
          </span>
      );
  };

  const buildTaxTooltip = (y: any, player: 'p1'|'p2', taxData: any, taxIncAfter: number, taxIncBefore: number, refund: number, year: number) => {
      if (!taxData) return "No tax generated.";
      
      const isP1 = player === 'p1';
      const pUpper = player.toUpperCase();

      const salary = isP1 ? (y.incomeP1 - (y.rrspMatchP1 || 0)) : (y.incomeP2 - (y.rrspMatchP2 || 0));
      const match = isP1 ? (y.rrspMatchP1 || 0) : (y.rrspMatchP2 || 0);
      
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
      const yieldMath = isP1 ? y.invYieldMathP1 : y.invYieldMathP2;
      const cdnDiv = yieldMath?.amt || 0;
      const forDiv = yieldMath?.foreignAmt || 0;
      const cryptoYield = Math.max(0, (invInc || 0) - cdnDiv - forDiv);

      if (cdnDiv > 0) { 
          breakdownStr += `<div class="d-flex justify-content-between"><span>Cdn Dividends (Eligible):</span> <span>$${formatStr(cdnDiv, year)}</span></div>`; 
          sum += cdnDiv; 
      }
      if (forDiv > 0) { 
          breakdownStr += `<div class="d-flex justify-content-between"><span>Foreign Dividends (Ordinary):</span> <span>$${formatStr(forDiv, year)}</span></div>`; 
          sum += forDiv; 
      }
      if (cryptoYield > 0) { 
          breakdownStr += `<div class="d-flex justify-content-between"><span>Crypto Yield:</span> <span>$${formatStr(cryptoYield, year)}</span></div>`; 
          sum += cryptoYield; 
      }

      const wdKeys = Object.keys(y.flows?.withdrawals || {}).filter(k => k.startsWith(pUpper) && y.flows.withdrawals[k] > 0);
      const taxableWds = wdKeys.filter(k => !k.includes('TFSA') && !k.includes('FHSA') && !k.includes('Cash') && !k.includes('RESP'));

      taxableWds.forEach(k => {
          const cleanName = k.replace(`${pUpper} `, '');
          if (k.includes('RRIF') || k.includes('LIF') || k.includes('RRSP') || k.includes('LIRF')) {
              const amt = y.flows.withdrawals[k];
              breakdownStr += `<div class="d-flex justify-content-between"><span>${cleanName} W/D:</span> <span>$${formatStr(amt, year)}</span></div>`;
              sum += amt;
          } else if (k.includes('Non-Reg') || k.includes('Crypto')) {
              const mathObj = y.wdBreakdown?.[player]?.[`${cleanName}_math`];
              if (mathObj && mathObj.tax > 0) {
                  breakdownStr += `<div class="d-flex justify-content-between"><span>${cleanName} Taxable:</span> <span>$${formatStr(mathObj.tax, year)}</span></div>`;
                  sum += mathObj.tax;
              }
          }
      });

      let actualGross = sum; 
      
      let incStr = `<b>Gross Income:</b> $${formatStr(actualGross, year)}<br>`;
      if (breakdownStr) {
           incStr += `<div class="text-muted border-start border-2 border-secondary ms-1 ps-2 my-2" style="font-size: 0.75rem; line-height: 1.4;">${breakdownStr}</div>`;
      }

      const rrspCont = y.flows?.contributions?.[player]?.rrsp || 0;
      const fhsaCont = y.flows?.contributions?.[player]?.fhsa || 0;
      const totalDeductions = rrspCont + fhsaCont;

      if (totalDeductions > 0) {
          incStr += `<b>Total Deductions:</b> -$${formatStr(totalDeductions, year)}<br>`;
          let dedStr = '';
          
          if (rrspCont > 0) {
              const empMatch = match; 
              const ownCont = rrspCont - empMatch;
              
              if (empMatch > 0) {
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

      if (Math.abs(taxIncAfter - taxIncBefore) > 1) {
          let splitAmt = taxIncAfter - taxIncBefore;
          incStr += `<b>Pension Split:</b> ${splitAmt > 0 ? '+' : '-'}$${formatStr(Math.abs(splitAmt), year)}<br>`;
      }
      incStr += `<b>Net Taxable Income:</b> $${formatStr(taxIncAfter, year)}<hr class="my-1 border-secondary">`;

      let clawbackStr = taxData.oas_clawback > 0 ? `<br><b>OAS Clawback:</b> $${formatStr(taxData.oas_clawback, year)}` : '';

      return `${incStr}<b>Federal Tax:</b> $${formatStr(taxData.fed, year)}<br><b>Provincial Tax:</b> $${formatStr(taxData.prov, year)}<br><b>CPP/EI Premiums:</b> $${formatStr(taxData.cpp_ei, year)}${clawbackStr}<hr class="my-1 border-secondary"><b>Total Tax Generated:</b> $${formatStr(taxData.totalTax, year)}<br><b>Est. Tax Savings/Refund:</b> <span class="text-success">+$${formatStr(refund, year)}</span><br><b>Marginal Rate:</b> ${(taxData.margRate * 100).toFixed(1)}%`;
  };

  const buildYieldTooltip = (math: any, year: number, useRealDollars: boolean) => {
      if (!math) return "No yield.";
      const cdnRate = (math.rate || 0) * 100;
      const cdnAmt = math.amt || 0;
      const forRate = (math.foreignRate || 0) * 100;
      const forAmt = math.foreignAmt || 0;
      const totalAmt = cdnAmt + forAmt;

      let cdnStr = `<b>Cdn Div Yield:</b> ${cdnRate.toFixed(2)}%<br><b>Cdn Cash:</b> <span class="text-success">+$${formatStr(cdnAmt, year)}</span> <i>(Eligible DTC)</i>`;
      let forStr = `<br><b>Foreign Div Yield:</b> ${forRate.toFixed(2)}%<br><b>Foreign Cash:</b> <span class="text-success">+$${formatStr(forAmt, year)}</span> <i>(100% Taxable)</i>`;

      if (useRealDollars) {
          return `<b>Nominal Balance:</b> $${Math.round(math.bal || 0).toLocaleString()}<br>${cdnStr}${forStr}<hr class="my-1 border-secondary"><b>Total Yield Cash:</b> <span class="text-success">+$${Math.round(totalAmt).toLocaleString()}</span><br><b>In Today's $:</b> <span class="text-success">+$${formatStr(totalAmt, year)}</span>`;
      }
      return `<b>Asset Balance:</b> $${formatStr(math.bal || 0, year)}<br>${cdnStr}${forStr}<hr class="my-1 border-secondary"><b>Total Yield Cash:</b> <span class="text-success">+$${formatStr(totalAmt, year)}</span>`;
  };

  const buildOasTooltip = (gross: number, clawback: number, taxInc: number, year: number, threshold: number) => {
      const eliminationThreshold = threshold + (gross / 0.15);
      const isFullyEliminated = clawback >= (gross - 0.01);

      if (clawback <= 0) {
          return `<span class="text-info fw-bold">100% Taxable.</span><br><b>Gross OAS:</b> $${formatStr(gross, year)}<hr class="my-1 border-secondary"><b>Net Income for OAS:</b> $${formatStr(taxInc, year)}<br><b>OAS Threshold:</b> $${formatStr(threshold, year)}<br><span class="text-muted" style="font-size: 0.7rem;"><b>Fully Eliminated At:</b> $${formatStr(eliminationThreshold, year)}</span><br><br>No clawback applied.`;
      }
      
      return `<span class="text-info fw-bold">100% Taxable.</span><br><b>Gross OAS:</b> $${formatStr(gross, year)}<hr class="my-1 border-secondary"><b>Net Income for OAS:</b> $${formatStr(taxInc, year)}<br><b>OAS Threshold:</b> $${formatStr(threshold, year)}<br><span class="text-muted" style="font-size: 0.7rem;"><b>Fully Eliminated At:</b> $${formatStr(eliminationThreshold, year)}</span><br><br><span class="text-danger"><b>Clawback Penalty:</b> -$${formatStr(clawback, year)}${isFullyEliminated ? ' <br><i>(OAS Fully Eliminated)</i>' : ''}</span><br><b>Net OAS Received:</b> $${formatStr(Math.max(0, gross - clawback), year)}`;
  };

  const buildContributionTooltip = (flows: any, isCouple: boolean, year: number) => {
      if (!flows || !flows.contributions) return "No contributions.";
      let lines: string[] = [];
      Object.entries(flows.contributions.p1).forEach(([k, v]) => { if ((v as number) > 0) lines.push(`P1 ${k.toUpperCase()}: $${formatStr(v as number, year)}`); });
      if (isCouple) Object.entries(flows.contributions.p2).forEach(([k, v]) => { if ((v as number) > 0) lines.push(`P2 ${k.toUpperCase()}: $${formatStr(v as number, year)}`); });
      return lines.length > 0 ? lines.join('<br>') : "No contributions.";
  };

  const buildLifTransferTooltip = (math: any, transferVal: number, year: number, useRealDollars: boolean) => {
      if (!math) {
          return `<span class='text-info fw-bold'>Tax-Deferred Rollover (0% Immediate Tax).</span><br>Transferred directly from your locked-in LIF to your unlocked RRIF under CRA Form T2033 (Line 23200 deduction). Unlocks capital with no future maximum withdrawal limit.<hr class="my-1 border-secondary"><b>Transfer Amount:</b> $${formatStr(transferVal, year)}`;
      }

      const openBal = math.openingBal || 0;
      const minFactor = (math.minFactor || 0) * 100;
      const minAmt = math.minAmount || 0;
      const maxFactor = (math.maxFactor || 0) * 100;
      const maxLimit = math.maxLimit || 0;
      const priorGain = math.priorGain || 0;
      const prov = (math.province || 'ON').toUpperCase();
      const isGainApplied = ['ON', 'BC', 'AB', 'NL', 'MB'].includes(prov) && priorGain > (openBal * (math.maxFactor || 0));

      let content = `<span class='text-info fw-bold'>Tax-Deferred Rollover (0% Immediate Tax).</span><br>Transferred under CRA Form T2033 (Line 23200 deduction) to unlock capital into a regular RRIF with no future maximum ceiling.<hr class="my-1 border-secondary">`;
      
      content += `<div class="d-flex justify-content-between text-muted small mb-1"><span>Jan 1 LIF Balance:</span><span>$${Math.round(openBal).toLocaleString()}</span></div>`;
      content += `<div class="d-flex justify-content-between text-muted small mb-1"><span>Mandatory Min (${minFactor.toFixed(2)}%):</span><span class="text-danger">-$${Math.round(minAmt).toLocaleString()} (Cash)</span></div>`;
      content += `<hr class="my-1 border-secondary">`;
      content += `<div class="d-flex justify-content-between text-muted small mb-1"><span>Age Max Factor (${prov}):</span><span>${maxFactor.toFixed(2)}% ($${Math.round(openBal * (math.maxFactor || 0)).toLocaleString()})</span></div>`;
      if (['ON', 'BC', 'AB', 'NL', 'MB'].includes(prov)) {
          content += `<div class="d-flex justify-content-between text-muted small mb-1"><span>Prior Year Return:</span><span>$${Math.round(priorGain).toLocaleString()}${isGainApplied ? ' (Used)' : ''}</span></div>`;
      }
      content += `<div class="d-flex justify-content-between text-muted small mb-1"><span>Permitted Statutory Max:</span><span class="fw-bold">$${Math.round(maxLimit).toLocaleString()}</span></div>`;
      content += `<hr class="my-1 border-secondary">`;
      content += `<div class="d-flex justify-content-between text-muted small mb-1"><span>Nominal Transfer (Max - Min):</span><span class="fw-bold text-success">+$${Math.round(transferVal).toLocaleString()}</span></div>`;
      if (useRealDollars) {
          content += `<div class="d-flex justify-content-between fw-bold text-info small mt-1"><span>Transfer in Today's $:</span><span>+$${formatStr(transferVal, year)}</span></div>`;
      }
      return content;
  };

  const renderPlayerInflows = (player: 'p1'|'p2', y: any, year: number, index: number, timeline: any[]) => {
      const isP1 = player === 'p1';
      const pUpper = player.toUpperCase();
      const age = isP1 ? (y.p1Age || y.ageP1) : (y.p2Age || y.ageP2);
      
      const salary = isP1 ? y.incomeP1 - (y.rrspMatchP1 || 0) : y.incomeP2 - (y.rrspMatchP2 || 0);
      const match = isP1 ? y.rrspMatchP1 : y.rrspMatchP2;
      const cpp = isP1 ? y.cppP1 : y.cppP2;
      const oas = isP1 ? y.oasP1 : y.oasP2;
      const db = isP1 ? y.dbP1 : y.dbP2;
      const ccb = isP1 ? (y.ccbP1 || 0) : 0;
      const invInc = isP1 ? y.invIncP1 : y.invIncP2;
      const taxInc = isP1 ? y.taxIncP1 : y.taxIncP2;
      const taxDetails = isP1 ? y.taxDetailsP1 : y.taxDetailsP2;
      const invYieldMath = isP1 ? y.invYieldMathP1 : y.invYieldMathP2;
      const cppStart = isP1 ? data.inputs.p1_cpp_start : data.inputs.p2_cpp_start;
      const refund = isP1 ? y.rrspRefundP1 : y.rrspRefundP2;
      const lifTransferAmt = isP1 ? (y.lifTransferP1 || 0) : (y.lifTransferP2 || 0);

      const wdKeys = Object.keys(y.flows?.withdrawals || {}).filter(k => k.startsWith(pUpper) && y.flows.withdrawals[k] > 0);
      const taxableWds = wdKeys.filter(k => !k.includes('TFSA') && !k.includes('FHSA') && !k.includes('Cash') && !k.includes('RESP'));
      const nonTaxWds = wdKeys.filter(k => k.includes('TFSA') || k.includes('FHSA') || k.includes('Cash') || k.includes('RESP'));

      const oasClawback = taxDetails?.oas_clawback || 0;
      const oasGross = oas;
      const netOas = Math.max(0, oasGross - oasClawback);

      let priorRrifBal = 0;
      const prevYear = index > 0 ? timeline[index - 1] : null;
      if (prevYear) {
          priorRrifBal = (prevYear[`assets${pUpper}`]?.rrif_acct || 0) + (prevYear[`assets${pUpper}`]?.rrsp || 0);
      } else {
          priorRrifBal = (Number(data.inputs[`${player}_rrif_acct`]) || 0) + (Number(data.inputs[`${player}_rrsp`]) || 0);
      }

      return (
          <div className="mb-3 pb-2 border-bottom border-secondary border-opacity-25">
              <div className="fw-bold text-uppercase ls-1 mb-2" style={{fontSize: '0.75rem', color: isP1 ? 'var(--bs-info)' : 'var(--bs-purple)'}}>{pUpper} Inflows</div>
              
              {salary > 0 && (
                  <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Base Salary <InfoBtn title="Base Salary" text="<span class='text-info fw-bold'>100% Taxable.</span><br>Base employment/other income." align="left" /></span>
                      <span className="fw-medium">{formatCurrency(salary, year)}</span>
                  </div>
              )}
              {match > 0 && (
                  <div className="d-flex justify-content-between small mb-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Employer Match <InfoBtn title="Employer Match" text="<span class='text-info fw-bold'>Taxable Benefit.</span><br>Offset by RRSP deduction." align="left" /></span>
                      <span className="text-success">+{formatCurrency(match, year)}</span>
                  </div>
              )}
              {cpp > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">CPP <InfoBtn title="CPP Benefit" text={`<span class='text-info fw-bold'>100% Taxable.</span><br>Base CPP adjusted for start age (${cppStart}).`} align="left" /></span>
                      <span>{formatCurrency(cpp, year)}</span>
                  </div>
              )}
              {oasGross > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">OAS <InfoBtn title="OAS Math" text={buildOasTooltip(oasGross, oasClawback, taxInc, year, y.oasThreshold)} align="left" /></span>
                      <span>{formatCurrency(netOas, year)}</span>
                  </div>
              )}
              {db > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Pension (DB) <InfoBtn title="Pension" text="<span class='text-info fw-bold'>100% Taxable.</span><br>Defined Benefit Pension payout." align="left" /></span>
                      <span>{formatCurrency(db, year)}</span>
                  </div>
              )}
              {ccb > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">CCB <InfoBtn title="Canada Child Benefit" text="<span class='text-info fw-bold'>0% Taxable.</span><br>Tax-free monthly payment for eligible children." align="left" /></span>
                      <span className="text-success">+{formatCurrency(ccb, year)}</span>
                  </div>
              )}
              {invYieldMath?.amt > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="d-flex align-items-center text-muted ms-2">Cdn Div Yield <InfoBtn title="Canadian Eligible Dividends" text={`<span class='text-info fw-bold'>Eligible Dividend.</span><br>Subject to 38% gross-up and federal/provincial Dividend Tax Credit.<hr class="my-1 border-secondary"><b>Nominal Balance:</b> $${Math.round(invYieldMath.bal || 0).toLocaleString()}<br><b>Yield:</b> ${(invYieldMath.rate * 100).toFixed(2)}%<br><b>Cash Received:</b> <span class='text-success'>+$${formatStr(invYieldMath.amt, year)}</span>`} align="left" /></span>
                      <span className="text-success">+{formatCurrency(invYieldMath.amt, year)}</span>
                  </div>
              )}
              {invYieldMath?.foreignAmt > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="d-flex align-items-center text-muted ms-2">Foreign Div Yield <InfoBtn title="Foreign Dividends" text={`<span class='text-info fw-bold'>100% Taxable.</span><br>Taxed as ordinary foreign income at your marginal rate (no Canadian gross-up or dividend tax credit).<hr class="my-1 border-secondary"><b>Nominal Balance:</b> $${Math.round(invYieldMath.bal || 0).toLocaleString()}<br><b>Yield:</b> ${(invYieldMath.foreignRate * 100).toFixed(2)}%<br><b>Cash Received:</b> <span class='text-success'>+$${formatStr(invYieldMath.foreignAmt, year)}</span>`} align="left" /></span>
                      <span className="text-success">+{formatCurrency(invYieldMath.foreignAmt, year)}</span>
                  </div>
              )}
              {Math.max(0, (invInc || 0) - (invYieldMath?.amt || 0) - (invYieldMath?.foreignAmt || 0)) > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="d-flex align-items-center text-muted ms-2">Crypto Yield <InfoBtn title="Crypto Yield" text="Staking or distribution income from crypto holdings. 100% taxable as regular income." align="left" /></span>
                      <span className="text-success">+{formatCurrency(Math.max(0, (invInc || 0) - (invYieldMath?.amt || 0) - (invYieldMath?.foreignAmt || 0)), year)}</span>
                  </div>
              )}

              {taxableWds.map(k => {
                  const val = y.flows.withdrawals[k];
                  const cleanName = k.replace(`${pUpper} `, '');
                  let info = "";
                  
                  if (k.includes('RRIF')) {
                      const factor = getRrifFactor(age - 1);
                      const minAmount = priorRrifBal * factor;
                      if (data.useRealDollars) {
                          info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor*100).toFixed(2)}%).<hr class="my-1 border-secondary"><span class='text-muted small'>Nominal Math: $${Math.round(priorRrifBal).toLocaleString()} × ${(factor * 100).toFixed(2)}% = $${Math.round(minAmount).toLocaleString()}</span><br><b>In Today's $:</b> $${formatStr(minAmount, year)}`;
                      } else {
                          info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor*100).toFixed(2)}%).<hr class="my-1 border-secondary"><i>Math: $${formatStr(priorRrifBal, year)} × ${(factor * 100).toFixed(2)}% = $${formatStr(minAmount, year)}</i>`;
                      }
                  }
                  else if (k.includes('LIF')) {
                      const factor = getRrifFactor(age - 1);
                      let priorLifBal = 0;
                      const prevYear = index > 0 ? timeline[index - 1] : null;
                      if (prevYear) {
                          priorLifBal = (prevYear[`assets${pUpper}`]?.lif || 0) + (age >= 72 ? (prevYear[`assets${pUpper}`]?.lirf || 0) : 0);
                      } else {
                          priorLifBal = Number(data.inputs[`${player}_lif`]) || 0;
                      }
                      const minAmount = priorLifBal * factor;
                      const extraWd = Math.max(0, val - minAmount);

                      if (data.useRealDollars) {
                          info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor * 100).toFixed(2)}%).<hr class="my-1 border-secondary"><span class='text-muted small'>Nominal Math: $${Math.round(priorLifBal).toLocaleString()} × ${(factor * 100).toFixed(2)}% = $${Math.round(minAmount).toLocaleString()}</span><br><b>Min in Today's $:</b> $${formatStr(minAmount, year)}${extraWd > 1 ? `<br><span class='text-warning'>+ Discretionary Pull: $${formatStr(extraWd, year)}</span><br><b>Total W/D:</b> $${formatStr(val, year)}` : ''}`;
                      } else {
                          info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor * 100).toFixed(2)}%).<hr class="my-1 border-secondary"><i>Math: $${formatStr(priorLifBal, year)} × ${(factor * 100).toFixed(2)}% = $${formatStr(minAmount, year)}</i>${extraWd > 1 ? `<br><b>+ Extra Discretionary:</b> $${formatStr(extraWd, year)}<br><b>Total W/D:</b> $${formatStr(val, year)}` : ''}`;
                      }
                  }
                  else if (k.includes('RRSP')) {
                      info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Added directly to taxable income.`;
                  }
                  else if (k.includes('Non-Reg') || k.includes('Crypto')) {
                      const mathObj = y.wdBreakdown?.[player]?.[`${cleanName}_math`];
                      if (mathObj) {
                          if (data.useRealDollars) {
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
                          <span className="text-primary">+{formatCurrency(val, year)}</span>
                      </div>
                  );
              })}

              {(nonTaxWds.length > 0 || refund > 0 || lifTransferAmt > 0) && (
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-25">
                      <div className="text-muted fw-bold small mb-1 ls-1" style={{fontSize: '0.65rem'}}>NON-TAXABLE INFLOWS & TRANSFERS</div>
                      
                      {refund > 0 && (
                          <div className="d-flex justify-content-between small mb-1 align-items-center">
                              <span className="text-muted ms-2 d-flex align-items-center">Tax Refund <InfoBtn align="left" title="Tax Refund" text="<span class='text-info fw-bold'>0% Taxable.</span><br>Refund generated from prior year RRSP contributions." /></span>
                              <span className="text-success">+{formatCurrency(refund, year)}</span>
                          </div>
                      )}

                      {lifTransferAmt > 0 && (
                          <div className="d-flex justify-content-between small mb-1 align-items-center">
                              <span className="text-muted ms-2 d-flex align-items-center">LIF to RRIF Transfer <InfoBtn align="left" title="LIF to RRIF Transfer Math" text={buildLifTransferTooltip(isP1 ? y.lifTransferMathP1 : y.lifTransferMathP2, lifTransferAmt, year, data.useRealDollars)} /></span>
                              <span className="text-info">+{formatCurrency(lifTransferAmt, year)}</span>
                          </div>
                      )}

                      {nonTaxWds.map(k => {
                          const val = y.flows.withdrawals[k];
                          const cleanName = k.replace(`${pUpper} `, '');
                          let info = `<span class='text-info fw-bold'>0% Taxable.</span><br>Tax-free withdrawal. Does not affect taxable income.`;
                          
                          if (k.includes('RESP')) {
                              info = `<span class='text-info fw-bold'>Effectively Tax-Free.</span><br>Withdrawn to fund post-secondary education. The EAP portion is technically taxable to the student, but usually results in $0 tax due to the student's low income and tuition credits.`;
                          }

                          return (
                              <div className="d-flex justify-content-between small mb-1 align-items-center" key={k}>
                                  <span className="text-muted ms-2 d-flex align-items-center">{cleanName} W/D <InfoBtn align="left" title={`${cleanName} Withdrawal`} text={info} /></span>
                                  <span className="text-primary">+{formatCurrency(val, year)}</span>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="p-3 p-md-4">
      
      {toastMsg && (
          <div className="position-fixed top-0 start-50 translate-middle-x mt-4 transition-all" style={{zIndex: 9999}}>
              <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                  {isExporting && <span className="spinner-border spinner-border-sm me-2"></span>}
                  {toastMsg}
              </div>
          </div>
      )}

      <div className="row g-2 g-md-3 mb-4">
          <div className="col-12 col-md-4 col-xl">
              <div className={`border px-3 py-2 rounded-pill shadow-sm d-flex justify-content-between align-items-center h-100 ${planSuccess ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
                  <span className="small fw-bold text-uppercase ls-1 me-2" style={{color: planSuccess ? 'var(--bs-success)' : 'var(--bs-danger)'}}>Status</span>
                  <span className={`fw-bold text-nowrap ${planSuccess ? 'text-success' : 'text-danger'}`}>
                      {planSuccess ? <><i className="bi bi-check-circle-fill me-1"></i> SUCCESS</> : <><i className="bi bi-exclamation-triangle-fill me-1"></i> FAILED</>}
                  </span>
              </div>
          </div>

          <div className="col-12 col-md-4 col-xl">
              <div className="bg-input border border-secondary px-3 py-2 rounded-pill shadow-sm d-flex justify-content-between align-items-center h-100" title={`Reached at Age ${peakAge}`}>
                  <span className="small text-muted text-uppercase fw-bold ls-1 me-2">Peak NW <span className="d-none d-xxl-inline text-opacity-50">({peakAge})</span></span>
                  <span className="fs-6 fw-bold text-info text-nowrap">{formatCurrency(peakNW)}</span>
              </div>
          </div>

          <div className="col-12 col-md-4 col-xl">
              <div className="bg-input border border-secondary px-3 py-2 rounded-pill shadow-sm d-flex justify-content-between align-items-center h-100">
                  <span className="small text-muted text-uppercase fw-bold ls-1 me-2">Ret. Years</span>
                  <span className="fs-6 fw-bold text-primary text-nowrap">{retYears} Yrs</span>
              </div>
          </div>

          <div className="col-12 col-md-4 col-xl">
              <div className="bg-input border border-secondary px-3 py-2 rounded-pill shadow-sm d-flex justify-content-between align-items-center h-100">
                  <span className="small text-muted text-uppercase fw-bold ls-1 me-2">Tax Paid</span>
                  <span className="fs-6 fw-bold text-danger text-nowrap">{formatCurrency(totalTaxPaid)}</span>
              </div>
          </div>

          <div className="col-12 col-md-4 col-xl">
              <div className="bg-input border border-secondary px-3 py-2 rounded-pill shadow-sm d-flex justify-content-between align-items-center h-100">
                  <span className="small text-muted text-uppercase fw-bold ls-1 me-2 d-flex align-items-center">
                      Estate <InfoBtn title="After-Tax Estate" text="The final value of your portfolio after applying terminal taxes to remaining RRSPs and Capital Gains." />
                  </span>
                  <span className="fs-6 fw-bold text-success text-nowrap">{formatCurrency(finalEstate, finalYear.year)}</span>
              </div>
          </div>

          <div className="col-12 col-md-4 col-xl position-relative">
              <div 
                  className="bg-primary bg-opacity-10 border border-primary px-3 py-2 rounded-pill shadow-sm d-flex justify-content-center align-items-center h-100 transition-all hover-opacity-75 cursor-pointer"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
              >
                  <span className="small fw-bold text-uppercase ls-1 text-primary d-flex align-items-center text-nowrap">
                      {isExporting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-download fs-5 me-2"></i>}
                      Export
                  </span>
              </div>
              {exportMenuOpen && (
                  <>
                      <div className="position-fixed top-0 start-0 w-100 h-100" style={{zIndex: 1040}} onClick={() => setExportMenuOpen(false)}></div>
                      <ul className="dropdown-menu shadow-lg border-secondary rounded-3 show position-absolute mt-2" style={{zIndex: 1060, top: '100%', right: 0, minWidth: '150px'}}>
                          <li>
                              <button className="dropdown-item py-2 fw-bold text-primary" onClick={() => { setExportMenuOpen(false); exportToCSV(); }}>
                                  <i className="bi bi-filetype-csv me-2"></i> Export to CSV
                              </button>
                          </li>
                          <li>
                              <button className="dropdown-item py-2 fw-bold text-success" onClick={() => { setExportMenuOpen(false); exportToPNG(); }}>
                                  <i className="bi bi-image me-2"></i> Export to PNG
                              </button>
                          </li>
                      </ul>
                  </>
              )}
          </div>
      </div>

      <div className="rp-card border border-secondary rounded-4 overflow-hidden shadow-sm" ref={tableRef}>
        <div className="table-responsive hide-scrollbar" style={{ maxHeight: '75vh' }}>
          
          <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', minWidth: '1100px', width: '100%' }}>
            
            <thead className="surface-card" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <th className="py-3 ps-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '4%' }}></th>
                <th className="py-3 text-muted text-uppercase text-start ps-2 border-bottom border-secondary" style={{ width: '16%' }}>Year & Events</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '12%' }}>Phase</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '12%' }}>Ages</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '14%' }}>Net Income</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary text-danger" style={{ width: '14%' }}>Taxes</th>
                <th className="py-3 text-uppercase text-center border-bottom border-secondary" style={{ color: '#d97706', width: '14%' }}>Expenses</th>
                <th className="py-3 pe-4 text-muted text-uppercase text-center border-bottom border-secondary text-success" style={{ width: '14%' }}>Net Worth</th>
              </tr>
            </thead>
            
            <tbody>
              {(() => {
                const retAgeVal = Number(data.inputs.p1_retireAge) || 65;
                const firstDepYearObj = results.timeline.find((y: any) => y.p1Age >= retAgeVal && (y.liquidNW || 0) <= 1);
                const firstDepYear = firstDepYearObj ? firstDepYearObj.year : null;

                return results.timeline.map((y: any, index: number) => {
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
                const totalExpenses = (y.expenses || 0) + (y.mortgagePay || 0) + baseDebtRepayment + (y.eduExpense || 0);

                const respBal = (y.assetsP1?.resp || 0) + (y.assetsP2?.resp || 0);
                const totalNW = y.liquidNW + (y.reIncludedEq || 0); 
                
                let engineContributions = 0;
                if (y.flows && y.flows.contributions) {
                    engineContributions += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
                    if (isCouple) engineContributions += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
                }

                const totalSourcedRaw = totalIncome + (totalWithdrawals as number);
                const mandatoryBills = totalExpenses + totalTaxes;
                const netCashAvailable = totalSourcedRaw - mandatoryBills;
                
                let shortfall = 0;
                let actualInvested = engineContributions;
                let unallocated = 0;
                
                if (netCashAvailable < -0.5) {
                    shortfall = Math.abs(netCashAvailable);
                    actualInvested = 0;
                } else {
                    shortfall = 0;
                    actualInvested = Math.min(engineContributions, Math.max(0, netCashAvailable));
                    if (netCashAvailable > actualInvested + 0.5) {
                        unallocated = netCashAvailable - actualInvested;
                    }
                }

                const finalBalancedTotal = totalSourcedRaw + shortfall;

                const p1BeforeSplit = y.taxIncP1 + (y.pensionSplit?.p1ToP2 || 0) - (y.pensionSplit?.p2ToP1 || 0);
                const p2BeforeSplit = y.taxIncP2 + (y.pensionSplit?.p2ToP1 || 0) - (y.pensionSplit?.p1ToP2 || 0);

                const isRetAge = y.p1Age >= (Number(data.inputs.p1_retireAge) || 65);
                const isLiquidDepleted = isRetAge && (y.liquidNW || 0) <= 1;

                return (
                  <React.Fragment key={y.year}>
                    {y.year === firstDepYear && (
                      <tr key={`depleted-milestone-${y.year}`} className="bg-danger bg-opacity-20 border-top border-bottom border-danger">
                        <td colSpan={8} className="py-2 px-3 text-center text-danger fw-bold small">
                          <i className="bi bi-exclamation-triangle-fill text-warning me-2 fs-6"></i>
                          <span>PORTFOLIO DEPLETED AT AGE {y.p1Age} ({y.year}) — From this point forward, remaining Net Worth is 100% Real Estate Equity.</span>
                        </td>
                      </tr>
                    )}
                    <tr className={`cursor-pointer transition-all ${isExpanded ? 'bg-primary bg-opacity-10' : (isLiquidDepleted ? 'bg-danger bg-opacity-5' : '')}`} onClick={() => toggleRow(y.year)}>
                      <td className="py-3 ps-3 text-center text-primary border-bottom border-secondary border-opacity-25">
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} transition-all`}></i>
                      </td>
                      <td className="py-3 fw-bold text-start ps-2 text-main border-bottom border-secondary border-opacity-25">
                        <div className="d-flex align-items-center flex-wrap">
                            <span className="fs-6 me-1">{y.year}</span>
                            {isLiquidDepleted && (
                                <span className="badge bg-danger bg-opacity-25 text-danger border border-danger px-1 py-0.5 me-1" style={{ fontSize: '0.65rem' }}>
                                    Depleted
                                </span>
                            )}
                            {getEventIcons(y.events, y)}
                        </div>
                      </td>
                      <td className="py-3 text-center border-bottom border-secondary border-opacity-25 px-2">
                        {getPhaseBadge(y)}
                      </td>
                      <td className="py-3 text-center border-bottom border-secondary border-opacity-25">
                        {renderAges(y)}
                      </td>
                      <td className="py-3 text-center fw-medium border-bottom border-secondary border-opacity-25">{formatCurrency(totalIncome, y.year)}</td>
                      <td className="py-3 text-center text-danger fw-medium border-bottom border-secondary border-opacity-25">{formatCurrency(totalTaxes, y.year)}</td>
                      <td className="py-3 text-center fw-medium border-bottom border-secondary border-opacity-25" style={{ color: '#d97706' }}>{formatCurrency(totalExpenses, y.year)}</td>
                      <td className="py-3 pe-4 text-center border-bottom border-secondary border-opacity-25">
                        {isLiquidDepleted ? (
                            <div className="d-flex flex-column align-items-center lh-sm">
                                <span className="text-info fw-bold">{formatCurrency(totalNW, y.year)}</span>
                                <span className="text-danger fw-bold" style={{ fontSize: '0.65rem' }}>Liquid $0 (House Only)</span>
                            </div>
                        ) : (
                            <span className="text-success fw-bold fs-6">{formatCurrency(totalNW, y.year)}</span>
                        )}
                      </td>
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
                                                <span className="fw-medium text-success">{formatCurrency(y.windfall, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        {shortfall > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="text-danger fw-bold d-flex align-items-center">Shortfall (Cash Deficit) <InfoBtn align="left" title="Shortfall" text="Expenses exceeded total available cash flow and withdrawals. The simulation mathematically borrows this to keep running." /></span>
                                                <span className="fw-medium text-danger">+{formatCurrency(shortfall, y.year)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-3"></div>
                                </div>

                                <div className="col-12 col-lg-4 border-end border-secondary border-opacity-50 p-3 p-md-4 d-flex flex-column">
                                    <h6 className="fw-bold ls-1 mb-3 border-bottom border-secondary pb-2 d-flex align-items-center" style={{ color: '#d97706' }}>
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        <span className="text-uppercase">Cash Outflows</span>
                                        <InfoBtn align="center" title="Cash Outflows" text="All cash spent or allocated during the year, including living expenses, taxes, mortgage payments, education costs, and surplus cash saved into the portfolio." />
                                    </h6>
                                    
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold">Living Expenses</span><span className="fw-medium">{formatCurrency(y.expenses, y.year)}</span></div>
                                        {y.mortgagePay > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                <span className="d-flex align-items-center text-muted ms-2">Mortgage Payments <InfoBtn align="right" title="Mortgage" text="Principal and interest payments for the year based on your amortization schedule."/></span>
                                                <span>{formatCurrency(y.mortgagePay, y.year)}</span>
                                            </div>
                                        )}
                                        {y.eduExpense > 0 && (
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="text-muted ms-2 fw-bold text-info">Education Costs</span>
                                                <span className="fw-medium text-info">{formatCurrency(y.eduExpense, y.year)}</span>
                                            </div>
                                        )}
                                        {baseDebtRepayment > 0 && (
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="text-muted ms-2 fw-bold" style={{ color: '#d97706' }}>Large Purchases/Debt</span>
                                                <span className="fw-medium" style={{ color: '#d97706' }}>{formatCurrency(baseDebtRepayment, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="mb-2 mt-2 pt-2 border-top border-secondary border-opacity-25">
                                            <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                <span className="d-flex align-items-center text-muted fw-bold text-danger">P1 Taxes <InfoBtn align="right" title="P1 Tax Breakdown" text={buildTaxTooltip(y, 'p1', y.taxDetailsP1, y.taxIncP1, p1BeforeSplit, (y.discTaxSavingsP1||0) + (y.matchTaxSavingsP1||0), y.year)} /></span>
                                                <span className="text-danger fw-medium">{formatCurrency(y.taxP1 - (y.taxDetailsP1?.oas_clawback || 0), y.year)}</span>
                                            </div>
                                            {isCouple && (
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="d-flex align-items-center text-muted fw-bold text-danger">P2 Taxes <InfoBtn align="right" title="P2 Tax Breakdown" text={buildTaxTooltip(y, 'p2', y.taxDetailsP2, y.taxIncP2, p2BeforeSplit, (y.discTaxSavingsP2||0) + (y.matchTaxSavingsP2||0), y.year)} /></span>
                                                    <span className="text-danger fw-medium">{formatCurrency(y.taxP2 - (y.taxDetailsP2?.oas_clawback || 0), y.year)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {actualInvested > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center mt-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="d-flex align-items-center text-muted fw-bold text-primary">Surplus Invested <InfoBtn align="right" title="Contributions" text={buildContributionTooltip(y.flows, isCouple, y.year)} /></span>
                                                <span className="text-primary fw-medium">{formatCurrency(actualInvested, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        {unallocated > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="text-success fw-bold d-flex align-items-center">Unallocated Surplus <InfoBtn align="right" title="Surplus" text="Cash generated that wasn't spent or automatically routed into a tracked investment account." /></span>
                                                <span className="fw-medium text-success">+{formatCurrency(unallocated, y.year)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3"></div>
                                </div>

                                <div className="col-12 col-lg-4 p-3 p-md-4 d-flex flex-column">
                                    <h6 className="text-primary fw-bold ls-1 mb-3 border-bottom border-secondary pb-2 d-flex align-items-center">
                                        <i className="bi bi-piggy-bank me-2"></i>
                                        <span className="text-uppercase">End of Year Balances</span>
                                        <InfoBtn align="right" title="Account Balances" text="Values represent the portfolio balance at the <b>end of the year</b>, after accounting for market growth, contributions, and withdrawals." />
                                    </h6>
                                    
                                    <div className="flex-grow-1">
                                        {y.p1Alive && (
                                            <div className="mb-3">
                                                <div className="d-flex justify-content-between small mb-1"><span className="text-info fw-bold text-uppercase ls-1" style={{fontSize: '0.75rem'}}>P1 Portfolio</span><span className="text-info fw-bold">{formatCurrency(sumAccounts(y.assetsP1), y.year)}</span></div>
                                                
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">TFSA</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['tfsa'], ['TFSA', 'TFSA (Successor)'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency((y.assetsP1?.tfsa||0) + (y.assetsP1?.tfsa_successor||0), y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP1?.fhsa > 0 || y.flows?.contributions?.p1?.fhsa > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">FHSA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', ['fhsa'], ['FHSA'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.fhsa||0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p1Age || y.ageP1) < 72 && (y.assetsP1?.rrsp > 0 || y.flows?.contributions?.p1?.rrsp > 0)) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="d-flex align-items-center text-muted ms-2">RRSP</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', ['rrsp'], ['RRSP'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.rrsp || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p1Age || y.ageP1) >= 72 || y.assetsP1?.rrif_acct > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2 d-flex align-items-center">RRIF <InfoBtn title="RRIF" text="Registered Retirement Income Fund.<br>Converted from RRSP at age 71." align="left" /></span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['RRIF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.rrif_acct || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {y.assetsP1?.lirf > 0 && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIRA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['LIRF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.lirf || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {(y.assetsP1?.lif > 0 || y.flows?.withdrawals?.['P1 LIF'] > 0 || (y.lifTransferP1 || 0) > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIF</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['LIF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.lif || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2 d-flex align-items-center">Non-Reg <InfoBtn title="Non-Registered Account" text={`<span class='text-info fw-bold'>Taxable Portfolio.</span><br>Holdings generate capital gains, eligible Canadian dividends, and ordinary foreign dividends.<hr class="my-1 border-secondary">${buildYieldTooltip(y.invYieldMathP1, y.year, data.useRealDollars)}`} align="left" /></span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['nonreg'], ['Non-Reg'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.nonreg || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Cash</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['cash'], ['Cash'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.cash || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP1?.crypto > 0 || y.flows?.withdrawals?.['P1 Crypto'] > 0 || y.flows?.contributions?.p1?.crypto > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">Crypto</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', ['crypto'], ['Crypto'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.crypto || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {isCouple && y.p2Alive && (
                                            <div className="mb-2 border-top border-secondary border-opacity-25 pt-2">
                                                <div className="d-flex justify-content-between small mb-1"><span className="fw-bold text-uppercase ls-1" style={{fontSize: '0.75rem', color: 'var(--bs-purple)'}}>P2 Portfolio</span><span className="fw-bold" style={{color: 'var(--bs-purple)'}}>{formatCurrency(sumAccounts(y.assetsP2), y.year)}</span></div>
                                                
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">TFSA</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['tfsa'], ['TFSA', 'TFSA (Successor)'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency((y.assetsP2?.tfsa||0) + (y.assetsP2?.tfsa_successor||0), y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP2?.fhsa > 0 || y.flows?.contributions?.p2?.fhsa > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">FHSA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', ['fhsa'], ['FHSA'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.fhsa||0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p2Age || y.ageP2) < 72 && (y.assetsP2?.rrsp > 0 || y.flows?.contributions?.p2?.rrsp > 0)) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="d-flex align-items-center text-muted ms-2">RRSP</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', ['rrsp'], ['RRSP'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.rrsp || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {((y.p2Age || y.ageP2) >= 72 || y.assetsP2?.rrif_acct > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2 d-flex align-items-center">RRIF <InfoBtn title="RRIF" text="Registered Retirement Income Fund.<br>Converted from RRSP at age 71." align="left" /></span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['RRIF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.rrif_acct || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {y.assetsP2?.lirf > 0 && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIRA</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['LIRF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.lirf || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {(y.assetsP2?.lif > 0 || y.flows?.withdrawals?.['P2 LIF'] > 0 || (y.lifTransferP2 || 0) > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIF</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['LIF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.lif || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2 d-flex align-items-center">Non-Reg <InfoBtn title="Non-Registered Account" text={`<span class='text-info fw-bold'>Taxable Portfolio.</span><br>Holdings generate capital gains, eligible Canadian dividends, and ordinary foreign dividends.<hr class="my-1 border-secondary">${buildYieldTooltip(y.invYieldMathP2, y.year, data.useRealDollars)}`} align="left" /></span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['nonreg'], ['Non-Reg'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.nonreg || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Cash</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['cash'], ['Cash'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.cash || 0, y.year)}</span>
                                                    </div>
                                                </div>

                                                {(y.assetsP2?.crypto > 0 || y.flows?.withdrawals?.['P2 Crypto'] > 0 || y.flows?.contributions?.p2?.crypto > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">Crypto</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', ['crypto'], ['Crypto'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.crypto || 0, y.year)}</span>
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
                                                        <span className="text-info fw-bold text-end" style={{width: '75px'}}>{formatCurrency(respBal, y.year)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="d-flex justify-content-between small mb-1 mt-3">
                                            <span className="text-muted fw-bold">Liquid Portfolio Assets</span>
                                            <span className="fw-medium">{formatCurrency(y.liquidNW, y.year)}</span>
                                        </div>
                                        
                                        <div className="d-flex justify-content-between small mb-1">
                                            <span className="text-muted d-flex align-items-center">Real Estate Equity</span>
                                            <span className="d-flex align-items-center">
                                                {y.reIncludedEq > 0 && <span className="badge bg-secondary bg-opacity-25 text-muted border border-secondary fw-normal py-1 me-2" style={{fontSize: '0.6rem'}}>INCLUDED</span>}
                                                {formatCurrency((y.reIncludedEq || 0) + (y.reNonIncludedEq || 0), y.year)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3"></div>
                                </div>
                            </div>
                            
                            <div className="row g-0 bg-black bg-opacity-25 border-top border-secondary mt-auto" style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem' }}>
                                <div className="col-12 col-lg-4 p-3 px-md-4 d-flex justify-content-between align-items-center border-end border-secondary border-opacity-50">
                                    <span className="text-main fw-bold small">Total Cash Sourced</span>
                                    <span className="text-main fw-bold">{formatCurrency(finalBalancedTotal, y.year)}</span>
                                </div>
                                <div className="col-12 col-lg-4 p-3 px-md-4 d-flex justify-content-between align-items-center border-end border-secondary border-opacity-50">
                                    <span className="text-main fw-bold small">Total Cash Spent/Saved</span>
                                    <span className="text-main fw-bold">{formatCurrency(finalBalancedTotal, y.year)}</span>
                                </div>
                                <div className="col-12 col-lg-4 p-3 px-md-4 d-flex justify-content-between align-items-center">
                                    <span className="text-main fw-bold small">Total Net Worth</span>
                                    <span className="text-success fw-bold fs-6">{formatCurrency(totalNW, y.year)}</span>
                                </div>
                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              });
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}