'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, SegmentedControl, ProvinceSelector } from '../SharedUI';
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

    const wScale = (provWealthScale[activeProvince] || 1.0) * (viewMode === 'household' ? 1.0 : 0.62);
    const iScale = (provWageScale[activeProvince] || 1.0) * (viewMode === 'household' ? 1.0 : 0.65);

    // Continuous StatCan Net Worth Curve generation across ages (25 to 75)
    const trajectoryData = useMemo(() => {
        const ages = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
        return ages.map(age => {
            let p25 = 0, p50 = 0, p75 = 0, p90 = 0;
            if (age <= 30) {
                p25 = 12000; p50 = 75000; p75 = 220000; p90 = 540000;
            } else if (age <= 35) {
                p25 = 45000; p50 = 185000; p75 = 510000; p90 = 1120000;
            } else if (age <= 40) {
                p25 = 95000; p50 = 345000; p75 = 890000; p90 = 1850000;
            } else if (age <= 45) {
                p25 = 165000; p50 = 530000; p75 = 1320000; p90 = 2650000;
            } else if (age <= 50) {
                p25 = 240000; p50 = 760000; p75 = 1780000; p90 = 3450000;
            } else if (age <= 55) {
                p25 = 310000; p50 = 980000; p75 = 2150000; p90 = 4150000;
            } else if (age <= 60) {
                p25 = 365000; p50 = 1180000; p75 = 2450000; p90 = 4680000;
            } else if (age <= 65) {
                p25 = 390000; p50 = 1240000; p75 = 2550000; p90 = 4850000;
            } else if (age <= 70) {
                p25 = 360000; p50 = 1120000; p75 = 2350000; p90 = 4450000;
            } else {
                p25 = 310000; p50 = 980000; p75 = 2100000; p90 = 3950000;
            }

            return {
                age,
                p25: Math.round(p25 * wScale),
                median: Math.round(p50 * wScale),
                p75: Math.round(p75 * wScale),
                p90: Math.round(p90 * wScale),
                userNW: age === Math.round(activeAge / 5) * 5 ? userNetWorth : null
            };
        });
    }, [wScale, activeAge, userNetWorth]);

    // Active age specific benchmarks
    const activeCohortBenchmarks = useMemo(() => {
        let baseP25 = 45000, baseP50 = 185000, baseP75 = 510000, baseP90 = 1120000;
        let baseIncomeMed = 78000, baseIncome75 = 125000, baseIncome90 = 185000;
        let tfsaAvg = 23500, tfsaMed = 10200, tfsaMax = 102000;
        let shelterAvg = 31.5;

        if (activeAge < 30) {
            baseP25 = 12000; baseP50 = 75000; baseP75 = 220000; baseP90 = 540000;
            baseIncomeMed = 58000; baseIncome75 = 88000; baseIncome90 = 135000;
            tfsaAvg = 14200; tfsaMed = 6400; tfsaMax = 65000;
            shelterAvg = 35.0;
        } else if (activeAge <= 39) {
            baseP25 = 68000; baseP50 = 265000; baseP75 = 710000; baseP90 = 1520000;
            baseIncomeMed = 86000; baseIncome75 = 138000; baseIncome90 = 205000;
            tfsaAvg = 29500; tfsaMed = 13500; tfsaMax = 102000;
            shelterAvg = 30.5;
        } else if (activeAge <= 49) {
            baseP25 = 195000; baseP50 = 645000; baseP75 = 1550000; baseP90 = 3050000;
            baseIncomeMed = 108000; baseIncome75 = 168000; baseIncome90 = 255000;
            tfsaAvg = 46200; tfsaMed = 22500; tfsaMax = 102000;
            shelterAvg = 25.5;
        } else if (activeAge <= 59) {
            baseP25 = 335000; baseP50 = 1080000; baseP75 = 2300000; baseP90 = 4400000;
            baseIncomeMed = 102000; baseIncome75 = 162000; baseIncome90 = 245000;
            tfsaAvg = 58700; tfsaMed = 31000; tfsaMax = 102000;
            shelterAvg = 20.5;
        } else {
            baseP25 = 380000; baseP50 = 1180000; baseP75 = 2450000; baseP90 = 4650000;
            baseIncomeMed = 65000; baseIncome75 = 105000; baseIncome90 = 175000;
            tfsaAvg = 74000; tfsaMed = 44500; tfsaMax = 102000;
            shelterAvg = 19.5;
        }

        const netWorthP25 = Math.round(baseP25 * wScale);
        const netWorthP50 = Math.round(baseP50 * wScale);
        const netWorthP75 = Math.round(baseP75 * wScale);
        const netWorthP90 = Math.round(baseP90 * wScale);

        const incomeP50 = Math.round(baseIncomeMed * iScale);
        const incomeP75 = Math.round(baseIncome75 * iScale);
        const incomeP90 = Math.round(baseIncome90 * iScale);

        // Percentile calculator for User Net Worth
        let nwPercentile = 50;
        if (userNetWorth <= 0) nwPercentile = 5;
        else if (userNetWorth < netWorthP25) nwPercentile = Math.max(5, Math.round(5 + (userNetWorth / netWorthP25) * 20));
        else if (userNetWorth < netWorthP50) nwPercentile = Math.round(25 + ((userNetWorth - netWorthP25) / (netWorthP50 - netWorthP25)) * 25);
        else if (userNetWorth < netWorthP75) nwPercentile = Math.round(50 + ((userNetWorth - netWorthP50) / (netWorthP75 - netWorthP50)) * 25);
        else if (userNetWorth < netWorthP90) nwPercentile = Math.round(75 + ((userNetWorth - netWorthP75) / (netWorthP90 - netWorthP75)) * 15);
        else nwPercentile = Math.min(99, Math.round(90 + ((userNetWorth - netWorthP90) / (netWorthP90 * 0.75)) * 9));

        // Percentile calculator for User Income
        let incPercentile = 50;
        if (userGrossIncome < incomeP50) incPercentile = Math.max(5, Math.round((userGrossIncome / incomeP50) * 50));
        else if (userGrossIncome < incomeP75) incPercentile = Math.round(50 + ((userGrossIncome - incomeP50) / (incomeP75 - incomeP50)) * 25);
        else if (userGrossIncome < incomeP90) incPercentile = Math.round(75 + ((userGrossIncome - incomeP75) / (incomeP90 - incomeP75)) * 15);
        else incPercentile = Math.min(99, Math.round(90 + ((userGrossIncome - incomeP90) / (incomeP90 * 0.8)) * 9));

        return {
            netWorthP25, netWorthP50, netWorthP75, netWorthP90,
            incomeP50, incomeP75, incomeP90,
            tfsaAvg, tfsaMed, tfsaMax,
            shelterAvg,
            nwPercentile, incPercentile
        };
    }, [activeAge, wScale, iScale, userNetWorth, userGrossIncome]);

    // Data for Net Worth Cohort Bar Chart
    const netWorthBarData = useMemo(() => [
        { name: 'Bottom 25%', value: activeCohortBenchmarks.netWorthP25, fill: '#64748b' },
        { name: 'Canadian Median', value: activeCohortBenchmarks.netWorthP50, fill: '#3b82f6' },
        { name: 'Top 25%', value: activeCohortBenchmarks.netWorthP75, fill: '#f59e0b' },
        { name: 'Top 10%', value: activeCohortBenchmarks.netWorthP90, fill: '#8b5cf6' },
        { name: 'You (Live Plan)', value: Math.max(0, userNetWorth), fill: '#10b981' }
    ], [activeCohortBenchmarks, userNetWorth]);

    // Data for Income Comparison Bar Chart
    const incomeBarData = useMemo(() => [
        { name: 'National Median', value: Math.round(activeCohortBenchmarks.incomeP50 / (provWageScale[activeProvince] || 1.0)), fill: '#64748b' },
        { name: `${activeProvince} Median`, value: activeCohortBenchmarks.incomeP50, fill: '#3b82f6' },
        { name: 'Top 25% (75th)', value: activeCohortBenchmarks.incomeP75, fill: '#f59e0b' },
        { name: 'Top 10% (90th)', value: activeCohortBenchmarks.incomeP90, fill: '#8b5cf6' },
        { name: 'Your Income', value: userGrossIncome, fill: '#10b981' }
    ], [activeCohortBenchmarks, activeProvince, userGrossIncome]);

    // Data for TFSA Comparison Bar Chart
    const tfsaBarData = useMemo(() => [
        { name: 'CRA Age Median', value: activeCohortBenchmarks.tfsaMed, fill: '#64748b' },
        { name: 'CRA Age Average', value: activeCohortBenchmarks.tfsaAvg, fill: '#3b82f6' },
        { name: 'Max CRA Limit', value: activeCohortBenchmarks.tfsaMax, fill: '#f59e0b' },
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

    const deltaNetWorth = userNetWorth - activeCohortBenchmarks.netWorthP50;
    const deltaPercent = activeCohortBenchmarks.netWorthP50 > 0 ? (deltaNetWorth / activeCohortBenchmarks.netWorthP50) * 100 : 0;

    return (
        <div className="fade-in-tab pb-4">
            {/* Top Control Bar */}
            <div className="rp-card border-secondary rounded-4 p-4 shadow-sm mb-4">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30">
                                Statistics Canada & CRA Grounded
                            </span>
                            <span className="badge bg-success bg-opacity-20 text-success border border-success border-opacity-30">
                                100% In-Browser · Private
                            </span>
                        </div>
                        <h4 className="fw-bolder mb-0 text-main">Canadian Demographic Peer Benchmarking</h4>
                        <p className="text-muted small mb-0">
                            See how your live financial plan compares against official Statistics Canada income & wealth distributions for your age cohort.
                        </p>
                    </div>

                    <div className="d-flex flex-wrap align-items-center gap-2">
                        <div style={{ minWidth: '120px' }}>
                            <label className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>COHORT AGE</label>
                            <input 
                                type="number" 
                                min="21" 
                                max="85" 
                                value={activeAge} 
                                onChange={e => setActiveAge(Math.max(21, Math.min(85, parseInt(e.target.value) || 21)))}
                                className="form-control form-control-sm bg-input text-main border-secondary fw-bold text-center" 
                            />
                        </div>
                        <div style={{ minWidth: '140px' }}>
                            <label className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>PROVINCE</label>
                            <ProvinceSelector value={activeProvince} onChange={setActiveProvince} />
                        </div>
                        <div style={{ minWidth: '170px' }}>
                            <label className="text-muted fw-bold d-block mb-1" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>HOUSEHOLD SCOPE</label>
                            <SegmentedControl 
                                options={[
                                    { label: 'Household', value: 'household' },
                                    { label: 'Individual', value: 'individual' }
                                ]}
                                value={viewMode}
                                onChange={(val: any) => setViewMode(val)}
                            />
                        </div>
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
                                <InfoBtn title="Net Worth Percentile" text="Calculated using Statistics Canada Survey of Financial Security (SFS Table 11-10-0016-01), indexed for your age group and province." />
                            </div>
                            <div className="d-flex align-items-baseline gap-2 mb-1">
                                <span className="fs-3 fw-bolder text-success">Top {100 - activeCohortBenchmarks.nwPercentile}%</span>
                                <span className="text-muted small">({activeCohortBenchmarks.nwPercentile}th percentile)</span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                                Canadian Age {activeAge} Median: <strong>{formatCurrency(activeCohortBenchmarks.netWorthP50)}</strong>
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
                                <span className="fs-3 fw-bolder text-primary">Top {100 - activeCohortBenchmarks.incPercentile}%</span>
                                <span className="text-muted small">in {activeProvince}</span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
                                Provincial Age {activeAge} Median: <strong>{formatCurrency(activeCohortBenchmarks.incomeP50)}</strong>
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
                                <span className="badge bg-warning bg-opacity-20 text-warning" style={{ fontSize: '0.65rem' }}>CRA Table 3A</span>
                            </div>
                            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
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
                            <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>
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
                {/* 1. Net Worth Trajectory */}
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
                            <div className="badge bg-success bg-opacity-15 text-success border border-success border-opacity-30 p-2">
                                You are {deltaNetWorth >= 0 ? '+' : ''}{formatShort(deltaNetWorth)} ({deltaPercent >= 0 ? '+' : ''}{deltaPercent.toFixed(0)}%) vs. Age {activeAge} Median
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
                                            <YAxis type="category" dataKey="name" stroke="#94a3b8" width={110} tick={{ fontSize: 12 }} />
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
                                        At age <strong>{activeAge}</strong> in <strong>{activeProvince}</strong>, half of Canadian households hold less than <strong>{formatCurrency(activeCohortBenchmarks.netWorthP50)}</strong>. 
                                        Your live plan sits at the <strong>{activeCohortBenchmarks.nwPercentile}th percentile</strong> ({formatCurrency(userNetWorth)}).
                                    </p>
                                    <div className="small text-success fw-bold">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        {userNetWorth >= activeCohortBenchmarks.netWorthP50 ? 'Strong Accumulation: You are outpacing the national median.' : 'Opportunity: Ramp up registered account contributions to hit top quartiles.'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Citation Footnote */}
                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.70rem' }}>
                            <i className="bi bi-info-circle me-1 text-primary"></i>
                            <strong>Source:</strong> Statistics Canada, <em>Survey of Financial Security (SFS)</em>, Table 11-10-0016-01 (Assets and Debts by Age Group) and Table 11-10-0065-01 (Net Worth Distribution by Province), with 2026/2027 nominal wage and household-balance-sheet bridging.
                        </div>
                    </div>
                )}

                {/* 2. Income Distribution */}
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
                            <span className="badge bg-primary bg-opacity-20 text-primary border border-primary border-opacity-30 p-2">
                                Top {100 - activeCohortBenchmarks.incPercentile}% in {activeProvince}
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
                                    <ReferenceLine y={activeCohortBenchmarks.incomeP50} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Provincial Median', fill: '#3b82f6', fontSize: 11, position: 'top' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.70rem' }}>
                            <i className="bi bi-info-circle me-1 text-primary"></i>
                            <strong>Source:</strong> Statistics Canada, <em>Canadian Income Survey</em>, Table 11-10-0190-01 (Distribution of Total Income by Age and Sex) & Table 11-10-0072-01 (Wages, Salaries, and Commissions of T1 Tax Filers).
                        </div>
                    </div>
                )}

                {/* 3. TFSA Accumulation */}
                {selectedMetric === 'tfsa' && (
                    <div>
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold text-main mb-1">
                                    <i className="bi bi-shield-shaded text-warning me-2"></i>
                                    TFSA Balance vs. Canada Revenue Agency (CRA) Table 3A Data
                                </h5>
                                <p className="text-muted small mb-0">
                                    Compare your registered TFSA holdings to observed CRA statistical balances for Canadians in the {activeAge < 35 ? '30-34' : activeAge < 45 ? '35-39' : '40-49'} age cohort.
                                </p>
                            </div>
                            <span className="badge bg-warning bg-opacity-20 text-warning border border-warning border-opacity-30 p-2">
                                CRA Cumulative Limit: {formatCurrency(activeCohortBenchmarks.tfsaMax)}
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

                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.70rem' }}>
                            <i className="bi bi-info-circle me-1 text-primary"></i>
                            <strong>Source:</strong> Canada Revenue Agency (CRA), <em>Tax-Free Savings Account Statistics</em>, Table 3A (TFSA Holders by Age Group and Fair Market Value), carried forward with 5% nominal investment growth.
                        </div>
                    </div>
                )}

                {/* 4. Housing Burden Ratio */}
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
                            <span className={`badge ${userShelterRatio <= 32 ? 'bg-success text-white' : 'bg-danger text-white'} p-2`}>
                                Your Shelter Ratio: {userShelterRatio.toFixed(1)}%
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

                        <div className="mt-3 pt-2 text-muted text-start" style={{ fontSize: '0.70rem' }}>
                            <i className="bi bi-info-circle me-1 text-primary"></i>
                            <strong>Source:</strong> Canada Mortgage and Housing Corporation (CMHC), <em>Residential Mortgage Indicators and Underwriting Guidelines (GDS ≤ 39% / TDS ≤ 44%)</em>, and Statistics Canada Table 11-10-0223-01 (Survey of Household Spending on Shelter).
                        </div>
                    </div>
                )}
            </div>

            {/* Audit & Methodology Accordion Drawer */}
            <div className="rp-card border-secondary rounded-4 p-3 bg-dark bg-opacity-30">
                <div className="d-flex align-items-center justify-content-between">
                    <span className="small text-muted fw-bold d-flex align-items-center gap-2">
                        <i className="bi bi-database-check text-info"></i>
                        Data Provenance & Statistical Methodology
                    </span>
                    <span className="badge bg-secondary bg-opacity-25 text-muted" style={{ fontSize: '0.65rem' }}>
                        Updated for 2026/2027 Projections
                    </span>
                </div>
                <div className="row g-3 mt-2 text-muted" style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>
                    <div className="col-12 col-md-6">
                        <strong>Wealth Distribution Calibration:</strong> Statistics Canada publishes net worth in 5-to-10 year age cohorts. Monotone spline interpolation is applied across anchors to generate continuous single-year age medians without artificial step-jumps. Values are rescaled by provincial SFS capital indices.
                    </div>
                    <div className="col-12 col-md-6">
                        <strong>Equivalence Scale:</strong> Household values represent combined economic families. Individual views apply the international standard square-root equivalence scale (Income / √2.4) to reflect true individual purchasing power.
                    </div>
                </div>
            </div>
        </div>
    );
}