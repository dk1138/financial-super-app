'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { StepperInput } from './SharedUI';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAdjustModal({ isOpen, onClose }: QuickAdjustModalProps) {
  const finance = useFinance() as any;
  const { data, updateInput, updateMultipleInputs, results, isCalculating } = finance;

  const cardRef = useRef<HTMLDivElement>(null);
  const isCouple = data.mode === 'Couple';

  const [baseline, setBaseline] = useState<Record<string, any>>({});
  const [hasTweaks, setHasTweaks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBaseline({
        p1_retireAge: data.inputs.p1_retireAge ?? 60,
        p2_retireAge: data.inputs.p2_retireAge ?? 60,
        retire_same_time: data.inputs.retire_same_time ?? false,
        inflation_rate: data.inputs.inflation_rate ?? 2.1,
        p1_tfsa_ret: data.inputs.p1_tfsa_ret ?? 6.0,
      });
      setHasTweaks(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !baseline.p1_retireAge) return;
    const changed = 
      data.inputs.p1_retireAge !== baseline.p1_retireAge ||
      data.inputs.p2_retireAge !== baseline.p2_retireAge ||
      data.inputs.retire_same_time !== baseline.retire_same_time ||
      data.inputs.inflation_rate !== baseline.inflation_rate ||
      data.inputs.p1_tfsa_ret !== baseline.p1_tfsa_ret;
    setHasTweaks(changed);
  }, [data.inputs, baseline, isOpen]);

  // Click outside to dismiss & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('[title="Quick Adjust Variables"]')) {
          onClose();
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // EXACT MATH MATCHING PLANNER'S BOTTOM READINESS ISLAND (PlanTab.tsx)
  const liveStats = useMemo(() => {
    if (!results || !results.timeline || results.timeline.length === 0) return null;

    const timeline = results.timeline;
    const baseYear = timeline[0]?.year || new Date().getFullYear();
    const p1RetAge = Number(data.inputs?.p1_retireAge) || 65;
    const inflation = (data.inputs?.inflation_rate !== undefined && data.inputs?.inflation_rate !== '' ? Number(data.inputs.inflation_rate) : 2.1) / 100;
    
    const useRealDollars = Boolean(
      data.useRealDollars === true || 
      data.inputs?.todays_dollars === true || 
      data.inputs?.use_real_dollars === true ||
      data.inputs?.useRealDollars === true
    );

    const getReal = (val: number, year: number) => {
      if (!useRealDollars) return val;
      const yearsOut = Math.max(0, year - baseYear);
      return val / Math.pow(1 + inflation, yearsOut);
    };

    const retItem = timeline.find((y: any) => y.p1Age >= p1RetAge) || timeline[0];
    const finalItem = timeline[timeline.length - 1];

    let failureAge = null;
    for (const yr of timeline) {
      if (yr.liquidNW <= 0 && yr.p1Age >= p1RetAge) {
        failureAge = yr.p1Age;
        break;
      }
    }

    const liquidAtRet = retItem ? getReal(retItem.liquidNW || 0, retItem.year) : 0;
    const finalEstate = finalItem ? getReal((finalItem.liquidNW || 0) + (finalItem.reIncludedEq || 0), finalItem.year) : 0;

    const formatShort = (val: number) => {
      if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return {
      isFullyFunded: failureAge === null,
      failureAge,
      liquidAtRet: Math.round(liquidAtRet),
      finalEstate: Math.round(finalEstate),
      formattedLiqAtRet: formatShort(liquidAtRet),
      formattedEstate: formatShort(finalEstate),
      retAge: p1RetAge,
      lifeExp: finalItem?.p1Age || 90,
      useRealDollars
    };
  }, [results, data]);

  if (!isOpen) return null;

  const handleRetireAgeChange = (player: 'p1' | 'p2', newRetAge: number) => {
    const updates: Record<string, any> = { [`${player}_retireAge`]: newRetAge };
    if (newRetAge > (data.inputs[`${player}_lifeExp`] || 90)) {
      updates[`${player}_lifeExp`] = newRetAge;
    }
    if (isCouple && data.inputs.retire_same_time) {
      const playerAge = data.inputs[`${player}_age`] ?? (player === 'p1' ? 38 : 34);
      const yearsToRetire = newRetAge - playerAge;
      const otherPlayer = player === 'p1' ? 'p2' : 'p1';
      const otherAge = data.inputs[`${otherPlayer}_age`] ?? (player === 'p1' ? 34 : 38);
      const otherNewRetAge = Math.max(18, otherAge + yearsToRetire);

      updates[`${otherPlayer}_retireAge`] = otherNewRetAge;
      if (otherNewRetAge > (data.inputs[`${otherPlayer}_lifeExp`] || 90)) {
        updates[`${otherPlayer}_lifeExp`] = otherNewRetAge;
      }
    }
    updateMultipleInputs(updates);
  };

  const handleSyncToggle = (checked: boolean) => {
    if (checked) {
      const p1Age = data.inputs.p1_age ?? 38;
      const p1Ret = data.inputs.p1_retireAge ?? 60;
      const p2Age = data.inputs.p2_age ?? 34;
      const yearsToRetire = p1Ret - p1Age;
      const newP2Ret = Math.max(18, p2Age + yearsToRetire);

      const updates: Record<string, any> = {
        retire_same_time: true,
        p2_retireAge: newP2Ret,
      };
      if (newP2Ret > (data.inputs.p2_lifeExp || 95)) updates.p2_lifeExp = newP2Ret;
      updateMultipleInputs(updates);
    } else {
      updateInput('retire_same_time', false);
    }
  };

  const handleRevertBaseline = () => {
    if (baseline && baseline.p1_retireAge) {
      updateMultipleInputs(baseline);
      setHasTweaks(false);
    }
  };

  const handlePortfolioReturnPreset = (presetRate: number) => {
    const updates: Record<string, any> = {
      p1_tfsa_ret: presetRate,
      p1_rrsp_ret: presetRate,
      p1_nonreg_ret: Math.max(1.0, presetRate - 1.0),
    };
    if (isCouple) {
      updates.p2_tfsa_ret = presetRate;
      updates.p2_rrsp_ret = presetRate;
      updates.p2_nonreg_ret = Math.max(1.0, presetRate - 1.0);
    }
    updateMultipleInputs(updates);
  };

  const currentReturnRate = data.inputs.p1_tfsa_ret ?? 6.0;
  const currentInflationRate = Number(data.inputs.inflation_rate) || 2.1;

  return (
    <div
      ref={cardRef}
      className="position-fixed border border-secondary shadow-2xl rounded-4 transition-all fade-in"
      style={{
        bottom: '90px',
        right: '30px',
        zIndex: 1050,
        width: '340px',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: 'var(--bg-body, #0f172a)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 1. HEADER */}
      <div className="d-flex justify-content-between align-items-center px-3 pt-3 pb-2 border-bottom border-secondary border-opacity-50">
        <div className="d-flex align-items-center gap-2">
          <div 
            className="d-flex align-items-center justify-content-center rounded-3 shadow-sm"
            style={{ width: '26px', height: '26px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#38bdf8' }}
          >
            <i className="bi bi-sliders" style={{ fontSize: '0.85rem' }}></i>
          </div>
          <div>
            <h6 className="mb-0 fw-bold text-main" style={{ fontSize: '0.82rem', letterSpacing: '0.2px' }}>
              Quick Scenario Tweaks
            </h6>
          </div>
        </div>

        <div className="d-flex align-items-center gap-1.5">
          {hasTweaks && (
            <button
              type="button"
              className="btn btn-link btn-sm text-warning p-0 text-decoration-none fw-semibold d-flex align-items-center me-2"
              style={{ fontSize: '0.72rem' }}
              onClick={handleRevertBaseline}
              title="Reset all tweaks back to saved plan"
            >
              <i className="bi bi-arrow-counterclockwise me-1"></i> Revert
            </button>
          )}
          <button
            type="button"
            className="btn-close shadow-none p-1"
            style={{ fontSize: '0.65rem' }}
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>
      </div>

      <div className="p-3">
        {/* 2. LIVE IMPACT SCORECARD */}
        {liveStats && (
          <div 
            className="p-2.5 rounded-3 mb-3 border border-secondary border-opacity-50"
            style={{
              background: liveStats.isFullyFunded 
                ? 'linear-gradient(135deg, rgba(25, 135, 84, 0.12), rgba(13, 202, 240, 0.06))' 
                : 'linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(255, 193, 7, 0.08))',
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted text-uppercase fw-bold d-flex align-items-center gap-1" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                  <span>Health</span>
                  {liveStats.useRealDollars && (
                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                      Today's $
                    </span>
                  )}
                </div>
                <div className="d-flex align-items-center gap-1.5 mt-0.5">
                  <span 
                    className={`rounded-circle ${liveStats.isFullyFunded ? 'bg-success' : 'bg-warning'}`}
                    style={{ width: '8px', height: '8px' }}
                  ></span>
                  <span className={`fw-bold ${liveStats.isFullyFunded ? 'text-success' : 'text-warning'}`} style={{ fontSize: '0.82rem' }}>
                    {isCalculating ? (
                      'Recalculating...'
                    ) : liveStats.isFullyFunded ? (
                      `Fully Funded (to Age ${liveStats.lifeExp})`
                    ) : (
                      `Depletes at Age ${liveStats.failureAge}`
                    )}
                  </span>
                </div>
              </div>

              <div className="text-end">
                <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                  Estate
                </div>
                <div className="fw-bold text-success mt-0.5" style={{ fontSize: '0.88rem' }}>
                  {isCalculating ? '...' : liveStats.formattedEstate}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. RETIREMENT TIMING */}
        <div className="mb-3">
          <div className="text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
            Retirement Timing
          </div>

          <div className="d-flex flex-column gap-2">
            <div className="d-flex justify-content-between align-items-center gap-2 bg-input p-2 rounded-3 border border-secondary border-opacity-40">
              <span className="fw-semibold text-main text-nowrap" style={{ fontSize: '0.78rem' }}>
                {data.inputs.p1_name || 'Player 1'} Age
              </span>
              <div style={{ width: '110px' }}>
                <StepperInput
                  min={data.inputs.p1_age ?? 18}
                  max={data.inputs.p1_lifeExp ?? 95}
                  value={data.inputs.p1_retireAge ?? 60}
                  onChange={(val: any) => handleRetireAgeChange('p1', val)}
                />
              </div>
            </div>

            {isCouple && (
              <div className="d-flex justify-content-between align-items-center gap-2 bg-input p-2 rounded-3 border border-secondary border-opacity-40">
                <span className="fw-semibold text-main text-nowrap" style={{ fontSize: '0.78rem' }}>
                  {data.inputs.p2_name || 'Player 2'} Age
                </span>
                <div style={{ width: '110px' }}>
                  <StepperInput
                    disabled={data.inputs.retire_same_time}
                    min={data.inputs.p2_age ?? 18}
                    max={data.inputs.p2_lifeExp ?? 95}
                    value={data.inputs.p2_retireAge ?? 60}
                    onChange={(val: any) => handleRetireAgeChange('p2', val)}
                  />
                </div>
              </div>
            )}

            {isCouple && (
              <div className="form-check form-switch mb-0 d-flex align-items-center justify-content-between px-1 py-1">
                <label 
                  className="form-check-label fw-semibold text-muted cursor-pointer" 
                  style={{ fontSize: '0.72rem' }} 
                  htmlFor="syncRetireQuick"
                >
                  Sync Retirement Timing
                </label>
                <input
                  className="form-check-input ms-0 mt-0 cursor-pointer shadow-none"
                  style={{ transform: 'scale(0.85)' }}
                  type="checkbox"
                  id="syncRetireQuick"
                  checked={data.inputs.retire_same_time ?? false}
                  onChange={(e) => handleSyncToggle(e.target.checked)}
                />
              </div>
            )}
          </div>
        </div>

        {/* 4. ECONOMIC & RETURN ASSUMPTIONS */}
        <div className="mb-2">
          <div className="text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
            Market & Inflation Rates
          </div>

          <div className="d-flex flex-column gap-2">
            {/* Non-overlapping Inflation Stepper */}
            <div className="d-flex justify-content-between align-items-center gap-2 bg-input p-2 rounded-3 border border-secondary border-opacity-40">
              <span className="fw-semibold text-main text-nowrap" style={{ fontSize: '0.78rem' }}>
                Inflation Rate
              </span>
              
              <div 
                className="d-inline-flex align-items-center bg-body border border-secondary rounded-pill p-1 shadow-sm justify-content-between" 
                style={{ height: '34px', width: '110px' }}
              >
                <button 
                  type="button" 
                  className="btn btn-sm btn-link text-muted p-0 px-1 d-flex align-items-center text-decoration-none"
                  onClick={() => updateInput('inflation_rate', Math.max(0, Number((currentInflationRate - 0.1).toFixed(1))))}
                  title="Decrease inflation 0.1%"
                >
                  <i className="bi bi-dash-circle-fill fs-6"></i>
                </button>
                <div className="d-flex align-items-center justify-content-center flex-grow-1 text-center">
                  <span className="fw-bold text-main" style={{ fontSize: '0.82rem' }}>
                    {currentInflationRate.toFixed(1)}%
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-sm btn-link text-primary p-0 px-1 d-flex align-items-center text-decoration-none"
                  onClick={() => updateInput('inflation_rate', Math.min(15, Number((currentInflationRate + 0.1).toFixed(1))))}
                  title="Increase inflation 0.1%"
                >
                  <i className="bi bi-plus-circle-fill fs-6"></i>
                </button>
              </div>
            </div>

            {/* Portfolio Expected Return Presets */}
            <div className="bg-input p-2 rounded-3 border border-secondary border-opacity-40">
              <div className="d-flex justify-content-between align-items-center mb-1.5">
                <span className="fw-semibold text-main" style={{ fontSize: '0.75rem' }}>
                  Return Rate (TFSA/RRSP)
                </span>
                <span className="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 rounded-pill px-2" style={{ fontSize: '0.72rem' }}>
                  {currentReturnRate.toFixed(1)}%
                </span>
              </div>

              <div className="d-flex gap-1">
                {[
                  { label: 'Cons (4.5%)', val: 4.5 },
                  { label: 'Bal (6.0%)', val: 6.0 },
                  { label: 'Grow (7.5%)', val: 7.5 },
                ].map((preset) => {
                  const isActive = Math.abs(currentReturnRate - preset.val) < 0.2;
                  return (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handlePortfolioReturnPreset(preset.val)}
                      className={`btn btn-sm rounded-pill py-0.5 px-2 flex-fill fw-semibold transition-all ${
                        isActive
                          ? 'btn-primary text-white shadow-sm'
                          : 'btn-outline-secondary border-secondary text-muted'
                      }`}
                      style={{ fontSize: '0.68rem', whiteSpace: 'nowrap' }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-2.5">
          <span className="text-muted small" style={{ fontSize: '0.68rem' }}>
            <i className="bi bi-info-circle me-1"></i> Changes update all charts and tables in real time.
          </span>
        </div>
      </div>
    </div>
  );
}