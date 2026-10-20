'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { SegmentedControl, CurrencyInput, InfoBtn } from '../SharedUI';

/**
 * Provincial Probate Fee Rates (Estate Administration Tax).
 */
export function calculateProbateFee(estateValue: number, province: string): number {
    if (estateValue <= 0) return 0;

    switch (province) {
        case 'ON': // Ontario: \$0 on first \$50k, 1.5% (\$15 per \$1,000) on excess
            return estateValue > 50000 ? Math.round((estateValue - 50000) * 0.015) : 0;
        case 'BC': // British Columbia: 0% up to \$25k, 0.6% on \$25k-\$50k, 1.4% on excess over \$50k
            if (estateValue <= 25000) return 0;
            if (estateValue <= 50000) return Math.round((estateValue - 25000) * 0.006);
            return Math.round(150 + (estateValue - 50000) * 0.014);
        case 'AB': // Alberta: Tiered flat fees capped at \$525
            if (estateValue <= 10000) return 35;
            if (estateValue <= 25000) return 135;
            if (estateValue <= 125000) return 275;
            if (estateValue <= 250000) return 400;
            return 525;
        case 'QC': // Quebec: Nominal court filing fee (~\$65-\$110); notarial wills bypass probate entirely
            return 100;
        case 'NS': // Nova Scotia: Progressive sliding scale (~1.69% on large estates)
            if (estateValue <= 10000) return Math.round(estateValue * 0.01);
            return Math.round(1000 + (estateValue - 100000) * 0.01695);
        default: // Canadian provincial average (~1.4%)
            return Math.round(estateValue * 0.014);
    }
}

export default function EstateTaxCalculator() {
    const { data } = useFinance();
    const province = data.inputs.tax_province || 'ON';
    const isCouple = data.mode === 'Couple';

    const defaultRrspRrif = (Number(data.inputs.p1_rrsp) || 0) + (Number(data.inputs.p1_rrif_acct) || 0) + (Number(data.inputs.p1_lif) || 0);
    const defaultNonReg = Number(data.inputs.p1_nonreg) || 0;
    const defaultTfsa = Number(data.inputs.p1_tfsa) || 0;

    const [scenario, setScenario] = useState<'second_death' | 'first_death'>('second_death');
    const [rrspRrifBalance, setRrspRrifBalance] = useState<number>(defaultRrspRrif || 250000);
    const [nonRegValue, setNonRegValue] = useState<number>(defaultNonReg || 150000);
    const [nonRegAcb, setNonRegAcb] = useState<number>(Math.round((defaultNonReg || 150000) * 0.60));
    const [secondaryPropertyVal, setSecondaryPropertyVal] = useState<number>(300000);
    const [secondaryPropertyAcb, setSecondaryPropertyAcb] = useState<number>(150000);
    const [tfsaBalance, setTfsaBalance] = useState<number>(defaultTfsa || 75000);
    const [lifeInsuranceBenefit, setLifeInsuranceBenefit] = useState<number>(0);
    const [charitableBequest, setCharitableBequest] = useState<number>(0);

    const calculations = useMemo(() => {
        // --- 1. FIRST DEATH: SPOUSAL ROLLOVER ---
        if (scenario === 'first_death') {
            return {
                isSpousalRollover: true,
                terminalIncome: 0,
                craTaxLiability: 0,
                probateFee: 0,
                totalEstateDeductions: 0,
                netEstateToBeneficiaries: rrspRrifBalance + nonRegValue + secondaryPropertyVal + tfsaBalance,
                liquiditySurplusOrDeficit: tfsaBalance + lifeInsuranceBenefit,
                capitalGainNonReg: 0,
                capitalGainProperty: 0
            };
        }

        // --- 2. SECOND DEATH: FULL DEEMED DISPOSITION ---
        // Capital Gains
        const capitalGainNonReg = Math.max(0, nonRegValue - nonRegAcb);
        const capitalGainProperty = Math.max(0, secondaryPropertyVal - secondaryPropertyAcb);
        const totalCapitalGain = capitalGainNonReg + capitalGainProperty;

        // Budget 2024 Tiered Inclusion: 50% on first \$250k, 66.67% on excess
        let taxableCapitalGain = 0;
        if (totalCapitalGain <= 250000) {
            taxableCapitalGain = totalCapitalGain * 0.50;
        } else {
            taxableCapitalGain = (250000 * 0.50) + ((totalCapitalGain - 250000) * (2 / 3));
        }

        // 100% of remaining RRSP / RRIF / LIF is fully taxable in final tax return
        const terminalTaxableIncome = rrspRrifBalance + taxableCapitalGain;

        // Effective final year tax estimate (approximate combined top marginal bracket ~53.53% in ON, adjusted for progressive brackets)
        const topBracketTaxRate = province === 'AB' ? 0.48 : province === 'BC' ? 0.535 : 0.5353;
        let estimatedFinalTax = terminalTaxableIncome * topBracketTaxRate;

        // Charitable donation tax credit in year of death (can offset up to 100% of net income at top 33% fed + prov credit ~50%)
        if (charitableBequest > 0) {
            const donationTaxSavings = Math.min(estimatedFinalTax, charitableBequest * 0.50);
            estimatedFinalTax = Math.max(0, estimatedFinalTax - donationTaxSavings);
        }

        // Probate fees (assets passing through will: non-reg, secondary real estate. RRSP & TFSA with named beneficiaries bypass probate!)
        const estateSubjectToProbate = nonRegValue + secondaryPropertyVal;
        const probateFee = calculateProbateFee(estateSubjectToProbate, province);

        const totalEstateDeductions = Math.round(estimatedFinalTax + probateFee);
        const totalGrossAssets = rrspRrifBalance + nonRegValue + secondaryPropertyVal + tfsaBalance + lifeInsuranceBenefit;
        const netEstateToBeneficiaries = Math.max(0, totalGrossAssets - totalEstateDeductions);

        // Liquidity evaluation: Can liquid funds (TFSA + Insurance + Non-Reg) cover CRA & Probate?
        const availableLiquidCapital = nonRegValue + tfsaBalance + lifeInsuranceBenefit;
        const liquiditySurplusOrDeficit = availableLiquidCapital - totalEstateDeductions;

        return {
            isSpousalRollover: false,
            terminalIncome: Math.round(terminalTaxableIncome),
            craTaxLiability: Math.round(estimatedFinalTax),
            probateFee: Math.round(probateFee),
            totalEstateDeductions,
            netEstateToBeneficiaries: Math.round(netEstateToBeneficiaries),
            liquiditySurplusOrDeficit: Math.round(liquiditySurplusOrDeficit),
            capitalGainNonReg: Math.round(capitalGainNonReg),
            capitalGainProperty: Math.round(capitalGainProperty)
        };
    }, [
        scenario, rrspRrifBalance, nonRegValue, nonRegAcb, 
        secondaryPropertyVal, secondaryPropertyAcb, tfsaBalance, 
        lifeInsuranceBenefit, charitableBequest, province
    ]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-bank2 fs-4"></i>
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Canadian Estate & Final Tax Calculator</h5>
                        <InfoBtn 
                            title="Canada Deemed Disposition at Death" 
                            text="Under Canadian tax law (ITA s. 70(5)), you are deemed to have sold all capital assets at fair market value immediately prior to death. In addition, 100% of your remaining RRSP/RRIF balance is added to your final income in one lump sum.<br><br><b>Spousal Rollover:</b> Taxes are deferred if transferred to a surviving spouse, but upon the second death, the full tax liability hits at top marginal rates (~53.5%)."
                            align="right"
                        />
                    </div>
                </div>
            </div>

            <p className="text-muted small mb-3">
                Simulate the CRA deemed disposition at death, calculate provincial probate fees, and identify any liquidity gaps that would force heirs to sell assets.
            </p>

            {/* Scenario Selector */}
            <div className="mb-3">
                <SegmentedControl 
                    value={scenario}
                    onChange={(val: any) => setScenario(val)}
                    options={[
                        { value: 'second_death', label: 'Second Death / Single (Taxable Deemed Disposition)' },
                        { value: 'first_death', label: 'First Death (100% Spousal Rollover)' }
                    ]}
                />
            </div>

            {scenario === 'first_death' ? (
                /* Spousal Rollover View */
                <div className="p-4 bg-success bg-opacity-10 border border-success border-opacity-50 rounded-4 text-center d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mb-3 shadow-sm" style={{width: '48px', height: '48px'}}>
                        <i className="bi bi-heart-fill fs-4"></i>
                    </div>
                    <h5 className="fw-bold text-success mb-2">100% Tax-Deferred Spousal Rollover (ITA s. 70(6))</h5>
                    <p className="text-muted small mb-3" style={{maxWidth: '480px'}}>
                        Under Canadian law, when an individual passes away leaving assets to a surviving spouse or common-law partner, RRSPs/RRIFs, TFSAs, and capital properties roll over on a completely tax-deferred basis. Zero immediate deemed disposition tax is payable to the CRA.
                    </p>
                    <span className="badge bg-success bg-opacity-25 text-success py-2 px-3 fw-bold">
                        Estimated CRA Tax: \$0 • Probate: \$0
                    </span>
                </div>
            ) : (
                /* Second Death Detailed Breakdown */
                <div className="d-flex flex-column gap-3 flex-grow-1">
                    {/* Asset Inputs Grid */}
                    <div className="row g-2">
                        <div className="col-12 col-md-6">
                            <label className="form-label small text-muted fw-bold mb-1">RRSP / RRIF / LIF Balance (\$)</label>
                            <CurrencyInput value={rrspRrifBalance} onChange={(v: any) => setRrspRrifBalance(v || 0)} placeholder="250,000" />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label small text-muted fw-bold mb-1">TFSA Balance (Tax-Free)</label>
                            <CurrencyInput value={tfsaBalance} onChange={(v: any) => setTfsaBalance(v || 0)} placeholder="75,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Non-Reg Portfolio (\$)</label>
                            <CurrencyInput value={nonRegValue} onChange={(v: any) => setNonRegValue(v || 0)} placeholder="150,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Non-Reg Cost Base (ACB)</label>
                            <CurrencyInput value={nonRegAcb} onChange={(v: any) => setNonRegAcb(v || 0)} placeholder="90,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Secondary Real Estate (Cottage)</label>
                            <CurrencyInput value={secondaryPropertyVal} onChange={(v: any) => setSecondaryPropertyVal(v || 0)} placeholder="300,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Cottage Cost Base (ACB)</label>
                            <CurrencyInput value={secondaryPropertyAcb} onChange={(v: any) => setSecondaryPropertyAcb(v || 0)} placeholder="150,000" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Life Insurance Death Benefit</label>
                            <CurrencyInput value={lifeInsuranceBenefit} onChange={(v: any) => setLifeInsuranceBenefit(v || 0)} placeholder="0" />
                        </div>
                        <div className="col-6">
                            <label className="form-label small text-muted fw-bold mb-1">Charitable Bequest Donation</label>
                            <CurrencyInput value={charitableBequest} onChange={(v: any) => setCharitableBequest(v || 0)} placeholder="0" />
                        </div>
                    </div>

                    {/* Summary Result Cards */}
                    <div className="row g-2 mt-1">
                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-50 rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-danger fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>Est. CRA Terminal Tax</span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-danger">{formatCurrency(calculations.craTaxLiability)}</div>
                                    <span className="badge bg-danger bg-opacity-25 text-danger mt-1" style={{fontSize: '0.7rem'}}>
                                        Income + Cap Gains (Budget 2024)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>Probate Fees ({province})</span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-main">{formatCurrency(calculations.probateFee)}</div>
                                    <span className="badge bg-secondary bg-opacity-25 text-muted mt-1" style={{fontSize: '0.7rem'}}>
                                        Estate Admin Tax
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-4">
                            <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-50 rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-success fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>Net Estate to Heirs</span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-success">{formatCurrency(calculations.netEstateToBeneficiaries)}</div>
                                    <span className="badge bg-success bg-opacity-25 text-success mt-1" style={{fontSize: '0.7rem'}}>
                                        After Taxes & Probate
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Liquidity Alert / Heirs Protection */}
                    <div className={`p-3 rounded-3 border small ${calculations.liquiditySurplusOrDeficit >= 0 ? 'bg-success bg-opacity-10 border-success text-success' : 'bg-warning bg-opacity-10 border-warning text-warning'}`}>
                        <div className="d-flex align-items-center fw-bold mb-1">
                            <i className={`bi me-2 ${calculations.liquiditySurplusOrDeficit >= 0 ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'}`}></i>
                            {calculations.liquiditySurplusOrDeficit >= 0 ? 'Estate Has Sufficient Liquidity' : 'Potential Estate Liquidity Deficit (Forced Sale Risk)'}
                        </div>
                        <p className="mb-0 text-muted" style={{fontSize: '0.78rem', lineHeight: 1.4}}>
                            {calculations.liquiditySurplusOrDeficit >= 0
                                ? `Your estate has ${formatCurrency(calculations.liquiditySurplusOrDeficit)} in surplus liquid capital to cover CRA taxes without forcing beneficiaries to liquidate non-liquid assets.`
                                : `Your estate faces a ${formatCurrency(Math.abs(calculations.liquiditySurplusOrDeficit))} liquidity shortfall. Beneficiaries may be forced to sell the cottage or borrow funds to settle the CRA tax bill unless funded with a permanent life insurance policy.`}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}