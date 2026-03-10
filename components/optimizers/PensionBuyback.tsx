import React, { useState } from 'react';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

export default function PensionBuyback() {
    const [bbCost, setBbCost] = useState(15000);
    const [bbAddedPension, setBbAddedPension] = useState(1500);
    const [bbYears, setBbYears] = useState(10);
    const [bbReturn, setBbReturn] = useState(6.0);

    const bbFutureValue = bbCost * Math.pow(1 + (bbReturn / 100), bbYears);
    const bbMatchRate = bbFutureValue > 0 ? (bbAddedPension / bbFutureValue) * 100 : 0;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-clock-history fs-4"></i>
                </div>
                <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Pension Buyback</h5>
            </div>
            <p className="text-muted small mb-4">Calculate if paying a lump sum today to buy back past service is better than investing the cash yourself.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Buyback Cost</label>
                    <CurrencyInput className="form-control form-control-sm" value={bbCost} onChange={setBbCost} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Added Pension /yr</label>
                    <CurrencyInput className="form-control form-control-sm border-primary text-primary" value={bbAddedPension} onChange={setBbAddedPension} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Yrs to Retire</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={bbYears} onChange={e => setBbYears(parseInt(e.target.value)||0)} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Est. Mkt Return</label>
                    <PercentInput className="form-control form-control-sm border-warning" value={bbReturn} onChange={setBbReturn} />
                </div>
            </div>

            <div className="bg-primary bg-opacity-10 border border-primary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-bold small">Future Val. of Cost <InfoBtn direction="up" title="Future Value" text="If you invested the Buyback Cost yourself until retirement at the estimated market return, this is what your lump sum would grow to." /></span>
                    <span className="fw-bold text-main fs-5">{formatCurrency(bbFutureValue)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-top border-primary border-opacity-25 pt-2">
                    <span className="text-muted fw-bold small text-uppercase ls-1">Required Yield</span>
                    <span className={`fw-bolder fs-4 ${bbMatchRate >= 4.0 ? 'text-success' : 'text-danger'}`}>{bbMatchRate.toFixed(2)}%</span>
                </div>
                <span className="small text-muted d-block text-center mt-2 fst-italic" style={{fontSize: '0.7rem'}}>
                    {bbMatchRate >= 4.0 ? "Guaranteed yield beats the 4% rule. Buyback recommended." : "You may be better off investing the money yourself."}
                </span>
            </div>
        </div>
    );
}