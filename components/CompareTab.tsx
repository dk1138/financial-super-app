import React, { useState, useEffect, useMemo } from 'react';
import { useFinance, migrateLegacyData, emptyData } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { InfoBtn } from './SharedUI';
import { 
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from 'recharts';

const formatInputKey = (key: string) => {
    return key
        .replace(/_/g, ' ')
        .replace(/p1/gi, 'P1')
        .replace(/p2/gi, 'P2')
        .replace(/retireAge/gi, 'Retirement Age')
        .replace(/ret/gi, 'Return') 
        .toUpperCase();
};

export default function CompareTab() {
    const { data, results, loadData } = useFinance();
    const [savedPlans, setSavedPlans] = useState<string[]>([]);
    const [comparePlanName, setComparePlanName] = useState<string>('');
    const [compareResults, setCompareResults] = useState<any>(null);
    const [compareData, setCompareData] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    
    const [chartMode, setChartMode] = useState<'NW' | 'TAX' | 'SPEND'>('NW');
    const [viewMode, setViewMode] = useState<'both' | 'chart' | 'table'>('both');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [milestonesOnly, setMilestonesOnly] = useState(false);

    useEffect(() => {
        const plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
        setSavedPlans(plans);
    }, []);

    useEffect(() => {
        if (comparePlanName) {
            setIsCalculating(true);
            setTimeout(() => {
                const planStr = localStorage.getItem(`rp_saved_plan_${comparePlanName}`);
                if (planStr) {
                    const parsed = JSON.parse(planStr);
                    const migrated = migrateLegacyData(parsed, emptyData);
                    migrated.constants = FINANCIAL_CONSTANTS; 
                    
                    setCompareData(migrated);
                    
                    const engine = new FinanceEngine(JSON.parse(JSON.stringify(migrated)));
                    const sim = engine.runSimulation(true, null);
                    setCompareResults(sim);
                }
                setIsCalculating(false);
            }, 50);
        } else {
            setCompareResults(null);
            setCompareData(null);
        }
    }, [comparePlanName]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    const formatShortCurrency = (val: number) => {
        if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${Math.round(val)}`;
    };

    const getMetrics = (planData: any, planTimeline: any) => {
        if (!planData || !planTimeline || planTimeline.length === 0) return null;
        
        const startYear = planTimeline[0].year;
        const inflation = (planData.inputs.inflation_rate || 2.1) / 100;
        
        const getReal = (nominal: number, yOut: number) => {
            if (!planData.useRealDollars) return nominal;
            return nominal / Math.pow(1 + inflation, Math.max(0, yOut - startYear));
        };

        const finalYear = planTimeline[planTimeline.length - 1];
        const finalEstateVal = finalYear.afterTaxEstate !== undefined ? finalYear.afterTaxEstate : (finalYear.liquidNW + (finalYear.reIncludedEq || 0));
        
        const totalTax = planTimeline.reduce((sum: number, y: any) => sum + (y.taxP1 || 0) + (y.taxP2 || 0), 0);
        const totalSpend = planTimeline.reduce((sum: number, y: any) => sum + (y.expenses || 0), 0);

        const isSuccess = planTimeline.every((y: any) => Math.round(y.liquidNW || 0) >= 0);

        return {
            p1Age: Number(planData.inputs.p1_age) || 0,
            p2Age: planData.mode === 'Couple' ? (Number(planData.inputs.p2_age) || 0) : null,
            p1Income: Number(planData.inputs.p1_income) || 0,
            p2Income: planData.mode === 'Couple' ? (Number(planData.inputs.p2_income) || 0) : 0,
            p1RetAge: Number(planData.inputs.p1_retireAge) || 60,
            p2RetAge: planData.mode === 'Couple' ? (Number(planData.inputs.p2_retireAge) || 60) : null,
            finalNW: getReal(finalEstateVal, finalYear.year),
            totalTax: getReal(totalTax, finalYear.year),
            totalSpend: getReal(totalSpend, finalYear.year),
            isSuccess,
            isCouple: planData.mode === 'Couple'
        };
    };

    const currentMetrics = getMetrics(data, results?.timeline);
    const compareMetrics = getMetrics(compareData, compareResults);

    const renderDiff = (current: number, compare: number, lowerIsBetter: boolean = false, isCurrency: boolean = true) => {
        const diff = compare - current;
        if (Math.abs(diff) < 1) return <span className="text-muted fw-bold small opacity-50"><i className="bi bi-dash"></i> SAME</span>;
        
        let isGood = diff > 0;
        if (lowerIsBetter) isGood = diff < 0;

        const color = isGood ? 'text-success' : 'text-danger';
        const icon = diff > 0 ? 'bi-arrow-up' : 'bi-arrow-down';
        const formatted = isCurrency ? formatCurrency(Math.abs(diff)) : Math.abs(diff).toString();

        return (
            <span className={`${color} fw-bold small px-2 py-0.5 rounded d-inline-flex align-items-center ms-2`} style={{backgroundColor: isGood ? 'rgba(25, 135, 84, 0.15)' : 'rgba(220, 53, 69, 0.15)', border: `1px solid ${isGood ? 'rgba(25, 135, 84, 0.3)' : 'rgba(220, 53, 69, 0.3)'}`}}>
                <i className={`bi ${icon} me-1`}></i> {formatted}
            </span>
        );
    };

    const handleMakeActive = () => {
        if (window.confirm("This will overwrite your current live inputs with the saved scenario. Are you sure?")) {
            loadData(compareData);
        }
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete '${comparePlanName}'?`)) {
            const newList = savedPlans.filter(p => p !== comparePlanName);
            setSavedPlans(newList);
            localStorage.setItem('rp_plan_list', JSON.stringify(newList));
            localStorage.removeItem(`rp_saved_plan_${comparePlanName}`);
            setComparePlanName('');
        }
    };

    const getChangedInputs = () => {
        if (!data || !compareData) return [];
        const diffs: { key: string, oldVal: any, newVal: any }[] = [];
        
        Object.keys(compareData.inputs || {}).forEach(key => {
            const oldVal = data.inputs[key];
            const newVal = compareData.inputs[key];
            if (oldVal !== newVal && oldVal !== undefined && newVal !== undefined) {
                if (typeof oldVal === 'number' && typeof newVal === 'number' && Math.abs(oldVal - newVal) < 0.1) return;
                diffs.push({ key, oldVal, newVal });
            }
        });
        return diffs;
    };
    const inputDiffs = getChangedInputs();

    const getRealValue = (nominal: number, yOut: number, planData: any, baseYear: number) => {
        if (!planData || !planData.useRealDollars) return nominal;
        const inf = (planData.inputs.inflation_rate || 2.1) / 100;
        return nominal / Math.pow(1 + inf, Math.max(0, yOut - baseYear));
    };

    const chartData = useMemo(() => {
        if (!results?.timeline || results.timeline.length === 0) return [];
        const baseYear = results.timeline[0].year;
        return results.timeline.map((y: any, i: number) => {
            const cY = compareResults ? compareResults[i] : null;
            const nwLive = Math.round(getRealValue(y.liquidNW + (y.reIncludedEq || 0), y.year, data, baseYear));
            const nwComp = cY ? Math.round(getRealValue(cY.liquidNW + (cY.reIncludedEq || 0), cY.year, compareData, baseYear)) : null;

            const taxLive = Math.round(getRealValue((y.taxP1 || 0) + (y.taxP2 || 0), y.year, data, baseYear));
            const taxComp = cY ? Math.round(getRealValue((cY.taxP1 || 0) + (cY.taxP2 || 0), cY.year, compareData, baseYear)) : null;

            const spendLive = Math.round(getRealValue(y.expenses || 0, y.year, data, baseYear));
            const spendComp = cY ? Math.round(getRealValue(cY.expenses || 0, cY.year, compareData, baseYear)) : null;

            const p1RetAge = Number(data.inputs.p1_retireAge) || 65;
            const isRetired = y.p1Age >= p1RetAge;

            return {
                year: y.year,
                age: y.p1Age,
                ageP2: y.p2Age,
                isRetired,
                phase: isRetired ? 'Retirement' : 'Pre-Retirement',
                nwActive: nwLive,
                nwCompare: nwComp,
                nwDiff: nwComp !== null ? nwComp - nwLive : 0,
                taxActive: taxLive,
                taxCompare: taxComp,
                taxDiff: taxComp !== null ? taxComp - taxLive : 0,
                spendActive: spendLive,
                spendCompare: spendComp,
                spendDiff: spendComp !== null ? spendComp - spendLive : 0,
                liquidActive: Math.round(getRealValue(y.liquidNW || 0, y.year, data, baseYear)),
                liquidCompare: cY ? Math.round(getRealValue(cY.liquidNW || 0, cY.year, compareData, baseYear)) : null,
            };
        });
    }, [results?.timeline, compareResults, data, compareData]);

    const filteredRows = useMemo(() => {
        if (!milestonesOnly) return chartData;
        const p1Ret = Number(data.inputs.p1_retireAge) || 65;
        return chartData.filter((d, idx) => {
            return idx === 0 || 
                   idx === chartData.length - 1 || 
                   d.age === p1Ret || 
                   d.age === 65 || 
                   d.age === 71 || 
                   d.age % 5 === 0;
        });
    }, [chartData, milestonesOnly, data.inputs.p1_retireAge]);

    const activeMetricLabel = chartMode === 'NW' ? 'Net Worth' : chartMode === 'TAX' ? 'Taxes Paid' : 'Annual Spending';

    const CustomChartTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || !payload.length) return null;
        const d = payload[0]?.payload;
        if (!d) return null;

        const valLive = chartMode === 'NW' ? d.nwActive : chartMode === 'TAX' ? d.taxActive : d.spendActive;
        const valComp = chartMode === 'NW' ? d.nwCompare : chartMode === 'TAX' ? d.taxCompare : d.spendCompare;
        const diff = valComp !== null ? valComp - valLive : null;

        return (
            <div className="p-3 rounded-3 shadow-lg border border-secondary" style={{ backgroundColor: 'var(--bs-gray-900)', color: '#fff', minWidth: '220px' }}>
                <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-1 mb-2">
                    <span className="fw-bold text-main">Year {d.year} (Age {d.age})</span>
                    <span className="badge bg-secondary bg-opacity-25 text-muted" style={{ fontSize: '0.7rem' }}>{d.phase}</span>
                </div>
                <div className="d-flex justify-content-between small mb-1">
                    <span className="text-primary fw-bold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.6rem' }}></i> Live Inputs:</span>
                    <span className="fw-bold">{formatCurrency(valLive)}</span>
                </div>
                {valComp !== null && (
                    <>
                        <div className="d-flex justify-content-between small mb-1">
                            <span className="text-warning fw-bold"><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.6rem' }}></i> {comparePlanName}:</span>
                            <span className="fw-bold">{formatCurrency(valComp)}</span>
                        </div>
                        <div className="d-flex justify-content-between small pt-1 border-top border-secondary mt-1">
                            <span className="text-muted">Difference:</span>
                            <span className={`fw-bold ${diff! >= 0 ? (chartMode === 'TAX' ? 'text-danger' : 'text-success') : (chartMode === 'TAX' ? 'text-success' : 'text-danger')}`}>
                                {diff! >= 0 ? '+' : ''}{formatCurrency(diff!)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="p-3 p-md-4">
            {/* --- TOP TOOLBAR --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary">
                <div>
                    <h5 className="fw-bold text-uppercase ls-1 text-primary mb-1 d-flex align-items-center">
                        <i className="bi bi-bezier2 me-3"></i> Scenario Comparison
                    </h5>
                    <span className="text-muted small">Compare your current live plan against saved milestone scenarios side-by-side.</span>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <div className="dropdown">
                        <button 
                            className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 fw-bold bg-input text-main border-secondary px-3 py-2 rounded-3 shadow-sm"
                            type="button" 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <i className="bi bi-folder2-open text-warning"></i>
                            <span>{comparePlanName || "-- Select Plan to Compare --"}</span>
                            {isCalculating && <span className="spinner-border spinner-border-sm text-warning ms-1"></span>}
                        </button>
                        {isDropdownOpen && (
                            <ul className="dropdown-menu dropdown-menu-end show shadow-lg border-secondary bg-card mt-1 p-2" style={{ minWidth: '260px', maxHeight: '280px', overflowY: 'auto' }}>
                                <li className="dropdown-header text-uppercase small fw-bold text-muted px-2 py-1">Saved Plans ({savedPlans.length})</li>
                                {savedPlans.length === 0 ? (
                                    <li className="text-muted small px-3 py-2 fst-italic">No saved plans found. Save one from the header menu to compare!</li>
                                ) : (
                                    savedPlans.map(p => (
                                        <li key={p}>
                                            <button 
                                                className={`dropdown-item py-2 fw-medium rounded-2 d-flex align-items-center justify-content-between ${comparePlanName === p ? 'active' : ''}`} 
                                                onClick={() => { setComparePlanName(p); setIsDropdownOpen(false); }}
                                            >
                                                <span><i className="bi bi-folder-check text-warning me-2"></i>{p}</span>
                                                {comparePlanName === p && <i className="bi bi-check2 text-success fw-bold"></i>}
                                            </button>
                                        </li>
                                    ))
                                )}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* --- EMPTY STATE WHEN NO PLAN SELECTED --- */}
            {!comparePlanName && (
                <div className="rp-card border border-secondary rounded-4 p-5 text-center text-muted mb-4 shadow-sm bg-secondary bg-opacity-10">
                    <i className="bi bi-folder2-open text-warning opacity-75 mb-3 d-block" style={{ fontSize: '3.5rem' }}></i>
                    <h5 className="fw-bold text-main mb-2">No Comparison Scenario Selected</h5>
                    <p className="small text-muted mb-4" style={{ maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                        Select a saved plan from the dropdown above to contrast your lifetime estate, taxes, retirement timeline, and year-by-year trajectory.
                    </p>
                    {savedPlans.length > 0 && (
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                            {savedPlans.slice(0, 3).map(p => (
                                <button key={p} onClick={() => setComparePlanName(p)} className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 fw-bold">
                                    <i className="bi bi-folder-symlink me-1"></i> Compare with "{p}"
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- SCENARIO IMPACT BANNER --- */}
            {comparePlanName && compareMetrics && currentMetrics && (
                <div className="rp-card border border-warning rounded-4 p-4 mb-4 shadow-sm slide-down bg-warning bg-opacity-10">
                    <div className="d-flex align-items-start gap-3">
                        <i className="bi bi-lightbulb-fill text-warning fs-1 mt-1"></i>
                        <div>
                            <h5 className="fw-bold text-main mb-2">Scenario Impact Analysis</h5>
                            <p className="mb-0 text-muted" style={{ lineHeight: 1.6, fontSize: '1rem' }}>
                                Compared to live inputs, <strong className="text-warning">{comparePlanName}</strong> leaves you with 
                                <strong className={compareMetrics.finalNW > currentMetrics.finalNW ? 'text-success mx-1' : 'text-danger mx-1'}>
                                    {formatCurrency(Math.abs(compareMetrics.finalNW - currentMetrics.finalNW))} {compareMetrics.finalNW > currentMetrics.finalNW ? 'more' : 'less'}
                                </strong> 
                                final estate, paying 
                                <strong className={compareMetrics.totalTax < currentMetrics.totalTax ? 'text-success mx-1' : 'text-danger mx-1'}>
                                    {formatCurrency(Math.abs(compareMetrics.totalTax - currentMetrics.totalTax))} {compareMetrics.totalTax < currentMetrics.totalTax ? 'less' : 'more'}
                                </strong> 
                                lifetime taxes, with 
                                <strong className="text-main mx-1">
                                    {formatCurrency(Math.abs(compareMetrics.totalSpend - currentMetrics.totalSpend))} {compareMetrics.totalSpend > currentMetrics.totalSpend ? 'more' : 'less'}
                                </strong>
                                total lifestyle spending.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- WHAT CHANGED (INPUT DELTAS) --- */}
            {comparePlanName && inputDiffs.length > 0 && (
                <div className="rp-card border border-secondary rounded-4 p-4 mb-4 shadow-sm bg-secondary bg-opacity-10">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold text-uppercase ls-1 text-muted mb-0 d-flex align-items-center">
                            <i className="bi bi-sliders me-2 text-warning"></i> Scenario Inputs (What Changed: {inputDiffs.length})
                        </h6>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        {inputDiffs.map(diff => (
                            <div key={diff.key} className="bg-input border border-secondary rounded-pill px-3 py-1.5 small fw-medium d-flex align-items-center shadow-sm">
                                <span className="text-muted me-2">{formatInputKey(diff.key)}:</span>
                                <span className="text-decoration-line-through opacity-50 me-2">{typeof diff.oldVal === 'number' ? formatCurrency(diff.oldVal) : diff.oldVal}</span>
                                <i className="bi bi-arrow-right text-warning mx-1"></i>
                                <span className="text-main ms-1 fw-bold">{typeof diff.newVal === 'number' ? formatCurrency(diff.newVal) : diff.newVal}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- EXECUTIVE COMPARISON TABLE (UNIFIED SIDE-BY-SIDE) --- */}
            {comparePlanName && compareMetrics && currentMetrics && (
                <div className="rp-card border border-secondary rounded-4 shadow-sm mb-4 overflow-hidden position-relative">
                    <div className="p-3 px-md-4 border-bottom border-secondary d-flex justify-content-between align-items-center surface-card">
                        <h6 className="fw-bold text-uppercase ls-1 text-main mb-0 d-flex align-items-center">
                            <i className="bi bi-clipboard2-data me-2 text-primary"></i> Executive Plan Comparison
                        </h6>
                        <div className="d-flex gap-2">
                            <button onClick={handleMakeActive} className="btn btn-sm btn-outline-warning fw-bold rounded-pill px-3 py-1 d-flex align-items-center gap-1.5 shadow-sm">
                                <i className="bi bi-cloud-arrow-down fs-6"></i> Make Live
                            </button>
                            <button onClick={handleDelete} className="btn btn-sm btn-outline-danger px-2.5 rounded-pill shadow-sm" title={`Delete ${comparePlanName}`}>
                                <i className="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div className="table-responsive mb-0">
                        <table className="table table-hover align-middle mb-0" style={{ minWidth: '700px' }}>
                            <thead className="surface-card border-bottom border-secondary text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                <tr>
                                    <th className="py-3 ps-4 text-uppercase">Metric</th>
                                    <th className="py-3 text-uppercase text-end text-primary" style={{ width: '25%' }}>Live Inputs (Current)</th>
                                    <th className="py-3 text-uppercase text-end text-warning" style={{ width: '25%' }}>{comparePlanName}</th>
                                    <th className="py-3 pe-4 text-uppercase text-end" style={{ width: '22%' }}>Impact / Difference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                <tr>
                                    <td className="ps-4 py-3 fw-bold text-main">
                                        <i className="bi bi-bank me-2 text-success"></i> Final Estate Value
                                    </td>
                                    <td className="text-end fw-bold fs-6 text-success">{formatCurrency(currentMetrics.finalNW)}</td>
                                    <td className="text-end fw-bold fs-6 text-success">{formatCurrency(compareMetrics.finalNW)}</td>
                                    <td className="pe-4 text-end">{renderDiff(currentMetrics.finalNW, compareMetrics.finalNW, false)}</td>
                                </tr>
                                <tr>
                                    <td className="ps-4 py-3 fw-bold text-main">
                                        <i className="bi bi-receipt me-2 text-danger"></i> Lifetime Taxes Paid
                                    </td>
                                    <td className="text-end fw-bold text-danger">{formatCurrency(currentMetrics.totalTax)}</td>
                                    <td className="text-end fw-bold text-danger">{formatCurrency(compareMetrics.totalTax)}</td>
                                    <td className="pe-4 text-end">{renderDiff(currentMetrics.totalTax, compareMetrics.totalTax, true)}</td>
                                </tr>
                                <tr>
                                    <td className="ps-4 py-3 fw-bold text-main">
                                        <i className="bi bi-cart-check me-2 text-info"></i> Total Lifetime Spending
                                    </td>
                                    <td className="text-end fw-bold text-main">{formatCurrency(currentMetrics.totalSpend)}</td>
                                    <td className="text-end fw-bold text-main">{formatCurrency(compareMetrics.totalSpend)}</td>
                                    <td className="pe-4 text-end">{renderDiff(currentMetrics.totalSpend, compareMetrics.totalSpend, false)}</td>
                                </tr>
                                <tr>
                                    <td className="ps-4 py-3 fw-bold text-main">
                                        <i className="bi bi-cup-hot me-2 text-warning"></i> Planned Retirement Age
                                    </td>
                                    <td className="text-end fw-bold text-main">{currentMetrics.p1RetAge} {currentMetrics.isCouple ? `/ ${currentMetrics.p2RetAge}` : ''}</td>
                                    <td className="text-end fw-bold text-main">{compareMetrics.p1RetAge} {compareMetrics.isCouple ? `/ ${compareMetrics.p2RetAge}` : ''}</td>
                                    <td className="pe-4 text-end">{renderDiff(currentMetrics.p1RetAge, compareMetrics.p1RetAge, true, false)}</td>
                                </tr>
                                <tr>
                                    <td className="ps-4 py-3 fw-bold text-main">
                                        <i className="bi bi-shield-check me-2 text-primary"></i> Simulation Feasibility
                                    </td>
                                    <td className="text-end">
                                        <span className={`badge ${currentMetrics.isSuccess ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${currentMetrics.isSuccess ? 'text-success' : 'text-danger'} border rounded-pill px-2.5 py-1`}>
                                            <i className={`bi ${currentMetrics.isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i> {currentMetrics.isSuccess ? 'Funded' : 'Shortfall'}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <span className={`badge ${compareMetrics.isSuccess ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${compareMetrics.isSuccess ? 'text-success' : 'text-danger'} border rounded-pill px-2.5 py-1`}>
                                            <i className={`bi ${compareMetrics.isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i> {compareMetrics.isSuccess ? 'Funded' : 'Shortfall'}
                                        </span>
                                    </td>
                                    <td className="pe-4 text-end text-muted small fw-medium">
                                        {currentMetrics.isSuccess === compareMetrics.isSuccess ? (
                                            <span className="text-success"><i className="bi bi-check-all me-1"></i> Both Viable</span>
                                        ) : compareMetrics.isSuccess ? (
                                            <span className="text-success fw-bold"><i className="bi bi-arrow-up-circle-fill me-1"></i> Fixes Shortfall</span>
                                        ) : (
                                            <span className="text-danger fw-bold"><i className="bi bi-arrow-down-circle-fill me-1"></i> Creates Shortfall</span>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- TRAJECTORY COMPARISON (CHART & TABLE SECTION) --- */}
            {comparePlanName && compareResults && chartData.length > 0 && (
                <div className="rp-card border border-secondary rounded-4 shadow-sm position-relative overflow-hidden mb-4">
                    {/* Trajectory Header & Controls */}
                    <div className="p-3 px-md-4 border-bottom border-secondary d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 surface-card">
                        <div>
                            <h5 className="fw-bold text-uppercase ls-1 text-info mb-1 d-flex align-items-center">
                                <i className="bi bi-graph-up-arrow me-2"></i> Trajectory Comparison
                                <InfoBtn align="left" title="Trajectory Comparison" text="Contrasts annual projected net worth, tax burden, and spending between your active plan and your saved comparison scenario. Values reflect the selected display mode (Today's Dollars vs Future Dollars)." />
                            </h5>
                            <span className="text-muted small">Tracking <strong>{chartData.length} years</strong> from age {chartData[0]?.age} to {chartData[chartData.length - 1]?.age}.</span>
                        </div>

                        <div className="d-flex flex-wrap align-items-center gap-2">
                            {/* Metric Mode Switcher */}
                            <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1">
                                {(['NW', 'TAX', 'SPEND'] as const).map(m => (
                                    <button 
                                        key={m} 
                                        onClick={() => setChartMode(m)} 
                                        className={`btn btn-sm rounded-pill fw-bold border-0 px-3 py-1 ${chartMode === m ? 'bg-primary text-white shadow' : 'text-muted bg-transparent'}`}
                                    >
                                        {m === 'NW' ? 'Net Worth' : m === 'TAX' ? 'Taxes' : 'Spending'}
                                    </button>
                                ))}
                            </div>

                            {/* View Mode Switcher: Chart vs Table vs Both */}
                            <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1">
                                <button 
                                    onClick={() => setViewMode('both')} 
                                    className={`btn btn-sm rounded-pill fw-bold border-0 px-2.5 py-1 ${viewMode === 'both' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent'}`}
                                    title="Show both Chart and Table"
                                >
                                    <i className="bi bi-layout-split me-1"></i> Both
                                </button>
                                <button 
                                    onClick={() => setViewMode('chart')} 
                                    className={`btn btn-sm rounded-pill fw-bold border-0 px-2.5 py-1 ${viewMode === 'chart' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent'}`}
                                    title="Chart only"
                                >
                                    <i className="bi bi-graph-up me-1"></i> Chart
                                </button>
                                <button 
                                    onClick={() => setViewMode('table')} 
                                    className={`btn btn-sm rounded-pill fw-bold border-0 px-2.5 py-1 ${viewMode === 'table' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent'}`}
                                    title="Table only"
                                >
                                    <i className="bi bi-table me-1"></i> Table
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- 1. RECHARTS TRAJECTORY VISUALIZATION --- */}
                    {(viewMode === 'chart' || viewMode === 'both') && (
                        <div className="p-3 p-md-4 border-bottom border-secondary border-opacity-50">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="small text-muted fw-bold text-uppercase ls-1">
                                    <i className="bi bi-activity text-info me-1"></i> {activeMetricLabel} Trajectory Curve
                                </span>
                                <div className="d-flex gap-3 small fw-medium">
                                    <span className="text-primary d-flex align-items-center gap-1.5">
                                        <span className="d-inline-block rounded-pill" style={{ width: '16px', height: '4px', backgroundColor: '#0d6efd' }}></span> Live Inputs
                                    </span>
                                    <span className="text-warning d-flex align-items-center gap-1.5">
                                        <span className="d-inline-block rounded-pill" style={{ width: '16px', height: '4px', backgroundColor: '#ffc107', borderTop: '2px dashed #ffc107' }}></span> {comparePlanName}
                                    </span>
                                </div>
                            </div>

                            <div className="w-100 position-relative" style={{ height: '340px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                                        <XAxis 
                                            dataKey="year" 
                                            stroke="#888" 
                                            tick={{ fill: '#888', fontSize: 12 }} 
                                            tickFormatter={(val) => `'${String(val).slice(-2)}`} 
                                            axisLine={false}
                                            tickLine={false}
                                            dy={8}
                                        />
                                        <YAxis 
                                            stroke="#888" 
                                            tick={{ fill: '#888', fontSize: 12 }} 
                                            tickFormatter={(val) => formatShortCurrency(val)} 
                                            width={65} 
                                            axisLine={false}
                                            tickLine={false}
                                            dx={-8}
                                        />
                                        <RechartsTooltip content={<CustomChartTooltip />} />
                                        <Line 
                                            type="monotone" 
                                            name="Live Inputs" 
                                            dataKey={chartMode === 'NW' ? 'nwActive' : chartMode === 'TAX' ? 'taxActive' : 'spendActive'} 
                                            stroke="#0d6efd" 
                                            strokeWidth={3} 
                                            dot={false} 
                                            activeDot={{ r: 6, fill: '#0d6efd', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                        <Line 
                                            type="monotone" 
                                            name={comparePlanName} 
                                            dataKey={chartMode === 'NW' ? 'nwCompare' : chartMode === 'TAX' ? 'taxCompare' : 'spendCompare'} 
                                            stroke="#ffc107" 
                                            strokeWidth={2.5} 
                                            strokeDasharray="5 5" 
                                            dot={false} 
                                            activeDot={{ r: 6, fill: '#ffc107', stroke: '#fff', strokeWidth: 2 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* --- 2. THE TRAJECTORY COMPARISON TABLE --- */}
                    {(viewMode === 'table' || viewMode === 'both') && (
                        <div>
                            {/* Table Subtoolbar */}
                            <div className="p-3 px-md-4 bg-secondary bg-opacity-10 border-bottom border-secondary d-flex justify-content-between align-items-center">
                                <span className="small fw-bold text-muted text-uppercase ls-1 d-flex align-items-center">
                                    <i className="bi bi-table me-2 text-info"></i> Year-by-Year Trajectory Audit
                                </span>
                                <div className="d-flex align-items-center gap-2">
                                    <button 
                                        onClick={() => setMilestonesOnly(!milestonesOnly)} 
                                        className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${milestonesOnly ? 'btn-info text-dark shadow-sm' : 'btn-outline-secondary text-muted'}`}
                                    >
                                        <i className={`bi ${milestonesOnly ? 'bi-funnel-fill' : 'bi-funnel'} me-1`}></i>
                                        {milestonesOnly ? '5-Yr Milestones Only' : 'Show All Years'}
                                    </button>
                                </div>
                            </div>

                            {/* Table Body */}
                            <div className="table-responsive hide-scrollbar" style={{ maxHeight: '460px', overflowY: 'auto' }}>
                                <table className="table table-hover align-middle mb-0" style={{ tableLayout: 'fixed', minWidth: '980px', width: '100%' }}>
                                    <thead className="surface-card sticky-top border-bottom border-secondary text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', top: 0, zIndex: 5, backgroundColor: 'var(--bg-card)' }}>
                                        <tr>
                                            <th className="py-3 ps-4 text-uppercase text-start" style={{ width: '14%' }}>Year & Age</th>
                                            <th className="py-3 text-uppercase text-center" style={{ width: '12%' }}>Phase</th>
                                            <th className="py-3 text-uppercase text-end" style={{ width: '25%' }}>
                                                <span className="text-success"><i className="bi bi-graph-up me-1"></i> Net Worth</span>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>Live vs {comparePlanName}</div>
                                            </th>
                                            <th className="py-3 text-uppercase text-end" style={{ width: '24%' }}>
                                                <span className="text-danger"><i className="bi bi-receipt me-1"></i> Taxes Paid</span>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>Live vs {comparePlanName}</div>
                                            </th>
                                            <th className="py-3 pe-4 text-uppercase text-end" style={{ width: '25%' }}>
                                                <span style={{ color: '#d97706' }}><i className="bi bi-cart3 me-1"></i> Spending</span>
                                                <div className="text-muted" style={{ fontSize: '0.65rem' }}>Live vs {comparePlanName}</div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary">
                                        {filteredRows.map((row) => {
                                            const nwDiff = row.nwDiff;
                                            const taxDiff = row.taxDiff;
                                            const spendDiff = row.spendDiff;

                                            const nwDiffIsPositive = nwDiff >= 0;
                                            const taxDiffIsLower = taxDiff <= 0; // lower taxes are better

                                            return (
                                                <tr key={row.year} className={row.isRetired ? 'table-row-retired' : ''}>
                                                    <td className="ps-4 py-2.5">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="fw-bold text-main">{row.year}</span>
                                                            <span className="badge bg-secondary bg-opacity-25 text-muted fw-normal" style={{ fontSize: '0.7rem' }}>
                                                                Age {row.age}{row.ageP2 ? `/${row.ageP2}` : ''}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center py-2.5">
                                                        <span className={`badge rounded-pill ${row.isRetired ? 'bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50' : 'bg-secondary bg-opacity-25 text-muted border border-secondary border-opacity-50'}`} style={{ fontSize: '0.68rem' }}>
                                                            {row.phase}
                                                        </span>
                                                    </td>
                                                    {/* Net Worth Live vs Compare */}
                                                    <td className="text-end py-2.5">
                                                        <div className="d-flex justify-content-end align-items-baseline gap-2">
                                                            <span className="text-muted small">{formatShortCurrency(row.nwActive)}</span>
                                                            <i className="bi bi-arrow-right text-muted opacity-50" style={{ fontSize: '0.7rem' }}></i>
                                                            <span className="fw-bold text-success fs-6">{row.nwCompare !== null ? formatShortCurrency(row.nwCompare) : '-'}</span>
                                                            {row.nwCompare !== null && Math.abs(nwDiff) >= 100 && (
                                                                <span className={`badge px-1.5 py-0.5 rounded ${nwDiffIsPositive ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger'}`} style={{ fontSize: '0.65rem' }}>
                                                                    {nwDiffIsPositive ? '+' : ''}{formatShortCurrency(nwDiff)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Taxes Paid Live vs Compare */}
                                                    <td className="text-end py-2.5">
                                                        <div className="d-flex justify-content-end align-items-baseline gap-2">
                                                            <span className="text-muted small">{formatCurrency(row.taxActive)}</span>
                                                            <i className="bi bi-arrow-right text-muted opacity-50" style={{ fontSize: '0.7rem' }}></i>
                                                            <span className="fw-bold text-danger">{row.taxCompare !== null ? formatCurrency(row.taxCompare) : '-'}</span>
                                                            {row.taxCompare !== null && Math.abs(taxDiff) >= 100 && (
                                                                <span className={`badge px-1.5 py-0.5 rounded ${taxDiffIsLower ? 'bg-success bg-opacity-25 text-success' : 'bg-danger bg-opacity-25 text-danger'}`} style={{ fontSize: '0.65rem' }}>
                                                                    {taxDiff <= 0 ? '-' : '+'}{formatShortCurrency(Math.abs(taxDiff))}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {/* Spending Live vs Compare */}
                                                    <td className="pe-4 text-end py-2.5">
                                                        <div className="d-flex justify-content-end align-items-baseline gap-2">
                                                            <span className="text-muted small">{formatCurrency(row.spendActive)}</span>
                                                            <i className="bi bi-arrow-right text-muted opacity-50" style={{ fontSize: '0.7rem' }}></i>
                                                            <span className="fw-bold text-main" style={{ color: '#d97706' }}>{row.spendCompare !== null ? formatCurrency(row.spendCompare) : '-'}</span>
                                                            {row.spendCompare !== null && Math.abs(spendDiff) >= 100 && (
                                                                <span className="badge px-1.5 py-0.5 rounded bg-secondary bg-opacity-25 text-main" style={{ fontSize: '0.65rem' }}>
                                                                    {spendDiff >= 0 ? '+' : ''}{formatShortCurrency(spendDiff)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}