'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn } from './SharedUI';
import type { StrategyMatrixRow } from '../lib/engine/strategyMatrix';

export default function StrategyMatrixCard() {
  const { data, updateMultipleInputs, updateStrategy } = useFinance();
  const [rows, setRows] = useState<StrategyMatrixRow[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sortBy, setSortBy] = useState<'estate' | 'tax'>('estate');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appliedMsg, setAppliedMsg] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (rows) setIsStale(true);
  }, [data]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const runOptimizer = () => {
    setIsRunning(true);
    setProgress(0);
    setErrorMsg(null);
    setAppliedMsg(null);
    workerRef.current?.terminate();

    try {
      const worker = new Worker(new URL('../lib/financeWorker.ts', import.meta.url));
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.status === 'progress') {
          setProgress(e.data.progress);
        } else if (e.data.status === 'success') {
          setRows(e.data.results);
          setIsStale(false);
          setIsRunning(false);
          setProgress(0);
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
        } else {
          console.error('Strategy Matrix Worker Error:', e.data.error);
          setErrorMsg('Strategy optimization failed. Please review your plan inputs and try again.');
          setIsRunning(false);
          setProgress(0);
          worker.terminate();
          if (workerRef.current === worker) workerRef.current = null;
        }
      };

      worker.onerror = (err) => {
        console.error('Strategy Matrix Worker Error:', err);
        setErrorMsg('Strategy optimizer encountered an unexpected worker error.');
        setIsRunning(false);
        setProgress(0);
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
      };

      worker.postMessage({
        type: 'strategyMatrix',
        data: JSON.parse(JSON.stringify(data)),
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Unable to start background strategy optimizer.');
      setIsRunning(false);
      setProgress(0);
    }
  };

  const handleApply = (row: StrategyMatrixRow) => {
    if (Object.keys(row.inputOverrides).length > 0) {
      updateMultipleInputs(row.inputOverrides);
    }
    if (row.decumOverride) {
      updateStrategy('decum', row.decumOverride);
    }
    const deltaText =
      row.deltaEstate > 0
        ? ` (+${formatCurrency(row.deltaEstate)} projected after-tax estate)`
        : row.deltaTax < 0
        ? ` (${formatCurrency(Math.abs(row.deltaTax))} less lifetime tax)`
        : '';
    setAppliedMsg(`Applied "${row.name}"${deltaText}`);
    setTimeout(() => setAppliedMsg(null), 4500);
  };

  const sortedRows = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      if (a.survived !== b.survived) return a.survived ? -1 : 1;
      if (sortBy === 'tax') return a.lifetimeTax - b.lifetimeTax;
      return b.afterTaxEstate - a.afterTaxEstate;
    });
  }, [rows, sortBy]);

  const topWinner = sortedRows.length > 0 ? sortedRows[0] : null;

  return (
    <div className="rp-card border border-primary border-opacity-50 rounded-4 shadow-sm overflow-hidden">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary p-3 surface-card">
        <div className="d-flex align-items-center">
          <i className="bi bi-stars text-warning fs-4 me-3"></i>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h5 className="mb-0 fw-bold text-uppercase ls-1">Auto-Optimize Strategy Matrix</h5>
              <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-25 rounded-pill" style={{ fontSize: '0.68rem' }}>
                7 Strategies
              </span>
              <InfoBtn
                align="left"
                title="Auto-Optimize Strategy Matrix"
                text="Tests 7 Canadian retirement strategies in the background against your exact plan (RRSP Meltdown, OAS Clawback Shield, Pension Splitting, CPP/OAS at 60/65/70, Classic vs. TFSA-First) and ranks them by After-Tax Estate or Lowest Lifetime Tax."
              />
            </div>
            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
              Benchmark withdrawal orders, tax toggles, and CPP/OAS timing in 1 click ({data.useRealDollars ? "Today's $" : 'Nominal $'})
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {rows && (
            <div className="btn-group btn-group-sm" role="group" aria-label="Sort strategy results">
              <button
                type="button"
                className={`btn fw-bold ${sortBy === 'estate' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSortBy('estate')}
              >
                Max Estate
              </button>
              <button
                type="button"
                className={`btn fw-bold ${sortBy === 'tax' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setSortBy('tax')}
              >
                Lowest Tax
              </button>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-sm fw-bold rounded-pill px-4 py-2 shadow-sm position-relative overflow-hidden border-0"
            onClick={runOptimizer}
            disabled={isRunning}
          >
            {isRunning && (
              <span
                className="position-absolute top-0 start-0 h-100"
                style={{ width: `${progress}%`, backgroundColor: 'rgba(255,255,255,0.25)', transition: 'width 0.15s linear' }}
              />
            )}
            <span className="position-relative d-flex align-items-center gap-2">
              {isRunning ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span>
                  <span>Testing... {progress}%</span>
                </>
              ) : (
                <>
                  <i className="bi bi-lightning-charge-fill"></i>
                  <span>{rows ? 'Re-Run Matrix' : 'Run Strategy Optimizer'}</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      <div className="card-body p-3 p-md-4 bg-secondary bg-opacity-10">
        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small fw-bold rounded-3 mb-3 d-flex align-items-center justify-content-between" role="alert">
            <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}</span>
            <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.65rem' }} aria-label="Dismiss" onClick={() => setErrorMsg(null)} />
          </div>
        )}

        {appliedMsg && (
          <div className="alert alert-success py-2 px-3 small fw-bold rounded-3 mb-3 d-flex align-items-center justify-content-between" role="status">
            <span><i className="bi bi-check-circle-fill me-2"></i>{appliedMsg}</span>
            <button type="button" className="btn-close ms-2" style={{ fontSize: '0.65rem' }} aria-label="Dismiss" onClick={() => setAppliedMsg(null)} />
          </div>
        )}

        {!rows ? (
          <div className="text-center py-4 text-muted">
            <i className="bi bi-cpu fs-2 text-primary opacity-75 d-block mb-2"></i>
            <p className="mb-1 fw-bold text-main small">Not sure which withdrawal order or CPP/OAS age wins for your plan?</p>
            <p className="mb-0 small">Click <strong>Run Strategy Optimizer</strong> to test 7 Canadian strategies side-by-side without changing your current inputs.</p>
          </div>
        ) : (
          <>
            {isStale && (
              <div className="alert alert-warning py-2 px-3 small fw-bold rounded-3 mb-3 d-flex align-items-center justify-content-between">
                <span><i className="bi bi-info-circle-fill me-2"></i>Your plan inputs changed since this matrix was run. Click <strong>Re-Run Matrix</strong> for updated numbers.</span>
              </div>
            )}

            {topWinner && !topWinner.isBaseline && topWinner.deltaEstate > 500 && (
              <div className="alert border-success bg-success bg-opacity-10 rounded-3 p-3 mb-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="small">
                  <span className="fw-bold text-success"><i className="bi bi-trophy-fill me-2"></i>Top Recommendation: {topWinner.name}</span>
                  <span className="text-muted ms-2">
                    Projected <strong className="text-success">+{formatCurrency(topWinner.deltaEstate)}</strong> after-tax estate
                    {topWinner.deltaTax < 0 && <> and <strong className="text-success">{formatCurrency(Math.abs(topWinner.deltaTax))}</strong> less lifetime tax</>} vs. your current setup.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-bold rounded-pill px-3"
                  onClick={() => handleApply(topWinner)}
                >
                  Apply Winner
                </button>
              </div>
            )}

            <div className="table-responsive rounded-3 border border-secondary">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="surface-card border-bottom border-secondary">
                  <tr className="text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                    <th className="ps-3 py-2">Rank</th>
                    <th className="py-2">Strategy</th>
                    <th className="py-2 text-end">After-Tax Estate</th>
                    <th className="py-2 text-end">Lifetime Tax</th>
                    <th className="py-2 text-end">vs. Current</th>
                    <th className="py-2 text-center">Status</th>
                    <th className="pe-3 py-2 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, idx) => {
                    const rankBadge =
                      idx === 0 ? 'bg-warning text-dark' :
                      idx === 1 ? 'bg-secondary text-white' :
                      idx === 2 ? 'bg-info text-dark' : 'bg-dark text-muted border border-secondary';

                    const estateDeltaPositive = row.deltaEstate > 0;
                    const estateDeltaNeutral = Math.abs(row.deltaEstate) < 100;

                    return (
                      <tr key={row.id} className={row.isBaseline ? 'table-active' : ''}>
                        <td className="ps-3 py-2.5">
                          <span className={`badge rounded-pill fw-bold ${rankBadge}`} style={{ minWidth: '28px' }}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <div className="fw-bold text-main d-flex flex-wrap align-items-center gap-1">
                            <span>{row.name}</span>
                            {row.tags.map((tag) => (
                              <span
                                key={tag}
                                className="badge bg-input text-muted border border-secondary fw-normal"
                                style={{ fontSize: '0.62rem' }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{row.description}</div>
                        </td>
                        <td className="py-2.5 text-end fw-bold text-main">{formatCurrency(row.afterTaxEstate)}</td>
                        <td className="py-2.5 text-end fw-semibold text-muted">{formatCurrency(row.lifetimeTax)}</td>
                        <td className="py-2.5 text-end">
                          {row.isBaseline ? (
                            <span className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>Baseline</span>
                          ) : estateDeltaNeutral ? (
                            <span className="text-muted fw-bold" style={{ fontSize: '0.72rem' }}>—</span>
                          ) : (
                            <span className={`fw-bold ${estateDeltaPositive ? 'text-success' : 'text-danger'}`}>
                              {estateDeltaPositive ? '+' : '-'}{formatCurrency(Math.abs(row.deltaEstate))}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          {row.survived ? (
                            <span className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-25 rounded-pill">
                              Funded
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-15 text-danger border border-danger border-opacity-25 rounded-pill">
                              Shortfall
                            </span>
                          )}
                        </td>
                        <td className="pe-3 py-2.5 text-end">
                          {row.isBaseline ? (
                            <span className="badge bg-primary bg-opacity-25 text-primary rounded-pill px-2.5 py-1">Active</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm rounded-pill fw-bold px-3 py-0.5"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => handleApply(row)}
                            >
                              Apply
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
