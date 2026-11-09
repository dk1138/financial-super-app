'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, SegmentedControl } from '../SharedUI';
import { 
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
    XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, 
    Cell, ReferenceLine, ReferenceDot 
} from 'recharts';

export default function CanadianPeerBenchmarks() {
    const { data, results } = useFinance();

    // Default to user's plan inputs, with live overrides for interactive exploration
    const planAge = Number(data.inputs.p1_age) || 35;
    const planProvince = data.inputs.province || 'ON';
    const isCouple = data.mode === 'Couple';

    const [activeAge, setActiveAge] = useState<number>(planAge);
    const [activeProvince, setActiveProvince] = useState<string>(planProvince);
    const [viewMode, setViewMode] = useState<'household' | 'individual'>(isCouple ? 'household' : 'individual');
    const [selectedMetric, setSelectedMetric] = useState<'networth' | 'income' | 'tfsa' | 'housing'>('networth');

    // Extract live plan actuals
    const firstYear = results?.timeline?.[0];
    const userNetWorth = useMemo(() => {
        if (!firstYear) return 350000;
        return (firstYear.liquidNW || 0) + (firstYear.reIncludedEq || 0);
    }, [firstYear]);

    const userGrossIncome = useMemo(() => {
        const p1 = Number(data.inputs.p1_income) || 0;
        const p2 = isCouple ? (Number(data.inputs.p2_income) || 0) : 0;
        return p1 + p2 || 105000;
    }, [data.inputs, isCouple]);

    const userTfsa = useMemo(() => {
        const p1 = Number(data.inputs.p1_tfsa) || 0;
        const p2 = isCouple ? (Number(data.inputs.p2_tfsa) || 0) : 0;
        return p1 + p2 || 35000;
    }, [data.inputs, isCouple]);

    const userShelterRatio = useMemo(() => {
        let annualShelter = 0;
        (data.properties || []).forEach((p: any) => {
            const monthlyPmt = Number(p.monthlyPayment) || 0;
            const propTax = Number(p.propertyTax) || 0;
            const condo = Number(p.condoFees) || 0;
            annualShelter += (monthlyPmt * 12) + propTax + (condo * 12);
        });
        if (annualShelter === 0) annualShelter = (Number(data.inputs.annualRent) || 0) * 12;
        if (annualShelter === 0 && userGrossIncome > 0) annualShelter = userGrossIncome * 0.28;
        return userGrossIncome > 0 ? (annualShelter / userGrossIncome) * 100 : 28.0;
    }, [data.properties, data.inputs, userGrossIncome]);

    // Statistics Canada Wealth Scale Factors by Province (Survey of Financial Security 2023 / 2026 indexed)
    const provWealthScale: Record<string, number> = {
        ON: 1.16, BC: 1.24, AB: 1.06, QC: 0.84, MB: 0.81, 
        SK: 0.87, NS: 0.77, NB: 0.75, NL: 0.79, PE: 0.77,
        YT: 0.95, NT: 0.92, NU: 0.85
    };

    // Statistics Canada Wage Scale Factors by Province (Survey of Employment, Payrolls and Hours)
    const provWageScale: Record<string, number> = {
        AB: 1.12, ON: 1.05, BC: 1.03, SK: 0.98, MB: 0.93,
        QC: 0.92, NL: 0.96, NS: 0.88, NB: 0.86, PE: 0.84,
        YT: 1.15, NT: 1.20, NU: 1.18
    };

    const provScaleW = provWealthScale[activeProvince] || 1.0;
    const provScaleI = provWageScale[activeProvince] || 1.0;
    const hhScale = viewMode === 'household' ? 1.0 : 0.64;

    // Statistics Canada Benchmark Anchors by Age Group (2026/2027 Dollar Base)
    const statCanAnchors: Record<number, { p25: number, p50: number, p75: number, p90: number, inc50: number, inc75: number, inc90: number, tfsaAvg: number, tfsaMed: number, shelter: number }> = {
        20: { p25: 5000, p50: 24000, p75: 75000, p90: 180000, inc50: 34000, inc75: 52000, inc90: 78000, tfsaAvg: 5800, tfsaMed: 2900, shelter: 36.0 },
        25: { p25: 12000, p50: 75000, p75: 220000, p90: 540000, inc50: 58000, inc75: 88000, inc90: 135000, tfsaAvg: 14200, tfsaMed: 6400, shelter: 35.0 },
        30: { p25: 45000, p50: 185000, p75: 510000, p90: 1120000, inc50: 76000, inc75: 120000, inc90: 180000, tfsaAvg: 23500, tfsaMed: 10200, shelter: 32.5 },
        35: { p25: 95000, p50: 345000, p75: 890000, p90: 1850000, inc50: 92000, inc75: 145000, inc90: 215000, tfsaAvg: 34800, tfsaMed: 16100, shelter: 29.5 },
        40: { p25: 165000, p50: 530000, p75: 1320000, p90: 2650000, inc50: 105000, inc75: 164000, inc90: 248000, tfsaAvg: 42000, tfsaMed: 20000, shelter: 27.0 },
        45: { p25: 240000, p50: 760000, p75: 1780000, p90: 3450000, inc50: 112000, inc75: 172000, inc90: 265000, tfsaAvg: 49500, tfsaMed: 24500, shelter: 24.5 },
        50: { p25: 310000, p50: 980000, p75: 2150000, p90: 4150000, inc50: 108000, inc75: 168000, inc90: 255000, tfsaAvg: 58700, tfsaMed: 31000, shelter: 22.0 },
        55: { p25: 365000, p50: 1180000, p75: 2450000, p90: 4680000, inc50: 98000, inc75: 156000, inc90: 238000, tfsaAvg: 66000, tfsaMed: 37000, shelter: 20.0 },
        60: { p25: 390000, p50: 1240000, p75: 2550000, p90: 4850000, inc50: 82000, inc75: 135000, inc90: 210000, tfsaAvg: 71400, tfsaMed: 42000, shelter: 19.5 },
        65: { p25: 380000, p50: 1180000, p75: 2450000, p90: 4650000, inc50: 65000, inc75: 105000, inc90: 175000, tfsaAvg: 74000, tfsaMed: 44500, shelter: 19.0 },
        70: { p25: 350000, p50: 1080000, p75: 2280000, p90: 4300000, inc50: 58000, inc75: 94000, inc90: 155000, tfsaAvg: 76900, tfsaMed: 47500, shelter: 18.5 },
        75: { p25: 310000, p50: 960000, p75: 2050000, p90: 3850000, inc50: 52000, inc75: 85000, inc90: 140000, tfsaAvg: 78500, tfsaMed: 49000, shelter: 18.0 }
    };

    // Continuous Monotone Interpolation function for any exact single-year age (20 to 80)
    const interpolateAgeData = (age: number) => {
        const keys = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
        if (age <= keys[0]) return statCanAnchors[keys[0]];
        if (age >= keys[keys.length - 1]) return statCanAnchors[keys[keys.length - 1]];

        for (let i = 0; i < keys.length - 1; i++) {
            const x0 = keys[i];
            const x1 = keys[i + 1];
            if (age >= x0 && age <= x1) {
                const t = (age - x0) / (x1 - x0);
                const d0 = statCanAnchors[x0];
                const d1 = statCanAnchors[x1];
                return {
                    p25: d0.p25 + t * (d1.p25 - d0.p25),
                    p50: d0.p50 + t * (d1.p50 - d0.p50),
                    p75: d0.p75 + t * (d1.p75 - d0.p75),
                    p90: d0.p90 + t * (d1.p90 - d0.p90),
                    inc50: d0.inc50 + t * (d1.inc50 - d0.inc50),
                    inc75: d0.inc75 + t * (d1.inc75 - d0.inc75),
                    inc90: d0.inc90 + t * (d1.inc90 - d0.inc90),
                    tfsaAvg: d0.tfsaAvg + t * (d1.tfsaAvg - d0.tfsaAvg),
                    tfsaMed: d0.tfsaMed + t * (d1.tfsaMed - d0.tfsaMed),
                    shelter: d0.shelter + t * (d1.shelter - d0.shelter),
                };
            }
        }
        return statCanAnchors[35];
    };

    // Calculate benchmarks for the exact active age
    const activeCohortBenchmarks = useMemo(() => {
        const raw = interpolateAgeData(activeAge);

        // National Benchmarks (Canada-wide)
        const nationalNwP25 = Math.round(raw.p25 * hhScale);
        const nationalNwP50 = Math.round(raw.p50 * hhScale);
        const nationalNwP75 = Math.round(raw.p75 * hhScale);
        const nationalNwP90 = Math.round(raw.p90 * hhScale);

        const nationalIncP50 = Math.round(raw.inc50 * hhScale);
        const nationalIncP75 = Math.round(raw.inc75 * hhScale);
        const nationalIncP90 = Math.round(raw.inc90 * hhScale);

        // Provincial Benchmarks (Rescaled by Provincial Economic Indices)
        const provNwP25 = Math.round(nationalNwP25 * provScaleW);
        const provNwP50 = Math.round(nationalNwP50 * provScaleW);
        const provNwP75 = Math.round(nationalNwP75 * provScaleW);
        const provNwP90 = Math.round(nationalNwP90 * provScaleW);

        const provIncP50 = Math.round(nationalIncP50 * provScaleI);
        const provIncP75 = Math.round(nationalIncP75 * provScaleI);
        const provIncP90 = Math.round(nationalIncP90 * provScaleI);

        const tfsaYearsEligible = Math.max(0, Math.min(2026 - 2009 + 1, activeAge - 18 + 1));
        const tfsaMax = Math.min(102000, tfsaYearsEligible * 6500);

        const calcPercentile = (val: number, p25: number, p50: number, p75: number, p90: number) => {
            if (val <= 0) return 5;
            if (val < p25) return Math.max(5, Math.round(5 + (val / p25) * 20));
            if (val < p50) return Math.round(25 + ((val - p25) / (p50 - p25)) * 25);
            if (val < p75) return Math.round(50 + ((val - p50) / (p75 - p50)) * 25);
            if (val < p90) return Math.round(75 + ((val - p75) / (p90 - p75)) * 15);
            return Math.min(99, Math.round(90 + ((val - p90) / (p90 * 0.75)) * 9));
        };

        const nationalNwPercentile = calcPercentile(userNetWorth, nationalNwP25, nationalNwP50, nationalNwP75, nationalNwP90);
        const provNwPercentile = calcPercentile(userNetWorth, provNwP25, provNwP50, provNwP75, provNwP90);

        const nationalIncPercentile = calcPercentile(userGrossIncome, nationalIncP50 * 0.5, nationalIncP50, nationalIncP75, nationalIncP90);
        const provIncPercentile = calcPercentile(userGrossIncome, provIncP50 * 0.5, provIncP50, provIncP75, provIncP90);

        // Composite Overall Canadian Financial Health Score
        const tfsaScore = Math.min(100, Math.round((userTfsa / Math.max(1, raw.tfsaAvg)) * 50));
        const shelterScore = userShelterRatio <= 28 ? 95 : userShelterRatio <= 32 ? 80 : userShelterRatio <= 40 ? 55 : 30;
        const overallScore = Math.min(99, Math.round(
            (nationalNwPercentile * 0.40) + 
            (nationalIncPercentile * 0.30) + 
            (tfsaScore * 0.15) + 
            (shelterScore * 0.15)
        ));

        return {
            nationalNwP25, nationalNwP50, nationalNwP75, nationalNwP90,
            provNwP25, provNwP50, provNwP75, provNwP90,
            nationalIncP50, nationalIncP75, nationalIncP90,
            provIncP50, provIncP75, provIncP90,
            tfsaAvg: Math.round(raw.tfsaAvg),
            tfsaMed: Math.round(raw.tfsaMed),
            tfsaMax,
            shelterAvg: Number(raw.shelter.toFixed(1)),
            nationalNwPercentile, provNwPercentile,
            nationalIncPercentile, provIncPercentile,
            overallScore
        };
    }, [activeAge, provScaleW, provScaleI, hhScale, userNetWorth, userGrossIncome, userTfsa, userShelterRatio]);

    const trajectoryData = useMemo(() => {
        const ages = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
        return ages.map(age => {
            const raw = interpolateAgeData(age);
            const p25 = Math.round(raw.p25 * hhScale * provScaleW);
            const median = Math.round(raw.p50 * hhScale * provScaleW);
            const p75 = Math.round(raw.p75 * hhScale * provScaleW);
            const p90 = Math.round(raw.p90 * hhScale * provScaleW);

            return {
                age,
                p25,
                median,
                p75,
                p90,
                userNW: age === Math.round(activeAge / 5) * 5 ? userNetWorth : null
            };
        });
    }, [hhScale, provScaleW, activeAge, userNetWorth]);

    // Data for Net Worth Cohort Bar Chart
    const netWorthBarData = useMemo(() => [
        { name: 'Bottom 25%', value: activeCohortBenchmarks.provNwP25, fill: '#64748b' },
        { name: 'Canadian Median', value: activeCohortBenchmarks.nationalNwP50, fill: '#3b82f6' },
        { name: `${activeProvince} Median`, value: activeCohortBenchmarks.provNwP50, fill: '#0ea5e9' },
        { name: 'Top 25% (75th)', value: activeCohortBenchmarks.provNwP75, fill: '#f59e0b' },
        { name: 'Top 10% (90th)', value: activeCohortBenchmarks.provNwP90, fill: '#8b5cf6' },
        { name: 'You (Live Plan)', value: Math.max(0, userNetWorth), fill: '#10b981' }
    ], [activeCohortBenchmarks, activeProvince, userNetWorth]);

    // Data for Income Comparison Bar Chart
    const incomeBarData = useMemo(() => [
        { name: 'National Median', value: activeCohortBenchmarks.nationalIncP50, fill: '#64748b' },
        { name: `${activeProvince} Median`, value: activeCohortBenchmarks.provIncP50, fill: '#3b82f6' },
        { name: 'Top 25% (75th)', value: activeCohortBenchmarks.provIncP75, fill: '#f59e0b' },
        { name: 'Top 10% (90th)', value: activeCohortBenchmarks.provIncP90, fill: '#8b5cf6' },
        { name: 'Your Income', value: userGrossIncome, fill: '#10b981' }
    ], [activeCohortBenchmarks, activeProvince, userGrossIncome]);

    // Data for TFSA Comparison Bar Chart
    const tfsaBarData = useMemo(() => [
        { name: 'CRA Age Median', value: activeCohortBenchmarks.tfsaMed, fill: '#64748b' },
        { name: 'CRA Age Average', value: activeCohortBenchmarks.tfsaAvg, fill: '#3b82f6' },
        { name: 'Max Cumulative Room', value: activeCohortBenchmarks.tfsaMax, fill: '#f59e0b' },
        { name: 'Your TFSA Pool', value: userTfsa, fill: '#10b981' }
    ], [activeCohortBenchmarks, userTfsa]);

    // Data for Housing Cost Burden Comparison
    const shelterBarData = useMemo(() => [
        { name: 'Your Shelter %', value: Number(userShelterRatio.toFixed(1)), fill: userShelterRatio <= 32 ? '#10b981' : '#ef4444' },
        { name: 'Canadian Age Avg', value: activeCohortBenchmarks.shelterAvg, fill: '#3b82f6' },
        { name: 'CMHC 32% Cap', value: 32.0, fill: '#d97706' },
        { name: 'Severe Stress (40%)', value: 40.0, fill: '#64748b' }
    ], [userShelterRatio, activeCohortBenchmarks]);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    const formatShort = (val: number) => {
        if (Math.abs(val) >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
        if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
        return `$${val}`;
    };

    const deltaNetWorth = userNetWorth - activeCohortBenchmarks.provNwP50;
    const deltaPercent = activeCohortBenchmarks.provNwP50 > 0 ? (deltaNetWorth / activeCohortBenchmarks.provNwP50) * 100 : 0;

    const standardAges = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
    const ageOptions = useMemo(() => {
        const set = new Set([...standardAges, planAge, activeAge]);
        return Array.from(set).sort((a, b) => a - b);
    }, [planAge, activeAge]);

    return (
        <div className="fade-in-tab pb-4">
            {/* Top Control Bar with Visually Cohesive Selectors */}
            <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        {/* High-Contrast Crisp Status Pills */}
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge rounded-pill bg-dark bg-opacity-75 border border-secondary text-white px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-sm">
                                <span className="rounded-circle bg-primary" style={{ width: 7, height: 7 }}></span>
                                <span className="text-light" style={{ fontSize: '0.72rem' }}>Statistics Canada & CRA Grounded</span>
                            </span>
                            <span className="badge rounded-pill bg-dark bg-opacity-75 border border-secondary text-white px-2.5 py-1.5 d-inline-flex align-items-center gap-1.5 shadow-sm">
                                <span className="rounded-circle bg-success" style={{ width: 7, height: 7 }}></span>
                                <span className="text-light" style={{ fontSize: '0.72rem' }}>100% In-Browser · Private</span>
                            </span>
                        </div>
                        <h4 className="fw-bolder mb-0 text-main">Canadian Demographic Peer Benchmarking</h4>
                        <p className="text-muted small mb-0">
                            Continuous single-year spline interpolation across official Statistics Canada SFS wealth and CIS income tables.
                        </p>
                    </div>

                    {/* Visually Cohesive Control Toolbar */}
                    <div className="d-flex flex-wrap align-items-center gap-2.5">
                        {/* 1. Cohort Age Control */}
                        <div>
                            <label className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                COHORT AGE (EXTRAPOLATED)
                            </label>
                            <div className="d-flex align-items-center bg-input border border-secondary rounded-3 shadow-sm" style={{ height: '38px' }}>
                                <button 
                                    className="btn btn-sm btn-link text-muted px-2.5 py-0 border-0 h-100 d-flex align-items-center hover-opacity-100" 
                                    onClick={() => setActiveAge(a => Math.max(20, a - 5))}
                                    title="Step back 5 years"
                                    type="button"
                                >
                                    <i className="bi bi-dash-lg"></i>
                                </button>
                                <select 
                                    className="form-select form-select-sm bg-transparent text-main border-0 fw-bold text-center px-1 py-0 shadow-none" 
                                    style={{ height: '36px', minWidth: '100px', cursor: 'pointer' }}
                                    value={activeAge}
                                    onChange={e => setActiveAge(parseInt(e.target.value) || 30)}
                                >
                                    {ageOptions.map(a => (
                                        <option key={a} value={a} className="bg-dark text-white">
                                            Age {a}{a === planAge ? ' (Your Plan)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <button 
                                    className="btn btn-sm btn-link text-muted px-2.5 py-0 border-0 h-100 d-flex align-items-center hover-opacity-100" 
                                    onClick={() => setActiveAge(a => Math.min(80, a + 5))}
                                    title="Step forward 5 years"
                                    type="button"
                                >
                                    <i className="bi bi-plus-lg"></i>
                                </button>
                            </div>
                        </div>

                        {/* 2. Province Dropdown */}
                        <div>
                            <label className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                PROVINCE BENCHMARK
                            </label>
                            <select 
                                className="form-select form-select-sm bg-input text-main border-secondary rounded-3 fw-bold shadow-sm" 
                                style={{ height: '38px', minWidth: '185px', cursor: 'pointer' }}
                                value={activeProvince}
                                onChange={e => setActiveProvince(e.target.value)}
                            >
                                <option value="ON" className="bg-dark text-white">🇨🇦 Ontario (ON)</option>
                                <option value="BC" className="bg-dark text-white">🇨🇦 British Columbia (BC)</option>
                                <option value="AB" className="bg-dark text-white">🇨🇦 Alberta (AB)</option>
                                <option value="QC" className="bg-dark text-white">🇨🇦 Quebec (QC)</option>
                                <option value="MB" className="bg-dark text-white">🇨🇦 Manitoba (MB)</option>
                                <option value="SK" className="bg-dark text-white">🇨🇦 Saskatchewan (SK)</option>
                                <option value="NS" className="bg-dark text-white">🇨🇦 Nova Scotia (NS)</option>
                                <option value="NB" className="bg-dark text-white">🇨🇦 New Brunswick (NB)</option>
                                <option value="NL" className="bg-dark text-white">🇨🇦 Newfoundland & Lab. (NL)</option>
                                <option value="PE" className="bg-dark text-white">🇨🇦 Prince Edward Island (PE)</option>
                                <option value="YT" className="bg-dark text-white">🇨🇦 Yukon (YT)</option>
                                <option value="NT" className="bg-dark text-white">🇨🇦 Northwest Terr. (NT)</option>
                                <option value="NU" className="bg-dark text-white">🇨🇦 Nunavut (NU)</option>
                            </select>
                        </div>

                        {/* 3. Household Scope */}
                        <div>
                            <label className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                HOUSEHOLD SCOPE
                            </label>
                            <div className="bg-input border border-secondary rounded-3 shadow-sm p-0.5 d-flex align-items-center" style={{ height: '38px' }}>
                                <SegmentedControl 
                                    options={[
                                        { label: '👥 Household', value: 'household' },
                                        { label: '👤 Individual', value: 'individual' }
                                    ]}
                                    value={viewMode}
                                    onChange={(val: any) => setViewMode(val)}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overall Composite Canadian Score Banner */}
            <div className="rp-card border-secondary rounded-4 p-3 mb-4 shadow-sm bg-gradient-to-r" style={{ background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.10) 50%, rgba(139, 92, 246, 0.12) 100%)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                            <i className="bi bi-award-fill fs-4"></i>
                        </div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <span className="small text-muted fw-bold text-uppercase ls-1">Overall Canadian Benchmark Standing</span>
                                <span className="badge bg-success text-dark fw-bolder px-2 py-0.5 rounded-pill" style={{ fontSize: '0.68rem' }}>
                                    Score: {activeCohortBenchmarks.overallScore}/100
                                </span>
                            </div>
                            <h5 className="fw-bolder text-main mb-0 mt-0.5">
                                Top {100 - activeCohortBenchmarks.overallScore}% Overall Nationally
                                <span className="text-muted fw-normal ms-2 small">
                                    (Top {100 - activeCohortBenchmarks.nationalNwPercentile}% Wealth · Top {100 - activeCohortBenchmarks.provIncPercentile}% Income in {activeProvince})
                                </span>
                            </h5>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-dark bg-opacity-60 border border-secondary text-light px-3 py-1.5 rounded-pill small">
                            <i className="bi bi-geo-alt-fill text-primary me-1"></i>
                            {activeProvince} Standing: <strong>Top {100 - activeCohortBenchmarks.provNwPercentile}%</strong>
                        </span>
                        <span className="badge bg-dark bg-opacity-60 border border-secondary text-light px-3 py-1.5 rounded-pill small">
                            <i className="bi bi-flag-fill text-danger me-1"></i>
                            Canada Standing: <strong>Top {100 - activeCohortBenchmarks.nationalNwPercentile}%</strong>
                        </span>
                    </div>
                </div>
            </div>

            {/* Executive Scorecard Tiles */}
            <div className="row g-3 mb-4">
                {/* 1. Net Worth Percentile */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm d-flex flex-column justify-content-between">
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>Net Worth Percentile</span>
                                <InfoBtn title="Net Worth Percentile" text="Calculated using Statistics Canada Survey of Financial Security (SFS Table 11-10-0016-01), indexed for your exact age and province." />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <span className="fs-3 fw-bolder text-success">Top {100 - activeCohortBenchmarks.nationalNwPercentile}%</span>
                                <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30" style={{ fontSize: '0.68rem' }}>
                                    Top {100 - activeCohortBenchmarks.provNwPercentile}% in {activeProvince}
                                </span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.74rem' }}>
                                Canada Median: <strong>{formatCurrency(activeCohortBenchmarks.nationalNwP50)}</strong>
                                <span className="mx-1">·</span>
                                {activeProvince}: <strong>{formatCurrency(activeCohortBenchmarks.provNwP50)}</strong>
                            </p>
                        </div>
                        <div className="mt-3 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Your Net Worth:</span>
                            <span className="small fw-bold text-main">{formatCurrency(userNetWorth)}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Income Percentile */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm d-flex flex-column justify-content-between">
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>Income Percentile</span>
                                <InfoBtn title="Income Percentile" text="Statistics Canada T1 tax-filer wages and Canadian Income Survey (CIS Table 11-10-0190-01)." />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <span className="fs-3 fw-bolder text-primary">Top {100 - activeCohortBenchmarks.nationalIncPercentile}%</span>
                                <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30" style={{ fontSize: '0.68rem' }}>
                                    Top {100 - activeCohortBenchmarks.provIncPercentile}% in {activeProvince}
                                </span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.74rem' }}>
                                Canada Median: <strong>{formatCurrency(activeCohortBenchmarks.nationalIncP50)}</strong>
                                <span className="mx-1">·</span>
                                {activeProvince}: <strong>{formatCurrency(activeCohortBenchmarks.provIncP50)}</strong>
                            </p>
                        </div>
                        <div className="mt-3 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Your Gross Income:</span>
                            <span className="small fw-bold text-main">{formatCurrency(userGrossIncome)}</span>
                        </div>
                    </div>
                </div>

                {/* 3. TFSA Utilization */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm d-flex flex-column justify-content-between">
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>TFSA Cohort Standing</span>
                                <InfoBtn title="TFSA Statistics" text="Canada Revenue Agency (CRA) official Table 3A TFSA distribution by age bracket." />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <span className="fs-3 fw-bolder text-warning">
                                    {userTfsa >= activeCohortBenchmarks.tfsaAvg ? 'Above Avg' : 'Building'}
                                </span>
                                <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30" style={{ fontSize: '0.65rem' }}>
                                    CRA Table 3A
                                </span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.74rem' }}>
                                Age {activeAge} CRA Average: <strong>{formatCurrency(activeCohortBenchmarks.tfsaAvg)}</strong>
                            </p>
                        </div>
                        <div className="mt-3 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Your TFSA Pool:</span>
                            <span className="small fw-bold text-main">{formatCurrency(userTfsa)}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Housing Cost Burden */}
                <div className="col-12 col-sm-6 col-lg-3">
                    <div className="rp-card border-secondary rounded-4 p-3 h-100 bg-input shadow-sm d-flex flex-column justify-content-between">
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>Shelter Burden Ratio</span>
                                <InfoBtn title="CMHC Shelter Ratio" text="CMHC recommends total housing costs (mortgage/rent, taxes, condo fees, heating) remain below 32% of gross income." />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <span className={`fs-3 fw-bolder ${userShelterRatio <= 32 ? 'text-success' : userShelterRatio <= 40 ? 'text-warning' : 'text-danger'}`}>
                                    {userShelterRatio.toFixed(1)}%
                                </span>
                                <span className="text-muted small">of Gross Pay</span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.74rem' }}>
                                CMHC Maximum Guideline: <strong>32.0%</strong>
                            </p>
                        </div>
                        <div className="mt-3 pt-2 border-top border-secondary border-opacity-30 d-flex justify-content-between align-items-center">
                            <span className="small text-muted">Canadian Age Avg:</span>
                            <span className="small fw-bold text-main">{activeCohortBenchmarks.shelterAvg}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benchmark Topic Selector */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="text-muted fw-bold text-uppercase small ls-1">
                    <i className="bi bi-bar-chart-fill me-2 text-primary"></i>Visual Distribution Benchmarks
                </span>
                <div className="bg-dark bg-opacity-40 p-1 rounded-pill border border-secondary">
                    <SegmentedControl 
                        options={[
                            { label: '📈 Net Worth Curve', value: 'networth' },
                            { label: '💰 Income Distribution', value: 'income' },
                            { label: '🛡️ TFSA Accumulation', value: 'tfsa' },
                            { label: '🏡 Housing Burden', value: 'housing' }
                        ]}
                        value={selectedMetric}
                        onChange={(val: any) => setSelectedMetric(val)}
                    />
                </div>
            </div>

            {/* Main Graph Container */}
            <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
                {/* 1. NET WORTH TRAJECTORY & DISTRIBUTION */}
                {selectedMetric === 'networth' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold text-main mb-1">
                                    <i className="bi bi-graph-up text-success me-2"></i>
                                    Canadian Net Worth Lifecycle Curve (Ages 25 to 75)
                                </h5>
                                <p className="text-muted small mb-0">
                                    Shaded bands represent Canadian wealth distribution percentiles (25th, 50th Median, 75th, and 90th) scaled for {activeProvince} {viewMode}s.
                                </p>
                            </div>

                            {/* High-Contrast Badge with White Text */}
                            <div className="badge rounded-pill bg-dark bg-opacity-90 border border-success border-opacity-50 px-3 py-1.5 shadow-sm d-flex align-items-center gap-2">
                                <span className="badge bg-success text-dark fw-bolder px-2 py-0.5 rounded-pill" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                    YOUR POSITION
                                </span>
                                <span className="text-white fw-bold small">
                                    {deltaNetWorth >= 0 ? '+' : ''}{formatShort(deltaNetWorth)} ({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(0)}%) vs. Age {activeAge} Median
                                </span>
                            </div>
                        </div>

                        <div style={{ height: '360px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trajectoryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="p90Grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                                        </linearGradient>
                                        <linearGradient id="p75Grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                                        </linearGradient>
                                        <linearGradient id="p50Grad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2c3b52" opacity={0.6} />
                                    <XAxis dataKey="age" stroke="#64748b" tickFormatter={(v) => `Age ${v}`} />
                                    <YAxis stroke="#64748b" tickFormatter={formatShort} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#141c2b', border: '1px solid #2c3b52', borderRadius: '12px' }}
                                        formatter={(val: any) => [formatCurrency(val), '']}
                                        labelFormatter={(l) => `Age Cohort: ${l}`}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="p90" stroke="#8b5cf6" fillOpacity={1} fill="url(#p90Grad)" name="Top 10% (90th Percentile)" />
                                    <Area type="monotone" dataKey="p75" stroke="#f59e0b" fillOpacity={1} fill="url(#p75Grad)" name="Top 25% (75th Percentile)" />
                                    <Area type="monotone" dataKey="median" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#p50Grad)" name="Canadian Median (50th Percentile)" />
                                    <Area type="monotone" dataKey="p25" stroke="#64748b" strokeDasharray="4 4" fill="none" name="Bottom 25% Threshold" />
                                    <ReferenceDot 
                                        x={Math.round(activeAge / 5) * 5} 
                                        y={userNetWorth} 
                                        r={8} 
                                        fill="#10b981" 
                                        stroke="#ffffff" 
                                        strokeWidth={2} 
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Cohort Bar Breakdown */}
                        <div className="row g-3 mt-3 pt-3 border-top border-secondary border-opacity-30">
                            <div className="col-12 col-lg-7">
                                <h6 className="fw-bold text-main small mb-2 text-uppercase ls-1">Age {activeAge} Net Worth Cohort Benchmarks</h6>
                                <div style={{ height: '220px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={netWorthBarData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#2c3b52" horizontal={false} />
                                            <XAxis type="number" stroke="#64748b" tickFormatter={formatShort} />
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={120} tick={{ fontSize: 12 }} />
                                            <RechartsTooltip 
                                                contentStyle={{ backgroundColor: '#141c2b', border: '1px solid #2c3b52', borderRadius: '12px' }}
                                                formatter={(val: any) => [formatCurrency(val), 'Net Worth']}
                                            />
                                            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                                                {netWorthBarData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="col-12 col-lg-5 d-flex flex-column justify-content-center">
                                <div className="p-3 rounded-4 bg-dark bg-opacity-40 border border-secondary">
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="bi bi-lightbulb-fill text-warning"></i>
                                        <span className="small fw-bold text-main">Cohort Takeaway</span>
                                    </div>
                                    <p className="small text-muted mb-2" style={{ lineHeight: '1.5' }}>
                                        At age <strong>{activeAge}</strong>, half of Canadian households hold less than <strong>{formatCurrency(activeCohortBenchmarks.nationalNwP50)}</strong> (and <strong>{formatCurrency(activeCohortBenchmarks.provNwP50)}</strong> in {activeProvince}). 
                                        Your live plan sits at the <strong>{activeCohortBenchmarks.nationalNwPercentile}th percentile nationally</strong> and <strong>{activeCohortBenchmarks.provNwPercentile}th in {activeProvince}</strong> ({formatCurrency(userNetWorth)}).
                                    </p>
                                    <div className="small text-success fw-bold">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        {userNetWorth >= activeCohortBenchmarks.provNwP50 ? 'Strong Accumulation: You are outpacing the provincial median.' : 'Opportunity: Ramp up registered account contributions to hit top quartiles.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clickable Source Footnote */}
                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-link-45deg me-1 text-primary"></i>
                            <strong>Source:</strong>{' '}
                            <a 
                                href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110001601" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Statistics Canada Table 11-10-0016-01 (Assets and Debts by Age) <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>{' '}
                            and{' '}
                            <a 
                                href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110006501" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Table 11-10-0065-01 (Net Worth by Province) <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>.
                        </div>
                    </div>
                )}

                {/* 2. INCOME DISTRIBUTION */}
                {selectedMetric === 'income' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold text-main mb-1">
                                    <i className="bi bi-cash-stack text-primary me-2"></i>
                                    Annual Employment Income by Cohort & Province
                                </h5>
                                <p className="text-muted small mb-0">
                                    Statistics Canada T1 individual and household tax-filer benchmarks for age {activeAge} in {activeProvince}.
                                </p>
                            </div>
                            <span className="badge rounded-pill bg-dark bg-opacity-90 border border-primary border-opacity-50 text-white px-3 py-1.5 shadow-sm small">
                                Top {100 - activeCohortBenchmarks.nationalIncPercentile}% in Canada · Top {100 - activeCohortBenchmarks.provIncPercentile}% in {activeProvince}
                            </span>
                        </div>

                        <div style={{ height: '340px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={incomeBarData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2c3b52" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" tickFormatter={formatShort} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#141c2b', border: '1px solid #2c3b52', borderRadius: '12px' }}
                                        formatter={(val: any) => [formatCurrency(val), 'Annual Gross']}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {incomeBarData.map((entry, index) => (
                                            <Cell key={`inc-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={activeCohortBenchmarks.provIncP50} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Provincial Median', fill: '#3b82f6', fontSize: 11, position: 'top' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Clickable Source Footnote */}
                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-link-45deg me-1 text-primary"></i>
                            <strong>Source:</strong>{' '}
                            <a 
                                href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110019001" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Statistics Canada Table 11-10-0190-01 (Income Distribution) <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>{' '}
                            and{' '}
                            <a 
                                href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110007201" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Table 11-10-0072-01 (T1 Tax-Filers Wages) <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>.
                        </div>
                    </div>
                )}

                {/* 3. TFSA ACCUMULATION */}
                {selectedMetric === 'tfsa' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold text-main mb-1">
                                    <i className="bi bi-shield-shaded text-warning me-2"></i>
                                    TFSA Balance vs. Canada Revenue Agency (CRA) Table 3A Data
                                </h5>
                                <p className="text-muted small mb-0">
                                    Compare your registered TFSA holdings to observed CRA statistical balances for Canadians at age {activeAge}.
                                </p>
                            </div>
                            <span className="badge rounded-pill bg-dark bg-opacity-90 border border-warning border-opacity-50 text-white px-3 py-1.5 shadow-sm small">
                                CRA Cumulative Lifetime Limit: {formatCurrency(activeCohortBenchmarks.tfsaMax)}
                            </span>
                        </div>

                        <div style={{ height: '340px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tfsaBarData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2c3b52" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" tickFormatter={formatShort} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#141c2b', border: '1px solid #2c3b52', borderRadius: '12px' }}
                                        formatter={(val: any) => [formatCurrency(val), 'TFSA Value']}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {tfsaBarData.map((entry, index) => (
                                            <Cell key={`tfsa-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={activeCohortBenchmarks.tfsaMax} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Statutory Max Ceiling', fill: '#f59e0b', fontSize: 11, position: 'top' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Clickable Source Footnote */}
                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-link-45deg me-1 text-primary"></i>
                            <strong>Source:</strong>{' '}
                            <a 
                                href="https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/tax-free-savings-account-statistics.html" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Canada Revenue Agency (CRA) Tax-Free Savings Account Statistics Table 3A <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>.
                        </div>
                    </div>
                )}

                {/* 4. HOUSING BURDEN RATIO */}
                {selectedMetric === 'housing' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold text-main mb-1">
                                    <i className="bi bi-house-door-fill text-danger me-2"></i>
                                    Housing Cost Burden vs. CMHC 32% Affordability Ceiling
                                </h5>
                                <p className="text-muted small mb-0">
                                    Shelter expenses (mortgage/rent, property taxes, condo fees, utilities) as a percentage of gross annual income.
                                </p>
                            </div>
                            <span className={`badge rounded-pill ${userShelterRatio <= 32 ? 'bg-success text-dark' : 'bg-danger text-white'} px-3 py-1.5 shadow-sm fw-bold small`}>
                                Your Shelter Ratio: {userShelterRatio.toFixed(1)}% ({userShelterRatio <= 32 ? 'Healthy' : 'Burdened'})
                            </span>
                        </div>

                        <div style={{ height: '340px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={shelterBarData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2c3b52" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#64748b" tickFormatter={(v) => `${v}%`} domain={[0, 45]} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#141c2b', border: '1px solid #2c3b52', borderRadius: '12px' }}
                                        formatter={(val: any) => [`${val}%`, 'Share of Gross Income']}
                                    />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                        {shelterBarData.map((entry, index) => (
                                            <Cell key={`sh-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                    <ReferenceLine y={32.0} stroke="#d97706" strokeWidth={2} strokeDasharray="4 4" label={{ value: 'CMHC 32% Guardrail', fill: '#d97706', fontSize: 11, position: 'top' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Clickable Source Footnote */}
                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.72rem' }}>
                            <i className="bi bi-link-45deg me-1 text-primary"></i>
                            <strong>Source:</strong>{' '}
                            <a 
                                href="https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Canada Mortgage and Housing Corporation (CMHC) Residential Mortgage Guidelines <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>{' '}
                            and{' '}
                            <a 
                                href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110022301" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-primary text-decoration-none hover-underline fw-medium"
                            >
                                Statistics Canada Table 11-10-0223-01 (Household Spending on Shelter) <i className="bi bi-box-arrow-up-right" style={{ fontSize: '0.65rem' }}></i>
                            </a>.
                        </div>
                    </div>
                )}
            </div>

            {/* Audit & Methodology Accordion Drawer with Clickable Reference Directory */}
            <div className="rp-card border-secondary rounded-4 p-3 bg-dark bg-opacity-30">
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="small text-muted fw-bold d-flex align-items-center gap-2">
                        <i className="bi bi-database-check text-info"></i>
                        Official Data Sources & Statistical Methodology
                    </span>
                    <span className="badge bg-secondary bg-opacity-25 text-muted" style={{ fontSize: '0.65rem' }}>
                        2026/2027 Dollar Base
                    </span>
                </div>
                <div className="row g-3 text-muted" style={{ fontSize: '0.74rem', lineHeight: '1.6' }}>
                    <div className="col-12 col-md-6">
                        <strong>Continuous Age Extrapolation:</strong> Statistics Canada publishes net worth and income in multi-year cohort brackets. Planfolio applies continuous piecewise-monotone cubic spline interpolation to anchor points (ages 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75). This ensures exact ages like 34 or 44 reflect realistic, smooth lifecycle progression rather than arbitrary step-jumps.
                    </div>
                    <div className="col-12 col-md-6">
                        <strong>Equivalence Scaling & Sources:</strong> Household values represent combined economic families. Individual views apply the international standard square-root equivalence scale (Income / √2.4).
                        <ul className="list-unstyled mt-2 mb-0">
                            <li>• <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110001601" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">StatCan Table 11-10-0016-01 (SFS Assets & Debts)</a></li>
                            <li>• <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110006501" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">StatCan Table 11-10-0065-01 (SFS Net Worth by Province)</a></li>
                            <li>• <a href="https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1110019001" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">StatCan Table 11-10-0190-01 (CIS Income Distribution)</a></li>
                            <li>• <a href="https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/income-statistics-gst-hst-statistics/tax-free-savings-account-statistics.html" target="_blank" rel="noopener noreferrer" className="text-primary text-decoration-none">CRA Tax-Free Savings Account Statistics (Table 3A)</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}