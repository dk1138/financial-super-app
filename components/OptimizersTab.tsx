import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// --- DYNAMIC IMPORTS (LAZY LOADING) ---
// These components (and their heavy math) won't be downloaded by the browser 
// until the user actually selects their category!
const MedicalExpenseOptimizer = dynamic(() => import('./optimizers/MedicalExpenseOptimizer'), { ssr: false });
const SideHustleROI = dynamic(() => import('./optimizers/SideHustleROI'), { ssr: false });
const DieWithZero = dynamic(() => import('./optimizers/DieWithZero'), { ssr: false });
const CPPGridSearch = dynamic(() => import('./optimizers/CPPGridSearch'), { ssr: false });
const PensionBuyback = dynamic(() => import('./optimizers/PensionBuyback'), { ssr: false });
const RRSPSweetSpot = dynamic(() => import('./optimizers/RRSPSweetSpot'), { ssr: false });
const RRSPGrossUp = dynamic(() => import('./optimizers/RRSPGrossUp'), { ssr: false });
const TFSAvsRRSP = dynamic(() => import('./optimizers/TFSAvsRRSP'), { ssr: false });
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

// New Import!
const BuyVsRentAnalyzer = dynamic(() => import('./optimizers/BuyVsRentAnalyzer'), { ssr: false });

export default function OptimizersTab() {
  const [activeCategory, setActiveCategory] = useState('Debt, Real Estate & Cash'); // Defaulted here so you can see it instantly
  
  const toolCategories = [
    { title: "Master Simulations", keys: ['dwz', 'cpp', 'pensioncv', 'pensionbb'] },
    { title: "Tax & Registered", keys: ['sweetspot', 'grossup', 'tfsavsrrsp', 'ccb', 'fhsa', 'resp', 'medical'] },
    { title: "Business & Income", keys: ['sidehustle'] },
    { title: "Debt, Real Estate & Cash", keys: ['buyvsrent', 'mvi', 'smith', 'emerg', 'car', 'afford', 'moveup', 'renewal'] },
    { title: "Data Importers", keys: ['cppimport'] }
  ];

  const renderToolCard = (id: string) => {
      let ContentComponent = null;
      let isFullWidth = false; // Flag to let complex UI tools span the full row

      switch (id) {
          case 'buyvsrent': ContentComponent = <BuyVsRentAnalyzer />; isFullWidth = false; break;
          case 'medical': ContentComponent = <MedicalExpenseOptimizer />; break;
          case 'sidehustle': ContentComponent = <SideHustleROI />; break;
          case 'dwz': ContentComponent = <DieWithZero />; break;
          case 'cpp': ContentComponent = <CPPGridSearch />; break;
          case 'pensionbb': ContentComponent = <PensionBuyback />; break;
          case 'sweetspot': ContentComponent = <RRSPSweetSpot />; break;
          case 'grossup': ContentComponent = <RRSPGrossUp />; break;
          case 'tfsavsrrsp': ContentComponent = <TFSAvsRRSP />; break;
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
          default: return null;
      }

      return (
          <div key={id} className={isFullWidth ? "col-12 mb-3" : "col-12 col-md-6 col-xl-4"}>
              {ContentComponent}
          </div>
      );
  };

  return (
    <div className="p-3 p-md-4 h-100 d-flex flex-column">

      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-primary mb-0 d-flex align-items-center">
              <i className="bi bi-magic me-3"></i> Smart Optimizers
          </h5>
      </div>

      <div className="d-flex flex-wrap justify-content-center gap-2 gap-md-3 mb-4 pb-2">
          {toolCategories.map(cat => (
              <button 
                  key={cat.title}
                  onClick={() => setActiveCategory(cat.title)}
                  className={`btn rounded-pill fw-bold px-3 px-md-4 py-2 transition-all border-0 shadow-sm ${activeCategory === cat.title ? 'bg-primary text-white' : 'bg-input text-muted border border-secondary hover-opacity-100'}`}
              >
                  {cat.title}
              </button>
          ))}
      </div>

      {/* When the activeCategory changes, Next.js dynamically fetches only the rendered cards! */}
      <div className="row g-4 mb-5">
          {toolCategories.find(c => c.title === activeCategory)?.keys.map(toolId => renderToolCard(toolId))}
      </div>

    </div>
  );
}