'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, updateTransactionCategory } from '../../lib/expenseDb';
import { Category } from '../../app/expenses/page';

interface Props {
    transactions: Transaction[];
    categories: Category[];
    formatCurrency: (val: number) => string;
}

type SortKey = 'date' | 'merchant' | 'category' | 'amount';

export default function ExpenseTransactionsTab({ transactions, categories, formatCurrency }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return transactions;
        const lowerSearch = searchTerm.toLowerCase();
        return transactions.filter(tx => 
            tx.merchant.toLowerCase().includes(lowerSearch) || 
            tx.category.toLowerCase().includes(lowerSearch)
        );
    }, [transactions, searchTerm]);

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

    const handleCategoryChange = async (id: string, newCategory: string) => {
        await updateTransactionCategory(id, newCategory);
        setActiveDropdownId(null); 
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    return (
        <div className="fade-in">
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Ledger</h6>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-input border-secondary text-muted"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control bg-input border-secondary text-main" placeholder="Search merchants..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
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
                                sortedTransactions.slice(0, 150).map((tx) => {
                                    
                                    // Identify Colors for the UI
                                    const isUncat = tx.category === 'Uncategorized';
                                    const catData = categories.find(c => c.name === tx.category);
                                    const baseColor = catData ? catData.color : '#6c757d';
                                    // Append '25' to hex for 15% opacity background
                                    const bgColor = isUncat ? 'var(--bs-secondary-bg-subtle)' : `${baseColor}25`;

                                    return (
                                        <tr key={tx.id} className="transition-all">
                                            <td className="ps-4 py-3 text-nowrap">
                                                <span className="text-muted small fw-bold">{tx.dateString}</span>
                                            </td>
                                            <td className="py-3 fw-bold text-main">{tx.merchant}</td>
                                            
                                            <td className="py-3 position-relative">
                                                <div 
                                                    className={`border rounded-pill px-3 cursor-pointer transition-all d-inline-flex align-items-center justify-content-between small fw-bold ${isUncat ? 'text-secondary border-secondary' : 'border-transparent'}`}
                                                    style={{ 
                                                        width: '140px', 
                                                        height: '28px', 
                                                        userSelect: 'none',
                                                        backgroundColor: bgColor,
                                                        color: isUncat ? '' : baseColor,
                                                        borderColor: isUncat ? '' : baseColor
                                                    }}
                                                    onClick={() => setActiveDropdownId(activeDropdownId === tx.id ? null : tx.id)}
                                                >
                                                    <span className="text-truncate" style={{ paddingBottom: '1px' }}>{tx.category}</span>
                                                    <i className="bi bi-chevron-down ms-2 opacity-50" style={{ fontSize: '0.65rem' }}></i>
                                                </div>

                                                {activeDropdownId === tx.id && (
                                                    <>
                                                        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                                        <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg p-1 mt-1" style={{ zIndex: 1060, width: '180px', maxHeight: '250px', overflowY: 'auto' }}>
                                                            <div 
                                                                className={`px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all hover-bg-secondary hover-text-main ${tx.category === 'Uncategorized' ? 'bg-secondary bg-opacity-25 text-secondary' : 'text-muted'}`}
                                                                onClick={() => handleCategoryChange(tx.id, 'Uncategorized')}
                                                            >
                                                                Uncategorized
                                                            </div>
                                                            <hr className="my-1 border-secondary opacity-25" />
                                                            {categories.map(cat => (
                                                                <div 
                                                                    key={cat.name} 
                                                                    className={`px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all hover-bg-secondary d-flex align-items-center`}
                                                                    style={{ 
                                                                        color: tx.category === cat.name ? cat.color : 'var(--bs-body-color)',
                                                                        backgroundColor: tx.category === cat.name ? `${cat.color}20` : 'transparent'
                                                                    }}
                                                                    onClick={() => handleCategoryChange(tx.id, cat.name)}
                                                                >
                                                                    <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', color: cat.color }}></i>
                                                                    {cat.name}
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
                                    );
                                })
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