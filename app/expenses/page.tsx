'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getAllTransactions, initDB, Transaction } from '../../lib/expenseDb';

import ExpenseDashboardTab from '../../components/expenses/ExpenseDashboardTab';
import ExpenseTransactionsTab from '../../components/expenses/ExpenseTransactionsTab';
import ExpenseCategoriesTab from '../../components/expenses/ExpenseCategoriesTab';
import ExpenseReportsTab from '../../components/expenses/ExpenseReportsTab';

export interface Category {
    name: string;
    color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Housing', color: '#0d6efd' },
    { name: 'Grocery', color: '#ffc107' },
    { name: 'Food & Dining', color: '#0dcaf0' },
    { name: 'Transport', color: '#6f42c1' },
    { name: 'Essentials', color: '#d63384' },
    { name: 'Lifestyle', color: '#fd7e14' },
    { name: 'Shopping', color: '#20c997' },
    { name: 'Health', color: '#e83e8c' },
    { name: 'Utilities', color: '#0a58ca' },
    { name: 'Exclude', color: '#6c757d' },
    { name: 'Income', color: '#198754' }
];

export default function ExpenseTrackerPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [rules, setRules] = useState<Record<string, string>>({}); // NEW: Rules State
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        initDB();
        loadData();

        const savedCats = localStorage.getItem('expense_categories');
        if (savedCats) setCategories(JSON.parse(savedCats));

        // NEW: Load saved rules on mount
        const savedRules = localStorage.getItem('expense_rules');
        if (savedRules) setRules(JSON.parse(savedRules));

        const handleUpdate = () => loadData();
        window.addEventListener('expensesUpdated', handleUpdate);
        return () => window.removeEventListener('expensesUpdated', handleUpdate);
    }, []);

    const loadData = async () => {
        const data = await getAllTransactions();
        setTransactions(data);
    };

    const handleUpdateCategories = (newCategories: Category[]) => {
        setCategories(newCategories);
        localStorage.setItem('expense_categories', JSON.stringify(newCategories));
    };

    // NEW: Function to update rules
    const handleUpdateRules = (newRules: Record<string, string>) => {
        setRules(newRules);
        localStorage.setItem('expense_rules', JSON.stringify(newRules));
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

    const { totalSpend, uncategorizedTransactions, monthlyData, categoryData } = useMemo(() => {
        let spendCount = 0;
        const uncategorized: Transaction[] = [];
        const monthlyMap: Record<string, { name: string, spend: number, income: number, sortDate: number }> = {};
        const categoryMap: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.category === 'Uncategorized') uncategorized.push(t);
            if (t.category === 'Exclude') return;

            const dateObj = new Date(t.date);
            const monthYear = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            
            if (!monthlyMap[monthYear]) {
                monthlyMap[monthYear] = { name: monthYear, spend: 0, income: 0, sortDate: dateObj.setDate(1) };
            }

            if (t.amount < 0) {
                spendCount += Math.abs(t.amount);
                monthlyMap[monthYear].spend += Math.abs(t.amount);
                if (t.category !== 'Uncategorized') {
                    categoryMap[t.category] = (categoryMap[t.category] || 0) + Math.abs(t.amount);
                }
            } else {
                monthlyMap[monthYear].income += t.amount;
            }
        });

        return {
            totalSpend: spendCount,
            uncategorizedTransactions: uncategorized,
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
            
            <div className="position-sticky pt-2 pb-2 mb-3 shadow-sm" style={{ top: 'var(--global-header-height, 65px)', backgroundColor: 'var(--bg-body)', zIndex: 1030, borderBottom: '1px solid var(--border-color)', margin: '0 -0.5rem', padding: '0 0.5rem' }}>
                <ul className="nav nav-pills nav-fill gap-2 flex-nowrap overflow-auto hide-scrollbar m-0 px-1">
                    {tabs.map(tab => (
                        <li className="nav-item flex-fill" key={tab.id} onClick={() => setActiveTab(tab.id)}>
                            <div className={`position-relative nav-link rounded-3 fw-bold transition-all d-flex align-items-center justify-content-center py-1 px-2 border cursor-pointer ${activeTab === tab.id ? 'bg-success text-white border-success shadow' : 'bg-input text-muted border-secondary opacity-75'}`} style={{ fontSize: '0.85rem' }}>
                                <i className={`bi ${tab.icon} me-2 ${activeTab === tab.id ? 'text-white' : ''}`}></i>
                                <span className="text-nowrap">{tab.label}</span>
                                {tab.id === 'categories' && uncategorizedTransactions.length > 0 && (
                                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle" style={{ marginTop: '5px', marginLeft: '-10px' }}>
                                        <span className="visually-hidden">Needs Categorization</span>
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

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
                                    <ExpenseDashboardTab totalSpend={totalSpend} transactionCount={transactions.length} transactions={transactions} monthlyData={monthlyData} categoryData={categoryData} categories={categories} setActiveTab={setActiveTab} formatCurrency={formatCurrency} />
                                )}

                                {activeTab === 'transactions' && (
                                    <ExpenseTransactionsTab transactions={transactions} categories={categories} formatCurrency={formatCurrency} />
                                )}

                                {activeTab === 'categories' && (
                                    <ExpenseCategoriesTab 
                                        uncategorizedTransactions={uncategorizedTransactions} 
                                        categories={categories}
                                        rules={rules} // Pass rules
                                        updateCategories={handleUpdateCategories}
                                        updateRules={handleUpdateRules} // Pass updater
                                        formatCurrency={formatCurrency} 
                                    />
                                )}

                                {activeTab === 'reports' && <ExpenseReportsTab />}
                                
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}