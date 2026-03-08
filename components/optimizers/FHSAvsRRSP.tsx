import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput, PercentInput } from '../SharedUI';

export default function FHSAvsRRSP() {
    const { results } = useFinance();
    const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate * 100 || 30;

    const [fhsaAmount, setFhsaAmount] = useState(8000);
    const [fhsaTaxRate, setFhsaTaxRate] = useState(p1Marginal);
    const [fhsaYears, setFhsaYears] = useState(5);
    const [fhsaReturn, setFhsaReturn] = useState(6.0);

    const fhsaGrowth = fhsaAmount * Math.pow(1 + (fhsaReturn/100), fhsaYears);
    const hbpRepaymentCost = (fhsaAmount / 15) * (1 / (1 - (fhsaTaxRate/100))) * 15; 

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-house-add-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">FHSA vs RRSP HBP</h5>
            </div>
            <p className="text-muted small mb-4">The FHSA gives you an RRSP tax deduction without the forced 15-year repayment of the HBP. See the cash flow difference.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Amount Saved</label>
                    <CurrencyInput className="form-control form-control-sm" value={fhsaAmount} onChange={setFhsaAmount} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Marginal Tax</label>
                    <PercentInput className="form-control form-control-sm" value={fhsaTaxRate} onChange={setFhsaTaxRate} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Yrs to Buy</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={fhsaYears} onChange={e => setFhsaYears(parseInt(e.target.value)||0)} />
                </div>
            </div>

            <div className="mt-auto d-flex flex-column gap-3">
                <div className="p-3 rounded-4 border border-primary bg-primary bg-opacity-10 shadow-inner">
                    <h6 className="fw-bold text-primary text-uppercase ls-1 mb-2 small"><i className="bi bi-house-add-fill me-1"></i>Using FHSA</h6>
                    <div className="d-flex justify-content-between small text-muted">Cash for Home: <span className="fw-bold text-main">{formatCurrency(fhsaGrowth)}</span></div>
                    <div className="text-success fw-bold small mt-1"><i className="bi bi-check-circle-fill me-1"></i> No Repayment Required</div>
                </div>
                <div className="p-3 rounded-4 border border-warning bg-warning bg-opacity-10 shadow-inner">
                    <h6 className="fw-bold text-warning text-uppercase ls-1 mb-2 small"><i className="bi bi-bank2 me-1"></i>Using RRSP HBP</h6>
                    <div className="d-flex justify-content-between small text-muted">Cash for Home: <span className="fw-bold text-main">{formatCurrency(fhsaGrowth)}</span></div>
                    <div className="text-danger fw-bold small mt-1"><i className="bi bi-exclamation-triangle-fill me-1"></i> 15yr Pre-Tax Repayment: {formatCurrency(hbpRepaymentCost)}</div>
                </div>
            </div>
        </div>
    );
}