import React from 'react';
import { useTranslation } from '../lib/LanguageContext';
import MonteCarloCard from './risk/MonteCarloCard';
import SorrCard from './risk/SorrCard';
import SurvivorStressCard from './risk/SurvivorStressCard';
import MacroShocksCard from './risk/MacroShocksCard';

export default function RiskTab() {
  const { t } = useTranslation();
  return (
    <div className="p-3 p-md-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-danger mb-0 d-flex align-items-center">
              <i className="bi bi-shield-fill-exclamation me-3"></i> {t('tabHeaders.stressTestingRisk', 'Stress Testing & Risk')}
          </h5>
      </div>

      <MonteCarloCard />
      <SorrCard />

      <h5 className="text-muted small text-uppercase fw-bold ls-1 mt-4 mb-3 pb-2 border-bottom border-secondary d-flex align-items-center">
        <i className="bi bi-heart-pulse-fill me-2 text-danger"></i>
        {t('riskTab.lifeMacroShocks', 'Life & Macro Shocks')}
      </h5>
      <div className="row g-4">
        <SurvivorStressCard />
        <MacroShocksCard />
      </div>
      
    </div>
  );
}