'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// --- DYNAMIC IMPORTS (LAZY LOADING) ---
const MedicalExpenseOptimizer = dynamic(() => import('./optimizers/MedicalExpenseOptimizer'), { ssr: false });
const SideHustleROI = dynamic(() => import('./optimizers/SideHustleROI'), { ssr: false });
const DieWithZero = dynamic(() => import('./optimizers/DieWithZero'), { ssr: false });
const ConsumptionSmoother = dynamic(() => import('./optimizers/ConsumptionSmoother'), { ssr: false });
const CPPGridSearch = dynamic(() => import('./optimizers/CPPGridSearch'), { ssr: false });
const PensionBuyback = dynamic(() => import('./optimizers/PensionBuyback'), { ssr: false });
const RRSPSweetSpot = dynamic(() => import('./optimizers/RRSPSweetSpot'), { ssr: false });
const RRSPGrossUp = dynamic(() => import('./optimizers/RRSPGrossUp'), { ssr: false });
const TFSAvsRRSP = dynamic(() => import('./optimizers/TFSAvsRRSP'), { ssr: false });
const TFSARoomCalculator = dynamic(() => import('./optimizers/TFSARoomCalculator'), { ssr: false });
const CCBMaximizer = dynamic(() => import('./optimizers/CCBMaximizer'), { ssr: false });
const RESPMaximizer = dynamic(() => import('./optimizers/RESPMaximizer'), { ssr: false });
const FHSAvsRRSP = dynamic(() => import('./optimizers/FHSAvsRRSP'), { ssr: false });
const MortgageVsInvest = dynamic(() => import('./optimizers/MortgageVsInvest'), { ssr: false });
const HomeMoveUp = dynamic(() => import('./optimizers/HomeMoveUp'), { ssr: false });
const MortgageRenewal = dynamic(() => import('./optimizers/MortgageRenewal'), { ssr: false });
const PensionCV = dynamic(() => import('./optimizers/PensionCV'), { ssr: false });
const SmithManeuver = dynamic(() => import('./optimizers/SmithManeuver'), { ssr: false });
const EmergencyFund = dynamic(() => import('./optimizers/EmergencyFund'), { ssr: false });
const CarLease = dynamic(() => import('./optimizers/CarLease'), { ssr: false });
const MortgageAffordability = dynamic(() => import('./optimizers/MortgageAffordability'), { ssr: false });
const CPPImporter = dynamic(() => import('./optimizers/CPPImporter'), { ssr: false });
const BuyVsRentAnalyzer = dynamic(() => import('./optimizers/BuyVsRentAnalyzer'), { ssr: false });
const ReverseMortgage = dynamic(() => import('./optimizers/ReverseMortgage'), { ssr: false });
const LIFtoRRIFOptimizer = dynamic(() => import('./optimizers/LIFtoRRIFOptimizer'), { ssr: false });
const GISMaximizer = dynamic(() => import('./optimizers/GISMaximizer'), { ssr: false });
const EstateTaxCalculator = dynamic(() => import('./optimizers/EstateTaxCalculator'), { ssr: false });
const MarginalTaxCurve = dynamic(() => import('./optimizers/MarginalTaxCurve'), { ssr: false });

// --- SEARCH & FILTER METADATA MAP ---
const TOOL_METADATA: Record<string, { title: string; category: string; keywords: string[] }> = {
  'dwz': { title: 'Die With Zero', category: 'Master Simulations', keywords: ['die with zero', 'maximum spend', 'lifestyle', 'budget', 'spending'] },
  'smoother': { title: 'Consumption Smoothing', category: 'Master Simulations', keywords: ['consumption smoothing', 'maxifi', 'living standard', 'discretionary spending', 'lifestyle'] },
  'cpp': { title: 'CPP Grid Search', category: 'Master Simulations', keywords: ['cpp', 'oas', 'pension', 'grid search', 'retirement age', 'start age', 'government benefits'] },
  'pensioncv': { title: 'Pension Commuted Value', category: 'Master Simulations', keywords: ['pension', 'commuted value', 'db pension', 'lump sum', 'defined benefit', 'cv'] },
  'pensionbb': { title: 'Pension Buyback', category: 'Master Simulations', keywords: ['pension buyback', 'service buyback', 'past service', 'omers', 'hoopp', 'otpp'] },
  'tax-curve': { title: 'Marginal Tax Rate & Clawback Curve', category: 'Tax & Registered', keywords: ['marginal tax', 'clawback', 'oas recovery tax', 'ontario surtax', 'tax cliff', 'brackets', 'effective tax rate', 'meltdown', 'emtr'] },
  'sweetspot': { title: 'RRSP Sweet Spot', category: 'Tax & Registered', keywords: ['rrsp sweet spot', 'tax bracket', 'marginal tax', 'deduction', 'refund'] },
  'grossup': { title: 'RRSP Gross-Up Maximizer', category: 'Tax & Registered', keywords: ['rrsp gross up', 'catch up loan', 'refund loan', 'tax refund', 'leverage'] },
  'tfsavsrrsp': { title: 'TFSA vs RRSP', category: 'Tax & Registered', keywords: ['tfsa vs rrsp', 'registered', 'tax free', 'marginal rate', 'comparison'] },
  'tfsa-room': { title: 'TFSA Room Calculator', category: 'Tax & Registered', keywords: ['tfsa room', 'contribution room', 'cra limit', 'unused room'] },
  'lif-unlock': { title: 'LIF to RRIF Flexibility Optimizer', category: 'Tax & Registered', keywords: ['lif', 'rrif', 'lira', 'locked in', 'unlocking', 'transfer', 'ita 60l', 'line 23200'] },
  'gis-maximizer': { title: 'GIS & Low-Income Maximizer', category: 'Tax & Registered', keywords: ['gis', 'guaranteed income supplement', 'clawback', 'oas', 'low income', 'rrsp meltdown', 'tfsa'] },
  'estate-tax': { title: 'Canadian Estate & Final Tax Calculator', category: 'Tax & Registered', keywords: ['estate tax', 'terminal tax', 'deemed disposition', 'probate', 'inheritance', 'death', 'cottage', 'spousal rollover'] },
  'ccb': { title: 'CCB Maximizer', category: 'Tax & Registered', keywords: ['ccb', 'canada child benefit', 'children', 'afni', 'tax free family'] },
  'fhsa': { title: 'FHSA vs RRSP', category: 'Tax & Registered', keywords: ['fhsa', 'first home savings account', 'home buyers plan', 'first time buyer'] },
  'resp': { title: 'RESP Grant Maximizer', category: 'Tax & Registered', keywords: ['resp', 'cesg', 'education', 'grant', 'catch up', 'college', 'university'] },
  'medical': { title: 'Medical Expense Optimizer', category: 'Tax & Registered', keywords: ['medical', 'health', 'metc', 'deduction', 'tax credit', 'expenses'] },
  'sidehustle': { title: 'Side Hustle ROI', category: 'Business & Income', keywords: ['side hustle', 'business', 'sole proprietorship', 'self employed', 'tax drag', 'income'] },
  'buyvsrent': { title: 'Buy vs Rent Analyzer', category: 'Debt, Real Estate & Cash', keywords: ['buy vs rent', 'housing', 'mortgage', 'renting', 'home ownership', 'real estate'] },
  'mvi': { title: 'Mortgage vs Invest', category: 'Debt, Real Estate & Cash', keywords: ['mortgage vs invest', 'debt paydown', 'lump sum', 'guaranteed return'] },
  'smith': { title: 'Smith Maneuver', category: 'Debt, Real Estate & Cash', keywords: ['smith maneuver', 'tax deductible mortgage', 'heloc', 're-advanceable', 'investing'] },
  'emerg': { title: 'Emergency Fund', category: 'Debt, Real Estate & Cash', keywords: ['emergency fund', 'cash cushion', 'liquid cash', 'savings buffer', 'months'] },
  'car': { title: 'Car Lease vs Buy', category: 'Debt, Real Estate & Cash', keywords: ['car lease', 'financing', 'vehicle', 'auto loan', 'depreciation'] },
  'afford': { title: 'Mortgage Affordability', category: 'Debt, Real Estate & Cash', keywords: ['mortgage affordability', 'gds', 'tds', 'stress test', 'borrowing capacity'] },
  'moveup': { title: 'Home Move-Up', category: 'Debt, Real Estate & Cash', keywords: ['home move up', 'upsizing', 'larger home', 'real estate upgrade'] },
  'renewal': { title: 'Mortgage Renewal', category: 'Debt, Real Estate & Cash', keywords: ['mortgage renewal', 'fixed vs variable', 'term renewal', 'interest rate'] },
  'reversemortgage': { title: 'Reverse Mortgage', category: 'Debt, Real Estate & Cash', keywords: ['reverse mortgage', 'chip', 'home equity', 'equity release', 'seniors'] },
  'cppimport': { title: 'CPP Statement Importer', category: 'Data Importers', keywords: ['cpp import', 'service canada', 'statement of contributions', 'soc', 'data importer'] }
};

const ALL_TOOL_KEYS = Object.keys(TOOL_METADATA);

export default function OptimizersTab() {
  const [activeCategory, setActiveCategory] = useState<string>('All Tools');
  const [expandedTool, setExpandedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const toolCategories = [
    { title: "All Tools", keys: ALL_TOOL_KEYS },
    { title: "Master Simulations", keys: ['dwz', 'smoother', 'cpp', 'pensioncv', 'pensionbb'] },
    { title: "Tax & Registered", keys: ['tax-curve', 'sweetspot', 'grossup', 'tfsavsrrsp', 'tfsa-room', 'lif-unlock', 'gis-maximizer', 'estate-tax', 'ccb', 'fhsa', 'resp', 'medical'] },
    { title: "Business & Income", keys: ['sidehustle'] },
    { title: "Debt, Real Estate & Cash", keys: ['buyvsrent', 'mvi', 'smith', 'emerg', 'car', 'afford', 'moveup', 'renewal', 'reversemortgage'] },
    { title: "Data Importers", keys: ['cppimport'] }
  ];

  // Dynamic search & category filtering
  const visibleToolKeys = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    if (q) {
      return ALL_TOOL_KEYS.filter((id) => {
        const meta = TOOL_METADATA[id];
        if (!meta) return false;
        return (
          meta.title.toLowerCase().includes(q) ||
          meta.category.toLowerCase().includes(q) ||
          meta.keywords.some((k) => k.toLowerCase().includes(q))
        );
      });
    }

    const currentCat = toolCategories.find((c) => c.title === activeCategory);
    return currentCat ? currentCat.keys : ALL_TOOL_KEYS;
  }, [searchQuery, activeCategory]);

  const renderToolCard = (id: string) => {
    let ContentComponent = null;
    const isExpanded = expandedTool === id;

    switch (id) {
      case 'tax-curve': ContentComponent = <MarginalTaxCurve />; break;
      case 'buyvsrent': ContentComponent = <BuyVsRentAnalyzer isExpanded={isExpanded} onToggle={() => setExpandedTool(isExpanded ? null : id)} />; break;
      case 'medical': ContentComponent = <MedicalExpenseOptimizer />; break;
      case 'sidehustle': ContentComponent = <SideHustleROI />; break;
      case 'dwz': ContentComponent = <DieWithZero />; break;
      case 'smoother': ContentComponent = <ConsumptionSmoother />; break;
      case 'cpp': ContentComponent = <CPPGridSearch />; break;
      case 'pensionbb': ContentComponent = <PensionBuyback />; break;
      case 'sweetspot': ContentComponent = <RRSPSweetSpot />; break;
      case 'grossup': ContentComponent = <RRSPGrossUp />; break;
      case 'tfsavsrrsp': ContentComponent = <TFSAvsRRSP />; break;
      case 'tfsa-room': ContentComponent = <TFSARoomCalculator />; break;
      case 'lif-unlock': ContentComponent = <LIFtoRRIFOptimizer />; break;
      case 'gis-maximizer': ContentComponent = <GISMaximizer />; break;
      case 'estate-tax': ContentComponent = <EstateTaxCalculator />; break;
      case 'ccb': ContentComponent = <CCBMaximizer />; break;
      case 'resp': ContentComponent = <RESPMaximizer />; break;
      case 'fhsa': ContentComponent = <FHSAvsRRSP />; break;
      case 'mvi': ContentComponent = <MortgageVsInvest />; break;
      case 'moveup': ContentComponent = <HomeMoveUp />; break;
      case 'renewal': ContentComponent = <MortgageRenewal />; break;
      case 'pensioncv': ContentComponent = <PensionCV />; break;
      case 'smith': ContentComponent = <SmithManeuver />; break;
      case 'emerg': ContentComponent = <EmergencyFund />; break;
      case 'car': ContentComponent = <CarLease />; break;
      case 'afford': ContentComponent = <MortgageAffordability />; break;
      case 'cppimport': ContentComponent = <CPPImporter />; break;
      case 'reversemortgage': ContentComponent = <ReverseMortgage />; break;
      default: return null;
    }

    return (
      <div key={id} className={`transition-all ${isExpanded ? "col-12 mb-3" : "col-12 col-md-6 col-xl-4"}`}>
        {ContentComponent}
      </div>
    );
  };

  return (
    <div className="p-3 p-md-4 h-100 d-flex flex-column">

      {/* --- TOP HEADER & SEARCH BAR --- */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary">
        <div>
          <h5 className="fw-bold text-uppercase ls-1 text-primary mb-1 d-flex align-items-center">
            <i className="bi bi-magic me-3"></i> Smart Optimizers
          </h5>
          <span className="text-muted small">
            28 specialized Canadian financial, tax, and debt calculators
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="position-relative" style={{ minWidth: '280px', maxWidth: '420px', width: '100%' }}>
          <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ pointerEvents: 'none' }}></i>
          <input
            type="text"
            className="form-control bg-input border-secondary rounded-pill ps-5 pe-5 py-2 shadow-sm text-main"
            style={{ fontSize: '0.85rem' }}
            placeholder="Search tools (e.g. LIF, RRSP, mortgage, tax, GIS, clawback)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setExpandedTool(null);
            }}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-2 text-muted p-0 text-decoration-none"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <i className="bi bi-x-circle-fill"></i>
            </button>
          )}
        </div>
      </div>

      {/* --- CATEGORY PILLS (Hidden while actively searching to focus results) --- */}
      {!searchQuery && (
        <div className="d-flex flex-wrap justify-content-center gap-2 gap-md-3 mb-4 pb-2">
          {toolCategories.map((cat) => (
            <button
              key={cat.title}
              onClick={() => {
                setActiveCategory(cat.title);
                setExpandedTool(null);
              }}
              className={`btn rounded-pill fw-bold px-3 px-md-4 py-2 transition-all border-0 shadow-sm ${
                activeCategory === cat.title
                  ? 'bg-primary text-white'
                  : 'bg-input text-muted border border-secondary hover-opacity-100'
              }`}
              style={{ fontSize: '0.82rem' }}
            >
              {cat.title}
              <span className="badge bg-secondary bg-opacity-25 ms-2" style={{ fontSize: '0.7rem' }}>
                {cat.keys.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* --- SEARCH ACTIVE FEEDBACK --- */}
      {searchQuery && (
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <span className="small text-muted">
            Found <strong className="text-main">{visibleToolKeys.length}</strong> {visibleToolKeys.length === 1 ? 'tool' : 'tools'} matching &ldquo;<span className="text-primary">{searchQuery}</span>&rdquo;
          </span>
          <button
            type="button"
            className="btn btn-sm btn-link text-primary text-decoration-none p-0 fw-bold small"
            onClick={() => setSearchQuery('')}
          >
            Clear Search
          </button>
        </div>
      )}

      {/* --- CARDS GRID --- */}
      {visibleToolKeys.length > 0 ? (
        <div className="row g-4 mb-5">
          {visibleToolKeys.map((toolId) => renderToolCard(toolId))}
        </div>
      ) : (
        /* Empty Search State */
        <div className="text-center py-5 my-4">
          <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
            <i className="bi bi-search text-muted fs-3"></i>
          </div>
          <h6 className="fw-bold text-main mb-1">No Calculators Found</h6>
          <p className="text-muted small mb-3">
            No tools matched &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;tax&rdquo;, &ldquo;mortgage&rdquo;, &ldquo;rrsp&rdquo;, &ldquo;cpp&rdquo;, or &ldquo;pension&rdquo;.
          </p>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold"
            onClick={() => setSearchQuery('')}
          >
            View All Tools
          </button>
        </div>
      )}

    </div>
  );
}