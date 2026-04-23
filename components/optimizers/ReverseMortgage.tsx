'use client';
import React, { useState } from 'react';

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
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="card shadow-sm border-secondary bg-body rounded-4 h-100">
      <div className="card-header bg-transparent border-bottom border-secondary p-4 pb-3">
        <h6 className="fw-bold mb-0 text-white d-flex align-items-center">
          <i className="bi bi-house-dash text-info me-2 fs-5"></i>Reverse Mortgage Modeler
        </h6>
        <p className="text-muted small mt-2 mb-0" style={{fontSize: '0.75rem'}}>
          Model how compound interest impacts home equity over time without monthly payments.
        </p>
      </div>
      
      <div className="card-body p-4 d-flex flex-column gap-3">
        <div>
          <label className="form-label text-muted fw-bold mb-1" style={{fontSize: '0.75rem'}}>Current Home Value</label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-input border-secondary text-muted">$</span>
            <input type="number" className="form-control bg-input border-secondary text-white" value={homeValue} onChange={e => setHomeValue(Number(e.target.value))} />
          </div>
        </div>

        <div>
          <label className="form-label text-muted fw-bold mb-1 d-flex justify-content-between" style={{fontSize: '0.75rem'}}>
            <span>Initial Borrowed Amount</span>
            <span className="text-warning">Max {formatCurrency(homeValue * 0.55)}</span>
          </label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-input border-secondary text-muted">$</span>
            <input type="number" className="form-control bg-input border-secondary text-white" value={borrowAmount} onChange={e => setBorrowAmount(Number(e.target.value))} />
          </div>
        </div>

        <div className="row g-2">
          <div className="col-6">
            <label className="form-label text-muted fw-bold mb-1" style={{fontSize: '0.75rem'}}>Mortgage Rate (%)</label>
            <input type="number" step="0.1" className="form-control form-control-sm bg-input border-secondary text-white" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} />
          </div>
          <div className="col-6">
            <label className="form-label text-muted fw-bold mb-1" style={{fontSize: '0.75rem'}}>Appreciation (%)</label>
            <input type="number" step="0.1" className="form-control form-control-sm bg-input border-secondary text-white" value={homeAppreciation} onChange={e => setHomeAppreciation(Number(e.target.value))} />
          </div>
        </div>

        <div className="mt-2">
          <label className="form-label text-muted fw-bold mb-1 d-flex justify-content-between" style={{fontSize: '0.75rem'}}>
            <span>Projection Timeline</span>
            <span className="text-info">{years} Years</span>
          </label>
          <input type="range" className="form-range" min="1" max="30" step="1" value={years} onChange={e => setYears(Number(e.target.value))} />
        </div>

        {/* RESULTS BOX */}
        <div className="bg-input border border-secondary rounded-3 p-3 mt-auto">
          <div className="d-flex justify-content-between mb-1">
            <span className="text-muted" style={{fontSize: '0.75rem'}}>Future Home Value</span>
            <span className="fw-bold text-success" style={{fontSize: '0.85rem'}}>{formatCurrency(futureHomeValue)}</span>
          </div>
          <div className="d-flex justify-content-between mb-2">
            <span className="text-muted" style={{fontSize: '0.75rem'}}>Future Debt</span>
            <span className="fw-bold text-danger" style={{fontSize: '0.85rem'}}>{formatCurrency(futureDebt)}</span>
          </div>
          
          <div className="progress rounded-pill bg-danger border border-secondary mt-2 mb-2" style={{ height: '8px' }}>
             <div className="progress-bar bg-success" role="progressbar" style={{ width: `${Math.max(0, equityPercentage)}%` }}></div>
          </div>
          
          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary border-opacity-50">
            <span className="text-muted fw-bold" style={{fontSize: '0.75rem'}}>Remaining Equity</span>
            <span className={`fw-bold ${remainingEquity > 0 ? 'text-white' : 'text-danger'}`}>{formatCurrency(remainingEquity)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}