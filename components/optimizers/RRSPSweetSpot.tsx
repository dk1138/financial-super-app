import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { InfoBtn } from '../SharedUI';

export default function RRSPSweetSpot() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [sweetSpotTab, setSweetSpotTab] = useState<'p1'|'p2'>('p1');
    const [rrspSweetSpot, setRrspSweetSpot] = useState<any>(null);

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
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
            setIsCalculating(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs)]);

    const currentSweetSpot = rrspSweetSpot?.[sweetSpotTab];
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-arrow-down-up fs-4"></i>
                </div>
                <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">RRSP Sweet Spot</h5>
            </div>
            <p className="text-muted small mb-4">Calculates the exact RRSP contribution needed to ride your current marginal tax bracket all the way to the floor before it drops.</p>

            {isCouple && (
                <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                    <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${sweetSpotTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setSweetSpotTab('p1')}>Player 1</button>
                    <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${sweetSpotTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setSweetSpotTab('p2')}>Player 2</button>
                </div>
            )}

            <div className="flex-grow-1 d-flex flex-column justify-content-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2 position-relative">
                {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border text-primary"></span></div>}
                
                {currentSweetSpot && currentSweetSpot.contribution > 0 ? (
                    <>
                        <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Optimal Contribution</span>
                        <span className="fs-2 fw-bolder text-primary mb-2">{formatCurrency(currentSweetSpot.contribution)}</span>
                        
                        <div className="d-flex justify-content-between w-100 px-2 mt-3 pt-3 border-top border-secondary border-opacity-50">
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
    );
}