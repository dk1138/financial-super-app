import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';

export default function DieWithZero() {
    const { data } = useFinance();
    const [isCalculating, setIsCalculating] = useState(false);
    const [maxSpendResult, setMaxSpendResult] = useState<any>(null);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    const getRealValue = (nominalValue: number, startYear: number, endYear: number) => {
        if (!data.useRealDollars) return nominalValue;
        const inflation = (data.inputs.inflation_rate || 2.1) / 100;
        const yearsOut = Math.max(0, endYear - startYear);
        return nominalValue / Math.pow(1 + inflation, yearsOut);
    };

    const runSandbox = (expenseMultiplier: number = 1.0) => {
        const clonedData = JSON.parse(JSON.stringify(data));
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

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            let low = 0.05; 
            let high = 5.0; 
            let bestMultiplier = 0;
            let bestEstate = 0;
            let bestTimeline: any = null;

            for (let i = 0; i < 15; i++) { 
                const mid = (low + high) / 2;
                const timeline = runSandbox(mid);
                const isSuccess = timeline.every((y: any) => y.liquidNW > 0);

                if (isSuccess) {
                    bestMultiplier = mid;
                    bestEstate = timeline[timeline.length - 1].afterTaxEstate !== undefined ? timeline[timeline.length - 1].afterTaxEstate : (timeline[timeline.length - 1].liquidNW + (timeline[timeline.length - 1].reIncludedEq || 0));
                    bestTimeline = timeline;
                    low = mid; 
                } else {
                    high = mid; 
                }
            }

            if (bestTimeline && bestMultiplier > 0) {
                const baseTimeline = runSandbox();
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
                setMaxSpendResult({ difference: -999999, optSpend: 0 });
            }
            setIsCalculating(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs), JSON.stringify(data.expensesByCategory)]);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-bullseye fs-4"></i>
                </div>
                <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">Die With Zero</h5>
            </div>
            <p className="text-muted small mb-4">Calculates the absolute maximum lifestyle you can afford every year without running out of money before your life expectancy.</p>

            <div className="flex-grow-1 d-flex flex-column justify-content-center align-items-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4 position-relative overflow-hidden">
                {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 10}}><span className="spinner-border text-success" style={{width: '3rem', height: '3rem'}}></span></div>}
                
                {maxSpendResult ? (
                    maxSpendResult.difference > 0 ? (
                        <>
                            <span className="text-muted fw-bold text-uppercase ls-1 mb-2" style={{letterSpacing: '0.1rem'}}>Max Safe Spend</span>
                            <span className="display-3 fw-bolder text-success mb-3 lh-1" style={{letterSpacing: '-2px'}}>{formatCurrency(maxSpendResult.optSpend)} <span className="fs-5 text-muted fw-bold" style={{letterSpacing: '0px'}}>/yr</span></span>
                            <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-4 py-2 shadow-sm fs-6">
                                <i className="bi bi-arrow-up-circle-fill me-2"></i>You can spend {formatCurrency(maxSpendResult.difference)} more per year
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-muted fw-bold text-uppercase ls-1 mb-2" style={{letterSpacing: '0.1rem'}}>Current Plan Status</span>
                            <span className="display-4 fw-bolder text-danger mb-3 lh-1">Overspending</span>
                            <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-4 py-2 text-wrap shadow-sm fs-6" style={{lineHeight: 1.5}}>
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>Cut expenses by {formatCurrency(Math.abs(maxSpendResult.difference))} /yr
                            </span>
                        </>
                    )
                ) : (
                    <span className="text-muted fst-italic">Awaiting calculation...</span>
                )}
            </div>
        </div>
    );
}