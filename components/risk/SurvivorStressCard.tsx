'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, SegmentedControl, StepperInput } from '../SharedUI';
import type { SurvivorStressResult } from '../../lib/engine/survivorStress';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';

export default function SurvivorStressCard() {
  const { data } = useFinance();
  const isCouple = data.mode === 'Couple';

  const [deceased, setDeceased] = useState<'p1' | 'p2'>('p1');
  const [deathAge, setDeathAge] = useState<number>(75);
  const [expenseReductionPct, setExpenseReductionPct] = useState<number>(15);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<SurvivorStressResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  if (!isCouple) {
    return null;
  }

  const minAge = Math.max(40, (Number(data.inputs[`${deceased}_age`]) || 35) + 1);
  const maxAge = Math.max(minAge + 1, (Number(data.inputs[`${deceased}_lifeExp`]) || 90) - 1);

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const formatAxis = (val: number) => {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}k`;
    return `$${val}`;
  };

  const runTest = () => {
    setIsRunning(true);
    setErrorMsg(null);
    workerRef.current?.terminate();

    try {
      const worker = new Worker(new URL('../../lib/financeWorker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.status === 'success') {
          setResult(e.data.results);
        } else {
          console.error('Survivor Stress Worker Error:', e.data.error);
          setErrorMsg('Unable to complete survivor simulation. Check your plan inputs.');
        }
        setIsRunning(false);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      };

      worker.onerror = (err) => {
        console.error('Survivor Stress Worker Error:', err);
        setErrorMsg('Background worker failed while running survivor stress test.');
        setIsRunning(false);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      };

      worker.postMessage({
        type: 'survivorStress',
        data: JSON.parse(JSON.stringify(data)),
        deceased,
        deathAge: Math.min(maxAge, Math.max(minAge, deathAge)),
        expenseReductionPct,
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Could not launch background worker.');
      setIsRunning(false);
    }
  };

  return (
    <div className="rp-card border border-secondary rounded-4 shadow-sm mb-4">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary p-3 surface-card">
        <div className="d-flex align-items-center">
          <i className="bi bi-heart-pulse-fill text-danger fs-4 me-3"></i>
          <h5 className="mb-0 fw-bold text-uppercase ls-1">Survivor &amp; Widow&apos;s Tax Trap Stress Test</h5>
          <InfoBtn
            align="left"
            title="Survivor / Widow's Tax Trap"
            text="Models an early passing of one spouse. In Canada, the surviving spouse loses pension income splitting, drops to single tax brackets, loses one OAS benefit, and hits OAS clawback thresholds much faster."
          />
        </div>

        <button
          type="button"
          className="btn btn-danger btn-sm fw-bold rounded-pill px-4 py-2 shadow-sm border-0"
          onClick={runTest}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>Simulating...
            </>
          ) : (
            <>
              <i className="bi bi-play-circle-fill me-2"></i>Run Survivor Test
            </>
          )}
        </button>
      </div>

      <div className="card-body p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-4">
        {/* CONTROLS ROW */}
        <div className="row g-3 p-3 bg-input border border-secondary rounded-4 shadow-sm mx-0">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-bold text-muted mb-2">Early Passing Scenario</label>
            <SegmentedControl
              value={deceased}
              onChange={(val: 'p1' | 'p2') => setDeceased(val)}
              options={[
                { value: 'p1', label: 'P1 Passes First' },
                { value: 'p2', label: 'P2 Passes First' },
              ]}
            />
          </div>

          <div className="col-6 col-md-4">
            <label className="form-label small fw-bold text-muted mb-2 d-block">
              {deceased.toUpperCase()} Age at Passing
            </label>
            <StepperInput
              min={minAge}
              max={maxAge}
              value={Math.min(maxAge, Math.max(minAge, deathAge))}
              onChange={setDeathAge}
            />
          </div>

          <div className="col-6 col-md-4">
            <label className="form-label small fw-bold text-muted mb-2">Survivor Spending Drop</label>
            <SegmentedControl
              value={expenseReductionPct}
              onChange={setExpenseReductionPct}
              options={[
                { value: 0, label: '0%' },
                { value: 15, label: '-15%' },
                { value: 25, label: '-25%' },
              ]}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small fw-bold rounded-4 mb-0" role="alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
          </div>
        )}

        {!result ? (
          <div className="p-4 bg-input border border-secondary rounded-4 text-center text-muted small">
            <i className="bi bi-shield-exclamation fs-2 text-danger opacity-75 d-block mb-2"></i>
            Click <strong>Run Survivor Test</strong> to compare your joint baseline against an early-passing scenario through life expectancy.
          </div>
        ) : (
          <>
            {/* KPI TILES */}
            <div className="row g-3">
              <div className="col-6 col-xl-3">
                <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm h-100">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Survivor Plan Status</div>
                  <div className="mt-2">
                    {result.survived ? (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1.5 fw-bold">
                        <i className="bi bi-check-circle-fill me-1"></i> Fully Funded
                      </span>
                    ) : (
                      <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill px-3 py-1.5 fw-bold">
                        <i className="bi bi-exclamation-octagon-fill me-1"></i> Shortfall at Age {result.firstShortfallAge}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-6 col-xl-3">
                <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm h-100">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>After-Tax Estate Impact</div>
                  <div className="fs-5 fw-bolder text-main mt-1">{fmt(result.survivorEstate)}</div>
                  <div className={`small fw-bold ${result.estateDelta >= 0 ? 'text-success' : 'text-danger'}`}>
                    {result.estateDelta >= 0 ? '+' : '-'}{fmt(Math.abs(result.estateDelta))} vs. Joint
                  </div>
                </div>
              </div>

              <div className="col-6 col-xl-3">
                <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm h-100">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Lifetime Tax Paid</div>
                  <div className="fs-5 fw-bolder text-main mt-1">{fmt(result.survivorLifetimeTax)}</div>
                  <div className={`small fw-bold ${result.taxDelta <= 0 ? 'text-success' : 'text-danger'}`}>
                    {result.taxDelta > 0 ? '+' : '-'}{fmt(Math.abs(result.taxDelta))} vs. Joint
                  </div>
                </div>
              </div>

              <div className="col-6 col-xl-3">
                <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm h-100">
                  <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.68rem' }}>Peak Effective Tax Rate</div>
                  <div className="fs-5 fw-bolder text-warning mt-1">{result.peakTaxRateSurvivor}%</div>
                  <div className="small text-muted">vs. {result.peakTaxRateBaseline}% Joint</div>
                </div>
              </div>
            </div>

            {/* COMPARISON CHART */}
            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold text-muted text-uppercase ls-1">
                  Liquid Portfolio Trajectory — Joint vs. Survivor ({data.useRealDollars ? "Today's $" : 'Nominal $'})
                </span>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="age" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tickFormatter={formatAxis} tick={{ fontSize: 11 }} width={64} />
                    <Tooltip
                      formatter={(val: any) => fmt(Number(val) || 0)}
                      labelFormatter={(label) => `Survivor Age ${label}`}
                      contentStyle={{
                        backgroundColor: 'var(--bg-card, #1e293b)',
                        borderColor: 'var(--border-color, #334155)',
                        borderRadius: '12px',
                      }}
                    />
                    <ReferenceLine x={result.deathAge} stroke="#ef4444" strokeDasharray="4 4" label={{ value: `Age ${result.deathAge}`, fill: '#ef4444', fontSize: 11 }} />
                    <Line type="monotone" dataKey="baselineNW" name="Joint Baseline" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="survivorNW" name="Survivor Scenario" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
