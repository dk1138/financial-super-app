import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

export default function MortgageAffordability() {
    const { data } = useFinance();
    const householdIncome = (Number(data.inputs.p1_income) || 0) + (data.mode === 'Couple' ? (Number(data.inputs.p2_income) || 0) : 0);

    const [affordIncome, setAffordIncome] = useState(householdIncome || 120000);
    const [affordDebt, setAffordDebt] = useState(500); 
    const [affordRate, setAffordRate] = useState(6.50); 
    const [affordPropTax, setAffordPropTax] = useState(4000);

    const affordMonthlyIncome = affordIncome / 12;
    const affordMonthlyTax = affordPropTax / 12;
    const affordHeatMonthly = 150; 
    
    const maxGdsPayment = (affordMonthlyIncome * 0.39) - affordMonthlyTax - affordHeatMonthly;
    const maxTdsPayment = (affordMonthlyIncome * 0.44) - affordMonthlyTax - affordHeatMonthly - affordDebt;

    const allowedMortgagePmt = Math.max(0, Math.min(maxGdsPayment, maxTdsPayment));
    const limitingRatio = maxGdsPayment < maxTdsPayment ? 'GDS' : 'TDS';

    const affordAnnualRate = affordRate / 100;
    const affordMonthlyRate = Math.pow(1 + affordAnnualRate / 2, 2 / 12) - 1;
    const affordMonths = 25 * 12; 

    let maxMortgageAmount = 0;
    if (affordMonthlyRate > 0 && allowedMortgagePmt > 0) {
        maxMortgageAmount = allowedMortgagePmt * ((1 - Math.pow(1 + affordMonthlyRate, -affordMonths)) / affordMonthlyRate);
    }
    const estMaxHomeValue = maxMortgageAmount / 0.8;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-house-heart fs-4"></i>
                </div>
                <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">Mortgage Affordability</h5>
            </div>
            <p className="text-muted small mb-4">Calculate your maximum borrowing power using standard Canadian GDS (39%) and TDS (44%) stress test limits.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Annual Gross Income</label>
                    <CurrencyInput className="form-control form-control-sm border-success text-success" value={affordIncome} onChange={setAffordIncome} />
                </div>
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Monthly Debt <InfoBtn title="Monthly Debt" text="Car loans, minimum credit card payments, student loans, etc." /></label>
                    <CurrencyInput className="form-control form-control-sm border-danger text-danger" value={affordDebt} onChange={setAffordDebt} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Qualifying Rate <InfoBtn title="Qualifying Rate" text="In Canada, you must qualify at the contract rate + 2%, or 5.25%, whichever is higher." /></label>
                    <PercentInput className="form-control form-control-sm" value={affordRate} onChange={setAffordRate} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Est. Prop Tax/yr</label>
                    <CurrencyInput className="form-control form-control-sm" value={affordPropTax} onChange={setAffordPropTax} />
                </div>
            </div>

            <div className="bg-success bg-opacity-10 border border-success border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-success border-opacity-25">
                    <span className="text-muted fw-bold small">Max Mortgage</span>
                    <span className="fw-bold text-main">{formatCurrency(maxMortgageAmount)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-success fw-bolder text-uppercase ls-1 small">Est. Home Price</span>
                    <span className="fw-bolder fs-4 text-success">{formatCurrency(estMaxHomeValue)}</span>
                </div>
                <span className="text-muted fst-italic mt-2 d-block" style={{fontSize: '0.65rem'}}>
                    Assuming 20% down payment. Limited by the {limitingRatio} ratio.
                </span>
            </div>
        </div>
    );
}