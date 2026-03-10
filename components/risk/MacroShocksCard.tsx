import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

export default function MacroShocksCard() {
    const { data, results } = useFinance();
    const isCouple = data.mode === 'Couple';

    const [ltcAge, setLtcAge] = useState(82);
    const [ltcCost, setLtcCost] = useState(80000);
    const [ltcDuration, setLtcDuration] = useState(5);
    const [ltcResult, setLtcResult] = useState<any>(null);

    const [infRate, setInfRate] = useState(6.0);
    const [infResult, setInfResult] = useState<any>(null);

    const [widowAge, setWidowAge] = useState(75);
    const [widowResult, setWidowResult] = useState<any>(null);

    const [reCrashPct, setReCrashPct] = useState(30);
    const [reResult, setReResult] = useState<any>(null);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    const runSandbox = (modifyDataFn: (d: any) => void) => {
        const clonedData = JSON.parse(JSON.stringify(data));
        modifyDataFn(clonedData);
        const engine = new FinanceEngine(clonedData);
        return engine.runSimulation(true, null);
    };

    // Calculate Widow's Penalty on load if Couple
    useEffect(() => {
        if (!results || !results.timeline || !isCouple) return;
        const widowYr = results.timeline.find((y: any) => y.p1Age === widowAge);
        if (widowYr) {
            const jointGovt = (widowYr.cppP1||0) + (widowYr.cppP2||0) + (widowYr.oasP1||0) + (widowYr.oasP2||0);
            const jointPen = (widowYr.dbP1||0) + (widowYr.dbP2||0);
            const jointInc = jointGovt + jointPen;
            
            const survivorCpp = Math.min(16000, (widowYr.cppP1||0) + (widowYr.cppP2||0));
            const survivorOas = widowYr.oasP1||0;
            const survivorPen = (widowYr.dbP1||0) + ((widowYr.dbP2||0) * 0.6); 
            const survivorInc = survivorCpp + survivorOas + survivorPen;

            setWidowResult({
                jointIncome: jointInc,
                survivorIncome: survivorInc,
                drop: jointInc - survivorInc,
                dropPct: jointInc > 0 ? ((jointInc - survivorInc) / jointInc) * 100 : 0
            });
        }
    }, [results, widowAge, isCouple]);

    const runLtcShock = () => {
        const p1Age = Number(data.inputs.p1_age) || 35;
        const startYearOffset = Math.max(0, ltcAge - p1Age);
        const startYearStr = `${new Date().getFullYear() + startYearOffset}-01`;

        const ltcTimeline = runSandbox((d: any) => {
            if(!d.debt) d.debt = [];
            d.debt.push({ name: 'LTC Facility', amount: ltcCost, start: startYearStr, type: 'yearly', duration: ltcDuration, rate: 0 });
        });

        const baseFinal = results?.timeline[results.timeline.length - 1];
        const ltcFinal = ltcTimeline[ltcTimeline.length - 1];

        if (baseFinal && ltcFinal) {
            const bEstate = baseFinal.afterTaxEstate !== undefined ? baseFinal.afterTaxEstate : (baseFinal.liquidNW + (baseFinal.reIncludedEq || 0));
            const lEstate = ltcFinal.afterTaxEstate !== undefined ? ltcFinal.afterTaxEstate : (ltcFinal.liquidNW + (ltcFinal.reIncludedEq || 0));
            setLtcResult({
                baseEstate: bEstate,
                shockEstate: lEstate,
                survived: ltcTimeline.every((y:any) => y.liquidNW > 0)
            });
        }
    };

    const runInflationShock = () => {
        const infTimeline = runSandbox((d: any) => { d.inputs.inflation_rate = infRate; });
        const targetAge = 85;
        
        const baseYear = results?.timeline.find((y:any) => y.p1Age === targetAge);
        const infYear = infTimeline.find((y:any) => y.p1Age === targetAge);

        if (baseYear && infYear) {
            const baseReal = (baseYear.liquidNW + (baseYear.reIncludedEq || 0)) / Math.pow(1 + ((data.inputs.inflation_rate||2.1)/100), targetAge - (data.inputs.p1_age||35));
            const infReal = (infYear.liquidNW + (infYear.reIncludedEq || 0)) / Math.pow(1 + (infRate/100), targetAge - (data.inputs.p1_age||35));
            
            setInfResult({
                basePurchasingPower: baseReal,
                shockPurchasingPower: infReal,
                lossPct: baseReal > 0 ? ((baseReal - infReal) / baseReal) * 100 : 0
            });
        }
    };

    const runReCrash = () => {
        const crashTimeline = runSandbox((d: any) => {
            if (d.properties) {
                d.properties.forEach((p:any) => {
                    p.value = p.value * (1 - (reCrashPct/100));
                });
            }
        });
        const baseFinal = results?.timeline[results.timeline.length - 1];
        const crashFinal = crashTimeline[crashTimeline.length - 1];

        if (baseFinal && crashFinal) {
            const bEstate = baseFinal.afterTaxEstate !== undefined ? baseFinal.afterTaxEstate : (baseFinal.liquidNW + (baseFinal.reIncludedEq || 0));
            const cEstate = crashFinal.afterTaxEstate !== undefined ? crashFinal.afterTaxEstate : (crashFinal.liquidNW + (crashFinal.reIncludedEq || 0));
            setReResult({
                baseEstate: bEstate,
                shockEstate: cEstate,
                drop: bEstate - cEstate
            });
        }
    };

    return (
        <>
            <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-heart-pulse-fill me-2 text-danger"></i>Life & Macro Shocks</h5>
            <div className="row g-4">
                
                {/* LTC SHOCK */}
                <div className="col-12 col-xl-6">
                    <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                                <i className="bi bi-bandaid-fill fs-4"></i>
                            </div>
                            <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Long-Term Care Shock</h5>
                        </div>
                        <p className="text-muted small mb-4">Injects a massive healthcare expense into your retirement plan to see if your portfolio can survive a nursing home without bankrupting the surviving spouse.</p>
                        
                        <div className="row g-3 mb-4">
                            <div className="col-4">
                                <label className="form-label small fw-bold text-muted mb-1">Start Age</label>
                                <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ltcAge} onChange={e => setLtcAge(parseInt(e.target.value)||0)} />
                            </div>
                            <div className="col-4">
                                <label className="form-label small fw-bold text-muted mb-1">Duration (Yrs)</label>
                                <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ltcDuration} onChange={e => setLtcDuration(parseInt(e.target.value)||0)} />
                            </div>
                            <div className="col-4">
                                <label className="form-label small fw-bold text-muted mb-1">Cost /yr</label>
                                <CurrencyInput className="form-control form-control-sm border-danger text-danger" value={ltcCost} onChange={setLtcCost} />
                            </div>
                        </div>

                        <button className="btn btn-outline-danger w-100 fw-bold py-2 rounded-pill mt-auto mb-4" onClick={runLtcShock}>Run LTC Stress Test</button>

                        {ltcResult && (
                            <div className={`p-3 rounded-4 border shadow-inner text-center ${ltcResult.survived ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
                                <h6 className="fw-bold text-uppercase ls-1 small mb-3">Impact on Final Estate</h6>
                                <div className="d-flex justify-content-around align-items-center mb-2">
                                    <div className="d-flex flex-column text-muted small fw-bold"><span>Baseline</span><span className="text-main fs-6 mt-1">{formatCurrency(ltcResult.baseEstate)}</span></div>
                                    <i className="bi bi-arrow-right text-muted opacity-50"></i>
                                    <div className="d-flex flex-column small fw-bold"><span>Post-Shock</span><span className={`fs-6 mt-1 ${ltcResult.survived ? 'text-success' : 'text-danger'}`}>{formatCurrency(ltcResult.shockEstate)}</span></div>
                                </div>
                                {!ltcResult.survived && <span className="badge bg-danger mt-2">PORTFOLIO DEPLETED PREMATURELY</span>}
                            </div>
                        )}
                    </div>
                </div>

                {/* HIGH INFLATION DECADE */}
                <div className="col-12 col-xl-6">
                    <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                                <i className="bi bi-graph-down-arrow fs-4"></i>
                            </div>
                            <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">High Inflation Era</h5>
                        </div>
                        <p className="text-muted small mb-4">Overrides your baseline inflation assumption. Discover how badly a prolonged period of high inflation silently destroys your real purchasing power.</p>
                        
                        <div className="row g-3 mb-4">
                            <div className="col-12">
                                <label className="form-label small fw-bold text-muted mb-1">Simulated Persistent Inflation Rate</label>
                                <PercentInput className="form-control form-control-sm border-warning text-warning" value={infRate} onChange={setInfRate} />
                            </div>
                        </div>

                        <button className="btn btn-outline-warning w-100 fw-bold py-2 rounded-pill mt-auto mb-4" onClick={runInflationShock}>Run Inflation Stress Test</button>

                        {infResult && (
                            <div className="p-3 rounded-4 border border-warning bg-warning bg-opacity-10 shadow-inner text-center">
                                <h6 className="fw-bold text-uppercase ls-1 small text-warning mb-3">Real Purchasing Power at Age 85</h6>
                                <div className="d-flex justify-content-around align-items-center mb-2">
                                    <div className="d-flex flex-column text-muted small fw-bold"><span>Baseline</span><span className="text-main fs-6 mt-1">{formatCurrency(infResult.basePurchasingPower)}</span></div>
                                    <i className="bi bi-arrow-right text-warning opacity-50"></i>
                                    <div className="d-flex flex-column small fw-bold text-warning"><span>Post-Shock</span><span className="fs-6 mt-1">{formatCurrency(infResult.shockPurchasingPower)}</span></div>
                                </div>
                                <span className="badge bg-warning text-dark mt-2 fw-bold px-3">Wealth Eroded by {infResult.lossPct.toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* WIDOW'S PENALTY */}
                {isCouple && (
                    <div className="col-12 col-xl-6">
                        <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-purple bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0, color: 'var(--bs-purple)'}}>
                                    <i className="bi bi-person-dash-fill fs-4"></i>
                                </div>
                                <h5 className="fw-bold mb-0 text-uppercase ls-1" style={{color: 'var(--bs-purple)'}}>The Widow's Penalty</h5>
                            </div>
                            <p className="text-muted small mb-4">Calculates the immediate loss of household income (lost OAS, CPP max caps, reduced pensions) if one spouse passes away early.</p>
                            
                            <div className="row g-3 mb-4">
                                <div className="col-12">
                                    <label className="form-label small fw-bold text-muted mb-1">Simulated Age of Death (P2)</label>
                                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={widowAge} onChange={e => setWidowAge(parseInt(e.target.value)||0)} />
                                </div>
                            </div>

                            {widowResult ? (
                                <div className="p-3 rounded-4 border border-secondary bg-black bg-opacity-25 shadow-inner mt-auto">
                                    <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                                        <span className="text-muted fw-bold small">Joint Gov/Pension Income</span>
                                        <span className="fw-bold text-main">{formatCurrency(widowResult.jointIncome)} <span className="small text-muted fw-normal">/yr</span></span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <span className="text-muted fw-bold small">Survivor Income <InfoBtn title="Survivor Income" text="Survivor retains 1 OAS, max 1 standard CPP limit, and 60% of spouse's DB pension." /></span>
                                        <span className="fw-bold text-danger">{formatCurrency(widowResult.survivorIncome)} <span className="small text-muted fw-normal">/yr</span></span>
                                    </div>
                                    <div className="text-center">
                                        <span className="badge px-3 py-2" style={{backgroundColor: 'var(--bs-purple)'}}>Income Drops by {formatCurrency(widowResult.drop)} ({widowResult.dropPct.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-auto text-center text-muted small fst-italic py-4 border border-secondary border-opacity-25 rounded-4">
                                    Data available once retirement plan is calculated.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* REAL ESTATE CRASH */}
                <div className="col-12 col-xl-6">
                    <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                        <div className="d-flex align-items-center mb-3">
                            <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                                <i className="bi bi-houses-fill fs-4"></i>
                            </div>
                            <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Real Estate Crash</h5>
                        </div>
                        <p className="text-muted small mb-4">Many Canadians rely on downsizing to fund their late-stage retirement. Test what happens if the housing market crashes exactly when you plan to sell.</p>
                        
                        <div className="row g-3 mb-4">
                            <div className="col-12">
                                <label className="form-label small fw-bold text-muted mb-1">Property Value Drop</label>
                                <PercentInput className="form-control form-control-sm border-info text-info" value={reCrashPct} onChange={setReCrashPct} />
                            </div>
                        </div>

                        <button className="btn btn-outline-info w-100 fw-bold py-2 rounded-pill mt-auto mb-4" onClick={runReCrash}>Run Housing Stress Test</button>

                        {reResult && (
                            <div className="p-3 rounded-4 border border-info bg-info bg-opacity-10 shadow-inner text-center">
                                <h6 className="fw-bold text-uppercase ls-1 small text-info mb-3">Impact on Final Estate</h6>
                                <div className="d-flex justify-content-around align-items-center mb-2">
                                    <div className="d-flex flex-column text-muted small fw-bold"><span>Baseline</span><span className="text-main fs-6 mt-1">{formatCurrency(reResult.baseEstate)}</span></div>
                                    <i className="bi bi-arrow-right text-info opacity-50"></i>
                                    <div className="d-flex flex-column small fw-bold text-info"><span>Post-Crash</span><span className="fs-6 mt-1 text-danger">{formatCurrency(reResult.shockEstate)}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </>
    );
}