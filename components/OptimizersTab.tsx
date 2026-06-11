'use client';

import React, { useState } from 'react';
import { useFinance } from '../lib/FinanceContext';
import CCBMaximizer from './optimizers/CCBMaximizer';
import RESPMaximizer from './optimizers/RESPMaximizer';
import TFSAvsRRSP from './optimizers/TFSAvsRRSP';
import FHSAvsRRSP from './optimizers/FHSAvsRRSP';
import RRSPSweetSpot from './optimizers/RRSPSweetSpot';
import RRSPGrossUp from './optimizers/RRSPGrossUp';
import CPPGridSearch from './optimizers/CPPGridSearch';
import MortgageVsInvest from './optimizers/MortgageVsInvest';
import CarLease from './optimizers/CarLease';
import HomeMoveUp from './optimizers/HomeMoveUp';
import SideHustleROI from './optimizers/SideHustleROI';
import EmergencyFund from './optimizers/EmergencyFund';

const OPTIMIZER_TOOLS = [
  { id: 'tfsa-rrsp', label: 'TFSA vs RRSP', icon: 'bi-balance-scale', desc: 'Find your optimal account strategy' },
  { id: 'fhsa-rrsp', label: 'FHSA vs RRSP', icon: 'bi-house-heart', desc: 'First-home saving optimization' },
  { id: 'rrsp-sweet', label: 'RRSP Sweet Spot', icon: 'bi-calculator', desc: 'Optimize tax bracket deductions' },
  { id: 'rrsp-gross', label: 'RRSP Gross-Up', icon: 'bi-arrow-up-right-circle', desc: 'Maximize refunds using leverage' },
  { id: 'cpp-search', label: 'CPP/OAS Age Search', icon: 'bi-search', desc: 'Find optimal government benefit ages' },
  { id: 'ccb-max', label: 'CCB Maximizer', icon: 'bi-emoji-smile', desc: 'Maximize Canada Child Benefit payouts' },
  { id: 'resp-max', label: 'RESP Maximizer', icon: 'bi-mortarboard', desc: 'Optimize education savings grants' },
  { id: 'mortgage-invest', label: 'Mortgage vs Invest', icon: 'bi-bank', desc: 'Pay down debt or invest surplus' },
  { id: 'car-lease', label: 'Car Lease vs Buy', icon: 'bi-car-front', desc: 'Analyze auto financing options' },
  { id: 'home-moveup', label: 'Home Move-Up', icon: 'bi-house-up', desc: 'Analyze real estate upsizes' },
  { id: 'side-hustle', label: 'Side Hustle ROI', icon: 'bi-lightning', desc: 'Evaluate side business cash returns' },
  { id: 'emergency-fund', label: 'Emergency Fund', icon: 'bi-shield-check', desc: 'Calculate dynamic safety buffers' }
];

export default function OptimizersTab() {
  const { data } = useFinance();
  const [activeTool, setActiveTool] = useState('tfsa-rrsp');

  // Resolve dynamic custom player names
  const p1Name = data.inputs.p1_name || 'Player 1';
  const p2Name = data.inputs.p2_name || 'Player 2';
  const isCouple = data.mode === 'Couple';

  const renderActiveTool = () => {
    switch (activeTool) {
      case 'tfsa-rrsp': return <TFSAvsRRSP />;
      case 'fhsa-rrsp': return <FHSAvsRRSP />;
      case 'rrsp-sweet': return <RRSPSweetSpot />;
      case 'rrsp-gross': return <RRSPGrossUp />;
      case 'cpp-search': return <CPPGridSearch />;
      case 'ccb-max': return <CCBMaximizer />;
      case 'resp-max': return <RESPMaximizer />;
      case 'mortgage-invest': return <MortgageVsInvest />;
      case 'car-lease': return <CarLease />;
      case 'home-moveup': return <HomeMoveUp />;
      case 'side-hustle': return <SideHustleROI />;
      case 'emergency-fund': return <EmergencyFund />;
      default: return <TFSAvsRRSP />;
    }
  };

  return (
    <div className="p-3 p-md-4">
      <div className="row g-4">
        
        {/* Left Side Navigation Menu */}
        <div className="col-12 col-xl-4 col-xxl-3">
          <div className="rp-card border border-secondary rounded-4 p-3 surface-card h-100 shadow-sm">
            <h6 className="fw-bold text-muted text-uppercase ls-1 mb-3 px-2" style={{ fontSize: '0.7rem' }}>
              Optimization Suite ({p1Name}{isCouple ? ` & ${p2Name}` : ''})
            </h6>
            <div className="d-flex flex-column gap-2 custom-scrollbar overflow-auto" style={{ maxHeight: '70vh' }}>
              {OPTIMIZER_TOOLS.map(t => {
                // Hide family/child specific optimization menus if no dependents exist
                if ((t.id === 'ccb-max' || t.id === 'resp-max') && (!data.dependents || data.dependents.length === 0)) return null;
                
                const isActive = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`btn text-start p-3 rounded-3 border transition-all d-flex align-items-center gap-3 shadow-none ${isActive ? 'bg-primary border-primary text-white shadow-sm' : 'bg-input border-secondary hover-bg-secondary hover-bg-opacity-10 text-main'}`}
                    onClick={() => setActiveTool(t.id)}
                  >
                    <div className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${isActive ? 'bg-white bg-opacity-25 text-white' : 'bg-secondary bg-opacity-25 text-muted'}`} style={{ width: '36px', height: '36px' }}>
                      <i className={`bi ${t.icon} fs-5`}></i>
                    </div>
                    <div>
                      <div className="fw-bold small">{t.label}</div>
                      <div className={`fw-medium style-none-uppercase ${isActive ? 'text-white text-opacity-75' : 'text-muted'}`} style={{ fontSize: '0.65rem' }}>{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side Work Area Panel */}
        <div className="col-12 col-xl-8 col-xxl-9">
          <div className="h-100">
            {renderActiveTool()}
          </div>
        </div>

      </div>
    </div>
  );
}