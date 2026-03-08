import React, { useState } from 'react';

// Import all micro-calculators
import MedicalExpenseOptimizer from './optimizers/MedicalExpenseOptimizer';
import SideHustleROI from './optimizers/SideHustleROI';
import DieWithZero from './optimizers/DieWithZero';
import CPPGridSearch from './optimizers/CPPGridSearch';
import PensionBuyback from './optimizers/PensionBuyback';
import RRSPSweetSpot from './optimizers/RRSPSweetSpot';
import RRSPGrossUp from './optimizers/RRSPGrossUp';
import TFSAvsRRSP from './optimizers/TFSAvsRRSP';
import CCBMaximizer from './optimizers/CCBMaximizer';
import RESPMaximizer from './optimizers/RESPMaximizer';
import FHSAvsRRSP from './optimizers/FHSAvsRRSP';
import MortgageVsInvest from './optimizers/MortgageVsInvest';
import HomeMoveUp from './optimizers/HomeMoveUp';
import MortgageRenewal from './optimizers/MortgageRenewal';
import PensionCV from './optimizers/PensionCV';
import SmithManeuver from './optimizers/SmithManeuver';
import EmergencyFund from './optimizers/EmergencyFund';
import CarLease from './optimizers/CarLease';
import MortgageAffordability from './optimizers/MortgageAffordability';
import CPPImporter from './optimizers/CPPImporter';

export default function OptimizersTab() {
  const [activeCategory, setActiveCategory] = useState('Master Simulations'); 
  
  const toolCategories = [
    { title: "Master Simulations", keys: ['dwz', 'cpp', 'pensioncv', 'pensionbb'] },
    { title: "Tax & Registered", keys: ['sweetspot', 'grossup', 'tfsavsrrsp', 'ccb', 'fhsa', 'resp', 'medical'] },
    { title: "Business & Income", keys: ['sidehustle'] },
    { title: "Debt, Real Estate & Cash", keys: ['mvi', 'smith', 'emerg', 'car', 'afford', 'moveup', 'renewal'] },
    { title: "Data Importers", keys: ['cppimport'] }
  ];

  const renderToolCard = (id: string) => {
      let ContentComponent = null;
      switch (id) {
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
          <div key={id} className="col-12 col-md-6 col-xl-4">
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

      <div className="row g-4 mb-5">
          {toolCategories.find(c => c.title === activeCategory)?.keys.map(toolId => renderToolCard(toolId))}
      </div>

    </div>
  );
}