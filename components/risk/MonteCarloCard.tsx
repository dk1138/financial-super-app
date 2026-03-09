import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../../lib/config';
import { SegmentedControl } from '../SharedUI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonteCarloCard() {
    const { data } = useFinance();
    const [simCount, setSimCount] = useState(100);
    const [method, setMethod] = useState('random');
    const [volatility, setVolatility] = useState(0.12);
    const [isCalculating, setIsCalculating] = useState(false);
    const [chartData, setChartData] = useState<any[] | null>(null);
    const [successRate, setSuccessRate] = useState<number | null>(null);

    const runMonteCarlo = () => {
        setIsCalculating(true);
        setTimeout(() => {
          try {
            const trajectories: number[][] = [];
            const p1Age = data.inputs.p1_age || 38;
            const inflationRate = (data.inputs.inflation_rate || 2.1) / 100;
            
            for (let i = 0; i < simCount; i++) {
              const engine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
              let simContext: any = { method };
              if (method === 'historical') {
                 const sp500 = FINANCIAL_CONSTANTS.SP500_HISTORICAL;
                 const startIdx = Math.floor(Math.random() * sp500.length);
                 simContext.histSequence = [];
                 for(let y = 0; y < 100; y++) { simContext.histSequence.push(sp500[(startIdx + y) % sp500.length]); }
              } else {
                 simContext.volatility = volatility;
              }
              const result = engine.runSimulation(false, simContext);
              trajectories.push(result);
            }
            
            trajectories.sort((a, b) => a[a.length - 1] - b[b.length - 1]);
            const runs = trajectories.length;
            const successCount = trajectories.filter(t => t[t.length - 1] > 0).length;
            
            setSuccessRate(Number(((successCount / runs) * 100).toFixed(1)));
            const discount = (val: number, idx: number) => Math.max(0, Math.round(val / Math.pow(1 + inflationRate, idx)));
            
            // Format for Recharts (Array of Objects)
            const optData = trajectories[Math.floor(runs * 0.90)];
            const medData = trajectories[Math.floor(runs * 0.50)];
            const pesData = trajectories[Math.floor(runs * 0.10)];

            const formattedData = optData.map((_, i) => ({
                age: p1Age + i,
                optimistic: discount(optData[i], i),
                median: discount(medData[i], i),
                pessimistic: discount(pesData[i], i)
            }));
            
            setChartData(formattedData);
          } catch(err) { console.error(err); alert("Simulation failed."); }
          setIsCalculating(false);
        }, 50);
    };

    const formatCurrencyAxis = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
    };

    const gaugeRadius = 100;
    const gaugeCircumference = Math.PI * gaugeRadius;
    const gaugeStrokeDashoffset = successRate !== null ? gaugeCircumference - (successRate / 100) * gaugeCircumference : gaugeCircumference;
    const gaugeColor = successRate !== null ? (successRate >= 90 ? '#10b981' : successRate >= 75 ? '#f59e0b' : '#ef4444') : '#6c757d';

    const CustomTooltip = ({ active, payload, label }: any) => {
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
                                <span className="fw-bolder text-main small">{new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(entry.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const chartComponent = useMemo(() => {
        if (!chartData) return (
            <div className="d-flex flex-grow-1 align-items-center justify-content-center text-muted fst-italic p-5 border border-secondary border-opacity-25 rounded" style={{ height: '500px' }}>
                Click "Run Monte Carlo" to generate projections.
            </div>
        );
        return (
            <div style={{ height: '500px', position: 'relative', width: '100%', flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                        <XAxis dataKey="age" stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} tickMargin={12} minTickGap={30} />
                        <YAxis tickFormatter={(val) => formatCurrencyAxis(val)} stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} width={65} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        
                        <Line type="monotone" dataKey="optimistic" name="Optimistic (Top 10%)" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#10b981', stroke: '#16181d', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="median" name="Median Scenario" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6', stroke: '#16181d', strokeWidth: 2 }} />
                        <Line type="monotone" dataKey="pessimistic" name="Pessimistic (Bottom 10%)" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} activeDot={{ r: 6, fill: '#ef4444', stroke: '#16181d', strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        );
    }, [chartData]);

    return (
        <div className="row g-4 mb-4">
            <div className="col-12 col-xl-4">
                <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-gear-wide-connected me-2 text-primary"></i>Monte Carlo Setup</h5>
                <div className="rp-card p-4 surface-card border-secondary rounded-4 shadow-sm mb-4">
                    <label className="form-label small fw-bold text-muted mb-2">Number of Runs</label>
                    <SegmentedControl value={simCount} onChange={setSimCount} options={[{ value: 100, label: '100 (Fast)' }, { value: 500, label: '500 (Balanced)' }, { value: 1000, label: '1000 (Precise)' }]} />
                    <label className="form-label small fw-bold text-muted mb-2 mt-2">Simulation Method</label>
                    <SegmentedControl value={method} onChange={setMethod} options={[{ value: 'random', label: 'Standard (Bell Curve)' }, { value: 'historical', label: 'Historical (S&P500)' }]} />
                    {method === 'random' && (
                        <>
                            <label className="form-label small fw-bold text-muted mb-2 mt-2">Market Volatility</label>
                            <SegmentedControl value={volatility} onChange={setVolatility} options={[{ value: 0.08, label: 'Low (8%)' }, { value: 0.12, label: 'Med (12%)' }, { value: 0.16, label: 'High (16%)' }]} />
                        </>
                    )}
                    <button className="btn btn-primary w-100 fw-bold py-2 mt-4 shadow rounded-pill" onClick={runMonteCarlo} disabled={isCalculating}>
                        {isCalculating ? <><span className="spinner-border spinner-border-sm me-2"></span>Running...</> : <><i className="bi bi-play-circle-fill me-2"></i> Run Monte Carlo</>}
                    </button>
                </div>

                <div className="rp-card p-4 text-center surface-card border-secondary rounded-4 shadow-sm align-items-center">
                    <h6 className="text-muted small fw-bold text-uppercase ls-1 mb-3">Probability of Success</h6>
                    <div className="position-relative d-flex justify-content-center" style={{ width: '240px', height: '130px', overflow: 'hidden', margin: '0 auto' }}>
                        <svg width="240" height="120" viewBox="0 0 240 120">
                            <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="rgba(108, 117, 125, 0.2)" strokeWidth="25" strokeLinecap="round" />
                            <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={gaugeColor} strokeWidth="25" strokeLinecap="round" strokeDasharray={gaugeCircumference} strokeDashoffset={gaugeStrokeDashoffset} style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 1s ease' }} />
                        </svg>
                        <div className="position-absolute bottom-0 text-center" style={{ marginBottom: '-10px' }}>
                            <div className="display-4 fw-bolder" style={{ color: gaugeColor }}>{successRate !== null ? `${successRate}%` : '--'}</div>
                        </div>
                    </div>
                    <div className="mt-3 small fw-bold text-muted text-uppercase ls-1">
                        {successRate === null ? 'Run simulation' : (successRate >= 90 ? 'Highly Confident' : successRate >= 75 ? 'On Track' : 'Needs Adjustment')}
                    </div>
                </div>
            </div>

            <div className="col-12 col-xl-8 d-flex flex-column">
                <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-graph-up me-2 text-info"></i>Monte Carlo Distributions</h5>
                <div className="rp-card p-4 surface-card border border-secondary rounded-4 flex-grow-1 d-flex flex-column shadow-sm">
                    {chartComponent}
                </div>
            </div>
        </div>
    );
}