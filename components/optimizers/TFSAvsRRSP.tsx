'use client';

import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput, SegmentedControl } from '../SharedUI';

export default function TFSAvsRRSP() {
  const { data } = useFinance();
  const isCouple = data.mode === 'Couple';

  // Resolve dynamic custom player names
  const p1Name = data.inputs.p1_name || 'Player 1';
  const p2Name = data.inputs.p2_name || 'Player 2';

  const [activeTarget, setActiveTarget] = useState<'p1' | 'p2'>('p1');
  const [testIncome, setTestIncome] = useState<number | ''>('');
  const [retirementIncome, setRetirementIncome] = useState<number | ''>('');
  const [contributionAmt, setContributionAmt] = useState<number>(5000);

  // Fallback default context initializations based on who is selected
  const activeName = activeTarget === 'p1' ? p1Name : p2Name;
  const currentSalary = Number(data.inputs[`${activeTarget}_income`]) || 75000;
  const projectedRetireSalary = Math.round((Number(data.inputs[`${activeTarget}_income`]) || 75000) * 0.6);

  const displayIncome = testIncome === '' ? currentSalary : testIncome;
  const displayRetireIncome = retirementIncome === '' ? projectedRetireSalary : retirementIncome;

  // Simple progressive marginal tax approximation bounds for calculation context
  const getMarginalRate = (inc: number) => {
      if (inc <= 55000) return 0.2005;
      if (inc <= 111000) return 0.2965;
      if (inc <= 173000) return 0.4341;
      if (inc <= 246000) return 0.4819;
      return 0.5353;
  };

  const currentMarginal = getMarginalRate(displayIncome);
  const retirementMarginal = getMarginalRate(displayRetireIncome);

  const rrspTaxSavings = contributionAmt * currentMarginal;
  const netRrspCost = contributionAmt - rrspTaxSavings;
  
  // Future valuation math over 25 years assuming a standard 6% growth rate
  const years = 25;
  const growthRate = 0.06;
  const futureMultiplier = Math.pow(1 + growthRate, years);

  // TFSA puts in net dollars, grows tax free
  const tfsaFutureValue = contributionAmt * futureMultiplier;

  // RRSP grows the gross amount, but withdrawals are hit by the retirement marginal rate
  const rrspFutureValueGross = contributionAmt * futureMultiplier;
  const rrspFutureValueNet = rrspFutureValueGross * (1 - retirementMarginal);

  const rrspIsBetter = rrspFutureValueNet > tfsaFutureValue;

  return (
    <div className="rp-card border border-secondary rounded-4 p-4 surface-card shadow-sm">
      <div className="border-bottom border-secondary pb-3 mb-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h5 className="fw-bold text-uppercase ls-1 mb-1 text-main">
            <i className="bi bi-balance-scale text-primary me-2"></i> TFSA vs RRSP Arbitrage
          </h5>
          <span className="small text-muted">Compare tax arbitrage advantages based on current vs future career brackets.</span>
        </div>

        {isCouple && (
          <SegmentedControl 
            value={activeTarget} 
            onChange={(val: any) => { setActiveTarget(val); setTestIncome(''); setRetirementIncome(''); }} 
            options={[
              { value: 'p1', label: p1Name },
              { value: 'p2', label: p2Name }
            ]} 
          />
        )}
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-6 border-end border-secondary border-opacity-25 pe-md-4">
          <h6 className="fw-bold text-primary small text-uppercase ls-1 mb-3">Test Assumptions ({activeName})</h6>
          
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label small text-muted mb-1 fw-bold">Current Working Income</label>
              <CurrencyInput className="form-control" value={testIncome} placeholder={`Current: $${currentSalary.toLocaleString()}`} onChange={(val: any) => setTestIncome(val)} />
              <div className="small text-muted mt-1 text-end">Est. Marginal Rate: <span className="fw-bold text-main">{(currentMarginal * 100).toFixed(1)}%</span></div>
            </div>

            <div>
              <label className="form-label small text-muted mb-1 fw-bold">Projected Retirement Income</label>
              <CurrencyInput className="form-control" value={retirementIncome} placeholder={`Projected: $${projectedRetireSalary.toLocaleString()}`} onChange={(val: any) => setRetirementIncome(val)} />
              <div className="small text-muted mt-1 text-end">Est. Retirement Marginal: <span className="fw-bold text-main">{(retirementMarginal * 100).toFixed(1)}%</span></div>
            </div>

            <div>
              <label className="form-label small text-muted mb-1 fw-bold">Test Contribution Amount ($)</label>
              <CurrencyInput className="form-control" value={contributionAmt} onChange={(val: any) => setContributionAmt(Number(val) || 0)} />
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6 ps-md-4 d-flex flex-column justify-content-between">
          <div>
            <h6 className="fw-bold text-success small text-uppercase ls-1 mb-3">25-Year Value Projection</h6>
            
            <div className="p-3 border border-secondary rounded-4 bg-input mb-3 shadow-inner">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted fw-bold">TFSA Future Value (Tax-Free)</span>
                <span className="fw-bolder text-info fs-5">${Math.round(tfsaFutureValue).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="small text-muted fw-bold">RRSP Future Value (After Retirement Tax)</span>
                <span className="fw-bolder text-danger fs-5">${Math.round(rrspFutureValueNet).toLocaleString()}</span>
              </div>
            </div>

            <div className={`p-3 rounded-4 border ${rrspIsBetter ? 'bg-success bg-opacity-10 border-success text-success-emphasis' : 'bg-info bg-opacity-10 border-info text-info-emphasis'} small fw-medium d-flex gap-2`}>
              <i className="bi bi-info-circle-fill flex-shrink-0 fs-5"></i>
              <div>
                {rrspIsBetter ? (
                  <span><strong>RRSP is optimal for {activeName}.</strong> Because your tax bracket is projected to be lower in retirement, deducting contributions today at {(currentMarginal*100).toFixed(0)}% and withdrawing later at {(retirementMarginal*100).toFixed(0)}% produces a net arbitrage win of <strong>${Math.round(rrspFutureValueNet - tfsaFutureValue).toLocaleString()}</strong>.</span>
                ) : (
                  <span><strong>TFSA is optimal for {activeName}.</strong> Because your retirement income tier matches or exceeds your current rate, tax-free compounding inside a TFSA beats out deferred taxation.</span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-top border-secondary border-opacity-25 mt-3 d-flex justify-content-between small text-muted">
            <span>Deduction savings today: <strong className="text-success">+${Math.round(rrspTaxSavings).toLocaleString()}</strong></span>
            <span>Net out-of-pocket RRSP cost: <strong>${Math.round(netRrspCost).toLocaleString()}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}