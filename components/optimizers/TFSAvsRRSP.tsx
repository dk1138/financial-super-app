'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { getInflatedTaxData, calculateTaxDetailed } from '../../lib/engine/tax';
import { SegmentedControl } from '../SharedUI';

export default function TFSAvsRRSP() {
    const { data } = useFinance();
    const [isCalculating, setIsCalculating] = useState(false);
    const [tfsaRrspResult, setTfsaRrspResult] = useState<any>(null);
    const [activeTarget, setActiveTarget] = useState<'p1' | 'p2'>('p1');

    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            const engine = new FinanceEngine(data);
            const prov = data.inputs.tax_province || 'ON';
            
            // Using the new standalone tax engine method
            const taxDataObj = getInflatedTaxData(engine.CONSTANTS.TAX_DATA, 1);
            
            const currentInc = Number(data.inputs[`${activeTarget}_income`]) || 0;
            // Passed engine.CONSTANTS as the new 4th argument
            const currentTax = calculateTaxDetailed(currentInc, prov, taxDataObj, engine.CONSTANTS, 0, 0, currentInc, 1, 0);
            const currMarginal = currentTax.margRate;

            const baseCheck = engine.runSimulation(true, null);
            let totalRetTax = 0;
            let totalRetInc = 0;
            
            baseCheck.forEach((y: any) => {
                const ageKey = activeTarget === 'p1' ? 'p1Age' : 'p2Age';
                const taxKey = activeTarget === 'p1' ? 'taxP1' : 'taxP2';
                const incKey = activeTarget === 'p1' ? 'taxIncP1' : 'taxIncP2';
                const retireAgeLimit = Number(data.inputs[`${activeTarget}_retireAge`]) || 65;

                if (y[ageKey] >= retireAgeLimit) {
                    totalRetTax += y[taxKey] || 0;
                    totalRetInc += y[incKey] || 0;
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
        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs), activeTarget]);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between border-bottom border-secondary border-opacity-25 pb-3 mb-3 gap-3">
                <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                        <i className="bi bi-scale fs-4"></i>
                    </div>
                    <div>
                        <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">TFSA vs RRSP</h5>
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
            
            <p className="text-muted small mb-4">Compares your current marginal tax rate against your projected effective tax rate in retirement to tell you where your next dollar should go.</p>

            <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2 position-relative">
                {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border text-info"></span></div>}
                
                {tfsaRrspResult ? (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fw-bold small">Current Marginal Rate ({activeTarget === 'p1' ? p1Name : p2Name}):</span>
                            <span className="fw-bold text-danger fs-5">{(tfsaRrspResult.currentMarginal * 100).toFixed(1)}%</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom border-secondary border-opacity-50">
                            <span className="text-muted fw-bold small">Est. Retirement Tax Rate:</span>
                            <span className="fw-bold text-info fs-5">{(tfsaRrspResult.avgRetTaxRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="text-center mt-2">
                            <span className="text-muted fw-bold small text-uppercase ls-1 mb-1 d-block">Mathematical Winner</span>
                            <span className={`display-6 fw-bolder ${tfsaRrspResult.winner === 'RRSP' ? 'text-warning' : 'text-primary'}`}>{tfsaRrspResult.winner}</span>
                        </div>
                    </>
                ) : (
                    <span className="text-muted fst-italic text-center">Awaiting calculation...</span>
                )}
            </div>
            <span className="small text-muted text-center fst-italic mt-2"><i className="bi bi-info-circle me-1"></i> If current rate &gt; retirement rate, RRSP wins. Otherwise TFSA.</span>
        </div>
    );
}