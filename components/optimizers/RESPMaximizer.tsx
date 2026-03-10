import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput } from '../SharedUI';
import { FINANCIAL_CONSTANTS } from '../../lib/config';

export default function RESPMaximizer() {
    const { data } = useFinance();
    const estChildBirthYear = data.dependents?.[0] ? parseInt(data.dependents[0].dob.split('-')[0]) : (new Date().getFullYear() - 5);
    const estChildAge = Math.max(0, new Date().getFullYear() - estChildBirthYear);
    
    const [respAge, setRespAge] = useState(estChildAge);
    const [respAnnualCont, setRespAnnualCont] = useState(2500);
    const [respPriorGrants, setRespPriorGrants] = useState(estChildAge > 0 ? estChildAge * 500 : 0);

    const MAX_LIFETIME = FINANCIAL_CONSTANTS.RESP_CESG_LIFETIME_MAX; 
    const MATCH_RATE = FINANCIAL_CONSTANTS.RESP_CESG_MATCH_RATE; 
    const MAX_ANNUAL_MATCH = FINANCIAL_CONSTANTS.RESP_CESG_ANNUAL_MAX; 
    const OPTIMAL_ANNUAL = MAX_ANNUAL_MATCH / MATCH_RATE; 

    const respRemainingYears = Math.max(0, 17 - respAge);
    const respRoomLeft = Math.max(0, MAX_LIFETIME - respPriorGrants);
    
    const standardGrantPerYear = Math.min(MAX_ANNUAL_MATCH, respAnnualCont * MATCH_RATE);
    const canCatchUp = respAnnualCont > OPTIMAL_ANNUAL;
    const catchUpGrantPerYear = canCatchUp ? Math.min(MAX_ANNUAL_MATCH, (respAnnualCont - OPTIMAL_ANNUAL) * MATCH_RATE) : 0;
    
    const totalGrantPerYear = standardGrantPerYear + catchUpGrantPerYear;
    const projectedFutureGrants = Math.min(respRoomLeft, totalGrantPerYear * respRemainingYears);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-mortarboard-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">RESP Grant Maximizer</h5>
            </div>
            <p className="text-muted small mb-4">Calculate how to efficiently hit the lifetime $7,200 CESG maximum, including CRA's special "catch-up" rules.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Child's Age</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={respAge} onChange={e => setRespAge(parseInt(e.target.value)||0)} max={17} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Annual Contrib.</label>
                    <CurrencyInput className="form-control form-control-sm border-info" value={respAnnualCont} onChange={setRespAnnualCont} />
                </div>
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Lifetime Grants Received to Date <InfoBtn title="Prior Grants" text={`Total CESG already paid into your RESP. The maximum lifetime limit is $${MAX_LIFETIME.toLocaleString()}.`} /></label>
                    <CurrencyInput className="form-control form-control-sm" value={respPriorGrants} onChange={setRespPriorGrants} />
                </div>
            </div>

            <div className="bg-info bg-opacity-10 border border-info border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-bold small">Expected Annual Grant</span>
                    <span className="fw-bold text-main">+{formatCurrency(totalGrantPerYear)} <span className="small text-muted fw-normal">/yr</span></span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-info border-opacity-25">
                    <span className="text-muted fw-bold small">Years Left to Contribute</span>
                    <span className="fw-bold text-info">{respRemainingYears} yrs</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-info fw-bolder text-uppercase ls-1 small">Projected Final Grant</span>
                    <span className={`fw-bolder fs-5 ${(respPriorGrants + projectedFutureGrants) >= MAX_LIFETIME ? 'text-success' : 'text-warning'}`}>
                        {formatCurrency(respPriorGrants + projectedFutureGrants)} <span className="small fw-normal text-muted">/ ${MAX_LIFETIME.toLocaleString()}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}