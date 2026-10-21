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
import { useFinance } from '../lib/FinanceContext';

export default function PlanTab() {
  const { data, results } = useFinance();

  // Collapsible state for each section (default: all expanded)
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [isLiveBarMinimized, setIsLiveBarMinimized] = useState<boolean>(false);

  const sections = useMemo(() => [
    { id: 'personal', title: '1. Personal Information', icon: 'bi-person-fill', component: <PersonalInformationCard /> },
    { id: 'dependents', title: '2. Dependents & Family', icon: 'bi-people-fill', component: <DependentsCard /> },
    { id: 'portfolio', title: '3. Portfolio Assets & Balances', icon: 'bi-safe2-fill', component: <PortfolioAssetsCard /> },
    { id: 'realestate', title: '4. Real Estate & Properties', icon: 'bi-house-fill', component: <LivingCostCard /> },
    { id: 'tax', title: '5. Income, Deductions & Taxes', icon: 'bi-cash-coin', component: <IncomeTaxCard /> },
    { id: 'living', title: '6. Living Expenses & Phases', icon: 'bi-cart-fill', component: <LivingExpensesCard /> },
    { id: 'future', title: '7. Future Milestone Expenses', icon: 'bi-calendar-event-fill', component: <FutureExpensesCard /> },
    { id: 'windfalls', title: '8. Windfalls & Lump Sums', icon: 'bi-gift-fill', component: <WindfallsCard /> },
    { id: 'govt', title: '9. Government Benefits & DB Pensions', icon: 'bi-building-fill', component: <GovtBenefitsCard /> },
    { id: 'economic', title: '10. Economic & Return Assumptions', icon: 'bi-sliders', component: <EconomicAssumptionsCard /> }
  ], []);

  const toggleSection = (id: string) => {
    setCollapsedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsedMap({});
  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    sections.forEach(s => { allCollapsed[s.id] = true; });
    setCollapsedMap(allCollapsed);
  };

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

  const formatShort = (val: number) => {
    if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
  };

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
      `}</style>

      {/* --- TOP CONTROLS: EXPAND / COLLAPSE TOOLBAR --- */}
      <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-4 pb-2 border-bottom border-secondary border-opacity-50">
        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted fw-bold text-uppercase ls-1" style={{ fontSize: '0.78rem' }}>
            <i className="bi bi-ui-checks-grid me-2 text-primary"></i> 10 Plan Sections
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input"
            onClick={expandAll}
            style={{ fontSize: '0.75rem' }}
          >
            <i className="bi bi-arrows-expand me-1"></i> Expand All
          </button>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input"
            onClick={collapseAll}
            style={{ fontSize: '0.75rem' }}
          >
            <i className="bi bi-arrows-collapse me-1"></i> Collapse All
          </button>
        </div>
      </div>

      {/* --- SECTIONS ACCORDION LIST --- */}
      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        {sections.map(sec => {
          const isCollapsed = Boolean(collapsedMap[sec.id]);

          return (
            <div key={sec.id} className="mb-4">
              {/* Header Collapse Toggle Bar */}
              <div 
                className="d-flex justify-content-between align-items-center p-3 rounded-4 surface-card border border-secondary shadow-sm mb-2 cursor-pointer transition-all hover-border-primary"
                onClick={() => toggleSection(sec.id)}
                style={{ userSelect: 'none' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${sec.icon} text-primary fs-5`}></i>
                  <h6 className="fw-bold mb-0 text-main">{sec.title}</h6>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-secondary bg-opacity-25 text-muted small" style={{ fontSize: '0.7rem' }}>
                    {isCollapsed ? 'Collapsed' : 'Open'}
                  </span>
                  <button type="button" className="btn btn-sm btn-link p-0 text-muted text-decoration-none">
                    <i className={`bi bi-chevron-${isCollapsed ? 'down' : 'up'}`}></i>
                  </button>
                </div>
              </div>

              {/* Render Component when Open */}
              {!isCollapsed && (
                <div className="fade-in">
                  {sec.component}
                </div>
              )}
            </div>
          );
        })}
      </form>

      {/* --- STICKY LIVE READINESS BAR --- */}
      {liveStats && (
        <div 
          className="position-sticky bottom-0 z-3 mt-4 pt-2"
          style={{ bottom: '1rem', transition: 'all 0.3s ease' }}
        >
          <div className="surface-card border border-primary border-opacity-50 rounded-4 shadow-lg p-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(30, 41, 59, 0.92)' }}>
            
            {/* Left: Health Indicator */}
            <div className="d-flex align-items-center gap-3">
              <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${liveStats.isFullyFunded ? 'bg-success bg-opacity-25 text-success' : 'bg-warning bg-opacity-25 text-warning'}`} style={{ width: '40px', height: '40px' }}>
                <i className={`bi ${liveStats.isFullyFunded ? 'bi-shield-check-fill fs-4' : 'bi-exclamation-triangle-fill fs-5'}`}></i>
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`fw-bold text-uppercase ls-1 ${liveStats.isFullyFunded ? 'text-success' : 'text-warning'}`} style={{ fontSize: '0.8rem' }}>
                    {liveStats.isFullyFunded ? 'Fully Funded to Life Expectancy' : `Portfolio Depletes at Age ${liveStats.failureAge}`}
                  </span>
                  {liveStats.useRealDollars && (
                    <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25" style={{ fontSize: '0.65rem' }}>
                      Real \$
                    </span>
                  )}
                </div>
                <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                  {liveStats.isFullyFunded 
                    ? `Zero projected shortfalls across entire horizon (to age ${liveStats.lifeExp})` 
                    : `Needs trimming or higher savings to eliminate late-retirement deficit`}
                </div>
              </div>
            </div>

            {/* Right: Key Figures & Quick Action */}
            {!isLiveBarMinimized ? (
              <div className="d-flex align-items-center justify-content-between justify-content-md-end gap-3 flex-wrap">
                <div className="text-end">
                  <span className="small text-muted fw-bold d-block" style={{ fontSize: '0.68rem' }}>LIQUID AT AGE {liveStats.retAge}</span>
                  <span className="fw-bold text-main" style={{ fontSize: '0.95rem' }}>{formatShort(liveStats.liquidAtRet)}</span>
                </div>

                <div className="border-start border-secondary opacity-50" style={{ height: '24px' }}></div>

                <div className="text-end">
                  <span className="small text-muted fw-bold d-block" style={{ fontSize: '0.68rem' }}>ESTATE AT AGE {liveStats.lifeExp}</span>
                  <span className="fw-bold text-success" style={{ fontSize: '0.95rem' }}>{formatShort(liveStats.finalEstate)}</span>
                </div>

                <button 
                  type="button" 
                  className="btn btn-sm btn-link text-muted p-1 ms-1 text-decoration-none"
                  onClick={() => setIsLiveBarMinimized(true)}
                  title="Minimize bar"
                >
                  <i className="bi bi-chevron-down"></i>
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold"
                onClick={() => setIsLiveBarMinimized(false)}
                style={{ fontSize: '0.75rem' }}
              >
                <i className="bi bi-chevron-up me-1"></i> Show Numbers
              </button>
            )}

          </div>
        </div>
      )}
      
    </div>
  );
}