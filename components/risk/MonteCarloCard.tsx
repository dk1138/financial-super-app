'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FinanceEngine } from '../../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../../lib/config';
import { SegmentedControl, InfoBtn } from '../SharedUI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * High-precision Inverse Normal Cumulative Distribution Function (Probit function)
 * Peter J. Acklam's algorithm (error < 1.15e-9).
 */
function invNorm(p: number): number {
    if (p <= 0.00001) return -4.5;
    if (p >= 0.99999) return 4.5;

    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= pHigh) {
        const q = p - 0.5;
        const r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
               (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/**
 * Latin Hypercube Sampling (LHS) Generator.
 * Stratifies the probability distribution into N equal intervals per year,
 * ensuring uniform coverage across market crashes, normal years, and booms without clustering.
 */
function generateLHSShocks(runs: number, years: number, volatility: number): number[][] {
    const matrix: number[][] = Array.from({ length: runs }, () => new Array(years).fill(0));

    for (let y = 0; y < years; y++) {
        const yearSamples: number[] = [];
        for (let i = 0; i < runs; i++) {
            // Draw one stratified sample per bucket [i/runs, (i+1)/runs]
            const u = (i + Math.random()) / runs;
            yearSamples.push(invNorm(u) * volatility);
        }

        // Independent Fisher-Yates permutation across runs for each year
        for (let i = runs - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = yearSamples[i];
            yearSamples[i] = yearSamples[j];
            yearSamples[j] = temp;
        }

        for (let i = 0; i < runs; i++) {
            matrix[i][y] = yearSamples[i];
        }
    }

    return matrix;
}

// Low-discrepancy prime bases for Halton Quasi-Monte Carlo sequence
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
function getPrime(idx: number): number {
    if (idx < PRIMES.length) return PRIMES[idx];
    let candidate = PRIMES[PRIMES.length - 1] + 2;
    while (true) {
        let isPrime = true;
        for (let i = 2; i * i <= candidate; i++) {
            if (candidate % i === 0) { isPrime = false; break; }
        }
        if (isPrime) {
            PRIMES.push(candidate);
            if (PRIMES.length > idx) return candidate;
        }
        candidate += 2;
    }
}

function halton(index: number, base: number): number {
    let result = 0;
    let f = 1 / base;
    let i = index;
    while (i > 0) {
        result += f * (i % base);
        i = Math.floor(i / base);
        f /= base;
    }
    return result;
}

/**
 * Quasi-Monte Carlo (QHS) Generator using Low-Discrepancy Halton Sequences.
 */
function generateQHSShocks(runs: number, years: number, volatility: number): number[][] {
    const matrix: number[][] = Array.from({ length: runs }, () => new Array(years).fill(0));
    const offset = Math.floor(Math.random() * 1000) + 1;

    for (let y = 0; y < years; y++) {
        const base = getPrime(y);
        for (let i = 0; i < runs; i++) {
            let u = halton(offset + i, base);
            u = Math.max(0.0001, Math.min(0.9999, u));
            matrix[i][y] = invNorm(u) * volatility;
        }
    }

    return matrix;
}

export default function MonteCarloCard() {
    const { data, mcResults, setMcResults } = useFinance();

    const [simCount, setSimCount] = useState<number>(mcResults?.simCount || 100);
    const [method, setMethod] = useState<'lhs' | 'qhs' | 'random' | 'historical'>(mcResults?.method || 'lhs');
    const [volatility, setVolatility] = useState<number>(mcResults?.volatility || 0.12);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);

    const runMonteCarlo = () => {
        setIsCalculating(true);
        setTimeout(() => {
          try {
            const trajectories: number[][] = [];
            const p1Age = data.inputs.p1_age || 38;
            const inflationRate = (data.inputs.inflation_rate || 2.1) / 100;
            
            let successCount = 0;
            
            // Pre-generate stratified or quasi-random shocks if selected
            let structuredShocks: number[][] | null = null;
            if (method === 'lhs') {
                structuredShocks = generateLHSShocks(simCount, 100, volatility);
            } else if (method === 'qhs') {
                structuredShocks = generateQHSShocks(simCount, 100, volatility);
            }

            for (let i = 0; i < simCount; i++) {
              const engine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
              let simContext: any = { method };
              
              if (method === 'historical') {
                 const sp500 = FINANCIAL_CONSTANTS.SP500_HISTORICAL;
                 const startIdx = Math.floor(Math.random() * sp500.length);
                 simContext.shockSequence = []; 
                 
                 for (let y = 0; y < 100; y++) { 
                     // S&P 500 long-term average is ~9%. Subtract 0.09 to isolate variance shock
                     const historicalReturn = sp500[(startIdx + y) % sp500.length];
                     const shock = historicalReturn - 0.09; 
                     simContext.shockSequence.push(shock); 
                 }
              } else if ((method === 'lhs' || method === 'qhs') && structuredShocks) {
                 simContext.shockSequence = structuredShocks[i];
              } else {
                 // Standard Pseudo-Random
                 simContext.volatility = volatility;
              }
              
              const detailedResult = engine.runSimulation(true, simContext);
              
              // Extract Liquid Net Worth trajectory
              const liquidTrajectory = detailedResult.map((y: any) => y.liquidNW);
              trajectories.push(liquidTrajectory);

              // Run succeeds if liquid portfolio outlasts the plan
              if (liquidTrajectory[liquidTrajectory.length - 1] > 0) {
                  successCount++;
              }
            }
            
            const runs = trajectories.length;
            const finalSuccessRate = Number(((successCount / runs) * 100).toFixed(1));
            const discount = (val: number, idx: number) => Math.max(0, Math.round(val / Math.pow(1 + inflationRate, idx)));
            
            const yearsCount = trajectories[0].length;
            const formattedData = [];

            // Cross-Sectional Percentiles (10th, 50th, 90th percentile at each year)
            for (let y = 0; y < yearsCount; y++) {
                const yearValues = trajectories.map(t => t[y]).sort((a, b) => a - b);
                
                const pesVal = yearValues[Math.floor(runs * 0.10)];
                const medVal = yearValues[Math.floor(runs * 0.50)];
                const optVal = yearValues[Math.floor(runs * 0.90)];
                
                formattedData.push({
                    age: p1Age + y,
                    optimistic: discount(optVal, y),
                    median: discount(medVal, y),
                    pessimistic: discount(pesVal, y)
                });
            }
            
            setMcResults({
                chartData: formattedData,
                successRate: finalSuccessRate,
                simCount,
                method,
                volatility
            });
            
          } catch(err) { 
              console.error(err); 
              alert("Simulation failed."); 
          }
          setIsCalculating(false);
        }, 50);
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

                    <button 
                        className="btn btn-primary w-100 fw-bold py-2 mt-4 shadow rounded-pill" 
                        onClick={runMonteCarlo} 
                        disabled={isCalculating}
                    >
                        {isCalculating ? (
                            <><span className="spinner-border spinner-border-sm me-2"></span>Simulating {simCount} Paths...</>
                        ) : (
                            <><i className="bi bi-play-circle-fill me-2"></i> Run Monte Carlo</>
                        )}
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
                <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary">
                    <i className="bi bi-graph-up me-2 text-info"></i>Liquid Portfolio Distribution
                </h5>
                <div className="rp-card p-4 surface-card border border-secondary rounded-4 flex-grow-1 d-flex flex-column shadow-sm">
                    {chartComponent}
                </div>
            </div>
        </div>
    );
}