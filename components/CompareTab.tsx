import React, { useState, useEffect } from 'react';
import { useFinance, migrateLegacyData, emptyData } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { InfoBtn } from './SharedUI';

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
    const [savedPlans, setSavedPlans] = useState<string[]>([]);
    const [comparePlanName, setComparePlanName] = useState<string>('');
    const [compareResults, setCompareResults] = useState<any>(null);
    const [compareData, setCompareData] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const [chartMode, setChartMode] = useState<'NW' | 'TAX' | 'SPEND'>('NW');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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
        if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
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
        
        const totalTax = planTimeline.reduce((sum: number, y: any) => sum + y.taxP1 + (y.taxP2 || 0), 0);
        const totalSpend = planTimeline.reduce((sum: number, y: any) => sum + y.expenses, 0);

        const isSuccess = planTimeline.every((y: any) => Math.round(y.liquidNW) >= 0);

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
            <span className={`${color} fw-bold small px-2 py-1 rounded d-inline-flex align-items-center ms-2 shadow-sm`} style={{backgroundColor: isGood ? 'rgba(25, 135, 84, 0.15)' : 'rgba(220, 53, 69, 0.15)'}}>
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
        
        Object.keys(compareData.inputs).forEach(key => {
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

    let chartData: any[] = [];
    if (results?.timeline && results.timeline.length > 0) {
        const baseYear = results.timeline[0].year;
        chartData = results.timeline.map((y: any, i: number) => {
            const cY = compareResults ? compareResults[i] : null;
            return {
                year: y.year,
                age: y.p1Age,
                nwActive: getRealValue(y.liquidNW + (y.reIncludedEq || 0), y.year, data, baseYear),
                nwCompare: cY ? getRealValue(cY.liquidNW + (cY.reIncludedEq || 0), cY.year, compareData, baseYear) : null,
                taxActive: getRealValue(y.taxP1 + (y.taxP2 || 0), y.year, data, baseYear),
                taxCompare: cY ? getRealValue(cY.taxP1 + (cY.taxP2 || 0), cY.year, compareData, baseYear) : null,
                spendActive: getRealValue(y.expenses, y.year, data, baseYear),
                spendCompare: cY ? getRealValue(cY.expenses, cY.year, compareData, baseYear) : null,
            };
        });
    }

    const getMetricData = (d: any) => {
        if (chartMode === 'TAX') return { active: d.taxActive, compare: d.taxCompare };
        if (chartMode === 'SPEND') return { active: d.spendActive, compare: d.spendCompare };
        return { active: d.nwActive, compare: d.nwCompare };
    };

    const VIEW_W = 1000;
    const VIEW_H = 300;
    const PAD_X = 60;
    const PAD_Y = 40;
    const PLOT_W = VIEW_W - PAD_X * 2;
    const PLOT_H = VIEW_H - PAD_Y * 2;

    const allValues = chartData.flatMap(d => {
        const m = getMetricData(d);
        return [m.active, m.compare];
    }).filter(v => v !== null) as number[];
    const maxVal = allValues.length > 0 ? Math.max(...allValues, 1000) * 1.05 : 1000;
    
    const getX = (index: number) => PAD_X + (index / Math.max(1, chartData.length - 1)) * PLOT_W;
    const getY = (val: number) => PAD_Y + PLOT_H - ((val / maxVal) * PLOT_H);

    const activePath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(getMetricData(d).active)}`).join(' ');
    const comparePath = compareResults ? chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(getMetricData(d).compare!)}`).join(' ') : '';
    const areaPath = compareResults ? activePath + ' ' + [...chartData].reverse().map((d, i) => `L ${getX(chartData.length - 1 - i)} ${getY(getMetricData(d).compare!)}`).join(' ') + ' Z' : '';

    const handleMouseMove = (e: any) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const scaleX = VIEW_W / rect.width;
        const svgX = x * scaleX;
        let closestIdx = Math.round(((svgX - PAD_X) / PLOT_W) * (chartData.length - 1));
        closestIdx = Math.max(0, Math.min(chartData.length - 1, closestIdx));
        setHoverIndex(closestIdx);
    };

    return (
        <div className="p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
                <h5 className="fw-bold text-uppercase ls-1 text-primary mb-0 d-flex align-items-center">
                    <i className="bi bi-bezier2 me-3"></i> Scenario Comparison
                </h5>
            </div>

            {comparePlanName && compareMetrics && currentMetrics && (
                <div className="rp-card border border-warning rounded-4 p-4 mb-4 shadow slide-down bg-warning bg-opacity-10">
                    <div className="d-flex align-items-start gap-3">
                        <i className="bi bi-lightbulb-fill text-warning fs-1 mt-1"></i>
                        <div>
                            <h5 className="fw-bold text-main mb-2">Scenario Impact Analysis</h5>
                            <p className="mb-0 text-muted" style={{ lineHeight: 1.6, fontSize: '1.05rem' }}>
                                Compared to live inputs, <strong className="text-warning">{comparePlanName}</strong> leaves you with 
                                <strong className={compareMetrics.finalNW > currentMetrics.finalNW ? 'text-success mx-1' : 'text-danger mx-1'}>
                                    {formatCurrency(Math.abs(compareMetrics.finalNW - currentMetrics.finalNW))} {compareMetrics.finalNW > currentMetrics.finalNW ? 'more' : 'less'}
                                </strong> 
                                final estate, paying 
                                <strong className={compareMetrics.totalTax < currentMetrics.totalTax ? 'text-success mx-1' : 'text-danger mx-1'}>
                                    {formatCurrency(Math.abs(compareMetrics.totalTax - currentMetrics.totalTax))} {compareMetrics.totalTax < currentMetrics.totalTax ? 'less' : 'more'}
                                </strong> 
                                lifetime taxes. You spend
                                <strong className="text-main mx-1">
                                    {formatCurrency(Math.abs(compareMetrics.totalSpend - currentMetrics.totalSpend))} {compareMetrics.totalSpend > currentMetrics.totalSpend ? 'more' : 'less'}
                                </strong>
                                lifestyle funding.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4 mb-4">
                <div className="col-12 col-xl-6">
                    <div className="rp-card border-secondary rounded-4 p-4 h-100 shadow-sm position-relative">
                        <div className="position-absolute top-0 start-0 w-100 border-top border-3 border-primary rounded-top-4"></div>
                        <div className="d-flex flex-column justify-content-end mb-4 pb-3 border-bottom border-secondary" style={{ height: '90px' }}>
                            <h6 className="text-muted small fw-bold text-uppercase ls-1 mb-2">Currently Editing</h6>
                            <h4 className="fw-bold text-primary mb-0 d-flex align-items-center text-truncate">
                                <i className="bi bi-pencil-square me-2 fs-5"></i> Live Inputs
                            </h4>
                        </div>
                        {currentMetrics && (
                            <div className="d-flex flex-column gap-3">
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Final Estate Value</span>
                                    <span className="fw-bold fs-5 text-success">{formatCurrency(currentMetrics.finalNW)}</span>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Lifetime Taxes Paid</span>
                                    <span className="fw-bold fs-5 text-danger">{formatCurrency(currentMetrics.totalTax)}</span>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Total Lifetime Spend</span>
                                    <span className="fw-bold fs-5 text-main">{formatCurrency(currentMetrics.totalSpend)}</span>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Retirement Age</span>
                                    <span className="fw-bold fs-5 text-main">{currentMetrics.p1RetAge} {currentMetrics.isCouple ? `/ ${currentMetrics.p2RetAge}` : ''}</span>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Plan Status</span>
                                    <span className={`badge ${currentMetrics.isSuccess ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${currentMetrics.isSuccess ? 'text-success' : 'text-danger'} border rounded-pill px-3 py-2`}>
                                        <i className={`bi ${currentMetrics.isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i> {currentMetrics.isSuccess ? 'Successful' : 'Failed'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-12 col-xl-6">
                    <div className="rp-card border-secondary rounded-4 p-4 h-100 shadow-sm position-relative">
                        <div className="position-absolute top-0 start-0 w-100 border-top border-3 border-warning rounded-top-4"></div>
                        <div className="d-flex flex-column justify-content-end mb-4 pb-3 border-bottom border-secondary position-relative" style={{ height: '90px' }}>
                            <div className="d-flex justify-content-between align-items-center w-100 mb-2">
                                <h6 className="text-muted small fw-bold text-uppercase ls-1 mb-0">Compare Against</h6>
                                {isCalculating && <span className="spinner-border spinner-border-sm text-warning"></span>}
                            </div>
                            <div className="dropdown w-100">
                                <button className="btn btn-outline-secondary dropdown-toggle w-100 d-flex justify-content-between align-items-center fw-bold fs-5 bg-input text-main shadow-sm border-secondary py-2" type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    {comparePlanName || "-- Select Saved Plan --"}
                                </button>
                                {isDropdownOpen && (
                                    <ul className="dropdown-menu w-100 show shadow-lg border-secondary bg-card mt-1 p-2" style={{maxHeight: '250px', overflowY: 'auto'}}>
                                        {savedPlans.map(p => (
                                            <li key={p}><button className="dropdown-item py-2 fw-bold text-main rounded-3" onClick={() => { setComparePlanName(p); setIsDropdownOpen(false); }}><i className="bi bi-folder2-open text-warning me-2"></i> {p}</button></li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        {comparePlanName && compareMetrics && currentMetrics ? (
                            <div className="d-flex flex-column gap-3 slide-down">
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Final Estate Value</span>
                                    <div className="d-flex align-items-center"><span className="fw-bold fs-5 text-success">{formatCurrency(compareMetrics.finalNW)}</span>{renderDiff(currentMetrics.finalNW, compareMetrics.finalNW, false)}</div>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Lifetime Taxes Paid</span>
                                    <div className="d-flex align-items-center"><span className="fw-bold fs-5 text-danger">{formatCurrency(compareMetrics.totalTax)}</span>{renderDiff(currentMetrics.totalTax, compareMetrics.totalTax, true)}</div>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Total Lifetime Spend</span>
                                    <div className="d-flex align-items-center"><span className="fw-bold fs-5 text-main">{formatCurrency(compareMetrics.totalSpend)}</span>{renderDiff(currentMetrics.totalSpend, compareMetrics.totalSpend, false)}</div>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Retirement Age</span>
                                    <div className="d-flex align-items-center"><span className="fw-bold fs-5 text-main">{compareMetrics.p1RetAge} {compareMetrics.isCouple ? `/ ${compareMetrics.p2RetAge}` : ''}</span>{renderDiff(currentMetrics.p1RetAge, compareMetrics.p1RetAge, true, false)}</div>
                                </div>
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Plan Status</span>
                                    <span className={`badge ${compareMetrics.isSuccess ? 'bg-success' : 'bg-danger'} bg-opacity-25 ${compareMetrics.isSuccess ? 'text-success' : 'text-danger'} border rounded-pill px-3 py-2`}>
                                        <i className={`bi ${compareMetrics.isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-1`}></i> {compareMetrics.isSuccess ? 'Successful' : 'Failed'}
                                    </span>
                                </div>
                                <div className="d-flex gap-2 mt-2">
                                    <button onClick={handleMakeActive} className="btn btn-outline-warning flex-grow-1 fw-bold rounded-3 py-2"><i className="bi bi-cloud-arrow-down me-2 fs-5"></i> Make Live</button>
                                    <button onClick={handleDelete} className="btn btn-outline-danger px-3 rounded-3"><i className="bi bi-trash fs-5"></i></button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-muted fst-italic py-5 d-flex flex-column align-items-center justify-content-center h-100">
                                <i className="bi bi-folder2-open text-secondary opacity-50 mb-3" style={{fontSize: '3rem'}}></i>Select a saved plan to compare.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {comparePlanName && inputDiffs.length > 0 && (
                <div className="rp-card border border-secondary rounded-4 p-4 mb-4 shadow-sm bg-secondary bg-opacity-10">
                    <h6 className="fw-bold text-uppercase ls-1 text-muted mb-3"><i className="bi bi-sliders me-2"></i> Scenario Inputs (What Changed)</h6>
                    <div className="d-flex flex-wrap gap-2">
                        {inputDiffs.map(diff => (
                            <div key={diff.key} className="bg-input border border-secondary rounded-pill px-3 py-1 small fw-medium d-flex align-items-center shadow-sm">
                                <span className="text-muted me-2">{formatInputKey(diff.key)}:</span>
                                <span className="text-decoration-line-through opacity-50 me-2">{typeof diff.oldVal === 'number' ? formatCurrency(diff.oldVal) : diff.oldVal}</span>
                                <i className="bi bi-arrow-right text-warning mx-1"></i>
                                <span className="text-main ms-1 fw-bold">{typeof diff.newVal === 'number' ? formatCurrency(diff.newVal) : diff.newVal}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {comparePlanName && compareResults && chartData.length > 0 && (
                <div className="rp-card border border-secondary rounded-4 p-3 p-md-4 shadow-sm position-relative overflow-hidden">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                        <h5 className="fw-bold text-uppercase ls-1 text-info">Trajectory Comparison</h5>
                        <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1">
                            {['NW', 'TAX', 'SPEND'].map(m => (
                                <button key={m} onClick={() => setChartMode(m as any)} className={`btn btn-sm rounded-pill fw-bold border-0 px-4 py-1 ${chartMode === m ? 'bg-primary text-white shadow' : 'text-muted bg-transparent'}`}>{m === 'NW' ? 'Net Worth' : m === 'TAX' ? 'Taxes' : 'Spending'}</button>
                            ))}
                        </div>
                    </div>
                    <div className="w-100 position-relative" style={{ height: '380px' }}>
                        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%" preserveAspectRatio="none" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)} className="cursor-crosshair">
                            {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                                const y = PAD_Y + (PLOT_H * tick);
                                return <g key={tick}><line x1={PAD_X} y1={y} x2={VIEW_W - PAD_X} y2={y} stroke="#6c757d" strokeOpacity="0.2" strokeDasharray="4 4" /><text x={PAD_X - 10} y={y + 4} fill="#6c757d" fontSize="11" textAnchor="end" fontWeight="bold">{formatShortCurrency(maxVal - (maxVal * tick))}</text></g>;
                            })}
                            {areaPath && <path d={areaPath} fill="rgba(255, 193, 7, 0.15)" stroke="none" />}
                            <path d={activePath} fill="none" stroke="#0d6efd" strokeWidth="3" />
                            <path d={comparePath} fill="none" stroke="#ffc107" strokeWidth="3" strokeDasharray="6 4" />
                            {hoverIndex !== null && chartData[hoverIndex] && (
                                <g>
                                    <line x1={getX(hoverIndex)} y1={PAD_Y} x2={getX(hoverIndex)} y2={VIEW_H - PAD_Y} stroke="#ffffff" strokeOpacity="0.3" strokeDasharray="2 2" />
                                    <circle cx={getX(hoverIndex)} cy={getY(getMetricData(chartData[hoverIndex]).active)} r="5" fill="#0d6efd" stroke="#16181d" strokeWidth="2" />
                                    <circle cx={getX(hoverIndex)} cy={getY(getMetricData(chartData[hoverIndex]).compare!)} r="5" fill="#ffc107" stroke="#16181d" strokeWidth="2" />
                                    <rect x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 170 : getX(hoverIndex) + 15} y={PAD_Y} width="150" height="80" fill="#1e1e24" stroke="#495057" rx="6" />
                                    <text x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 160 : getX(hoverIndex) + 25} y={PAD_Y + 20} fill="#ffffff" fontSize="12" fontWeight="bold">Year: {chartData[hoverIndex].year}</text>
                                    <text x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 145 : getX(hoverIndex) + 40} y={PAD_Y + 44} fill="#ffffff" fontSize="11">Live: {formatShortCurrency(getMetricData(chartData[hoverIndex]).active)}</text>
                                    <text x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 145 : getX(hoverIndex) + 40} y={PAD_Y + 64} fill="#ffffff" fontSize="11">Comp: {formatShortCurrency(getMetricData(chartData[hoverIndex]).compare!)}</text>
                                </g>
                            )}
                        </svg>
                    </div>
                </div>
            )}
        </div>
    );
}