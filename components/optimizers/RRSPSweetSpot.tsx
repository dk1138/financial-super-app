'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { getInflatedTaxData, calculateTaxDetailed } from '../../lib/engine/tax';
import { SegmentedControl, CurrencyInput } from '../SharedUI';

export default function RRSPSweetSpot() {
    const { data } = useFinance();
    const [isCalculating, setIsCalculating] = useState(false);
    const [sweetSpotResult, setSweetSpotResult] = useState<any>(null);
    const [activeTarget, setActiveTarget] = useState<'p1' | 'p2'>('p1');
    const [targetContribution, setTargetContribution] = useState<number>(10000);

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
            
            // Base tax position
            const baseTax = calculateTaxDetailed(currentInc, prov, taxDataObj, engine.CONSTANTS, 0, 0, currentInc, 1, 0);
            
            // Post-contribution position
            const postRrspInc = Math.max(0, currentInc - targetContribution);
            const postRrspTax = calculateTaxDetailed(postRrspInc, prov, taxDataObj, engine.CONSTANTS, 0, 0, currentInc, 1, 0);
            
            const totalSavings = baseTax.totalTax - postRrspTax.totalTax;
            const blendedRate = targetContribution > 0 ? totalSavings / targetContribution : 0;

            // Marginal tax rate on the next immediate dollar deducted
            const nextDollarTax = calculateTaxDetailed(Math.max(0, postRrspInc - 100), prov, taxDataObj, engine.CONSTANTS, 0, 0, currentInc, 1, 0);
            const nextMarginalRate = (postRrspTax.totalTax - nextDollarTax.totalTax) / 100;

            setSweetSpotResult({
                startingMarginal: baseTax.margRate,
                nextMarginal: nextMarginalRate,
                totalSavings: totalSavings,
                blendedRate: blendedRate
            });

            setIsCalculating(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs), activeTarget, targetContribution]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            {/* Header Area */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-calculator fs-4"></i>
                </div>
                <div>
                    <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">RRSP Deduction Sweet Spot</h5>
                </div>
            </div>

            {/* Selection Pill Row - Repositioned Below Title */}
            {isCouple && (
                <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                    <SegmentedControl 
                        value={activeTarget} 
                        onChange={(val: any) => setActiveTarget(val)} 
                        options={[
                            { value: 'p1', label: p1Name },
                            { value: 'p2', label: p2Name }
                        ]} 
                    />
                </div>
            )}
            
            <p className="text-muted small mb-4">Analyzes large lump-sum contributions against current progressive tax brackets to track efficiency drops and locate the visual inflection boundary where additional savings yield diminishing refunds.</p>

            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <label className="form-label small text-muted fw-bold mb-1">Target Contribution Size ($)</label>
                    <CurrencyInput className="form-control" value={targetContribution} onChange={(val: any) => setTargetContribution(Number(val) || 0)} />
                </div>
                <div className="col-12 col-md-6 d-flex align-items-end">
                    <div className="small text-muted mb-2">
                        Testing for: <span className="fw-bold text-main">{activeTarget === 'p1' ? p1Name : p2Name}</span> (Base Salary: {formatCurrency(Number(data.inputs[`${activeTarget}_income`]) || 0)})
                    </div>
                </div>
            </div>

            <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2 position-relative">
                {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border text-primary"></span></div>}
                
                {sweetSpotResult ? (
                    <>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fw-bold small">Starting Marginal Rate (Tier 1):</span>
                            <span className="fw-bold text-main">{(sweetSpotResult.startingMarginal * 100).toFixed(1)}%</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="text-muted fw-bold small">Blended Tax Cash Recovery Rate:</span>
                            <span className="fw-bold text-success font-monospace">{(sweetSpotResult.blendedRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom border-secondary border-opacity-50">
                            <span className="text-muted fw-bold small">Next Dollar Fractional Recovery:</span>
                            <span className={`fw-bold fs-6 ${sweetSpotResult.nextMarginal < sweetSpotResult.startingMarginal ? 'text-warning' : 'text-main'}`}>
                                {(sweetSpotResult.nextMarginal * 100).toFixed(1)}%
                            </span>
                        </div>

                        <div className="text-center mt-2">
                            <span className="text-muted fw-bold small text-uppercase ls-1 mb-1 d-block">Estimated Total Refund Generated</span>
                            <span className="display-6 fw-bolder text-primary">{formatCurrency(sweetSpotResult.totalSavings)}</span>
                        </div>
                        
                        {sweetSpotResult.nextMarginal < sweetSpotResult.startingMarginal && (
                            <div className="mt-3 p-2 bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-3 small text-warning-emphasis text-center">
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                Notice: You have crossed a tax tier threshold. The final dollars of this contribution are returning a lower fraction than your top bracket rate.
                            </div>
                        )}
                    </>
                ) : (
                    <span className="text-muted fst-italic text-center">Awaiting calculation variables...</span>
                )}
            </div>
            <span className="small text-muted text-center fst-italic mt-2"><i className="bi bi-info-circle me-1"></i> If the final fractional rate matches your starting rate, your contribution sits comfortably inside your top bracket.</span>
        </div>
    );
}
//go