'use client';

import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { initDB, saveTransactions, getAllTransactions, clearTransactions, Transaction } from '../../lib/expenseDb';

export default function ExpenseTrackerPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load data from IndexedDB when the page opens
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
            header: true, // Assumes the first row has column names
            skipEmptyLines: true,
            complete: async (results) => {
                const parsedData = results.data as any[];
                if (parsedData.length === 0) {
                    alert("The CSV file appears to be empty.");
                    setIsParsing(false);
                    return;
                }

                // Try to guess the column names (banks are notoriously inconsistent)
                const headers = Object.keys(parsedData[0]).map(h => h.toLowerCase());
                
                const dateKey = headers.find(h => h.includes('date')) || headers[0];
                const descKey = headers.find(h => h.includes('description') || h.includes('payee') || h.includes('name')) || headers[1];
                const amtKey = headers.find(h => h.includes('amount')) || headers.find(h => h.includes('value')) || headers[2];

                const newTransactions: Transaction[] = parsedData.map((row, index) => {
                    // Extract and clean the amount
                    const rawAmount = String(row[Object.keys(row).find(k => k.toLowerCase() === amtKey) || amtKey] || '0');
                    const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
                    
                    const rawDate = row[Object.keys(row).find(k => k.toLowerCase() === dateKey) || dateKey];
                    const dateObj = new Date(rawDate);

                    return {
                        id: `${Date.now()}-${index}`, // Unique ID
                        date: dateObj.getTime() || Date.now(),
                        dateString: isNaN(dateObj.getTime()) ? 'Unknown Date' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        merchant: row[Object.keys(row).find(k => k.toLowerCase() === descKey) || descKey] || 'Unknown Merchant',
                        category: 'Uncategorized', // Default category
                        account: file.name.replace('.csv', ''), // Tag with the filename
                        amount: isNaN(cleanAmount) ? 0 : cleanAmount
                    };
                });

                // Save to database and update UI
                await saveTransactions(newTransactions);
                await loadData();
                setIsParsing(false);
                if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
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
        }
    };

    // Calculate basic KPIs
    const totalSpend = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const uncategorizedCount = transactions.filter(t => t.category === 'Uncategorized').length;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(val);

    return (
        <div className="container-fluid pb-5 fade-in">
            {/* Hidden File Input */}
            <input type="file" accept=".csv" className="d-none" ref={fileInputRef} onChange={handleFileUpload} />

            {/* --- HEADER --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
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

            {/* --- EMPTY STATE --- */}
            {transactions.length === 0 && !isParsing && (
                <div className="card border-secondary border-dashed bg-transparent rounded-4 p-5 text-center mt-4">
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
            )}

            {/* --- DASHBOARD (Visible when data exists) --- */}
            {transactions.length > 0 && (
                <>
                    {/* KPI ROW */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                                <div className="card-body p-3 p-xl-4">
                                    <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                        Total Spend (All Time) <i className="bi bi-wallet2 text-danger"></i>
                                    </div>
                                    <h3 className="fw-bold mb-0 text-main">{formatCurrency(totalSpend)}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                                <div className="card-body p-3 p-xl-4">
                                    <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                        Transactions <i className="bi bi-receipt-cutoff text-success"></i>
                                    </div>
                                    <h3 className="fw-bold mb-0 text-main">{transactions.length}</h3>
                                    {uncategorizedCount > 0 && (
                                        <div className="text-muted small mt-2">
                                            <span className="badge bg-warning text-dark">{uncategorizedCount} Uncategorized</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* More KPIs can go here... */}
                    </div>

                    {/* TRANSACTIONS TABLE */}
                    <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">All Transactions</h6>
                            <div className="input-group input-group-sm" style={{ width: '250px' }}>
                                <span className="input-group-text bg-input border-secondary text-muted"><i className="bi bi-search"></i></span>
                                <input type="text" className="form-control bg-input border-secondary text-main" placeholder="Search merchants..." />
                            </div>
                        </div>
                        <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            <table className="table table-hover table-borderless align-middle mb-0">
                                <thead className="border-bottom border-secondary opacity-75 position-sticky top-0 bg-input" style={{ zIndex: 10 }}>
                                    <tr>
                                        <th className="ps-4 text-muted small fw-bold py-3">Date</th>
                                        <th className="text-muted small fw-bold py-3">Merchant</th>
                                        <th className="text-muted small fw-bold py-3">Category</th>
                                        <th className="text-muted small fw-bold py-3">Account</th>
                                        <th className="text-end pe-4 text-muted small fw-bold py-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.slice(0, 100).map((tx) => (
                                        <tr key={tx.id} style={{ cursor: 'pointer' }}>
                                            <td className="ps-4 py-3"><span className="text-muted small fw-bold">{tx.dateString}</span></td>
                                            <td className="py-3 fw-bold text-truncate" style={{ maxWidth: '200px' }}>{tx.merchant}</td>
                                            <td className="py-3">
                                                <span className={`badge border rounded-pill px-3 py-1 ${tx.category === 'Uncategorized' ? 'bg-secondary bg-opacity-25 text-secondary border-secondary' : 'bg-primary bg-opacity-25 text-primary border-primary'}`}>
                                                    {tx.category}
                                                </span>
                                            </td>
                                            <td className="py-3"><span className="text-muted small text-truncate d-inline-block" style={{ maxWidth: '120px' }}><i className="bi bi-bank me-1"></i> {tx.account}</span></td>
                                            <td className={`text-end pe-4 py-3 fw-bold ${tx.amount > 0 ? 'text-success' : 'text-main'}`}>
                                                {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {transactions.length > 100 && (
                                <div className="text-center p-3 text-muted small bg-input">
                                    Showing latest 100 transactions out of {transactions.length}.
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}