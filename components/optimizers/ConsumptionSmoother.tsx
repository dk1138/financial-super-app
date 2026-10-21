'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { SegmentedControl, CurrencyInput, StepperInput, InfoBtn } from '../SharedUI';

export default function ConsumptionSmoother() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    const useRealDollars = Boolean(
        data.useRealDollars === true || 
        data.inputs?.todays_dollars === true || 
        data.inputs?.use_real_dollars === true ||
        data.inputs?.useRealDollars === true
    );

    const defaultRetAge = Number(data.inputs.p1_retireAge) || 65;
    const currentAge = Number(data.inputs.p1_age) || 35;
    const lifeExpectancy = Number(data.inputs.p1_lifeExp) || 90;

    const [targetLegacy, setTargetLegacy] = useState<number>(0);
    const [testRetAge, setTestRetAge] = useState<number>(defaultRetAge);
    const [viewMode, setViewMode] = useState<'summary' | 'levers'>('summary');
    const [isCalculating, setIsCalculating] = useState(false);
    const [smoothResult, setSmoothResult] = useState<any>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    const getRealValue = (nominalValue: number, startYear: number, endYear: number) => {
        if (!useRealDollars) return nominalValue;
        const inflation = (data.inputs?.inflation_rate !== undefined && data.inputs?.inflation_rate !== '' ? Number(data.inputs.inflation_rate) : 2.1) / 100;
        const yearsOut = Math.max(0, endYear - startYear);
        return nominalValue / Math.pow(1 + inflation, yearsOut);
    };

    // Helper to run simulation sandbox with candidate annual real discretionary budget
    const solveMaxDiscretionary = (candidateRetAge: number, delayCppTo70: boolean = false, legacyTarget: number = 0) => {
        const runWithBudget = (annualRealSpend: number) => {
            const clonedData = JSON.parse(JSON.stringify(data));
            clonedData.inputs.p1_retireAge = candidateRetAge;
            if (isCouple) clonedData.inputs.p2_retireAge = candidateRetAge;

            if (delayCppTo70) {
                clonedData.inputs.p1_cpp_start = 70;
                clonedData.inputs.p1_oas_start = 70;
                if (isCouple) {
                    clonedData.inputs.p2_cpp_start = 70;
                    clonedData.inputs.p2_oas_start = 70;
                }
            }

            // Replace lifestyle expenses with flat candidate discretionary spend
            // Keep fixed costs (debt, mortgages, rent) intact in their dedicated properties/debt structures
            if (clonedData.expensesByCategory) {
                const cats = Object.keys(clonedData.expensesByCategory);
                if (cats.length > 0) {
                    const firstCat = cats[0];
                    clonedData.expensesByCategory[firstCat].items = [
                        { name: 'Smoothed Lifestyle', curr: annualRealSpend, ret: annualRealSpend, trans: annualRealSpend, gogo: annualRealSpend, slow: annualRealSpend, nogo: annualRealSpend, freq: 1 }
                    ];
                    // Zero out other categories so only fixed obligations + smoothed lifestyle run
                    for (let c = 1; c < cats.length; c++) {
                        clonedData.expensesByCategory[cats[c]].items = [];
                    }
                }
            }

            const engine = new FinanceEngine(clonedData);
            return engine.runSimulation(true, null);
        };

        // Binary search bisection across 18 iterations (\$12k/yr to \$350k/yr)
        let low = 12000;
        let high = 350000;
        let bestSpend = low;
        let bestTimeline: any = null;

        for (let iter = 0; iter < 18; iter++) {
            const mid = (low + high) / 2;
            const timeline = runWithBudget(mid);
            if (!timeline || timeline.length === 0) break;

            const finalYear = timeline[timeline.length - 1];
            const finalLiquid = finalYear.liquidNW || 0;
            const isSolvent = timeline.every((y: any) => (y.liquidNW || 0) >= 0) && (finalLiquid >= legacyTarget);

            if (isSolvent) {
                bestSpend = mid;
                bestTimeline = timeline;
                low = mid; // Can afford more
            } else {
                high = mid; // Too aggressive
            }
        }

        return {
            annualSpend: Math.round(bestSpend),
            monthlySpend: Math.round(bestSpend / 12),
            timeline: bestTimeline
        };
    };

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            try {
                // 1. Solve base optimal smoothed spending
                const baseOptimal = solveMaxDiscretionary(testRetAge, false, targetLegacy);

                // 2. Lever A: Impact of delaying CPP/OAS from age 65 to 70
                const delayedOptimal = solveMaxDiscretionary(testRetAge, true, targetLegacy);
                const cppDelayGainMonthly = Math.max(0, delayedOptimal.monthlySpend - baseOptimal.monthlySpend);

                // 3. Lever B: Impact of working 2 years longer (or retiring 2 years earlier)
                const retireEarlierAge = Math.max(55, testRetAge - 2);
                const earlierOptimal = solveMaxDiscretionary(retireEarlierAge, false, targetLegacy);
                const earlyRetireCostMonthly = baseOptimal.monthlySpend - earlierOptimal.monthlySpend;

                // Estimate baseline current retirement expense for comparison
                const baseEngine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
                const defaultTimeline = baseEngine.runSimulation(true, null);
                const retYearItem = defaultTimeline.find((y: any) => y.p1Age >= defaultRetAge) || defaultTimeline[defaultTimeline.length - 1];
                const startYear = defaultTimeline[0].year;
                const baselineCurrentSpend = retYearItem ? getRealValue(retYearItem.expenses || 60000, startYear, retYearItem.year) : 60000;

                setSmoothResult({
                    annualSpend: baseOptimal.annualSpend,
                    monthlySpend: baseOptimal.monthlySpend,
                    baselineSpend: Math.round(baselineCurrentSpend),
                    baselineMonthly: Math.round(baselineCurrentSpend / 12),
                    differenceAnnual: baseOptimal.annualSpend - Math.round(baselineCurrentSpend),
                    differenceMonthly: baseOptimal.monthlySpend - Math.round(baselineCurrentSpend / 12),
                    cppDelayGainMonthly,
                    earlyRetireCostMonthly: Math.max(0, earlyRetireCostMonthly),
                    retireEarlierAge
                });
            } catch (err) {
                console.error('ConsumptionSmoother calculation error:', err);
            } finally {
                setIsCalculating(false);
            }
        }, 60);

        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs), JSON.stringify(data.expensesByCategory), testRetAge, targetLegacy, useRealDollars]);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-speedometer2 fs-4"></i>
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                            <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Consumption Smoothing (Living Standard Maximizer)</h5>
                            {useRealDollars && (
                                <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{fontSize: '0.65rem'}}>
                                    Today's \$
                                </span>
                            )}
                        </div>
                        <InfoBtn 
                            title="MaxiFi-Style Consumption Smoothing" 
                            text="Based on economic consumption smoothing principles. Instead of forcing you to guess a retirement budget, this solver works backward from your net worth, CPP, OAS, pensions, and Canadian tax brackets to find the <b>exact flat discretionary living standard</b> (in today's purchasing power) you can spend every year from retirement to age 95 without ever running out of money."
                            align="right"
                        />
                    </div>
                </div>
            </div>

            <p className="text-muted small mb-3">
                Calculate your sustainable lifetime discretionary spending ceiling (in today's dollars) and test how lifestyle levers like retirement age and CPP timing adjust your monthly spending power.
            </p>

            {/* Inputs Grid */}
            <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                    <label className="form-label small text-muted fw-bold mb-1">Target Estate Legacy Floor (\$)</label>
                    <CurrencyInput 
                        value={targetLegacy} 
                        onChange={(v: any) => setTargetLegacy(v || 0)} 
                        placeholder="0 (Pure Consumption)" 
                    />
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label small text-muted fw-bold mb-1">Target Retirement Age</label>
                    <StepperInput 
                        min={55} 
                        max={75} 
                        value={testRetAge} 
                        onChange={(val: number) => setTestRetAge(val)} 
                    />
                </div>
            </div>

            {/* Mode Toggle */}
            <div className="mb-3">
                <SegmentedControl 
                    value={viewMode}
                    onChange={(val: any) => setViewMode(val)}
                    options={[
                        { value: 'summary', label: 'Maximum Spending Capacity' },
                        { value: 'levers', label: 'Lifestyle Trade-Off Levers' }
                    ]}
                />
            </div>

            {/* Content Area */}
            <div className="flex-grow-1 d-flex flex-column position-relative">
                {isCalculating && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-3" style={{zIndex: 10}}>
                        <span className="spinner-border text-primary" style={{width: '2.5rem', height: '2.5rem'}}></span>
                    </div>
                )}

                {smoothResult && (
                    viewMode === 'summary' ? (
                        <div className="d-flex flex-column gap-3 flex-grow-1">
                            {/* Headline Metric Card */}
                            <div className="p-4 bg-primary bg-opacity-10 border border-primary border-opacity-50 rounded-4 text-center">
                                <span className="small text-primary fw-bold text-uppercase ls-1" style={{fontSize: '0.78rem'}}>
                                    Sustainable Discretionary Living Standard
                                </span>
                                <div className="fs-2 fw-bold text-main mt-1">
                                    {formatCurrency(smoothResult.monthlySpend)} <span className="fs-6 text-muted fw-normal">/ month</span>
                                </div>
                                <div className="text-muted small mt-1">
                                    <strong>{formatCurrency(smoothResult.annualSpend)}</strong> per year in today's real purchasing power (funded to age {lifeExpectancy})
                                </div>
                            </div>

                            {/* Comparison Row */}
                            <div className="row g-2">
                                <div className="col-6">
                                    <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                        <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>Your Current Planned Budget</span>
                                        <div className="mt-2">
                                            <div className="fs-5 fw-bold text-muted">{formatCurrency(smoothResult.baselineMonthly)}/mo</div>
                                            <span className="small text-muted" style={{fontSize: '0.75rem'}}>{formatCurrency(smoothResult.baselineSpend)}/yr</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-6">
                                    <div className={`p-3 rounded-3 h-100 d-flex flex-column justify-content-between border ${smoothResult.differenceMonthly >= 0 ? 'bg-success bg-opacity-10 border-success' : 'bg-warning bg-opacity-10 border-warning'}`}>
                                        <span className={`small fw-bold text-uppercase ${smoothResult.differenceMonthly >= 0 ? 'text-success' : 'text-warning'}`} style={{fontSize: '0.72rem'}}>
                                            {smoothResult.differenceMonthly >= 0 ? 'Unused Spending Capacity' : 'Plan Deficit (Over-budget)'}
                                        </span>
                                        <div className="mt-2">
                                            <div className={`fs-5 fw-bold ${smoothResult.differenceMonthly >= 0 ? 'text-success' : 'text-warning'}`}>
                                                {smoothResult.differenceMonthly >= 0 ? `+${formatCurrency(smoothResult.differenceMonthly)}` : formatCurrency(smoothResult.differenceMonthly)}/mo
                                            </div>
                                            <span className="small text-muted" style={{fontSize: '0.75rem'}}>
                                                {smoothResult.differenceMonthly >= 0 ? 'You can safely spend more' : 'Trimming required to avoid ruin'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Practical Takeaway */}
                            <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 small mt-auto">
                                <div className="d-flex align-items-center mb-1 text-primary fw-bold">
                                    <i className="bi bi-lightbulb-fill me-2"></i> Economic Insight:
                                </div>
                                <p className="text-muted mb-0" style={{fontSize: '0.78rem', lineHeight: 1.45}}>
                                    Unlike static rules of thumb (like the 4% rule), consumption smoothing automatically takes into account your Canadian mortgage payoff schedule, CPP/OAS entitlements, and marginal tax brackets to ensure your standard of living never suffers an unexpected drop.
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* Levers View */
                        <div className="d-flex flex-column gap-3 flex-grow-1">
                            <div className="p-3 bg-input border border-secondary rounded-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-1 text-main">Delay CPP & OAS to Age 70</h6>
                                        <span className="small text-muted">Leverages the +42% CPP and +36% OAS guaranteed government enhancement.</span>
                                    </div>
                                    <div className="text-end ps-3">
                                        <span className="fs-5 fw-bold text-success">+{formatCurrency(smoothResult.cppDelayGainMonthly)}</span>
                                        <span className="small text-muted d-block" style={{fontSize: '0.7rem'}}>/ month for life</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-input border border-secondary rounded-3">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="fw-bold mb-1 text-main">Retire 2 Years Earlier (Age {smoothResult.retireEarlierAge})</h6>
                                        <span className="small text-muted">Exchanges 2 years of employment earnings for 2 additional years of portfolio decumulation.</span>
                                    </div>
                                    <div className="text-end ps-3">
                                        <span className="fs-5 fw-bold text-danger">-{formatCurrency(smoothResult.earlyRetireCostMonthly)}</span>
                                        <span className="small text-muted d-block" style={{fontSize: '0.7rem'}}>/ month lifestyle cost</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 small mt-auto">
                                <div className="fw-bold text-main mb-1">How to Use These Levers:</div>
                                <p className="text-muted mb-0" style={{fontSize: '0.78rem', lineHeight: 1.4}}>
                                    Use these marginal trade-offs to design your ideal retirement balance. For example, delaying CPP to age 70 often fully offsets the cost of retiring a year or two earlier!
                                </p>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}