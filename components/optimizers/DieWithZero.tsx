import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../../lib/FinanceContext';

export default function DieWithZero() {
    const { data } = useFinance();
    const [isCalculating, setIsCalculating] = useState(false);
    const [maxSpendResult, setMaxSpendResult] = useState<any>(null);
    const workerRef = useRef<Worker | null>(null);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

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
                        setMaxSpendResult(e.data.results);
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
                    type: 'dieWithZero',
                    data: JSON.parse(JSON.stringify(data)),
                });
            } catch {
                if (active) setIsCalculating(false);
            }
        }, 120);

        return () => {
            active = false;
            clearTimeout(timer);
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, [inputsKey, expensesKey, data.useRealDollars, data.mode]);

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