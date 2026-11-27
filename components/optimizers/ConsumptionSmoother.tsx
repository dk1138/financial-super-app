'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { SegmentedControl, CurrencyInput, StepperInput, InfoBtn } from '../SharedUI';

export default function ConsumptionSmoother() {
    const { data } = useFinance();

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
    const workerRef = useRef<Worker | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    const inputsKey = JSON.stringify(data.inputs);
    const expensesKey = JSON.stringify(data.expensesByCategory);

    useEffect(() => {
        setIsCalculating(true);
        let active = true;
        const timer = setTimeout(() => {
            if (!active) return;
            workerRef.current?.terminate();
            try {
                const worker = new Worker(new URL('../../lib/financeWorker.ts', import.meta.url));
                workerRef.current = worker;

                worker.onmessage = (e: MessageEvent) => {
                    if (!active) return;
                    if (e.data?.status === 'success') {
                        setSmoothResult(e.data.results);
                    }
                    setIsCalculating(false);
                    worker.terminate();
                    if (workerRef.current === worker) workerRef.current = null;
                };

                worker.onerror = () => {
                    if (!active) return;
                    setIsCalculating(false);
                    worker.terminate();
                    if (workerRef.current === worker) workerRef.current = null;
                };

                worker.postMessage({
                    type: 'consumptionSmoother',
                    data: JSON.parse(JSON.stringify(data)),
                    testRetAge,
                    targetLegacy,
                });
            } catch (err) {
                console.error('ConsumptionSmoother worker error:', err);
                if (active) setIsCalculating(false);
            }
        }, 120);

        return () => {
            active = false;
            clearTimeout(timer);
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, [inputsKey, expensesKey, testRetAge, targetLegacy, useRealDollars, data.mode]);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-speedometer2 fs-4"></i>
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Consumption Smoothing &amp; Die With Zero</h5>
                        <InfoBtn 
                            title="Consumption Smoothing & Die With Zero" 
                            text="Works backward from your net worth, CPP, OAS, pensions, and Canadian tax brackets to find the <b>exact maximum flat discretionary living standard</b> (in today's purchasing power) you can spend every year to life expectancy without running out of money. Set Target Estate Legacy to <b>$0</b> for a pure <b>Die With Zero</b> strategy."
                            align="right"
                        />
                    </div>
                </div>
            </div>

            <p className="text-muted small mb-3">
                Calculate your maximum sustainable retirement spending ceiling (including pure <strong>Die With Zero</strong> at $0 legacy) and test how retirement age and CPP timing adjust your monthly spending power.
            </p>

            {/* Inputs Grid */}
            <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <label className="form-label small text-muted fw-bold mb-0">Target Estate Legacy Floor ($)</label>
                        {targetLegacy !== 0 && (
                            <button
                                type="button"
                                onClick={() => setTargetLegacy(0)}
                                className="btn btn-link btn-sm p-0 text-primary fw-bold text-decoration-none"
                                style={{ fontSize: '0.7rem' }}
                                title="Set target estate floor to $0 for pure Die With Zero spending"
                            >
                                Die With Zero ($0)
                            </button>
                        )}
                    </div>
                    <CurrencyInput 
                        value={targetLegacy} 
                        onChange={(v: any) => setTargetLegacy(v || 0)} 
                        placeholder="0 (Die With Zero)" 
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