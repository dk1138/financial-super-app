'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { saveTransactions, clearTransactions } from '../../lib/expenseDb';

interface Props {
    showToast: (msg: string) => void;
}

// --- THE SMART CATEGORY ENGINE ---
const DEFAULT_RULES: Record<string, string[]> = {
    'Food': ['loblaws', 'metro', 'sobeys', 'no frills', 'walmart', 'mcdonalds', 'tim hortons', 'starbucks', 'uber eats', 'doordash', 'restaurant', 'cafe', 'lcbo', 'beer', 'whole foods'],
    'Transport': ['shell', 'esso', 'petro', 'uber', 'lyft', 'ttc', 'go transit', 'presto', 'parking', 'gas', 'honda', 'toyota', 'canadian tire'],
    'Housing': ['rent', 'mortgage', 'hydro', 'water', 'gas', 'home depot', 'ikea', 'property tax'],
    'Essentials': ['shoppers', 'rexall', 'pharmacy', 'bell', 'rogers', 'telus', 'koodo', 'fido', 'insurance', 'dental', 'vision', 'barber', 'salon'],
    'Lifestyle': ['netflix', 'spotify', 'amazon', 'cineplex', 'steam', 'apple', 'gym', 'goodlife', 'fit4less', 'golf', 'ticketmaster'],
};

const guessCategory = (merchant: string, amount: number): string => {
    // If it's a positive cash flow, it's likely income or a refund
    if (amount > 0) return 'Income';
    
    const lowerMerchant = merchant.toLowerCase();
    
    for (const [category, keywords] of Object.entries(DEFAULT_RULES)) {
        if (keywords.some(keyword => lowerMerchant.includes(keyword))) {
            return category;
        }
    }
    return 'Uncategorized';
};

export default function ExpenseHeaderActions({ showToast }: Props) {
    const [isParsing, setIsParsing] = useState(false);
    const [showClearExpenseModal, setShowClearExpenseModal] = useState(false);
    const expenseFileInputRef = useRef<HTMLInputElement>(null);

    const handleExpenseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

                const headers = Object.keys(parsedData[0] || {}).map(h => h.toLowerCase());
                const dateKey = headers.find(h => h.includes('date')) || headers[0];
                const descKey = headers.find(h => (h.includes('merchant') && !h.includes('category'))) || 
                                headers.find(h => h.includes('payee')) || 
                                headers.find(h => h.includes('description') && !h.includes('category')) || 
                                headers.find(h => h.includes('name') && !h.includes('category')) || 
                                headers.find(h => h.includes('description')) || 
                                headers[1];
                const amtKey = headers.find(h => h.includes('amount')) || headers.find(h => h.includes('value')) || headers[2];

                const newTransactions = parsedData.map((row, index) => {
                    const originalAmtKey = Object.keys(row).find(k => k.toLowerCase() === amtKey) || amtKey;
                    const originalDateKey = Object.keys(row).find(k => k.toLowerCase() === dateKey) || dateKey;
                    const originalDescKey = Object.keys(row).find(k => k.toLowerCase() === descKey) || descKey;

                    const rawAmount = String(row[originalAmtKey] || '0');
                    const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
                    const dateObj = new Date(row[originalDateKey]);
                    const merchantName = row[originalDescKey] || 'Unknown';
                    const amountValue = isNaN(cleanAmount) ? 0 : cleanAmount;
                    
                    return {
                        id: `${Date.now()}-${index}`,
                        date: dateObj.getTime() || Date.now(),
                        dateString: isNaN(dateObj.getTime()) ? 'Unknown' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        merchant: merchantName,
                        category: guessCategory(merchantName, amountValue), // AUTO-CATEGORIZE HERE
                        account: file.name.replace('.csv', ''),
                        amount: amountValue
                    };
                });

                await saveTransactions(newTransactions);
                window.dispatchEvent(new CustomEvent('expensesUpdated'));
                setIsParsing(false);
                showToast("CSV Uploaded & Auto-Categorized!");
                if (expenseFileInputRef.current) expenseFileInputRef.current.value = '';
            },
            error: (err) => {
                console.error("Parse Error:", err);
                alert("Failed to parse the CSV file.");
                setIsParsing(false);
            }
        });
    };

    const confirmClearExpenses = async () => {
        await clearTransactions();
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
        setShowClearExpenseModal(false);
        showToast("Expense data cleared.");
    };

    return (
        <>
            <input type="file" accept=".csv" className="d-none" ref={expenseFileInputRef} onChange={handleExpenseFileUpload} />
            
            <div className="d-flex gap-2 me-md-2">
                <button className="btn btn-sm btn-outline-danger bg-input fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center transition-all" onClick={() => setShowClearExpenseModal(true)} style={{ height: '36px' }}>
                    <i className="bi bi-trash3-fill me-1 d-none d-sm-inline"></i> Clear
                </button>
                <button className="btn btn-sm btn-success fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center transition-all" onClick={() => expenseFileInputRef.current?.click()} disabled={isParsing} style={{ height: '36px' }}>
                    {isParsing ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Parsing...</> : <><i className="bi bi-cloud-arrow-up-fill me-1 d-none d-sm-inline"></i> Upload CSV</>}
                </button>
            </div>

            {/* CLEAR DATA MODAL */}
            {showClearExpenseModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1080 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowClearExpenseModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative">
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center text-danger"><i className="bi bi-exclamation-octagon-fill me-2"></i> Clear Data</h6>
                                <button type="button" className="btn-close" onClick={() => setShowClearExpenseModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="text-muted small mb-4">Are you sure you want to delete all transaction history? This cannot be undone.</p>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary w-50 fw-bold rounded-pill" onClick={() => setShowClearExpenseModal(false)}>Cancel</button>
                                    <button className="btn btn-danger w-50 fw-bold rounded-pill" onClick={confirmClearExpenses}>Clear All</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}