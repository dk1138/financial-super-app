'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { SegmentedControl, CurrencyInput, InfoBtn } from '../SharedUI';

/**
 * Service Canada Guaranteed Income Supplement (GIS) parameters.
 * Indexed to CPI quarterly; baseline values representative of 2024-2026.
 */
export const GIS_CONSTANTS = {
    SINGLE_MAX_ANNUAL: 13043,        // ~$1,086.88/mo
    SINGLE_INCOME_CUTOFF: 22056,
    COUPLE_BOTH_MAX_EACH: 7851,       // ~$654.23/mo each (~$15,702 total couple)
    COUPLE_BOTH_CUTOFF: 29136,
    COUPLE_ONE_MAX: 13043,
    COUPLE_ONE_CUTOFF: 52848,
    EMPLOYMENT_EXEMPTION_BASE: 5000,
    EMPLOYMENT_EXEMPTION_MAX: 15000
};

export function calculateGIS(
    maritalStatus: 'single' | 'couple_both' | 'couple_one',
    netIncomeExOAS: number,
    employmentIncome: number = 0
): { annualGIS: number; monthlyGIS: number; clawback: number; maxBenefit: number; cutoff: number } {
    // Employment income exemption: 100% of first $5,000, 50% of next $10,000
    let exemptEmployment = 0;
    if (employmentIncome > 0) {
        let tier1 = Math.min(employmentIncome, GIS_CONSTANTS.EMPLOYMENT_EXEMPTION_BASE);
        let tier2 = Math.min(Math.max(0, employmentIncome - GIS_CONSTANTS.EMPLOYMENT_EXEMPTION_BASE), 10000) * 0.50;
        exemptEmployment = tier1 + tier2;
    }

    const countableIncome = Math.max(0, netIncomeExOAS - exemptEmployment);

    let maxBenefit = GIS_CONSTANTS.SINGLE_MAX_ANNUAL;
    let cutoff = GIS_CONSTANTS.SINGLE_INCOME_CUTOFF;
    let clawbackRate = 0.50;

    if (maritalStatus === 'couple_both') {
        maxBenefit = GIS_CONSTANTS.COUPLE_BOTH_MAX_EACH * 2; // Household total
        cutoff = GIS_CONSTANTS.COUPLE_BOTH_CUTOFF;
        clawbackRate = 0.50;
    } else if (maritalStatus === 'couple_one') {
        maxBenefit = GIS_CONSTANTS.COUPLE_ONE_MAX;
        cutoff = GIS_CONSTANTS.COUPLE_ONE_CUTOFF;
        clawbackRate = 0.25;
    }

    if (countableIncome >= cutoff) {
        return { annualGIS: 0, monthlyGIS: 0, clawback: maxBenefit, maxBenefit, cutoff };
    }

    // Standard clawback formula: reduction based on qualifying income
    const reduction = Math.min(maxBenefit, countableIncome * (maxBenefit / cutoff));
    const annualGIS = Math.max(0, maxBenefit - reduction);

    return {
        annualGIS: Math.round(annualGIS),
        monthlyGIS: Math.round(annualGIS / 12),
        clawback: Math.round(reduction),
        maxBenefit,
        cutoff
    };
}

export default function GISMaximizer() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    const [householdType, setHouseholdType] = useState<'single' | 'couple_both' | 'couple_one'>(
        isCouple ? 'couple_both' : 'single'
    );
    const [cppIncome, setCppIncome] = useState<number>(8000);
    const [pensionIncome, setPensionIncome] = useState<number>(0);
    const [rrspRrifIncome, setRrspRrifIncome] = useState<number>(12000);
    const [tfsaWithdrawal, setTfsaWithdrawal] = useState<number>(10000);
    const [workIncome, setWorkIncome] = useState<number>(0);
    const [activeTab, setActiveTab] = useState<'calculator' | 'meltdown'>('calculator');

    // Total taxable income excluding OAS (CRA rules: OAS is never counted against GIS)
    const taxableIncomeExOAS = Math.max(0, cppIncome + pensionIncome + rrspRrifIncome + workIncome);

    // Current GIS entitlement
    const currentGIS = useMemo(() => {
        return calculateGIS(householdType, taxableIncomeExOAS, workIncome);
    }, [householdType, taxableIncomeExOAS, workIncome]);

    // Optimized GIS entitlement (Simulating shifting RRSP withdrawals to TFSA)
    const optimizedTaxableIncome = Math.max(0, cppIncome + pensionIncome + workIncome);
    const optimizedGIS = useMemo(() => {
        return calculateGIS(householdType, optimizedTaxableIncome, workIncome);
    }, [householdType, optimizedTaxableIncome, workIncome]);

    const gisGainByMeltdown = Math.max(0, optimizedGIS.annualGIS - currentGIS.annualGIS);
    const sixYearCumulativeBenefit = gisGainByMeltdown * 6; // Ages 65 to 71

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-shield-fill-check fs-4"></i>
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">GIS & Low-Income Maximizer</h5>
                        <InfoBtn 
                            title="Guaranteed Income Supplement (GIS) Strategy" 
                            text="The GIS provides up to $13,000+/year of completely tax-free income to Canadian seniors aged 65+. However, it has an aggressive <b>50% clawback</b> on net taxable income (excluding OAS).<br><br><b>The Meltdown Strategy:</b> Because TFSA withdrawals are non-taxable and completely invisible to GIS, drawing from your TFSA instead of an RRSP between ages 65–71 can unlock tens of thousands in tax-free government benefits."
                            align="right"
                        />
                    </div>
                </div>
            </div>

            {/* Subtitle */}
            <p className="text-muted small mb-3">
                Calculate your tax-free Guaranteed Income Supplement (GIS) entitlement and test the <strong>Early RRSP Meltdown Strategy</strong> to eliminate the 50% GIS clawback.
            </p>

            {/* Marital Status Selector */}
            <div className="mb-3">
                <SegmentedControl 
                    value={householdType}
                    onChange={(val: any) => setHouseholdType(val)}
                    options={[
                        { value: 'single', label: 'Single / Widowed' },
                        { value: 'couple_both', label: 'Couple (Both 65+ OAS)' },
                        { value: 'couple_one', label: 'Couple (One 65+)' }
                    ]}
                />
            </div>

            {/* View Mode Toggle */}
            <div className="mb-3">
                <SegmentedControl 
                    value={activeTab}
                    onChange={(val: any) => setActiveTab(val)}
                    options={[
                        { value: 'calculator', label: 'GIS Entitlement Calculator' },
                        { value: 'meltdown', label: 'RRSP-to-TFSA Meltdown Strategy' }
                    ]}
                />
            </div>

            {activeTab === 'calculator' ? (
                <div className="d-flex flex-column gap-3 flex-grow-1">
                    {/* Income Inputs Grid */}
                    <div className="row g-2">
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Annual CPP Pension ($)</label>
                            <CurrencyInput value={cppIncome} onChange={(v: any) => setCppIncome(v || 0)} placeholder="8,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">RRSP / RRIF Draw ($)</label>
                            <CurrencyInput value={rrspRrifIncome} onChange={(v: any) => setRrspRrifIncome(v || 0)} placeholder="12,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Company Pension / Other ($)</label>
                            <CurrencyInput value={pensionIncome} onChange={(v: any) => setPensionIncome(v || 0)} placeholder="0" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Employment / Business ($)</label>
                            <CurrencyInput value={workIncome} onChange={(v: any) => setWorkIncome(v || 0)} placeholder="0" />
                        </div>
                    </div>

                    {/* Results Cards */}
                    <div className="row g-2 mt-1">
                        <div className="col-6 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>GIS Entitlement</span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-success">{formatCurrency(currentGIS.annualGIS)}</div>
                                    <span className="badge bg-success bg-opacity-25 text-success mt-1" style={{fontSize: '0.7rem'}}>
                                        {formatCurrency(currentGIS.monthlyGIS)}/mo (Tax-Free)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>GIS Lost (Clawback)</span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-danger">-{formatCurrency(currentGIS.clawback)}</div>
                                    <span className="badge bg-danger bg-opacity-25 text-danger mt-1" style={{fontSize: '0.7rem'}}>
                                        50% Clawback Rate
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>Income Cutoff</span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-main">{formatCurrency(currentGIS.cutoff)}</div>
                                    <span className="badge bg-secondary bg-opacity-25 text-muted mt-1" style={{fontSize: '0.7rem'}}>
                                        Excludes OAS Pension
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 small mt-auto">
                        <div className="d-flex align-items-center mb-1 text-success fw-bold">
                            <i className="bi bi-lightbulb-fill me-2"></i> Service Canada Rules:
                        </div>
                        <p className="text-muted mb-0" style={{fontSize: '0.78rem', lineHeight: 1.4}}>
                            OAS is 100% exempt from GIS calculations. The first $5,000 of employment income is completely exempt, and the next $10,000 receives a 50% exemption.
                        </p>
                    </div>
                </div>
            ) : (
                /* Meltdown Strategy View */
                <div className="d-flex flex-column gap-3 flex-grow-1">
                    <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-50 rounded-3">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="small text-success fw-bold text-uppercase" style={{fontSize: '0.75rem'}}>
                                    Unlocking Tax-Free GIS (Age 65 to 71)
                                </span>
                                <div className="fs-4 fw-bold text-success mt-1">
                                    +{formatCurrency(gisGainByMeltdown)} <span className="fs-6 text-muted fw-normal">/year</span>
                                </div>
                            </div>
                            <div className="text-end">
                                <span className="small text-muted fw-bold">6-Year Total Gain</span>
                                <div className="fs-5 fw-bold text-main">+{formatCurrency(sixYearCumulativeBenefit)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Breakdown Table */}
                    <div className="table-responsive border border-secondary rounded-3">
                        <table className="table table-sm table-hover mb-0 align-middle text-nowrap" style={{fontSize: '0.8rem'}}>
                            <thead className="surface-card border-bottom border-secondary text-muted">
                                <tr>
                                    <th>Strategy</th>
                                    <th className="text-end">Taxable Income</th>
                                    <th className="text-end">GIS Benefit</th>
                                    <th className="text-end">Effective Tax Drag</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><span className="badge bg-danger bg-opacity-25 text-danger me-2">Standard</span> Draw RRSP at 65+</td>
                                    <td className="text-end text-muted">{formatCurrency(taxableIncomeExOAS)}</td>
                                    <td className="text-end text-danger">{formatCurrency(currentGIS.annualGIS)}</td>
                                    <td className="text-end text-danger">~70% (Tax + 50% Clawback)</td>
                                </tr>
                                <tr className="table-success bg-opacity-10">
                                    <td><span className="badge bg-success bg-opacity-25 text-success me-2">Optimized</span> TFSA Draw at 65+</td>
                                    <td className="text-end fw-bold text-success">{formatCurrency(optimizedTaxableIncome)}</td>
                                    <td className="text-end fw-bold text-success">{formatCurrency(optimizedGIS.annualGIS)}</td>
                                    <td className="text-end fw-bold text-success">0% Clawback</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Explanatory bullet points */}
                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 small">
                        <div className="fw-bold text-main mb-1">How the 60–64 Meltdown Works:</div>
                        <ol className="text-muted ps-3 mb-0" style={{fontSize: '0.78rem', lineHeight: 1.45}}>
                            <li>Deregister modest RRSP balances between ages 60–64 (or retire early) and move funds into your TFSA.</li>
                            <li>Between ages 65 and 71, fund your living expenses entirely from your TFSA (non-taxable).</li>
                            <li>Because your taxable income stays under the GIS cutoff, Service Canada pays you full tax-free GIS until mandatory RRIF conversions begin at age 72.</li>
                        </ol>
                    </div>
                </div>
            )}
        </div>
    );
}