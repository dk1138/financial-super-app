import React, { useState, useEffect, useMemo } from 'react';
import { useFinance, migrateLegacyData, emptyData } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { InfoBtn, SegmentedControl } from './SharedUI';
import CanadianPeerBenchmarks from './compare/CanadianPeerBenchmarks';
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
        .replace(/\bret\b/gi, 'Return') 
        .toUpperCase();
};

export default function CompareTab() {
    const { data, results, loadData } = useFinance();
    const [compareMode, setCompareMode] = useState<'benchmarks' | 'scenarios'>('benchmarks');
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
            const newList = savedPlans.filter((p: string) => p !== comparePlanName);
            setSavedPlans(newList);
            localStorage.setItem('rp_plan_list', JSON.stringify(newList));
            localStorage.removeItem(`rp_saved_plan_${comparePlanName}`);
            setComparePlanName('');
        }
    };

    const getChangedInputs = () => {
        if (!data || !compareData) return [];
        const diffs: { key: string, oldVal: any, newVal: any }[] = [];
        
        Object.keys(compareData.inputs || {}).forEach((key: string) => {
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

    const chartData = useMemo<any[]>(() => {
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

    const filteredRows = useMemo<any[]>(() => {
        if (!milestonesOnly) return chartData;
        const p1Ret = Number(data.inputs.p1_retireAge) || 65;
        return chartData.filter((d: any, idx: number) => {
            return idx === 0 || 
                   idx === chartData.length - 1 || 
                   d.age === p1Ret || 
                   d.age === 65 || 
                   d.age === 71 || 
                   d.age % 5 === 0;
        });
    }, [chartData, milestonesOnly, data.inputs.p1_retireAge]);

    const CustomChartTooltip = ({ active, payload }: any) => {
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
            {/* Global Comparison Header With Mode Switcher */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary">
                <div>
                    <h4 className="fw-bolder mb-1 text-main d-flex align-items-center gap-2">
                        <i className="bi bi-intersect text-primary"></i>
                        <span>Comparison & Benchmark Engine</span>
                    </h4>
                    <p className="text-muted small mb-0">
                        Benchmark your plan against official Canadian demographic statistics or contrast alternative scenario milestones side-by-side.
                    </p>
                </div>

                <div className="bg-dark bg-opacity-50 p-1 rounded-pill border border-secondary shadow-sm">
                    <SegmentedControl 
                        options={[
                            { label: '🇨🇦 Canadian Peer Benchmarks', value: 'benchmarks' },
                            { label: '📊 Scenario vs. Scenario', value: 'scenarios' }
                        ]}
                        value={compareMode}
                        onChange={(val: 'benchmarks' | 'scenarios') => setCompareMode(val)}
                    />
                </div>
            </div>

            {/* View 1: Canadian Peer Benchmarks */}
            {compareMode === 'benchmarks' && <CanadianPeerBenchmarks />}

            {/* View 2: Scenario vs Scenario */}
            {compareMode === 'scenarios' && (
                <div>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-2">
                        <div>
                            <h5 className="fw-bold text-uppercase ls-1 text-primary mb-1 d-flex align-items-center">
                                <i className="bi bi-bezier2 me-2"></i> Scenario Comparison
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
                                            savedPlans.map((p: string) => (
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

                    {!comparePlanName && (
                        <div className="rp-card border border-secondary rounded-4 p-5 text-center text-muted mb-4 shadow-sm bg-secondary bg-opacity-10">
                            <i className="bi bi-folder2-open text-warning opacity-75 mb-3 d-block" style={{ fontSize: '3.5rem' }}></i>
                            <h5 className="fw-bold text-main mb-2">No Comparison Scenario Selected</h5>
                            <p className="small text-muted mb-4" style={{ maxWidth: '480px', margin: '0 auto', lineHeight: 1.6 }}>
                                Select a saved plan from the dropdown above to contrast your lifetime estate, taxes, retirement timeline, and year-by-year trajectory.
                            </p>
                            {savedPlans.length > 0 && (
                                <div className="d-flex justify-content-center gap-2 flex-wrap">
                                    {savedPlans.slice(0, 3).map((p: string) => (
                                        <button key={p} onClick={() => setComparePlanName(p)} className="btn btn-sm btn-outline-warning rounded-pill px-3 py-1 fw-bold">
                                            <i className="bi bi-folder-symlink me-1"></i> Compare with "{p}"
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {comparePlanName && compareMetrics && currentMetrics && (
                        <div className="rp-card border border-warning rounded-4 p-4 mb-4 shadow-sm slide-down bg-warning bg-opacity-10">
                            <div className="d-flex align-items-start gap-3">
                                <i className="bi bi-lightbulb-fill text-warning fs-1 mt-1"></i>
                                <div>
                                    <h5 className="fw-bold text-main mb-2">Scenario Impact Analysis</h5>
                                    <p className="mb-0 text-muted" style={{ lineHeight: 1.6, fontSize: '1rem' }}>
                                        Compared to live inputs, <strong className="text-warning">{comparePlanName}</strong> leaves you with 
                                        {' '}<strong className={compareMetrics.finalNW >= currentMetrics.finalNW ? 'text-success' : 'text-danger'}>
                                            {formatCurrency(Math.abs(compareMetrics.finalNW - currentMetrics.finalNW))} {compareMetrics.finalNW >= currentMetrics.finalNW ? 'more' : 'less'}
                                        </strong> in estate wealth, and incurs 
                                        {' '}<strong className={compareMetrics.totalTax <= currentMetrics.totalTax ? 'text-success' : 'text-danger'}>
                                            {formatCurrency(Math.abs(compareMetrics.totalTax - currentMetrics.totalTax))} {compareMetrics.totalTax <= currentMetrics.totalTax ? 'less' : 'more'}
                                        </strong> in lifetime taxes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {comparePlanName && compareMetrics && currentMetrics && (
                        <div className="row g-3 mb-4">
                            <div className="col-12 col-md-4">
                                <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm">
                                    <span className="text-muted fw-bold text-uppercase small d-block mb-1">Ending Estate Wealth</span>
                                    <div className="d-flex align-items-baseline justify-content-between">
                                        <span className="fs-4 fw-bolder text-main">{formatCurrency(currentMetrics.finalNW)}</span>
                                        <span className="fs-5 fw-bold text-warning">{formatCurrency(compareMetrics.finalNW)}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                                        <span className="small text-muted">Delta:</span>
                                        {renderDiff(currentMetrics.finalNW, compareMetrics.finalNW, false)}
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm">
                                    <span className="text-muted fw-bold text-uppercase small d-block mb-1">Lifetime Tax Paid</span>
                                    <div className="d-flex align-items-baseline justify-content-between">
                                        <span className="fs-4 fw-bolder text-main">{formatCurrency(currentMetrics.totalTax)}</span>
                                        <span className="fs-5 fw-bold text-danger">{formatCurrency(compareMetrics.totalTax)}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                                        <span className="small text-muted">Delta:</span>
                                        {renderDiff(currentMetrics.totalTax, compareMetrics.totalTax, true)}
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm">
                                    <span className="text-muted fw-bold text-uppercase small d-block mb-1">Lifetime Spending Pool</span>
                                    <div className="d-flex align-items-baseline justify-content-between">
                                        <span className="fs-4 fw-bolder text-main">{formatCurrency(currentMetrics.totalSpend)}</span>
                                        <span className="fs-5 fw-bold text-main" style={{ color: '#d97706' }}>{formatCurrency(compareMetrics.totalSpend)}</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                                        <span className="small text-muted">Delta:</span>
                                        {renderDiff(currentMetrics.totalSpend, compareMetrics.totalSpend, false)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {comparePlanName && inputDiffs.length > 0 && (
                        <div className="rp-card border-secondary rounded-4 p-3 mb-4 bg-dark bg-opacity-30 shadow-sm">
                            <span className="small text-muted fw-bold text-uppercase ls-1 d-block mb-2">
                                <i className="bi bi-sliders me-2 text-warning"></i> Modified Assumptions in {comparePlanName} ({inputDiffs.length})
                            </span>
                            <div className="d-flex flex-wrap gap-2">
                                {inputDiffs.map(d => (
                                    <span key={d.key} className="badge bg-input border border-secondary text-main px-2 py-1.5 rounded-3 small">
                                        <span className="text-muted me-1">{formatInputKey(d.key)}:</span>
                                        <span className="text-muted text-decoration-line-through me-1">{typeof d.oldVal === 'number' ? formatShortCurrency(d.oldVal) : String(d.oldVal)}</span>
                                        <i className="bi bi-arrow-right text-muted mx-1" style={{ fontSize: '0.7rem' }}></i>
                                        <span className="text-warning fw-bold">{typeof d.newVal === 'number' ? formatShortCurrency(d.newVal) : String(d.newVal)}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {comparePlanName && (
                        <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="small fw-bold text-muted text-uppercase me-1">Metric:</span>
                                    <div className="btn-group btn-group-sm rounded-pill p-1 bg-input border border-secondary shadow-sm">
                                        <button onClick={() => setChartMode('NW')} className={`btn rounded-pill px-3 py-1 fw-bold border-0 ${chartMode === 'NW' ? 'btn-success text-white' : 'btn-link text-muted'}`}>Net Worth</button>
                                        <button onClick={() => setChartMode('TAX')} className={`btn rounded-pill px-3 py-1 fw-bold border-0 ${chartMode === 'TAX' ? 'btn-danger text-white' : 'btn-link text-muted'}`}>Taxes</button>
                                        <button onClick={() => setChartMode('SPEND')} className={`btn rounded-pill px-3 py-1 fw-bold border-0 ${chartMode === 'SPEND' ? 'btn-warning text-dark' : 'btn-link text-muted'}`}>Spending</button>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center gap-2">
                                    <button onClick={handleMakeActive} className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold">
                                        <i className="bi bi-arrow-repeat me-1"></i> Make Live
                                    </button>
                                    <button onClick={handleDelete} className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold">
                                        <i className="bi bi-trash3 me-1"></i> Delete
                                    </button>
                                </div>
                            </div>

                            <div style={{ height: '380px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#2c3b52" opacity={0.6} />
                                        <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 12 }} />
                                        <YAxis stroke="#64748b" tickFormatter={formatShortCurrency} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip content={<CustomChartTooltip />} />
                                        <Legend />
                                        <Line 
                                            type="monotone" 
                                            dataKey={chartMode === 'NW' ? 'nwActive' : chartMode === 'TAX' ? 'taxActive' : 'spendActive'} 
                                            stroke="#3b82f6" 
                                            strokeWidth={3} 
                                            dot={false}
                                            name="Live Inputs (Plan A)" 
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey={chartMode === 'NW' ? 'nwCompare' : chartMode === 'TAX' ? 'taxCompare' : 'spendCompare'} 
                                            stroke="#f59e0b" 
                                            strokeWidth={3} 
                                            strokeDasharray="4 4"
                                            dot={false}
                                            name={`${comparePlanName} (Plan B)`} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}