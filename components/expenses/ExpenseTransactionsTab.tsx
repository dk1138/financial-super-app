'use client';

import React, { useState, useMemo } from 'react';
import { Transaction, updateTransactionCategory, splitTransaction, updateTransactionTags, bulkAddTag, updateTransactionNote, updateTransactionWorkspace, bulkMoveToWorkspace } from '../../lib/expenseDb';
import { Category } from '../../app/expenses/page';

interface Props {
    transactions: Transaction[];
    categories: Category[];
    workspaces: string[];
    activeWorkspace: string;
    formatCurrency: (val: number) => string;
}

type SortKey = 'date' | 'account' | 'merchant' | 'category' | 'workspace' | 'amount';

export default function ExpenseTransactionsTab({ transactions, categories, workspaces, activeWorkspace, formatCurrency }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
    const [dropdownSearch, setDropdownSearch] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    const [txToSplit, setTxToSplit] = useState<Transaction | null>(null);
    const [splitItems, setSplitItems] = useState<{ amount: string; category: string; merchant: string }[]>([]);

    const [activeTagInputId, setActiveTagInputId] = useState<string | null>(null);
    const [bulkTagInputOpen, setBulkTagInputOpen] = useState(false);
    
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [tempNote, setTempNote] = useState('');

    const [bulkWorkspaceOpen, setBulkWorkspaceOpen] = useState(false);

    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return transactions;
        const lowerSearch = searchTerm.toLowerCase().replace('#', ''); 
        
        return transactions.filter(tx => 
            tx.merchant.toLowerCase().includes(lowerSearch) || 
            tx.category.toLowerCase().includes(lowerSearch) ||
            (tx.account && tx.account.toLowerCase().includes(lowerSearch)) ||
            (tx.suggestedCategory && tx.suggestedCategory.toLowerCase().includes(lowerSearch)) ||
            (tx.tags && tx.tags.some(tag => tag.toLowerCase().includes(lowerSearch))) ||
            (tx.notes && tx.notes.toLowerCase().includes(lowerSearch))
        );
    }, [transactions, searchTerm]);

    const sortedTransactions = useMemo(() => {
        let sortableItems = [...filteredTransactions];
        sortableItems.sort((a, b) => {
            let aValue: string | number = a[sortConfig.key] || '';
            let bValue: string | number = b[sortConfig.key] || '';
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

    const toggleSelectAll = () => {
        if (selectedIds.size === sortedTransactions.length && sortedTransactions.length > 0) setSelectedIds(new Set());
        else setSelectedIds(new Set(sortedTransactions.map(t => t.id)));
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const allOptions = useMemo(() => ['Uncategorized', ...categories.map(c => c.name)], [categories]);
    const filteredDropdownCategories = useMemo(() => {
        return allOptions.filter(c => c.toLowerCase().includes(dropdownSearch.toLowerCase()));
    }, [allOptions, dropdownSearch]);

    const openDropdown = (id: string) => {
        if (activeDropdownId === id) { setActiveDropdownId(null); } 
        else {
            setActiveDropdownId(id); setDropdownSearch(''); setHighlightedIndex(0); setBulkWorkspaceOpen(false); setBulkTagInputOpen(false);
            setTimeout(() => { const input = document.getElementById(`dropdown-search-${id}`); if (input) input.focus(); }, 10);
        }
    };

    const handleCategoryChange = async (id: string, newCategory: string) => {
        await updateTransactionCategory(id, newCategory);
        setActiveDropdownId(null); 
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleBulkCategoryChange = async (newCategory: string) => {
        await Promise.all(Array.from(selectedIds).map(id => updateTransactionCategory(id, newCategory)));
        setSelectedIds(new Set()); setActiveDropdownId(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleKeyDown = (e: React.KeyboardEvent, targetId: string) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightedIndex(prev => Math.min(prev + 1, filteredDropdownCategories.length - 1)); } 
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightedIndex(prev => Math.max(prev - 1, 0)); } 
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredDropdownCategories[highlightedIndex]) {
                const chosenCat = filteredDropdownCategories[highlightedIndex];
                if (targetId === 'bulk') handleBulkCategoryChange(chosenCat);
                else handleCategoryChange(targetId, chosenCat);
            }
        } 
        else if (e.key === 'Escape') setActiveDropdownId(null);
    };

    const renderFuzzyMenu = (targetId: string, currentCategory?: string) => (
        <div className="p-2 text-start">
            <input id={`dropdown-search-${targetId}`} type="text" className="form-control form-control-sm bg-body border-secondary text-main mb-2 rounded-2 shadow-none" placeholder="Search categories..." value={dropdownSearch} onChange={(e) => { setDropdownSearch(e.target.value); setHighlightedIndex(0); }} onKeyDown={(e) => handleKeyDown(e, targetId)} autoComplete="off" />
            <div className="hide-scrollbar" style={{ maxHeight: '180px', overflowY: 'auto' }}>
                {filteredDropdownCategories.length === 0 ? <div className="text-muted small text-center py-2 fst-italic">No matches</div> : (
                    filteredDropdownCategories.map((catName, idx) => {
                        const catObj = categories.find(c => c.name === catName);
                        const color = catObj ? catObj.color : '#6c757d';
                        const isSelected = currentCategory === catName;
                        return (
                            <div key={catName} className={`px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all d-flex align-items-center ${idx === highlightedIndex ? 'bg-secondary bg-opacity-25 text-main' : 'text-muted'} ${isSelected ? 'text-primary bg-primary bg-opacity-10' : ''}`} onClick={() => targetId === 'bulk' ? handleBulkCategoryChange(catName) : handleCategoryChange(targetId, catName)} onMouseEnter={() => setHighlightedIndex(idx)}>
                                <i className="bi bi-circle-fill me-2" style={{ fontSize: '0.5rem', color: catName === 'Uncategorized' ? 'transparent' : color }}></i>
                                {catName}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );

    const handleAddTag = async (id: string, newTag: string) => {
        const cleanTag = newTag.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
        if (!cleanTag) { setActiveTagInputId(null); return; }
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;
        const currentTags = tx.tags || [];
        if (currentTags.includes(cleanTag)) { setActiveTagInputId(null); return; }
        await updateTransactionTags(id, [...currentTags, cleanTag]);
        setActiveTagInputId(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleRemoveTag = async (id: string, tagToRemove: string) => {
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;
        await updateTransactionTags(id, (tx.tags || []).filter(t => t !== tagToRemove));
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleBulkAddTag = async (tag: string) => {
        const cleanTag = tag.trim().toLowerCase().replace(/[^a-z0-9\-_]/g, '');
        if (!cleanTag) return;
        await bulkAddTag(Array.from(selectedIds), cleanTag);
        setBulkTagInputOpen(false); setSelectedIds(new Set());
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const openNoteEditor = (tx: Transaction) => {
        if (activeNoteId === tx.id) setActiveNoteId(null);
        else { setActiveNoteId(tx.id); setTempNote(tx.notes || ''); }
    };

    const handleSaveNote = async (id: string) => {
        await updateTransactionNote(id, tempNote.trim());
        setActiveNoteId(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleWorkspaceToggle = async (id: string, currentWorkspace?: string) => {
        const newWorkspace = currentWorkspace === 'Konbinii Shop' ? 'Personal' : 'Konbinii Shop';
        await updateTransactionWorkspace(id, newWorkspace);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const handleBulkWorkspaceChange = async (newWorkspace: string) => {
        await bulkMoveToWorkspace(Array.from(selectedIds), newWorkspace);
        setBulkWorkspaceOpen(false); setSelectedIds(new Set());
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    const openSplitModal = (tx: Transaction) => {
        setTxToSplit(tx);
        setSplitItems([{ amount: Math.abs(tx.amount).toString(), category: 'Uncategorized', merchant: tx.merchant }, { amount: '0', category: 'Uncategorized', merchant: tx.merchant }]);
    };

    const handleAddSplitRow = () => { if (txToSplit) setSplitItems([...splitItems, { amount: '0', category: 'Uncategorized', merchant: txToSplit.merchant }]); };

    const handleExecuteSplit = async () => {
        if (!txToSplit) return;
        const totalSplit = splitItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
        if (Math.abs(totalSplit - Math.abs(txToSplit.amount)) > 0.01) { alert(`The splits must exactly equal the original amount of ${formatCurrency(Math.abs(txToSplit.amount))}.`); return; }
        const validSplits = splitItems.map(item => ({ amount: parseFloat(item.amount) || 0, category: item.category, merchant: item.merchant })).filter(s => s.amount > 0);
        await splitTransaction(txToSplit.id, validSplits);
        setTxToSplit(null);
        window.dispatchEvent(new CustomEvent('expensesUpdated'));
    };

    return (
        <div className="fade-in position-relative">
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Ledger</h6>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-input border-secondary text-muted"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control bg-input border-secondary text-main" placeholder="Search, #tag, note..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="table table-hover table-borderless align-middle mb-0">
                        <thead className="border-bottom border-secondary position-sticky top-0 bg-input shadow-sm" style={{ zIndex: 10 }}>
                            <tr>
                                <th className="ps-4 py-3" style={{ width: '1%' }}>
                                    <input type="checkbox" className="form-check-input cursor-pointer shadow-none border-secondary" checked={selectedIds.size === sortedTransactions.length && sortedTransactions.length > 0} onChange={toggleSelectAll} title="Select All" />
                                </th>
                                <th className="text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('date')}>
                                    <div className="d-flex align-items-center">Date {renderSortIcon('date')}</div>
                                </th>
                                <th className="text-muted small fw-bold py-3 d-none d-lg-table-cell cursor-pointer hover-text-main transition-all" onClick={() => handleSort('account')}>
                                    <div className="d-flex align-items-center">Account {renderSortIcon('account')}</div>
                                </th>
                                <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('merchant')}>
                                    <div className="d-flex align-items-center">Merchant {renderSortIcon('merchant')}</div>
                                </th>
                                <th className="text-muted small fw-bold py-3 cursor-pointer hover-text-main transition-all" onClick={() => handleSort('category')}>
                                    <div className="d-flex align-items-center">Category {renderSortIcon('category')}</div>
                                </th>
                                <th className="text-muted small fw-bold py-3 text-center cursor-pointer hover-text-main transition-all" onClick={() => handleSort('workspace')}>
                                    <div className="d-flex align-items-center justify-content-center">Workspace {renderSortIcon('workspace')}</div>
                                </th>
                                <th className="text-end pe-4 text-muted small fw-bold py-3 text-nowrap cursor-pointer hover-text-main transition-all" style={{ width: '1%' }} onClick={() => handleSort('amount')}>
                                    <div className="d-flex align-items-center justify-content-end">Amount {renderSortIcon('amount')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedTransactions.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-5 text-muted fst-italic">No transactions match your search.</td></tr>
                            ) : (
                                sortedTransactions.slice(0, 150).map((tx) => {
                                    const isUncat = tx.category === 'Uncategorized';
                                    const catData = categories.find(c => c.name === tx.category);
                                    const baseColor = catData ? catData.color : '#6c757d';
                                    const bgColor = isUncat ? 'var(--bs-secondary-bg-subtle)' : `${baseColor}25`;
                                    const isRowSelected = selectedIds.has(tx.id);

                                    return (
                                        <React.Fragment key={tx.id}>
                                            <tr className={`transition-all ${isRowSelected ? 'bg-primary bg-opacity-10' : ''} ${activeNoteId === tx.id ? 'border-bottom-0' : 'border-bottom border-secondary border-opacity-25'}`}>
                                                
                                                <td className="ps-4 py-3">
                                                    <input type="checkbox" className="form-check-input cursor-pointer shadow-none border-secondary" checked={isRowSelected} onChange={() => toggleSelection(tx.id)} />
                                                </td>
                                                
                                                <td className="py-3 text-nowrap">
                                                    <span className="text-muted small fw-bold">{tx.dateString}</span>
                                                </td>

                                                <td className="py-3 d-none d-lg-table-cell">
                                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary fw-normal">
                                                        <i className="bi bi-credit-card me-1"></i>{tx.account}
                                                    </span>
                                                </td>
                                                
                                                <td className="py-3">
                                                    <div className="fw-bold text-main">{tx.merchant}</div>
                                                    
                                                    {tx.notes && (
                                                        <div className="w-100 mt-1 d-flex">
                                                            <div className="text-muted small fst-italic text-truncate cursor-pointer hover-text-main transition-all" style={{ fontSize: '0.75rem', maxWidth: '250px' }} onClick={() => openNoteEditor(tx)} title={tx.notes}>
                                                                <i className="bi bi-sticky-fill opacity-50 me-1"></i>{tx.notes}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="d-flex flex-wrap gap-1 mt-1 align-items-center">
                                                        {isUncat && tx.suggestedCategory && (
                                                            <div className="badge bg-success bg-opacity-10 text-success border border-success cursor-pointer hover-bg-success hover-text-white transition-all py-1" onClick={() => handleCategoryChange(tx.id, tx.suggestedCategory!)} title="Click to approve suggestion">
                                                                <i className="bi bi-stars me-1"></i> {tx.suggestedCategory}
                                                            </div>
                                                        )}

                                                        {(tx.tags || []).map(tag => (
                                                            <span key={tag} className="badge bg-info bg-opacity-10 text-info border border-info rounded-pill d-inline-flex align-items-center py-1 px-2 transition-all hover-bg-info hover-text-body" style={{ fontSize: '0.7rem' }}>
                                                                #{tag} <i className="bi bi-x ms-1 cursor-pointer opacity-75" onClick={(e) => { e.stopPropagation(); handleRemoveTag(tx.id, tag); }} style={{ fontSize: '0.8rem' }}></i>
                                                            </span>
                                                        ))}
                                                        
                                                        {activeTagInputId === tx.id ? (
                                                            <input type="text" autoFocus className="form-control form-control-sm bg-input border-info text-info rounded-pill px-2 py-0 shadow-none" style={{ width: '90px', fontSize: '0.7rem', height: '22px' }} placeholder="tag..." onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(tx.id, e.currentTarget.value); else if (e.key === 'Escape') setActiveTagInputId(null); }} onBlur={() => setActiveTagInputId(null)} />
                                                        ) : (
                                                            <span className="badge bg-input border border-secondary text-muted rounded-pill cursor-pointer hover-bg-secondary transition-all d-inline-flex align-items-center py-1 px-2" style={{ fontSize: '0.7rem' }} onClick={(e) => { e.stopPropagation(); setActiveTagInputId(tx.id); }}>
                                                                <i className="bi bi-plus"></i> Tag
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                
                                                <td className="py-3 position-relative">
                                                    <div className={`border rounded-pill px-3 cursor-pointer transition-all d-inline-flex align-items-center justify-content-between small fw-bold ${isUncat ? 'text-secondary border-secondary' : 'border-transparent'}`} style={{ width: '140px', height: '28px', userSelect: 'none', backgroundColor: bgColor, color: isUncat ? '' : baseColor, borderColor: isUncat ? '' : baseColor }} onClick={() => openDropdown(tx.id)}>
                                                        <span className="text-truncate" style={{ paddingBottom: '1px' }}>{tx.category}</span>
                                                        <i className="bi bi-chevron-down ms-2 opacity-50" style={{ fontSize: '0.65rem' }}></i>
                                                    </div>
                                                    {activeDropdownId === tx.id && (
                                                        <>
                                                            <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                                            <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mt-1" style={{ zIndex: 1060, width: '220px', left: 0 }}>{renderFuzzyMenu(tx.id, tx.category)}</div>
                                                        </>
                                                    )}
                                                </td>

                                                {/* ROW-LEVEL WORKSPACE TOGGLE */}
                                                <td className="py-3 text-center">
                                                    <div 
                                                        className={`badge border cursor-pointer transition-all px-3 py-2 ${tx.workspace === 'Konbinii Shop' ? 'bg-warning bg-opacity-10 text-warning border-warning hover-bg-warning hover-text-dark' : 'bg-secondary bg-opacity-10 text-secondary border-secondary hover-bg-secondary hover-text-white'}`}
                                                        onClick={() => handleWorkspaceToggle(tx.id, tx.workspace)}
                                                        title="Click to swap workspace"
                                                        style={{width: '110px'}}
                                                    >
                                                        {tx.workspace === 'Konbinii Shop' ? '💼 Konbinii' : '🏠 Personal'}
                                                    </div>
                                                </td>
                                                
                                                <td className="text-end pe-4 py-3 text-nowrap">
                                                    <div className="d-flex align-items-center justify-content-end gap-2">
                                                        <span className={`fw-bold ${tx.amount > 0 ? 'text-success' : 'text-main'}`}>
                                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                                        </span>
                                                        <button className={`btn btn-sm btn-link p-0 hover-text-primary transition-all ${tx.notes || activeNoteId === tx.id ? 'text-primary' : 'text-muted'}`} onClick={() => openNoteEditor(tx)} title="Edit Note">
                                                            <i className={`bi ${tx.notes || activeNoteId === tx.id ? 'bi-sticky-fill' : 'bi-sticky'} fs-6`}></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-link p-0 text-muted hover-text-primary transition-all ms-1" onClick={() => openSplitModal(tx)} title="Split Transaction">
                                                            <i className="bi bi-scissors fs-6"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {activeNoteId === tx.id && (
                                                <tr className={`bg-secondary bg-opacity-10 border-bottom border-secondary border-opacity-50 ${isRowSelected ? 'bg-primary bg-opacity-10' : ''}`}>
                                                    <td colSpan={7} className="py-3 px-4 shadow-inner">
                                                        <div className="d-flex align-items-start gap-3 fade-in">
                                                            <i className="bi bi-arrow-return-right text-muted mt-2 opacity-50 fs-5 ps-2"></i>
                                                            <textarea className="form-control bg-body border-secondary text-main flex-grow-1 shadow-sm rounded-3 p-3" rows={2} placeholder="Add warranty info, a reminder, or items purchased..." value={tempNote} onChange={(e) => setTempNote(e.target.value)} autoFocus></textarea>
                                                            <div className="d-flex flex-column gap-2">
                                                                <button className="btn btn-sm btn-primary fw-bold shadow-sm" onClick={() => handleSaveNote(tx.id)}>Save Note</button>
                                                                <button className="btn btn-sm btn-outline-secondary bg-input shadow-sm" onClick={() => setActiveNoteId(null)}>Cancel</button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                    {sortedTransactions.length > 150 && <div className="text-center p-3 text-muted small bg-input border-top border-secondary">Showing first 150 results. Use the search bar to find older transactions.</div>}
                </div>
            </div>

            {/* --- FLOATING BULK ACTION BAR --- */}
            {selectedIds.size > 0 && (
                <div className="position-fixed bottom-0 start-50 translate-middle-x mb-4 px-4 py-3 surface-card border border-secondary shadow-lg rounded-pill d-flex align-items-center gap-3 fade-in" style={{ zIndex: 1100, animation: 'slideUp 0.3s ease-out forwards' }}>
                    <span className="badge bg-primary rounded-pill px-3 py-2 shadow-sm fs-6">{selectedIds.size} Selected</span>
                    <span className="text-muted small fw-bold d-none d-md-block border-end border-secondary pe-3 me-1">Bulk Actions:</span>
                    
                    <div className="position-relative">
                        <button className="btn btn-sm btn-outline-secondary bg-input text-main fw-bold rounded-pill px-3 shadow-sm border-secondary" onClick={() => {openDropdown('bulk'); setBulkTagInputOpen(false); setBulkWorkspaceOpen(false);}}>
                            Set Category <i className="bi bi-chevron-up ms-1"></i>
                        </button>
                        {activeDropdownId === 'bulk' && (
                            <>
                                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setActiveDropdownId(null)}></div>
                                <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mb-2 bottom-100 start-0" style={{ zIndex: 1060, width: '220px' }}>{renderFuzzyMenu('bulk')}</div>
                            </>
                        )}
                    </div>

                    <div className="position-relative">
                        <button className="btn btn-sm btn-outline-info bg-input text-info fw-bold rounded-pill px-3 shadow-sm border-info" onClick={() => {setBulkTagInputOpen(!bulkTagInputOpen); setActiveDropdownId(null); setBulkWorkspaceOpen(false);}}>
                            <i className="bi bi-tag-fill me-1"></i> Add Tag
                        </button>
                        {bulkTagInputOpen && (
                            <>
                                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setBulkTagInputOpen(false)}></div>
                                <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mb-2 bottom-100 start-50 translate-middle-x p-2" style={{ zIndex: 1060, width: '200px' }}>
                                    <input type="text" autoFocus className="form-control form-control-sm bg-body border-info text-info mb-1 shadow-none" placeholder="Type tag & press Enter..." onKeyDown={(e) => { if (e.key === 'Enter') handleBulkAddTag(e.currentTarget.value); else if (e.key === 'Escape') setBulkTagInputOpen(false); }} />
                                    <div className="text-muted text-center" style={{fontSize: '0.65rem'}}>Press Enter to apply to all</div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="position-relative">
                        <button className="btn btn-sm btn-outline-warning bg-input text-warning fw-bold rounded-pill px-3 shadow-sm border-warning" onClick={() => {setBulkWorkspaceOpen(!bulkWorkspaceOpen); setActiveDropdownId(null); setBulkTagInputOpen(false);}}>
                            <i className="bi bi-briefcase-fill me-1"></i> Move
                        </button>
                        {bulkWorkspaceOpen && (
                            <>
                                <div className="position-fixed top-0 start-0 w-100 h-100" style={{ zIndex: 1050 }} onClick={() => setBulkWorkspaceOpen(false)}></div>
                                <div className="position-absolute bg-input border border-secondary rounded-3 shadow-lg mb-2 bottom-100 start-50 translate-middle-x py-1" style={{ zIndex: 1060, width: '180px' }}>
                                    {workspaces.map(w => (
                                        <div key={w} className="px-3 py-2 small fw-bold rounded-2 cursor-pointer transition-all hover-bg-secondary text-main text-start" onClick={() => handleBulkWorkspaceChange(w)}>
                                            {w === 'Personal' ? '🏠 ' : '💼 '} {w}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <button className="btn btn-sm btn-link text-muted ms-1 p-0 text-decoration-none fw-bold hover-text-danger transition-all" onClick={() => setSelectedIds(new Set())}>Cancel</button>
                </div>
            )}

            {/* --- SPLIT TRANSACTION MODAL --- */}
            {txToSplit && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1200 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setTxToSplit(null)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-lg position-relative">
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3 bg-input">
                                <div>
                                    <h6 className="modal-title fw-bold d-flex align-items-center"><i className="bi bi-scissors text-primary me-2"></i> Split Transaction</h6>
                                    <div className="text-muted small mt-1">{txToSplit.merchant} • {txToSplit.dateString}</div>
                                </div>
                                <button type="button" className="btn-close" onClick={() => setTxToSplit(null)}></button>
                            </div>
                            
                            <div className="modal-body p-4">
                                <div className="d-flex justify-content-between align-items-center mb-4 bg-primary bg-opacity-10 border border-primary rounded-3 p-3">
                                    <span className="fw-bold text-primary">Original Amount:</span>
                                    <h4 className="fw-bold text-primary mb-0">{formatCurrency(Math.abs(txToSplit.amount))}</h4>
                                </div>

                                <div className="d-flex flex-column gap-3 mb-4">
                                    {splitItems.map((item, idx) => (
                                        <div key={idx} className="d-flex gap-2 align-items-center">
                                            <div className="input-group input-group-sm w-25">
                                                <span className="input-group-text bg-input border-secondary">$</span>
                                                <input type="number" className="form-control bg-body border-secondary fw-bold text-main" value={item.amount} onChange={(e) => { const newSplits = [...splitItems]; newSplits[idx].amount = e.target.value; setSplitItems(newSplits); }} />
                                            </div>
                                            <select className="form-select form-select-sm bg-body border-secondary text-main w-25 fw-bold" value={item.category} onChange={(e) => { const newSplits = [...splitItems]; newSplits[idx].category = e.target.value; setSplitItems(newSplits); }}>
                                                <option value="Uncategorized">Uncategorized</option>
                                                {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <input type="text" className="form-control form-control-sm bg-body border-secondary text-main flex-grow-1" placeholder="Custom Note / Merchant" value={item.merchant} onChange={(e) => { const newSplits = [...splitItems]; newSplits[idx].merchant = e.target.value; setSplitItems(newSplits); }} />
                                            {splitItems.length > 2 && <button className="btn btn-sm btn-outline-danger border-0" onClick={() => setSplitItems(splitItems.filter((_, i) => i !== idx))}><i className="bi bi-x-lg"></i></button>}
                                        </div>
                                    ))}
                                </div>
                                <button className="btn btn-sm btn-outline-secondary rounded-pill fw-bold border-dashed w-100 py-2 text-muted" onClick={handleAddSplitRow}><i className="bi bi-plus-circle-fill me-2"></i> Add Another Split</button>
                            </div>
                            
                            <div className="modal-footer border-top border-secondary p-3 bg-input d-flex justify-content-between align-items-center">
                                <div className="small fw-bold">
                                    Current Total: <span className={Math.abs(splitItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0) - Math.abs(txToSplit.amount)) < 0.01 ? 'text-success' : 'text-danger'}>
                                        {formatCurrency(splitItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0))}
                                    </span>
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary fw-bold rounded-pill" onClick={() => setTxToSplit(null)}>Cancel</button>
                                    <button className="btn btn-primary fw-bold rounded-pill" onClick={handleExecuteSplit}>Save Splits</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }`}</style>
        </div>
    );
}