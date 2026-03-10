import React from 'react';
import MonteCarloCard from './risk/MonteCarloCard';
import SorrCard from './risk/SorrCard';
import MacroShocksCard from './risk/MacroShocksCard';

export default function RiskTab() {
  return (
    <div className="p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-danger mb-0 d-flex align-items-center">
              <i className="bi bi-shield-fill-exclamation me-3"></i> Stress Testing & Risk
          </h5>
      </div>

      <MonteCarloCard />
      <SorrCard />
      <MacroShocksCard />
      
    </div>
  );
}