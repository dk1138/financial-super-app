import React, { useState } from 'react';
import { CurrencyInput, PercentInput } from '../SharedUI';

export default function PensionCV() {
    const [cvAge, setCvAge] = useState(55);
    const [cvMonthly, setCvMonthly] = useState(3000);
    const [cvLumpSum, setCvLumpSum] = useState(600000);
    const [cvReturn, setCvReturn] = useState(6.0);

    const cvAnnualPension = cvMonthly * 12;
    const cvWithdrawalRate = cvLumpSum > 0 ? (cvAnnualPension / cvLumpSum) * 100 : 0;
    
    let cvYearsLeft = 0;
    let tempBal = cvLumpSum;
    const rCv = cvReturn / 100;
    while(tempBal > 0 && cvYearsLeft < 50) {
        tempBal = tempBal * (1 + rCv) - cvAnnualPension;
        if (tempBal > 0) cvYearsLeft++;
    }
    const cvDepletionAge = cvAge + cvYearsLeft;

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-briefcase-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">Pension Commuted Value</h5>
            </div>
            <p className="text-muted small mb-4">Compare the guaranteed monthly payout of your DB pension against taking the Commuted Value (Lump Sum) to a LIRA.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Your Age</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={cvAge} onChange={e => setCvAge(parseInt(e.target.value)||0)} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Est. Mkt Return</label>
                    <PercentInput className="form-control form-control-sm border-warning" value={cvReturn} onChange={setCvReturn} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Guaranteed /mo</label>
                    <CurrencyInput className="form-control form-control-sm" value={cvMonthly} onChange={setCvMonthly} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Commuted Value</label>
                    <CurrencyInput className="form-control form-control-sm" value={cvLumpSum} onChange={setCvLumpSum} />
                </div>
            </div>

            <div className="bg-warning bg-opacity-10 border border-warning border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-bold small">Required Yield to Match</span>
                    <span className="fw-bold text-main fs-5">{cvWithdrawalRate.toFixed(2)}%</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-top border-warning border-opacity-25 pt-2">
                    <span className="text-muted fw-bold small text-uppercase ls-1">CV Depletion Age</span>
                    <span className={`fw-bolder fs-4 ${cvDepletionAge >= 95 ? 'text-success' : 'text-danger'}`}>{cvDepletionAge >= 95 ? '95+' : cvDepletionAge}</span>
                </div>
                <span className="small text-muted d-block text-center mt-2 fst-italic" style={{fontSize: '0.7rem'}}>
                    {cvDepletionAge >= 95 ? "Lump sum outlasts life expectancy." : `Lump sum runs out at age ${cvDepletionAge}.`}
                </span>
            </div>
        </div>
    );
}