'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { StepperInput, PercentInput } from './SharedUI';

interface QuickAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickAdjustModal({ isOpen, onClose }: QuickAdjustModalProps) {
  const finance = useFinance() as any;
  const { data, updateInput, updateMultipleInputs, results, isCalculating } = finance;

  const cardRef = useRef<HTMLDivElement>(null);
  const isCouple = data.mode === 'Couple';

  // Snapshot initial baseline values when modal opens so user can "Revert"
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

  // Track if current inputs differ from baseline snapshot
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

  // 1. Calculate Live "What-If" Status HUD from results
  const liveHUD = useMemo(() => {
    const timeline = results?.timeline || [];
    if (!timeline || timeline.length === 0) {
      return { isFullyFunded: true, fundedAge: 95, estateValue: '$0', rawEstate: 0 };
    }

    const p1Ret = data.inputs.p1_retireAge ?? 60;
    const shortfallYear = timeline.find(
      (y: any) => y.p1Age >= p1Ret && (y.liquidNW <= 0 || (y.shortfall && y.shortfall > 0))
    );

    const lastYear = timeline[timeline.length - 1];
    const rawEstate = lastYear?.netWorth ?? lastYear?.liquidNW ?? 0;
    const formattedEstate = new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(rawEstate);

    if (shortfallYear) {
      return {
        isFullyFunded: false,
        fundedAge: shortfallYear.p1Age,
        estateValue: '$0',
        rawEstate: 0,
      };
    }

    return {
      isFullyFunded: true,
      fundedAge: lastYear?.p1Age || 95,
      estateValue: formattedEstate,
      rawEstate,
    };
  }, [results, data.inputs.p1_retireAge]);

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
        {/* 2. LIVE IMPACT SCORECARD (THE HUD) */}
        <div 
          className="p-2.5 rounded-3 mb-3 border border-secondary border-opacity-50"
          style={{
            background: liveHUD.isFullyFunded 
              ? 'linear-gradient(135deg, rgba(25, 135, 84, 0.12), rgba(13, 202, 240, 0.06))' 
              : 'linear-gradient(135deg, rgba(220, 53, 69, 0.15), rgba(255, 193, 7, 0.08))',
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            {/* Funded Status */}
            <div>
              <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                Plan Longevity
              </div>
              <div className="d-flex align-items-center gap-1.5 mt-0.5">
                <span 
                  className={`rounded-circle ${liveHUD.isFullyFunded ? 'bg-success' : 'bg-danger'}`}
                  style={{ width: '8px', height: '8px' }}
                ></span>
                <span className={`fw-bold ${liveHUD.isFullyFunded ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.85rem' }}>
                  {isCalculating ? (
                    'Recalculating...'
                  ) : liveHUD.isFullyFunded ? (
                    `Funded to Age ${liveHUD.fundedAge}+`
                  ) : (
                    `Shortfall at Age ${liveHUD.fundedAge}`
                  )}
                </span>
              </div>
            </div>

            {/* Estate Value */}
            <div className="text-end">
              <div className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.62rem', letterSpacing: '0.5px' }}>
                Estate @ 90
              </div>
              <div className="fw-bold text-main mt-0.5" style={{ fontSize: '0.88rem' }}>
                {isCalculating ? '...' : liveHUD.estateValue}
              </div>
            </div>
          </div>
        </div>

        {/* 3. RETIREMENT TIMING SECTION */}
        <div className="mb-3">
          <div className="text-muted text-uppercase fw-bold mb-1.5" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>
            Retirement Timing
          </div>

          <div className="d-flex flex-column gap-2">
            {/* P1 Retire Age */}
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

            {/* P2 Retire Age (If Couple) */}
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

            {/* Retire at Same Time Switch */}
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
            {/* Inflation Rate */}
            <div className="d-flex justify-content-between align-items-center gap-2 bg-input p-2 rounded-3 border border-secondary border-opacity-40">
              <span className="fw-semibold text-main text-nowrap" style={{ fontSize: '0.78rem' }}>
                Inflation Rate
              </span>
              <div style={{ width: '110px' }}>
                <PercentInput
                  className="form-control form-control-sm text-end bg-transparent border-0 fw-bold shadow-none text-main p-0"
                  value={data.inputs.inflation_rate ?? 2.1}
                  onChange={(val: any) => updateInput('inflation_rate', val)}
                />
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

              {/* 3 Quick Presets */}
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

        {/* HELPER HINT */}
        <div className="text-center mt-2.5">
          <span className="text-muted small" style={{ fontSize: '0.68rem' }}>
            <i className="bi bi-info-circle me-1"></i> Changes update all charts and tables in real time.
          </span>
        </div>
      </div>
    </div>
  );
}