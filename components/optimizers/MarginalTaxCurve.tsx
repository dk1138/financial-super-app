'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { CurrencyInput, InfoBtn, SegmentedControl } from '../SharedUI';

// 2026 CRA & Provincial Tax Constants
const OAS_THRESHOLD_2026 = 95323;
const OAS_MAX_RECOVERY_2026 = 154708;

interface TaxBreakdown {
    income: number;
    baseFedRate: number;
    baseProvRate: number;
    surtaxRate: number;
    oasClawbackRate: number;
    gisClawbackRate: number;
    totalMarginalRate: number;
    statutoryRate: number;
}

/**
 * Computes statutory & effective marginal tax rate at a specific income point.
 */
function getMarginalBreakdown(income: number, province: string, isSenior: boolean, hasOas: boolean, hasGis: boolean): TaxBreakdown {
    if (income <= 0) {
        return {
            income: 0,
            baseFedRate: 0,
            baseProvRate: 0,
            surtaxRate: 0,
            oasClawbackRate: 0,
            gisClawbackRate: 0,
            totalMarginalRate: 0,
            statutoryRate: 0
        };
    }

    // --- 1. FEDERAL MARGINAL RATE ---
    let baseFedRate = 0.15;
    if (income > 253414) baseFedRate = 0.33;
    else if (income > 177882) baseFedRate = 0.29;
    else if (income > 114750) baseFedRate = 0.26;
    else if (income > 57375) baseFedRate = 0.205;
    else baseFedRate = 0.15;

    // --- 2. PROVINCIAL MARGINAL RATE ---
    let baseProvRate = 0.0505;
    let surtaxMultiplier = 0;

    if (province === 'ON') {
        if (income > 220000) baseProvRate = 0.1316;
        else if (income > 150000) baseProvRate = 0.1216;
        else if (income > 106717) baseProvRate = 0.1116;
        else if (income > 53359) baseProvRate = 0.0915;
        else baseProvRate = 0.0505;

        // Ontario Surtax effect on marginal rate
        // Tier 1 (> \$5,554 basic prov tax): +20% surtax on provincial tax
        // Tier 2 (> \$7,108 basic prov tax): additional +36% surtax (total 56% surtax)
        if (income > 96000) {
            surtaxMultiplier = 0.56;
        } else if (income > 82000) {
            surtaxMultiplier = 0.20;
        }
    } else if (province === 'BC') {
        if (income > 252752) baseProvRate = 0.205;
        else if (income > 181232) baseProvRate = 0.168;
        else if (income > 141444) baseProvRate = 0.147;
        else if (income > 110076) baseProvRate = 0.1229;
        else if (income > 93380) baseProvRate = 0.105;
        else if (income > 47937) baseProvRate = 0.077;
        else baseProvRate = 0.0506;
    } else if (province === 'AB') {
        if (income > 355845) baseProvRate = 0.15;
        else if (income > 241854) baseProvRate = 0.14;
        else if (income > 181471) baseProvRate = 0.13;
        else if (income > 151226) baseProvRate = 0.12;
        else baseProvRate = 0.10;
    } else {
        baseProvRate = income > 120000 ? 0.13 : (income > 60000 ? 0.09 : 0.05);
    }

    const surtaxRate = baseProvRate * surtaxMultiplier;
    const statutoryRate = baseFedRate + baseProvRate;

    // --- 3. OAS RECOVERY TAX (CLAWBACK) ---
    // 15% clawback on income exceeding \$95,323 until OAS is fully eliminated (~\$154,708)
    let oasClawbackRate = 0;
    if (isSenior && hasOas && income >= OAS_THRESHOLD_2026 && income <= OAS_MAX_RECOVERY_2026) {
        oasClawbackRate = 0.15;
    }

    // --- 4. GIS CLAWBACK (FOR LOW-INCOME SENIORS) ---
    let gisClawbackRate = 0;
    if (isSenior && hasGis && income < 22000) {
        gisClawbackRate = 0.50;
    }

    const totalMarginalRate = baseFedRate + baseProvRate + surtaxRate + oasClawbackRate + gisClawbackRate;

    return {
        income,
        baseFedRate: Math.round(baseFedRate * 1000) / 10,
        baseProvRate: Math.round(baseProvRate * 1000) / 10,
        surtaxRate: Math.round(surtaxRate * 1000) / 10,
        oasClawbackRate: Math.round(oasClawbackRate * 1000) / 10,
        gisClawbackRate: Math.round(gisClawbackRate * 1000) / 10,
        totalMarginalRate: Math.round(totalMarginalRate * 1000) / 10,
        statutoryRate: Math.round(statutoryRate * 1000) / 10
    };
}

export default function MarginalTaxCurve() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    const province = data.inputs.tax_province || data.inputs.province || 'ON';

    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    // Target Selection
    const [targetPlayer, setTargetPlayer] = useState<'p1' | 'p2'>('p1');
    const selectedPlayer = targetPlayer === 'p1' ? p1Name : p2Name;

    // Simulation inputs
    const defaultInc = Number(data.inputs[`${targetPlayer}_income`]) || 95000;
    const [customIncome, setCustomIncome] = useState<number>(defaultInc);
    const [isSenior, setIsSenior] = useState<boolean>(true); // Age 65+
    const [hasOas, setHasOas] = useState<boolean>(true);
    const [hasGis, setHasGis] = useState<boolean>(false);

    // Generate Curve Data (\$10,000 to \$200,000 sampled at \$2,500 intervals)
    const curveData = useMemo(() => {
        const points: any[] = [];
        for (let inc = 10000; inc <= 200000; inc += 2500) {
            const b = getMarginalBreakdown(inc, province, isSenior, hasOas, hasGis);
            points.push({
                income: inc,
                formattedInc: `$${(inc / 1000).toFixed(0)}k`,
                baseTax: b.baseFedRate + b.baseProvRate,
                surtax: b.surtaxRate,
                oasClawback: b.oasClawbackRate,
                gisClawback: b.gisClawbackRate,
                total: b.totalMarginalRate
            });
        }
        return points;
    }, [province, isSenior, hasOas, hasGis]);

    // Current point breakdown
    const currentBreakdown = useMemo(() => {
        return getMarginalBreakdown(customIncome, province, isSenior, hasOas, hasGis);
    }, [customIncome, province, isSenior, hasOas, hasGis]);

    // Headroom calculation
    const isInsideOasTrap = customIncome >= OAS_THRESHOLD_2026 && customIncome <= OAS_MAX_RECOVERY_2026;
    const oasHeadroom = OAS_THRESHOLD_2026 - customIncome;

    // What you keep from next \$1,000
    const next1000Tax = Math.round(1000 * (currentBreakdown.totalMarginalRate / 100));
    const next1000Keep = 1000 - next1000Tax;

    return (
        <div className="surface-card border border-secondary rounded-4 p-4 shadow-sm">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 border-bottom border-secondary pb-3 mb-4">
                <div>
                    <h5 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <i className="bi bi-graph-up text-primary"></i>
                        Marginal Tax Rate & Clawback Curve
                        <InfoBtn 
                            title="Effective Marginal Tax Rate (EMTR)" 
                            text="Shows the percentage of your next dollar of income lost to combined federal tax, provincial tax, provincial surtaxes, and federal benefit clawbacks (like the 15% OAS Recovery Tax)." 
                        />
                    </h5>
                    <p className="text-muted small mb-0">
                        Model exact marginal tax cliffs, Ontario surtaxes, and the CRA OAS recovery tax zone (\$95k–\$155k).
                    </p>
                </div>

                {isCouple && (
                    <div style={{ minWidth: '220px' }}>
                        <SegmentedControl 
                            value={targetPlayer}
                            onChange={(val: any) => {
                                setTargetPlayer(val);
                                const newInc = Number(data.inputs[`${val}_income`]) || 95000;
                                setCustomIncome(newInc);
                            }}
                            options={[
                                { value: 'p1', label: p1Name },
                                { value: 'p2', label: p2Name }
                            ]}
                        />
                    </div>
                )}
            </div>

            {/* Controls Bar */}
            <div className="row g-3 mb-4 p-3 bg-input border border-secondary rounded-4 shadow-inner">
                <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">
                        Tested Taxable Income (\$)
                    </label>
                    <CurrencyInput 
                        className="form-control"
                        value={customIncome}
                        onChange={(val: any) => setCustomIncome(Number(val) || 0)}
                        placeholder="Enter income..."
                    />
                </div>

                <div className="col-12 col-md-4">
                    <label className="form-label small fw-bold text-muted mb-1">Province</label>
                    <input 
                        type="text" 
                        readOnly 
                        className="form-control text-muted bg-transparent border border-secondary fw-bold"
                        value={province === 'ON' ? 'Ontario (ON)' : province === 'BC' ? 'British Columbia (BC)' : 'Alberta (AB)'}
                    />
                </div>

                <div className="col-12 col-md-4 d-flex align-items-end gap-3 pb-1">
                    <div className="form-check form-switch mb-0">
                        <input 
                            className="form-check-input cursor-pointer" 
                            type="checkbox" 
                            id="seniorToggle" 
                            checked={isSenior} 
                            onChange={e => setIsSenior(e.target.checked)} 
                        />
                        <label className="form-check-label small fw-bold text-main cursor-pointer" htmlFor="seniorToggle">
                            Age 65+ (OAS Eligible)
                        </label>
                    </div>

                    {isSenior && (
                        <div className="form-check form-switch mb-0">
                            <input 
                                className="form-check-input cursor-pointer" 
                                type="checkbox" 
                                id="oasToggle" 
                                checked={hasOas} 
                                onChange={e => setHasOas(e.target.checked)} 
                            />
                            <label className="form-check-label small fw-bold text-muted cursor-pointer" htmlFor="oasToggle">
                                Receive OAS
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                    <div className="p-3 border border-secondary rounded-4 bg-body shadow-sm h-100">
                        <span className="small text-muted fw-bold text-uppercase ls-1 d-block mb-1">
                            Effective Marginal Rate
                        </span>
                        <div className={`display-6 fw-bold ${currentBreakdown.totalMarginalRate >= 50 ? 'text-danger' : currentBreakdown.totalMarginalRate >= 40 ? 'text-warning' : 'text-primary'}`}>
                            {currentBreakdown.totalMarginalRate.toFixed(1)}%
                        </div>
                        <span className="small text-muted">
                            Statutory Rate: {currentBreakdown.statutoryRate.toFixed(1)}% {currentBreakdown.surtaxRate > 0 && `(+${currentBreakdown.surtaxRate}% Surtax)`}
                        </span>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className={`p-3 border rounded-4 shadow-sm h-100 ${isInsideOasTrap ? 'border-danger bg-danger bg-opacity-10' : 'border-secondary bg-body'}`}>
                        <span className="small text-muted fw-bold text-uppercase ls-1 d-block mb-1">
                            OAS Clawback Status
                        </span>
                        <div className={`fs-4 fw-bold ${isInsideOasTrap ? 'text-danger' : 'text-success'}`}>
                            {isInsideOasTrap ? 'Inside Clawback Zone' : (oasHeadroom > 0 ? 'Safe (Under Threshold)' : 'OAS Fully Clawed Back')}
                        </div>
                        <span className="small text-muted">
                            {oasHeadroom > 0 
                                ? `$${oasHeadroom.toLocaleString()} room before 15% clawback` 
                                : isInsideOasTrap 
                                    ? `Losing 15¢ per dollar ($${(customIncome - OAS_THRESHOLD_2026).toLocaleString()} over)` 
                                    : 'Exceeds maximum elimination threshold'}
                        </span>
                    </div>
                </div>

                <div className="col-12 col-md-4">
                    <div className="p-3 border border-secondary rounded-4 bg-body shadow-sm h-100">
                        <span className="small text-muted fw-bold text-uppercase ls-1 d-block mb-1">
                            Next \$1,000 Withdrawn
                        </span>
                        <div className="fs-4 fw-bold text-main">
                            Keep: <span className="text-success">\${next1000Keep}</span> <span className="small text-muted fw-normal fs-6">/ Pay: <span className="text-danger">\${next1000Tax}</span></span>
                        </div>
                        <span className="small text-muted">
                            Net keep rate: {(100 - currentBreakdown.totalMarginalRate).toFixed(1)}% on your next dollar
                        </span>
                    </div>
                </div>
            </div>

            {/* Interactive Visual Step Chart */}
            <div className="p-3 border border-secondary rounded-4 bg-body shadow-sm mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small fw-bold text-uppercase ls-1 text-muted">
                        Effective Marginal Tax Rate vs. Taxable Income
                    </span>
                    <div className="d-flex align-items-center gap-3 small">
                        <span className="d-flex align-items-center gap-1">
                            <span className="badge rounded-circle p-1 bg-primary"> </span> Base Tax
                        </span>
                        {province === 'ON' && (
                            <span className="d-flex align-items-center gap-1">
                                <span className="badge rounded-circle p-1 bg-warning"> </span> ON Surtax
                            </span>
                        )}
                        <span className="d-flex align-items-center gap-1">
                            <span className="badge rounded-circle p-1 bg-danger"> </span> OAS Clawback (15%)
                        </span>
                    </div>
                </div>

                <div style={{ height: '320px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={curveData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis 
                                dataKey="formattedInc" 
                                stroke="var(--bs-secondary-color)" 
                                fontSize={11}
                                tickLine={false}
                            />
                            <YAxis 
                                unit="%" 
                                stroke="var(--bs-secondary-color)" 
                                fontSize={11}
                                domain={[0, 70]} 
                                tickLine={false}
                            />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--bg-body)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                                formatter={(val: any, name: any) => [`${Number(val).toFixed(1)}%`, name === 'baseTax' ? 'Base Tax' : name === 'surtax' ? 'Ontario Surtax' : name === 'oasClawback' ? 'OAS Clawback' : 'Total Rate']}
                                labelFormatter={(label: any) => `Taxable Income: ${label}`}
                            />
                            
                            {/* Stacking the layers */}
                            <Area type="stepAfter" dataKey="baseTax" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} name="Base Federal & Provincial" />
                            <Area type="stepAfter" dataKey="surtax" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Ontario Surtax" />
                            <Area type="stepAfter" dataKey="oasClawback" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="OAS Clawback (+15%)" />

                            {/* Reference line for Tested Income */}
                            <ReferenceLine 
                                x={`$${(Math.round(customIncome / 2500) * 2.5).toFixed(0)}k`} 
                                stroke="#38bdf8" 
                                strokeWidth={2}
                                strokeDasharray="4 4"
                                label={{ value: `Tested: $${(customIncome / 1000).toFixed(0)}k`, position: 'top', fill: '#38bdf8', fontSize: 11, fontWeight: 'bold' }} 
                            />
                            {/* OAS Threshold Reference */}
                            <ReferenceLine 
                                x="\$95k" 
                                stroke="#ef4444" 
                                strokeDasharray="3 3" 
                                label={{ value: 'OAS Threshold (\$95.3k)', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }} 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Strategic Advice Card */}
            <div className="p-3 border border-secondary rounded-4 bg-body shadow-sm">
                <h6 className="fw-bold mb-2 text-main d-flex align-items-center gap-2">
                    <i className="bi bi-lightbulb-fill text-warning"></i>
                    Planning Strategy Takeaways
                </h6>
                <div className="row g-3 small text-muted">
                    <div className="col-12 col-md-6">
                        <div className="p-3 border border-secondary rounded-3 bg-input h-100">
                            <span className="fw-bold text-main d-block mb-1">
                                Early RRSP / RRIF Meltdown Window (Age 60–64)
                            </span>
                            If you wait until age 71 to convert your RRSP to a RRIF, mandatory minimum withdrawals combined with CPP and OAS will often push you directly into the <strong>53% to 60%</strong> clawback zone. Meltdown strategies between ages 60–64 allow you to draw down RRSP assets while your tax bracket is in the <strong>20% to 30%</strong> range, before OAS clawback begins.
                        </div>
                    </div>
                    <div className="col-12 col-md-6">
                        <div className="p-3 border border-secondary rounded-3 bg-input h-100">
                            <span className="fw-bold text-main d-block mb-1">
                                TFSA & Pension Splitting Shields
                            </span>
                            TFSA withdrawals do not count toward Net World Income ([Line 23600](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-23600-net-income.html)) and never trigger OAS recovery tax. If your household is a couple, utilizing Section 60.03 pension splitting on up to 50% of eligible RRIF/LIF income allows you to keep both partners under the <strong>\$95,323</strong> threshold.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}