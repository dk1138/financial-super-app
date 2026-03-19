'use client';

import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from '../../lib/expenseDb';
import { Category } from '../../app/expenses/page';

interface Props {
    totalSpend: number;
    transactionCount: number;
    transactions: Transaction[];
    monthlyData: any[];
    categoryData: any[];
    categories: Category[];
    setActiveTab: (tab: string) => void;
    formatCurrency: (val: number) => string;
}

export default function ExpenseDashboardTab({ 
    totalSpend, 
    transactionCount, 
    transactions,
    monthlyData, 
    categoryData, 
    categories,
    setActiveTab, 
    formatCurrency 
}: Props) {
    
    // State to track which pie slice is clicked
    const [selectedPieCategory, setSelectedPieCategory] = useState<string | null>(null);

    const getCategoryColor = (name: string) => {
        const cat = categories.find(c => c.name === name);
        return cat ? cat.color : '#6c757d';
    };

    const CustomPieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const value = payload[0].value || 0;
            return (
                <div className="bg-input border border-secondary p-2 rounded-3 shadow-sm">
                    <span className="fw-bold d-block text-main">{payload[0].name}</span>
                    <span className="text-muted small">{formatCurrency(Number(value))}</span>
                    <div className="text-primary small mt-1" style={{fontSize: '0.7rem'}}>Click to view transactions</div>
                </div>
            );
        }
        return null;
    };

    // Filter transactions for the mini-ledger under the pie chart
    const activeTransactions = selectedPieCategory 
        ? transactions.filter(t => t.category === selectedPieCategory).slice(0, 10) // Show top 10 recent
        : [];

    return (
        <div className="fade-in">
            {/* KPI ROW - Simplified to just 2 cards since Categories tab handles the warnings now */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                        <div className="card-body p-3 p-xl-4">
                            <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                Total Spend <i className="bi bi-wallet2 text-danger"></i>
                            </div>
                            <h3 className="fw-bold mb-0 text-main">{formatCurrency(totalSpend)}</h3>
                            <div className="text-muted small mt-1">Excludes hidden categories</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                        <div className="card-body p-3 p-xl-4">
                            <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                Processed Transactions <i className="bi bi-receipt-cutoff text-success"></i>
                            </div>
                            <h3 className="fw-bold mb-0 text-main">{transactionCount}</h3>
                            <div className="text-muted small mt-1">Total items ingested</div>
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
                                    <YAxis tick={{fontSize: 12, fill: '#6c757d'}} axisLine={false} tickLine={false} tickFormatter={(val: any) => `$${val}`} />
                                    <RechartsTooltip 
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
                                                onClick={(data) => setSelectedPieCategory(data.name)} // Wire up the click
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip content={<CustomPieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    {/* The Dynamic Mini-Legend / Transaction List */}
                                    <div className="w-100 mt-3 bg-input border border-secondary rounded-3 p-2 shadow-sm" style={{ maxHeight: '130px', overflowY: 'auto' }}>
                                        {!selectedPieCategory ? (
                                            <div className="text-center text-muted small py-3 fst-italic">Click a pie slice to view its transactions.</div>
                                        ) : (
                                            <>
                                                <div className="fw-bold small mb-2 text-main d-flex justify-content-between align-items-center border-bottom border-secondary pb-1">
                                                    <span>
                                                        <i className="bi bi-circle-fill me-2" style={{fontSize: '0.5rem', color: getCategoryColor(selectedPieCategory)}}></i>
                                                        {selectedPieCategory}
                                                    </span>
                                                    <i className="bi bi-x-circle text-muted cursor-pointer" onClick={() => setSelectedPieCategory(null)}></i>
                                                </div>
                                                {activeTransactions.map(tx => (
                                                    <div key={tx.id} className="d-flex justify-content-between small mb-1">
                                                        <span className="text-muted text-truncate me-2" style={{maxWidth: '150px'}}>{tx.merchant}</span>
                                                        <strong className="text-main">{formatCurrency(Math.abs(tx.amount))}</strong>
                                                    </div>
                                                ))}
                                                {activeTransactions.length >= 10 && (
                                                    <div className="text-center small mt-2"><button className="btn btn-sm btn-link p-0 text-muted" onClick={() => setActiveTab('transactions')}>View all...</button></div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}