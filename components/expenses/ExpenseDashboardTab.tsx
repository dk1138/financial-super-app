'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../../lib/expenseDb';

const CATEGORY_COLORS = ['#0d6efd', '#ffc107', '#0dcaf0', '#6f42c1', '#d63384', '#fd7e14', '#198754'];

interface Props {
    totalSpend: number;
    transactionCount: number;
    uncategorizedTransactions: Transaction[];
    monthlyData: any[];
    categoryData: any[];
    setActiveTab: (tab: string) => void;
    formatCurrency: (val: number) => string;
}

export default function ExpenseDashboardTab({ 
    totalSpend, 
    transactionCount, 
    uncategorizedTransactions, 
    monthlyData, 
    categoryData, 
    setActiveTab, 
    formatCurrency 
}: Props) {
    
    // Custom Tooltip for the Pie Chart
    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const value = payload[0].value || 0;
            return (
                <div className="bg-input border border-secondary p-2 rounded-3 shadow-sm">
                    <span className="fw-bold d-block text-main">{payload[0].name}</span>
                    <span className="text-muted small">{formatCurrency(Number(value))}</span>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="fade-in">
            {/* KPI ROW */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6 col-xl-4">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                        <div className="card-body p-3 p-xl-4">
                            <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                Total Spend <i className="bi bi-wallet2 text-danger"></i>
                            </div>
                            <h3 className="fw-bold mb-0 text-main">{formatCurrency(totalSpend)}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                        <div className="card-body p-3 p-xl-4">
                            <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                Transactions <i className="bi bi-receipt-cutoff text-success"></i>
                            </div>
                            <h3 className="fw-bold mb-0 text-main">{transactionCount}</h3>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6 col-xl-4">
                    <div className="card h-100 border-warning shadow-sm rounded-4 bg-warning bg-opacity-10">
                        <div className="card-body p-3 p-xl-4">
                            <div className="text-warning text-opacity-75 fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                Action Required <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                            </div>
                            <h3 className="fw-bold mb-0 text-warning">{uncategorizedTransactions.length}</h3>
                            <div className="text-warning small mt-2 fw-bold">Uncategorized Transactions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div className="row g-4 mb-4">
                <div className="col-12 col-xl-8">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card">
                        <div className="card-header border-0 bg-transparent pt-4 pb-0 px-4">
                            <h6 className="fw-bold mb-0">Monthly Cash Flow</h6>
                        </div>
                        <div className="card-body p-4" style={{ height: '350px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#6c757d'}} axisLine={false} tickLine={false} />
                                    <YAxis 
                                        tick={{fontSize: 12, fill: '#6c757d'}} 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tickFormatter={(val: any) => `$${val}`} 
                                    />
                                    <Tooltip 
                                        cursor={{fill: 'var(--border-color)', opacity: 0.4}} 
                                        contentStyle={{backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)'}}
                                        formatter={(value: any) => {
                                            const numValue = Array.isArray(value) ? Number(value[0]) : Number(value);
                                            return formatCurrency(numValue || 0);
                                        }}
                                    />
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                    <Bar dataKey="spend" name="Total Spend" fill="#dc3545" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="income" name="Total Income" fill="#198754" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card">
                        <div className="card-header border-0 bg-transparent pt-4 pb-0 px-4">
                            <h6 className="fw-bold mb-0">Categorized Spend</h6>
                        </div>
                        <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center" style={{ height: '350px' }}>
                            {categoryData.length === 0 ? (
                                <div className="text-center text-muted opacity-50">
                                    <i className="bi bi-pie-chart display-1 d-block mb-3"></i>
                                    <span className="small px-4 d-block">Categorize transactions to see your spending breakdown.</span>
                                </div>
                            ) : (
                                <>
                                    <ResponsiveContainer width="100%" height="70%">
                                        <PieChart>
                                            <Pie 
                                                data={categoryData} 
                                                cx="50%" cy="50%" 
                                                innerRadius={60} outerRadius={90} 
                                                paddingAngle={2} dataKey="value"
                                                stroke="none"
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-100 mt-3" style={{ maxHeight: '100px', overflowY: 'auto' }}>
                                        {categoryData.slice(0, 4).map((cat, idx) => (
                                            <div key={cat.name} className="d-flex justify-content-between small mb-2 border-bottom border-secondary border-opacity-25 pb-1">
                                                <span className="text-muted text-truncate me-2">
                                                    <i className="bi bi-circle-fill me-2" style={{fontSize: '0.5rem', color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length]}}></i>
                                                    {cat.name}
                                                </span> 
                                                <strong className="text-main">{formatCurrency(cat.value)}</strong>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* UNCATEGORIZED TRANSACTIONS TO-DO LIST */}
            {uncategorizedTransactions.length > 0 && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-warning border-opacity-50 shadow-sm rounded-4 surface-card overflow-hidden">
                            <div className="card-header bg-warning bg-opacity-10 border-bottom border-warning border-opacity-25 py-3 px-4 d-flex justify-content-between align-items-center">
                                <h6 className="fw-bold mb-0 text-warning"><i className="bi bi-tags-fill me-2"></i>Needs Categorization</h6>
                                <button className="btn btn-sm btn-warning fw-bold rounded-pill px-3 shadow-sm" onClick={() => setActiveTab('transactions')}>
                                    View All ({uncategorizedTransactions.length})
                                </button>
                            </div>
                            <div className="list-group list-group-flush">
                                {uncategorizedTransactions.slice(0, 5).map(tx => (
                                    <div key={tx.id} className="list-group-item bg-transparent border-secondary py-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                                        <div>
                                            <div className="fw-bold text-main text-truncate" style={{ maxWidth: '300px' }}>{tx.merchant}</div>
                                            <div className="text-muted small">{tx.dateString} • {tx.account}</div>
                                        </div>
                                        <div className="d-flex align-items-center justify-content-between gap-3">
                                            <span className={`fw-bold ${tx.amount > 0 ? 'text-success' : 'text-main'}`}>
                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </span>
                                            <button className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-bold shadow-sm" onClick={() => setActiveTab('transactions')}>
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}