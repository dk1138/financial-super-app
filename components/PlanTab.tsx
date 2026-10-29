'use client';

import React, { useState, useMemo } from 'react';
import PersonalInformationCard from './plan/PersonalInformationCard';
import DependentsCard from './plan/DependentsCard';
import PortfolioAssetsCard from './plan/PortfolioAssetsCard';
import LivingCostCard from './plan/LivingCostCard';
import IncomeTaxCard from './plan/IncomeTaxCard';
import LivingExpensesCard from './plan/LivingExpensesCard';
import FutureExpensesCard from './plan/FutureExpensesCard';
import WindfallsCard from './plan/WindfallsCard';
import GovtBenefitsCard from './plan/GovtBenefitsCard';
import EconomicAssumptionsCard from './plan/EconomicAssumptionsCard';
import RollForwardModal from './history/RollForwardModal';
import { useFinance } from '../lib/FinanceContext';

export default function PlanTab() {
  const { data, results } = useFinance();

  const [showRollForward, setShowRollForward] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Collapsed state map for the 10 sections
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setCollapsedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsedMap({});
  const collapseAll = () => {
    setCollapsedMap({
      personal: true,
      dependents: true,
      portfolio: true,
      realestate: true,
      tax: true,
      living: true,
      future: true,
      windfalls: true,
      govt: true,
      economic: true
    });
  };

  const formatShort = (val: number) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
  };

  // --- SMART COLLAPSED CARD SUMMARIES (CENTERED & MATCHING TITLE SCALE) ---
  const sectionSummaries = useMemo(() => {
    const fallback = {
      personal: '',
      dependents: '',
      portfolio: '',
      realestate: '',
      tax: '',
      living: '',
      future: '',
      windfalls: '',
      govt: '',
      economic: ''
    };

    if (!data || !data.inputs) return fallback;
    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    // 1. Personal Information
    const p1Age = data.inputs.p1_age ?? 38;
    const p1Ret = data.inputs.p1_retireAge ?? 60;
    const p2Age = data.inputs.p2_age ?? 34;
    const p2Ret = data.inputs.p2_retireAge ?? 60;
    const personalText = isCouple 
      ? `${p1Name}: Age ${p1Age} (Retire ${p1Ret})  |  ${p2Name}: Age ${p2Age} (Retire ${p2Ret})` 
      : `${p1Name}: Age ${p1Age}  |  Target Retirement: Age ${p1Ret}`;

    // 2. Dependents & Family
    const depCount = data.dependents?.length || 0;
    const depText = depCount === 0 ? 'No Dependents' : `${depCount} ${depCount === 1 ? 'Child' : 'Children'} Registered`;

    // 3. Portfolio Assets
    const acctKeys = ['cash', 'tfsa', 'fhsa', 'rrsp', 'resp', 'lirf', 'lif', 'rrif_acct', 'nonreg', 'crypto'];
    let totalPort = 0;
    ['p1', 'p2'].forEach(p => {
      if (!isCouple && p === 'p2') return;
      acctKeys.forEach(k => {
        totalPort += Number(data.inputs[`${p}_${k}`]) || 0;
      });
    });
    if (data.customAssets) {
      data.customAssets.forEach((ca: any) => {
        if (isCouple || ca.owner === 'p1') totalPort += Number(ca.balance) || 0;
      });
    }
    const alloc = data.inputs.portfolio_allocation 
      ? data.inputs.portfolio_allocation.charAt(0).toUpperCase() + data.inputs.portfolio_allocation.slice(1) 
      : 'Custom';
    const portText = `${formatShort(totalPort)} Total Portfolio  |  ${alloc} Allocation`;

    // 4. Real Estate & Living Costs
    const primaryVal = Number(data.inputs.primary_value) || 0;
    const primaryMort = Number(data.inputs.primary_mortgage) || 0;
    const primaryRent = Number(data.inputs.primary_rent) || 0;
    const realestateText = primaryVal > 0 
      ? `Home: ${formatShort(primaryVal)}${primaryMort > 0 ? `  |  Mortgage: \${formatShort(primaryMort)}` : '  |  Mortgage-Free'}`
      : `Residence: ${formatShort(primaryRent)}/mo Rent`;

    // 5. Income & Taxes
    const prov = data.inputs.province || 'ON';
    const p1Inc = Number(data.inputs.p1_income) || 0;
    const p2Inc = isCouple ? (Number(data.inputs.p2_income) || 0) : 0;
    const taxText = `${prov}  |  Household Income: ${formatShort(p1Inc + p2Inc)}/yr`;

    // 6. Living Expenses
    let annualSpend = 60000;
    if (results?.timeline && results.timeline[0]?.expenses) {
      annualSpend = Math.round(results.timeline[0].expenses);
    } else if (data.expensePhases && data.expensePhases[0]?.amount) {
      annualSpend = Number(data.expensePhases[0].amount);
    }
    const livingText = `Living Expenses: ${formatShort(annualSpend / 12)}/mo (${formatShort(annualSpend)}/yr)`;

    // 7. Future Milestone Expenses
    const futureCount = data.debt?.length || 0;
    const futureText = futureCount === 0 ? 'No Milestone Expenses' : `${futureCount} Planned ${futureCount === 1 ? 'Milestone Expense' : 'Milestone Expenses'}`;

    // 8. Windfalls
    const windfallCount = data.windfalls?.length || 0;
    const windfallsText = windfallCount === 0 ? 'No Windfalls Scheduled' : `${windfallCount} Future ${windfallCount === 1 ? 'Windfall' : 'Windfalls'} Scheduled`;

    // 9. Government Benefits
    const p1Cpp = data.inputs.p1_cpp_start || 65;
    const p1Oas = data.inputs.p1_oas_start || 65;
    const p2Cpp = data.inputs.p2_cpp_start || 65;
    const p2Oas = data.inputs.p2_oas_start || 65;
    const govtText = isCouple 
      ? `P1: CPP @ ${p1Cpp}, OAS @ ${p1Oas}  |  P2: CPP @ ${p2Cpp}, OAS @ ${p2Oas}`
      : `CPP Start: Age ${p1Cpp}  |  OAS Start: Age ${p1Oas}`;

    // 10. Economic Assumptions
    const inf = data.inputs.inflation_rate !== undefined && data.inputs.inflation_rate !== '' ? data.inputs.inflation_rate : 2.1;
    const economicText = `Inflation: ${inf}%  |  Simulation Horizon: Age ${data.inputs.p1_lifeExp || 90}`;

    return {
      personal: personalText,
      dependents: depText,
      portfolio: portText,
      realestate: realestateText,
      tax: taxText,
      living: livingText,
      future: futureText,
      windfalls: windfallsText,
      govt: govtText,
      economic: economicText
    };
  }, [data, results]);

  // --- LIVE READINESS MATH ---
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

    return {
      isFullyFunded: failureAge === null,
      failureAge,
      liquidAtRet: Math.round(liquidAtRet),
      finalEstate: Math.round(finalEstate),
      retAge: p1RetAge,
      lifeExp: finalItem?.p1Age || 90,
      useRealDollars
    };
  }, [results, data]);

  return (
    <div className="p-3 p-md-4 position-relative">
      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="number"] {
            -moz-appearance: textfield;
        }

        /* Direct accordion styling on existing cards */
        .plan-card-wrapper {
            position: relative;
        }
        .plan-card-wrapper .card-header {
            padding-right: 48px !important;
        }
        .collapse-chevron-btn {
            position: absolute;
            top: 0;
            right: 18px;
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            box-shadow: none !important;
            color: var(--bs-secondary-color, #94a3b8) !important;
            cursor: pointer;
            transition: color 0.15s ease-in-out;
        }
        .collapse-chevron-btn:hover {
            color: var(--bs-primary, #3b82f6) !important;
        }
        .collapse-summary-text {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            height: 56px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 15;
            pointer-events: none;
            max-width: 48%;
            font-size: 0.98rem;
            font-weight: 600;
            color: var(--bs-info, #38bdf8);
            letter-spacing: 0.2px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.2;
        }
        .plan-card-wrapper.is-collapsed .card-body {
            display: none !important;
        }
        .plan-card-wrapper.is-collapsed .card-header {
            border-bottom: none !important;
        }
        .plan-card-wrapper.is-collapsed .rp-card {
            margin-bottom: 0.75rem !important;
        }

        /* Floating Readiness Island styling */
        .floating-readiness-island {
            max-width: 680px;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(12px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
        }
        [data-bs-theme="dark"] .floating-readiness-island {
            background-color: rgba(15, 23, 42, 0.92);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
        }
      `}</style>

      {/* --- TOAST NOTIFICATION --- */}
      {toastMsg && (
        <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{ zIndex: 2050 }}>
          <div className="bg-success text-white px-4 py-2.5 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success small">
            <i className="bi bi-check-circle-fill me-2 fs-6"></i>
            {toastMsg}
          </div>
        </div>
      )}

      {/* --- TOP TOOLBAR: ROLL FORWARD & EXPAND / COLLAPSE ALL --- */}
      <div className="d-flex align-items-center justify-content-end flex-wrap gap-2 mb-3">
        <button 
          type="button" 
          className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold bg-input shadow-sm d-flex align-items-center gap-1.5"
          onClick={() => setShowRollForward(true)}
          style={{ fontSize: '0.78rem' }}
          title="Archive current year statement actuals, advance household by +1 year, and rollover into new calendar year"
        >
          <i className="bi bi-calendar-plus text-primary"></i> Roll Forward 1 Year
        </button>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input shadow-sm"
          onClick={expandAll}
          style={{ fontSize: '0.78rem' }}
        >
          <i className="bi bi-arrows-expand me-1"></i> Expand All
        </button>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input shadow-sm"
          onClick={collapseAll}
          style={{ fontSize: '0.78rem' }}
        >
          <i className="bi bi-arrows-collapse me-1"></i> Collapse All
        </button>
      </div>

      {/* --- FORM WITH THE 10 EXISTING CARDS --- */}
      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        
        {/* 1. Personal Information */}
        <div className={`plan-card-wrapper ${collapsedMap['personal'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['personal'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.personal}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('personal')}
            title={collapsedMap['personal'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['personal'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <PersonalInformationCard />
        </div>

        {/* 2. Dependents & Family */}
        <div className={`plan-card-wrapper ${collapsedMap['dependents'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['dependents'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.dependents}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('dependents')}
            title={collapsedMap['dependents'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['dependents'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <DependentsCard />
        </div>

        {/* 3. Portfolio Assets */}
        <div className={`plan-card-wrapper ${collapsedMap['portfolio'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['portfolio'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.portfolio}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('portfolio')}
            title={collapsedMap['portfolio'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['portfolio'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <PortfolioAssetsCard />
        </div>

        {/* 4. Real Estate & Living Costs */}
        <div className={`plan-card-wrapper ${collapsedMap['realestate'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['realestate'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.realestate}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('realestate')}
            title={collapsedMap['realestate'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['realestate'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <LivingCostCard />
        </div>

        {/* 5. Income & Taxes */}
        <div className={`plan-card-wrapper ${collapsedMap['tax'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['tax'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.tax}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('tax')}
            title={collapsedMap['tax'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['tax'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <IncomeTaxCard />
        </div>

        {/* 6. Living Expenses */}
        <div className={`plan-card-wrapper ${collapsedMap['living'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['living'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.living}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('living')}
            title={collapsedMap['living'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['living'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <LivingExpensesCard />
        </div>

        {/* 7. Future Milestone Expenses */}
        <div className={`plan-card-wrapper ${collapsedMap['future'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['future'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.future}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('future')}
            title={collapsedMap['future'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['future'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <FutureExpensesCard />
        </div>

        {/* 8. Windfalls */}
        <div className={`plan-card-wrapper ${collapsedMap['windfalls'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['windfalls'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.windfalls}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('windfalls')}
            title={collapsedMap['windfalls'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['windfalls'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <WindfallsCard />
        </div>

        {/* 9. Government Benefits */}
        <div className={`plan-card-wrapper ${collapsedMap['govt'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['govt'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.govt}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('govt')}
            title={collapsedMap['govt'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['govt'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <GovtBenefitsCard />
        </div>

        {/* 10. Economic Assumptions */}
        <div className={`plan-card-wrapper ${collapsedMap['economic'] ? 'is-collapsed' : ''}`}>
          {collapsedMap['economic'] && (
            <div className="collapse-summary-text d-none d-md-flex">
              {sectionSummaries.economic}
            </div>
          )}
          <button 
            type="button" 
            className="btn btn-sm btn-link text-muted p-0 collapse-chevron-btn"
            onClick={() => toggleSection('economic')}
            title={collapsedMap['economic'] ? "Expand section" : "Collapse section"}
          >
            <i className={`bi bi-chevron-${collapsedMap['economic'] ? 'down' : 'up'} fs-5`}></i>
          </button>
          <EconomicAssumptionsCard />
        </div>

      </form>

      {/* --- CENTERED FLOATING READINESS ISLAND (Option 1) --- */}
      {liveStats && (
        <div 
          className="position-sticky bottom-0 z-3 mt-4 pt-2 d-flex justify-content-center"
          style={{ bottom: '1.25rem', transition: 'all 0.3s ease', pointerEvents: 'none' }}
        >
          <div 
            className="floating-readiness-island border border-primary border-opacity-50 rounded-pill py-2 px-3 d-flex align-items-center justify-content-between gap-3 text-nowrap shadow-lg"
            style={{ 
              pointerEvents: 'auto',
              backgroundColor: 'var(--bg-card)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)'
            }}
          >
            {/* Left: Health Status */}
            <div className="d-flex align-items-center gap-2 overflow-hidden">
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${liveStats.isFullyFunded ? 'bg-success bg-opacity-25 text-success' : 'bg-warning bg-opacity-25 text-warning'}`} 
                style={{ width: '28px', height: '28px' }}
              >
                <i className={`bi ${liveStats.isFullyFunded ? 'bi-shield-check-fill fs-6' : 'bi-exclamation-triangle-fill fs-6'}`}></i>
              </div>
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <span className={`fw-bold text-uppercase ls-1 text-truncate ${liveStats.isFullyFunded ? 'text-success' : 'text-warning'}`} style={{ fontSize: '0.78rem' }}>
                  {liveStats.isFullyFunded ? `Fully Funded (to Age ${liveStats.lifeExp})` : `Depletes at Age ${liveStats.failureAge}`}
                </span>
                {liveStats.useRealDollars && (
                  <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 d-none d-sm-inline-block" style={{ fontSize: '0.62rem' }}>
                    Today's $
                  </span>
                )}
              </div>
            </div>

            {/* Right: Key Financial Metrics */}
            <div className="d-flex align-items-center gap-2 gap-sm-3 flex-shrink-0">
              <div className="border-start border-secondary opacity-50" style={{ height: '18px' }}></div>
              <div className="d-flex align-items-baseline gap-1">
                <span className="text-muted fw-bold" style={{ fontSize: '0.68rem' }}>LIQ @ {liveStats.retAge}:</span>
                <span className="fw-bold text-main" style={{ fontSize: '0.85rem' }}>{formatShort(liveStats.liquidAtRet)}</span>
              </div>

              <div className="border-start border-secondary opacity-50" style={{ height: '18px' }}></div>
              <div className="d-flex align-items-baseline gap-1">
                <span className="text-muted fw-bold" style={{ fontSize: '0.68rem' }}>ESTATE:</span>
                <span className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>{formatShort(liveStats.finalEstate)}</span>
              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* --- ROLL FORWARD WIZARD MODAL --- */}
      <RollForwardModal 
        isOpen={showRollForward} 
        onClose={() => setShowRollForward(false)} 
        showToast={showToast} 
      />
    </div>
  );
}