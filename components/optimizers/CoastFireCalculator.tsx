'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput, PercentInput, StepperInput, InfoBtn, SegmentedControl } from '../SharedUI';

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(
    Math.round(val || 0)
  );

const fmtCompact = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `$${Math.round(val / 1_000)}k`;
  return fmtCurrency(val);
};

export default function CoastFireCalculator() {
  const { data } = useFinance();
  const isCouple = data?.mode === 'Couple';

  // Derive sensible defaults from the user's live plan
  const derivedDefaults = useMemo(() => {
    const inp = data?.inputs || {};
    const age = Number(inp.p1_age) || 35;
    const retAge = Math.max(age + 1, Number(inp.p1_retireAge) || 65);
    const invKeys = ['tfsa', 'rrsp', 'fhsa', 'nonreg', 'lirf', 'lif', 'rrif_acct', 'cash'];
    let portfolio = 0;
    invKeys.forEach((k) => {
      portfolio += Number(inp[`p1_${k}`]) || 0;
      if (isCouple) portfolio += Number(inp[`p2_${k}`]) || 0;
    });
    if (Array.isArray(data?.customAssets)) {
      data.customAssets.forEach((a: any) => {
        portfolio += Number(a?.balance) || 0;
      });
    }

    let annualRetSpend = 0;
    const cats = data?.expensesByCategory || {};
    Object.values(cats).forEach((cat: any) => {
      if (Array.isArray(cat?.items)) {
        cat.items.forEach((item: any) => {
          const freq = Number(item.freq) || 12;
          annualRetSpend += (Number(item.ret ?? item.gogo ?? item.curr ?? 0) || 0) * freq;
        });
      }
    });

    const nomReturn = Number(inp.p1_tfsa_ret) || 6.5;
    const inflation = Number(inp.inflation_rate) || 2.1;

    return {
      age,
      retAge,
      portfolio: portfolio > 0 ? Math.round(portfolio) : 250000,
      annualRetSpend: annualRetSpend > 0 ? Math.round(annualRetSpend) : 60000,
      nomReturn,
      inflation,
    };
  }, [data, isCouple]);

  const [mode, setMode] = useState<'coast' | 'barista'>('coast');
  const [currentAge, setCurrentAge] = useState(derivedDefaults.age);
  const [targetRetireAge, setTargetRetireAge] = useState(derivedDefaults.retAge);
  const [currentPortfolio, setCurrentPortfolio] = useState(derivedDefaults.portfolio);
  const [annualSavings, setAnnualSavings] = useState(18000);
  const [annualRetSpend, setAnnualRetSpend] = useState(derivedDefaults.annualRetSpend);
  const [nomReturn, setNomReturn] = useState(derivedDefaults.nomReturn);
  const [inflation, setInflation] = useState(derivedDefaults.inflation);
  const [swr, setSwr] = useState(4.0);
  const [includeGovPensions, setIncludeGovPensions] = useState(true);
  const [baristaIncomeAnnual, setBaristaIncomeAnnual] = useState(24000);

  // Sync if user loads a persona or resets plan
  useEffect(() => {
    setCurrentAge(derivedDefaults.age);
    setTargetRetireAge(derivedDefaults.retAge);
    setCurrentPortfolio(derivedDefaults.portfolio);
    setAnnualRetSpend(derivedDefaults.annualRetSpend);
    setNomReturn(derivedDefaults.nomReturn);
    setInflation(derivedDefaults.inflation);
  }, [derivedDefaults.age, derivedDefaults.retAge, derivedDefaults.portfolio, derivedDefaults.annualRetSpend]);

  const calc = useMemo(() => {
    const yearsToRetire = Math.max(1, targetRetireAge - currentAge);
    const realRate = (1 + nomReturn / 100) / (1 + inflation / 100) - 1;
    const safeRate = Math.max(0.001, realRate);

    // Conservative Canadian CPP + OAS annual estimate at 65 (today's dollars)
    const estCppOasAnnual = includeGovPensions ? (isCouple ? 34000 : 19000) : 0;
    const netSpendFromPortfolio = Math.max(0, annualRetSpend - estCppOasAnnual);

    const fiNumber = swr > 0 ? netSpendFromPortfolio / (swr / 100) : 0;
    const coastNumberToday = fiNumber / Math.pow(1 + safeRate, yearsToRetire);
    const isAlreadyCoast = currentPortfolio >= coastNumberToday;
    const coastProgressPct = coastNumberToday > 0 ? Math.min(100, Math.round((currentPortfolio / coastNumberToday) * 100)) : 100;
    const coastGap = Math.max(0, coastNumberToday - currentPortfolio);

    // Projected portfolio at target retirement if stopping all contributions today
    const projectedCoastBalance = currentPortfolio * Math.pow(1 + safeRate, yearsToRetire);

    // Solve exact age user hits Coast FIRE if continuing annualSavings
    let coastHitAge: number | null = isAlreadyCoast ? currentAge : null;
    if (!isAlreadyCoast && annualSavings > 0) {
      let bal = currentPortfolio;
      for (let yr = 1; yr <= yearsToRetire; yr++) {
        bal = bal * (1 + safeRate) + annualSavings;
        const remainingYrs = yearsToRetire - yr;
        const requiredAtAge = fiNumber / Math.pow(1 + safeRate, remainingYrs);
        if (bal >= requiredAtAge) {
          coastHitAge = currentAge + yr;
          break;
        }
      }
    }

    // Barista FIRE: portfolio needed today if part-time income covers baristaIncomeAnnual
    const baristaNetNeed = Math.max(0, annualRetSpend - baristaIncomeAnnual);
    const baristaFiNumber = swr > 0 ? baristaNetNeed / (swr / 100) : 0;
    const isBaristaReady = currentPortfolio >= baristaFiNumber;
    const baristaGap = Math.max(0, baristaFiNumber - currentPortfolio);
    const monthlyPartTimeNeededToCoastNow = Math.max(0, Math.round(annualRetSpend / 12));

    return {
      yearsToRetire,
      realRatePct: realRate * 100,
      estCppOasAnnual,
      fiNumber,
      coastNumberToday,
      isAlreadyCoast,
      coastProgressPct,
      coastGap,
      projectedCoastBalance,
      coastHitAge,
      baristaFiNumber,
      isBaristaReady,
      baristaGap,
      monthlyPartTimeNeededToCoastNow,
    };
  }, [
    currentAge,
    targetRetireAge,
    currentPortfolio,
    annualSavings,
    annualRetSpend,
    nomReturn,
    inflation,
    swr,
    includeGovPensions,
    baristaIncomeAnnual,
    isCouple,
  ]);

  return (
    <div className="rp-card border border-secondary rounded-4 p-4 h-100 position-relative d-flex flex-column shadow-sm">
      {/* HEADER */}
      <div className="d-flex align-items-center mb-3">
        <div
          className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3 flex-shrink-0"
          style={{ width: '45px', height: '45px' }}
        >
          <i className="bi bi-compass-fill fs-4"></i>
        </div>
        <div>
          <div className="d-flex align-items-center gap-1">
            <h5 className="fw-bold text-info mb-0 text-uppercase ls-1" style={{ fontSize: '0.95rem' }}>
              Coast &amp; Barista FIRE
            </h5>
            <InfoBtn
              align="left"
              title="Coast FIRE & Barista FIRE"
              text="Coast FIRE is the portfolio size today where you can stop saving and let compounding grow your investments to your full FI target by retirement. Barista FIRE calculates how much smaller your portfolio can be if part-time work covers part of your spending."
            />
          </div>
          <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
            Canadian FI &amp; Semi-Retirement Milestone
          </span>
        </div>
      </div>

      {/* MODE SWITCH */}
      <div className="mb-3">
        <SegmentedControl
          value={mode}
          onChange={setMode}
          options={[
            { value: 'coast', label: 'Coast FIRE' },
            { value: 'barista', label: 'Barista FIRE' },
          ]}
        />
      </div>

      {/* INPUTS */}
      <div className="row g-2 mb-3">
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Current Age</label>
          <StepperInput min={18} max={85} value={currentAge} onChange={setCurrentAge} />
        </div>
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Full FI Age</label>
          <StepperInput min={currentAge + 1} max={90} value={targetRetireAge} onChange={setTargetRetireAge} />
        </div>
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Invested Portfolio</label>
          <CurrencyInput value={currentPortfolio} onChange={setCurrentPortfolio} />
        </div>
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Annual Ret. Spend</label>
          <CurrencyInput value={annualRetSpend} onChange={setAnnualRetSpend} />
        </div>
        {mode === 'coast' ? (
          <div className="col-6">
            <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Annual Savings</label>
            <CurrencyInput value={annualSavings} onChange={setAnnualSavings} />
          </div>
        ) : (
          <div className="col-6">
            <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Part-Time Income/yr</label>
            <CurrencyInput value={baristaIncomeAnnual} onChange={setBaristaIncomeAnnual} />
          </div>
        )}
        <div className="col-3">
          <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>Return</label>
          <PercentInput value={nomReturn} onChange={setNomReturn} />
        </div>
        <div className="col-3">
          <label className="form-label small fw-bold text-muted mb-1" style={{ fontSize: '0.7rem' }}>SWR</label>
          <PercentInput value={swr} onChange={setSwr} />
        </div>
      </div>

      {/* CPP/OAS OFFSET TOGGLE */}
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input cursor-pointer"
          type="checkbox"
          id="coastCppOasToggle"
          checked={includeGovPensions}
          onChange={(e) => setIncludeGovPensions(e.target.checked)}
        />
        <label className="form-check-label small text-muted cursor-pointer" htmlFor="coastCppOasToggle" style={{ fontSize: '0.74rem' }}>
          Factor in est. CPP + OAS ({fmtCurrency(isCouple ? 34000 : 19000)}/yr)
        </label>
      </div>

      {/* RESULT PANEL */}
      <div className="mt-auto p-3 bg-input border border-secondary rounded-4 shadow-sm">
        {mode === 'coast' ? (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem' }}>
                Coast FIRE Number (Today)
              </span>
              <span
                className={`badge rounded-pill border ${
                  calc.isAlreadyCoast
                    ? 'bg-success bg-opacity-10 text-success border-success'
                    : 'bg-info bg-opacity-10 text-info border-info'
                }`}
                style={{ fontSize: '0.66rem' }}
              >
                {calc.isAlreadyCoast ? 'Coast FIRE Reached!' : `${calc.coastProgressPct}% Funded`}
              </span>
            </div>

            <div className="fs-4 fw-bolder text-main mb-2">{fmtCurrency(calc.coastNumberToday)}</div>

            <div className="progress bg-secondary bg-opacity-25 rounded-pill mb-3" style={{ height: '7px' }}>
              <div
                className={`progress-bar rounded-pill ${calc.isAlreadyCoast ? 'bg-success' : 'bg-info'}`}
                style={{ width: `${calc.coastProgressPct}%` }}
              ></div>
            </div>

            <div className="row g-2 small">
              <div className="col-6">
                <div className="text-muted" style={{ fontSize: '0.68rem' }}>Full FI Target ({targetRetireAge})</div>
                <div className="fw-bold text-main">{fmtCompact(calc.fiNumber)}</div>
              </div>
              <div className="col-6">
                <div className="text-muted" style={{ fontSize: '0.68rem' }}>
                  {calc.isAlreadyCoast ? 'Projected w/ $0 Saved' : 'Est. Coast Hit Age'}
                </div>
                <div className={`fw-bold ${calc.isAlreadyCoast ? 'text-success' : 'text-info'}`}>
                  {calc.isAlreadyCoast
                    ? fmtCompact(calc.projectedCoastBalance)
                    : calc.coastHitAge
                    ? `Age ${calc.coastHitAge}`
                    : `After Age ${targetRetireAge}`}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem' }}>
                Barista FIRE Target
              </span>
              <span
                className={`badge rounded-pill border ${
                  calc.isBaristaReady
                    ? 'bg-success bg-opacity-10 text-success border-success'
                    : 'bg-warning bg-opacity-10 text-warning border-warning'
                }`}
                style={{ fontSize: '0.66rem' }}
              >
                {calc.isBaristaReady ? 'Ready to Semi-Retire!' : `${fmtCompact(calc.baristaGap)} to go`}
              </span>
            </div>

            <div className="fs-4 fw-bolder text-main mb-2">{fmtCurrency(calc.baristaFiNumber)}</div>

            <div className="small text-muted mb-2" style={{ fontSize: '0.74rem' }}>
              Earning <strong>{fmtCurrency(baristaIncomeAnnual)}/yr</strong> part-time reduces your needed portfolio from{' '}
              <strong>{fmtCompact(annualRetSpend / (swr / 100))}</strong> to <strong>{fmtCompact(calc.baristaFiNumber)}</strong>.
            </div>

            <div className="d-flex justify-content-between pt-2 border-top border-secondary border-opacity-50 small">
              <span className="text-muted" style={{ fontSize: '0.7rem' }}>Real Growth Rate:</span>
              <span className="fw-bold text-info" style={{ fontSize: '0.74rem' }}>{calc.realRatePct.toFixed(2)}% / yr</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
