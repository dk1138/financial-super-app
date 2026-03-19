'use client';

import React, { useMemo, useState } from 'react';
import { Transaction, updateCategoryByNormalizedMerchant, normalizeMerchantName } from '../../lib/expenseDb';
import { MASTER_CATEGORIES } from './ExpenseTransactionsTab'; // Import the unified list

interface Props {
    uncategorizedTransactions: Transaction[];
    formatCurrency: (val: number) => string;
}

type SortKey = 'cleanName' | 'count' | 'totalAmount';

export default function ExpenseCategoriesTab({ uncategorizedTransactions, formatCurrency }: Props) {
    const [processingMerchant, setProcessingMerchant] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'cleanName', direction: 'asc' });

    // Ensure 'Select Category...' is at the top of the list for the native dropdown
    const bulkCategoryOptions = ['Select Category...', ...MASTER_CATEGORIES.filter(c => c !== 'Uncategorized')];

    // --- 1. GROUP & SORT TRANSACTIONS ---
    const merchantGroups = useMemo(() => {
        const groups: Record<string, { count: number; totalAmount: number; rawNames: Set<string> }> = {};
        
        uncategorizedTransactions.forEach(tx => {
            const cleanName = normalizeMerchantName(tx.merchant);
            
            if (!groups[cleanName]) {
                groups[cleanName] = { count: 0, totalAmount: 0, rawNames: new Set() };
            }
            
            groups[cleanName].count += 1;
            groups[cleanName].totalAmount += tx.amount;
            groups[cleanName].rawNames.add(tx.merchant);
        });

        const sortableGroups = Object.entries(groups).map(([cleanName, data]) => ({ 
            cleanName, 
            count: data.count, 
            totalAmount: data.totalAmount,
            bundledNames: Array.from(data.rawNames).slice(0, 3).join(', ') + (data.rawNames.size > 3 ? '...' : '')
        }));

        sortableGroups.sort((a, b) => {
            let aValue: string | number = a[sortConfig.key];
            let bValue: string | number = b[sortConfig.key];
            
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return sortableGroups;
    }, [uncategorizedTransactions, sortConfig]);

    // --- 2. SORT HANDLERS ---
    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up ms-1 opacity-25" style={{ fontSize: '0.7rem' }}></i>;
        return <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1 text-primary`} style={{ fontSize: '0.7rem' }}></i>;
    };

    // --- 3. BULK ASSIGN HANDLER ---
    const handleBulkAssign = async (cleanName: string, newCategory: string) => {
        if (newCategory === 'Select Category...') return;
        
        setProcessingMerchant(cleanName);
        await updateCategoryByNormalizedMerchant(cleanName, newCategory);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
        setProcessingMerchant(null);
    };

    return (
        <div className="fade-in">
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="fw-bold mb-1">Needs Categorization</h6>
                        <p className="text-muted small mb-0">Assign a category below to instantly update all past and future transactions for that merchant group.</p>
                    </div>
                    <div className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                        {merchantGroups.length} Groups Pending
                    </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {merchantGroups.length === 0 ? (
                        <div className="text-center py-5 fade-in">
                            <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-3" style={{ width: '60px', height: '60px' }}>
                                <i className="bi bi-check-lg fs-2 text-success"></i>
                            </div>
                            <h5 className="fw-bold text-success mb-1">All Caught Up!</h5>
                            <p className="text-muted small">You have no uncategorized transactions.</p>
                        </div>
                    ) : (
                        <table className="table table-hover table-borderless align-middle mb-0">
                            <thead className="border-bottom border-secondary position-sticky top-0 bg-input shadow-sm" style={{ zIndex: 10 }}>
                                <tr>
                                    <th className="ps-4 text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('cleanName')}>
                                        <div className="d-flex align-items-center">Merchant Group {renderSortIcon('cleanName')}</div>
                                    </th>
                                    <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all text-center" style={{ width: '15%' }} onClick={() => handleSort('count')}>
                                        <div className="d-flex align-items-center justify-content-center">Transactions {renderSortIcon('count')}</div>
                                    </th>
                                    <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all text-end" style={{ width: '15%' }} onClick={() => handleSort('totalAmount')}>
                                        <div className="d-flex align-items-center justify-content-end">Total Value {renderSortIcon('totalAmount')}</div>
                                    </th>
                                    <th className="pe-4 text-muted small fw-bold py-3 text-end" style={{ width: '25%' }}>Assign Rule</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchantGroups.map((group) => (
                                    <tr key={group.cleanName} className="transition-all">
                                        <td className="ps-4 py-3">
                                            <div className="fw-bold text-main">{group.cleanName}</div>
                                            <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }} title={group.bundledNames}>
                                                Includes: <span className="fst-italic">{group.bundledNames}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-center">
                                            <span className="badge bg-secondary bg-opacity-25 text-secondary rounded-pill px-3">
                                                {group.count}
                                            </span>
                                        </td>
                                        <td className={`py-3 text-end fw-bold ${group.totalAmount > 0 ? 'text-success' : 'text-main'}`}>
                                            {formatCurrency(group.totalAmount)}
                                        </td>
                                        <td className="pe-4 py-3 text-end">
                                            {processingMerchant === group.cleanName ? (
                                                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                            ) : (
                                                <select 
                                                    className="form-select form-select-sm border-secondary bg-input text-main rounded-pill shadow-none ms-auto fw-bold"
                                                    style={{ width: '180px', cursor: 'pointer' }}
                                                    defaultValue="Select Category..."
                                                    onChange={(e) => handleBulkAssign(group.cleanName, e.target.value)}
                                                >
                                                    {bulkCategoryOptions.map(cat => (
                                                        <option key={cat} value={cat} disabled={cat === 'Select Category...'}>
                                                            {cat}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}