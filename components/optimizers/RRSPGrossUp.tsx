'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { getInflatedTaxData, calculateTaxDetailed } from '../../lib/engine/tax';
import { SegmentedControl, CurrencyInput } from '../SharedUI';

export default function RRSPGrossUp() {
    const { data } = useFinance();
    const [isCalculating, setIsCalculating] = useState(false);
    const [grossUpResult, setGrossUpResult] = useState<any>(null);
    const [activeTarget, setActiveTarget] = useState<'p1' | 'p2'>('p1');
    const [outOfPocket, setOutOfPocket] = useState<number>(5000);

    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            const engine = new FinanceEngine(data);
            const prov = data.inputs.tax_province || 'ON';
            const taxDataObj = getInflatedTaxData(engine.CONSTANTS.TAX_DATA, 1);
            
            const currentInc = Number(data.inputs[`${activeTarget}_income`]) || 0;
            
            // Calculate base tax position without any RRSP contribution
            const baseTax = calculateTaxDetailed(currentInc, prov, taxDataObj, engine.CONSTANTS, 0, 0, currentInc, 1, 0);
            const initialMarginal = baseTax.margRate;

            // Iterative algebraic convergence loop to find the exact gross-up limit maximizing the tax loan matching refund
            let low = outOfPocket;
            let high = outOfPocket * 2.5; 
            let structuralGrossUp = outOfPocket;
            let optimalRefund = 0;

            for (let i = 0; i < 20; i++) {
                const mid = (low + high) / 2;
                const testTax = calculateTaxDetailed(Math.max(0, currentInc - mid), prov, taxDataObj, engine.CONSTANTS, 0, 0, currentInc, 1, 0);
                const refundGenerated = baseTax.totalTax - testTax.totalTax;
                const loanNeeded = mid - outOfPocket;

                if (refundGenerated >= loanNeeded) {
                    structuralGrossUp = mid;
                    optimalRefund = refundGenerated;
                    low = mid; 
                } else {
                    high = mid; 
                }
            }

            setGrossUpResult({
                marginalRate: initialMarginal,
                optimalGrossUp: structuralGrossUp,
                loanNeeded: structuralGrossUp - outOfPocket,
                taxRefund: optimalRefund
            });

            setIsCalculating(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs), activeTarget, outOfPocket]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between border-bottom border-secondary border-opacity-25 pb-3 mb-3 gap-3">
                <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                        <i className="bi bi-arrow-up-right-circle fs-4"></i>
                    </div>
                    <div>
                        <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">RRSP Gross-Up Maximizer</h5>
                    </div>
                </div>
                
                {isCouple && (
                    <SegmentedControl 
                        value={activeTarget} 
                        onChange={(val: any) => setActiveTarget(val)} 
                        options={[
                            { value: 'p1', label: p1Name },
                            { value: 'p2', label: p2Name }
                        ]} 
                    />
                )}
            </div>
            
            <p className="text-muted small mb-4">Calculates the exact short-term RRSP catch-up loan required to perfectly amplify your out-of-pocket savings, using your upcoming tax refund to completely wipe out the loan balance within 90 days.</p>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <label className="form-label small text-muted fw-bold mb-1">Available Out-of-Pocket Cash ($)</label>
                    <CurrencyInput className="form-control" value={outOfPocket} onChange={(val: any) => setOutOfPocket(Number(val) || 0)} />
                </div>
                <div className="col-12 col-md-6 d-flex align-items-end">
                    <div className="small text-muted mb-2">
                        Testing for: <span className="fw-bold text-main">{activeTarget === 'p1' ? p1Name : p2Name}</span> (Base Salary: {formatCurrency(Number(data.inputs[`${activeTarget}_income`]) || 0)})
                    </div>
                </div>
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2 position-relative">
                {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border text-success"></span></div>}
                
                {grossUpResult ? (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fw-bold small">Current Marginal Tax Bracket:</span>
                            <span className="fw-bold text-main">{(grossUpResult.marginalRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fw-bold small">Your Cash Contribution:</span>
                            <span className="fw-bold text-main">{formatCurrency(outOfPocket)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25">
                            <span className="text-muted fw-bold small">Optimal Catch-Up Loan Match:</span>
                            <span className="fw-bold text-info">+{formatCurrency(grossUpResult.loanNeeded)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3 pt-1">
                            <span className="text-success fw-bold">Total Grossed-Up RRSP Deposit:</span>
                            <span className="fw-bolder text-success fs-5">{formatCurrency(grossUpResult.optimalGrossUp)}</span>
                        </div>

                        <div className="bg-success bg-opacity-10 border border-success border-opacity-25 p-3 rounded-3 text-center mt-2">
                            <span className="text-muted fw-bold small text-uppercase ls-1 mb-1 d-block">Resulting Spring Tax Refund</span>
                            <span className="display-6 fw-bolder text-success">{formatCurrency(grossUpResult.taxRefund)}</span>
                            <p className="small text-muted mb-0 mt-2 font-monospace" style={{fontSize: '0.7rem'}}>
                                (Refund of {formatCurrency(grossUpResult.taxRefund)} perfectly matches and eliminates the {formatCurrency(grossUpResult.loanNeeded)} loan balance)
                            </p>
                        </div>
                    </>
                ) : (
                    <span className="text-muted fst-italic text-center">Awaiting calculation parameters...</span>
                )}
            </div>
            <span className="small text-muted text-center fst-italic mt-2"><i className="bi bi-info-circle me-1"></i> Ensure you have sufficient RRSP deduction contribution room before implementing a gross-up leverage strategy.</span>
        </div>
    );
}