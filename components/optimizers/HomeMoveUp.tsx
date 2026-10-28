'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput, PercentInput, StepperInput, SegmentedControl, InfoBtn } from '../SharedUI';

/**
 * Calculates Canadian Land Transfer Tax based on property value, province, and municipal location.
 * Accurately models Ontario PLTT, City of Toronto progressive MLTT (including 2024 luxury brackets),
 * and BC Property Transfer Tax (PTT).
 */
export const calcLandTransferTax = (val: number, province: string, isToronto: boolean) => {
    if (!val || val <= 0) return { provLtt: 0, muniLtt: 0, totalLtt: 0 };

    let provLtt = 0;
    let muniLtt = 0;

    if (province === 'ON') {
        // Ontario Provincial LTT
        if (val <= 55000) provLtt += val * 0.005;
        else provLtt += 55000 * 0.005;

        if (val > 55000 && val <= 250000) provLtt += (Math.min(val, 250000) - 55000) * 0.01;
        else if (val > 250000) provLtt += (250000 - 55000) * 0.01;

        if (val > 250000 && val <= 400000) provLtt += (Math.min(val, 400000) - 250000) * 0.015;
        else if (val > 400000) provLtt += (400000 - 250000) * 0.015;

        if (val > 400000 && val <= 2000000) provLtt += (Math.min(val, 2000000) - 400000) * 0.02;
        else if (val > 2000000) provLtt += (2000000 - 400000) * 0.02;

        if (val > 2000000) provLtt += (val - 2000000) * 0.025;

        // City of Toronto Municipal LTT (with 2024 progressive luxury tiers)
        if (isToronto) {
            if (val <= 55000) muniLtt += val * 0.005;
            else muniLtt += 55000 * 0.005;

            if (val > 55000 && val <= 250000) muniLtt += (Math.min(val, 250000) - 55000) * 0.01;
            else if (val > 250000) muniLtt += (250000 - 55000) * 0.01;

            if (val > 250000 && val <= 400000) muniLtt += (Math.min(val, 400000) - 250000) * 0.015;
            else if (val > 400000) muniLtt += (400000 - 250000) * 0.015;

            if (val > 400000 && val <= 2000000) muniLtt += (Math.min(val, 2000000) - 400000) * 0.02;
            else if (val > 2000000) muniLtt += (2000000 - 400000) * 0.02;

            if (val > 2000000 && val <= 3000000) muniLtt += (Math.min(val, 3000000) - 2000000) * 0.025;
            else if (val > 3000000) muniLtt += (3000000 - 2000000) * 0.025;

            // 2024 Luxury MLTT Graduated Rates
            if (val > 3000000 && val <= 4000000) muniLtt += (Math.min(val, 4000000) - 3000000) * 0.035;
            else if (val > 4000000) muniLtt += (4000000 - 3000000) * 0.035;

            if (val > 4000000 && val <= 5000000) muniLtt += (Math.min(val, 5000000) - 4000000) * 0.045;
            else if (val > 5000000) muniLtt += (5000000 - 4000000) * 0.045;

            if (val > 5000000 && val <= 10000000) muniLtt += (Math.min(val, 10000000) - 5000000) * 0.055;
            else if (val > 10000000) muniLtt += (10000000 - 5000000) * 0.055;

            if (val > 10000000 && val <= 20000000) muniLtt += (Math.min(val, 20000000) - 10000000) * 0.065;
            else if (val > 20000000) muniLtt += (20000000 - 10000000) * 0.065;

            if (val > 20000000) muniLtt += (val - 20000000) * 0.075;
        }
    } else if (province === 'BC') {
        // British Columbia Property Transfer Tax (PTT)
        if (val <= 200000) provLtt += val * 0.01;
        else provLtt += 200000 * 0.01;

        if (val > 200000 && val <= 2000000) provLtt += (Math.min(val, 2000000) - 200000) * 0.02;
        else if (val > 2000000) provLtt += (2000000 - 200000) * 0.02;

        if (val > 2000000 && val <= 3000000) provLtt += (Math.min(val, 3000000) - 2000000) * 0.03;
        else if (val > 3000000) provLtt += (3000000 - 2000000) * 0.03;

        if (val > 3000000) provLtt += (val - 3000000) * 0.05;
    } else if (province === 'AB') {
        // Alberta Land Title Registration Transfer Fees (~$50 base + $5 per $5k value)
        provLtt = 50 + (Math.ceil(val / 5000) * 5);
    } else if (province === 'QC') {
        // Quebec Welcome Tax (Droits de mutation)
        if (val <= 58900) provLtt += val * 0.005;
        else provLtt += 58900 * 0.005;

        if (val > 58900 && val <= 294600) provLtt += (Math.min(val, 294600) - 58900) * 0.01;
        else if (val > 294600) provLtt += (294600 - 58900) * 0.01;

        if (val > 294600 && val <= 500000) provLtt += (Math.min(val, 500000) - 294600) * 0.015;
        else if (val > 500000) provLtt += (500000 - 294600) * 0.015;

        if (val > 500000) provLtt += (val - 500000) * 0.02;
    } else {
        // Standard baseline (~1.25% average across other provinces)
        provLtt = val * 0.0125;
    }

    return { provLtt: Math.round(provLtt), muniLtt: Math.round(muniLtt), totalLtt: Math.round(provLtt + muniLtt) };
};

/**
 * Standard Canadian semi-annual compounding mortgage payment formula.
 */
export const calcCanadianMortgagePayment = (principal: number, annualRatePct: number, years: number) => {
    if (principal <= 0 || annualRatePct <= 0 || years <= 0) return 0;
    const r = annualRatePct / 100;
    // Canadian semi-annual compounding: monthly rate rm = (1 + r/2)^(2/12) - 1
    const rm = Math.pow(1 + r / 2, 2 / 12) - 1;
    const n = years * 12;
    const payment = (principal * rm * Math.pow(1 + rm, n)) / (Math.pow(1 + rm, n) - 1);
    return Math.round(payment);
};

export default function HomeMoveUp() {
    const { data } = useFinance();
    const primaryProp = data.properties?.find((p: any) => p.name !== 'Primary Residence' ? p.includeInNW : true);

    const defaultProvince = data.inputs?.tax_province || 'ON';
    const defaultCurrentValue = Number(data.inputs?.primary_value) || primaryProp?.value || 1000000;
    const defaultCurrentMortgage = data.inputs?.primary_mortgage !== undefined 
        ? Number(data.inputs?.primary_mortgage) 
        : (primaryProp?.mortgage !== undefined ? primaryProp.mortgage : 400000);
    const defaultCurrentRate = Number(data.inputs?.primary_rate) || 4.5;
    const defaultCurrentPayment = Number(data.inputs?.primary_payment) || calcCanadianMortgagePayment(defaultCurrentMortgage, defaultCurrentRate, 25);

    // --- State Variables ---
    const [viewTab, setViewTab] = useState<'equity' | 'cashflow'>('equity');
    const [muCurrentValue, setMuCurrentValue] = useState<number>(defaultCurrentValue);
    const [muMortgage, setMuMortgage] = useState<number>(defaultCurrentMortgage);
    const [muNewValue, setMuNewValue] = useState<number>(1450000);
    const [muAdditionalCash, setMuAdditionalCash] = useState<number>(0);

    const [province, setProvince] = useState<string>(defaultProvince);
    const [muToronto, setMuToronto] = useState<boolean>(false);
    const [realtorCommissionPct, setRealtorCommissionPct] = useState<number>(5.0);
    const [includeHstOnRealtor, setIncludeHstOnRealtor] = useState<boolean>(true);
    const [sellingLegal, setSellingLegal] = useState<number>(1500);
    const [buyingLegal, setBuyingLegal] = useState<number>(2200);
    const [movingCosts, setMovingCosts] = useState<number>(2500);
    const [mortgagePenalty, setMortgagePenalty] = useState<number>(0);
    const [showCostDetails, setShowCostDetails] = useState<boolean>(false);

    // Mortgage & Cashflow Assumptions
    const [mortgageRate, setMortgageRate] = useState<number>(4.75);
    const [amortizationYears, setAmortizationYears] = useState<number>(25);
    const [propertyTaxRate, setPropertyTaxRate] = useState<number>(0.75); // 0.75% typical average

    // --- Core Calculations ---
    const hstRate = province === 'ON' ? 0.13 : province === 'BC' ? 0.05 : province === 'QC' ? 0.14975 : province === 'AB' ? 0.05 : 0.15;
    const effectiveCommissionRate = (realtorCommissionPct / 100) * (includeHstOnRealtor ? (1 + hstRate) : 1);
    const realtorFee = Math.round(muCurrentValue * effectiveCommissionRate);

    // Selling friction
    const totalSellingFriction = realtorFee + sellingLegal + mortgagePenalty;
    const netProceeds = Math.max(0, muCurrentValue - muMortgage - totalSellingFriction);

    // Buying friction
    const lttObj = useMemo(() => {
        return calcLandTransferTax(muNewValue, province, muToronto && province === 'ON');
    }, [muNewValue, province, muToronto]);

    const totalBuyingFriction = lttObj.totalLtt + buyingLegal + movingCosts;
    const totalFrictionCosts = totalSellingFriction + totalBuyingFriction;

    // Funding Stack & Required Mortgage
    const totalDownPaymentAvailable = netProceeds + muAdditionalCash;
    const totalPurchaseCost = muNewValue + totalBuyingFriction;
    const requiredMortgage = Math.max(0, totalPurchaseCost - totalDownPaymentAvailable);
    const equitySurplus = Math.max(0, totalDownPaymentAvailable - totalPurchaseCost);

    // Monthly Mortgage Payments
    const currentMonthlyPayment = defaultCurrentPayment > 0 
        ? defaultCurrentPayment 
        : calcCanadianMortgagePayment(muMortgage, defaultCurrentRate, 25);
    const newMonthlyPayment = calcCanadianMortgagePayment(requiredMortgage, mortgageRate, amortizationYears);
    const mortgagePaymentDelta = newMonthlyPayment - currentMonthlyPayment;

    // Monthly Carrying Cost Step-Up (Property Taxes & Utilities)
    const propertyValueDelta = Math.max(0, muNewValue - muCurrentValue);
    const monthlyPropertyTaxDelta = Math.round((propertyValueDelta * (propertyTaxRate / 100)) / 12);
    const monthlyUtilityDelta = Math.round((propertyValueDelta * 0.001) / 12 * 10); // ~$80-$150/mo estimate for larger home
    const totalMonthlyCarryingDelta = mortgagePaymentDelta + monthlyPropertyTaxDelta + monthlyUtilityDelta;

    // Canadian OSFI B-20 Stress Test & Qualifying Household Income
    const stressTestRate = Math.max(mortgageRate + 2.0, 5.25);
    const stressTestMonthlyPayment = calcCanadianMortgagePayment(requiredMortgage, stressTestRate, amortizationYears);
    const annualNewPropertyTax = Math.round(muNewValue * (propertyTaxRate / 100));
    const annualHeating = 2400; // standard bank benchmark
    const annualHousingCost = (stressTestMonthlyPayment * 12) + annualNewPropertyTax + annualHeating;
    const qualifyingGrossIncome = Math.round(annualHousingCost / 0.39); // 39% GDS benchmark

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative d-flex flex-column shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center">
                    <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{ width: '45px', height: '45px', flexShrink: 0 }}>
                        <i className="bi bi-houses-fill fs-4"></i>
                    </div>
                    <div>
                        <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Home Move-Up Analyzer</h5>
                        <span className="text-muted small">Friction costs, equity rollover, mortgage sizing, and monthly affordability.</span>
                    </div>
                </div>
                <InfoBtn 
                    align="right"
                    direction="down"
                    title="Canadian Home Move-Up Economics"
                    text="Moving up involves substantial transaction friction. Under Canadian rules, realtor commissions carry provincial sales tax (e.g. 13% HST in Ontario). Buyers also face Provincial Land Transfer Tax (plus Toronto MLTT if within the 416).<br><br>Under OSFI B-20 rules, buyers must qualify at the contract rate + 2.0% (or 5.25%) under a 39% Gross Debt Service (GDS) limit."
                />
            </div>

            {/* View Mode Switcher */}
            <div className="mb-3">
                <SegmentedControl 
                    value={viewTab}
                    onChange={(val: any) => setViewTab(val)}
                    options={[
                        { value: 'equity', label: '1. Equity & Closing Costs' },
                        { value: 'cashflow', label: '2. Monthly Payments & Stress Test' }
                    ]}
                />
            </div>

            {/* --- TAB 1: EQUITY WATERFALL & CLOSING COSTS --- */}
            {viewTab === 'equity' ? (
                <div className="d-flex flex-column gap-3 flex-grow-1">
                    {/* Inputs Grid */}
                    <div className="row g-3">
                        <div className="col-12 col-sm-6">
                            <label className="form-label small fw-bold text-muted mb-1">Current Home Value ($)</label>
                            <CurrencyInput 
                                value={muCurrentValue} 
                                onChange={(val: any) => setMuCurrentValue(val || 0)} 
                                placeholder="1,000,000"
                            />
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label small fw-bold text-muted mb-1">Existing Mortgage Balance ($)</label>
                            <CurrencyInput 
                                className="border-danger" 
                                value={muMortgage} 
                                onChange={(val: any) => setMuMortgage(val || 0)} 
                                placeholder="400,000"
                            />
                        </div>

                        <div className="col-12 col-sm-6">
                            <label className="form-label small fw-bold text-info mb-1">Target New Home Price ($)</label>
                            <CurrencyInput 
                                className="border-info text-info fw-bold" 
                                value={muNewValue} 
                                onChange={(val: any) => setMuNewValue(val || 0)} 
                                placeholder="1,450,000"
                            />
                        </div>
                        <div className="col-12 col-sm-6">
                            <label className="form-label small fw-bold text-muted mb-1 d-flex justify-content-between align-items-center">
                                <span>Extra Cash Down Payment ($)</span>
                                <span className="badge bg-secondary bg-opacity-25 text-muted fw-normal" style={{ fontSize: '0.68rem' }}>Savings / TFSA</span>
                            </label>
                            <CurrencyInput 
                                value={muAdditionalCash} 
                                onChange={(val: any) => setMuAdditionalCash(val || 0)} 
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Province & Location Switchers */}
                    <div className="p-3 bg-input border border-secondary rounded-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                            <span className="small text-muted fw-bold">Province:</span>
                            <select 
                                className="form-select form-select-sm bg-transparent border-secondary text-main fw-bold rounded-pill"
                                style={{ width: '110px' }}
                                value={province}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProvince(e.target.value)}
                            >
                                <option value="ON" className="bg-dark text-white">Ontario (ON)</option>
                                <option value="BC" className="bg-dark text-white">British Columbia (BC)</option>
                                <option value="AB" className="bg-dark text-white">Alberta (AB)</option>
                                <option value="QC" className="bg-dark text-white">Quebec (QC)</option>
                                <option value="OTHER" className="bg-dark text-white">Other</option>
                            </select>
                        </div>

                        {province === 'ON' && (
                            <div className="form-check form-switch mb-0 d-flex align-items-center">
                                <input 
                                    className="form-check-input cursor-pointer me-2" 
                                    type="checkbox" 
                                    id="torontoSwitch"
                                    checked={muToronto} 
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMuToronto(e.target.checked)} 
                                />
                                <label className="form-check-label small fw-bold text-muted cursor-pointer" htmlFor="torontoSwitch">
                                    Property in City of Toronto <span className="text-warning">(MLTT)</span>
                                </label>
                            </div>
                        )}
                    </div>

                    {/* Interactive Funding Stack Visualizer */}
                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-2 small">
                            <span className="fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>
                                New Purchase Funding Sources ({formatCurrency(totalPurchaseCost)})
                            </span>
                            <span className="text-info fw-bold">{((requiredMortgage / totalPurchaseCost) * 100).toFixed(1)}% Financed</span>
                        </div>
                        <div className="progress rounded-pill" style={{ height: '14px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                            <div 
                                className="progress-bar bg-success" 
                                role="progressbar" 
                                style={{ width: `${Math.min(100, (netProceeds / totalPurchaseCost) * 100)}%` }}
                                title={`Home Equity: ${formatCurrency(netProceeds)}`}
                            ></div>
                            {muAdditionalCash > 0 && (
                                <div 
                                    className="progress-bar bg-primary" 
                                    role="progressbar" 
                                    style={{ width: `${Math.min(100, (muAdditionalCash / totalPurchaseCost) * 100)}%` }}
                                    title={`Extra Cash: ${formatCurrency(muAdditionalCash)}`}
                                ></div>
                            )}
                            <div 
                                className="progress-bar bg-info" 
                                role="progressbar" 
                                style={{ width: `${Math.max(0, (requiredMortgage / totalPurchaseCost) * 100)}%` }}
                                title={`New Mortgage: ${formatCurrency(requiredMortgage)}`}
                            ></div>
                        </div>
                        <div className="d-flex justify-content-between small text-muted mt-2 pt-1 border-top border-secondary border-opacity-25" style={{ fontSize: '0.72rem' }}>
                            <span className="text-success fw-bold"><i className="bi bi-square-fill me-1"></i> Equity: {formatCurrency(netProceeds)}</span>
                            {muAdditionalCash > 0 && <span className="text-primary fw-bold"><i className="bi bi-square-fill me-1"></i> Cash: {formatCurrency(muAdditionalCash)}</span>}
                            <span className="text-info fw-bold"><i className="bi bi-square-fill me-1"></i> Loan: {formatCurrency(requiredMortgage)}</span>
                        </div>
                    </div>

                    {/* Closing Costs Drawer Toggle */}
                    <div>
                        <button 
                            type="button" 
                            className="btn btn-sm btn-link text-decoration-none p-0 d-flex align-items-center gap-1.5 text-muted small fw-bold"
                            onClick={() => setShowCostDetails(!showCostDetails)}
                        >
                            <i className={`bi ${showCostDetails ? 'bi-chevron-down' : 'bi-chevron-right'}`}></i>
                            <span>{showCostDetails ? 'Hide Itemized Closing Costs Receipt' : 'Customize Closing Costs & Taxes (Realtor HST, LTT, Legal)...'}</span>
                        </button>

                        {showCostDetails && (
                            <div className="p-3 bg-input border border-secondary rounded-3 mt-2 slide-down small">
                                <div className="row g-2 mb-2">
                                    <div className="col-6 col-sm-3">
                                        <label className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Realtor Comm. (%)</label>
                                        <PercentInput value={realtorCommissionPct} onChange={(val: any) => setRealtorCommissionPct(val ?? 5.0)} />
                                    </div>
                                    <div className="col-6 col-sm-3">
                                        <label className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Selling Legal ($)</label>
                                        <CurrencyInput value={sellingLegal} onChange={(val: any) => setSellingLegal(val || 0)} />
                                    </div>
                                    <div className="col-6 col-sm-3">
                                        <label className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Buying Legal ($)</label>
                                        <CurrencyInput value={buyingLegal} onChange={(val: any) => setBuyingLegal(val || 0)} />
                                    </div>
                                    <div className="col-6 col-sm-3">
                                        <label className="text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Moving/Staging ($)</label>
                                        <CurrencyInput value={movingCosts} onChange={(val: any) => setMovingCosts(val || 0)} />
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-2 mt-2">
                                    <div className="form-check form-switch mb-0">
                                        <input 
                                            className="form-check-input cursor-pointer me-2" 
                                            type="checkbox" 
                                            id="hstCommissionSwitch"
                                            checked={includeHstOnRealtor} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIncludeHstOnRealtor(e.target.checked)} 
                                        />
                                        <label className="form-check-label text-muted cursor-pointer" htmlFor="hstCommissionSwitch" style={{ fontSize: '0.72rem' }}>
                                            Add {Math.round(hstRate * 100)}% HST to Realtor Commission (+{formatCurrency(Math.round(realtorFee - (muCurrentValue * (realtorCommissionPct / 100))))})
                                        </label>
                                    </div>
                                    <div className="text-end">
                                        <span className="text-muted" style={{ fontSize: '0.72rem' }}>Est. Mortgage Break Penalty: </span>
                                        <input 
                                            type="number" 
                                            className="bg-transparent border border-secondary rounded px-2 py-0.5 text-main text-end"
                                            style={{ width: '90px', fontSize: '0.75rem' }} 
                                            value={mortgagePenalty || ''} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMortgagePenalty(Number(e.target.value) || 0)} 
                                            placeholder="$0"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Summary Card */}
                    <div className="bg-input border border-secondary rounded-4 p-3 mt-auto shadow-inner">
                        <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                            <span>Net Equity Cleared from Sale:</span>
                            <span className="fw-bold text-success">+{formatCurrency(netProceeds)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-1 text-danger small">
                            <span>Total Friction Lost (Fees, Taxes, Movers):</span>
                            <span className="fw-bold">-{formatCurrency(totalFrictionCosts)}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25 text-muted small">
                            <span>• Land Transfer Tax (PLTT {muToronto ? '+ MLTT' : ''}):</span>
                            <span className="text-danger fw-medium">-{formatCurrency(lttObj.totalLtt)}</span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center pt-1">
                            <div>
                                <span className="text-info fw-bolder text-uppercase ls-1 small d-block">Required New Mortgage</span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>Covers purchase + closing fees - net equity</span>
                            </div>
                            <div className="text-end">
                                <span className="fw-bolder fs-4 text-info">{formatCurrency(requiredMortgage)}</span>
                                {equitySurplus > 0 && (
                                    <span className="badge bg-success bg-opacity-25 text-success ms-2" style={{ fontSize: '0.7rem' }}>
                                        Mortgage Free + {formatCurrency(equitySurplus)} Cash
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* --- TAB 2: MONTHLY PAYMENTS & STRESS TEST --- */
                <div className="d-flex flex-column gap-3 flex-grow-1">
                    {/* Mortgage Setup Controls */}
                    <div className="row g-3">
                        <div className="col-6 col-sm-4">
                            <label className="form-label small fw-bold text-muted mb-1">Mortgage Rate (%)</label>
                            <PercentInput 
                                value={mortgageRate} 
                                onChange={(val: any) => setMortgageRate(val ?? 4.75)} 
                            />
                        </div>
                        <div className="col-6 col-sm-4">
                            <label className="form-label small fw-bold text-muted mb-1">Amortization</label>
                            <select 
                                className="form-select form-select-sm bg-input border-secondary text-main fw-bold rounded-pill h-100"
                                style={{ height: '38px' }}
                                value={amortizationYears}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAmortizationYears(Number(e.target.value))}
                            >
                                <option value={25} className="bg-dark text-white">25 Years</option>
                                <option value={30} className="bg-dark text-white">30 Years</option>
                                <option value={20} className="bg-dark text-white">20 Years</option>
                                <option value={15} className="bg-dark text-white">15 Years</option>
                            </select>
                        </div>
                        <div className="col-12 col-sm-4">
                            <label className="form-label small fw-bold text-muted mb-1">Est. Property Tax (%)</label>
                            <PercentInput 
                                value={propertyTaxRate} 
                                onChange={(val: any) => setPropertyTaxRate(val ?? 0.75)} 
                            />
                        </div>
                    </div>

                    {/* 3 Metric Cards for Monthly Affordability */}
                    <div className="row g-2">
                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                                    Current Payment
                                </span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-main">{formatCurrency(currentMonthlyPayment)}<span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>/mo</span></div>
                                    <span className="badge bg-secondary bg-opacity-25 text-muted mt-1" style={{ fontSize: '0.7rem' }}>
                                        {formatCurrency(muMortgage)} Principal
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-info bg-opacity-10 border border-info border-opacity-50 rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-info fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                                    Target Move-Up Payment
                                </span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-info">{formatCurrency(newMonthlyPayment)}<span className="text-info fw-normal opacity-75" style={{ fontSize: '0.75rem' }}>/mo</span></div>
                                    <span className="badge bg-info bg-opacity-25 text-info mt-1" style={{ fontSize: '0.7rem' }}>
                                        {mortgageRate}% • {amortizationYears}yr Amort.
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-warning bg-opacity-10 border border-warning border-opacity-50 rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-warning fw-bold text-uppercase" style={{ fontSize: '0.72rem' }}>
                                    Monthly Payment Step-Up
                                </span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-warning">+{formatCurrency(mortgagePaymentDelta)}<span className="text-warning fw-normal opacity-75" style={{ fontSize: '0.75rem' }}>/mo</span></div>
                                    <span className="badge bg-warning bg-opacity-25 text-warning mt-1" style={{ fontSize: '0.7rem' }}>
                                        +{((mortgagePaymentDelta / (currentMonthlyPayment || 1)) * 100).toFixed(0)}% Increase
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Carrying Cost Increase Card */}
                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-bold text-main small d-flex align-items-center gap-1.5">
                                <i className="bi bi-wallet2 text-warning"></i> Total Real Monthly Carrying Cost Increase
                            </span>
                            <span className="fs-6 fw-bold text-warning">+{formatCurrency(totalMonthlyCarryingDelta)}/mo</span>
                        </div>
                        <div className="d-flex flex-column gap-1 text-muted small" style={{ fontSize: '0.78rem' }}>
                            <div className="d-flex justify-content-between">
                                <span>• Mortgage Payment Difference:</span>
                                <span>+{formatCurrency(mortgagePaymentDelta)}/mo</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>• Higher Property Taxes on +{formatCurrency(propertyValueDelta)}:</span>
                                <span>+{formatCurrency(monthlyPropertyTaxDelta)}/mo</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>• Estimated Utilities & Maintenance Step-Up:</span>
                                <span>+{formatCurrency(monthlyUtilityDelta)}/mo</span>
                            </div>
                        </div>
                    </div>

                    {/* Canadian OSFI B-20 Stress Test Qualifying Card */}
                    <div className="p-3 bg-input border border-secondary rounded-4 mt-auto">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted fw-bold text-uppercase ls-1" style={{ fontSize: '0.72rem' }}>
                                <i className="bi bi-shield-lock-fill text-primary me-1"></i> OSFI B-20 Mortgage Stress Test
                            </span>
                            <span className="badge bg-primary bg-opacity-25 text-primary" style={{ fontSize: '0.7rem' }}>
                                Qualify at {stressTestRate.toFixed(2)}%
                            </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-baseline mt-2">
                            <div>
                                <span className="text-muted small d-block">Estimated Gross Household Income Required:</span>
                                <span className="text-muted" style={{ fontSize: '0.68rem' }}>Based on 39% Gross Debt Service (GDS) limit</span>
                            </div>
                            <span className="fs-4 fw-bolder text-primary">{formatCurrency(qualifyingGrossIncome)}<span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>/yr</span></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}