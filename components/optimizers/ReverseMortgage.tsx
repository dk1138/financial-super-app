'use client';
import React, { useState } from 'react';
import { CurrencyInput, PercentInput } from '../SharedUI';

export default function ReverseMortgage() {
  const [homeValue, setHomeValue] = useState(800000);
  const [borrowAmount, setBorrowAmount] = useState(150000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [homeAppreciation, setHomeAppreciation] = useState(3.0);
  const [years, setYears] = useState(15);

  const futureHomeValue = homeValue * Math.pow(1 + homeAppreciation / 100, years);
  const futureDebt = borrowAmount * Math.pow(1 + (interestRate / 100) / 2, years * 2);
  const remainingEquity = futureHomeValue - futureDebt;
  
  const equityPercentage = (remainingEquity / futureHomeValue) * 100;
  const debtPercentage = (futureDebt / futureHomeValue) * 100;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
      
      {/* Header */}
      <div className="d-flex align-items-center mb-3">
        <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
          <i className="bi bi-house-dash-fill fs-4"></i>
        </div>
        <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Reverse Mortgage</h5>
      </div>
      <p className="text-muted small mb-4">
        Model how compound interest erodes home equity over time when monthly payments are deferred.
      </p>
      
      {/* Inputs */}
      <div className="row g-3 mb-4">
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1">Current Home Value</label>
          <CurrencyInput className="form-control form-control-sm" value={homeValue} onChange={setHomeValue} />
        </div>
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1">Borrowed Amount</label>
          <CurrencyInput className="form-control form-control-sm border-warning text-warning" value={borrowAmount} onChange={setBorrowAmount} />
        </div>
        
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1">Mortgage Rate</label>
          <PercentInput className="form-control form-control-sm text-danger" value={interestRate} onChange={setInterestRate} />
        </div>
        <div className="col-6">
          <label className="form-label small fw-bold text-muted mb-1">Appreciation Rate</label>
          <PercentInput className="form-control form-control-sm text-success" value={homeAppreciation} onChange={setHomeAppreciation} />
        </div>

        <div className="col-12 mt-3 pt-2 border-top border-secondary">
          <label className="form-label small fw-bold text-info mb-1 d-flex justify-content-between">
            <span>Projection Timeline</span>
            <span>{years} Years</span>
          </label>
          <input 
            type="range" 
            className="form-range" 
            min="1" 
            max="30" 
            step="1" 
            value={years} 
            onChange={e => setYears(Number(e.target.value))} 
          />
        </div>
      </div>

      {/* Results Box */}
      <div className="bg-info bg-opacity-10 border border-info border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
        
        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-info border-opacity-25">
          <span className="text-muted fw-bold small">Future Home Value</span>
          <span className="fw-bold text-success fs-6">{formatCurrency(futureHomeValue)}</span>
        </div>
        
        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-info border-opacity-25">
          <span className="text-muted fw-bold small">Future Accrued Debt</span>
          <span className="fw-bold text-danger fs-6">{formatCurrency(futureDebt)}</span>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <span className="text-info fw-bolder text-uppercase ls-1 small">Remaining Equity</span>
          <span className={`fw-bolder fs-5 ${remainingEquity > 0 ? 'text-info' : 'text-danger'}`}>{formatCurrency(remainingEquity)}</span>
        </div>

        {/* Visual Progress Bar */}
        <div className="progress rounded-pill bg-danger shadow-inner border border-secondary" style={{ height: '10px' }}>
           <div 
             className="progress-bar bg-success" 
             role="progressbar" 
             style={{ width: `${Math.max(0, equityPercentage)}%` }}
           ></div>
        </div>
        <div className="mt-1 d-flex justify-content-between text-muted" style={{fontSize: '0.65rem'}}>
           <span>{Math.max(0, equityPercentage).toFixed(1)}% Equity</span>
           <span>{Math.min(100, debtPercentage).toFixed(1)}% Debt</span>
        </div>
        
      </div>
    </div>
  );
}