'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, SegmentedControl } from '../SharedUI';
import type { SensitivityHeatmapResult, MaxSpendResult } from '../../lib/engine/sensitivity';

interface Props {
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function SensitivityMatrixCard({ isExpanded = false, onToggle }: Props) {
  const { data } = useFinance();

  // Heatmap state
  const [heatmap, setHeatmap] = useState<SensitivityHeatmapResult | null>(null);
  const [isRunningMap, setIsRunningMap] = useState(false);
  const [mapProgress, setMapProgress] = useState(0);

  // Max Spend Solver state
  const [targetEstate, setTargetEstate] = useState<number>(0);
  const [maxSpend, setMaxSpend] = useState<MaxSpendResult | null>(null);
  const [isSolvingSpend, setIsSolvingSpend] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapWorkerRef = useRef<Worker | null>(null);
  const spendWorkerRef = useRef<Worker | null>(null);

  useEffect(() => {
    return () => {
      mapWorkerRef.current?.terminate();
      spendWorkerRef.current?.terminate();
    };
  }, []);

  const fmt = (val: number) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const fmtCompact = (val: number) => {
    if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (Math.abs(val) >= 1_000) return `$${Math.round(val / 1_000)}k`;
    return `$${Math.round(val)}`;
  };

  const runHeatmap = () => {
    setIsRunningMap(true);
    setMapProgress(0);
    setErrorMsg(null);
    mapWorkerRef.current?.terminate();

    try {
      const worker = new Worker(new URL('../../lib/financeWorker.ts', import.meta.url));
      mapWorkerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.status === 'progress') {
          setMapProgress(e.data.progress);
        } else if (e.data.status === 'success') {
          setHeatmap(e.data.results);
          setIsRunningMap(false);
          setMapProgress(0);
          worker.terminate();
          if (mapWorkerRef.current === worker) mapWorkerRef.current = null;
        } else {
          setErrorMsg('Failed to generate sensitivity heatmap.');
          setIsRunningMap(false);
          worker.terminate();
        }
      };

      worker.onerror = () => {
        setErrorMsg('Background worker failed while building heatmap.');
        setIsRunningMap(false);
        worker.terminate();
      };

      worker.postMessage({
        type: 'sensitivityHeatmap',
        data: JSON.parse(JSON.stringify(data)),
      });
    } catch {
      setErrorMsg('Unable to start sensitivity worker.');
      setIsRunningMap(false);
    }
  };

  const runMaxSpendSolver = () => {
    setIsSolvingSpend(true);
    setErrorMsg(null);
    spendWorkerRef.current?.terminate();

    try {
      const worker = new Worker(new URL('../../lib/financeWorker.ts', import.meta.url));
      spendWorkerRef.current = worker;

      worker.onmessage = (e: MessageEvent) => {
        if (e.data.status === 'success') {
          setMaxSpend(e.data.results);
        } else {
          setErrorMsg('Unable to solve maximum safe retirement spend.');
        }
        setIsSolvingSpend(false);
        worker.terminate();
        if (spendWorkerRef.current === worker) spendWorkerRef.current = null;
      };

      worker.onerror = () => {
        setErrorMsg('Background worker failed while solving max spend.');
        setIsSolvingSpend(false);
        worker.terminate();
      };

      worker.postMessage({
        type: 'maxSpend',
        data: JSON.parse(JSON.stringify(data)),
        targetEstate,
      });
    } catch {
      setErrorMsg('Unable to start max spend solver.');
      setIsSolvingSpend(false);
    }
  };

  return (
    <div className="rp-card border border-secondary rounded-4 p-4 h-100 position-relative d-flex flex-column shadow-sm">
      {/* HEADER MATCHING STANDARD OPTIMIZER CARDS */}
      <div className="d-flex align-items-start justify-content-between gap-2 mb-3">
        <div className="d-flex align-items-center">
          <div
            className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3 flex-shrink-0"
            style={{ width: '45px', height: '45px' }}
          >
            <i className="bi bi-grid-3x3-gap-fill fs-4"></i>
          </div>
          <div>
            <div className="d-flex align-items-center gap-1">
              <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1" style={{ fontSize: '0.95rem' }}>
                Sensitivity Heatmap &amp; Max Spend
              </h5>
              <InfoBtn
                align="left"
                title="Sensitivity Heatmap & Max Spend Solver"
                text="Tests 25 combinations of Retirement Age (-4 to +4 years) and Retirement Spending (-20% to +20%) in the background, plus solves for the maximum monthly retirement spend your plan can sustain for a chosen target legacy."
              />
            </div>
            <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
              5×5 Retire Age × Spend Matrix
            </span>
          </div>
        </div>

        {onToggle && (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 flex-shrink-0"
            onClick={onToggle}
            title={isExpanded ? 'Collapse to grid view' : 'Expand full width'}
            style={{ fontSize: '0.72rem' }}
          >
            <i className={`bi ${isExpanded ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'} me-1`}></i>
            {isExpanded ? 'Compact' : 'Expand'}
          </button>
        )}
      </div>

      <p className="text-muted small mb-3" style={{ fontSize: '0.78rem' }}>
        Solve your max sustainable monthly retirement spend ({data.useRealDollars ? "Today's $" : 'Nominal $'}) and test 25 age vs. spend tradeoffs.
      </p>

      {errorMsg && (
        <div className="alert alert-danger py-2 px-3 small fw-bold rounded-4 mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
        </div>
      )}

      {/* MAX SAFE SPEND SOLVER */}
      <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm mb-3">
        <div className={isExpanded ? 'row g-3 align-items-center' : 'd-flex flex-column gap-2'}>
          <div className={isExpanded ? 'col-12 col-lg-5' : ''}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-cash-coin text-success"></i>
              <span className="fw-bold text-main text-uppercase ls-1" style={{ fontSize: '0.74rem' }}>
                Max Safe Spend Solver
              </span>
            </div>
          </div>

          <div className={isExpanded ? 'col-12 col-md-7 col-lg-4' : ''}>
            <SegmentedControl
              value={targetEstate}
              onChange={setTargetEstate}
              options={[
                { value: 0, label: '$0 (DWZ)' },
                { value: 250000, label: '$250k' },
                { value: 500000, label: '$500k' },
              ]}
            />
          </div>

          <div className={isExpanded ? 'col-12 col-md-5 col-lg-3' : ''}>
            <button
              type="button"
              className="btn btn-success btn-sm fw-bold rounded-pill px-3 py-2 shadow-sm w-100"
              onClick={runMaxSpendSolver}
              disabled={isSolvingSpend}
            >
              {isSolvingSpend ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Solving...</>
              ) : (
                <><i className="bi bi-calculator-fill me-2"></i>Solve Max Spend</>
              )}
            </button>
          </div>
        </div>

        {maxSpend && (
          <div className="row g-2 mt-2 pt-2 border-top border-secondary border-opacity-50">
            <div className={isExpanded ? 'col-4' : 'col-6'}>
              <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.64rem' }}>Current</div>
              <div className="fw-bold text-main" style={{ fontSize: '0.92rem' }}>{fmt(maxSpend.baseMonthlySpend)}/mo</div>
            </div>
            <div className={isExpanded ? 'col-4' : 'col-6'}>
              <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.64rem' }}>Max Safe</div>
              <div className="fw-bolder text-success" style={{ fontSize: '0.92rem' }}>{fmt(maxSpend.maxMonthlySpend)}/mo</div>
            </div>
            <div className={isExpanded ? 'col-4' : 'col-12'}>
              <div className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.64rem' }}>Cushion / Gap</div>
              <div className={`fw-bold ${maxSpend.deltaMonthly >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.88rem' }}>
                {maxSpend.deltaMonthly >= 0 ? '+' : '-'}{fmt(Math.abs(maxSpend.deltaMonthly))}/mo ({maxSpend.deltaPct >= 0 ? '+' : ''}{maxSpend.deltaPct}%)
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5x5 HEATMAP ACTION + TABLE */}
      <div className="mt-auto d-flex flex-column gap-3">
        <button
          type="button"
          className="btn btn-primary btn-sm fw-bold rounded-pill px-4 py-2 shadow-sm position-relative overflow-hidden border-0 w-100"
          onClick={runHeatmap}
          disabled={isRunningMap}
        >
          {isRunningMap && (
            <span
              className="position-absolute top-0 start-0 h-100"
              style={{ width: `${mapProgress}%`, backgroundColor: 'rgba(255,255,255,0.25)', transition: 'width 0.15s linear' }}
            />
          )}
          <span className="position-relative d-flex align-items-center justify-content-center gap-2">
            {isRunningMap ? (
              <>
                <span className="spinner-border spinner-border-sm"></span>
                <span>Building 5×5 Grid... {mapProgress}%</span>
              </>
            ) : (
              <>
                <i className="bi bi-grid-fill"></i>
                <span>{heatmap ? 'Refresh 5×5 Heatmap' : 'Generate 5×5 Heatmap'}</span>
              </>
            )}
          </span>
        </button>

        {heatmap && (
          <div className="table-responsive rounded-4 border border-secondary bg-input shadow-sm overflow-hidden">
            <table className="table table-dark align-middle mb-0 text-center" style={{ fontSize: isExpanded ? '0.8rem' : '0.68rem' }}>
              <thead className="surface-card border-bottom border-secondary">
                <tr className="text-muted text-uppercase" style={{ fontSize: isExpanded ? '0.7rem' : '0.62rem' }}>
                  <th className="py-2 text-start ps-2">Age \ Spend</th>
                  {heatmap.spendDeltas.map((d) => (
                    <th key={d} className="py-2 px-1">
                      <div>{d === 0 ? 'Base' : `${d > 0 ? '+' : ''}${d}%`}</div>
                      {isExpanded && (
                        <div className="fw-normal opacity-75" style={{ fontSize: '0.64rem' }}>
                          {fmt(Math.round(heatmap.baseMonthlyRetireSpend * (1 + d / 100)))}/mo
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmap.cells.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="text-start ps-2 py-2 fw-bold text-main surface-card text-nowrap">
                      {heatmap.retireAges[rIdx]}
                      {row[0]?.retireOffset === 0 && (
                        <span className="badge bg-primary bg-opacity-25 text-primary ms-1" style={{ fontSize: '0.56rem' }}>Base</span>
                      )}
                    </td>
                    {row.map((cell, cIdx) => {
                      const bgClass = !cell.survived
                        ? 'bg-danger bg-opacity-10 text-danger'
                        : cell.afterTaxEstate >= 1_000_000
                        ? 'bg-success bg-opacity-25 text-success'
                        : cell.afterTaxEstate >= 250_000
                        ? 'bg-success bg-opacity-10 text-success'
                        : 'bg-warning bg-opacity-10 text-warning';

                      return (
                        <td
                          key={cIdx}
                          className={`py-2 px-1 fw-bold ${bgClass} ${cell.isBaseCell ? 'border border-2 border-primary' : ''}`}
                          title={
                            cell.survived
                              ? `Retire ${cell.retireAgeP1}, ${fmt(cell.monthlyRetireSpend)}/mo → ${fmt(cell.afterTaxEstate)} estate`
                              : `Depletes at Age ${cell.shortfallAge}`
                          }
                        >
                          {cell.survived ? (
                            <div>{fmtCompact(cell.afterTaxEstate)}</div>
                          ) : (
                            <div>
                              <div>Age {cell.shortfallAge}</div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
