'use client';

import React, { useMemo, useState } from 'react';
import { Transaction, updateCategoryByNormalizedMerchant, normalizeMerchantName } from '../../lib/expenseDb';
import { Category } from '../../app/expenses/page';

interface Props {
    uncategorizedTransactions: Transaction[];
    categories: Category[];
    rules: Record<string, string>;
    updateCategories: (cats: Category[]) => void;
    updateRules: (rules: Record<string, string>) => void;
    formatCurrency: (val: number) => string;
}

type SortKey = 'cleanName' | 'count' | 'totalAmount';

export default function ExpenseCategoriesTab({ uncategorizedTransactions, categories, rules, updateCategories, updateRules, formatCurrency }: Props) {
    const [processingMerchant, setProcessingMerchant] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'cleanName', direction: 'asc' });
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#0d6efd');

    const merchantGroups = useMemo(() => {
        const groups: Record<string, { count: number; totalAmount: number; rawNames: Set<string> }> = {};
        
        uncategorizedTransactions.forEach(tx => {
            const cleanName = normalizeMerchantName(tx.merchant);
            if (!groups[cleanName]) groups[cleanName] = { count: 0, totalAmount: 0, rawNames: new Set() };
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

    const handleSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return <i className="bi bi-arrow-down-up ms-1 opacity-25" style={{ fontSize: '0.7rem' }}></i>;
        return <i className={`bi bi-caret-${sortConfig.direction === 'asc' ? 'up' : 'down'}-fill ms-1 text-primary`} style={{ fontSize: '0.7rem' }}></i>;
    };

    const handleBulkAssign = async (cleanName: string, newCategory: string) => {
        setProcessingMerchant(cleanName);
        setActiveDropdownId(null);
        
        // 1. Save this assignment as a persistent rule for future uploads
        const newRules = { ...rules, [cleanName]: newCategory };
        updateRules(newRules);

        // 2. Update existing transactions in the database
        await updateCategoryByNormalizedMerchant(cleanName, newCategory);
        
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
        setProcessingMerchant(null);
    };

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = newCatName.trim();
        if (!cleanName) return;
        if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) {
            alert("A category with this name already exists.");
            return;
        }
        updateCategories([...categories, { name: cleanName, color: newCatColor }]);
        setNewCatName('');
    };

    const handleRemoveCategory = (nameToRemove: string) => {
        if (confirm(`Are you sure you want to delete the "${nameToRemove}" category? Any transactions using this category will still display the text, but lose their color.`)) {
            updateCategories(categories.filter(c => c.name !== nameToRemove));
        }
    };

    const handleRemoveRule = (merchant: string) => {
        const newRules = { ...rules };
        delete newRules[merchant];
        updateRules(newRules);
    };

    return (
        <div className="fade-in d-flex flex-column gap-4">
            
            {/* --- SECTION 1: PENDING CATEGORIZATION --- */}
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="fw-bold mb-1">Needs Categorization</h6>
                        <p className="text-muted small mb-0">Assign a category below to instantly update past transactions AND create an auto-rule for the future.</p>
                    </div>
                    <div className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                        {merchantGroups.length} Groups Pending
                    </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                                            <span className="badge bg-secondary bg-opacity-25 text-secondary rounded-pill px-3">{group.count}</span>
                                        </td>
                                        <td className={`py-3 text-end fw-bold ${group.totalAmount > 0 ? 'text-success' : 'text-main'}`}>
                                            {formatCurrency(group.totalAmount)}
                                        </td>
                                        <td className="pe-4 py-3 text-end position-relative">
                                            {processingMerchant === group.cleanName ? (
                                                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                            ) : (
                                                <>
                                                    <div 
                                                        className="border rounded-pill px-3 cursor-pointer transition-all d-inline-flex align-items-center justify-content-between small fw-bold bg-input text-muted border-secondary hover-bg-secondary"
                                                        style={{ width: '160px', height: '28px', userSelect: 'none' }}
                                                        onClick={() => setActiveDropdownId(activeDropdownId === group.cleanName ? null : group.cleanName)}
                                                    >
                                                        <span className="text-truncate" style={{ paddingBottom: '1px' }}>Select Category</span>
                                                        <i className="bi bi-chevron-down ms-2 opacity-50" style={{ fontSize: '0.65rem' }}></i>
                                                    </div>

                                                    {activeDropdownId === group.cleanName && (
                                                        <>
                                                            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                                            <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg p-1 mt-1 text-start" style={{ zIndex: 1060, width: '180px', maxHeight: '250px', overflowY: 'auto', right: '1.5rem' }}>
                                                                {categories.map(cat => (
                                                                    <div 
                                                                        key={cat.name} 
                                                                        className="px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all hover-bg-secondary d-flex align-items-center"
                                                                        style={{ color: 'var(--bs-body-color)' }}
                                                                        onClick={() => handleBulkAssign(group.cleanName, cat.name)}
                                                                    >
                                                                        <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', color: cat.color }}></i>
                                                                        {cat.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- BOTTOM GRID: CATEGORIES & RULES --- */}
            <div className="row g-4">
                
                {/* CATEGORIES MANAGEMENT */}
                <div className="col-12 col-xl-6">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">Manage Categories</h6>
                        </div>
                        <div className="card-body p-4 d-flex flex-column">
                            <form onSubmit={handleAddCategory} className="d-flex gap-2 mb-4">
                                <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-input border-secondary p-0 px-2">
                                        <input type="color" className="form-control form-control-color border-0 bg-transparent p-0 m-0 cursor-pointer" style={{ width: '24px', height: '24px' }} value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} title="Choose Category Color" />
                                    </span>
                                    <input type="text" className="form-control bg-input border-secondary text-main" placeholder="New Category Name..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required />
                                    <button type="submit" className="btn btn-primary fw-bold px-3">Add</button>
                                </div>
                            </form>
                            
                            <div className="d-flex flex-wrap gap-2 overflow-auto" style={{ maxHeight: '200px' }}>
                                {categories.map(cat => (
                                    <div key={cat.name} className="badge border text-main rounded-pill px-3 py-2 d-flex align-items-center shadow-sm" style={{ fontSize: '0.85rem', backgroundColor: `${cat.color}25`, borderColor: cat.color }}>
                                        <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', color: cat.color }}></i>
                                        {cat.name}
                                        {cat.name !== 'Exclude' && (
                                            <i className="bi bi-x-circle-fill ms-3 text-muted cursor-pointer hover-text-danger transition-all" onClick={() => handleRemoveCategory(cat.name)}></i>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SAVED RULES */}
                <div className="col-12 col-xl-6">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">Auto-Categorization Rules</h6>
                            <span className="badge bg-input border border-secondary text-muted rounded-pill">{Object.keys(rules).length} Active</span>
                        </div>
                        <div className="card-body p-0">
                            {Object.keys(rules).length === 0 ? (
                                <div className="text-center text-muted small p-4 fst-italic">Categorize a transaction above to create your first rule.</div>
                            ) : (
                                <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '280px' }}>
                                    {Object.entries(rules).sort(([a], [b]) => a.localeCompare(b)).map(([merchant, category]) => {
                                        const catData = categories.find(c => c.name === category);
                                        const catColor = catData ? catData.color : '#6c757d';
                                        
                                        return (
                                            <div key={merchant} className="list-group-item bg-transparent border-secondary py-3 px-4 d-flex justify-content-between align-items-center hover-bg-secondary transition-all">
                                                <div className="fw-bold text-main text-truncate pe-3" style={{ maxWidth: '60%' }}>{merchant}</div>
                                                <div className="d-flex align-items-center gap-3">
                                                    <span className="badge border rounded-pill px-3 py-1 fw-bold text-main" style={{ backgroundColor: `${catColor}25`, borderColor: catColor }}>
                                                        {category}
                                                    </span>
                                                    <button className="btn btn-sm btn-link text-danger p-0 opacity-50 hover-opacity-100 transition-all" onClick={() => handleRemoveRule(merchant)} title="Delete Rule">
                                                        <i className="bi bi-trash3-fill"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}