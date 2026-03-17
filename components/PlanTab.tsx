import React from 'react';
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

export default function PlanTab() {
  return (
    <div className="p-3 p-md-4">
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

      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        <PersonalInformationCard />
        <DependentsCard />
        <PortfolioAssetsCard />
        <LivingCostCard />
        <IncomeTaxCard />
        <LivingExpensesCard />
        <FutureExpensesCard />
        <WindfallsCard />
        <GovtBenefitsCard />
        <EconomicAssumptionsCard />
      </form>
      
    </div>
  );
}