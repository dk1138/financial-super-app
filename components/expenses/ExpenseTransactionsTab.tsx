'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, updateTransactionCategory } from '../../lib/expenseDb';

interface Props {
    transactions: Transaction[];
    formatCurrency: (val: number) => string;
}

type SortKey = 'date' | 'merchant' | 'category' | 'amount';

// THE MASTER UNIFIED CATEGORY LIST
export const MASTER_CATEGORIES = [
    'Uncategorized', 'Housing', 'Grocery', 'Food & Dining', 'Transport', 
    'Essentials', 'Lifestyle', 'Shopping', 'Health', 'Utilities', 'Income'
];

export default function ExpenseTransactionsTab({ transactions, formatCurrency }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    
    // Tracks which row's custom dropdown is currently open
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    // --- 1. FILTER TRANSACTIONS ---
    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return transactions;
        const lowerSearch = searchTerm.toLowerCase();
        
        return transactions.filter(tx => 
            tx.merchant.toLowerCase().includes(lowerSearch) || 
            tx.category.toLowerCase().includes(lowerSearch)
        );
    }, [transactions, searchTerm]);

    // --- 2. SORT TRANSACTIONS ---
    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactions];
        
        sortableItems.sort((a, b) => {
            let aValue: string | number = a[sortConfig.key];
            let bValue: string | number = b[sortConfig.key];
            
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sortableItems;
    }, [filteredTransactions, sortConfig]);

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up ms-1 opacity-25" style={{ fontSize: '0.7rem' }}></i>;
        return <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1 text-primary`} style={{ fontSize: '0.7rem' }}></i>;
    };

    // --- 3. HANDLE CATEGORY CHANGES ---
    const handleCategoryChange = async (id: string, newCategory: string) => {
        await updateTransactionCategory(id, newCategory);
        setActiveDropdownId(null); // Close the dropdown
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    return (
        <div className="fade-in">
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                
                {/* HEADER & SEARCH BAR */}
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Ledger</h6>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-input border-secondary text-muted">
                            <i className="bi bi-search"></i>
                        </span>
                        <input type="text" className="form-control bg-input border-secondary text-main" placeholder="Search merchants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                {/* TABLE */}
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="table table-hover table-borderless align-middle mb-0">
                        <thead className="border-bottom border-secondary position-sticky top-0 bg-input shadow-sm" style={{ zIndex: 10 }}>
                            <tr>
                                <th className="ps-4 text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('date')}>
                                    <div className="d-flex align-items-center">Date {renderSortIcon('date')}</div>
                                </th>
                                <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('merchant')}>
                                    <div className="d-flex align-items-center">Merchant {renderSortIcon('merchant')}</div>
                                </th>
                                <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('category')}>
                                    <div className="d-flex align-items-center">Category {renderSortIcon('category')}</div>
                                </th>
                                <th className="text-end pe-4 text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('amount')}>
                                    <div className="d-flex align-items-center justify-content-end">Amount {renderSortIcon('amount')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-5 text-muted fst-italic">No transactions match your search.</td>
                                </tr>
                            ) : (
                                sortedTransactions.slice(0, 150).map((tx) => (
                                    <tr key={tx.id} className="transition-all">
                                        <td className="ps-4 py-3 text-nowrap">
                                            <span className="text-muted small fw-bold">{tx.dateString}</span>
                                        </td>
                                        <td className="py-3 fw-bold text-main">
                                            {tx.merchant}
                                        </td>
                                        
                                        {/* THE MODERN CUSTOM DROPDOWN */}
                                        <td className="py-3 position-relative">
                                            <div 
                                                className={`badge border rounded-pill px-3 py-2 cursor-pointer transition-all d-inline-flex align-items-center justify-content-between ${tx.category === 'Uncategorized' ? 'bg-secondary bg-opacity-25 text-secondary border-secondary' : 'bg-success bg-opacity-10 text-success border-success'}`}
                                                style={{ width: '140px', userSelect: 'none' }}
                                                onClick={() => setActiveDropdownId(activeDropdownId === tx.id ? null : tx.id)}
                                            >
                                                <span className="text-truncate">{tx.category}</span>
                                                <i className="bi bi-chevron-down ms-2" style={{ fontSize: '0.65rem' }}></i>
                                            </div>

                                            {/* DROPDOWN MENU POPOVER */}
                                            {activeDropdownId === tx.id && (
                                                <>
                                                    {/* Invisible full-screen backdrop to detect clicks outside */}
                                                    <div 
                                                        className="position-fixed top-0 start-0 w-100 h-100" 
                                                        style={{ zIndex: 1050 }} 
                                                        onClick={() => setActiveDropdownId(null)}
                                                    ></div>
                                                    
                                                    {/* The actual menu */}
                                                    <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg p-1 mt-1" style={{ zIndex: 1060, width: '180px', maxHeight: '250px', overflowY: 'auto' }}>
                                                        {MASTER_CATEGORIES.map(cat => (
                                                            <div 
                                                                key={cat} 
                                                                className={`px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all hover-bg-secondary hover-text-main ${tx.category === cat ? 'bg-primary bg-opacity-10 text-primary' : 'text-muted'}`}
                                                                onClick={() => handleCategoryChange(tx.id, cat)}
                                                            >
                                                                {cat}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                        
                                        <td className={`text-end pe-4 py-3 fw-bold text-nowrap ${tx.amount > 0 ? 'text-success' : 'text-main'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    {sortedTransactions.length > 150 && (
                        <div className="text-center p-3 text-muted small bg-input border-top border-secondary">
                            Showing first 150 results. Use the search bar to find older transactions.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}