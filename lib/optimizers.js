import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FINANCIAL_CONSTANTS } from '../lib/config';

// --- Reusable Input Components ---
const CurrencyInput = ({ value, onChange, className, placeholder, disabled }: any) => {
    const [localValue, setLocalValue] = useState('');
    useEffect(() => {
        if (value !== undefined && value !== '' && value !== null) { setLocalValue(Number(Math.round(value)).toLocaleString('en-US')); } else { setLocalValue(''); }
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let rawStr = e.target.value;
        const rawValue = rawStr.replace(/[^0-9]/g, ''); 
        if (rawValue === '') onChange(0); else onChange(parseInt(rawValue, 10));
    };
    return (
        <div className="position-relative w-100 d-flex align-items-center">
            <span className="position-absolute text-muted fw-bold" style={{ left: '12px', fontSize: '0.9em', pointerEvents: 'none' }}>$</span>
            <input type="text" className={`${className} text-end shadow-sm border border-secondary bg-input text-main ${disabled ? 'opacity-50' : ''}`} style={{ paddingLeft: '28px', paddingRight: '12px', fontWeight: '600', outline: 'none' }} value={localValue} onChange={handleChange} placeholder={placeholder} disabled={disabled} />
        </div>
    );
};

const PercentInput = ({ value, onChange, className, disabled }: any) => {
    const [focused, setFocused] = useState(false);
    let displayValue = value ?? '';
    if (!focused && displayValue !== '') displayValue = Number(displayValue).toFixed(2);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        onChange(val === '' ? 0 : parseFloat(val));
    };
    return (
        <div className="position-relative w-100 d-flex align-items-center">
            <input type="number" step="0.01" className={`${className} text-end shadow-sm border border-secondary bg-input text-main ${disabled ? 'opacity-50' : ''}`} style={{ paddingRight: '28px', fontWeight: '600', outline: 'none' }} value={focused ? (value ?? '') : displayValue} onChange={handleChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} disabled={disabled} />
            <span className="position-absolute text-muted fw-bold" style={{ right: '12px', fontSize: '0.9em', pointerEvents: 'none' }}>%</span>
        </div>
    );
};

export default function OptimizersTab() {
  const { data, results } = useFinance();
  const [activeTool, setActiveTool] = useState('ccb');

  // Helper to get formatting
  const fmt = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

  // Auto-extracted Context Variables
  const householdIncome = (Number(data.inputs.p1_income) || 0) + (data.mode === 'Couple' ? (Number(data.inputs.p2_income) || 0) : 0);
  const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate * 100 || 30;
  const kidsCount = data.dependents?.length || 0;
  const firstMortgage = data.properties?.find((p: any) => p.mortgage > 0);

  // ==========================================
  // TOOL 1: CCB Maximizer
  // ==========================================
  const [ccbIncome, setCcbIncome] = useState(householdIncome || 100000);
  const [ccbKidsUnder6, setCcbKidsUnder6] = useState(kidsCount > 0 ? kidsCount : 1);
  const [ccbKidsOver6, setCcbKidsOver6] = useState(0);
  const [ccbRrspContrib, setCcbRrspContrib] = useState(5000);

  const calcCCB = (netIncome: number, u6: number, o6: number) => {
      const maxU6 = 7437; const maxO6 = 6275;
      const t1 = 34863; const t2 = 75537;
      
      const totalKids = u6 + o6;
      if (totalKids === 0) return 0;
      
      let maxBenefit = (u6 * maxU6) + (o6 * maxO6);
      let rateIndex = Math.min(totalKids - 1, 3);
      
      const rate1 = [0.07, 0.135, 0.19, 0.23];
      const rate2 = [0.032, 0.057, 0.08, 0.095];
      
      let reduction = 0;
      if (netIncome > t2) {
          reduction = ((t2 - t1) * rate1[rateIndex]) + ((netIncome - t2) * rate2[rateIndex]);
      } else if (netIncome > t1) {
          reduction = (netIncome - t1) * rate1[rateIndex];
      }
      return Math.max(0, maxBenefit - reduction);
  };

  const currentCCB = calcCCB(ccbIncome, ccbKidsUnder6, ccbKidsOver6);
  const newCCB = calcCCB(ccbIncome - ccbRrspContrib, ccbKidsUnder6, ccbKidsOver6);
  const ccbBoost = newCCB - currentCCB;
  const ccbTaxRefund = ccbRrspContrib * (p1Marginal / 100);
  const ccbTotalROI = ((ccbBoost + ccbTaxRefund) / (ccbRrspContrib || 1)) * 100;

  // ==========================================
  // TOOL 2: Pay Down Mortgage vs Invest
  // ==========================================
  const [mviLumpSum, setMviLumpSum] = useState(10000);
  const [mviMortgageRate, setMviMortgageRate] = useState(firstMortgage?.rate || 4.5);
  const [mviInvestReturn, setMviInvestReturn] = useState(7.0);
  const [mviYears, setMviYears] = useState(10);
  const [mviTaxRate, setMviTaxRate] = useState(0); // 0 = TFSA, >0 = Non-Reg

  const mviInvestVal = mviLumpSum * Math.pow(1 + ((mviInvestReturn / 100) * (1 - (mviTaxRate / 100))), mviYears);
  const mviMortgageVal = mviLumpSum * Math.pow(1 + (mviMortgageRate / 100), mviYears);
  const mviDiff = mviInvestVal - mviMortgageVal;

  // ==========================================
  // TOOL 3: FHSA vs RRSP HBP
  // ==========================================
  const [fhsaAmount, setFhsaAmount] = useState(8000);
  const [fhsaTaxRate, setFhsaTaxRate] = useState(p1Marginal);
  const [fhsaYears, setFhsaYears] = useState(5);
  const [fhsaReturn, setFhsaReturn] = useState(6.0);

  const fhsaGrowth = fhsaAmount * Math.pow(1 + (fhsaReturn/100), fhsaYears);
  const fhsaTaxRefund = fhsaAmount * (fhsaTaxRate / 100);
  const hbpRepaymentCost = (fhsaAmount / 15) * (1 / (1 - (fhsaTaxRate/100))) * 15; // Pre-tax income needed to repay

  // ==========================================
  // TOOL 4: Smith Maneuver
  // ==========================================
  const [smLoan, setSmLoan] = useState(100000);
  const [smHelocRate, setSmHelocRate] = useState(7.2);
  const [smInvestReturn, setSmInvestReturn] = useState(8.0);
  const [smTaxRate, setSmTaxRate] = useState(p1Marginal);

  const smEffectiveBorrowingRate = smHelocRate * (1 - (smTaxRate / 100));
  const smSpread = smInvestReturn - smEffectiveBorrowingRate;
  const smAnnualProfit = smLoan * (smSpread / 100);

  // ==========================================
  // TOOL 5: Emergency Fund Sizer
  // ==========================================
  const [emMonthlyExp, setEmMonthlyExp] = useState(5000);
  const [emMonthsToHire, setEmMonthsToHire] = useState(6);
  const [emEiEligible, setEmEiEligible] = useState(true);
  const [emSeverance, setEmSeverance] = useState(1);

  const emEiWeekly = 668; // 2024 Max
  const emEiMonthly = (emEiWeekly * 52) / 12;
  const emTotalNeeded = emMonthlyExp * emMonthsToHire;
  const emSeveranceCash = emMonthlyExp * emSeverance;
  const emEiCash = emEiEligible ? Math.max(0, (emMonthsToHire - emSeverance - 0.5)) * emEiMonthly : 0; // 0.5 = 2 week waiting period
  const emCashRequired = Math.max(0, emTotalNeeded - emSeveranceCash - emEiCash);

  // ==========================================
  // TOOL 6: Buy vs Lease Car
  // ==========================================
  const [carPrice, setCarPrice] = useState(40000);
  const [carLeaseMo, setCarLeaseMo] = useState(550);
  const [carLeaseDown, setCarLeaseDown] = useState(3000);
  const [carLeaseBuyout, setCarLeaseBuyout] = useState(20000);
  const [carFinanceMo, setCarFinanceMo] = useState(700);
  const [carFinanceDown, setCarFinanceDown] = useState(5000);
  const [carTerm, setCarTerm] = useState(48);

  const totalLeaseToOwn = carLeaseDown + (carLeaseMo * carTerm) + carLeaseBuyout;
  const totalFinance = carFinanceDown + (carFinanceMo * carTerm);
  const carDiff = totalLeaseToOwn - totalFinance;

  const tools = [
      { id: 'ccb', icon: 'bi-people-fill', name: 'CCB Maximizer', desc: 'Find hidden RRSP tax returns' },
      { id: 'mvi', icon: 'bi-house-check', name: 'Mortgage vs Invest', desc: 'Prepay or buy ETFs?' },
      { id: 'fhsa', icon: 'bi-piggy-bank', name: 'FHSA vs RRSP HBP', desc: 'First home tax strategies' },
      { id: 'smith', icon: 'bi-arrow-repeat', name: 'Smith Maneuver', desc: 'Tax-deductible mortgage hack' },
      { id: 'emerg', icon: 'bi-life-preserver', name: 'Emergency Fund Sizer', desc: 'Factor in EI & Severance' },
      { id: 'car', icon: 'bi-car-front-fill', name: 'Buy vs Lease Car', desc: 'Total cost of ownership' }
  ];

  return (
    <div className="p-3 p-md-4 h-100 d-flex flex-column">
      <div className="row g-4 flex-grow-1">
        
        {/* Left Nav */}
        <div className="col-12 col-lg-3">
            <div className="rp-card border-secondary rounded-4 p-3 shadow-sm h-100">
                <h6 className="fw-bold text-uppercase ls-1 text-muted mb-3 px-2">Smart Calculators</h6>
                <div className="d-flex flex-column gap-2">
                    {tools.map(t => (
                        <button 
                            key={t.id}
                            onClick={() => setActiveTool(t.id)}
                            className={`btn text-start p-3 rounded-3 border-0 transition-all ${activeTool === t.id ? 'bg-primary text-white shadow' : 'bg-input text-main hover-opacity-75'}`}
                        >
                            <div className="d-flex align-items-center mb-1">
                                <i className={`bi ${t.icon} fs-5 me-2 ${activeTool === t.id ? 'text-white' : 'text-primary'}`}></i>
                                <span className="fw-bold">{t.name}</span>
                            </div>
                            <div className={`small ${activeTool === t.id ? 'text-white opacity-75' : 'text-muted'}`} style={{fontSize: '0.7rem'}}>{t.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Content Area */}
        <div className="col-12 col-lg-9">
            <div className="rp-card border-secondary rounded-4 p-4 p-md-5 shadow-sm h-100 slide-down position-relative overflow-hidden">
                
                {/* TOOL 1: CCB */}
                {activeTool === 'ccb' && (
                    <>
                        <h4 className="fw-bold text-primary mb-2"><i className="bi bi-people-fill me-2"></i> Canada Child Benefit (CCB) Maximizer</h4>
                        <p className="text-muted small mb-4">Because CCB payouts are tied to Adjusted Family Net Income (AFNI), RRSP contributions do double-duty: they generate a tax refund AND boost your monthly CCB payments. Find your true ROI.</p>
                        
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Adj. Family Net Income (AFNI)</label>
                                <CurrencyInput className="form-control" value={ccbIncome} onChange={setCcbIncome} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Hypothetical RRSP Contribution</label>
                                <CurrencyInput className="form-control border-success text-success" value={ccbRrspContrib} onChange={setCcbRrspContrib} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Kids Under 6 Years Old</label>
                                <input type="number" className="form-control bg-input text-main border-secondary shadow-sm fw-bold" value={ccbKidsUnder6} onChange={e => setCcbKidsUnder6(parseInt(e.target.value)||0)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Kids 6 to 17 Years Old</label>
                                <input type="number" className="form-control bg-input text-main border-secondary shadow-sm fw-bold" value={ccbKidsOver6} onChange={e => setCcbKidsOver6(parseInt(e.target.value)||0)} />
                            </div>
                        </div>

                        <div className="bg-success bg-opacity-10 border border-success border-opacity-50 rounded-4 p-4 mt-2">
                            <h6 className="fw-bold text-success text-uppercase ls-1 mb-3 border-bottom border-success border-opacity-25 pb-2">The Hidden ROI</h6>
                            
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted fw-bold">1. Standard Tax Refund <span className="small fw-normal">(@ {p1Marginal.toFixed(0)}%)</span></span>
                                <span className="fw-bold fs-5 text-main">+{fmt(ccbTaxRefund)}</span>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted fw-bold">2. CCB Boost <span className="small fw-normal">(Annual)</span></span>
                                <span className="fw-bold fs-5 text-info">+{fmt(ccbBoost)}</span>
                            </div>

                            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-success border-opacity-25">
                                <span className="text-success fw-bolder fs-5">Effective Immediate ROI</span>
                                <span className="fw-bolder display-6 text-success">{ccbTotalROI.toFixed(1)}%</span>
                            </div>
                            
                            <p className="text-muted small mt-3 mb-0 fst-italic"><i className="bi bi-info-circle me-1"></i> By contributing {fmt(ccbRrspContrib)}, you get {fmt(ccbTaxRefund + ccbBoost)} right back in your pocket in Year 1.</p>
                        </div>
                    </>
                )}

                {/* TOOL 2: MVI */}
                {activeTool === 'mvi' && (
                    <>
                        <h4 className="fw-bold text-primary mb-2"><i className="bi bi-house-check me-2"></i> Pay Down Mortgage vs. Invest</h4>
                        <p className="text-muted small mb-4">Compare the guaranteed tax-free return of paying down debt versus compounding the money in the market.</p>
                        
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Lump Sum Available</label>
                                <CurrencyInput className="form-control" value={mviLumpSum} onChange={setMviLumpSum} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Time Horizon (Years)</label>
                                <input type="number" className="form-control bg-input text-main border-secondary shadow-sm fw-bold" value={mviYears} onChange={e => setMviYears(parseInt(e.target.value)||0)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Mortgage Interest Rate</label>
                                <PercentInput className="form-control border-danger" value={mviMortgageRate} onChange={setMviMortgageRate} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Expected Investment Return</label>
                                <PercentInput className="form-control border-success" value={mviInvestReturn} onChange={setMviInvestReturn} />
                            </div>
                            <div className="col-12">
                                <label className="form-label small fw-bold text-muted">Account Type</label>
                                <select className="form-select bg-input text-main border-secondary fw-bold" value={mviTaxRate} onChange={e => setMviTaxRate(Number(e.target.value))}>
                                    <option value={0}>TFSA (0% Tax)</option>
                                    <option value={p1Marginal * 0.5}>Non-Registered (Est. {((p1Marginal*0.5)).toFixed(1)}% Cap Gains Tax)</option>
                                </select>
                            </div>
                        </div>

                        <div className="row g-3">
                            <div className="col-md-6">
                                <div className={`p-3 rounded-4 border ${mviDiff > 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-success bg-opacity-10 border-success'}`}>
                                    <div className="text-muted small fw-bold text-uppercase ls-1 mb-1">Guaranteed Interest Saved</div>
                                    <div className="fs-3 fw-bold text-main">{fmt(mviMortgageVal - mviLumpSum)}</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className={`p-3 rounded-4 border ${mviDiff > 0 ? 'bg-success bg-opacity-10 border-success' : 'bg-black bg-opacity-25 border-secondary'}`}>
                                    <div className="text-muted small fw-bold text-uppercase ls-1 mb-1">After-Tax Investment Profit</div>
                                    <div className="fs-3 fw-bold text-success">{fmt(mviInvestVal - mviLumpSum)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="text-center mt-4 pt-3 border-top border-secondary">
                            <h5 className="fw-bold">
                                Mathematical Winner: <span className={mviDiff > 0 ? 'text-success' : 'text-primary'}>{mviDiff > 0 ? 'INVESTING' : 'PAYING MORTGAGE'}</span>
                            </h5>
                            <span className="text-muted small">Difference of <b>{fmt(Math.abs(mviDiff))}</b> over {mviYears} years.</span>
                        </div>
                    </>
                )}

                {/* TOOL 3: FHSA */}
                {activeTool === 'fhsa' && (
                    <>
                        <h4 className="fw-bold text-primary mb-2"><i className="bi bi-piggy-bank me-2"></i> FHSA vs RRSP Home Buyers' Plan</h4>
                        <p className="text-muted small mb-4">The FHSA gives you an RRSP tax deduction without the forced 15-year repayment of the HBP. See the cash flow difference.</p>
                        
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <label className="form-label small fw-bold text-muted">Amount Saved</label>
                                <CurrencyInput className="form-control" value={fhsaAmount} onChange={setFhsaAmount} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small fw-bold text-muted">Marginal Tax Rate</label>
                                <PercentInput className="form-control" value={fhsaTaxRate} onChange={setFhsaTaxRate} />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label small fw-bold text-muted">Years until Purchase</label>
                                <input type="number" className="form-control bg-input text-main border-secondary shadow-sm fw-bold text-end" value={fhsaYears} onChange={e => setFhsaYears(parseInt(e.target.value)||0)} />
                            </div>
                        </div>

                        <div className="row g-4">
                            <div className="col-md-6">
                                <div className="p-4 rounded-4 border border-primary bg-primary bg-opacity-10 h-100">
                                    <h6 className="fw-bold text-primary text-uppercase ls-1 mb-3"><i className="bi bi-house-add-fill me-2"></i>Using FHSA</h6>
                                    <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 text-muted">
                                        <li className="d-flex justify-content-between">Tax Refund Created: <span className="fw-bold text-main">{fmt(fhsaTaxRefund)}</span></li>
                                        <li className="d-flex justify-content-between">Tax-Free Growth: <span className="fw-bold text-success">{fmt(fhsaGrowth - fhsaAmount)}</span></li>
                                        <li className="d-flex justify-content-between pt-2 mt-2 border-top border-primary border-opacity-25">Total Cash for Home: <span className="fw-bold fs-5 text-main">{fmt(fhsaGrowth)}</span></li>
                                        <li className="d-flex justify-content-between mt-2 pt-2"><span className="text-success fw-bold"><i className="bi bi-check-circle-fill me-1"></i> No Repayment Required</span></li>
                                    </ul>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="p-4 rounded-4 border border-warning bg-warning bg-opacity-10 h-100">
                                    <h6 className="fw-bold text-warning text-uppercase ls-1 mb-3"><i className="bi bi-bank2 me-2"></i>Using RRSP HBP</h6>
                                    <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 text-muted">
                                        <li className="d-flex justify-content-between">Tax Refund Created: <span className="fw-bold text-main">{fmt(fhsaTaxRefund)}</span></li>
                                        <li className="d-flex justify-content-between">Tax-Free Growth: <span className="fw-bold text-success">{fmt(fhsaGrowth - fhsaAmount)}</span></li>
                                        <li className="d-flex justify-content-between pt-2 mt-2 border-top border-warning border-opacity-25">Total Cash for Home: <span className="fw-bold fs-5 text-main">{fmt(fhsaGrowth)}</span></li>
                                        <li className="d-flex justify-content-between mt-2 pt-2"><span className="text-danger fw-bold"><i className="bi bi-exclamation-triangle-fill me-1"></i> Mandatory Repayment!</span></li>
                                        <li className="d-flex justify-content-between">Post-Tax Income needed to repay over 15yrs: <span className="fw-bold text-danger">{fmt(hbpRepaymentCost)}</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* TOOL 4: SMITH MANEUVER */}
                {activeTool === 'smith' && (
                    <>
                        <h4 className="fw-bold text-primary mb-2"><i className="bi bi-arrow-repeat me-2"></i> Smith Maneuver Feasibility</h4>
                        <p className="text-muted small mb-4">Calculate the arbitrage of converting your non-deductible mortgage into a tax-deductible investment loan.</p>
                        
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">HELOC Amount to Invest</label>
                                <CurrencyInput className="form-control" value={smLoan} onChange={setSmLoan} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Marginal Tax Rate</label>
                                <PercentInput className="form-control" value={smTaxRate} onChange={setSmTaxRate} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">HELOC Interest Rate</label>
                                <PercentInput className="form-control border-danger" value={smHelocRate} onChange={setSmHelocRate} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Est. Investment Return</label>
                                <PercentInput className="form-control border-success" value={smInvestReturn} onChange={setSmInvestReturn} />
                            </div>
                        </div>

                        <div className="bg-input border border-secondary rounded-4 p-4 text-center">
                            <div className="d-flex justify-content-center align-items-center gap-4 mb-3">
                                <div>
                                    <div className="small text-muted fw-bold mb-1">Effective Loan Rate</div>
                                    <div className="fs-4 fw-bold text-danger">{smEffectiveBorrowingRate.toFixed(2)}%</div>
                                    <div className="small text-muted" style={{fontSize: '0.65rem'}}>After Tax Deduction</div>
                                </div>
                                <div className="fs-3 text-muted"><i className="bi bi-arrow-right"></i></div>
                                <div>
                                    <div className="small text-muted fw-bold mb-1">Arbitrage Spread</div>
                                    <div className={`fs-4 fw-bold ${smSpread > 0 ? 'text-success' : 'text-danger'}`}>{smSpread > 0 ? '+' : ''}{smSpread.toFixed(2)}%</div>
                                    <div className="small text-muted" style={{fontSize: '0.65rem'}}>Return minus Loan Cost</div>
                                </div>
                            </div>
                            
                            <div className="pt-3 border-top border-secondary">
                                <h6 className="fw-bold mb-1">Est. Net Annual Wealth Created</h6>
                                <div className={`display-6 fw-bold ${smAnnualProfit > 0 ? 'text-success' : 'text-danger'}`}>
                                    {smAnnualProfit > 0 ? '+' : ''}{fmt(smAnnualProfit)}
                                </div>
                                {smSpread <= 0 && <span className="badge bg-danger mt-2">NOT FEASIBLE - LOAN TOO EXPENSIVE</span>}
                            </div>
                        </div>
                    </>
                )}

                {/* TOOL 5: EMERGENCY FUND */}
                {activeTool === 'emerg' && (
                    <>
                        <h4 className="fw-bold text-primary mb-2"><i className="bi bi-life-preserver me-2"></i> Smart Emergency Fund Sizer</h4>
                        <p className="text-muted small mb-4">Standard advice says "save 6 months". But if you get severance and Employment Insurance (EI), you can invest more and hoard less cash.</p>
                        
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Monthly Core Expenses</label>
                                <CurrencyInput className="form-control" value={emMonthlyExp} onChange={setEmMonthlyExp} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Months to find new job</label>
                                <input type="number" className="form-control bg-input text-main border-secondary shadow-sm fw-bold text-end" value={emMonthsToHire} onChange={e => setEmMonthsToHire(parseInt(e.target.value)||0)} />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small fw-bold text-muted">Expected Severance (Months)</label>
                                <input type="number" step="0.5" className="form-control bg-input text-main border-secondary shadow-sm fw-bold text-end" value={emSeverance} onChange={e => setEmSeverance(parseFloat(e.target.value)||0)} />
                            </div>
                            <div className="col-md-6 d-flex align-items-center">
                                <div className="form-check form-switch mt-3 fs-5">
                                    <input className="form-check-input cursor-pointer" type="checkbox" checked={emEiEligible} onChange={e => setEmEiEligible(e.target.checked)} />
                                    <label className="form-check-label small fw-bold text-muted ms-2 mt-1">Eligible for Max EI ($668/wk)</label>
                                </div>
                            </div>
                        </div>

                        <div className="bg-info bg-opacity-10 border border-info border-opacity-50 rounded-4 p-4 mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <span className="text-muted fw-bold">Total Cash Needed ({emMonthsToHire} mos)</span>
                                <span className="fw-bold text-main">{fmt(emTotalNeeded)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                                <span>- Severance Payout</span>
                                <span>-{fmt(emSeveranceCash)}</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2 text-success">
                                <span>- Est. EI Payouts <span className="small text-muted">(after 2wk wait)</span></span>
                                <span>-{fmt(emEiCash)}</span>
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-info border-opacity-25">
                                <span className="text-info fw-bolder fs-5">Actual Cash Hoard Needed</span>
                                <span className="fw-bolder display-6 text-info">{fmt(emCashRequired)}</span>
                            </div>
                        </div>
                    </>
                )}

                {/* TOOL 6: BUY VS LEASE */}
                {activeTool === 'car' && (
                    <>
                        <h4 className="fw-bold text-primary mb-2"><i className="bi bi-car-front-fill me-2"></i> Buy vs. Lease vs. Finance</h4>
                        <p className="text-muted small mb-4">Calculate the true Total Cost of Ownership (TCO) at the end of the term.</p>
                        
                        <div className="row g-4 mb-4">
                            <div className="col-12">
                                <div className="row g-3 p-3 border border-secondary rounded-3 bg-secondary bg-opacity-10">
                                    <h6 className="col-12 fw-bold text-info small text-uppercase ls-1 m-0">Lease to Own</h6>
                                    <div className="col-md-4">
                                        <label className="form-label small text-muted mb-1">Down Payment</label>
                                        <CurrencyInput className="form-control form-control-sm" value={carLeaseDown} onChange={setCarLeaseDown} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small text-muted mb-1">Monthly Payment</label>
                                        <CurrencyInput className="form-control form-control-sm" value={carLeaseMo} onChange={setCarLeaseMo} />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small text-muted mb-1">Residual Buyout</label>
                                        <CurrencyInput className="form-control form-control-sm" value={carLeaseBuyout} onChange={setCarLeaseBuyout} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-12">
                                <div className="row g-3 p-3 border border-secondary rounded-3 bg-secondary bg-opacity-10">
                                    <div className="col-12 d-flex justify-content-between align-items-center m-0">
                                        <h6 className="fw-bold text-warning small text-uppercase ls-1 m-0">Finance</h6>
                                        <div className="d-flex align-items-center gap-2" style={{width: '120px'}}>
                                            <label className="small text-muted m-0 fw-bold">Term (Mo)</label>
                                            <input type="number" className="form-control form-control-sm text-end fw-bold" value={carTerm} onChange={e => setCarTerm(parseInt(e.target.value)||0)} />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted mb-1">Down Payment</label>
                                        <CurrencyInput className="form-control form-control-sm" value={carFinanceDown} onChange={setCarFinanceDown} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small text-muted mb-1">Monthly Payment</label>
                                        <CurrencyInput className="form-control form-control-sm" value={carFinanceMo} onChange={setCarFinanceMo} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row g-3 text-center">
                            <div className="col-md-6">
                                <div className={`p-3 rounded-4 border ${carDiff > 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-info bg-opacity-10 border-info'}`}>
                                    <div className="text-muted small fw-bold text-uppercase ls-1 mb-1">Total Cost (Lease to Own)</div>
                                    <div className="fs-3 fw-bold text-main">{fmt(totalLeaseToOwn)}</div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className={`p-3 rounded-4 border ${carDiff < 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-warning bg-opacity-10 border-warning'}`}>
                                    <div className="text-muted small fw-bold text-uppercase ls-1 mb-1">Total Cost (Finance)</div>
                                    <div className="fs-3 fw-bold text-main">{fmt(totalFinance)}</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
      </div>
    </div>
  );
}