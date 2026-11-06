'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getAllTransactions, initDB, Transaction } from '../../lib/expenseDb';

import ExpenseDashboardTab from '../../components/expenses/ExpenseDashboardTab';
import ExpenseTransactionsTab from '../../components/expenses/ExpenseTransactionsTab';
import ExpenseCategoriesTab from '../../components/expenses/ExpenseCategoriesTab';
import ExpenseReportsTab from '../../components/expenses/ExpenseReportsTab';

export interface Category { name: string; color: string; budget?: number; }

const DEFAULT_CATEGORIES: Category[] = [
    { name: 'Housing', color: '#0d6efd' }, { name: 'Grocery', color: '#ffc107' }, { name: 'Food & Dining', color: '#0dcaf0' },
    { name: 'Transport', color: '#6f42c1' }, { name: 'Essentials', color: '#d63384' }, { name: 'Lifestyle', color: '#fd7e14' },
    { name: 'Shopping', color: '#20c997' }, { name: 'Health', color: '#e83e8c' }, { name: 'Utilities', color: '#0a58ca' },
    { name: 'Exclude', color: '#6c757d' }, { name: 'Income', color: '#198754' }
];

const DEV_SECRET_PASSCODE = 'plan2026';

export default function ExpenseTrackerPage() {
    // DEVELOPER ACCESS STATE
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [checkingAuth, setCheckingAuth] = useState<boolean>(true);
    const [showPasscodePrompt, setShowPasscodePrompt] = useState<boolean>(false);
    const [passcodeInput, setPasscodeInput] = useState<string>('');
    const [passcodeError, setPasscodeError] = useState<string | null>(null);

    // EXPENSE TRACKER DATA STATE
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [rules, setRules] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState('dashboard');

    const [workspaces, setWorkspaces] = useState<string[]>(['Personal', 'Konbinii Shop']);
    const [activeWorkspace, setActiveWorkspace] = useState<string>('Personal');

    // 1. Check Developer Authorization
    useEffect(() => {
        try {
            // Check localStorage
            const savedAuth = localStorage.getItem('expenses_dev_access');
            
            // Check URL query param e.g. /expenses?dev=plan2026
            const searchParams = new URLSearchParams(window.location.search);
            const devQuery = searchParams.get('dev');

            if (savedAuth === 'true' || devQuery === DEV_SECRET_PASSCODE) {
                localStorage.setItem('expenses_dev_access', 'true');
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        } catch (e) {
            console.error('Error verifying developer access:', e);
            setIsAuthorized(false);
        } finally {
            setCheckingAuth(false);
        }
    }, []);

    // 2. Initialize Data ONLY when Authorized
    useEffect(() => {
        if (!isAuthorized) return;

        initDB();
        loadData();

        const savedCats = localStorage.getItem('expense_categories');
        if (savedCats) setCategories(JSON.parse(savedCats));

        const savedRules = localStorage.getItem('expense_rules');
        if (savedRules) setRules(JSON.parse(savedRules));

        const savedWorkspaces = localStorage.getItem('expense_workspaces');
        if (savedWorkspaces) setWorkspaces(JSON.parse(savedWorkspaces));
        else localStorage.setItem('expense_workspaces', JSON.stringify(['Personal', 'Konbinii Shop']));

        const handleUpdate = () => loadData();
        window.addEventListener('expensesUpdated', handleUpdate);
        return () => window.removeEventListener('expensesUpdated', handleUpdate);
    }, [isAuthorized]);

    const loadData = async () => {
        const data = await getAllTransactions();
        setTransactions(data);
    };

    const handleUnlockSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (passcodeInput.trim() === DEV_SECRET_PASSCODE) {
            localStorage.setItem('expenses_dev_access', 'true');
            setIsAuthorized(true);
            setPasscodeError(null);
            setShowPasscodePrompt(false);
        } else {
            setPasscodeError('Incorrect passcode. Please try again.');
        }
    };

    const handleLockAgain = () => {
        localStorage.removeItem('expenses_dev_access');
        setIsAuthorized(false);
        setShowPasscodePrompt(false);
        setPasscodeInput('');
    };

    const handleUpdateCategories = (newCategories: Category[]) => { 
        setCategories(newCategories); 
        localStorage.setItem('expense_categories', JSON.stringify(newCategories)); 
    };
    
    const handleUpdateRules = (newRules: Record<string, string>) => { 
        setRules(newRules); 
        localStorage.setItem('expense_rules', JSON.stringify(newRules)); 
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

    // MASTER FILTER: Strips out data from other workspaces
    const activeData = useMemo(() => {
        if (activeWorkspace === 'All') return transactions;
        return transactions.filter(t => (t.workspace || 'Personal') === activeWorkspace);
    }, [transactions, activeWorkspace]);

    const { totalSpend, uncategorizedTransactions, monthlyData, categoryData } = useMemo(() => {
        let spendCount = 0;
        const uncategorized: Transaction[] = [];
        const monthlyMap: Record<string, { name: string, spend: number, income: number, sortDate: number }> = {};
        const categoryMap: Record<string, number> = {};

        activeData.forEach(t => {
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
    }, [activeData]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-fill' },
        { id: 'transactions', label: 'Transactions', icon: 'bi-list-ul' },
        { id: 'categories', label: 'Categories', icon: 'bi-tags-fill' },
        { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill' }
    ];

    // While checking authorization state
    if (checkingAuth) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-50 py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // PUBLIC VISITOR SCREEN: FEATURE UNDER ACTIVE DEVELOPMENT
    if (!isAuthorized) {
        return (
            <div className="container py-5 my-md-4 fade-in">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card surface-card border-secondary shadow-lg rounded-4 text-center p-4 p-md-5">
                            {/* Icon & Status Pill */}
                            <div className="mb-4 d-flex flex-column align-items-center">
                                <div 
                                    className="d-inline-flex align-items-center justify-content-center mb-3 shadow"
                                    style={{ 
                                        width: '68px', 
                                        height: '68px', 
                                        borderRadius: '20px', 
                                        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(13, 202, 240, 0.15))',
                                        border: '1px solid rgba(37, 99, 235, 0.3)'
                                    }}
                                >
                                    <i className="bi bi-cone-striped fs-2 text-warning"></i>
                                </div>
                                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 px-3 py-1.5 rounded-pill fw-bold" style={{ fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                                    UNDER ACTIVE DEVELOPMENT
                                </span>
                            </div>

                            {/* Headline & Explanation */}
                            <h2 className="fw-bold text-main mb-3" style={{ letterSpacing: '-0.02em' }}>
                                Planfolio Expense Tracker
                            </h2>
                            <p className="text-muted mb-4 leading-relaxed" style={{ fontSize: '0.95rem' }}>
                                We are currently engineering our local-first Canadian expense tracking and cash flow categorization engine. This module is undergoing private internal testing and is not yet open to the public.
                            </p>

                            {/* Main Navigation Actions */}
                            <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center mb-4">
                                <Link 
                                    href="/planner" 
                                    className="btn btn-primary rounded-pill fw-bold px-4 py-2 shadow-sm d-flex align-items-center justify-content-center"
                                >
                                    <i className="bi bi-graph-up-arrow me-2"></i> Launch Retirement Planner
                                </Link>
                                <Link 
                                    href="/" 
                                    className="btn btn-outline-secondary rounded-pill fw-semibold px-4 py-2"
                                >
                                    Back to Home
                                </Link>
                            </div>

                            {/* Secret Developer Passcode Access */}
                            <div className="border-top border-secondary pt-3 mt-2">
                                {!showPasscodePrompt ? (
                                    <button 
                                        type="button" 
                                        className="btn btn-link btn-sm text-muted text-decoration-none opacity-50 hover-opacity-100"
                                        onClick={() => setShowPasscodePrompt(true)}
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        <i className="bi bi-lock me-1"></i> Developer Access
                                    </button>
                                ) : (
                                    <form onSubmit={handleUnlockSubmit} className="fade-in mt-2">
                                        <div className="d-flex flex-column align-items-center">
                                            <div className="d-flex gap-2 w-100 justify-content-center" style={{ maxWidth: '300px' }}>
                                                <input 
                                                    type="password"
                                                    className="form-control form-control-sm bg-input border-secondary text-main rounded-pill px-3 text-center"
                                                    placeholder="Enter developer passcode..."
                                                    value={passcodeInput}
                                                    onChange={(e) => setPasscodeInput(e.target.value)}
                                                    autoFocus
                                                />
                                                <button 
                                                    type="submit" 
                                                    className="btn btn-sm btn-primary rounded-pill px-3 fw-bold"
                                                >
                                                    Unlock
                                                </button>
                                            </div>
                                            {passcodeError && (
                                                <div className="text-danger small mt-2 fw-medium">
                                                    {passcodeError}
                                                </div>
                                            )}
                                            <button 
                                                type="button" 
                                                className="btn btn-link btn-sm text-muted p-0 mt-2 text-decoration-none"
                                                onClick={() => { setShowPasscodePrompt(false); setPasscodeError(null); }}
                                                style={{ fontSize: '0.72rem' }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // AUTHORIZED DEVELOPER VIEW
    return (
        <div className="fade-in d-flex flex-column flex-grow-1">
            
            <div className="d-flex justify-content-between align-items-center mb-2 mt-1 px-2 fade-in">
                <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-briefcase-fill text-primary opacity-75"></i>
                    <h6 className="fw-bold mb-0 text-muted d-none d-md-block">Active Workspace:</h6>
                    
                    {/* Dev Mode Badge with quick lock ability */}
                    <button 
                        type="button" 
                        onClick={handleLockAgain}
                        className="btn btn-sm btn-outline-warning rounded-pill py-0 px-2 fw-bold ms-2"
                        style={{ fontSize: '0.7rem' }}
                        title="Click to lock page again"
                    >
                        <i className="bi bi-unlock-fill me-1"></i> Dev Mode Active (Lock)
                    </button>
                </div>
                
                <select
                    className="form-select form-select-sm border-secondary bg-input text-main fw-bold shadow-sm rounded-pill px-3"
                    style={{ width: 'auto', cursor: 'pointer' }}
                    value={activeWorkspace}
                    onChange={(e) => setActiveWorkspace(e.target.value)}
                >
                    <option value="All">🌎 All Workspaces</option>
                    {workspaces.map(w => (
                        <option key={w} value={w}>{w === 'Personal' ? '🏠 ' : '💼 '}{w}</option>
                    ))}
                </select>
            </div>

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
                                    <ExpenseDashboardTab totalSpend={totalSpend} transactionCount={activeData.length} transactions={activeData} monthlyData={monthlyData} categoryData={categoryData} categories={categories} setActiveTab={setActiveTab} formatCurrency={formatCurrency} />
                                )}

                                {activeTab === 'transactions' && (
                                    <ExpenseTransactionsTab 
                                        transactions={activeData} 
                                        categories={categories} 
                                        workspaces={workspaces}
                                        activeWorkspace={activeWorkspace}
                                        formatCurrency={formatCurrency} 
                                    />
                                )}

                                {activeTab === 'categories' && (
                                    <ExpenseCategoriesTab 
                                        uncategorizedTransactions={uncategorizedTransactions} 
                                        categories={categories} rules={rules} 
                                        updateCategories={handleUpdateCategories} updateRules={handleUpdateRules} formatCurrency={formatCurrency} 
                                    />
                                )}

                                {activeTab === 'reports' && (
                                    <ExpenseReportsTab 
                                        transactions={activeData} 
                                        categories={categories} 
                                        formatCurrency={formatCurrency} 
                                    />
                                )}
                                
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}