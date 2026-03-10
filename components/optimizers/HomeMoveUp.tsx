import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput } from '../SharedUI';

const calcOntarioLTT = (val: number, isToronto: boolean) => {
    let tax = 0;
    if (val <= 55000) tax += val * 0.005;
    else tax += 55000 * 0.005;
    if (val > 55000 && val <= 250000) tax += (Math.min(val, 250000) - 55000) * 0.01;
    if (val > 250000 && val <= 400000) tax += (Math.min(val, 400000) - 250000) * 0.015;
    if (val > 400000 && val <= 2000000) tax += (Math.min(val, 2000000) - 400000) * 0.02;
    if (val > 2000000) tax += (val - 2000000) * 0.025;
    return isToronto ? tax * 2 : tax;
};

export default function HomeMoveUp() {
    const { data } = useFinance();
    const primaryProperty = data.properties?.find((p: any) => p.includeInNW);

    const [muCurrentValue, setMuCurrentValue] = useState(primaryProperty?.value || 1000000);
    const [muMortgage, setMuMortgage] = useState(primaryProperty?.mortgage || 400000);
    const [muNewValue, setMuNewValue] = useState(1400000);
    const [muToronto, setMuToronto] = useState(false);

    const muRealtorFee = muCurrentValue * 0.05;
    const muCurrentLegal = 1500;
    const muNetEquity = Math.max(0, muCurrentValue - muMortgage - muRealtorFee - muCurrentLegal);
    const muLtt = calcOntarioLTT(muNewValue, muToronto);
    const muNewLegal = 2000;
    const muRequiredMortgage = muNewValue + muLtt + muNewLegal - muNetEquity;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-houses-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Home Move-Up Analyzer</h5>
            </div>
            <p className="text-muted small mb-4">Calculate the friction costs of selling your current home and what your new mortgage will look like.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Curr. Home Value</label>
                    <CurrencyInput className="form-control form-control-sm" value={muCurrentValue} onChange={setMuCurrentValue} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Curr. Mortgage</label>
                    <CurrencyInput className="form-control form-control-sm border-danger" value={muMortgage} onChange={setMuMortgage} />
                </div>
                <div className="col-12 mt-3 pt-3 border-top border-secondary">
                    <label className="form-label small fw-bold text-info mb-1">Target New Home Value</label>
                    <CurrencyInput className="form-control form-control-sm border-info text-info" value={muNewValue} onChange={setMuNewValue} />
                </div>
                <div className="col-12">
                    <div className="form-check form-switch d-flex align-items-center ps-0">
                        <input className="form-check-input cursor-pointer ms-0 me-2" type="checkbox" checked={muToronto} onChange={e => setMuToronto(e.target.checked)} />
                        <label className="form-check-label small fw-bold text-muted mt-1">Property is in City of Toronto (Double LTT)</label>
                    </div>
                </div>
            </div>

            <div className="bg-input border border-secondary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                    <span>Net Equity Available:</span>
                    <span className="fw-bold text-main">{formatCurrency(muNetEquity)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25 text-danger small">
                    <span>Lost to Friction Costs (Fees/LTT):</span>
                    <span className="fw-bold">-{formatCurrency(muRealtorFee + muCurrentLegal + muLtt + muNewLegal)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-info fw-bolder text-uppercase ls-1 small">Required Mortgage</span>
                    <span className="fw-bolder fs-4 text-info">{formatCurrency(muRequiredMortgage)}</span>
                </div>
            </div>
        </div>
    );
}