'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '../../lib/expenseDb';

interface Props {
    transactions: Transaction[];
    formatCurrency: (val: number) => string;
}

type SortKey = 'date' | 'merchant' | 'category' | 'amount';

export default function ExpenseTransactionsTab({ transactions, formatCurrency }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    // --- 1. FILTER TRANSACTIONS (Real-time Search) ---
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
            
            // Convert to lower case for alphabetical sorting if it's a string
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        
        return sortableItems;
    }, [filteredTransactions, sortConfig]);

    // --- HANDLE SORT CLICK ---
    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        // If clicking the same column, toggle direction. Otherwise, default to ascending.
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Helper to render the sort arrow icon
    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up ms-1 opacity-25" style={{ fontSize: '0.7rem' }}></i>;
        return <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1 text-primary`} style={{ fontSize: '0.7rem' }}></i>;
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
                        <input 
                            type="text" 
                            className="form-control bg-input border-secondary text-main" 
                            placeholder="Search merchants or categories..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                
                {/* TABLE */}
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="table table-hover table-borderless align-middle mb-0">
                        <thead className="border-bottom border-secondary position-sticky top-0 bg-input shadow-sm" style={{ zIndex: 10 }}>
                            <tr>
                                {/* SORTABLE DATE COLUMN (Width 1% -> Shrinks to fit) */}
                                <th className="ps-4 text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('date')}>
                                    <div className="d-flex align-items-center">Date {renderSortIcon('date')}</div>
                                </th>
                                
                                {/* SORTABLE MERCHANT COLUMN (Expands) */}
                                <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('merchant')}>
                                    <div className="d-flex align-items-center">Merchant {renderSortIcon('merchant')}</div>
                                </th>
                                
                                {/* SORTABLE CATEGORY COLUMN (Expands) */}
                                <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('category')}>
                                    <div className="d-flex align-items-center">Category {renderSortIcon('category')}</div>
                                </th>
                                
                                {/* SORTABLE AMOUNT COLUMN (Width 1% -> Shrinks to fit) */}
                                <th className="text-end pe-4 text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('amount')}>
                                    <div className="d-flex align-items-center justify-content-end">Amount {renderSortIcon('amount')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="text-center py-5 text-muted fst-italic">
                                        No transactions match your search.
                                    </td>
                                </tr>
                            ) : (
                                sortedTransactions.slice(0, 150).map((tx) => (
                                    <tr key={tx.id} className="transition-all" style={{ cursor: 'pointer' }}>
                                        
                                        {/* DATE */}
                                        <td className="ps-4 py-3 text-nowrap">
                                            <span className="text-muted small fw-bold">{tx.dateString}</span>
                                        </td>
                                        
                                        {/* MERCHANT (Full Text, No Truncation) */}
                                        <td className="py-3 fw-bold text-main">
                                            {tx.merchant}
                                        </td>
                                        
                                        {/* CATEGORY */}
                                        <td className="py-3">
                                            <span className={`badge border rounded-pill px-3 py-1 ${tx.category === 'Uncategorized' ? 'bg-secondary bg-opacity-25 text-secondary border-secondary' : 'bg-success bg-opacity-25 text-success border-success'}`}>
                                                {tx.category}
                                            </span>
                                        </td>
                                        
                                        {/* AMOUNT */}
                                        <td className={`text-end pe-4 py-3 fw-bold text-nowrap ${tx.amount > 0 ? 'text-success' : 'text-main'}`}>
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </td>
                                        
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    {/* FOOTER MESSAGE */}
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