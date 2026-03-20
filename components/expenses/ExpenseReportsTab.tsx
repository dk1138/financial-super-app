'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Transaction } from '../../lib/expenseDb';
import { Category } from '../../app/expenses/page';
import { 
    Sankey, Tooltip, ResponsiveContainer, Layer, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Label,
    ComposedChart, BarChart, Bar, Legend // NEW IMPORTS
} from 'recharts';

interface Props {
    transactions: Transaction[];
    categories: Category[];
    formatCurrency: (val: number) => string;
}

const WS_COLORS = ['#0d6efd', '#fd7e14', '#20c997', '#6f42c1', '#e83e8c'];

export default function ExpenseReportsTab({ transactions, categories, formatCurrency }: Props) {
    const [selectedMonth, setSelectedMonth] = useState<string>('All Time');
    const [trendCategory, setTrendCategory] = useState<string>('');

    // --- 1. SANKEY DATA PROCESSING (Focused on active month) ---
    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        transactions.forEach(tx => {
            const d = new Date(tx.date);
            if (!isNaN(d.getTime())) months.add(d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }));
        });
        return ['All Time', ...Array.from(months).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())];
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        if (selectedMonth === 'All Time') return transactions;
        return transactions.filter(tx => {
            const d = new Date(tx.date);
            return !isNaN(d.getTime()) && d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) === selectedMonth;
        });
    }, [transactions, selectedMonth]);

    const { kpis, sankeyData } = useMemo(() => {
        let totalIncome = 0; let totalSpend = 0;
        const categoryMap: Record<string, number> = {};

        filteredTransactions.forEach(tx => {
            if (tx.category === 'Exclude') return;
            if (tx.amount > 0) totalIncome += tx.amount;
            else {
                const absAmount = Math.abs(tx.amount);
                totalSpend += absAmount;
                categoryMap[tx.category] = (categoryMap[tx.category] || 0) + absAmount;
            }
        });

        const savings = totalIncome - totalSpend;
        const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

        const nodes: any[] = []; const links: any[] = [];
        let rootName = totalIncome === 0 ? 'Total Spend' : (totalSpend > totalIncome ? 'Income + Deficit' : 'Income');
        
        nodes.push({ name: rootName, color: '#198754' }); 
        let currentNodeIndex = 1;
        
        Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).forEach(([catName, amt]) => {
            const catColor = categories.find(c => c.name === catName)?.color || '#6c757d';
            nodes.push({ name: catName, color: catColor });
            links.push({ source: 0, target: currentNodeIndex, value: amt });
            currentNodeIndex++;
        });

        if (savings > 0) {
            nodes.push({ name: 'Savings & Investments', color: '#0d6efd' });
            links.push({ source: 0, target: currentNodeIndex, value: savings });
        }

        return { kpis: { totalIncome, totalSpend, savings, savingsRate }, sankeyData: { nodes, links } };
    }, [filteredTransactions, categories]);

    // --- 2. TREND RADAR (LIFESTYLE CREEP) ---
    const availableTrendCategories = useMemo(() => {
        const cats = new Set<string>();
        transactions.forEach(tx => { if (tx.amount < 0 && tx.category !== 'Exclude' && tx.category !== 'Uncategorized') cats.add(tx.category); });
        return Array.from(cats).sort();
    }, [transactions]);

    useEffect(() => {
        if (availableTrendCategories.length > 0 && !trendCategory) {
            if (availableTrendCategories.includes('Food & Dining')) setTrendCategory('Food & Dining');
            else setTrendCategory(availableTrendCategories[0]);
        }
    }, [availableTrendCategories, trendCategory]);

    const trendData = useMemo(() => {
        if (!trendCategory) return [];
        const monthlyTotals: Record<string, { month: string, sortDate: number, amount: number }> = {};

        transactions.forEach(tx => {
            if (tx.category === trendCategory && tx.amount < 0) {
                const d = new Date(tx.date);
                if (!isNaN(d.getTime())) {
                    const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    if (!monthlyTotals[monthKey]) monthlyTotals[monthKey] = { month: monthKey, sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), amount: 0 };
                    monthlyTotals[monthKey].amount += Math.abs(tx.amount);
                }
            }
        });

        return Object.values(monthlyTotals).sort((a, b) => a.sortDate - b.sortDate).slice(-12);
    }, [transactions, trendCategory]);

    const trendAverage = useMemo(() => {
        if (trendData.length === 0) return 0;
        return trendData.reduce((acc, curr) => acc + curr.amount, 0) / trendData.length;
    }, [trendData]);

    const activeTrendColor = useMemo(() => categories.find(c => c.name === trendCategory)?.color || '#0d6efd', [trendCategory, categories]);

    // --- 3. MACRO CASH FLOW & WORKSPACE BURN RATE ---
    const macroAndWorkspaceData = useMemo(() => {
        const macroMap: Record<string, any> = {};
        const wsSet = new Set<string>();

        transactions.forEach(tx => {
            const d = new Date(tx.date);
            if (isNaN(d.getTime())) return;
            const monthKey = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (!macroMap[monthKey]) {
                macroMap[monthKey] = {
                    month: monthKey,
                    sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
                    income: 0, spend: 0, savings: 0
                };
            }

            // Track Workspaces
            const ws = tx.workspace || 'Personal';
            wsSet.add(ws);
            if (macroMap[monthKey][ws] === undefined) macroMap[monthKey][ws] = 0;

            if (tx.category === 'Exclude') return;

            if (tx.amount > 0) {
                macroMap[monthKey].income += tx.amount;
            } else {
                const absAmt = Math.abs(tx.amount);
                macroMap[monthKey].spend += absAmt;
                macroMap[monthKey][ws] += absAmt; // Add to Workspace burn rate
            }
        });

        const sortedData = Object.values(macroMap).sort((a, b) => a.sortDate - b.sortDate).slice(-12);
        sortedData.forEach(d => { d.savings = d.income - d.spend; });

        return { chartData: sortedData, workspaces: Array.from(wsSet) };
    }, [transactions]);


    // --- CUSTOM CHART RENDERERS ---
    const SankeyNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
        const isLeft = x < containerWidth / 2;
        return (
            <Layer key={`CustomNode${index}`}>
                <rect x={x} y={y} width={width} height={height} fill={payload.color} fillOpacity="0.85" rx={4} />
                <text x={isLeft ? x + width + 12 : x - 12} y={y + height / 2} dy={4} textAnchor={isLeft ? 'start' : 'end'} fill="var(--bs-body-color)" fontSize={13} fontWeight={600}>{payload.name}</text>
                <text x={isLeft ? x + width + 12 : x - 12} y={y + height / 2 + 18} textAnchor={isLeft ? 'start' : 'end'} fill="var(--bs-secondary-color)" fontSize={12}>{formatCurrency(payload.value)}</text>
            </Layer>
        );
    };

    const SankeyTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-input border border-secondary p-3 rounded-3 shadow-lg">
                    <p className="fw-bold mb-1 text-main">{data.source ? `${data.source.name} → ${data.target.name}` : data.name}</p>
                    <p className="text-success fw-bold mb-0">{formatCurrency(data.value)}</p>
                </div>
            );
        }
        return null;
    };

    const CustomMultiTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-input border border-secondary p-3 rounded-3 shadow-lg">
                    <p className="fw-bold mb-2 text-muted small">{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.dataKey} className="d-flex justify-content-between gap-4 mb-1">
                            <span style={{ color: entry.color }} className="fw-bold">{entry.name}:</span>
                            <span className="fw-bold">{formatCurrency(entry.value)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fade-in d-flex flex-column gap-4 pb-4 position-relative">
            
            {/* KPI CARDS */}
            <div className="row g-3">
                <div className="col-12 col-md-4">
                    <div className="card surface-card border-secondary shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-center">
                        <div className="text-muted small fw-bold mb-1 d-flex align-items-center"><i className="bi bi-arrow-down-left-circle text-success me-2"></i>Total Income</div>
                        <h3 className="fw-bold text-success mb-0">{formatCurrency(kpis.totalIncome)}</h3>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className="card surface-card border-secondary shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-center">
                        <div className="text-muted small fw-bold mb-1 d-flex align-items-center"><i className="bi bi-arrow-up-right-circle text-danger me-2"></i>Total Spend</div>
                        <h3 className="fw-bold text-main mb-0">{formatCurrency(kpis.totalSpend)}</h3>
                    </div>
                </div>
                <div className="col-12 col-md-4">
                    <div className={`card shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-center ${kpis.savings > 0 ? 'bg-primary bg-opacity-10 border border-primary' : 'surface-card border-secondary'}`}>
                        <div className={`small fw-bold mb-1 d-flex align-items-center ${kpis.savings > 0 ? 'text-primary' : 'text-muted'}`}>
                            <i className="bi bi-piggy-bank-fill me-2"></i>Savings Rate
                        </div>
                        <div className="d-flex align-items-baseline gap-2">
                            <h3 className={`fw-bold mb-0 ${kpis.savings > 0 ? 'text-primary' : 'text-main'}`}>
                                {kpis.savingsRate > 0 ? kpis.savingsRate.toFixed(1) : 0}%
                            </h3>
                            <span className={`small fw-bold ${kpis.savings > 0 ? 'text-primary opacity-75' : 'text-muted'}`}>
                                ({formatCurrency(kpis.savings)})
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SANKEY DIAGRAM */}
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                    <h6 className="fw-bold mb-0"><i className="bi bi-bezier2 text-primary me-2"></i> Money Flow</h6>
                    <select 
                        className="form-select form-select-sm border-secondary bg-body text-main fw-bold shadow-sm rounded-pill px-3" 
                        style={{ width: 'auto', minWidth: '150px', cursor: 'pointer' }}
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    >
                        {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                </div>
                <div className="card-body p-4 p-md-5 d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
                    {filteredTransactions.length === 0 ? (
                        <div className="text-center text-muted fst-italic py-5">
                            <i className="bi bi-bar-chart-line fs-1 d-block mb-3 opacity-25"></i> No data available.
                        </div>
                    ) : sankeyData.links.length === 0 ? (
                        <div className="text-center text-muted fst-italic py-5">Categorize some transactions to generate your flow chart.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={500}>
                            <Sankey data={sankeyData} node={<SankeyNode />} nodePadding={25} margin={{ left: 20, right: 180, top: 20, bottom: 20 }} link={{ stroke: '#adb5bd', strokeOpacity: 0.2 }}>
                                <Tooltip content={<SankeyTooltip />} />
                            </Sankey>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* MACRO CASH FLOW & WORKSPACE BURN RATE */}
            <div className="row g-4">
                
                {/* MACRO CASH FLOW */}
                <div className="col-12 col-xl-6">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4">
                            <h6 className="fw-bold mb-0"><i className="bi bi-cash-stack text-success me-2"></i> Macro Cash Flow</h6>
                            <div className="text-muted small mt-1">Total Income vs Spend & Net Savings</div>
                        </div>
                        <div className="card-body p-4 pt-5">
                            {macroAndWorkspaceData.chartData.length === 0 ? (
                                <div className="text-center text-muted fst-italic py-5">No historical data available.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={350}>
                                    <ComposedChart data={macroAndWorkspaceData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                        <XAxis dataKey="month" tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tickFormatter={(val: number) => `$${val}`} tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip content={<CustomMultiTooltip />} cursor={{ fill: 'var(--bs-secondary-bg)', opacity: 0.4 }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        
                                        <Bar dataKey="income" name="Income" fill="#198754" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Bar dataKey="spend" name="Spend" fill="#dc3545" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                        <Line type="monotone" dataKey="savings" name="Net Savings" stroke="#0d6efd" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-body)' }} activeDot={{ r: 6, strokeWidth: 0, fill: '#0d6efd' }} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* WORKSPACE BURN RATE */}
                <div className="col-12 col-xl-6">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4">
                            <h6 className="fw-bold mb-0"><i className="bi bi-briefcase-fill text-warning me-2"></i> Workspace Burn Rate</h6>
                            <div className="text-muted small mt-1">Expenses broken down by Workspace</div>
                        </div>
                        <div className="card-body p-4 pt-5">
                            {macroAndWorkspaceData.chartData.length === 0 ? (
                                <div className="text-center text-muted fst-italic py-5">No historical data available.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={macroAndWorkspaceData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                        <XAxis dataKey="month" tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tickFormatter={(val: number) => `$${val}`} tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip content={<CustomMultiTooltip />} cursor={{ fill: 'var(--bs-secondary-bg)', opacity: 0.4 }} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        
                                        {macroAndWorkspaceData.workspaces.map((ws, idx) => (
                                            <Bar 
                                                key={ws} 
                                                dataKey={ws} 
                                                name={ws} 
                                                stackId="a" 
                                                fill={WS_COLORS[idx % WS_COLORS.length]} 
                                                maxBarSize={50} 
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

            </div>

            {/* TREND RADAR (LIFESTYLE CREEP) */}
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden mt-2">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                    <div>
                        <h6 className="fw-bold mb-0"><i className="bi bi-graph-up-arrow text-primary me-2"></i> Lifestyle Creep Radar</h6>
                        <div className="text-muted small mt-1 d-none d-md-block">Track historical category spend against your rolling average.</div>
                    </div>
                    <select className="form-select form-select-sm border-secondary bg-body text-main fw-bold shadow-sm rounded-pill px-3" style={{ width: 'auto', minWidth: '180px', cursor: 'pointer' }} value={trendCategory} onChange={(e) => setTrendCategory(e.target.value)}>
                        {availableTrendCategories.length === 0 ? <option value="">No Data</option> : availableTrendCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="card-body p-4 pt-5" style={{ minHeight: '400px' }}>
                    {trendData.length < 2 ? (
                        <div className="text-center text-muted fst-italic py-5 h-100 d-flex flex-column justify-content-center">
                            <i className="bi bi-clock-history fs-1 d-block mb-3 opacity-25"></i> Not enough historical data to map a trend.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                <XAxis dataKey="month" tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis tickFormatter={(val: number) => `$${val}`} tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip content={<CustomMultiTooltip />} cursor={{ stroke: 'var(--border-color)', strokeWidth: 1, strokeDasharray: '5 5' }} />
                                <ReferenceLine y={trendAverage} stroke="var(--bs-danger)" strokeDasharray="4 4" opacity={0.6}>
                                    <Label value={`Avg: ${formatCurrency(trendAverage)}`} position="insideTopLeft" fill="var(--bs-danger)" fontSize={12} fontWeight={600} dy={-15} />
                                </ReferenceLine>
                                <Line type="monotone" dataKey="amount" name="Total Spend" stroke={activeTrendColor} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'var(--bg-body)' }} activeDot={{ r: 6, strokeWidth: 0, fill: activeTrendColor }} animationDuration={500} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </div>
    );
}