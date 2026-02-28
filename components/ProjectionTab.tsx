import React, { useState } from 'react';
import { useFinance } from '../lib/FinanceContext';

// --- Smart Tooltip Component ---
const InfoBtn = ({ title, text, align = 'center' }: { title: string, text: string, align?: 'center'|'right'|'left' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { top: '140%', backgroundColor: 'var(--bg-card)', minWidth: '320px' };
    if (align === 'right') { posStyles.right = '0'; }
    else if (align === 'left') { posStyles.left = '0'; }
    else { posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }

    return (
        <div className="position-relative d-inline-flex align-items-center ms-2" style={{zIndex: open ? 1050 : 1}}>
            <button type="button" className="btn btn-link p-0 text-muted info-btn text-decoration-none" onClick={(e) => { e.preventDefault(); setOpen(!open); }} onBlur={() => setTimeout(() => setOpen(false), 200)}>
                <i className="bi bi-info-circle" style={{fontSize: '0.85rem'}}></i>
            </button>
            {open && (
                <div className="position-absolute border border-secondary rounded-3 shadow-lg p-3 text-none-uppercase" style={posStyles}>
                    <h6 className="fw-bold mb-2 text-main border-bottom border-secondary pb-1 text-capitalize" style={{fontSize: '0.85rem'}}>{title}</h6>
                    <div className="small text-muted text-start fw-normal text-none-uppercase" style={{fontSize: '0.75rem', lineHeight: '1.5', whiteSpace: 'normal', textTransform: 'none'}} dangerouslySetInnerHTML={{__html: text}}></div>
                </div>
            )}
        </div>
    );
};

// RRIF Minimum Withdrawal Factor Calculator
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

  const isCouple = data.mode === 'Couple';

  if (!results || !results.timeline || results.timeline.length === 0) {
    return (
      <div className="p-5 text-center text-muted">
        <i className="bi bi-hourglass-split fs-1 mb-3 d-block text-primary opacity-50"></i>
        <h5>Waiting for calculation...</h5>
        <p className="small">Please ensure your inputs are correct and the simulation has run.</p>
      </div>
    );
  }

  // --- Real Dollars Discounting ---
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

  const toggleRow = (year: number) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  const getEventIcons = (events: string[]) => {
      if (!events || events.length === 0) return null;
      return events.map((ev, i) => {
          let colorClass = "text-secondary";
          let icon = "bi-info-circle-fill";
          if (ev.includes('Retires')) { colorClass = "text-warning"; icon = "bi-cup-hot-fill"; }
          else if (ev.includes('Windfall')) { colorClass = "text-success"; icon = "bi-cash-coin"; }
          else if (ev.includes('Mortgage Paid')) { colorClass = "text-primary"; icon = "bi-house-check-fill"; }
          else if (ev.includes('Dies')) { colorClass = "text-danger"; icon = "bi-heartbreak-fill"; }
          else if (ev.includes('Leave')) { colorClass = "text-info"; icon = "bi-person-hearts"; }
          else if (ev.includes('Downsize')) { colorClass = "text-danger"; icon = "bi-house-down-fill"; }
          else if (ev.includes('RRSP')) { colorClass = "text-secondary"; icon = "bi-arrow-left-right"; }
          
          return (
              <i key={i} className={`bi ${icon} ${colorClass} ms-2 fs-5`} title={ev} style={{cursor: 'help'}}></i>
          );
      });
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
      if (maxAge <= slowgo) return <span className="badge bg-warning bg-opacity-25 text-warning border border-warning w-100 py-2">Slow-Go Phase</span>;
      return <span className="badge bg-danger bg-opacity-25 text-danger border border-danger w-100 py-2">No-Go Phase</span>;
  };

  const sumAccounts = (assets: any) => {
      if (!assets) return 0;
      return (assets.cash||0) + (assets.tfsa||0) + (assets.fhsa||0) + (assets.rrsp||0) + (assets.lirf||0) + (assets.lif||0) + (assets.rrif_acct||0) + (assets.nreg||0) + (assets.crypto||0);
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
      let net = added - withdrawn;
      if (Math.abs(net) < 1) return <span style={{width: '45px', display: 'inline-block'}}></span>; 
      
      net = getRealValue(net, year);
      const isPos = net > 0;
      const absNet = Math.abs(net);
      const formatted = absNet >= 1000 ? `${(absNet/1000).toFixed(1).replace('.0', '')}k` : Math.round(absNet);
      
      return (
          <span className={`fw-bold ${isPos ? 'text-success' : 'text-danger'} text-end me-2`} style={{fontSize: '0.65rem', width: '45px', display: 'inline-block'}}>
              ({isPos ? '+' : '-'}{formatted})
          </span>
      );
  };

  // --- Dynamic Math Tooltips ---
  const buildTaxTooltip = (taxData: any, taxableInc: number, refund: number, year: number) => {
      if (!taxData) return "No tax generated.";
      return `<b>Total Taxable Income:</b> $${formatStr(taxableInc, year)}<hr class="my-1 border-secondary"><b>Federal Tax:</b> $${formatStr(taxData.fed, year)}<br><b>Provincial Tax:</b> $${formatStr(taxData.prov, year)}<br><b>CPP/EI Premiums:</b> $${formatStr(taxData.cpp_ei, year)}<hr class="my-1 border-secondary"><b>Est. Tax Savings/Refund:</b> <span class="text-success">+$${formatStr(refund, year)}</span><br><b>Marginal Rate:</b> ${(taxData.margRate * 100).toFixed(1)}%`;
  };

  const buildYieldTooltip = (math: any, year: number) => {
      if (!math) return "No yield.";
      return `<b>Asset Balance:</b> $${formatStr(math.bal, year)}<br><b>Yield Rate:</b> ${(math.rate * 100).toFixed(2)}%<br><b>Cash Generated:</b> <span class="text-success">+$${formatStr(math.amt, year)}</span>`;
  };

  const buildOasTooltip = (gross: number, clawback: number, taxInc: number, year: number) => {
      if (clawback <= 0) return `<span class="text-info fw-bold">100% Taxable.</span><br><b>Gross OAS:</b> $${formatStr(gross, year)}<br>No clawback applied.`;
      return `<span class="text-info fw-bold">100% Taxable.</span><br><b>Gross OAS:</b> $${formatStr(gross, year)}<br><b>Net Income for OAS:</b> $${formatStr(taxInc, year)}<hr class="my-1 border-secondary"><span class="text-danger"><b>Clawback (15% over threshold):</b> -$${formatStr(clawback, year)}</span><br><b>Net OAS Received:</b> $${formatStr(gross - clawback, year)}`;
  };

  const buildRrspTooltip = (flows: any, playerKey: string, y: any, year: number) => {
      let totalAdded = flows?.contributions?.[playerKey]?.rrsp || 0;
      let empPortion = playerKey === 'p1' ? y.rrspMatchP1 : y.rrspMatchP2;
      let personalPortion = totalAdded - empPortion;
      if (totalAdded <= 0) return "No contributions this year.";
      return `<b>Total Added:</b> $${formatStr(totalAdded, year)}<hr class="my-1 border-secondary"><b>Employer Match:</b> $${formatStr(empPortion, year)}<br><b>Your Contribution:</b> $${formatStr(personalPortion, year)}`;
  };

  const buildContributionTooltip = (flows: any, isCouple: boolean, year: number) => {
      if (!flows || !flows.contributions) return "No contributions.";
      let lines: string[] = [];
      Object.entries(flows.contributions.p1).forEach(([k, v]) => { if ((v as number) > 0) lines.push(`P1 ${k.toUpperCase()}: $${formatStr(v as number, year)}`); });
      if (isCouple) Object.entries(flows.contributions.p2).forEach(([k, v]) => { if ((v as number) > 0) lines.push(`P2 ${k.toUpperCase()}: $${formatStr(v as number, year)}`); });
      return lines.length > 0 ? lines.join('<br>') : "No contributions.";
  };

  // Helper for P1/P2 Inflow Columns
  const renderPlayerInflows = (player: 'p1'|'p2', y: any, year: number, index: number, timeline: any[]) => {
      const isP1 = player === 'p1';
      const pUpper = player.toUpperCase();
      const age = isP1 ? (y.p1Age || y.ageP1) : (y.p2Age || y.ageP2);
      
      const salary = isP1 ? y.incomeP1 - (y.rrspMatchP1 || 0) : y.incomeP2 - (y.rrspMatchP2 || 0);
      const match = isP1 ? y.rrspMatchP1 : y.rrspMatchP2;
      const cpp = isP1 ? y.cppP1 : y.cppP2;
      const oas = isP1 ? y.oasP1 : y.oasP2;
      const db = isP1 ? y.dbP1 : y.dbP2;
      const invInc = isP1 ? y.invIncP1 : y.invIncP2;
      const taxInc = isP1 ? y.taxIncP1 : y.taxIncP2;
      const taxDetails = isP1 ? y.taxDetailsP1 : y.taxDetailsP2;
      const invYieldMath = isP1 ? y.invYieldMathP1 : y.invYieldMathP2;
      const cppStart = isP1 ? data.inputs.p1_cpp_start : data.inputs.p2_cpp_start;
      const refund = isP1 ? y.rrspRefundP1 : y.rrspRefundP2;

      const wdKeys = Object.keys(y.flows?.withdrawals || {}).filter(k => k.startsWith(pUpper) && y.flows.withdrawals[k] > 0);
      const taxableWds = wdKeys.filter(k => !k.includes('TFSA') && !k.includes('FHSA') && !k.includes('Cash'));
      const nonTaxWds = wdKeys.filter(k => k.includes('TFSA') || k.includes('FHSA') || k.includes('Cash'));

      const oasClawback = taxDetails?.oasClawback || 0;
      const oasGross = oas + oasClawback;

      // Extract prior year balance for RRIF Math
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
              
              {/* TAXABLE INFLOWS */}
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
              {oas > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">OAS <InfoBtn title="OAS Math" text={buildOasTooltip(oasGross, oasClawback, taxInc, year)} align="left" /></span>
                      <span>{formatCurrency(oas, year)}</span>
                  </div>
              )}
              {db > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="text-muted ms-2 d-flex align-items-center">Pension (DB) <InfoBtn title="Pension" text="<span class='text-info fw-bold'>100% Taxable.</span><br>Defined Benefit Pension payout." align="left" /></span>
                      <span>{formatCurrency(db, year)}</span>
                  </div>
              )}
              {invInc > 0 && (
                  <div className="d-flex justify-content-between small mb-1 mt-1">
                      <span className="d-flex align-items-center text-muted ms-2">Non-Reg Yield <InfoBtn title="Yield Calc" text={`<span class='text-info fw-bold'>Partially Taxable.</span><br>Taxed as interest, dividends, or capital gains.<hr class="my-1 border-secondary">${buildYieldTooltip(invYieldMath, year)}`} align="left" /></span>
                      <span className="text-success">+{formatCurrency(invInc, year)}</span>
                  </div>
              )}

              {/* TAXABLE WITHDRAWALS WITH EXPLICIT MATH */}
              {taxableWds.map(k => {
                  const val = y.flows.withdrawals[k];
                  const cleanName = k.replace(`${pUpper} `, '');
                  let info = "";
                  
                  if (k.includes('RRIF')) {
                      const factor = getRrifFactor(age - 1);
                      const minAmount = priorRrifBal * factor;
                      info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Mandatory minimum withdrawal based on age factor (${(factor*100).toFixed(2)}%).<hr class="my-1 border-secondary"><i>Math: $${formatStr(priorRrifBal, year)} × ${(factor * 100).toFixed(2)}% = $${formatStr(minAmount, year)}</i>`;
                  }
                  else if (k.includes('LIF')) {
                      info = `<span class='text-info fw-bold'>100% Taxable.</span><br>LIF withdrawal bound by provincial limits.`;
                  }
                  else if (k.includes('RRSP')) {
                      info = `<span class='text-info fw-bold'>100% Taxable.</span><br>Added directly to taxable income.`;
                  }
                  else if (k.includes('Non-Reg') || k.includes('Crypto')) {
                      const mathObj = y.wdBreakdown?.[player]?.[`${cleanName}_math`];
                      if (mathObj) {
                          info = `<span class='text-info fw-bold'>Partially Taxable.</span><br>Gross Withdrawal: $${formatStr(mathObj.wd, year)}<br>ACB Withdrawn: -$${formatStr(mathObj.acb, year)}<hr class="my-1 border-secondary"><b>Capital Gain:</b> $${formatStr(mathObj.gain, year)}<br><b>Taxable (50% Inclusion):</b> <span class="text-warning">+$${formatStr(mathObj.tax, year)}</span>`;
                      } else {
                          info = `<span class='text-info fw-bold'>Partially Taxable.</span><br>Withdrawal includes principal and capital gains. Only 50% of the capital gain is added to taxable income.`;
                      }
                  }

                  return (
                      <div className="d-flex justify-content-between small mb-1 align-items-center" key={k}>
                          <span className="text-muted ms-2 d-flex align-items-center">{cleanName} W/D <InfoBtn align="left" title={`${cleanName} Math`} text={info} /></span>
                          <span className="text-warning">+{formatCurrency(val, year)}</span>
                      </div>
                  );
              })}

              {/* NON-TAXABLE WITHDRAWALS / INFLOWS */}
              {(nonTaxWds.length > 0 || refund > 0) && (
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-25">
                      <div className="text-muted fw-bold small mb-1 ls-1" style={{fontSize: '0.65rem'}}>NON-TAXABLE INFLOWS</div>
                      
                      {refund > 0 && (
                          <div className="d-flex justify-content-between small mb-1 align-items-center">
                              <span className="text-muted ms-2 d-flex align-items-center">Tax Refund <InfoBtn align="left" title="Tax Refund" text="<span class='text-info fw-bold'>0% Taxable.</span><br>Refund generated from prior year RRSP contributions." /></span>
                              <span className="text-success">+{formatCurrency(refund, year)}</span>
                          </div>
                      )}

                      {nonTaxWds.map(k => {
                          const val = y.flows.withdrawals[k];
                          const cleanName = k.replace(`${pUpper} `, '');
                          const info = `<span class='text-info fw-bold'>0% Taxable.</span><br>Tax-free withdrawal. Does not affect taxable income.`;
                          return (
                              <div className="d-flex justify-content-between small mb-1 align-items-center" key={k}>
                                  <span className="text-muted ms-2 d-flex align-items-center">{cleanName} W/D <InfoBtn align="left" title={`${cleanName} Withdrawal`} text={info} /></span>
                                  <span className="text-warning">+{formatCurrency(val, year)}</span>
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
      <div className="d-flex justify-content-end mb-4">
          <div className="bg-input border border-secondary px-4 py-2 rounded-pill shadow-sm d-inline-flex align-items-center">
              <span className="small text-muted text-uppercase fw-bold ls-1 me-3">Final Estate Value</span>
              <span className="fs-5 fw-bold text-success">
                  {formatCurrency(results.dashboard.finalNetWorth, results.timeline[results.timeline.length - 1].year)}
              </span>
          </div>
      </div>

      <div className="rp-card border border-secondary rounded-4 overflow-hidden shadow-sm">
        <div className="table-responsive hide-scrollbar" style={{ maxHeight: '75vh' }}>
          
          <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', minWidth: '1100px', width: '100%' }}>
            
            <thead className="surface-card" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                <th className="py-3 ps-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '4%' }}></th>
                <th className="py-3 text-muted text-uppercase text-start ps-2 border-bottom border-secondary" style={{ width: '16%' }}>Year & Events</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '12%' }}>Phase</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '12%' }}>Ages</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary" style={{ width: '14%' }}>Total Income</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary text-danger" style={{ width: '14%' }}>Taxes</th>
                <th className="py-3 text-muted text-uppercase text-center border-bottom border-secondary text-warning" style={{ width: '14%' }}>Expenses</th>
                <th className="py-3 pe-4 text-muted text-uppercase text-center border-bottom border-secondary text-success" style={{ width: '14%' }}>Net Worth</th>
              </tr>
            </thead>
            
            <tbody>
              {results.timeline.map((y: any, index: number) => {
                const isExpanded = expandedYear === y.year;
                
                // Add RRSP Refunds into the Total Income UI visual
                const totalIncome = (y.incomeP1 || 0) + (y.incomeP2 || 0) + (y.cppP1 || 0) + (y.oasP1 || 0) + (y.dbP1 || 0) + (y.cppP2 || 0) + (y.oasP2 || 0) + (y.dbP2 || 0) + (y.windfall || 0) + (y.invIncP1 || 0) + (y.invIncP2 || 0) + (y.rrspRefundP1 || 0) + (y.rrspRefundP2 || 0);
                const totalTaxes = (y.taxP1 || 0) + (y.taxP2 || 0);
                const totalExpenses = (y.expenses || 0) + (y.mortgagePay || 0) + (y.debtRepayment || 0);
                const totalWithdrawals = y.flows && y.flows.withdrawals ? Object.values(y.flows.withdrawals).reduce((a: any, b: any) => a + b, 0) : 0;
                
                const respBal = (y.assetsP1?.resp || 0) + (y.assetsP2?.resp || 0);
                const totalNW = y.liquidNW + (y.reIncludedEq || 0); 
                
                let engineContributions = 0;
                if (y.flows && y.flows.contributions) {
                    engineContributions += Object.values(y.flows.contributions.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
                    if (isCouple) engineContributions += Object.values(y.flows.contributions.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
                }

                // Dynamic Balancing Logic
                const totalSourcedRaw = totalIncome + (totalWithdrawals as number);
                const totalSpentRaw = totalExpenses + totalTaxes + engineContributions;
                
                let shortfall = 0;
                let unallocated = 0;
                
                if (totalSourcedRaw < totalSpentRaw) shortfall = totalSpentRaw - totalSourcedRaw;
                else if (totalSourcedRaw > totalSpentRaw) unallocated = totalSourcedRaw - totalSpentRaw;

                const finalBalancedTotal = Math.max(totalSourcedRaw, totalSpentRaw);

                return (
                  <React.Fragment key={y.year}>
                    
                    {/* MAIN VISIBLE ROW */}
                    <tr 
                      className={`cursor-pointer transition-all ${isExpanded ? 'bg-primary bg-opacity-10' : ''}`} 
                      onClick={() => toggleRow(y.year)}
                    >
                      <td className="py-3 ps-3 text-center text-primary border-bottom border-secondary border-opacity-25">
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} transition-all`}></i>
                      </td>
                      <td className="py-3 fw-bold text-start ps-2 text-main border-bottom border-secondary border-opacity-25">
                        <div className="d-flex align-items-center">
                            <span className="fs-6">{y.year}</span>
                            {getEventIcons(y.events)}
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
                      <td className="py-3 text-center text-warning fw-medium border-bottom border-secondary border-opacity-25">{formatCurrency(totalExpenses, y.year)}</td>
                      <td className="py-3 pe-4 text-center text-success fw-bold fs-6 border-bottom border-secondary border-opacity-25">{formatCurrency(totalNW, y.year)}</td>
                    </tr>

                    {/* EXPANDED DETAILS ROW */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="p-0 border-bottom border-secondary border-opacity-50">
                          <div className="m-0 m-md-2 rounded-4 surface-card border border-primary border-opacity-25 shadow-inner slide-down overflow-hidden">
                            
                            {/* TOP SECTION: Details */}
                            <div className="row g-0 align-items-stretch">
                                
                                {/* Column 1: Cash Inflows */}
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
                                        
                                        {/* Balancer: Shortfall */}
                                        {shortfall > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="text-danger fw-bold d-flex align-items-center">Shortfall (Cash Deficit) <InfoBtn align="left" title="Shortfall" text="Expenses exceeded total available cash flow and withdrawals. The simulation mathematically borrows this to keep running." /></span>
                                                <span className="fw-medium text-danger">+{formatCurrency(shortfall, y.year)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Bottom Spacer to ensure equal height behavior before absolute bottom row */}
                                    <div className="mt-3"></div>
                                </div>

                                {/* Column 2: Cash Outflows */}
                                <div className="col-12 col-lg-4 border-end border-secondary border-opacity-50 p-3 p-md-4 d-flex flex-column">
                                    <h6 className="text-warning fw-bold ls-1 mb-3 border-bottom border-secondary pb-2 d-flex align-items-center">
                                        <i className="bi bi-box-arrow-right me-2"></i>
                                        <span className="text-uppercase">Cash Outflows</span>
                                        <InfoBtn align="center" title="Cash Outflows" text="All cash spent or allocated during the year, including living expenses, taxes, mortgage payments, and surplus cash saved into the portfolio." />
                                    </h6>
                                    
                                    <div className="flex-grow-1">
                                        <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold">Living Expenses</span><span className="fw-medium">{formatCurrency(y.expenses, y.year)}</span></div>
                                        {y.mortgagePay > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                <span className="d-flex align-items-center text-muted ms-2">Mortgage Payments <InfoBtn align="right" title="Mortgage" text="Principal and interest payments for the year based on your amortization schedule."/></span>
                                                <span>{formatCurrency(y.mortgagePay, y.year)}</span>
                                            </div>
                                        )}
                                        {y.debtRepayment > 0 && <div className="d-flex justify-content-between small mb-1"><span className="text-muted ms-2 text-warning">Large Purchases/Debt</span><span className="text-warning">{formatCurrency(y.debtRepayment, y.year)}</span></div>}
                                        
                                        <div className="mb-2 mt-2 pt-2 border-top border-secondary border-opacity-25">
                                            <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                <span className="d-flex align-items-center text-muted fw-bold text-danger">P1 Taxes <InfoBtn align="right" title="P1 Tax Breakdown" text={buildTaxTooltip(y.taxDetailsP1, y.taxIncP1, (y.discTaxSavingsP1||0) + (y.matchTaxSavingsP1||0), y.year)} /></span>
                                                <span className="text-danger fw-medium">{formatCurrency(y.taxP1, y.year)}</span>
                                            </div>
                                            {isCouple && (
                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="d-flex align-items-center text-muted fw-bold text-danger">P2 Taxes <InfoBtn align="right" title="P2 Tax Breakdown" text={buildTaxTooltip(y.taxDetailsP2, y.taxIncP2, (y.discTaxSavingsP2||0) + (y.matchTaxSavingsP2||0), y.year)} /></span>
                                                    <span className="text-danger fw-medium">{formatCurrency(y.taxP2, y.year)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {engineContributions > 0 && (
                                            <div className="d-flex justify-content-between small mb-1 align-items-center mt-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="d-flex align-items-center text-muted fw-bold text-primary">Surplus Invested <InfoBtn align="right" title="Contributions" text={buildContributionTooltip(y.flows, isCouple, y.year)} /></span>
                                                <span className="text-primary fw-medium">{formatCurrency(engineContributions, y.year)}</span>
                                            </div>
                                        )}
                                        
                                        {/* Balancer: Unallocated Surplus */}
                                        {unallocated > 0 && (
                                            <div className="d-flex justify-content-between small mb-2 pt-2 border-top border-secondary border-opacity-25">
                                                <span className="text-success fw-bold d-flex align-items-center">Unallocated Surplus <InfoBtn align="right" title="Surplus" text="Cash generated that wasn't spent or automatically routed into a tracked investment account." /></span>
                                                <span className="fw-medium text-success">+{formatCurrency(unallocated, y.year)}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3"></div>
                                </div>

                                {/* Column 3: Account Balances */}
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

                                                {/* STRICT HIDE: RRSP vanishes at age 72 */}
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

                                                {(y.assetsP1?.lif > 0 || y.flows?.withdrawals?.['P1 LIF'] > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIF</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p1', [], ['LIF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.lif || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Non-Reg</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p1', ['nreg'], ['Non-Reg'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP1?.nreg || 0, y.year)}</span>
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

                                                {/* STRICT HIDE: RRSP vanishes at age 72 */}
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

                                                {(y.assetsP2?.lif > 0 || y.flows?.withdrawals?.['P2 LIF'] > 0) && (
                                                    <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                        <span className="text-muted ms-2">LIF</span>
                                                        <div className="d-flex justify-content-end align-items-center">
                                                            {getAccountFlow(y, 'p2', [], ['LIF'], y.year)}
                                                            <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.lif || 0, y.year)}</span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="d-flex justify-content-between small mb-1 align-items-center">
                                                    <span className="text-muted ms-2">Non-Reg</span>
                                                    <div className="d-flex justify-content-end align-items-center">
                                                        {getAccountFlow(y, 'p2', ['nreg'], ['Non-Reg'], y.year)}
                                                        <span className="text-end" style={{width: '75px'}}>{formatCurrency(y.assetsP2?.nreg || 0, y.year)}</span>
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
                            
                            {/* ABSOLUTE BOTTOM ROW - HORIZONTALLY LOCKED ALIGNMENT */}
                            <div className="row g-0 bg-black bg-opacity-25 border-top border-secondary mt-auto">
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}