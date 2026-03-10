import React, { useState } from 'react';
import { CurrencyInput, PercentInput } from '../SharedUI';

const calcCanadianMortgagePmt = (balance: number, annualRate: number, yearsAmort: number) => {
    if(annualRate === 0 || yearsAmort === 0) return 0;
    const r = Math.pow(1 + (annualRate/100)/2, 2/12) - 1;
    const n = yearsAmort * 12;
    return (balance * r) / (1 - Math.pow(1+r, -n));
};

export default function MortgageRenewal() {
    const [rnwBalance, setRnwBalance] = useState(430000);
    const [rnwAmort, setRnwAmort] = useState(20);
    const [rnwOldRate, setRnwOldRate] = useState(3.29);
    const [rnwNewRate, setRnwNewRate] = useState(4.85);
    const [rnwLumpSum, setRnwLumpSum] = useState(0);

    const rnwOldPmt = calcCanadianMortgagePmt(rnwBalance, rnwOldRate, rnwAmort);
    const rnwNewBalance = Math.max(0, rnwBalance - rnwLumpSum);
    const rnwNewPmt = calcCanadianMortgagePmt(rnwNewBalance, rnwNewRate, rnwAmort);
    const rnwDiff = rnwNewPmt - rnwOldPmt;
    
    const rnwTotalInterestNoLump = (calcCanadianMortgagePmt(rnwBalance, rnwNewRate, rnwAmort) * rnwAmort * 12) - rnwBalance;
    const rnwTotalInterestWithLump = (rnwNewPmt * rnwAmort * 12) - rnwNewBalance;
    const rnwInterestSaved = rnwTotalInterestNoLump - rnwTotalInterestWithLump;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-lightning-charge-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Mortgage Renewal Shock</h5>
            </div>
            <p className="text-muted small mb-4">Calculate the exact monthly payment change upon renewal, and the lifetime interest saved by dropping a lump sum.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Bal at Renewal</label>
                    <CurrencyInput className="form-control form-control-sm" value={rnwBalance} onChange={setRnwBalance} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Amort. Remaining</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={rnwAmort} onChange={e => setRnwAmort(parseInt(e.target.value)||0)} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Old Rate</label>
                    <PercentInput className="form-control form-control-sm" value={rnwOldRate} onChange={setRnwOldRate} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">New Target Rate</label>
                    <PercentInput className="form-control form-control-sm border-danger text-danger" value={rnwNewRate} onChange={setRnwNewRate} />
                </div>
                <div className="col-12 mt-2 pt-2 border-top border-secondary">
                    <label className="form-label small fw-bold text-success mb-1">Planned Lump Sum Deposit</label>
                    <CurrencyInput className="form-control form-control-sm border-success text-success" value={rnwLumpSum} onChange={setRnwLumpSum} />
                </div>
            </div>

            <div className="bg-danger bg-opacity-10 border border-danger border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-danger border-opacity-25">
                    <span className="text-muted fw-bold small">Payment Shock</span>
                    <span className={`fw-bold fs-5 ${rnwDiff > 0 ? 'text-danger' : 'text-success'}`}>{rnwDiff > 0 ? '+' : ''}{formatCurrency(rnwDiff)} <span className="small text-muted fw-normal fs-6">/mo</span></span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-success fw-bolder text-uppercase ls-1 small">Lump Sum Interest Saved</span>
                    <span className="fw-bolder fs-5 text-success">{formatCurrency(rnwInterestSaved)}</span>
                </div>
            </div>
        </div>
    );
}