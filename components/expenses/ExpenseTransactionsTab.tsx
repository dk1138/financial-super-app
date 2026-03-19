'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
    
    // --- FEATURE #2: BULK SELECTION STATE ---
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // --- FEATURE #3: FUZZY DROPDOWN STATE ---
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    // 1. Filter Transactions (Main Search Bar)
    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return transactions;
        const lowerSearch = searchTerm.toLowerCase();
        return transactions.filter(tx => 
            tx.merchant.toLowerCase().includes(lowerSearch) || 
            tx.category.toLowerCase().includes(lowerSearch)
        );
    }, [transactions, searchTerm]);

    // 2. Sort Transactions
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

    // --- BULK SELECTION HANDLERS ---
    const toggleSelectAll = () => {
        if (selectedIds.size === sortedTransactions.length && sortedTransactions.length > 0) {
            setSelectedIds(new Set()); // Deselect all
        } else {
            setSelectedIds(new Set(sortedTransactions.map(t => t.id))); // Select all currently filtered
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    // --- FUZZY DROPDOWN MENU LOGIC ---
    const allOptions = useMemo(() => ['Uncategorized', ...categories.map(c => c.name)], [categories]);
    const filteredDropdownCategories = useMemo(() => {
        return allOptions.filter(c => c.toLowerCase().includes(dropdownSearch.toLowerCase()));
    }, [allOptions, dropdownSearch]);

    const openDropdown = (id: string) => {
        if (activeDropdownId === id) {
            setActiveDropdownId(null);
        } else {
            setActiveDropdownId(id);
            setDropdownSearch(''); // Reset search text
            setHighlightedIndex(0); // Reset keyboard highlight
            
            // Auto-focus the input field perfectly when the menu opens
            setTimeout(() => {
                const input = document.getElementById(`dropdown-search-${id}`);
                if (input) input.focus();
            }, 10);
        }
    };

    const handleCategoryChange = async (id: string, newCategory: string) => {
        await updateTransactionCategory(id, newCategory);
        setActiveDropdownId(null); 
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleBulkCategoryChange = async (newCategory: string) => {
        // Execute updates for all selected IDs
        await Promise.all(Array.from(selectedIds).map(id => updateTransactionCategory(id, newCategory)));
        setSelectedIds(new Set()); // Clear selections
        setActiveDropdownId(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    // Keyboard Navigation inside the dropdown
    const handleKeyDown = (e: React.KeyboardEvent, targetId: string) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault(); // Stop page scrolling
            setHighlightedIndex(prev => Math.min(prev + 1, filteredDropdownCategories.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredDropdownCategories[highlightedIndex]) {
                const chosenCat = filteredDropdownCategories[highlightedIndex];
                if (targetId === 'bulk') handleBulkCategoryChange(chosenCat);
                else handleCategoryChange(targetId, chosenCat);
            }
        } else if (e.key === 'Escape') {
            setActiveDropdownId(null);
        }
    };

    // Reusable UI block for the Fuzzy Menu (Used in individual rows AND the bulk action bar)
    const renderFuzzyMenu = (targetId: string, currentCategory?: string) => (
        <div className="p-2">
            <input
                id={`dropdown-search-${targetId}`}
                type="text"
                className="form-control form-control-sm bg-body border-secondary text-main mb-2 rounded-2 shadow-none"
                placeholder="Search categories..."
                value={dropdownSearch}
                onChange={(e) => { setDropdownSearch(e.target.value); setHighlightedIndex(0); }}
                onKeyDown={(e) => handleKeyDown(e, targetId)}
                autoComplete="off"
            />
            <div className="hide-scrollbar" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filteredDropdownCategories.length === 0 ? (
                    <div className="text-muted small text-center py-2 fst-italic">No matches</div>
                ) : (
                    filteredDropdownCategories.map((catName, idx) => {
                        const catObj = categories.find(c => c.name === catName);
                        const color = catObj ? catObj.color : '#6c757d';
                        const isSelected = currentCategory === catName;
                        
                        return (
                            <div 
                                key={catName} 
                                className={`px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all d-flex align-items-center ${idx === highlightedIndex ? 'bg-secondary bg-opacity-25 text-main' : 'text-muted'} ${isSelected ? 'text-primary bg-primary bg-opacity-10' : ''}`}
                                onClick={() => targetId === 'bulk' ? handleBulkCategoryChange(catName) : handleCategoryChange(targetId, catName)}
                                onMouseEnter={() => setHighlightedIndex(idx)}
                            >
                                <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', color: catName === 'Uncategorized' ? 'transparent' : color }}></i>
                                {catName}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );

    return (
        <div className="fade-in position-relative">
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
                                {/* CHECKBOX HEADER */}
                                <th className="ps-4 py-3" style={{ width: '1%' }}>
                                    <input 
                                        type="checkbox" 
                                        className="form-check-input cursor-pointer shadow-none border-secondary" 
                                        checked={selectedIds.size === sortedTransactions.length && sortedTransactions.length > 0} 
                                        onChange={toggleSelectAll} 
                                        title="Select All"
                                    />
                                </th>
                                <th className="text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('date')}>
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
                                    <td colSpan={5} className="text-center py-5 text-muted fst-italic">No transactions match your search.</td>
                                </tr>
                            ) : (
                                sortedTransactions.slice(0, 150).map((tx) => {
                                    const isUncat = tx.category === 'Uncategorized';
                                    const catData = categories.find(c => c.name === tx.category);
                                    const baseColor = catData ? catData.color : '#6c757d';
                                    const bgColor = isUncat ? 'var(--bs-secondary-bg-subtle)' : `${baseColor}25`;
                                    const isRowSelected = selectedIds.has(tx.id);

                                    return (
                                        <tr key={tx.id} className={`transition-all ${isRowSelected ? 'bg-primary bg-opacity-10' : ''}`}>
                                            
                                            {/* CHECKBOX CELL */}
                                            <td className="ps-4 py-3">
                                                <input 
                                                    type="checkbox" 
                                                    className="form-check-input cursor-pointer shadow-none border-secondary" 
                                                    checked={isRowSelected} 
                                                    onChange={() => toggleSelection(tx.id)} 
                                                />
                                            </td>

                                            <td className="py-3 text-nowrap">
                                                <span className="text-muted small fw-bold">{tx.dateString}</span>
                                            </td>
                                            <td className="py-3 fw-bold text-main">{tx.merchant}</td>
                                            
                                            {/* FUZZY CUSTOM DROPDOWN */}
                                            <td className="py-3 position-relative">
                                                <div 
                                                    className={`border rounded-pill px-3 cursor-pointer transition-all d-inline-flex align-items-center justify-content-between small fw-bold ${isUncat ? 'text-secondary border-secondary' : 'border-transparent'}`}
                                                    style={{ 
                                                        width: '140px', height: '28px', userSelect: 'none',
                                                        backgroundColor: bgColor, color: isUncat ? '' : baseColor, borderColor: isUncat ? '' : baseColor
                                                    }}
                                                    onClick={() => openDropdown(tx.id)}
                                                >
                                                    <span className="text-truncate" style={{ paddingBottom: '1px' }}>{tx.category}</span>
                                                    <i className="bi bi-chevron-down ms-2 opacity-50" style={{ fontSize: '0.65rem' }}></i>
                                                </div>

                                                {activeDropdownId === tx.id && (
                                                    <>
                                                        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                                        <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mt-1" style={{ zIndex: 1060, width: '220px', left: 0 }}>
                                                            {renderFuzzyMenu(tx.id, tx.category)}
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

            {/* --- FLOATING BULK ACTION BAR --- */}
            {selectedIds.size > 0 && (
                <div 
                    className="position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-3 surface-card border border-secondary shadow-lg rounded-pill d-flex align-items-center gap-3 fade-in" 
                    style={{ zIndex: 1100, animation: 'slideUp 0.3s ease-out forwards' }}
                >
                    <span className="badge bg-primary rounded-pill px-3 py-2 shadow-sm fs-6">
                        {selectedIds.size} Selected
                    </span>
                    <span className="text-muted small fw-bold d-none d-sm-block">Assign to:</span>
                    
                    <div className="position-relative">
                        <button 
                            className="btn btn-sm btn-outline-secondary bg-input text-main fw-bold rounded-pill px-4 shadow-sm border-secondary" 
                            onClick={() => openDropdown('bulk')}
                        >
                            Select Category <i className="bi bi-chevron-up ms-2"></i>
                        </button>

                        {/* Bulk Action Fuzzy Dropdown (Opens Upwards) */}
                        {activeDropdownId === 'bulk' && (
                            <>
                                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mb-2 bottom-100 start-50 translate-middle-x" style={{ zIndex: 1060, width: '220px' }}>
                                    {renderFuzzyMenu('bulk')}
                                </div>
                            </>
                        )}
                    </div>

                    <button className="btn btn-sm btn-link text-muted ms-1 p-0 text-decoration-none fw-bold hover-text-danger transition-all" onClick={() => setSelectedIds(new Set())}>
                        Cancel
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { transform: translate(-50%, 100%); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}