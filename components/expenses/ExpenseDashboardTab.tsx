'use client';

import React, { useMemo } from 'react';
import { Category } from '../../app/expenses/page';
import { Transaction } from '../../lib/expenseDb';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
    totalSpend: number;
    transactionCount: number;
    transactions: Transaction[];
    monthlyData: { name: string, spend: number, income: number }[];
    categoryData: { name: string, value: number }[];
    categories: Category[];
    setActiveTab: (tab: string) => void;
    formatCurrency: (val: number) => string;
}

export default function ExpenseDashboardTab({ totalSpend, transactionCount, transactions, monthlyData, categoryData, categories, setActiveTab, formatCurrency }: Props) {
    
    // --- 1. PERSONAL AVERAGE & SYNC TO RETIREMENT PLANNER ---
    const personalAverageSpend = useMemo(() => {
        const monthlyTotals: Record<string, number> = {};
        let activeMonthsCount = 0;

        transactions.forEach(tx => {
            if ((tx.workspace || 'Personal') === 'Personal' && tx.amount < 0 && tx.category !== 'Exclude' && tx.category !== 'Income') {
                const monthKey = new Date(tx.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                if (!monthlyTotals[monthKey]) {
                    monthlyTotals[monthKey] = 0;
                    activeMonthsCount++;
                }
                monthlyTotals[monthKey] += Math.abs(tx.amount);
            }
        });

        if (activeMonthsCount === 0) return 0;
        
        const totalPersonalSpend = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);
        return totalPersonalSpend / activeMonthsCount;
    }, [transactions]);

    const personalCategoryAverages = useMemo(() => {
        const categoryTotals: Record<string, number> = {};
        const globalMonths = new Set<string>();

        transactions.forEach(tx => {
            if ((tx.workspace || 'Personal') === 'Personal' && tx.amount < 0 && tx.category !== 'Exclude' && tx.category !== 'Income') {
                globalMonths.add(new Date(tx.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
                
                if (!categoryTotals[tx.category]) categoryTotals[tx.category] = 0;
                categoryTotals[tx.category] += Math.abs(tx.amount);
            }
        });

        const activeMonthsCount = globalMonths.size || 1;
        const averages: Record<string, number> = {};
        
        Object.entries(categoryTotals).forEach(([cat, total]) => {
            averages[cat] = Math.round(total / activeMonthsCount);
        });
        
        return averages;
    }, [transactions]);

    const pushToRetirementPlanner = (e: React.MouseEvent) => {
        e.stopPropagation(); 
        const annualSpend = Math.round(personalAverageSpend * 12);
        
        localStorage.setItem('superapp_shared_annual_spend', annualSpend.toString());
        localStorage.setItem('superapp_shared_category_spend', JSON.stringify(personalCategoryAverages));
        
        alert(`Success! $${annualSpend.toLocaleString()} per year and category breakdowns have been cached. You can now use the Auto-Fill button in your Retirement Planner.`);
    };

    // --- 2. ACTIVE BUDGET CALCULATIONS ---
    const { safeToSpend, totalBudgeted, budgetProgress } = useMemo(() => {
        const currentDate = transactions.length > 0 ? new Date(transactions[0].date) : new Date();
        const currentMonthString = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const currentMonthTxs = transactions.filter(t => new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) === currentMonthString);

        let safeAmount = 0; let totalLimit = 0;
        const progress: { cat: Category, spent: number, limit: number, pct: number, isOver: boolean }[] = [];

        categories.forEach(cat => {
            if (cat.budget && cat.budget > 0) {
                totalLimit += cat.budget;
                const spentThisMonth = currentMonthTxs.filter(t => t.category === cat.name && t.amount < 0).reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
                const pct = Math.min((spentThisMonth / cat.budget) * 100, 100);
                const isOver = spentThisMonth > cat.budget;
                progress.push({ cat, spent: spentThisMonth, limit: cat.budget, pct, isOver });
            }
        });

        const totalSpentInBudgets = progress.reduce((acc, curr) => acc + curr.spent, 0);
        safeAmount = Math.max(totalLimit - totalSpentInBudgets, 0);

        return { safeToSpend: safeAmount, totalBudgeted: totalLimit, budgetProgress: progress.sort((a, b) => b.pct - a.pct) };
    }, [transactions, categories]);


    // --- 3. SUBSCRIPTION & BILL RADAR ---
    const upcomingBills = useMemo(() => {
        const merchantGroups: Record<string, Transaction[]> = {};
        
        transactions.forEach(tx => {
            if (tx.amount >= 0 || tx.category === 'Exclude') return;
            if (!merchantGroups[tx.merchant]) merchantGroups[tx.merchant] = [];
            merchantGroups[tx.merchant].push(tx);
        });

        const subscriptions: { merchant: string, amount: number, nextDate: number, dateString: string, category: string }[] = [];
        const today = new Date().getTime();
        const thirtyDaysFromNow = today + (30 * 24 * 60 * 60 * 1000);

        Object.entries(merchantGroups).forEach(([merchant, txs]) => {
            if (txs.length < 2) return; 
            
            txs.sort((a, b) => b.date - a.date);
            const latest = txs[0];
            const previous = txs[1];

            const amountDiff = Math.abs(Math.abs(latest.amount) - Math.abs(previous.amount));
            const avgAmount = (Math.abs(latest.amount) + Math.abs(previous.amount)) / 2;
            if (amountDiff / avgAmount > 0.05) return; 

            const daysDiff = (latest.date - previous.date) / (1000 * 60 * 60 * 24);
            if (daysDiff >= 26 && daysDiff <= 35) {
                const nextExpectedDate = latest.date + (daysDiff * 24 * 60 * 60 * 1000);
                
                if (nextExpectedDate > (today - (5 * 24 * 60 * 60 * 1000)) && nextExpectedDate < thirtyDaysFromNow) {
                    subscriptions.push({
                        merchant,
                        amount: Math.abs(latest.amount),
                        nextDate: nextExpectedDate,
                        dateString: new Date(nextExpectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        category: latest.category
                    });
                }
            }
        });

        return subscriptions.sort((a, b) => a.nextDate - b.nextDate);
    }, [transactions]);


    // --- RENDERERS ---
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-input border border-secondary p-3 rounded-3 shadow-lg">
                    <p className="fw-bold mb-0 text-main">{payload[0].name}</p>
                    <p className="text-success fw-bold mb-0">{formatCurrency(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    const getCategoryColor = (name: string) => categories.find(c => c.name === name)?.color || '#6c757d';
    const isOverdue = (timestamp: number) => timestamp < new Date().getTime();

    return (
        <div className="fade-in d-flex flex-column gap-4 pb-4">
            
            {/* KPI ROW */}
            <div className="row g-3">
                
                {/* 1. PERSONAL AVG & SYNC WIDGET */}
                <div className="col-12 col-md-4">
                    <div className="card surface-card border-secondary shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-center cursor-pointer hover-bg-secondary transition-all" onClick={() => setActiveTab('transactions')}>
                        
                        <div className="text-muted small fw-bold mb-1 d-flex justify-content-between align-items-center">
                            <span><i className="bi bi-person-fill text-primary me-2"></i>Personal Avg. Spend</span>
                            
                            <button 
                                className="btn btn-sm btn-outline-primary py-0 px-2 rounded-pill fw-bold" 
                                style={{fontSize: '0.7rem'}}
                                onClick={pushToRetirementPlanner}
                                title="Push to Retirement Planner"
                            >
                                <i className="bi bi-arrow-right-circle-fill me-1"></i> Sync
                            </button>
                        </div>
                        
                        <h3 className="fw-bold text-main mb-0">
                            {formatCurrency(personalAverageSpend)}
                            <span className="text-muted fs-6">/mo</span>
                        </h3>
                        
                        <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                            All-Time Total: {formatCurrency(totalSpend)}
                        </div>
                    </div>
                </div>

                {/* 2. SAFE TO SPEND WIDGET */}
                <div className="col-12 col-md-8">
                    <div className={`card shadow-sm rounded-4 p-4 h-100 d-flex flex-column justify-content-center position-relative overflow-hidden ${totalBudgeted > 0 ? 'bg-success bg-opacity-10 border-success border-opacity-50' : 'surface-card border-secondary'}`}>
                        {totalBudgeted > 0 ? (
                            <>
                                <i className="bi bi-shield-check position-absolute text-success opacity-10" style={{ fontSize: '8rem', right: '-10px', top: '-20px' }}></i>
                                <div className="text-success small fw-bold mb-1 d-flex align-items-center position-relative z-1">
                                    <i className="bi bi-check-circle-fill me-2"></i>Safe to Spend (Current Month)
                                </div>
                                <h2 className="fw-bold text-success mb-0 position-relative z-1" style={{ fontSize: '2.5rem' }}>
                                    {formatCurrency(safeToSpend)}
                                </h2>
                                <div className="text-success text-opacity-75 fw-bold mt-1 position-relative z-1" style={{ fontSize: '0.85rem' }}>
                                    Remaining out of your {formatCurrency(totalBudgeted)} tracked budget
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <i className="bi bi-bullseye fs-2 text-muted mb-2 d-block"></i>
                                <h6 className="fw-bold text-main mb-1">Set up Active Budgeting</h6>
                                <p className="text-muted small mb-0">Go to the Categories tab and set monthly limits to calculate your "Safe to Spend" allowance.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BUDGET PROGRESS BARS */}
            {budgetProgress.length > 0 && (
                <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                    <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4">
                        <h6 className="fw-bold mb-0"><i className="bi bi-speedometer2 text-info me-2"></i>Budget Pacing (Current Month)</h6>
                    </div>
                    <div className="card-body p-4">
                        <div className="row g-4">
                            {budgetProgress.map(bp => (
                                <div key={bp.cat.name} className="col-12 col-md-6 col-lg-4">
                                    <div className="d-flex justify-content-between align-items-end mb-1">
                                        <span className="fw-bold text-main small">{bp.cat.name}</span>
                                        <span className={`small fw-bold ${bp.isOver ? 'text-danger' : 'text-muted'}`}>
                                            {formatCurrency(bp.spent)} / {formatCurrency(bp.limit)}
                                        </span>
                                    </div>
                                    <div className="progress bg-input border border-secondary border-opacity-50 shadow-inner rounded-pill" style={{ height: '12px' }}>
                                        <div className={`progress-bar rounded-pill ${bp.isOver ? 'bg-danger' : (bp.pct > 85 ? 'bg-warning' : '')}`} style={{ width: `${bp.pct}%`, backgroundColor: bp.isOver || bp.pct > 85 ? '' : bp.cat.color, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} title={`${bp.pct.toFixed(0)}% Used`}></div>
                                    </div>
                                    {bp.isOver && <div className="text-danger mt-1 fw-bold" style={{fontSize: '0.65rem'}}><i className="bi bi-exclamation-triangle-fill me-1"></i>Over budget by {formatCurrency(bp.spent - bp.limit)}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* CHARTS & RADAR ROW */}
            <div className="row g-4">
                
                {/* HISTORICAL CHART */}
                <div className="col-12 col-xl-8">
                    <div className="card border-secondary shadow-sm rounded-4 surface-card h-100 overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0"><i className="bi bi-bar-chart-fill text-primary me-2"></i>Historical Cash Flow</h6>
                            <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input" onClick={() => setActiveTab('reports')}>View Full Report</button>
                        </div>
                        <div className="card-body p-4 pt-5">
                            {monthlyData.length === 0 ? (
                                <div className="text-center text-muted fst-italic py-5">Upload CSV to see trends</div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                        <XAxis dataKey="name" tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tickFormatter={(val: number) => `$${val}`} tick={{ fill: 'var(--bs-secondary-color)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bs-secondary-bg)', opacity: 0.4 }} />
                                        <Bar dataKey="spend" name="Spend" fill="#dc3545" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN STACK */}
                <div className="col-12 col-xl-4 d-flex flex-column gap-4">
                    
                    {/* ALL-TIME BREAKDOWN PIE */}
                    <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4">
                            <h6 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-warning me-2"></i>All-Time Breakdown</h6>
                        </div>
                        <div className="card-body p-4">
                            {categoryData.length === 0 ? (
                                <div className="text-center text-muted fst-italic py-4">Upload CSV to see breakdown</div>
                            ) : (
                                <>
                                    <div style={{ height: '180px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none">
                                                    {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />)}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-3 d-flex flex-wrap gap-2 justify-content-center" style={{ maxHeight: '80px', overflowY: 'auto' }}>
                                        {categoryData.slice(0, 6).map(cat => (
                                            <div key={cat.name} className="d-flex align-items-center badge bg-input border border-secondary text-main fw-bold" style={{fontSize: '0.7rem'}}>
                                                <i className="bi bi-circle-fill me-1" style={{ color: getCategoryColor(cat.name) }}></i>{cat.name}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* UPCOMING BILLS RADAR */}
                    <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden flex-grow-1">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0"><i className="bi bi-radar text-danger me-2"></i>Upcoming Bills</h6>
                            <span className="badge bg-danger bg-opacity-10 text-danger border border-danger rounded-pill">{upcomingBills.length} Detected</span>
                        </div>
                        <div className="card-body p-0">
                            {upcomingBills.length === 0 ? (
                                <div className="text-center text-muted fst-italic p-4">
                                    <i className="bi bi-shield-check fs-2 d-block mb-2 opacity-50"></i>
                                    No recurring charges detected in the next 30 days.
                                </div>
                            ) : (
                                <div className="list-group list-group-flush hide-scrollbar" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                    {upcomingBills.map((bill, idx) => (
                                        <div key={idx} className="list-group-item bg-transparent border-secondary py-3 px-4 d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="fw-bold text-main">{bill.merchant}</div>
                                                <div className="text-muted small mt-1 d-flex align-items-center gap-2">
                                                    <span className="badge border rounded-pill px-2 py-1" style={{backgroundColor: `${getCategoryColor(bill.category)}15`, color: getCategoryColor(bill.category), borderColor: getCategoryColor(bill.category), fontSize: '0.65rem'}}>
                                                        {bill.category}
                                                    </span>
                                                    <span className={isOverdue(bill.nextDate) ? 'text-warning fw-bold' : ''}>
                                                        {isOverdue(bill.nextDate) ? 'Pending/Overdue' : `Expected ${bill.dateString}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="fw-bold text-danger fs-5">
                                                {formatCurrency(bill.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}