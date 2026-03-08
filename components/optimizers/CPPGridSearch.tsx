import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';

export default function CPPGridSearch() {
    const { data, updateInput } = useFinance();
    const isCouple = data.mode === 'Couple';
    
    const [isCalculating, setIsCalculating] = useState(false);
    const [cppResult, setCppResult] = useState<any>(null);
    const [toastMsg, setToastMsg] = useState('');

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    const getRealValue = (nominalValue: number, startYear: number, endYear: number) => {
        if (!data.useRealDollars) return nominalValue;
        const inflation = (data.inputs.inflation_rate || 2.1) / 100;
        const yearsOut = Math.max(0, endYear - startYear);
        return nominalValue / Math.pow(1 + inflation, yearsOut);
    };

    const runSandbox = (inputOverrides: any = {}) => {
        const clonedData = JSON.parse(JSON.stringify(data));
        Object.assign(clonedData.inputs, inputOverrides);
        const engine = new FinanceEngine(clonedData);
        return engine.runSimulation(true, null);
    };

    useEffect(() => {
        setIsCalculating(true);
        const timer = setTimeout(() => {
            const cppResultsArr: any[] = [];
            for (let cpp = 60; cpp <= 70; cpp++) {
                for (let oas = 65; oas <= 70; oas++) {
                    const overrides = { 
                        p1_cpp_start: cpp, p2_cpp_start: cpp,
                        p1_oas_start: oas, p2_oas_start: oas 
                    };
                    const timeline = runSandbox(overrides);
                    const startYear = timeline[0].year;
                    const finalEstate = timeline[timeline.length - 1].afterTaxEstate !== undefined ? timeline[timeline.length - 1].afterTaxEstate : (timeline[timeline.length - 1].liquidNW + (timeline[timeline.length - 1].reIncludedEq || 0));
                    
                    cppResultsArr.push({
                        cppAge: cpp,
                        oasAge: oas,
                        finalEstate: getRealValue(finalEstate, startYear, timeline[timeline.length-1].year)
                    });
                }
            }

            const sortedCpp = [...cppResultsArr].sort((a, b) => b.finalEstate - a.finalEstate);
            setCppResult({
                winner: sortedCpp[0],
                scenarios: sortedCpp.slice(0, 5)
            });
            setIsCalculating(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [JSON.stringify(data.inputs)]);

    const applyCppStrategy = () => {
        if (cppResult && cppResult.winner) {
            const optCpp = cppResult.winner.cppAge;
            const optOas = cppResult.winner.oasAge;
            updateInput('p1_cpp_start', optCpp);
            updateInput('p1_oas_start', optOas);
            if (isCouple) {
                updateInput('p2_cpp_start', optCpp);
                updateInput('p2_oas_start', optOas);
            }
            setToastMsg(`CPP set to ${optCpp}, OAS set to ${optOas}!`);
            setTimeout(() => setToastMsg(''), 3000);
        }
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            
            {toastMsg && (
                <div className="position-absolute top-0 start-50 translate-middle-x mt-3 transition-all" style={{zIndex: 1060}}>
                    <div className="bg-success text-white px-3 py-2 rounded-pill shadow-lg d-flex align-items-center fw-bold small border border-success">
                        <i className="bi bi-check-circle-fill me-2"></i> {toastMsg}
                    </div>
                </div>
            )}

            <div className="d-flex align-items-center mb-3">
                <div className="bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0, color:'var(--bs-purple)', backgroundColor: 'rgba(111, 66, 193, 0.25)'}}>
                    <i className="bi bi-bank fs-4"></i>
                </div>
                <h5 className="fw-bold mb-0 text-uppercase ls-1" style={{color:'var(--bs-purple)'}}>CPP / OAS Grid Search</h5>
            </div>
            <p className="text-muted small mb-4">Tests all 66 combinations of taking CPP (60-70) and OAS (65-70) to find the absolute highest after-tax final estate.</p>

            <div className="flex-grow-1 d-flex flex-column p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4 position-relative">
                {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border" style={{color: 'var(--bs-purple)'}}></span></div>}
                
                {cppResult ? (
                    <div className="d-flex flex-column w-100 gap-3">
                        {cppResult.scenarios.map((sc: any, idx: number) => {
                            const isWinner = idx === 0;
                            const pctOfWinner = (sc.finalEstate / cppResult.winner.finalEstate) * 100;
                            return (
                                <div key={idx} className="d-flex flex-column w-100">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <span className={`fw-bold small ${isWinner ? 'text-purple' : 'text-muted'}`} style={isWinner ? {color:'var(--bs-purple)'} : {}}>
                                            CPP: {sc.cppAge} <span className="mx-1 opacity-25">|</span> OAS: {sc.oasAge} {isWinner && <i className="bi bi-trophy-fill ms-1"></i>}
                                        </span>
                                        <span className={`fw-bold small ${isWinner ? 'text-main' : 'text-muted'}`}>{formatCurrency(sc.finalEstate)}</span>
                                    </div>
                                    <div className="w-100 bg-black bg-opacity-25 rounded-pill overflow-hidden shadow-inner" style={{height: '6px'}}>
                                        <div className="h-100 rounded-pill transition-all" style={{width: `${Math.max(2, pctOfWinner)}%`, backgroundColor: isWinner ? 'var(--bs-purple)' : '#6c757d'}}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="d-flex align-items-center justify-content-center h-100">
                        <span className="text-muted fst-italic text-center">Awaiting calculation...</span>
                    </div>
                )}
            </div>

            <button 
                className="btn fw-bold w-100 d-flex align-items-center justify-content-center text-white py-2 mt-auto" 
                style={{backgroundColor: 'var(--bs-purple)', borderColor: 'var(--bs-purple)'}}
                disabled={!cppResult || isCalculating}
                onClick={applyCppStrategy}
            >
                <i className="bi bi-box-arrow-in-down-right me-2"></i> Apply Winner
            </button>
        </div>
    );
}