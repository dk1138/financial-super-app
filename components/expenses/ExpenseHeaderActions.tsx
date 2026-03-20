'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { saveTransactions, clearTransactions, normalizeMerchantName, getAllTransactions } from '../../lib/expenseDb';
import { getSuggestedCategory } from '../../lib/categorySuggestions';

interface Props {
    showToast: (msg: string) => void;
}

export default function ExpenseHeaderActions({ showToast }: Props) {
    const [isParsing, setIsParsing] = useState(false);
    const [showClearExpenseModal, setShowClearExpenseModal] = useState(false);
    
    const expenseFileInputRef = useRef<HTMLInputElement>(null);
    const restoreFileInputRef = useRef<HTMLInputElement>(null);

    const handleExpenseFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsParsing(true);

        const savedRules: Record<string, string> = JSON.parse(localStorage.getItem('expense_rules') || '{}');

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const parsedData = results.data as any[];
                if (parsedData.length === 0) { alert("The CSV file appears to be empty."); setIsParsing(false); return; }

                const headers = Object.keys(parsedData[0] || {}).map(h => h.toLowerCase());
                const dateKey = headers.find(h => h.includes('date')) || headers[0];
                const descKey = headers.find(h => (h.includes('merchant') && !h.includes('category'))) || headers.find(h => h.includes('payee')) || headers.find(h => h.includes('description') && !h.includes('category')) || headers.find(h => h.includes('name') && !h.includes('category')) || headers.find(h => h.includes('description')) || headers[1];
                const amtKey = headers.find(h => h.includes('amount')) || headers.find(h => h.includes('value')) || headers[2];

                const newTransactions = parsedData.map((row, index) => {
                    const originalAmtKey = Object.keys(row).find(k => k.toLowerCase() === amtKey) || amtKey;
                    const originalDateKey = Object.keys(row).find(k => k.toLowerCase() === dateKey) || dateKey;
                    const originalDescKey = Object.keys(row).find(k => k.toLowerCase() === descKey) || descKey;

                    const rawAmount = String(row[originalAmtKey] || '0');
                    const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
                    const dateObj = new Date(row[originalDateKey]);
                    
                    const merchantName = row[originalDescKey] || 'Unknown';
                    const cleanMerchantName = normalizeMerchantName(merchantName);
                    
                    const strictRule = savedRules[cleanMerchantName];
                    let category = 'Uncategorized';
                    let suggested = undefined;

                    if (strictRule) category = strictRule;
                    else suggested = getSuggestedCategory(merchantName, isNaN(cleanAmount) ? 0 : cleanAmount);

                    return {
                        id: `${Date.now()}-${index}`,
                        date: dateObj.getTime() || Date.now(),
                        dateString: isNaN(dateObj.getTime()) ? 'Unknown' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        merchant: merchantName,
                        category: category,
                        suggestedCategory: suggested,
                        workspace: 'Personal', // Default to Personal
                        account: file.name.replace('.csv', ''), // Store the CSV filename
                        amount: isNaN(cleanAmount) ? 0 : cleanAmount
                    };
                });

                await saveTransactions(newTransactions);
                window.dispatchEvent(new CustomEvent('expensesUpdated'));
                setIsParsing(false);
                showToast("CSV Uploaded!");
                if (expenseFileInputRef.current) expenseFileInputRef.current.value = '';
            },
            error: (err) => { console.error("Parse Error:", err); alert("Failed to parse the CSV file."); setIsParsing(false); }
        });
    };

    const handleBackupData = async () => {
        try {
            const txs = await getAllTransactions();
            const cats = JSON.parse(localStorage.getItem('expense_categories') || 'null');
            const rules = JSON.parse(localStorage.getItem('expense_rules') || 'null');
            const workspaces = JSON.parse(localStorage.getItem('expense_workspaces') || 'null');
            
            const backupPayload = {
                app: "FinancialSuperApp",
                version: "1.1",
                date: new Date().toISOString(),
                transactions: txs,
                categories: cats,
                rules: rules,
                workspaces: workspaces
            };

            const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `SuperApp_Backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("Backup file downloaded!");
        } catch (error) { console.error("Backup failed", error); alert("Failed to create backup."); }
    };

    const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.app !== "FinancialSuperApp") throw new Error("Invalid backup file signature.");

                if (data.transactions && Array.isArray(data.transactions)) {
                    await clearTransactions();
                    await saveTransactions(data.transactions);
                }
                if (data.categories) localStorage.setItem('expense_categories', JSON.stringify(data.categories));
                if (data.rules) localStorage.setItem('expense_rules', JSON.stringify(data.rules));
                if (data.workspaces) localStorage.setItem('expense_workspaces', JSON.stringify(data.workspaces));
                
                window.dispatchEvent(new CustomEvent('expensesUpdated'));
                showToast("Data perfectly restored!");
            } catch (err) { console.error("Restore failed", err); alert("Failed to restore data."); } 
            finally { if (restoreFileInputRef.current) restoreFileInputRef.current.value = ''; }
        };
        reader.readAsText(file);
    };

    const confirmClearExpenses = async () => { await clearTransactions(); window.dispatchEvent(new CustomEvent('expensesUpdated')); setShowClearExpenseModal(false); showToast("Expense data cleared."); };

    return (
        <>
            <input type="file" accept=".csv" className="d-none" ref={expenseFileInputRef} onChange={handleExpenseFileUpload} />
            <input type="file" accept=".json" className="d-none" ref={restoreFileInputRef} onChange={handleRestoreData} />
            
            <div className="d-flex flex-wrap gap-2 me-md-2 align-items-center">
                <div className="btn-group shadow-sm">
                    <button className="btn btn-sm btn-outline-secondary bg-input fw-bold d-flex align-items-center transition-all" onClick={() => restoreFileInputRef.current?.click()} style={{ height: '36px' }} title="Restore from Backup">
                        <i className="bi bi-arrow-down-circle me-1"></i> <span className="d-none d-lg-inline">Restore</span>
                    </button>
                    <button className="btn btn-sm btn-outline-secondary bg-input fw-bold d-flex align-items-center transition-all" onClick={handleBackupData} style={{ height: '36px' }} title="Download Backup">
                        <i className="bi bi-arrow-up-circle me-1"></i> <span className="d-none d-lg-inline">Backup</span>
                    </button>
                </div>
                <button className="btn btn-sm btn-outline-danger bg-input fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center transition-all ms-2" onClick={() => setShowClearExpenseModal(true)} style={{ height: '36px' }}>
                    <i className="bi bi-trash3-fill me-1 d-none d-sm-inline"></i> Clear
                </button>
                <button className="btn btn-sm btn-success fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center transition-all" onClick={() => expenseFileInputRef.current?.click()} disabled={isParsing} style={{ height: '36px' }}>
                    {isParsing ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Parsing...</> : <><i className="bi bi-cloud-arrow-up-fill me-1 d-none d-sm-inline"></i> Upload CSV</>}
                </button>
            </div>

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
                                <p className="text-muted small mb-4">Are you sure you want to delete all transaction history? Ensure you have a backup first!</p>
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