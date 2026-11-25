'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { SegmentedControl, InfoBtn } from '../SharedUI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MonteCarloCard() {
    const { data, mcResults, setMcResults } = useFinance();

    const [simCount, setSimCount] = useState<number>(mcResults?.simCount || 100);
    const [method, setMethod] = useState<'lhs' | 'qhs' | 'random' | 'historical'>(mcResults?.method || 'lhs');
    const [volatility, setVolatility] = useState<number>(mcResults?.volatility || 0.12);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    const [progress, setProgress] = useState<number>(0);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const runMonteCarlo = () => {
        setIsCalculating(true);
        setProgress(0);
        setErrorMsg(null);

        workerRef.current?.terminate();

        try {
            const worker = new Worker(new URL('../../lib/financeWorker.ts', import.meta.url));
            workerRef.current = worker;

            worker.onmessage = (e: MessageEvent) => {
                if (e.data.status === 'progress') {
                    setProgress(e.data.progress);
                } else if (e.data.status === 'success') {
                    setMcResults(e.data.results);
                    setIsCalculating(false);
                    setProgress(0);
                    worker.terminate();
                    if (workerRef.current === worker) workerRef.current = null;
                } else {
                    console.error('Monte Carlo Worker Error:', e.data.error);
                    setErrorMsg('Simulation failed. Please review your plan inputs and try again.');
                    setIsCalculating(false);
                    setProgress(0);
                    worker.terminate();
                    if (workerRef.current === worker) workerRef.current = null;
                }
            };

            worker.onerror = (err) => {
                console.error('Monte Carlo Worker Error:', err);
                setErrorMsg('Simulation failed unexpectedly in background worker.');
                setIsCalculating(false);
                setProgress(0);
                worker.terminate();
                if (workerRef.current === worker) workerRef.current = null;
            };

            worker.postMessage({
                type: 'monteCarlo',
                data: JSON.parse(JSON.stringify(data)),
                simCount,
                method,
                volatility,
            });
        } catch (err) {
            console.error(err);
            setErrorMsg('Unable to start background simulation worker.');
            setIsCalculating(false);
            setProgress(0);
        }
    };

    const formatCurrencyAxis = (val: number) => {
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
    };

    const chartData = mcResults?.chartData || null;
    const successRate = mcResults?.successRate ?? null;

    const gaugeRadius = 100;
    const gaugeCircumference = Math.PI * gaugeRadius;
    const gaugeStrokeDashoffset = successRate !== null ? gaugeCircumference - (successRate / 100) * gaugeCircumference : gaugeCircumference;
    const gaugeColor = successRate !== null ? (successRate >= 90 ? '#10b981' : successRate >= 75 ? '#f59e0b' : '#ef4444') : '#6c757d';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-input border border-secondary p-3 rounded-4 shadow-lg" style={{ minWidth: '220px' }}>
                    <p className="fw-bold mb-2 border-bottom border-secondary pb-2 text-muted text-uppercase ls-1" style={{fontSize: '0.75rem'}}>
                        Age {label} <span className="opacity-75">(Liquid NW)</span>
                    </p>
                    <div className="d-flex flex-column gap-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="d-flex justify-content-between align-items-center gap-4">
                                <div className="d-flex align-items-center">
                                    <span className="rounded-circle me-2" style={{width: '8px', height: '8px', backgroundColor: entry.color}}></span>
                                    <span className="fw-bold small text-muted">{entry.name}</span>
                                </div>
                                <span className="fw-bolder text-main small">
                                    {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(entry.value)}
                                </span>
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
            <div className="d-flex flex-grow-1 flex-column align-items-center justify-content-center text-muted p-5 border border-secondary border-opacity-25 rounded text-center" style={{ height: '500px' }}>
                <i className="bi bi-graph-up-arrow fs-1 mb-2 opacity-50"></i>
                <span className="fst-italic">Click &ldquo;Run Monte Carlo&rdquo; to generate projections.</span>
                <span className="small mt-2 opacity-75">Uses Latin Hypercube Sampling (LHS) for smooth, non-clumping probability distributions.</span>
            </div>
        );
        return (
            <div style={{ height: '500px', position: 'relative', width: '100%', flexGrow: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                        <XAxis dataKey="age" stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} tickMargin={12} minTickGap={30} />
                        <YAxis tickFormatter={(val: number) => formatCurrencyAxis(val)} stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} width={65} axisLine={false} tickLine={false} />
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
                <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary">
                    <i className="bi bi-gear-wide-connected me-2 text-primary"></i>Monte Carlo Setup
                </h5>
                <div className="rp-card p-4 surface-card border-secondary rounded-4 shadow-sm mb-4">
                    <label className="form-label small fw-bold text-muted mb-2">Number of Runs</label>
                    <SegmentedControl 
                        value={simCount} 
                        onChange={setSimCount} 
                        options={[
                            { value: 100, label: '100 (Fast)' }, 
                            { value: 500, label: '500 (Balanced)' }, 
                            { value: 1000, label: '1000 (Precise)' }
                        ]} 
                    />

                    <div className="d-flex align-items-center justify-content-between mb-2 mt-3">
                        <label className="form-label small fw-bold text-muted mb-0">Simulation Method</label>
                        <InfoBtn 
                            title="Sampling Methodology"
                            text="<b>Stratified (LHS):</b> Latin Hypercube Sampling divides the normal bell curve into equal-probability slices, guaranteeing even coverage of tail crashes and boom years without random clumping. 100 LHS runs match the precision of 1,500+ standard runs.<br><br><b>Quasi-MC (QHS):</b> Low-discrepancy Halton sequences that systematically fill multi-decade timeline space.<br><br><b>Standard (PRNG):</b> Traditional pseudo-random Box-Muller sampling.<br><br><b>Historical:</b> Rolling historical market cycles from S&P 500 history."
                            align="right"
                        />
                    </div>
                    <SegmentedControl 
                        value={method} 
                        onChange={setMethod} 
                        options={[
                            { value: 'lhs', label: 'LHS (Stratified)' }, 
                            { value: 'qhs', label: 'QHS (Quasi-MC)' },
                            { value: 'random', label: 'Random' }, 
                            { value: 'historical', label: 'Historical' }
                        ]} 
                    />

                    {method !== 'historical' && (
                        <>
                            <label className="form-label small fw-bold text-muted mb-2 mt-3">Market Volatility</label>
                            <SegmentedControl 
                                value={volatility} 
                                onChange={setVolatility} 
                                options={[
                                    { value: 0.08, label: 'Low (8%)' }, 
                                    { value: 0.12, label: 'Med (12%)' }, 
                                    { value: 0.16, label: 'High (16%)' }
                                ]} 
                            />
                        </>
                    )}

                    {/* Button with integrated background progress track */}
                    <div className="position-relative mt-4">
                        <button 
                            className="btn btn-primary w-100 fw-bold py-2 shadow rounded-pill position-relative overflow-hidden border-0" 
                            onClick={runMonteCarlo} 
                            disabled={isCalculating}
                            style={{ minHeight: '44px' }}
                        >
                            {/* Filling Background Progress Track */}
                            {isCalculating && (
                                <div 
                                    className="position-absolute top-0 start-0 h-100"
                                    style={{ 
                                        width: `${progress}%`, 
                                        backgroundColor: 'rgba(255, 255, 255, 0.28)', 
                                        transition: 'width 0.1s linear',
                                        zIndex: 1 
                                    }}
                                />
                            )}

                            {/* Button Text & Counter */}
                            <span className="position-relative d-flex align-items-center justify-content-center gap-2" style={{ zIndex: 2 }}>
                                {isCalculating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm"></span>
                                        <span>Simulating... {progress}%</span>
                                        <span className="small opacity-75">({Math.round((progress / 100) * simCount)}/{simCount})</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-play-circle-fill me-1"></i> Run Monte Carlo
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                    {errorMsg && (
                        <div className="alert alert-danger py-2 px-3 small fw-bold mt-3 mb-0 rounded-3 d-flex align-items-center justify-content-between" role="alert">
                            <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}</span>
                            <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.65rem' }} aria-label="Dismiss" onClick={() => setErrorMsg(null)} />
                        </div>
                    )}
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
                <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary">
                    <i className="bi bi-graph-up me-2 text-info"></i>Liquid Portfolio Distribution
                </h5>
                <div className="rp-card p-4 surface-card border border-secondary rounded-4 flex-grow-1 d-flex flex-column shadow-sm">
                    {chartComponent}
                    {chartData && chartData.length > 0 && (() => {
                        const last = chartData[chartData.length - 1];
                        return (
                            <div className="row g-2 mt-3 pt-3 border-top border-secondary border-opacity-25 text-center">
                                <div className="col-4">
                                    <div className="p-2 rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25">
                                        <div className="text-muted fw-bold text-uppercase ls-1" style={{ fontSize: '0.65rem' }}>10th Percentile (Downside)</div>
                                        <div className="fw-bolder text-danger fs-6">{formatCurrencyAxis(last.pessimistic || 0)}</div>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-2 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25">
                                        <div className="text-muted fw-bold text-uppercase ls-1" style={{ fontSize: '0.65rem' }}>50th Percentile (Median)</div>
                                        <div className="fw-bolder text-primary fs-6">{formatCurrencyAxis(last.median || 0)}</div>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-2 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25">
                                        <div className="text-muted fw-bold text-uppercase ls-1" style={{ fontSize: '0.65rem' }}>90th Percentile (Upside)</div>
                                        <div className="fw-bolder text-success fs-6">{formatCurrencyAxis(last.optimistic || 0)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}