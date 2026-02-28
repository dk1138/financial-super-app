import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';

// --- Smart Tooltip Component ---
const InfoBtn = ({ title, text, align = 'center', direction = 'down' }: { title: string, text: string, align?: 'center'|'right'|'left', direction?: 'up'|'down' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { backgroundColor: 'var(--bg-card)', minWidth: '280px' };
    
    if (align === 'right') { posStyles.right = '0'; }
    else if (align === 'left') { posStyles.left = '0'; }
    else { posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }

    if (direction === 'up') { posStyles.bottom = '140%'; }
    else { posStyles.top = '140%'; }

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

export default function OptimizersTab() {
  const { data, updateInput } = useFinance();
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [maxSpendResult, setMaxSpendResult] = useState<any>(null);
  const [earliestRetResult, setEarliestRetResult] = useState<any>(null);
  const [cppResult, setCppResult] = useState<any>(null);
  const [rrspSweetSpot, setRrspSweetSpot] = useState<any>(null);
  const [tfsaRrspResult, setTfsaRrspResult] = useState<any>(null);

  // States for Interactive Tools
  const [sweetSpotTab, setSweetSpotTab] = useState<'p1'|'p2'>('p1');
  const [grossUpTab, setGrossUpTab] = useState<'p1'|'p2'>('p1');
  const [grossUpCash, setGrossUpCash] = useState<number>(5000);
  const [cppPasteText, setCppPasteText] = useState<string>('');
  const [cppAnalysis, setCppAnalysis] = useState<any>(null);
  
  const [toastMsg, setToastMsg] = useState('');

  const isCouple = data.mode === 'Couple';
  const stringifiedInputs = JSON.stringify(data.inputs);
  
  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 3000);
  };

  // Real Dollars Discounting Helper
  const inflation = (data.inputs.inflation_rate || 2.1) / 100;
  const getRealValue = (nominalValue: number, startYear: number, endYear: number) => {
      if (!data.useRealDollars) return nominalValue;
      const yearsOut = Math.max(0, endYear - startYear);
      return nominalValue / Math.pow(1 + inflation, yearsOut);
  };

  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Safe Sandbox Engine Runner - WITH EXPENSE MULTIPLIER FIX
  const runSandbox = (inputOverrides: any = {}, expenseMultiplier: number = 1.0) => {
      const clonedData = JSON.parse(JSON.stringify(data));
      Object.assign(clonedData.inputs, inputOverrides);
      
      // Physically multiply the expenses in the cloned data before running the engine
      if (expenseMultiplier !== 1.0) {
          Object.keys(clonedData.expensesByCategory).forEach(cat => {
              clonedData.expensesByCategory[cat].items.forEach((item: any) => {
                  if (item.curr) item.curr *= expenseMultiplier;
                  if (item.ret) item.ret *= expenseMultiplier;
                  if (item.trans) item.trans *= expenseMultiplier;
                  if (item.gogo) item.gogo *= expenseMultiplier;
                  if (item.slow) item.slow *= expenseMultiplier;
                  if (item.nogo) item.nogo *= expenseMultiplier;
              });
          });
      }

      const engine = new FinanceEngine(clonedData);
      return engine.runSimulation(true, null);
  };

  const runAllOptimizers = () => {
      setIsCalculating(true);

      setTimeout(() => {
          
          // -------------------------------------------------------------
          // 1. MAX SPEND OPTIMIZER (Die With Zero)
          // -------------------------------------------------------------
          let low = 0.05; // Test down to 5% of current expenses
          let high = 5.0; // Test up to 500% of current expenses
          let bestMultiplier = 0;
          let bestEstate = 0;
          let bestTimeline: any = null;

          for (let i = 0; i < 15; i++) { 
              const mid = (low + high) / 2;
              const timeline = runSandbox({}, mid);
              
              // STRICT FIX: The plan only succeeds if liquid cash NEVER drops below zero
              const isSuccess = timeline.every((y: any) => y.liquidNW > 0);

              if (isSuccess) {
                  bestMultiplier = mid;
                  bestEstate = timeline[timeline.length - 1].liquidNW + (timeline[timeline.length - 1].reIncludedEq || 0);
                  bestTimeline = timeline;
                  low = mid; // Can spend more
              } else {
                  high = mid; // Spent too much, ran out of money during life
              }
          }

          if (bestTimeline && bestMultiplier > 0) {
              const baseTimeline = runSandbox();
              
              // Find the first year of retirement to extract the baseline expense number
              const baseRetYear = baseTimeline.find((y: any) => y.p1Age >= data.inputs.p1_retireAge) || baseTimeline[baseTimeline.length - 1];
              const optRetYear = bestTimeline.find((y: any) => y.p1Age >= data.inputs.p1_retireAge) || bestTimeline[bestTimeline.length - 1];
              
              const startYear = baseTimeline[0].year;
              const baseSpend = getRealValue(baseRetYear.expenses || 0, startYear, baseRetYear.year);
              const optSpend = getRealValue(optRetYear.expenses || 0, startYear, optRetYear.year);
              
              setMaxSpendResult({
                  multiplier: bestMultiplier,
                  baseSpend: baseSpend,
                  optSpend: optSpend,
                  difference: optSpend - baseSpend,
                  finalEstate: getRealValue(bestEstate, startYear, bestTimeline[bestTimeline.length-1].year)
              });
          } else {
              // The plan failed even at 5% of their current expenses (Severe deficit)
              setMaxSpendResult({ difference: -999999, optSpend: 0 });
          }

          // -------------------------------------------------------------
          // 2. EARLIEST RETIREMENT AGE OPTIMIZER (Freedom Number)
          // -------------------------------------------------------------
          const baseP1Age = Number(data.inputs.p1_retireAge) || 65;
          const baseP2Age = isCouple ? (Number(data.inputs.p2_retireAge) || 65) : baseP1Age;
          const ageDiff = baseP2Age - baseP1Age;

          let earliestP1 = baseP1Age;
          let earliestP2 = baseP2Age;
          let earliestTimeline: any = null;
          
          // Verify base age actually works first!
          const baseCheck = runSandbox();
          const baseSuccess = baseCheck.every((y: any) => y.liquidNW > 0);

          if (!baseSuccess) {
              setEarliestRetResult({ failed: true });
          } else {
              for (let testAge = baseP1Age - 1; testAge >= 40; testAge--) {
                  const testP2 = isCouple ? testAge + ageDiff : testAge;
                  const overrides = { p1_retireAge: testAge, p2_retireAge: testP2 };
                  const timeline = runSandbox(overrides);
                  
                  // STRICT FIX: The plan must survive every single year
                  const isSuccess = timeline.every((y: any) => y.liquidNW > 0);

                  if (isSuccess) {
                      earliestP1 = testAge;
                      earliestP2 = testP2;
                      earliestTimeline = timeline;
                  } else {
                      break; // Reached the breaking point
                  }
              }

              if (earliestTimeline) {
                  const startYear = earliestTimeline[0].year;
                  const finalEstate = earliestTimeline[earliestTimeline.length - 1].liquidNW + (earliestTimeline[earliestTimeline.length - 1].reIncludedEq || 0);
                  setEarliestRetResult({
                      failed: false,
                      p1Age: earliestP1,
                      p2Age: earliestP2,
                      yearsSaved: baseP1Age - earliestP1,
                      finalEstate: getRealValue(finalEstate, startYear, earliestTimeline[earliestTimeline.length-1].year)
                  });
              } else {
                  setEarliestRetResult({ failed: false, yearsSaved: 0, p1Age: baseP1Age, p2Age: baseP2Age });
              }
          }

          // -------------------------------------------------------------
          // 3. CPP/OAS GRID SEARCH OPTIMIZER
          // -------------------------------------------------------------
          const cppResultsArr: any[] = [];
          for (let cpp = 60; cpp <= 70; cpp++) {
              for (let oas = 65; oas <= 70; oas++) {
                  const overrides = { 
                      p1_cpp_start: cpp, p2_cpp_start: cpp,
                      p1_oas_start: oas, p2_oas_start: oas 
                  };
                  const timeline = runSandbox(overrides);
                  const startYear = timeline[0].year;
                  const finalEstate = timeline[timeline.length - 1].liquidNW + (timeline[timeline.length - 1].reIncludedEq || 0);
                  
                  cppResultsArr.push({
                      cppAge: cpp,
                      oasAge: oas,
                      finalEstate: getRealValue(finalEstate, startYear, timeline[timeline.length-1].year)
                  });
              }
          }

          const sortedCpp = [...cppResultsArr].sort((a, b) => b.finalEstate - a.finalEstate);
          setCppResult({
              winner: sortedCpp[0],
              scenarios: sortedCpp.slice(0, 5)
          });

          // -------------------------------------------------------------
          // 4. RRSP TAX BRACKET SWEET SPOT (P1 & P2)
          // -------------------------------------------------------------
          const engine = new FinanceEngine(data);
          const prov = data.inputs.tax_province || 'ON';
          const taxDataObj = engine.getInflatedTaxData(1);
          
          const getSweetSpot = (incomeStr: string) => {
              const currentIncome = Number(incomeStr) || 0;
              if (currentIncome <= 15000) return null;
              
              const baseTaxObj = engine.calculateTaxDetailed(currentIncome, prov, taxDataObj, 0, 0, currentIncome, 1, 0);
              const baseMargRate = baseTaxObj.margRate;

              let bracketFloor = currentIncome;
              for(let inc = currentIncome; inc >= 15000; inc -= 500) {
                  let testRate = engine.calculateTaxDetailed(inc, prov, taxDataObj, 0, 0, inc, 1, 0).margRate;
                  if (baseMargRate - testRate >= 0.015) { 
                      bracketFloor = inc + 500;
                      break;
                  }
              }
              
              const optCont = currentIncome - bracketFloor;
              const optRefund = baseTaxObj.totalTax - engine.calculateTaxDetailed(bracketFloor, prov, taxDataObj, 0, 0, bracketFloor, 1, 0).totalTax;
              const nextRate = engine.calculateTaxDetailed(bracketFloor - 500, prov, taxDataObj, 0, 0, bracketFloor - 500, 1, 0).margRate;

              return {
                  income: currentIncome,
                  marginalRate: baseMargRate,
                  contribution: optCont,
                  refund: optRefund,
                  nextRate: nextRate
              };
          };

          setRrspSweetSpot({
              p1: getSweetSpot(data.inputs.p1_income),
              p2: isCouple ? getSweetSpot(data.inputs.p2_income) : null
          });

          // -------------------------------------------------------------
          // 5. TFSA vs RRSP ANALYZER
          // -------------------------------------------------------------
          const p1CurrentInc = Number(data.inputs.p1_income) || 0;
          const p1CurrentTax = engine.calculateTaxDetailed(p1CurrentInc, prov, taxDataObj, 0, 0, p1CurrentInc, 1, 0);
          const currMarginal = p1CurrentTax.margRate;

          let totalRetTax = 0;
          let totalRetInc = 0;
          const baseTimelineData = runSandbox();
          
          baseTimelineData.forEach((y: any) => {
              if (y.p1Age >= (Number(data.inputs.p1_retireAge) || 65)) {
                  totalRetTax += y.taxP1;
                  totalRetInc += y.taxIncP1;
              }
          });
          
          const avgRetTaxRate = totalRetInc > 0 ? totalRetTax / totalRetInc : 0;
          
          setTfsaRrspResult({
              currentMarginal: currMarginal,
              avgRetTaxRate: avgRetTaxRate,
              winner: currMarginal >= avgRetTaxRate ? 'RRSP' : 'TFSA'
          });

          setIsCalculating(false);
      }, 50);
  };

  useEffect(() => {
      setIsCalculating(true);
      const timer = setTimeout(() => {
          runAllOptimizers();
      }, 500);
      return () => clearTimeout(timer);
  }, [stringifiedInputs]);

  const applyEarliestRetirement = () => {
      if (earliestRetResult && !earliestRetResult.failed) {
          updateInput('p1_retireAge', earliestRetResult.p1Age);
          if (isCouple) updateInput('p2_retireAge', earliestRetResult.p2Age);
          showToast("Retirement ages successfully applied!");
      }
  };

  const applyCppStrategy = () => {
      if (cppResult && cppResult.winner) {
          const optCpp = cppResult.winner.cppAge;
          const optOas = cppResult.winner.oasAge;
          updateInput('p1_cpp_start', optCpp);
          updateInput('p1_oas_start', optOas);
          if (isCouple) {
              updateInput('p2_cpp_start', optCpp);
              updateInput('p2_oas_start', optOas);
          }
          showToast(`CPP set to ${optCpp}, OAS set to ${optOas}!`);
      }
  };

  // --- Tool 6: CPP Analyzer Logic ---
  const analyzeCPP = () => {
      const regex = /(19[5-9]\d|20[0-2]\d)[\s\t]+[\$]?([\d,]+(?:\.\d{2})?)/g;
      let match;
      const records = [];
      while ((match = regex.exec(cppPasteText)) !== null) {
          records.push({
              year: parseInt(match[1]),
              earnings: parseFloat(match[2].replace(/,/g, ''))
          });
      }
      
      if(records.length === 0) {
          setCppAnalysis({ error: true });
          return;
      }
      
      records.sort((a,b) => b.earnings - a.earnings); 
      const dropCount = Math.min(8, Math.floor(records.length * 0.17));
      const keepCount = records.length - dropCount;
      const kept = records.slice(0, keepCount);
      
      const sumEarnings = kept.reduce((s, r) => s + r.earnings, 0);
      const avg = sumEarnings / keepCount;

      const ratio = Math.min(1, avg / 65000); 
      const projected = 16300 * ratio; 

      setCppAnalysis({ error: false, records: records.length, dropped: dropCount, average: avg, projected });
  };

  // RRSP Gross Up Active Math
  const activeSweetSpot = rrspSweetSpot?.[grossUpTab];
  const activeMargRate = activeSweetSpot ? activeSweetSpot.marginalRate : 0.40;
  const grossedUpAmount = grossUpCash / (1 - activeMargRate);
  const loanAmount = grossedUpAmount - grossUpCash;
  const expectedRefund = grossedUpAmount * activeMargRate;

  const currentSweetSpot = rrspSweetSpot?.[sweetSpotTab];

  return (
    <div className="p-3 p-md-4 pb-5 mb-5 position-relative">
      
      {/* Toast Notification */}
      {toastMsg && (
          <div className="position-fixed bottom-0 start-50 translate-middle-x pb-4 transition-all" style={{zIndex: 1060}}>
              <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                  <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                  {toastMsg}
              </div>
          </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-primary mb-0 d-flex align-items-center">
              <i className="bi bi-magic me-3"></i> Smart Optimizer
          </h5>
          {isCalculating && <span className="badge bg-primary bg-opacity-25 text-primary border border-primary rounded-pill px-3 py-2"><span className="spinner-border spinner-border-sm me-2"></span> Analyzing...</span>}
      </div>

      <div className="row g-4 mb-5">
          
          {/* Tool 1: Die With Zero */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}></div>}
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-bullseye fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-success mb-0 text-uppercase ls-1" style={{fontSize: '1rem'}}>Die With Zero</h5>
                  </div>
                  <p className="text-muted small mb-4">Calculates the absolute maximum lifestyle you can afford every year without running out of money before your life expectancy.</p>

                  <div className="flex-grow-1 d-flex flex-column justify-content-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4">
                      {maxSpendResult ? (
                          maxSpendResult.difference > 0 ? (
                              <>
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Max Safe Retirement Spend</span>
                                  <span className="fs-1 fw-bolder text-success mb-2">{formatCurrency(maxSpendResult.optSpend)} <span className="fs-5 text-muted fw-normal">/yr</span></span>
                                  <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-3 py-2 mx-auto">
                                      <i className="bi bi-arrow-up-circle-fill me-2"></i>You can spend {formatCurrency(maxSpendResult.difference)} more per year!
                                  </span>
                              </>
                          ) : (
                              <>
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Current Plan Status</span>
                                  <span className="fs-3 fw-bolder text-danger mb-2">Overspending</span>
                                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-3 py-2 mx-auto text-wrap" style={{lineHeight: 1.5}}>
                                      <i className="bi bi-exclamation-triangle-fill me-2"></i>You need to cut expenses by {formatCurrency(Math.abs(maxSpendResult.difference))} /yr to survive.
                                  </span>
                              </>
                          )
                      ) : (
                          <span className="text-muted fst-italic">Awaiting calculation...</span>
                      )}
                  </div>

                  <span className="small text-muted text-center fst-italic mt-auto mb-2">
                      <i className="bi bi-info-circle me-1"></i> To apply this, adjust Lifestyle Expenses on the Inputs tab.
                  </span>
              </div>
          </div>

          {/* Tool 2: Freedom Number */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}></div>}
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-calendar-heart fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-info mb-0 text-uppercase ls-1" style={{fontSize: '1rem'}}>Freedom Number</h5>
                  </div>
                  <p className="text-muted small mb-4">Finds the earliest possible age you can trigger retirement based on your current savings rate and projected expenses.</p>

                  <div className="flex-grow-1 d-flex flex-column justify-content-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4">
                      {earliestRetResult ? (
                          earliestRetResult.failed ? (
                              <>
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Earliest Safe Retirement</span>
                                  <span className="fs-3 fw-bolder text-danger mb-2">Target Unreachable</span>
                                  <span className="small text-muted px-2">Your current plan fails even at your selected retirement age. Reduce expenses or save more to unlock this tool.</span>
                              </>
                          ) : earliestRetResult.yearsSaved > 0 ? (
                              <>
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Earliest Safe Retirement</span>
                                  <span className="fs-1 fw-bolder text-info mb-2">Age {earliestRetResult.p1Age} {isCouple && `/ ${earliestRetResult.p2Age}`}</span>
                                  <span className="badge bg-info bg-opacity-25 text-info border border-info rounded-pill px-3 py-2 mx-auto">
                                      <i className="bi bi-stars me-2"></i>You can retire {earliestRetResult.yearsSaved} years earlier!
                                  </span>
                              </>
                          ) : (
                              <>
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Earliest Safe Retirement</span>
                                  <span className="fs-2 fw-bolder text-muted mb-2">Age {earliestRetResult.p1Age} {isCouple && `/ ${earliestRetResult.p2Age}`}</span>
                                  <span className="small text-muted text-warning fw-bold px-2 mt-2"><i className="bi bi-check-circle-fill me-2"></i>Your current target is the absolute earliest you can safely retire.</span>
                              </>
                          )
                      ) : (
                          <span className="text-muted fst-italic">Awaiting calculation...</span>
                      )}
                  </div>

                  <div className="mt-auto d-flex justify-content-center w-100">
                      <button 
                          className="btn btn-outline-info fw-bold w-100 d-flex align-items-center justify-content-center" 
                          disabled={!earliestRetResult || earliestRetResult.failed || earliestRetResult.yearsSaved <= 0}
                          onClick={applyEarliestRetirement}
                      >
                          <i className="bi bi-box-arrow-in-down-right me-2"></i> Apply to Plan
                      </button>
                  </div>
              </div>
          </div>

          {/* Tool 3: CPP Strategy */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}></div>}
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0, color:'var(--bs-purple)', backgroundColor: 'rgba(111, 66, 193, 0.25)'}}>
                          <i className="bi bi-bank fs-4"></i>
                      </div>
                      <h5 className="fw-bold mb-0 text-uppercase ls-1" style={{fontSize: '1rem', color:'var(--bs-purple)'}}>CPP/OAS Grid Search</h5>
                  </div>
                  <p className="text-muted small mb-4">Tests all 66 combinations of taking CPP (60-70) and OAS (65-70) to find the absolute highest final estate.</p>

                  <div className="flex-grow-1 d-flex flex-column justify-content-center p-3 bg-input border border-secondary rounded-4 shadow-inner mb-4">
                      {cppResult ? (
                          <div className="d-flex flex-column w-100 gap-3">
                              {cppResult.scenarios.map((sc: any, idx: number) => {
                                  const isWinner = idx === 0;
                                  const pctOfWinner = (sc.finalEstate / cppResult.winner.finalEstate) * 100;
                                  return (
                                      <div key={idx} className="d-flex flex-column w-100">
                                          <div className="d-flex justify-content-between align-items-center small mb-1">
                                              <span className={`fw-bold ${isWinner ? 'text-purple' : 'text-muted'}`} style={isWinner ? {color:'var(--bs-purple)'} : {}}>
                                                  CPP: {sc.cppAge} <span className="mx-1 opacity-25">|</span> OAS: {sc.oasAge} {isWinner && <i className="bi bi-trophy-fill ms-2"></i>}
                                              </span>
                                              <span className={`fw-bold ${isWinner ? 'text-main' : 'text-muted'}`}>{formatCurrency(sc.finalEstate)}</span>
                                          </div>
                                          <div className="w-100 bg-black bg-opacity-25 rounded-pill overflow-hidden shadow-inner" style={{height: '6px'}}>
                                              <div className="h-100 rounded-pill transition-all" style={{width: `${Math.max(2, pctOfWinner)}%`, backgroundColor: isWinner ? 'var(--bs-purple)' : '#6c757d'}}></div>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      ) : (
                          <span className="text-muted fst-italic text-center">Awaiting calculation...</span>
                      )}
                  </div>

                  <div className="mt-auto d-flex justify-content-center w-100">
                      <button 
                          className="btn fw-bold w-100 d-flex align-items-center justify-content-center text-white" 
                          style={{backgroundColor: 'var(--bs-purple)', borderColor: 'var(--bs-purple)'}}
                          disabled={!cppResult}
                          onClick={applyCppStrategy}
                      >
                          <i className="bi bi-box-arrow-in-down-right me-2"></i> Apply Winner
                      </button>
                  </div>
              </div>
          </div>

          {/* Tool 4: Optimal RRSP Sweet Spot */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}></div>}
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-arrow-down-up fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1" style={{fontSize: '1rem'}}>Tax Bracket Sweet Spot</h5>
                  </div>
                  <p className="text-muted small mb-4">Calculates the exact RRSP contribution needed to ride your current marginal tax bracket all the way to the floor before it drops.</p>

                  {isCouple && (
                      <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${sweetSpotTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setSweetSpotTab('p1')}>Player 1</button>
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${sweetSpotTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setSweetSpotTab('p2')}>Player 2</button>
                      </div>
                  )}

                  <div className="flex-grow-1 d-flex flex-column justify-content-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4">
                      {currentSweetSpot && currentSweetSpot.contribution > 0 ? (
                          <>
                              <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Optimal Contribution</span>
                              <span className="fs-2 fw-bolder text-primary mb-2">{formatCurrency(currentSweetSpot.contribution)}</span>
                              
                              <div className="d-flex justify-content-between w-100 px-3 mt-3 pt-3 border-top border-secondary border-opacity-50">
                                  <div className="d-flex flex-column text-start">
                                      <span className="small text-muted fw-bold">Marginal Rate</span>
                                      <span className="fw-bold text-danger">{(currentSweetSpot.marginalRate * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="d-flex flex-column text-end">
                                      <span className="small text-muted fw-bold">Tax Refund</span>
                                      <span className="fw-bold text-success">+{formatCurrency(currentSweetSpot.refund)}</span>
                                  </div>
                              </div>
                              <span className="small text-muted mt-3 fst-italic"><i className="bi bi-info-circle me-1"></i> Contributing more drops your refund rate to {(currentSweetSpot.nextRate * 100).toFixed(1)}%.</span>
                          </>
                      ) : (
                          <span className="text-muted fst-italic">You are already in the lowest tax bracket, or income is $0.</span>
                      )}
                  </div>
              </div>
          </div>

          {/* Tool 5: RRSP Gross-Up Calculator */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-piggy-bank-fill fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1" style={{fontSize: '1rem'}}>RRSP Gross-Up Optimizer</h5>
                  </div>
                  <p className="text-muted small mb-4">Calculate how to maximize your RRSP using a short-term loan that is completely paid off by the resulting tax refund.</p>

                  {isCouple && (
                      <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${grossUpTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setGrossUpTab('p1')}>Player 1</button>
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${grossUpTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setGrossUpTab('p2')}>Player 2</button>
                      </div>
                  )}

                  <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4">
                      
                      <div className="d-flex justify-content-between align-items-center mb-4">
                          <label className="fw-bold text-muted small">Cash on Hand:</label>
                          <div className="input-group input-group-sm w-50 shadow-sm">
                              <span className="input-group-text bg-secondary border-secondary text-white">$</span>
                              <input type="number" className="form-control bg-dark border-secondary text-white text-end fw-bold" value={grossUpCash} onChange={(e) => setGrossUpCash(Number(e.target.value) || 0)} />
                          </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="text-muted fw-bold small">1. Borrow Short-Term Loan</span>
                          <span className="fw-bold text-danger">+{formatCurrency(loanAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                          <span className="text-muted fw-bold small">2. Total RRSP Contribution</span>
                          <span className="fw-bold text-main">{formatCurrency(grossedUpAmount)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                          <span className="text-muted fw-bold small">3. Resulting Tax Refund</span>
                          <span className="fw-bold text-success">+{formatCurrency(expectedRefund)}</span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                          <span className="text-muted fw-bold small">4. Pay Off Loan</span>
                          <span className="fw-bold text-danger">-{formatCurrency(loanAmount)}</span>
                      </div>
                  </div>
                  <span className="small text-muted text-center fst-italic mt-auto mb-2"><i className="bi bi-info-circle me-1"></i> Based on your current {(activeMargRate * 100).toFixed(1)}% marginal rate.</span>
              </div>
          </div>
          
          {/* Tool 7: TFSA vs RRSP Analyzer */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}></div>}
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-scale fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1" style={{fontSize: '1rem'}}>TFSA vs RRSP Analyzer</h5>
                  </div>
                  <p className="text-muted small mb-4">Compares your current marginal tax rate against your projected effective tax rate in retirement to tell you where your next dollar should go.</p>

                  <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4">
                      {tfsaRrspResult ? (
                          <>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="text-muted fw-bold small">Current Marginal Rate:</span>
                                  <span className="fw-bold text-danger">{(tfsaRrspResult.currentMarginal * 100).toFixed(1)}%</span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom border-secondary border-opacity-50">
                                  <span className="text-muted fw-bold small">Est. Retirement Tax Rate:</span>
                                  <span className="fw-bold text-info">{(tfsaRrspResult.avgRetTaxRate * 100).toFixed(1)}%</span>
                              </div>
                              <div className="text-center mt-2">
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-1 d-block">Mathematical Winner</span>
                                  <span className={`fs-2 fw-bolder ${tfsaRrspResult.winner === 'RRSP' ? 'text-primary' : 'text-success'}`}>{tfsaRrspResult.winner}</span>
                              </div>
                          </>
                      ) : (
                          <span className="text-muted fst-italic text-center">Awaiting calculation...</span>
                      )}
                  </div>
                  <span className="small text-muted text-center fst-italic mt-auto mb-2"><i className="bi bi-info-circle me-1"></i> If current rate &gt; retirement rate, RRSP wins. Otherwise TFSA.</span>
              </div>
          </div>

          {/* Tool 6: CPP Smart Importer */}
          <div className="col-12 col-xl-4">
              <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                  
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-secondary bg-opacity-25 text-white rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-file-earmark-spreadsheet fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-white mb-0 text-uppercase ls-1" style={{fontSize: '1rem'}}>CPP Smart Importer</h5>
                  </div>
                  <p className="text-muted small mb-3">Paste your Service Canada earnings table here. We will apply the 17% drop-out rule to project your base benefit.</p>

                  <div className="flex-grow-1 d-flex flex-column mb-3">
                      <textarea 
                          className="form-control bg-input border-secondary text-muted small flex-grow-1 shadow-inner mb-3" 
                          placeholder="Paste earnings table here (Year & Amount)..."
                          style={{resize: 'none', minHeight: '80px'}}
                          value={cppPasteText}
                          onChange={(e) => setCppPasteText(e.target.value)}
                      ></textarea>
                      <button className="btn btn-sm btn-outline-secondary fw-bold" onClick={analyzeCPP} disabled={!cppPasteText}>
                          <i className="bi bi-cpu-fill me-2"></i> Analyze Data
                      </button>
                  </div>

                  {cppAnalysis && (
                      cppAnalysis.error ? (
                          <div className="alert alert-danger py-2 small fw-bold text-center mb-0"><i className="bi bi-exclamation-triangle-fill me-2"></i>Could not parse valid years/earnings.</div>
                      ) : (
                          <div className="bg-input border border-secondary rounded-3 p-3 mt-auto">
                              <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold">Years Processed:</span><span className="text-main">{cppAnalysis.records}</span></div>
                              <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold">Years Dropped (17% rule):</span><span className="text-danger">-{cppAnalysis.dropped}</span></div>
                              <div className="d-flex justify-content-between small mb-2 pb-2 border-bottom border-secondary border-opacity-50"><span className="text-muted fw-bold">Lifetime Average (Kept):</span><span className="text-main">{formatCurrency(cppAnalysis.average)}</span></div>
                              <div className="d-flex justify-content-between align-items-center">
                                  <span className="text-muted fw-bold small text-uppercase ls-1">Projected Base CPP</span>
                                  <span className="fs-5 fw-bold text-success">~{formatCurrency(cppAnalysis.projected)}</span>
                              </div>
                          </div>
                      )
                  )}
              </div>
          </div>

      </div>
    </div>
  );
}