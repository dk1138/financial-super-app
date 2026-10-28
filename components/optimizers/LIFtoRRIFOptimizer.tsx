'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { getRrifFactor, getLifMaxFactor, calcLifMaxLimit } from '../../lib/engine/benefits';
import { SegmentedControl, CurrencyInput, PercentInput, StepperInput, InfoBtn } from '../SharedUI';

export default function LIFtoRRIFOptimizer() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    const useRealDollars = Boolean(
        data.useRealDollars === true || 
        data.inputs?.todays_dollars === true || 
        data.inputs?.use_real_dollars === true ||
        data.inputs?.useRealDollars === true
    );
    const inflationRate = (data.inputs?.inflation_rate !== undefined && data.inputs?.inflation_rate !== '' ? Number(data.inputs.inflation_rate) : 2.1) / 100;

    const [activeTarget, setActiveTarget] = useState<'p1' | 'p2'>('p1');
    const [overrideBalance, setOverrideBalance] = useState<number | ''>('');
    const [overrideAge, setOverrideAge] = useState<number | ''>('');
    const [growthRate, setGrowthRate] = useState<number>(5.0);
    const [priorReturnRate, setPriorReturnRate] = useState<number | ''>('');
    const [viewMode, setViewMode] = useState<'summary' | 'schedule'>('summary');

    const defaultAge = Math.max(55, Number(data.inputs[`${activeTarget}_age`]) || 65);
    const defaultLifBalance = Number(data.inputs[`${activeTarget}_lif`]) || (activeTarget === 'p1' ? 100000 : 0);
    const province = data.inputs.tax_province || 'ON';

    const currentAge = overrideAge !== '' ? Number(overrideAge) : defaultAge;
    const currentBalance = overrideBalance !== '' ? Number(overrideBalance) : defaultLifBalance;

    const calculations = useMemo(() => {
        const ageForFactors = Math.max(55, currentAge);
        const r = growthRate / 100;
        const priorR = priorReturnRate !== '' 
            ? Number(priorReturnRate) / 100 
            : (data.inputs[`${activeTarget}_lif_prior_return`] !== undefined && data.inputs[`${activeTarget}_lif_prior_return`] !== '' 
                ? Number(data.inputs[`${activeTarget}_lif_prior_return`]) / 100 
                : r);
        const minRate = getRrifFactor(ageForFactors - 1);
        const baseMaxRate = getLifMaxFactor(ageForFactors - 1, province);

        const estimatedPriorGrowth = currentBalance * priorR;
        const currentMin = currentBalance * minRate;
        const currentMax = calcLifMaxLimit(ageForFactors - 1, province, currentBalance, estimatedPriorGrowth);
        const effectiveMaxRate = currentBalance > 0 ? (currentMax / currentBalance) : baseMaxRate;
        const isPriorReturnHigher = estimatedPriorGrowth > (currentBalance * baseMaxRate);
        const currentTransfer = Math.max(0, currentMax - currentMin);

        // 10-year projection comparing status-quo vs unlocking strategy
        const schedule: Array<{
            year: number;
            age: number;
            openingLif: number;
            minWithdrawal: number;
            transferredToRrif: number;
            closingLif: number;
            rrifFromTransfers: number;
            cumulativeUnlocked: number;
        }> = [];

        let simLif = currentBalance;
        let simRrif = 0;
        let cumUnlocked = 0;
        let priorYearGrowth = estimatedPriorGrowth;

        for (let y = 1; y <= 10; y++) {
            const ageYear = currentAge + y - 1;
            const yMinRate = getRrifFactor(ageYear - 1);
            const yMax = calcLifMaxLimit(ageYear - 1, province, simLif, priorYearGrowth);

            const yMin = simLif * yMinRate;
            const yTransfer = Math.max(0, yMax - yMin);

            cumUnlocked += yTransfer;
            const remainingLif = Math.max(0, simLif - yMin - yTransfer);
            const growthEarned = remainingLif * r;
            simLif = remainingLif + growthEarned;
            simRrif = (simRrif + yTransfer) * (1 + r);
            priorYearGrowth = growthEarned;

            // If "Today's \$" mode is active, deflate future values to constant purchasing power
            const deflator = useRealDollars ? Math.pow(1 + inflationRate, y - 1) : 1;
            const openNominal = simLif / (1 + r) + yMin + yTransfer;

            schedule.push({
                year: y,
                age: ageYear,
                openingLif: Math.round(openNominal / deflator),
                minWithdrawal: Math.round(yMin / deflator),
                transferredToRrif: Math.round(yTransfer / deflator),
                closingLif: Math.round(simLif / deflator),
                rrifFromTransfers: Math.round(simRrif / deflator),
                cumulativeUnlocked: Math.round(cumUnlocked / deflator)
            });

            if (simLif <= 0 && y >= 3) break;
        }

        return {
            minRate,
            maxRate: effectiveMaxRate,
            baseMaxRate,
            currentMin,
            currentMax,
            currentTransfer,
            isPriorReturnHigher,
            schedule,
            totalUnlocked10Yr: cumUnlocked
        };
    }, [currentAge, currentBalance, province, growthRate, priorReturnRate, activeTarget, data.inputs, useRealDollars, inflationRate]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative d-flex flex-column shadow-sm">
            {/* Header */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-unlock-fill fs-4"></i>
                </div>
                <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                        <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">LIF to RRIF Flexibility Optimizer</h5>
                        <InfoBtn 
                            title="LIF to RRIF Unlocking Transfer"
                            text="Life Income Funds (LIFs) enforce both minimum and maximum annual withdrawal limits. Under Canadian pension regulations (e.g. ON, BC, AB, NL, MB), the maximum is the greater of the age percentage limit or the previous year's investment return. Under Canadian tax law (ITA 60(l)), you can take the mandatory minimum in taxable cash and transfer the difference between the maximum and minimum directly into an unlocked RRIF without triggering immediate tax or consuming RRSP room.<br><br>This unlocks future liquidity since RRIFs have no maximum withdrawal ceiling."
                            align="right"
                        />
                    </div>
                </div>
            </div>

            {/* Target Selector for Couples */}
            {isCouple && (
                <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                    <SegmentedControl 
                        value={activeTarget} 
                        onChange={(val: any) => {
                            setActiveTarget(val);
                            setOverrideBalance('');
                            setOverrideAge('');
                        }} 
                        options={[
                            { value: 'p1', label: p1Name },
                            { value: 'p2', label: p2Name }
                        ]} 
                    />
                </div>
            )}

            <p className="text-muted small mb-3">
                Calculate your annual tax-deferred transfer from your locked-in LIF to an unlocked RRIF to systematically eliminate LIF maximum withdrawal restrictions.
            </p>

            {/* Inputs Grid */}
            <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                    <label className="form-label small text-muted fw-bold mb-1">Jan 1 LIF Balance ($)</label>
                    <CurrencyInput 
                        value={overrideBalance !== '' ? overrideBalance : defaultLifBalance} 
                        onChange={(val: any) => setOverrideBalance(val)} 
                        placeholder="100,000"
                    />
                </div>
                <div className="col-12 col-sm-6">
                    <label className="form-label small text-muted fw-bold mb-1">Current Age</label>
                    <StepperInput 
                        min={55} 
                        max={95} 
                        value={currentAge} 
                        onChange={(val: number) => setOverrideAge(val)} 
                    />
                </div>
                <div className="col-12 col-sm-6">
                    <label className="form-label small text-muted fw-bold mb-1">Projected Growth (%)</label>
                    <PercentInput 
                        value={growthRate} 
                        onChange={(val: number) => setGrowthRate(val ?? 5.0)} 
                    />
                </div>
                <div className="col-12 col-sm-6">
                    <label className="form-label small text-muted fw-bold mb-1 d-flex align-items-center justify-content-between">
                        <span className="text-truncate">Prior Year LIF Return (%)</span>
                        <InfoBtn align="right" direction="down" title="Prior Year LIF Return (%)" text="LIF maximum withdrawal is the <b>greater of</b> the age-based statutory factor and the actual investment return earned in the preceding calendar year." />
                    </label>
                    <PercentInput 
                        value={priorReturnRate !== '' ? priorReturnRate : (data.inputs[`${activeTarget}_lif_prior_return`] ?? '')} 
                        onChange={(val: any) => setPriorReturnRate(val ?? '')} 
                        placeholder={`${growthRate}`}
                    />
                </div>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-3">
                <SegmentedControl 
                    value={viewMode}
                    onChange={(val: any) => setViewMode(val)}
                    options={[
                        { value: 'summary', label: 'Annual Snapshot' },
                        { value: 'schedule', label: '10-Year Unlocking Schedule' }
                    ]}
                />
            </div>

            {/* Content View */}
            {viewMode === 'summary' ? (
                <div className="d-flex flex-column gap-3 flex-grow-1">
                    {/* 3 Metric Cards */}
                    <div className="row g-2">
                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>
                                    Mandatory Min (Cash)
                                </span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-main">{formatCurrency(calculations.currentMin)}</div>
                                    <span className="badge bg-secondary bg-opacity-25 text-muted mt-1" style={{fontSize: '0.7rem'}}>
                                        {(calculations.minRate * 100).toFixed(2)}% • Taxable
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-input border border-secondary rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-muted fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>
                                    Statutory Max Limit
                                </span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-main">{formatCurrency(calculations.currentMax)}</div>
                                    <span className={`badge ${calculations.isPriorReturnHigher ? 'bg-info bg-opacity-25 text-info border border-info border-opacity-50' : 'bg-secondary bg-opacity-25 text-muted'} mt-1`} style={{fontSize: '0.7rem'}}>
                                        {(calculations.maxRate * 100).toFixed(2)}% {calculations.isPriorReturnHigher ? '• Prior Return Bound' : `(${province})`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-50 rounded-3 h-100 d-flex flex-column justify-content-between">
                                <span className="small text-success fw-bold text-uppercase" style={{fontSize: '0.72rem'}}>
                                    Transfer to RRIF (Max - Min)
                                </span>
                                <div className="mt-2">
                                    <div className="fs-5 fw-bold text-success">{formatCurrency(calculations.currentTransfer)}</div>
                                    <span className="badge bg-success bg-opacity-25 text-success mt-1" style={{fontSize: '0.7rem'}}>
                                        Tax-Deferred Rollover
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Strategy Explanation Card */}
                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 small">
                        <div className="d-flex align-items-center mb-1 text-primary fw-bold">
                            <i className="bi bi-info-circle me-2"></i> How This Annual Transfer Operates:
                        </div>
                        <ul className="text-muted ps-3 mb-0" style={{lineHeight: 1.5, fontSize: '0.8rem'}}>
                            <li>You withdraw <strong>{formatCurrency(calculations.currentMin)}</strong> as mandatory cash income (subject to income tax).</li>
                            <li>You transfer <strong>{formatCurrency(calculations.currentTransfer)}</strong> directly to your regular RRIF (or RRSP if age 71 or under).</li>
                            <li>Reported under <strong>CRA Form T2033</strong>; claimed as an offsetting deduction on <strong>Line 23200</strong> so no immediate tax is due.</li>
                            <li>The transferred capital is now unlocked in your RRIF with <strong>no maximum withdrawal limit</strong> in future years.</li>
                        </ul>
                    </div>
                </div>
            ) : (
                /* 10-Year Schedule Table */
                <div className="table-responsive border border-secondary rounded-3 flex-grow-1 overflow-auto" style={{maxHeight: '320px'}}>
                    <table className="table table-sm table-hover mb-0 align-middle text-nowrap" style={{fontSize: '0.78rem'}}>
                        <thead className="surface-card sticky-top border-bottom border-secondary text-muted">
                            <tr>
                                <th>Age</th>
                                <th className="text-end">Opening LIF</th>
                                <th className="text-end text-muted">Min Cash</th>
                                <th className="text-end text-success">Transfer to RRIF</th>
                                <th className="text-end">Closing LIF</th>
                                <th className="text-end text-primary">Total Unlocked</th>
                            </tr>
                        </thead>
                        <tbody>
                            {calculations.schedule.map((row) => (
                                <tr key={row.year}>
                                    <td className="fw-bold">{row.age}</td>
                                    <td className="text-end text-muted">{formatCurrency(row.openingLif)}</td>
                                    <td className="text-end text-muted">{formatCurrency(row.minWithdrawal)}</td>
                                    <td className="text-end fw-bold text-success">+{formatCurrency(row.transferredToRrif)}</td>
                                    <td className="text-end">{formatCurrency(row.closingLif)}</td>
                                    <td className="text-end fw-bold text-primary">{formatCurrency(row.cumulativeUnlocked)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}