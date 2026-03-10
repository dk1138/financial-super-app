import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

export default function SideHustleROI() {
    const { results } = useFinance();
    const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate * 100 || 30;

    const [shGross, setShGross] = useState(25000);
    const [shDirectExp, setShDirectExp] = useState(4000);
    const [shHomeExp, setShHomeExp] = useState(3000);
    const [shMarginal, setShMarginal] = useState(p1Marginal);

    const totalShDeductions = shDirectExp + shHomeExp;
    const shNetIncome = Math.max(0, shGross - totalShDeductions);
    const taxSavedByDeductions = totalShDeductions * (shMarginal / 100);
    const extraCppPremium = shNetIncome * 0.0595; 
    const extraCppTaxShield = extraCppPremium * (shMarginal / 100);
    const netExtraCppCost = extraCppPremium - extraCppTaxShield;
    const shNetAdvantage = taxSavedByDeductions - netExtraCppCost;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-shop fs-4"></i>
                </div>
                <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">Side-Hustle ROI</h5>
            </div>
            <p className="text-muted small mb-4">Determine if the tax savings from writing off home office and business expenses outpace the extra "double" CPP premium (11.9%) you pay as self-employed.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Gross Revenue</label>
                    <CurrencyInput className="form-control form-control-sm border-success text-success" value={shGross} onChange={setShGross} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Marginal Tax</label>
                    <PercentInput className="form-control form-control-sm" value={shMarginal} onChange={setShMarginal} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Direct Expenses</label>
                    <CurrencyInput className="form-control form-control-sm" value={shDirectExp} onChange={setShDirectExp} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Home Office Exp. <InfoBtn title="Home Office" text="Your prorated portion of rent, mortgage interest, utilities, and internet." /></label>
                    <CurrencyInput className="form-control form-control-sm" value={shHomeExp} onChange={setShHomeExp} />
                </div>
            </div>

            <div className="bg-input border border-secondary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                <div className="d-flex justify-content-between align-items-center mb-1 text-success small">
                    <span>Tax Saved (Write-offs):</span>
                    <span className="fw-bold">+{formatCurrency(taxSavedByDeductions)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25 text-danger small">
                    <span>Extra CPP Premium (Net): <InfoBtn title="CPP Premium" text="Self-employed individuals pay both the employee and employer portions of CPP (approx 11.9% total), but get a tax deduction for the employer half." /></span>
                    <span className="fw-bold">-{formatCurrency(netExtraCppCost)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className={`fw-bolder text-uppercase ls-1 small ${shNetAdvantage >= 0 ? 'text-success' : 'text-danger'}`}>Net Advantage</span>
                    <span className={`fw-bolder fs-4 ${shNetAdvantage >= 0 ? 'text-success' : 'text-danger'}`}>{shNetAdvantage >= 0 ? '+' : ''}{formatCurrency(shNetAdvantage)}</span>
                </div>
            </div>
        </div>
    );
}