import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';

export default function CompareTab() {
    const { data, results } = useFinance();
    const [savedPlans, setSavedPlans] = useState<string[]>([]);
    const [comparePlanName, setComparePlanName] = useState<string>('');
    const [compareResults, setCompareResults] = useState<any>(null);
    const [compareData, setCompareData] = useState<any>(null);
    const [isCalculating, setIsCalculating] = useState<boolean>(false);
    
    // Chart hover state
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    // Load available saved plans on mount
    useEffect(() => {
        const plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
        setSavedPlans(plans);
    }, []);

    // Run the secondary background engine when a comparison plan is selected
    useEffect(() => {
        if (comparePlanName) {
            setIsCalculating(true);
            setTimeout(() => {
                const planStr = localStorage.getItem(`rp_saved_plan_${comparePlanName}`);
                if (planStr) {
                    const parsed = JSON.parse(planStr);
                    setCompareData(parsed);
                    // Safe Clone for isolated engine run
                    const engine = new FinanceEngine(JSON.parse(JSON.stringify(parsed)));
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

    // Robust Metric Extractor strictly bound to the data object passed into it
    const getMetrics = (planData: any, planTimeline: any) => {
        if (!planData || !planTimeline || planTimeline.length === 0) return null;
        
        const startYear = planTimeline[0].year;
        const inflation = (planData.inputs.inflation_rate || 2.1) / 100;
        
        const getReal = (nominal: number, yOut: number) => {
            if (!planData.useRealDollars) return nominal;
            return nominal / Math.pow(1 + inflation, Math.max(0, yOut - startYear));
        };

        const finalYear = planTimeline[planTimeline.length - 1];
        
        // A plan is successful if liquid net worth never drops below zero
        const isSuccess = planTimeline.every((y: any) => Math.round(y.liquidNW) >= 0);

        return {
            p1Age: Number(planData.inputs.p1_age) || 0,
            p2Age: planData.mode === 'Couple' ? (Number(planData.inputs.p2_age) || 0) : null,
            p1Income: Number(planData.inputs.p1_income) || 0,
            p2Income: planData.mode === 'Couple' ? (Number(planData.inputs.p2_income) || 0) : 0,
            p1RetAge: Number(planData.inputs.p1_retireAge) || 60,
            p2RetAge: planData.mode === 'Couple' ? (Number(planData.inputs.p2_retireAge) || 60) : null,
            finalNW: getReal(finalYear.liquidNW + (finalYear.reIncludedEq || 0), finalYear.year),
            isSuccess,
            isCouple: planData.mode === 'Couple'
        };
    };

    const currentMetrics = getMetrics(data, results?.timeline);
    const compareMetrics = getMetrics(compareData, compareResults);

    // Differential Tag Renderer (Green = Better, Red = Worse)
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

    // --- Chart Data Preparation ---
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
                active: getRealValue(y.liquidNW + (y.reIncludedEq || 0), y.year, data, baseYear),
                compare: cY ? getRealValue(cY.liquidNW + (cY.reIncludedEq || 0), cY.year, compareData, baseYear) : null
            };
        });
    }

    // SVG Chart Geometry
    const VIEW_W = 1000;
    const VIEW_H = 300;
    const PAD_X = 60;
    const PAD_Y = 40;
    const PLOT_W = VIEW_W - PAD_X * 2;
    const PLOT_H = VIEW_H - PAD_Y * 2;

    const allValues = chartData.flatMap(d => [d.active, d.compare]).filter(v => v !== null) as number[];
    const maxNW = allValues.length > 0 ? Math.max(...allValues, 100000) : 100000;
    
    const getX = (index: number) => PAD_X + (index / Math.max(1, chartData.length - 1)) * PLOT_W;
    const getY = (val: number) => PAD_Y + PLOT_H - ((val / maxNW) * PLOT_H);

    const activePath = chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.active)}`).join(' ');
    const comparePath = compareResults ? chartData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.compare)}`).join(' ') : '';

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

            <div className="row g-4 mb-4">
                {/* Left Column: Live Active Plan */}
                <div className="col-12 col-xl-6">
                    <div className="rp-card border-secondary rounded-4 p-4 h-100 shadow-sm position-relative">
                        <div className="position-absolute top-0 start-0 w-100 border-top border-3 border-primary rounded-top-4"></div>
                        
                        {/* Fixed Height Header */}
                        <div className="d-flex flex-column justify-content-end mb-4 pb-3 border-bottom border-secondary" style={{ height: '90px' }}>
                            <h6 className="text-muted small fw-bold text-uppercase ls-1 mb-2">Currently Editing</h6>
                            <h4 className="fw-bold text-primary mb-0 d-flex align-items-center text-truncate">
                                <i className="bi bi-pencil-square me-2 fs-5"></i> Live Inputs
                            </h4>
                        </div>

                        {currentMetrics ? (
                            <div className="d-flex flex-column gap-3">
                                {/* Current Age Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Current Age</span>
                                    <span className="fw-bold fs-5 text-main">
                                        {currentMetrics.p1Age} {currentMetrics.isCouple ? `/ ${currentMetrics.p2Age}` : ''}
                                    </span>
                                </div>
                                {/* Pre-Tax Income Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Household Income</span>
                                    <span className="fw-bold fs-5 text-main">
                                        {formatCurrency(currentMetrics.p1Income + currentMetrics.p2Income)}
                                    </span>
                                </div>
                                {/* Retirement Age Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Retirement Age</span>
                                    <span className="fw-bold fs-5 text-main">
                                        {currentMetrics.p1RetAge} {currentMetrics.isCouple ? `/ ${currentMetrics.p2RetAge}` : ''}
                                    </span>
                                </div>
                                {/* Final Estate Value Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Final Estate Value</span>
                                    <span className="fw-bold fs-5 text-success">{formatCurrency(currentMetrics.finalNW)}</span>
                                </div>
                                {/* Plan Status Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Plan Status</span>
                                    {currentMetrics.isSuccess ? (
                                        <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-3 py-2"><i className="bi bi-check-circle-fill me-1"></i> Successful</span>
                                    ) : (
                                        <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-3 py-2"><i className="bi bi-exclamation-triangle-fill me-1"></i> Failed</span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted fst-italic text-center py-5">Loading current data...</div>
                        )}
                    </div>
                </div>

                {/* Right Column: Compare Plan */}
                <div className="col-12 col-xl-6">
                    <div className="rp-card border-secondary rounded-4 p-4 h-100 shadow-sm position-relative">
                        <div className="position-absolute top-0 start-0 w-100 border-top border-3 border-warning rounded-top-4"></div>
                        
                        {/* Fixed Height Header */}
                        <div className="d-flex flex-column justify-content-end mb-4 pb-3 border-bottom border-secondary position-relative" style={{ height: '90px' }}>
                            <div className="d-flex justify-content-between align-items-center w-100 mb-2">
                                <h6 className="text-muted small fw-bold text-uppercase ls-1 mb-0">Compare Against</h6>
                                {isCalculating && <span className="spinner-border spinner-border-sm text-warning"></span>}
                            </div>
                            <select 
                                className="form-select bg-input border-secondary fw-bold text-main shadow-sm cursor-pointer w-100 fs-5 py-2"
                                value={comparePlanName}
                                onChange={(e) => setComparePlanName(e.target.value)}
                            >
                                <option value="">-- Select Saved Plan --</option>
                                {savedPlans.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {comparePlanName && compareMetrics && currentMetrics ? (
                            <div className="d-flex flex-column gap-3 slide-down">
                                {/* Current Age Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Current Age</span>
                                    <div className="d-flex align-items-center">
                                        <span className="fw-bold fs-5 text-main">
                                            {compareMetrics.p1Age} {compareMetrics.isCouple ? `/ ${compareMetrics.p2Age}` : ''}
                                        </span>
                                        {renderDiff(currentMetrics.p1Age, compareMetrics.p1Age, false, false)}
                                    </div>
                                </div>
                                {/* Pre-Tax Income Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Household Income</span>
                                    <div className="d-flex align-items-center">
                                        <span className="fw-bold fs-5 text-main">
                                            {formatCurrency(compareMetrics.p1Income + compareMetrics.p2Income)}
                                        </span>
                                        {renderDiff(currentMetrics.p1Income + currentMetrics.p2Income, compareMetrics.p1Income + compareMetrics.p2Income, false, true)}
                                    </div>
                                </div>
                                {/* Retirement Age Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Retirement Age</span>
                                    <div className="d-flex align-items-center">
                                        <span className="fw-bold fs-5 text-main">
                                            {compareMetrics.p1RetAge} {compareMetrics.isCouple ? `/ ${compareMetrics.p2RetAge}` : ''}
                                        </span>
                                        {renderDiff(currentMetrics.p1RetAge, compareMetrics.p1RetAge, true, false)}
                                    </div>
                                </div>
                                {/* Final Estate Value Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Final Estate Value</span>
                                    <div className="d-flex align-items-center">
                                        <span className="fw-bold fs-5 text-success">{formatCurrency(compareMetrics.finalNW)}</span>
                                        {renderDiff(currentMetrics.finalNW, compareMetrics.finalNW, false)}
                                    </div>
                                </div>
                                {/* Plan Status Row */}
                                <div className="bg-input border border-secondary rounded-3 px-3 d-flex justify-content-between align-items-center" style={{ height: '56px' }}>
                                    <span className="text-muted fw-bold small text-uppercase ls-1">Plan Status</span>
                                    <div className="d-flex align-items-center">
                                        {compareMetrics.isSuccess ? (
                                            <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-3 py-2"><i className="bi bi-check-circle-fill me-1"></i> Successful</span>
                                        ) : (
                                            <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-3 py-2"><i className="bi bi-exclamation-triangle-fill me-1"></i> Failed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : comparePlanName && isCalculating ? (
                            <div className="d-flex align-items-center justify-content-center flex-grow-1" style={{minHeight: '350px'}}>
                                <span className="spinner-border text-warning" style={{width: '3rem', height: '3rem', borderWidth: '0.3em'}}></span>
                            </div>
                        ) : (
                            <div className="text-center text-muted fst-italic py-5 d-flex flex-column align-items-center justify-content-center h-100">
                                <i className="bi bi-folder2-open text-secondary opacity-50 mb-3" style={{fontSize: '3rem'}}></i>
                                Select a saved plan from the dropdown<br/>to generate a comparison.
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Bottom Chart: Net Worth Comparison */}
            {comparePlanName && compareResults && chartData.length > 0 && (
                <div className="rp-card border border-secondary rounded-4 p-3 p-md-4 shadow-sm slide-down position-relative overflow-hidden">
                    <h5 className="fw-bold text-uppercase ls-1 text-info mb-4 text-center">Net Worth Trajectory Comparison</h5>
                    
                    <div className="w-100 position-relative" style={{ height: '350px' }}>
                        <svg 
                            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} 
                            width="100%" height="100%" 
                            preserveAspectRatio="none"
                            onMouseMove={handleMouseMove}
                            onMouseLeave={() => setHoverIndex(null)}
                            className="cursor-crosshair"
                        >
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                                const y = PAD_Y + (PLOT_H * tick);
                                const val = maxNW - (maxNW * tick);
                                return (
                                    <g key={`grid-${tick}`}>
                                        <line x1={PAD_X} y1={y} x2={VIEW_W - PAD_X} y2={y} stroke="#6c757d" strokeOpacity="0.2" strokeDasharray="4 4" />
                                        <text x={PAD_X - 10} y={y + 4} fill="#6c757d" fontSize="11" textAnchor="end" fontWeight="bold">{formatShortCurrency(val)}</text>
                                    </g>
                                );
                            })}

                            {/* Active Data Line (Primary) */}
                            <path d={activePath} fill="none" stroke="#0d6efd" strokeWidth="3" style={{ filter: 'drop-shadow(0px 4px 6px rgba(13, 110, 253, 0.3))' }} />
                            
                            {/* Compare Data Line (Warning/Yellow) */}
                            <path d={comparePath} fill="none" stroke="#ffc107" strokeWidth="3" strokeDasharray="6 4" style={{ filter: 'drop-shadow(0px 4px 6px rgba(255, 193, 7, 0.3))' }} />

                            {/* Hover Interaction Overlay */}
                            {hoverIndex !== null && chartData[hoverIndex] && (
                                <g>
                                    <line x1={getX(hoverIndex)} y1={PAD_Y} x2={getX(hoverIndex)} y2={VIEW_H - PAD_Y} stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="2 2" />
                                    
                                    <circle cx={getX(hoverIndex)} cy={getY(chartData[hoverIndex].active)} r="5" fill="#0d6efd" stroke="#16181d" strokeWidth="2" />
                                    <circle cx={getX(hoverIndex)} cy={getY(chartData[hoverIndex].compare)} r="5" fill="#ffc107" stroke="#16181d" strokeWidth="2" />
                                    
                                    {/* Tooltip Box */}
                                    <rect x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 170 : getX(hoverIndex) + 15} y={PAD_Y} width="150" height="80" fill="#1e1e24" stroke="#495057" rx="6" />
                                    <text x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 160 : getX(hoverIndex) + 25} y={PAD_Y + 20} fill="#ffffff" fontSize="12" fontWeight="bold">Year: {chartData[hoverIndex].year} (Age {chartData[hoverIndex].age})</text>
                                    
                                    <circle cx={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 155 : getX(hoverIndex) + 30} cy={PAD_Y + 40} r="4" fill="#0d6efd" />
                                    <text x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 145 : getX(hoverIndex) + 40} y={PAD_Y + 44} fill="#ffffff" fontSize="11">Live: {formatShortCurrency(chartData[hoverIndex].active)}</text>
                                    
                                    <circle cx={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 155 : getX(hoverIndex) + 30} cy={PAD_Y + 60} r="4" fill="#ffc107" />
                                    <text x={getX(hoverIndex) > VIEW_W / 2 ? getX(hoverIndex) - 145 : getX(hoverIndex) + 40} y={PAD_Y + 64} fill="#ffffff" fontSize="11">{comparePlanName.substring(0,6)}: {formatShortCurrency(chartData[hoverIndex].compare)}</text>
                                </g>
                            )}
                        </svg>
                    </div>

                    <div className="d-flex justify-content-center mt-3 gap-4">
                        <div className="d-flex align-items-center"><span className="badge bg-primary me-2 shadow-sm" style={{width:'20px', height:'4px', padding:0}}></span> <span className="small text-muted fw-bold">Live Inputs</span></div>
                        <div className="d-flex align-items-center"><span className="badge bg-warning me-2 shadow-sm" style={{width:'20px', height:'4px', padding:0}}></span> <span className="small text-muted fw-bold">{comparePlanName}</span></div>
                    </div>
                </div>
            )}

        </div>
    );
}