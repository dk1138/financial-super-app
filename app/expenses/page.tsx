'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAllTransactions, initDB, Transaction } from '../../lib/expenseDb';

import ExpenseDashboardTab from '../../components/expenses/ExpenseDashboardTab';
import ExpenseTransactionsTab from '../../components/expenses/ExpenseTransactionsTab';
import ExpenseCategoriesTab from '../../components/expenses/ExpenseCategoriesTab';
import ExpenseReportsTab from '../../components/expenses/ExpenseReportsTab';

export default function ExpenseTrackerPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        // Initialize the local database and load any saved transactions
        initDB();
        loadData();

        // Listen for the "expensesUpdated" event broadcasted by the GlobalHeader
        // when a user uploads a new CSV or clears their data
        const handleUpdate = () => loadData();
        window.addEventListener('expensesUpdated', handleUpdate);
        
        return () => window.removeEventListener('expensesUpdated', handleUpdate);
    }, []);

    const loadData = async () => {
        const data = await getAllTransactions();
        setTransactions(data);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

    // --- DATA AGGREGATION FOR TABS ---
    const { totalSpend, uncategorizedTransactions, monthlyData, categoryData } = useMemo(() => {
        let spendCount = 0;
        const uncategorized: Transaction[] = [];
        const monthlyMap: Record<string, { name: string, spend: number, income: number, sortDate: number }> = {};
        const categoryMap: Record<string, number> = {};

        transactions.forEach(t => {
            // Track uncategorized items
            if (t.category === 'Uncategorized') {
                uncategorized.push(t);
            }

            // Group by Month and Year for the Bar Chart
            const dateObj = new Date(t.date);
            const monthYear = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (!monthlyMap[monthYear]) {
                monthlyMap[monthYear] = { name: monthYear, spend: 0, income: 0, sortDate: dateObj.setDate(1) };
            }

            if (t.amount < 0) {
                // It's an expense
                spendCount += Math.abs(t.amount);
                monthlyMap[monthYear].spend += Math.abs(t.amount);
                
                // Track category totals for the Donut Chart
                if (t.category !== 'Uncategorized') {
                    categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
                }
            } else {
                // It's income
                monthlyMap[monthYear].income += t.amount;
            }
        });

        return {
            totalSpend: spendCount,
            uncategorizedTransactions: uncategorized,
            // Sort arrays so charts render left-to-right (chronological) and largest-to-smallest
            monthlyData: Object.values(monthlyMap).sort((a, b) => a.sortDate - b.sortDate),
            categoryData: Object.keys(categoryMap).map(key => ({ name: key, value: categoryMap[key] })).sort((a, b) => b.value - a.value)
        };
    }, [transactions]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-fill' },
        { id: 'transactions', label: 'Transactions', icon: 'bi-list-ul' },
        { id: 'categories', label: 'Categories', icon: 'bi-tags-fill' },
        { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill' }
    ];

    return (
        <div className="fade-in d-flex flex-column flex-grow-1">
            
            {/* --- STICKY NAVIGATION TABS --- */}
            {/* Positioned precisely under the GlobalHeader */}
            <div 
                className="position-sticky pt-2 pb-2 mb-3 shadow-sm" 
                style={{ 
                    top: 'var(--global-header-height, 65px)', 
                    backgroundColor: 'var(--bg-body)', 
                    zIndex: 1030, 
                    borderBottom: '1px solid var(--border-color)', 
                    margin: '0 -0.5rem', 
                    padding: '0 0.5rem' 
                }}
            >
                <ul className="nav nav-pills nav-fill gap-2 flex-nowrap overflow-auto hide-scrollbar m-0 px-1">
                    {tabs.map(tab => (
                        <li className="nav-item flex-fill" key={tab.id} onClick={() => setActiveTab(tab.id)}>
                            <div 
                                className={`nav-link rounded-3 fw-bold transition-all d-flex align-items-center justify-content-center py-1 px-2 border cursor-pointer ${activeTab === tab.id ? 'bg-success text-white border-success shadow' : 'bg-input text-muted border-secondary opacity-75'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className={`bi ${tab.icon} me-2 ${activeTab === tab.id ? 'text-white' : ''}`}></i>
                                <span className="text-nowrap">{tab.label}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- TAB CONTENT --- */}
            <div className="row g-4 flex-grow-1">
                <div className="col-12">
                    {transactions.length === 0 ? (
                        <div className="card border-secondary border-dashed bg-transparent rounded-4 p-5 text-center mt-2 fade-in py-5">
                            <i className="bi bi-file-earmark-spreadsheet fs-1 text-success opacity-50 mb-3 d-block"></i>
                            <h4 className="fw-bold mb-2">Ready to start?</h4>
                            <p className="text-muted small">Use the <b>Upload CSV</b> button in the header to import your bank data.</p>
                        </div>
                    ) : (
                        <div className="card shadow-sm mb-2 h-100 rounded-4 border-0 bg-transparent">
                            <div className="card-body p-0 fade-in-tab" key={activeTab}>
                                {activeTab === 'dashboard' && (
                                    <ExpenseDashboardTab 
                                        totalSpend={totalSpend} 
                                        transactionCount={transactions.length} 
                                        uncategorizedTransactions={uncategorizedTransactions} 
                                        monthlyData={monthlyData} 
                                        categoryData={categoryData} 
                                        setActiveTab={setActiveTab} 
                                        formatCurrency={formatCurrency} 
                                    />
                                )}
                                {activeTab === 'transactions' && (
                                    <ExpenseTransactionsTab 
                                        transactions={transactions} 
                                        formatCurrency={formatCurrency} 
                                    />
                                )}
                                {activeTab === 'categories' && <ExpenseCategoriesTab />}
                                {activeTab === 'reports' && <ExpenseReportsTab />}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
}