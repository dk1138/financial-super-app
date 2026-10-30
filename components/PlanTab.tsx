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
import { useTranslation } from '../lib/LanguageContext';

export default function PlanTab() {
  const { data, results } = useFinance();
  const { t, lang } = useTranslation();
  const isFr = lang === 'fr';

  // Collapsed state map for the 10 sections
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});
  const [activeJumpSection, setActiveJumpSection] = useState<string>('personal');

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

  // Sections navigation metadata
  const jumpSections = useMemo(() => [
    { id: 'personal', label: isFr ? '1. Personnel' : '1. Personal', icon: 'bi-person-vcard' },
    { id: 'dependents', label: isFr ? '2. Personnes à charge' : '2. Dependents', icon: 'bi-people' },
    { id: 'portfolio', label: isFr ? '3. Portefeuille' : '3. Portfolio', icon: 'bi-wallet2' },
    { id: 'realestate', label: isFr ? '4. Logement' : '4. Housing', icon: 'bi-house-heart' },
    { id: 'tax', label: isFr ? '5. Revenus & Impôts' : '5. Income & Tax', icon: 'bi-cash-coin' },
    { id: 'living', label: isFr ? '6. Dépenses' : '6. Expenses', icon: 'bi-cart4' },
    { id: 'future', label: isFr ? '7. Dettes & Achats' : '7. Debts & Goals', icon: 'bi-cart-dash' },
    { id: 'windfalls', label: isFr ? '8. Entrées de fonds' : '8. Windfalls', icon: 'bi-gift' },
    { id: 'govt', label: isFr ? '9. Prestations' : '9. Govt Benefits', icon: 'bi-bank' },
    { id: 'economic', label: isFr ? '10. Économie' : '10. Economic', icon: 'bi-graph-up-arrow' },
  ], [isFr]);

  const scrollToSection = (id: string) => {
    setActiveJumpSection(id);
    // If the section is currently collapsed, expand it so user sees content
    if (collapsedMap[id]) {
      setCollapsedMap(prev => ({ ...prev, [id]: false }));
    }

    setTimeout(() => {
      const el = document.getElementById(`section-${id}`);
      if (el) {
        // Measure sticky headers dynamically for exact pixel alignment
        const jumpBar = document.querySelector('.sticky-jump-bar-wrapper') as HTMLElement;
        const globalHeader = document.querySelector('[style*="var(--bg-body)"]') as HTMLElement;
        const jumpBarHeight = jumpBar ? jumpBar.offsetHeight : 52;
        const globalHeaderHeight = globalHeader ? globalHeader.offsetHeight : 56;
        const totalOffset = jumpBarHeight + globalHeaderHeight + 24;

        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - totalOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth'
        });

        // Trigger prominent highlight pulse
        el.classList.remove('jump-highlight');
        // Force reflow
        void el.offsetWidth;
        el.classList.add('jump-highlight');
        setTimeout(() => el.classList.remove('jump-highlight'), 2600);
      }
    }, 60);
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
    const p1Name = data.inputs.p1_name || (isFr ? 'Partenaire 1' : 'Player 1');
    const p2Name = data.inputs.p2_name || (isFr ? 'Partenaire 2' : 'Player 2');

    // 1. Personal Information
    const p1Age = data.inputs.p1_age ?? 38;
    const p1Ret = data.inputs.p1_retireAge ?? 60;
    const p2Age = data.inputs.p2_age ?? 34;
    const p2Ret = data.inputs.p2_retireAge ?? 60;
    const personalText = isCouple 
      ? `${p1Name}: ${isFr ? 'Âge' : 'Age'} ${p1Age} (${isFr ? 'Retraite' : 'Retire'} ${p1Ret})  |  ${p2Name}: ${isFr ? 'Âge' : 'Age'} ${p2Age} (${isFr ? 'Retraite' : 'Retire'} ${p2Ret})` 
      : `${p1Name}: ${isFr ? 'Âge' : 'Age'} ${p1Age}  |  ${isFr ? 'Cible de retraite: Âge' : 'Target Retirement: Age'} ${p1Ret}`;

    // 2. Dependents & Family
    const depCount = data.dependents?.length || 0;
    const depText = depCount === 0 
      ? (isFr ? 'Aucune personne à charge' : 'No Dependents') 
      : `${depCount} ${isFr ? (depCount === 1 ? 'enfant enregistré' : 'enfants enregistrés') : (depCount === 1 ? 'Child' : 'Children')} Registered`;

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
      : (isFr ? 'Personnalisé' : 'Custom');
    const portText = `${formatShort(totalPort)} ${isFr ? 'Portefeuille total' : 'Total Portfolio'}  |  ${isFr ? 'Allocation' : 'Allocation'}: ${alloc}`;

    // 4. Real Estate & Living Costs
    const primaryVal = Number(data.inputs.primary_value) || 0;
    const primaryMort = Number(data.inputs.primary_mortgage) || 0;
    const primaryRent = Number(data.inputs.primary_rent) || 0;
    const realestateText = primaryVal > 0 
      ? `${isFr ? 'Maison' : 'Home'}: ${formatShort(primaryVal)}${primaryMort > 0 ? `  |  ${isFr ? 'Hypothèque' : 'Mortgage'}: ${formatShort(primaryMort)}` : (isFr ? '  |  Sans hypothèque' : '  |  Mortgage-Free')}`
      : `${isFr ? 'Résidence' : 'Residence'}: ${formatShort(primaryRent)}${isFr ? '/mois loyer' : '/mo Rent'}`;

    // 5. Income & Taxes
    const prov = data.inputs.province || 'ON';
    const p1Inc = Number(data.inputs.p1_income) || 0;
    const p2Inc = isCouple ? (Number(data.inputs.p2_income) || 0) : 0;
    const taxText = `${prov}  |  ${isFr ? 'Revenu du ménage' : 'Household Income'}: ${formatShort(p1Inc + p2Inc)}${isFr ? '/an' : '/yr'}`;

    // 6. Living Expenses
    let annualSpend = 60000;
    if (results?.timeline && results.timeline[0]?.expenses) {
      annualSpend = Math.round(results.timeline[0].expenses);
    } else if (data.expensePhases && data.expensePhases[0]?.amount) {
      annualSpend = Number(data.expensePhases[0].amount);
    }
    const livingText = `${isFr ? 'Dépenses de vie' : 'Living Expenses'}: ${formatShort(annualSpend / 12)}${isFr ? '/mois' : '/mo'} (${formatShort(annualSpend)}${isFr ? '/an' : '/yr'})`;

    // 7. Future Milestone Expenses
    const futureCount = data.debt?.length || 0;
    const futureText = futureCount === 0 
      ? (isFr ? 'Aucune dépense planifiée' : 'No Milestone Expenses') 
      : `${futureCount} ${isFr ? (futureCount === 1 ? 'dépense planifiée' : 'dépenses planifiées') : (futureCount === 1 ? 'Planned Expense' : 'Planned Expenses')}`;

    // 8. Windfalls
    const windfallCount = data.windfalls?.length || 0;
    const windfallsText = windfallCount === 0 
      ? (isFr ? 'Aucune rentrée de fonds' : 'No Windfalls Scheduled') 
      : `${windfallCount} ${isFr ? (windfallCount === 1 ? 'rentrée prévue' : 'rentrées prévues') : (futureCount === 1 ? 'Future Windfall' : 'Future Windfalls')}`;

    // 9. Government Benefits
    const p1Cpp = data.inputs.p1_cpp_start || 65;
    const p1Oas = data.inputs.p1_oas_start || 65;
    const p2Cpp = data.inputs.p2_cpp_start || 65;
    const p2Oas = data.inputs.p2_oas_start || 65;
    const govtText = isCouple 
      ? `P1: ${isFr ? 'RPC/RRQ' : 'CPP'} @ ${p1Cpp}, ${isFr ? 'SV' : 'OAS'} @ ${p1Oas}  |  P2: ${isFr ? 'RPC/RRQ' : 'CPP'} @ ${p2Cpp}, ${isFr ? 'SV' : 'OAS'} @ ${p2Oas}`
      : `${isFr ? 'Début RPC/RRQ: Âge' : 'CPP Start: Age'} ${p1Cpp}  |  ${isFr ? 'Début SV: Âge' : 'OAS Start: Age'} ${p1Oas}`;

    // 10. Economic Assumptions
    const inf = data.inputs.inflation_rate !== undefined && data.inputs.inflation_rate !== '' ? data.inputs.inflation_rate : 2.1;
    const economicText = `${isFr ? 'Inflation' : 'Inflation'}: ${inf}%  |  ${isFr ? 'Horizon: Âge' : 'Simulation Horizon: Age'} ${data.inputs.p1_lifeExp || 90}`;

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
  }, [data, results, isFr]);

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
            scroll-margin-top: 130px;
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

        /* Sticky Section Jump Pill Bar */
        .sticky-jump-bar-wrapper {
            position: sticky;
            top: 0;
            z-index: 1020;
            background: var(--bg-body, #0b0f17);
            padding: 8px 4px 12px;
            margin-bottom: 12px;
            border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.12));
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .jump-pills-scroll {
            display: flex;
            align-items: center;
            gap: 6px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 2px 2px 4px;
        }
        .jump-pills-scroll::-webkit-scrollbar {
            display: none;
        }
        .jump-pill-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 13px;
            border-radius: 9999px;
            font-size: 0.78rem;
            font-weight: 600;
            white-space: nowrap;
            border: 1px solid var(--border-color, #2c3b52);
            background: var(--bg-input, #101826);
            color: var(--text-muted, #94a3b8);
            cursor: pointer;
            transition: all 0.15s ease-in-out;
            flex-shrink: 0;
            line-height: 1.2;
        }
        .jump-pill-btn:hover {
            color: #ffffff;
            border-color: #38bdf8;
            background: rgba(56, 189, 248, 0.15);
        }
        .jump-pill-btn.active {
            background: #0284c7;
            border-color: #38bdf8;
            color: #ffffff !important;
            box-shadow: 0 0 12px rgba(2, 132, 199, 0.55);
        }

        /* High-contrast highlight glow when jumped to */
        .jump-highlight {
            animation: jumpGlow 2.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .jump-highlight .card-header {
            animation: headerFlash 2.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes jumpGlow {
            0% {
                box-shadow: 0 0 0 4px #00d2ff, 0 0 28px rgba(0, 210, 255, 0.65);
                transform: scale(1.006);
            }
            50% {
                box-shadow: 0 0 0 3px #0284c7, 0 0 16px rgba(2, 132, 199, 0.4);
                transform: scale(1);
            }
            100% {
                box-shadow: 0 0 0 0 transparent, 0 0 0 transparent;
                transform: scale(1);
            }
        }
        @keyframes headerFlash {
            0% {
                background-color: rgba(2, 132, 199, 0.35) !important;
            }
            100% {
                background-color: transparent;
            }
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

      {/* --- STICKY SECTION JUMP BAR --- */}
      <div className="sticky-jump-bar-wrapper">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <div className="jump-pills-scroll flex-grow-1">
            {jumpSections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`jump-pill-btn ${activeJumpSection === sec.id ? 'active' : ''}`}
                onClick={() => scrollToSection(sec.id)}
              >
                <i className={`bi ${sec.icon}`} style={{ fontSize: '0.8rem' }}></i>
                <span>{sec.label}</span>
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-1.5 flex-shrink-0 ms-1 border-start border-secondary ps-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 fw-bold bg-input shadow-sm"
              onClick={expandAll}
              style={{ fontSize: '0.74rem' }}
              title={isFr ? "Tout déplier" : "Expand All"}
            >
              <i className="bi bi-arrows-expand"></i>
              <span className="d-none d-lg-inline ms-1">{t('actions.expandAll', 'Expand All')}</span>
            </button>
            <button 
              type="button" 
              className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 fw-bold bg-input shadow-sm"
              onClick={collapseAll}
              style={{ fontSize: '0.74rem' }}
              title={isFr ? "Tout replier" : "Collapse All"}
            >
              <i className="bi bi-arrows-collapse"></i>
              <span className="d-none d-lg-inline ms-1">{t('actions.collapseAll', 'Collapse All')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- FORM WITH THE 10 CARDS --- */}
      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        
        {/* 1. Personal Information */}
        <div id="section-personal" className={`plan-card-wrapper ${collapsedMap['personal'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-dependents" className={`plan-card-wrapper ${collapsedMap['dependents'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-portfolio" className={`plan-card-wrapper ${collapsedMap['portfolio'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-realestate" className={`plan-card-wrapper ${collapsedMap['realestate'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-tax" className={`plan-card-wrapper ${collapsedMap['tax'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-living" className={`plan-card-wrapper ${collapsedMap['living'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-future" className={`plan-card-wrapper ${collapsedMap['future'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-windfalls" className={`plan-card-wrapper ${collapsedMap['windfalls'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-govt" className={`plan-card-wrapper ${collapsedMap['govt'] ? 'is-collapsed' : ''}`}>
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
        <div id="section-economic" className={`plan-card-wrapper ${collapsedMap['economic'] ? 'is-collapsed' : ''}`}>
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

      {/* --- CENTERED FLOATING READINESS ISLAND --- */}
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
                  {liveStats.isFullyFunded 
                    ? (isFr ? `Entièrement financé (jusqu'à l'âge ${liveStats.lifeExp})` : `Fully Funded (to Age ${liveStats.lifeExp})`) 
                    : (isFr ? `Épuisé à l'âge ${liveStats.failureAge}` : `Depletes at Age ${liveStats.failureAge}`)}
                </span>
                {liveStats.useRealDollars && (
                  <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 d-none d-sm-inline-block" style={{ fontSize: '0.62rem' }}>
                    {isFr ? "Dollars d'ajourd'hui" : "Today's $"}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Key Financial Metrics */}
            <div className="d-flex align-items-center gap-2 gap-sm-3 flex-shrink-0">
              <div className="border-start border-secondary opacity-50" style={{ height: '18px' }}></div>
              <div className="d-flex align-items-baseline gap-1">
                <span className="text-muted fw-bold" style={{ fontSize: '0.68rem' }}>{isFr ? 'LIQ. RETRAITE' : 'LIQ @'} {liveStats.retAge}:</span>
                <span className="fw-bold text-main" style={{ fontSize: '0.85rem' }}>{formatShort(liveStats.liquidAtRet)}</span>
              </div>

              <div className="border-start border-secondary opacity-50" style={{ height: '18px' }}></div>
              <div className="d-flex align-items-baseline gap-1">
                <span className="text-muted fw-bold" style={{ fontSize: '0.68rem' }}>{isFr ? 'SUCCESSION' : 'ESTATE'}:</span>
                <span className="fw-bold text-success" style={{ fontSize: '0.85rem' }}>{formatShort(liveStats.finalEstate)}</span>
              </div>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}