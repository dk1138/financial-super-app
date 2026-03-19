'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { initDB, saveTransactions, getAllTransactions, clearTransactions, Transaction } from '../../lib/expenseDb';

// Import our new modular tabs
import ExpenseDashboardTab from '../../components/expenses/ExpenseDashboardTab';
import ExpenseTransactionsTab from '../../components/expenses/ExpenseTransactionsTab';
import ExpenseCategoriesTab from '../../components/expenses/ExpenseCategoriesTab';
import ExpenseReportsTab from '../../components/expenses/ExpenseReportsTab';

export default function ExpenseTrackerPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        initDB();
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAllTransactions();
        setTransactions(data);
    };

    // --- SMART CSV PARSER ---
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsParsing(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const parsedData = results.data as any[];
                if (parsedData.length === 0) {
                    alert("The CSV file appears to be empty.");
                    setIsParsing(false);
                    return;
                }

                const headers = Object.keys(parsedData[0]).map(h => h.toLowerCase());
                const dateKey = headers.find(h => h.includes('date')) || headers[0];
                const descKey = headers.find(h => h.includes('description') || h.includes('payee') || h.includes('name')) || headers[1];
                const amtKey = headers.find(h => h.includes('amount')) || headers.find(h => h.includes('value')) || headers[2];

                const newTransactions: Transaction[] = parsedData.map((row, index) => {
                    const rawAmount = String(row[Object.keys(row).find(k => k.toLowerCase() === amtKey) || amtKey] || '0');
                    const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
                    
                    const rawDate = row[Object.keys(row).find(k => k.toLowerCase() === dateKey) || dateKey];
                    const dateObj = new Date(rawDate);

                    return {
                        id: `${Date.now()}-${index}`,
                        date: dateObj.getTime() || Date.now(),
                        dateString: isNaN(dateObj.getTime()) ? 'Unknown Date' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        merchant: row[Object.keys(row).find(k => k.toLowerCase() === descKey) || descKey] || 'Unknown Merchant',
                        category: 'Uncategorized',
                        account: file.name.replace('.csv', ''),
                        amount: isNaN(cleanAmount) ? 0 : cleanAmount
                    };
                });

                await saveTransactions(newTransactions);
                await loadData();
                setIsParsing(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            error: (err) => {
                console.error("Parse Error:", err);
                alert("Failed to parse the CSV file.");
                setIsParsing(false);
            }
        });
    };

    const handleClearData = async () => {
        if (confirm("Are you sure you want to delete all transactions? This cannot be undone.")) {
            await clearTransactions();
            setTransactions([]);
            setActiveTab('dashboard'); 
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

    // --- DATA AGGREGATION FOR TABS ---
    const { totalSpend, uncategorizedTransactions, monthlyData, categoryData } = useMemo(() => {
        let spendCount = 0;
        const uncategorized: Transaction[] = [];
        const monthlyMap: Record<string, { name: string, spend: number, income: number, sortDate: number }> = {};
        const categoryMap: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.category === 'Uncategorized') uncategorized.push(t);

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

        const sortedMonthlyData = Object.values(monthlyMap).sort((a, b) => a.sortDate - b.sortDate);
        const sortedCategoryData = Object.keys(categoryMap)
            .map(key => ({ name: key, value: categoryMap[key] }))
            .sort((a, b) => b.value - a.value);

        return {
            totalSpend: spendCount,
            uncategorizedTransactions: uncategorized,
            monthlyData: sortedMonthlyData,
            categoryData: sortedCategoryData
        };
    }, [transactions]);

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'bi-grid-fill' },
        { id: 'transactions', label: 'Transactions', icon: 'bi-list-ul' },
        { id: 'categories', label: 'Categories', icon: 'bi-tags-fill' },
        { id: 'reports', label: 'Reports', icon: 'bi-bar-chart-fill' }
    ];

    return (
        <>
            <input type="file" accept=".csv" className="d-none" ref={fileInputRef} onChange={handleFileUpload} />

            {/* --- PAGE HEADER --- */}
            <div className="mb-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <div>
                    <h3 className="fw-bold mb-1">Expense Tracker</h3>
                    <p className="text-muted small mb-0">Categorize your spending to sync with your retirement plan.</p>
                </div>
                <div className="d-flex gap-2">
                    {transactions.length > 0 && (
                        <button className="btn btn-outline-danger bg-input rounded-pill fw-bold shadow-sm px-3" onClick={handleClearData}>
                            <i className="bi bi-trash3-fill"></i> Clear Data
                        </button>
                    )}
                    <button 
                        className="btn btn-success rounded-pill fw-bold shadow-sm d-flex align-items-center px-4" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isParsing}
                    >
                        {isParsing ? (
                            <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Parsing...</>
                        ) : (
                            <><i className="bi bi-cloud-arrow-up-fill me-2"></i> Upload CSV</>
                        )}
                    </button>
                </div>
            </div>

            {/* --- STICKY NAVIGATION TABS --- */}
            <div 
                className="position-sticky pt-2 pb-2 mb-3 shadow-sm" 
                style={{ top: 'var(--global-header-height, 65px)', backgroundColor: 'var(--bg-body)', zIndex: 1030, borderBottom: '1px solid var(--border-color)', margin: '0 -0.5rem', padding: '0 0.5rem' }}
            >
                <div className="row fade-in">
                    <div className="col-12">
                    <ul className="nav nav-pills nav-fill gap-2 flex-nowrap overflow-auto hide-scrollbar m-0 px-1" style={{ cursor: 'pointer' }}>
                        {tabs.map(tab => (
                        <li className="nav-item flex-fill" key={tab.id}>
                            <div 
                                className={`nav-link rounded-3 fw-bold transition-all d-flex align-items-center justify-content-center py-1 px-2 border ${activeTab === tab.id ? 'bg-success text-white border-success shadow' : 'bg-input text-muted border-secondary opacity-75'}`} 
                                onClick={() => setActiveTab(tab.id)}
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className={`bi ${tab.icon} me-2 ${activeTab === tab.id ? 'text-white' : ''}`}></i>
                                <span className="text-nowrap">{tab.label}</span>
                            </div>
                        </li>
                        ))}
                    </ul>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT RENDERING --- */}
            <div className="row g-4 flex-grow-1">
                <div className="col-12">
                    {transactions.length === 0 && !isParsing ? (
                        <div className="card border-secondary border-dashed bg-transparent rounded-4 p-5 text-center mt-2 fade-in">
                            <div className="card-body py-5">
                                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                                    <i className="bi bi-file-earmark-spreadsheet fs-1 text-success"></i>
                                </div>
                                <h4 className="fw-bold mb-3">No transactions found</h4>
                                <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                                    Upload a CSV from your bank or credit card to instantly categorize your spending and generate average monthly costs for your retirement plan.
                                </p>
                                <button className="btn btn-success rounded-pill fw-bold px-4 shadow-sm" onClick={() => fileInputRef.current?.click()}>
                                    <i className="bi bi-upload me-2"></i> Select CSV File
                                </button>
                            </div>
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
        </>
    );
}