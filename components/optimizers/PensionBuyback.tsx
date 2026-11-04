'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

export default function PensionBuyback() {
    const { data, results } = useFinance();

    // Context defaults from active plan
    const defaultMarginal = results?.timeline?.[0]?.taxDetailsP1?.margRate 
        ? Math.round(results.timeline[0].taxDetailsP1.margRate * 100) 
        : 35;
    const defaultDbMonthly = Number(data?.inputs?.p1_db) 
        || (Number(data?.inputs?.p1_db_annual) ? Math.round(Number(data?.inputs?.p1_db_annual) / 12) : 4000);
    const p1DobYear = data?.inputs?.p1_dob ? parseInt(String(data.inputs.p1_dob).slice(0, 4), 10) : 1970;
    const p1Age = new Date().getFullYear() - p1DobYear;
    const p1RetireAge = Number(data?.inputs?.p1_retire_age) || 60;
    const defaultYearsToRetire = Math.max(1, p1RetireAge - p1Age);

    // Primary State Inputs
    const [bbCost, setBbCost] = useState<number | ''>(10000);
    const [fundingSource, setFundingSource] = useState<'cash' | 'rrsp'>('cash');
    const [marginalTaxRate, setMarginalTaxRate] = useState<number | ''>(defaultMarginal);
    const [monthsEarly, setMonthsEarly] = useState<number | ''>(2);
    const [monthlyPension, setMonthlyPension] = useState<number | ''>(defaultDbMonthly || 4368);
    const [addedMonthlyPension, setAddedMonthlyPension] = useState<number | ''>(30);
    const [hasCola, setHasCola] = useState<boolean>(true);
    const [colaRate, setColaRate] = useState<number>(2.0);
    const [bbYears, setBbYears] = useState<number | ''>(defaultYearsToRetire <= 25 ? defaultYearsToRetire : 2);
    const [bbReturn, setBbReturn] = useState<number>(6.0);
    const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

    // Calculations
    const calculations = useMemo(() => {
        const grossCost = Number(bbCost) || 0;
        const taxRatePct = Number(marginalTaxRate) || 0;
        const isCash = fundingSource === 'cash';

        // 1. Tax deduction and net cash outlay (CRA Line 20700 RPP deduction for past service)
        const taxRefund = isCash ? grossCost * (taxRatePct / 100) : 0;
        const netCost = isCash ? Math.max(0, grossCost - taxRefund) : grossCost;

        // 2. Early retirement acceleration benefits
        const earlyMonths = Number(monthsEarly) || 0;
        const baseMonthly = Number(monthlyPension) || 0;
        const addedMonthly = Number(addedMonthlyPension) || 0;
        const newMonthly = baseMonthly + addedMonthly;
        const addedAnnual = addedMonthly * 12;

        // Early pension dollars collected before the original unreduced date
        const earlyPensionCollected = earlyMonths * newMonthly;

        // Upfront net cash balance (immediate gain or remaining unrecovered cost)
        const immediateNetGain = earlyPensionCollected - netCost;
        const unrecoveredCost = Math.max(0, netCost - earlyPensionCollected);

        // 3. Break-even payback period
        let paybackYears = 0;
        if (earlyPensionCollected >= netCost) {
            paybackYears = 0; // Immediate upfront payback!
        } else if (addedAnnual > 0) {
            paybackYears = unrecoveredCost / addedAnnual;
        } else {
            paybackYears = 999;
        }

        // 4. Opportunity Cost (Future Value if invested in market instead)
        const yrs = Number(bbYears) || 0;
        const rMkt = (Number(bbReturn) || 0) / 100;
        const futureValueOfCost = netCost * Math.pow(1 + rMkt, yrs);
        const matchYield = futureValueOfCost > 0 ? (addedAnnual / futureValueOfCost) * 100 : 0;

        // 5. Cumulative 25-Year Lifetime Net Gain
        let cumulativePensions25 = earlyPensionCollected;
        const rCola = hasCola ? (colaRate / 100) : 0;
        let currentYearlyAdded = addedAnnual;
        for (let y = 1; y <= 25; y++) {
            cumulativePensions25 += currentYearlyAdded;
            currentYearlyAdded *= (1 + rCola);
        }
        const lifetimeNetBenefit = cumulativePensions25 - netCost;

        return {
            grossCost,
            taxRefund,
            netCost,
            earlyMonths,
            earlyPensionCollected,
            addedAnnual,
            addedMonthly,
            immediateNetGain,
            unrecoveredCost,
            paybackYears,
            futureValueOfCost,
            matchYield,
            cumulativePensions25,
            lifetimeNetBenefit
        };
    }, [bbCost, fundingSource, marginalTaxRate, monthsEarly, monthlyPension, addedMonthlyPension, hasCola, colaRate, bbYears, bbReturn]);

    const formatCurrency = (val: number) => 
        new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative d-flex flex-column shadow-sm">
            {/* CARD HEADER */}
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                <div className="d-flex align-items-center">
                    <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{ width: '45px', height: '45px', flexShrink: 0 }}>
                        <i className="bi bi-clock-history fs-4"></i>
                    </div>
                    <div>
                        <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Pension Buyback</h5>
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>DB Pension Past Service Cost-Benefit Optimizer</span>
                    </div>
                </div>
                {calculations.immediateNetGain > 0 && (
                    <span 
                        className="badge rounded-pill px-2.5 py-1 fw-bold shadow-sm d-flex align-items-center"
                        style={{ 
                            backgroundColor: '#22c55e', 
                            color: '#052e16', 
                            fontSize: '0.72rem',
                            letterSpacing: '0.02em',
                            border: '1px solid #16a34a'
                        }}
                    >
                        <i className="bi bi-lightning-charge-fill me-1"></i> Instant Payback
                    </span>
                )}
            </div>

            <p className="text-muted small mb-3" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                Determine if buying back past service is worth it by analyzing tax deductions, earlier unreduced retirement dates, and guaranteed lifetime payouts.
            </p>

            {/* FUNDING METHOD TOGGLE */}
            <div className="mb-3">
                <label className="form-label small fw-bold text-muted mb-1.5 d-flex align-items-center">
                    <span>Payment Funding Source</span>
                    <InfoBtn align="left" direction="down" title="Funding Method" text="<b>Cash/Non-Reg:</b> Contributions are CRA tax-deductible against employment income (Line 20700).<br><br><b>RRSP Transfer:</b> Direct rollover via CRA Form T2151. Uses pre-tax RRSP balance with $0 cash out-of-pocket, but no additional tax refund." />
                </label>
                <div className="btn-group w-100 p-1 bg-input rounded-3 border border-secondary" role="group">
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-2 fw-bold transition-all ${fundingSource === 'cash' ? 'btn-primary shadow-sm' : 'btn-link text-muted text-decoration-none'}`} 
                        onClick={() => setFundingSource('cash')}
                    >
                        <i className="bi bi-cash-stack me-1"></i> Cash (Tax-Deductible)
                    </button>
                    <button 
                        type="button" 
                        className={`btn btn-sm rounded-2 fw-bold transition-all ${fundingSource === 'rrsp' ? 'btn-primary shadow-sm' : 'btn-link text-muted text-decoration-none'}`} 
                        onClick={() => setFundingSource('rrsp')}
                    >
                        <i className="bi bi-arrow-repeat me-1"></i> RRSP Transfer (T2151)
                    </button>
                </div>
            </div>

            {/* CORE INPUTS GRID (Explicit rows for guaranteed pixel-perfect horizontal alignment) */}
            <div className="d-flex flex-column gap-2.5 mb-3">
                {/* ROW 1: Buyback Cost & Tax Bracket / RRSP */}
                <div className="row g-2 align-items-center">
                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center" style={{ height: '18px', lineHeight: '18px' }}>
                            <span>Buyback Cost ($)</span>
                        </label>
                        <CurrencyInput className="form-control form-control-sm bg-input" style={{ height: '32px' }} value={bbCost} onChange={setBbCost} />
                    </div>

                    <div className="col-6">
                        {fundingSource === 'cash' ? (
                            <>
                                <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center justify-content-between" style={{ height: '18px', lineHeight: '18px' }}>
                                    <span>Tax Bracket</span>
                                    <span className="text-info fw-normal" style={{ fontSize: '0.68rem' }}>Save {formatCurrency(calculations.taxRefund)}</span>
                                </label>
                                <PercentInput className="form-control form-control-sm border-info text-info bg-input" style={{ height: '32px' }} value={marginalTaxRate} onChange={setMarginalTaxRate} />
                            </>
                        ) : (
                            <>
                                <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center" style={{ height: '18px', lineHeight: '18px' }}>
                                    <span>Tax Deduction</span>
                                </label>
                                <input 
                                    type="text" 
                                    readOnly 
                                    disabled 
                                    className="form-control form-control-sm bg-input text-muted text-center border-secondary shadow-sm" 
                                    style={{ height: '32px' }}
                                    value="Pre-Tax Rollover" 
                                />
                            </>
                        )}
                    </div>
                </div>

                {/* ROW 2: Retire Earlier & Monthly Pension */}
                <div className="row g-2 align-items-center">
                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center" style={{ height: '18px', lineHeight: '18px' }}>
                            <span>Retire Earlier</span>
                            <InfoBtn align="left" direction="down" title="Earlier Retirement" text="Number of months this buyback advances your 85/90 factor or unreduced pension eligibility date." />
                        </label>
                        <div className="position-relative w-100 d-flex align-items-center" style={{ minWidth: 0 }}>
                            <input 
                                type="number" 
                                min="0" 
                                max="60" 
                                className="form-control form-control-sm bg-input text-main border-secondary shadow-sm text-start fw-bold w-100" 
                                style={{ minWidth: 0, paddingLeft: '8px', paddingRight: '58px', fontWeight: '600', height: '32px', outline: 'none' }} 
                                value={monthsEarly} 
                                onChange={e => setMonthsEarly(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10)))} 
                            />
                            <span className="position-absolute text-muted small fw-bold" style={{ right: '8px', pointerEvents: 'none', zIndex: 5, fontSize: '0.72rem' }}>
                                months
                            </span>
                        </div>
                    </div>

                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center" style={{ height: '18px', lineHeight: '18px' }}>
                            <span>Monthly Pension</span>
                        </label>
                        <CurrencyInput className="form-control form-control-sm bg-input" style={{ height: '32px' }} suffix="/mo" value={monthlyPension} onChange={setMonthlyPension} />
                    </div>
                </div>

                {/* ROW 3: Added Pension & COLA Protection */}
                <div className="row g-2 align-items-center">
                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center" style={{ height: '18px', lineHeight: '18px' }}>
                            <span>Added Pension</span>
                            <InfoBtn align="left" direction="down" title="Added Pension" text="Additional monthly pension payout generated by the extra credited service." />
                        </label>
                        <CurrencyInput className="form-control form-control-sm border-success text-success bg-input" style={{ height: '32px' }} suffix="/mo" value={addedMonthlyPension} onChange={setAddedMonthlyPension} />
                    </div>

                    <div className="col-6">
                        <label className="form-label small fw-bold text-muted mb-1 d-flex align-items-center" style={{ height: '18px', lineHeight: '18px' }}>
                            <span>COLA Protection</span>
                        </label>
                        <button 
                            type="button" 
                            className={`btn btn-sm w-100 fw-bold rounded-2 shadow-sm d-flex align-items-center justify-content-center transition-all ${hasCola ? 'btn-outline-success border-success text-success bg-input' : 'btn-outline-secondary text-muted bg-input'}`} 
                            onClick={() => setHasCola(!hasCola)}
                            style={{ height: '32px', fontSize: '0.75rem' }}
                        >
                            <i className={`bi ${hasCola ? 'bi-check-circle-fill' : 'bi-dash-circle'} me-1.5`}></i>
                            {hasCola ? `COLA Indexed (${colaRate}%)` : 'Fixed (No COLA)'}
                        </button>
                    </div>
                </div>
            </div>

            {/* INVESTMENT OPPORTUNITY COST ACCORDION TOGGLE */}
            <div className="mb-3">
                <button 
                    type="button" 
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none small d-flex align-items-center gap-1"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ fontSize: '0.75rem' }}
                >
                    <i className={`bi bi-chevron-${showBreakdown ? 'up' : 'down'}`}></i>
                    <span>{showBreakdown ? 'Hide Opportunity Cost Assumptions' : 'Adjust Market Return & Horizon'}</span>
                </button>

                {showBreakdown && (
                    <div className="row g-2 mt-2 p-2.5 bg-input border border-secondary rounded-3">
                        <div className="col-6">
                            <label className="form-label small fw-bold text-muted mb-1">Yrs to Retire</label>
                            <input 
                                type="number" 
                                className="form-control form-control-sm bg-body text-main border-secondary text-center fw-bold" 
                                style={{ height: '32px' }}
                                value={bbYears} 
                                onChange={e => setBbYears(e.target.value === '' ? '' : parseInt(e.target.value, 10))} 
                            />
                        </div>
                        <div className="col-6">
                            <label className="form-label small fw-bold text-muted mb-1">Est. Mkt Return</label>
                            <PercentInput className="form-control form-control-sm border-warning bg-body" style={{ height: '32px' }} value={bbReturn} onChange={setBbReturn} />
                        </div>
                    </div>
                )}
            </div>

            {/* RESULTS DASHBOARD */}
            <div className="bg-primary bg-opacity-10 border border-primary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                {/* 1. UPFRONT NET GAIN / COST ROW */}
                <div className="d-flex justify-content-between align-items-center mb-1.5 pb-1.5 border-bottom border-primary border-opacity-25">
                    <div>
                        <span className="text-muted fw-bold small d-block" style={{ fontSize: '0.72rem' }}>
                            {fundingSource === 'cash' ? 'Net Out-of-Pocket Cost' : 'Pre-Tax Buyback Cost'}
                        </span>
                        <span className="fw-bold text-main fs-6">{formatCurrency(calculations.netCost)}</span>
                        {fundingSource === 'cash' && calculations.taxRefund > 0 && (
                            <span className="text-muted ms-1 small" style={{ fontSize: '0.68rem' }}>
                                (after {formatCurrency(calculations.taxRefund)} refund)
                            </span>
                        )}
                    </div>
                    {calculations.earlyMonths > 0 && (
                        <div className="text-end">
                            <span className="text-muted fw-bold small d-block" style={{ fontSize: '0.72rem' }}>
                                Early Pension Collected
                            </span>
                            <span className="fw-bold text-success fs-6">+{formatCurrency(calculations.earlyPensionCollected)}</span>
                            <span className="text-muted ms-1 small d-block" style={{ fontSize: '0.68rem' }}>
                                ({calculations.earlyMonths} months early)
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. IMMEDIATE ARBITRAGE OR PAYBACK */}
                {calculations.immediateNetGain > 0 ? (
                    <div className="p-2.5 my-2 rounded-3 border border-success border-opacity-50 text-start" style={{ backgroundColor: 'rgba(34, 197, 94, 0.12)' }}>
                        <div className="d-flex align-items-center gap-1.5 text-success fw-bold small mb-1">
                            <i className="bi bi-check-circle-fill"></i>
                            <span>Immediate Net Upfront Profit: +{formatCurrency(calculations.immediateNetGain)}</span>
                        </div>
                        <p className="text-main mb-0" style={{ fontSize: '0.71rem', lineHeight: '1.4' }}>
                            Collecting your pension {calculations.earlyMonths} months early delivers <b className="text-success">+{formatCurrency(calculations.earlyPensionCollected)}</b> right out of the gate. That completely covers your <b>{formatCurrency(calculations.netCost)}</b> net cost upfront with <b className="text-success">+{formatCurrency(calculations.immediateNetGain)}</b> extra cash in hand—plus an ongoing <b className="text-success">+{formatCurrency(calculations.addedMonthly)}/mo</b> for life.
                        </p>
                    </div>
                ) : (
                    <div className="d-flex justify-content-between align-items-center my-2 pb-1 border-bottom border-primary border-opacity-15">
                        <span className="text-muted fw-bold small">Break-Even Payback</span>
                        <span className="fw-bolder fs-6 text-main">
                            {calculations.paybackYears === 0 
                                ? 'Immediate' 
                                : calculations.paybackYears < 50 
                                    ? `${calculations.paybackYears.toFixed(1)} Years` 
                                    : '50+ Years'}
                        </span>
                    </div>
                )}

                {/* 3. LIFETIME METRICS */}
                <div className="d-flex justify-content-between align-items-center pt-1.5" style={{ fontSize: '0.75rem' }}>
                    <span className="text-muted fw-bold d-inline-flex align-items-center">
                        Required Yield to Match 
                        <InfoBtn align="left" direction="up" title="Required Yield" text="The annual withdrawal yield required from your net investment cost to match the added annual pension for life. Guaranteed yield > 4.0% typically outperforms safe market drawdown rules." />
                    </span>
                    <span className={`fw-bolder fs-6 ${calculations.matchYield >= 4.0 ? 'text-success' : 'text-warning'}`}>
                        {calculations.matchYield.toFixed(2)}%
                    </span>
                </div>

                <div className="d-flex justify-content-between align-items-center pt-1 text-muted" style={{ fontSize: '0.72rem' }}>
                    <span>25 Year Net Added Payout:</span>
                    <span className="fw-bold text-success">+{formatCurrency(calculations.lifetimeNetBenefit)}</span>
                </div>

                {/* VERDICT BADGE */}
                <span className="small text-muted d-block text-center mt-2.5 pt-1.5 border-top border-primary border-opacity-25 fst-italic" style={{ fontSize: '0.72rem' }}>
                    {calculations.immediateNetGain > 0 
                        ? "Unanimous Win: Accelerated retirement payments completely self-fund this buyback."
                        : calculations.matchYield >= 4.0 
                            ? "Recommended: Guaranteed inflation-protected payout easily beats market drawdown benchmarks." 
                            : "Consider Investing: Break-even is long unless longevity and guaranteed income are top priorities."}
                </span>
            </div>
        </div>
    );
}