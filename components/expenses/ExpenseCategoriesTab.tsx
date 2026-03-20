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
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'cleanName', direction: 'asc' });
    const [selectedCleanNames, setSelectedCleanNames] = useState<Set<string>>(new Set());
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const [newCatName, setNewCatName] = useState('');
    const [newCatColor, setNewCatColor] = useState('#0d6efd');

    const merchantGroups = useMemo(() => {
        const groups: Record<string, { count: number; totalAmount: number; rawNames: Set<string>; suggestedCategory?: string }> = {};
        
        uncategorizedTransactions.forEach(tx => {
            const cleanName = normalizeMerchantName(tx.merchant);
            if (!groups[cleanName]) groups[cleanName] = { count: 0, totalAmount: 0, rawNames: new Set(), suggestedCategory: tx.suggestedCategory };
            groups[cleanName].count += 1;
            groups[cleanName].totalAmount += tx.amount;
            groups[cleanName].rawNames.add(tx.merchant);
            if (!groups[cleanName].suggestedCategory && tx.suggestedCategory) groups[cleanName].suggestedCategory = tx.suggestedCategory;
        });

        const sortableGroups = Object.entries(groups).map(([cleanName, data]) => ({ 
            cleanName, 
            count: data.count, 
            totalAmount: data.totalAmount,
            suggestedCategory: data.suggestedCategory,
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

    const toggleSelectAll = () => {
        if (selectedCleanNames.size === merchantGroups.length && merchantGroups.length > 0) setSelectedCleanNames(new Set());
        else setSelectedCleanNames(new Set(merchantGroups.map(g => g.cleanName)));
    };

    const toggleSelection = (cleanName: string) => {
        const newSet = new Set(selectedCleanNames);
        if (newSet.has(cleanName)) newSet.delete(cleanName);
        else newSet.add(cleanName);
        setSelectedCleanNames(newSet);
    };

    const allOptions = useMemo(() => categories.map(c => c.name), [categories]);
    const filteredDropdownCategories = useMemo(() => {
        return allOptions.filter(c => c.toLowerCase().includes(dropdownSearch.toLowerCase()));
    }, [allOptions, dropdownSearch]);

    const openDropdown = (id: string) => {
        if (activeDropdownId === id) { setActiveDropdownId(null); } 
        else {
            setActiveDropdownId(id); setDropdownSearch(''); setHighlightedIndex(0);
            setTimeout(() => { const input = document.getElementById(`dropdown-search-${id}`); if (input) input.focus(); }, 10);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, targetId: string) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => Math.min(prev + 1, filteredDropdownCategories.length - 1)); } 
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredDropdownCategories[highlightedIndex]) {
                const chosenCat = filteredDropdownCategories[highlightedIndex];
                if (targetId === 'bulk') handleMultiBulkAssign(chosenCat);
                else handleSingleAssign(targetId, chosenCat);
            }
        } 
        else if (e.key === 'Escape') setActiveDropdownId(null);
    };

    const handleSingleAssign = async (cleanName: string, newCategory: string) => {
        const newRules = { ...rules, [cleanName]: newCategory };
        updateRules(newRules);
        await updateCategoryByNormalizedMerchant(cleanName, newCategory);
        setActiveDropdownId(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleMultiBulkAssign = async (newCategory: string) => {
        const newRules = { ...rules };
        const promises = [];
        for (const cleanName of Array.from(selectedCleanNames)) {
            newRules[cleanName] = newCategory;
            promises.push(updateCategoryByNormalizedMerchant(cleanName, newCategory));
        }
        updateRules(newRules);
        await Promise.all(promises);
        setSelectedCleanNames(new Set());
        setActiveDropdownId(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const renderFuzzyMenu = (targetId: string) => (
        <div className="p-2 text-start">
            <input id={`dropdown-search-${targetId}`} type="text" className="form-control form-control-sm bg-body border-secondary text-main mb-2 rounded-2 shadow-none" placeholder="Search categories..." value={dropdownSearch} onChange={(e) => { setDropdownSearch(e.target.value); setHighlightedIndex(0); }} onKeyDown={(e) => handleKeyDown(e, targetId)} autoComplete="off" />
            <div className="hide-scrollbar" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filteredDropdownCategories.length === 0 ? <div className="text-muted small text-center py-2 fst-italic">No matches</div> : (
                    filteredDropdownCategories.map((catName, idx) => {
                        const catObj = categories.find(c => c.name === catName);
                        const color = catObj ? catObj.color : '#6c757d';
                        return (
                            <div key={catName} className={`px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all d-flex align-items-center ${idx === highlightedIndex ? 'bg-secondary bg-opacity-25 text-main' : 'text-muted'}`} onClick={() => targetId === 'bulk' ? handleMultiBulkAssign(catName) : handleSingleAssign(targetId, catName)} onMouseEnter={() => setHighlightedIndex(idx)}>
                                <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', color: color }}></i>
                                {catName}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = newCatName.trim();
        if (!cleanName) return;
        if (categories.some(c => c.name.toLowerCase() === cleanName.toLowerCase())) { alert("A category with this name already exists."); return; }
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

    // --- NEW BUDGET UPDATER ---
    const handleUpdateBudget = (name: string, budgetStr: string) => {
        const val = parseFloat(budgetStr);
        const newCats = categories.map(c => c.name === name ? { ...c, budget: isNaN(val) ? undefined : val } : c);
        updateCategories(newCats);
    };

    return (
        <div className="fade-in d-flex flex-column gap-4 position-relative pb-5">
            
            {/* INBOX */}
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h6 className="fw-bold mb-1">Needs Categorization</h6>
                        <p className="text-muted small mb-0">Assign a category below to instantly update past transactions AND create an auto-rule for the future.</p>
                    </div>
                    {merchantGroups.length > 0 && (
                        <div className="badge bg-warning text-dark px-3 py-2 rounded-pill shadow-sm">
                            {merchantGroups.length} Groups Pending
                        </div>
                    )}
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
                                    <th className="ps-4 py-3" style={{ width: '1%' }}><input type="checkbox" className="form-check-input cursor-pointer shadow-none border-secondary" checked={selectedCleanNames.size === merchantGroups.length && merchantGroups.length > 0} onChange={toggleSelectAll} title="Select All" /></th>
                                    <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('cleanName')}><div className="d-flex align-items-center">Merchant Group {renderSortIcon('cleanName')}</div></th>
                                    <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all text-center" style={{ width: '15%' }} onClick={() => handleSort('count')}><div className="d-flex align-items-center justify-content-center">Transactions {renderSortIcon('count')}</div></th>
                                    <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all text-end" style={{ width: '15%' }} onClick={() => handleSort('totalAmount')}><div className="d-flex align-items-center justify-content-end">Total Value {renderSortIcon('totalAmount')}</div></th>
                                    <th className="pe-4 text-muted small fw-bold py-3 text-end" style={{ width: '25%' }}>Assign Rule</th>
                                </tr>
                            </thead>
                            <tbody>
                                {merchantGroups.map((group) => {
                                    const isRowSelected = selectedCleanNames.has(group.cleanName);
                                    return (
                                        <tr key={group.cleanName} className={`transition-all ${isRowSelected ? 'bg-primary bg-opacity-10' : ''}`}>
                                            <td className="ps-4 py-3"><input type="checkbox" className="form-check-input cursor-pointer shadow-none border-secondary" checked={isRowSelected} onChange={() => toggleSelection(group.cleanName)} /></td>
                                            <td className="py-3">
                                                <div className="fw-bold text-main">{group.cleanName}</div>
                                                {group.suggestedCategory ? (
                                                    <div className="d-inline-flex align-items-center mt-1 badge bg-success bg-opacity-10 text-success border border-success cursor-pointer hover-bg-success hover-text-white transition-all" onClick={() => handleSingleAssign(group.cleanName, group.suggestedCategory!)} title="Click to approve suggestion">
                                                        <i className="bi bi-stars me-1"></i> {group.suggestedCategory}
                                                        <i className="bi bi-check-circle-fill ms-2"></i>
                                                    </div>
                                                ) : (
                                                    <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }} title={group.bundledNames}>
                                                        Includes: <span className="fst-italic">{group.bundledNames}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 text-center"><span className="badge bg-secondary bg-opacity-25 text-secondary rounded-pill px-3">{group.count}</span></td>
                                            <td className={`py-3 text-end fw-bold ${group.totalAmount > 0 ? 'text-success' : 'text-main'}`}>{formatCurrency(group.totalAmount)}</td>
                                            <td className="pe-4 py-3 text-end position-relative">
                                                <div className="border rounded-pill px-3 cursor-pointer transition-all d-inline-flex align-items-center justify-content-between small fw-bold bg-input text-muted border-secondary hover-bg-secondary" style={{ width: '160px', height: '28px', userSelect: 'none' }} onClick={() => openDropdown(group.cleanName)}>
                                                    <span className="text-truncate" style={{ paddingBottom: '1px' }}>Select Category</span>
                                                    <i className="bi bi-chevron-down ms-2 opacity-50" style={{ fontSize: '0.65rem' }}></i>
                                                </div>
                                                {activeDropdownId === group.cleanName && (
                                                    <>
                                                        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                                        <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mt-1" style={{ zIndex: 1060, width: '220px', right: '1.5rem' }}>{renderFuzzyMenu(group.cleanName)}</div>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* --- BOTTOM GRID: BUDGETS & RULES --- */}
            <div className="row g-4 pb-5">
                
                {/* NEW BUDGET TABLE */}
                <div className="col-12 col-xl-7">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4">
                            <h6 className="fw-bold mb-0"><i className="bi bi-tags-fill text-primary me-2"></i>Categories & Budgets</h6>
                            <div className="text-muted small mt-1">Set monthly limits to track pacing on your dashboard.</div>
                        </div>
                        <div className="card-body p-0 d-flex flex-column h-100">
                            <div className="table-responsive flex-grow-1" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                <table className="table table-hover table-borderless align-middle mb-0">
                                    <thead className="bg-input position-sticky top-0 shadow-sm" style={{zIndex: 5}}>
                                        <tr>
                                            <th className="ps-4 py-2 text-muted small">Category</th>
                                            <th className="py-2 text-muted small text-center">Monthly Target</th>
                                            <th className="pe-4 py-2 text-end text-muted small">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categories.map(cat => (
                                            <tr key={cat.name} className="border-bottom border-secondary border-opacity-25">
                                                <td className="ps-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <input type="color" className="form-control form-control-color form-control-sm p-0 border-0 me-3 rounded-circle shadow-sm" style={{ width: '24px', height: '24px' }} value={cat.color} onChange={(e) => {
                                                            updateCategories(categories.map(c => c.name === cat.name ? { ...c, color: e.target.value } : c));
                                                        }} title="Change Color" />
                                                        <span className="fw-bold text-main">{cat.name}</span>
                                                    </div>
                                                </td>
                                                
                                                <td className="py-3 text-center">
                                                    {['Income', 'Exclude'].includes(cat.name) ? (
                                                        <span className="text-muted small fst-italic">—</span>
                                                    ) : (
                                                        <div className="input-group input-group-sm mx-auto shadow-sm" style={{ maxWidth: '140px' }}>
                                                            <span className="input-group-text bg-input border-secondary text-muted">$</span>
                                                            <input 
                                                                type="number" 
                                                                className="form-control bg-body border-secondary text-main fw-bold" 
                                                                placeholder="No Limit" 
                                                                value={cat.budget || ''} 
                                                                onChange={(e) => handleUpdateBudget(cat.name, e.target.value)}
                                                            />
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="text-end pe-4 py-3">
                                                    {!['Income', 'Exclude', 'Housing', 'Grocery'].includes(cat.name) && (
                                                        <button className="btn btn-sm btn-link text-danger p-0 opacity-50 hover-opacity-100 transition-all" onClick={() => handleRemoveCategory(cat.name)} title="Delete Category"><i className="bi bi-trash3-fill"></i></button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="p-3 border-top border-secondary bg-input">
                                <form onSubmit={handleAddCategory} className="d-flex gap-2">
                                    <input type="color" className="form-control form-control-color p-0 border-secondary rounded-3 shadow-sm" style={{ width: '38px', height: '38px' }} value={newCatColor} onChange={(e) => setNewCatColor(e.target.value)} title="Choose Color" />
                                    <input type="text" className="form-control bg-body border-secondary text-main shadow-sm" placeholder="New Category Name..." value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                                    <button type="submit" className="btn btn-primary fw-bold shadow-sm px-4">Add</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RULES TAB */}
                <div className="col-12 col-xl-5">
                    <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0"><i className="bi bi-robot text-info me-2"></i>Auto Rules</h6>
                            <span className="badge bg-input border border-secondary text-muted rounded-pill">{Object.keys(rules).length} Active</span>
                        </div>
                        <div className="card-body p-0">
                            {Object.keys(rules).length === 0 ? (
                                <div className="text-center text-muted small p-4 fst-italic">Categorize a transaction above to create your first rule.</div>
                            ) : (
                                <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '400px' }}>
                                    {Object.entries(rules).sort(([a], [b]) => a.localeCompare(b)).map(([merchant, category]) => {
                                        const catData = categories.find(c => c.name === category);
                                        const catColor = catData ? catData.color : '#6c757d';
                                        return (
                                            <div key={merchant} className="list-group-item bg-transparent border-secondary py-3 px-4 d-flex justify-content-between align-items-center hover-bg-secondary transition-all">
                                                <div className="fw-bold text-main text-truncate pe-3" style={{ maxWidth: '60%' }}>{merchant}</div>
                                                <div className="d-flex align-items-center gap-3">
                                                    <span className="badge border rounded-pill px-3 py-1 fw-bold text-main" style={{ backgroundColor: `${catColor}25`, borderColor: catColor }}>{category}</span>
                                                    <button className="btn btn-sm btn-link text-danger p-0 opacity-50 hover-opacity-100 transition-all" onClick={() => handleRemoveRule(merchant)} title="Delete Rule"><i className="bi bi-trash3-fill"></i></button>
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

            {selectedCleanNames.size > 0 && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-3 surface-card border border-secondary shadow-lg rounded-pill d-flex align-items-center gap-3 fade-in" style={{ zIndex: 1100, animation: 'slideUp 0.3s ease-out forwards' }}>
                    <span className="badge bg-primary rounded-pill px-3 py-2 shadow-sm fs-6">{selectedCleanNames.size} Selected</span>
                    <span className="text-muted small fw-bold d-none d-sm-block">Assign to:</span>
                    <div className="position-relative">
                        <button className="btn btn-sm btn-outline-secondary bg-input text-main fw-bold rounded-pill px-4 shadow-sm border-secondary" onClick={() => openDropdown('bulk')}>Select Category <i className="bi bi-chevron-up ms-2"></i></button>
                        {activeDropdownId === 'bulk' && (
                            <>
                                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mb-2 bottom-100 start-50 translate-middle-x" style={{ zIndex: 1060, width: '220px' }}>{renderFuzzyMenu('bulk')}</div>
                            </>
                        )}
                    </div>
                    <button className="btn btn-sm btn-link text-muted ms-1 p-0 text-decoration-none fw-bold hover-text-danger transition-all" onClick={() => setSelectedCleanNames(new Set())}>Cancel</button>
                </div>
            )}
            <style>{`@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
        </div>
    );
}