import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { InfoBtn } from '../SharedUI';

export default function SorrCard() {
    const { data, results } = useFinance();
    const [sorrData, setSorrData] = useState<any[]>([]);
    const [isSorrSuccess, setIsSorrSuccess] = useState(false);
    const [shortfallYear, setShortfallYear] = useState<number | null>(null);
    const [isSorrCalculating, setIsSorrCalculating] = useState(true);

    const formatCurrency = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
        if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${Math.round(val)}`;
    };

    useEffect(() => {
        if (!results || !results.timeline) return;
        setIsSorrCalculating(true);
        
        setTimeout(() => {
            const retAge = Number(data.inputs.p1_retireAge) || 65;
            const currentAge = Number(data.inputs.p1_age) || 35;
            const retYearIndex = Math.max(0, retAge - currentAge);
            
            const shockSeq = new Array(100).fill(0);
            shockSeq[retYearIndex] = -0.35;      
            shockSeq[retYearIndex + 1] = -0.15;  
            shockSeq[retYearIndex + 2] = 0.05;   
            shockSeq[retYearIndex + 3] = 0.05;   

            const clonedData = JSON.parse(JSON.stringify(data));
            const sorrEngine = new FinanceEngine(clonedData);
            const sorrTimeline = sorrEngine.runSimulation(true, { shockSequence: shockSeq });

            let localChartData: any[] = [];
            let failedYear = null;
            let ok = true;

            for (let i=0; i<results.timeline.length; i++) {
                const baseYear = results.timeline[i];
                const sorrYear = sorrTimeline[i];
                if (!baseYear || !sorrYear) break;

                const baseNW = baseYear.liquidNW + (baseYear.reIncludedEq || 0);
                const sorrNW = sorrYear.liquidNW + (sorrYear.reIncludedEq || 0);
                
                localChartData.push({
                    year: baseYear.year,
                    age: baseYear.p1Age,
                    Base: baseNW,
                    Crash: Math.max(0, sorrNW)
                });

                if (sorrYear.liquidNW < 1 && ok && baseYear.p1Age >= retAge) {
                    ok = false;
                    failedYear = sorrYear.p1Age;
                }
            }
            setSorrData(localChartData);
            setIsSorrSuccess(ok);
            setShortfallYear(failedYear);
            setIsSorrCalculating(false);
        }, 50);
    }, [data, results]);

    const CustomSorrTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-input border border-secondary p-3 rounded-4 shadow-lg" style={{ minWidth: '220px' }}>
                    <p className="fw-bold mb-2 border-bottom border-secondary pb-2 text-muted text-uppercase ls-1" style={{fontSize: '0.75rem'}}>Age {label}</p>
                    <div className="d-flex flex-column gap-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="d-flex justify-content-between align-items-center gap-4">
                                <div className="d-flex align-items-center">
                                    <span className="rounded-circle me-2" style={{width: '8px', height: '8px', backgroundColor: entry.color}}></span>
                                    <span className="fw-bold small text-muted">{entry.name}</span>
                                </div>
                                <span className="fw-bolder text-main small">{formatCurrency(entry.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-0"><i className="bi bi-activity me-2 text-warning"></i>Market Timing Risk</h5>
                {isSorrCalculating && <span className="spinner-border spinner-border-sm text-warning"></span>}
            </div>

            <div className="row mb-5">
                <div className="col-12">
                    <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm overflow-hidden position-relative h-100 d-flex flex-column">
                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-4 gap-3">
                            <div>
                                <h5 className="fw-bold text-main d-flex align-items-center mb-2">
                                    Sequence of Returns Risk (SORR)
                                    <InfoBtn align="left" title="Sequence of Returns Risk" text="A catastrophic sequence where a massive market crash occurs in the exact first year of your retirement, followed by several years of stagnation.<br/><br/>Because you are actively withdrawing money during the crash, your portfolio suffers permanent damage that normal average returns cannot heal." />
                                </h5>
                                <p className="text-muted small mb-0" style={{maxWidth: '600px'}}>
                                    This sandbox simulates a devastating -35% market crash in the very first year of your retirement, followed by a -15% drop the next year. It stress-tests whether your withdrawal rate is low enough to survive a "Lost Decade".
                                </p>
                            </div>
                            <div className="flex-shrink-0 text-md-end">
                                <span className="small text-muted fw-bold text-uppercase ls-1 d-block mb-2">Stress Test Result</span>
                                {isSorrSuccess ? (
                                    <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-4 py-2 fs-6 shadow-sm"><i className="bi bi-shield-fill-check me-2"></i> PLAN SURVIVES CRASH</span>
                                ) : (
                                    <div className="d-flex flex-column align-items-md-end">
                                        <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-4 py-2 fs-6 shadow-sm mb-2"><i className="bi bi-shield-fill-x me-2"></i> PLAN FAILS AT AGE {shortfallYear}</span>
                                        <span className="small text-muted fst-italic">Consider enabling Guardrails in the Strategy tab.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-grow-1" style={{ height: '400px' }}>
                            {sorrData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={sorrData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                                        <XAxis dataKey="age" stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} tickMargin={12} minTickGap={30} />
                                        <YAxis tickFormatter={(val) => formatCurrency(val)} stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} width={80} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomSorrTooltip />} cursor={{ stroke: 'var(--bs-danger)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <ReferenceLine x={data.inputs.p1_retireAge} stroke="var(--bs-primary)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Retirement Day (Crash Hits)', fill: 'var(--bs-primary)', fontSize: 11, fontWeight: 'bold' }} />
                                        <Line type="monotone" dataKey="Base" name="Normal Expected Growth" stroke="var(--bs-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--bs-primary)', stroke: '#16181d', strokeWidth: 2 }} opacity={0.4} />
                                        <Line type="monotone" dataKey="Crash" name="SORR Crash Scenario" stroke="var(--bs-danger)" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: 'var(--bs-danger)', stroke: '#16181d', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-100 h-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-danger opacity-50"></div></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}