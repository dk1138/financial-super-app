'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn, SegmentedControl } from './SharedUI';
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
    <div className="rp-card border border-secondary rounded-4 shadow-sm">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3 border-bottom border-secondary p-3 surface-card">
        <div className="d-flex align-items-center">
          <i className="bi bi-stars text-primary fs-4 me-3"></i>
          <h5 className="mb-0 fw-bold text-uppercase ls-1">Auto-Optimize Strategy Matrix</h5>
          <InfoBtn
            align="left"
            title="Auto-Optimize Strategy Matrix"
            text="Tests 7 Canadian retirement strategies in the background against your exact plan (RRSP Meltdown, OAS Clawback Shield, Pension Splitting, CPP/OAS at 60/65/70, Classic vs. TFSA-First) and ranks them by After-Tax Estate or Lowest Lifetime Tax."
          />
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          {rows && (
            <div style={{ minWidth: '210px' }}>
              <SegmentedControl
                value={sortBy}
                onChange={setSortBy}
                options={[
                  { value: 'estate', label: 'Max Estate' },
                  { value: 'tax', label: 'Lowest Tax' },
                ]}
              />
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

      <div className="card-body p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-3">
        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small fw-bold rounded-4 mb-0 d-flex align-items-center justify-content-between" role="alert">
            <span><i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}</span>
            <button type="button" className="btn-close btn-close-white ms-2" style={{ fontSize: '0.65rem' }} aria-label="Dismiss" onClick={() => setErrorMsg(null)} />
          </div>
        )}

        {appliedMsg && (
          <div className="alert alert-success py-2 px-3 small fw-bold rounded-4 mb-0 d-flex align-items-center justify-content-between" role="status">
            <span><i className="bi bi-check-circle-fill me-2"></i>{appliedMsg}</span>
            <button type="button" className="btn-close ms-2" style={{ fontSize: '0.65rem' }} aria-label="Dismiss" onClick={() => setAppliedMsg(null)} />
          </div>
        )}

        {!rows ? (
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-3">
            <div className="d-flex align-items-start gap-3">
              <div
                className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-cpu fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-main text-uppercase ls-1" style={{ fontSize: '0.82rem' }}>
                  Benchmark 7 Canadian Retirement Strategies ({data.useRealDollars ? "Today's $" : 'Nominal $'})
                </h6>
                <p className="small text-muted mb-0" style={{ lineHeight: 1.5 }}>
                  Compare RRSP Meltdown, OAS Clawback Shield, Pension Splitting, CPP/OAS timing (60 / 65 / 70), and Classic vs. TFSA-First drawdown side-by-side without changing your current inputs.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {isStale && (
              <div className="alert border-warning bg-warning bg-opacity-10 rounded-4 p-3 mb-0 d-flex align-items-center gap-2 small fw-bold text-warning">
                <i className="bi bi-info-circle-fill"></i>
                <span>Your plan inputs changed since this matrix was run. Click <strong>Re-Run Matrix</strong> for updated numbers.</span>
              </div>
            )}

            {topWinner && !topWinner.isBaseline && topWinner.deltaEstate > 500 && (
              <div className="alert border-success bg-success bg-opacity-10 rounded-4 p-3 mb-0 d-flex flex-wrap align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '36px', height: '36px' }}
                  >
                    <i className="bi bi-trophy-fill fs-6"></i>
                  </div>
                  <div className="small">
                    <div className="fw-bold text-success text-uppercase ls-1" style={{ fontSize: '0.78rem' }}>
                      Top Recommendation: {topWinner.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Projected <strong className="text-success">+{formatCurrency(topWinner.deltaEstate)}</strong> after-tax estate
                      {topWinner.deltaTax < 0 && <> and <strong className="text-success">{formatCurrency(Math.abs(topWinner.deltaTax))}</strong> less lifetime tax</>} vs. your current setup.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-sm fw-bold rounded-pill px-3 shadow-sm"
                  onClick={() => handleApply(topWinner)}
                >
                  Apply Winner
                </button>
              </div>
            )}

            <div className="table-responsive rounded-4 border border-secondary bg-input shadow-sm overflow-hidden">
              <table className="table table-dark table-hover align-middle mb-0 small">
                <thead className="surface-card border-bottom border-secondary">
                  <tr className="text-muted text-uppercase" style={{ fontSize: '0.7rem' }}>
                    <th className="ps-3 py-2.5">Rank</th>
                    <th className="py-2.5">Strategy</th>
                    <th className="py-2.5 text-end">After-Tax Estate</th>
                    <th className="py-2.5 text-end">Lifetime Tax</th>
                    <th className="py-2.5 text-end">vs. Current</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="pe-3 py-2.5 text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, idx) => {
                    const rankBadge =
                      idx === 0 ? 'bg-warning text-dark' :
                      idx === 1 ? 'bg-secondary text-white' :
                      idx === 2 ? 'bg-info text-dark' : 'bg-input text-muted border border-secondary';

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
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill">
                              Funded
                            </span>
                          ) : (
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 rounded-pill">
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
