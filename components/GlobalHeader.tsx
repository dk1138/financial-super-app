'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import Papa from 'papaparse';
import { useFinance } from '../lib/FinanceContext';
import { initDB, saveTransactions, clearTransactions } from '../lib/expenseDb';

export default function GlobalHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const financeContext = useFinance() as any;
    const { data, updateUseRealDollars, resetData } = financeContext;

    // --- REFS ---
    const headerRef = useRef<HTMLDivElement>(null);
    const plannerFileInputRef = useRef<HTMLInputElement>(null);
    const expenseFileInputRef = useRef<HTMLInputElement>(null);

    // --- GENERAL STATE ---
    const [theme, setTheme] = useState('dark');
    const [toastMsg, setToastMsg] = useState('');
    const activeModule = pathname.includes('/expenses') ? 'expenses' : 'planner';

    // --- PLANNER FILE MANAGEMENT STATE ---
    const [fileMenuOpen, setFileMenuOpen] = useState(false);
    const [activePlanName, setActivePlanName] = useState('Untitled Plan');
    const [savedPlans, setSavedPlans] = useState<string[]>([]);
    const [newPlanName, setNewPlanName] = useState('');
    const [pastedJsonText, setPastedJsonText] = useState('');
    
    // --- EXPENSE TRACKER STATE ---
    const [isParsing, setIsParsing] = useState(false);

    // --- MODAL VISIBILITY STATE ---
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showPasteJsonModal, setShowPasteJsonModal] = useState(false);
    const [planToLoad, setPlanToLoad] = useState<string | null>(null);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showClearExpenseModal, setShowClearExpenseModal] = useState(false);

    // --- INITIALIZATION & HEIGHT TRACKING ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('appTheme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-bs-theme', savedTheme);
        
        const currentName = localStorage.getItem('active_plan_name') || 'Untitled Plan';
        setActivePlanName(currentName);
        setNewPlanName(currentName === 'Untitled Plan' ? '' : currentName);
        setSavedPlans(JSON.parse(localStorage.getItem('rp_plan_list') || '[]'));

        const handlePlanChange = (e: Event) => setActivePlanName((e as CustomEvent).detail);
        window.addEventListener('updateActivePlan', handlePlanChange);

        const updateHeight = () => {
            if (headerRef.current) {
                document.documentElement.style.setProperty('--global-header-height', `${headerRef.current.offsetHeight}px`);
            }
        };
        const resizeObserver = new ResizeObserver(() => updateHeight());
        if (headerRef.current) resizeObserver.observe(headerRef.current);

        return () => {
            window.removeEventListener('updateActivePlan', handlePlanChange);
            resizeObserver.disconnect();
        };
    }, [activeModule]);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('appTheme', newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme);
    };

    // ==========================================
    //        EXPENSE TRACKER OPERATIONS
    // ==========================================
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

                // Make all headers lowercase for easier searching
                const headers = Object.keys(parsedData[0] || {}).map(h => h.toLowerCase());
                
                const dateKey = headers.find(h => h.includes('date')) || headers[0];
                
                // SMARTER MERCHANT PARSING: Prioritize specific words, heavily ignore anything with "category" in the title
                const descKey = headers.find(h => (h.includes('merchant') && !h.includes('category'))) || 
                                headers.find(h => h.includes('payee')) || 
                                headers.find(h => h.includes('description') && !h.includes('category')) || 
                                headers.find(h => h.includes('name') && !h.includes('category')) || 
                                headers.find(h => h.includes('description')) || // Fallback
                                headers[1];

                const amtKey = headers.find(h => h.includes('amount')) || headers.find(h => h.includes('value')) || headers[2];

                const newTransactions = parsedData.map((row, index) => {
                    // Extract data using original casing of the keys we found
                    const originalAmtKey = Object.keys(row).find(k => k.toLowerCase() === amtKey) || amtKey;
                    const originalDateKey = Object.keys(row).find(k => k.toLowerCase() === dateKey) || dateKey;
                    const originalDescKey = Object.keys(row).find(k => k.toLowerCase() === descKey) || descKey;

                    const rawAmount = String(row[originalAmtKey] || '0');
                    const cleanAmount = parseFloat(rawAmount.replace(/[^0-9.-]+/g, ''));
                    const dateObj = new Date(row[originalDateKey]);
                    
                    return {
                        id: `${Date.now()}-${index}`,
                        date: dateObj.getTime() || Date.now(), // Timestamp for sorting
                        dateString: isNaN(dateObj.getTime()) ? 'Unknown' : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        merchant: row[originalDescKey] || 'Unknown',
                        category: 'Uncategorized',
                        account: file.name.replace('.csv', ''),
                        amount: isNaN(cleanAmount) ? 0 : cleanAmount
                    };
                });

                await saveTransactions(newTransactions);
                window.dispatchEvent(new CustomEvent('expensesUpdated'));
                setIsParsing(false);
                showToast("CSV Uploaded Successfully!");
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

    // ==========================================
    //        RETIREMENT PLANNER OPERATIONS
    // ==========================================
    const executeSave = () => {
        if (!newPlanName.trim()) { alert('Please enter a plan name.'); return; }
        const name = newPlanName.trim();
        localStorage.setItem(`rp_saved_plan_${name}`, JSON.stringify(data));
        localStorage.setItem('active_plan_name', name);
        setActivePlanName(name);

        let plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
        if (!plans.includes(name)) {
            plans.push(name);
            localStorage.setItem('rp_plan_list', JSON.stringify(plans));
            setSavedPlans(plans);
        }
        showToast(`Plan "${name}" saved!`);
        setShowSaveModal(false);
    };

    const confirmLoad = () => {
        if (planToLoad) {
            const planDataStr = localStorage.getItem(`rp_saved_plan_${planToLoad}`);
            if (planDataStr && financeContext.loadData) {
                financeContext.loadData(JSON.parse(planDataStr)); 
                localStorage.setItem('active_plan_name', planToLoad);
                setActivePlanName(planToLoad);
                showToast(`Loaded ${planToLoad}`);
            }
            setPlanToLoad(null);
            setShowLoadModal(false);
        }
    };

    const confirmDelete = () => {
        if (planToDelete) {
            localStorage.removeItem(`rp_saved_plan_${planToDelete}`);
            const newPlans = savedPlans.filter(p => p !== planToDelete);
            localStorage.setItem('rp_plan_list', JSON.stringify(newPlans));
            setSavedPlans(newPlans);
            if (activePlanName === planToDelete) {
                localStorage.setItem('active_plan_name', 'Untitled Plan');
                setActivePlanName('Untitled Plan');
            }
            showToast(`Deleted "${planToDelete}"`);
            setPlanToDelete(null);
        }
    };

    const handleExportJson = () => {
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activePlanName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Plan exported to PC!");
        setFileMenuOpen(false);
    };

    const handleLoadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedData = JSON.parse(event.target?.result as string);
                if (!parsedData.inputs) throw new Error("Invalid format");
                const importedName = file.name.replace('.json', '');
                localStorage.setItem(`rp_saved_plan_${importedName}`, JSON.stringify(parsedData));
                localStorage.setItem('active_plan_name', importedName);

                let plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
                if (!plans.includes(importedName)) {
                    plans.push(importedName);
                    localStorage.setItem('rp_plan_list', JSON.stringify(plans));
                    setSavedPlans(plans);
                }
                if (financeContext.loadData) {
                    financeContext.loadData(parsedData);
                    setActivePlanName(importedName);
                    showToast(`Successfully loaded ${importedName}!`);
                }
            } catch (err) { alert("Error loading file. Invalid JSON."); }
        };
        reader.readAsText(file);
        if (plannerFileInputRef.current) plannerFileInputRef.current.value = '';
        setFileMenuOpen(false);
    };

    const handleLoadFromPaste = () => {
        if (!pastedJsonText.trim()) return;
        try {
            const parsedData = JSON.parse(pastedJsonText);
            if (!parsedData.inputs) throw new Error("Invalid structure");
            const importedName = "Pasted Plan";
            localStorage.setItem(`rp_saved_plan_${importedName}`, JSON.stringify(parsedData));
            localStorage.setItem('active_plan_name', importedName);

            let plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
            if (!plans.includes(importedName)) {
                plans.push(importedName);
                localStorage.setItem('rp_plan_list', JSON.stringify(plans));
                setSavedPlans(plans);
            }
            if (financeContext.loadData) {
                financeContext.loadData(parsedData);
                setActivePlanName(importedName);
                showToast(`Successfully loaded Pasted Plan!`);
            }
            setShowPasteJsonModal(false);
            setPastedJsonText('');
        } catch (err) { alert("Error loading pasted text. Invalid JSON."); }
    };

    const confirmResetPlanner = () => {
        if (resetData) resetData();
        localStorage.setItem('active_plan_name', 'Untitled Plan');
        setActivePlanName('Untitled Plan');
        setShowResetConfirm(false);
        showToast("Current plan has been reset.");
    };

    return (
        <>
            {/* HIDDEN FILE INPUTS */}
            <input type="file" accept=".json" className="d-none" ref={plannerFileInputRef} onChange={handleLoadJson} />
            <input type="file" accept=".csv" className="d-none" ref={expenseFileInputRef} onChange={handleExpenseFileUpload} />

            {/* GLOBAL TOAST */}
            {toastMsg && (
                <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{zIndex: 2000}}>
                    <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                        <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                        {toastMsg}
                    </div>
                </div>
            )}

            {/* --- STICKY HEADER --- */}
            <div 
                ref={headerRef} 
                className="position-sticky top-0 pt-2 pb-2" 
                style={{ backgroundColor: 'var(--bg-body)', zIndex: 1040, borderBottom: '1px solid var(--border-color)' }}
            >
                <div className="d-flex flex-wrap justify-content-between align-items-center shadow-sm mb-0 rounded-4 p-2 border border-secondary rp-card gap-2 m-0">
                    
                    <div className="d-flex align-items-center gap-2">
                        {/* MODULE PILL SELECTOR */}
                        <div className="bg-input border border-secondary rounded-pill p-1 d-flex align-items-center shadow-sm me-1" style={{ width: 'fit-content' }}>
                            <Link 
                                href="/planner"
                                prefetch={true}
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none ${activeModule === 'planner' ? 'bg-primary text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className="bi bi-graph-up-arrow me-2"></i>
                                <span className="d-none d-sm-inline">Retirement Planner</span>
                                <span className="d-inline d-sm-none">Planner</span>
                            </Link>
                            
                            <Link 
                                href="/expenses"
                                prefetch={true}
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none ${activeModule === 'expenses' ? 'bg-success text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className="bi bi-receipt me-2"></i>
                                <span className="d-none d-sm-inline">Expense Tracker</span>
                                <span className="d-inline d-sm-none">Expenses</span>
                            </Link>
                        </div>
                    
                        {/* PLANNER ACTIONS (File Menu) */}
                        {activeModule === 'planner' && (
                            <div className="position-relative d-none d-md-block">
                                <button 
                                    className="btn btn-sm btn-outline-secondary bg-input d-flex align-items-center fw-bold rounded-pill px-3 shadow-sm transition-all" 
                                    type="button" 
                                    onClick={() => setFileMenuOpen(!fileMenuOpen)} 
                                    style={{ height: '36px' }}
                                >
                                    <i className="bi bi-folder2-open text-primary me-2"></i>
                                    <span className="text-truncate d-inline-block" style={{ maxWidth: '250px' }}>{activePlanName}</span>
                                    <i className="bi bi-chevron-down ms-2 text-muted" style={{ fontSize: '0.7rem' }}></i>
                                </button>
                                
                                {fileMenuOpen && (
                                    <>
                                        <div className="position-fixed top-0 start-0 w-100 h-100" style={{zIndex: 1040}} onClick={() => setFileMenuOpen(false)}></div>
                                        <ul className="dropdown-menu shadow-lg border-secondary rounded-3 show position-absolute mt-2" style={{zIndex: 1060, top: '100%', left: 0, minWidth: '240px'}}>
                                            <li><h6 className="dropdown-header text-muted text-uppercase ls-1" style={{fontSize: '0.7rem'}}>File Options</h6></li>
                                            <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setShowSaveModal(true); setFileMenuOpen(false); }}><i className="bi bi-floppy-fill text-primary me-2"></i> Save Current Plan</button></li>
                                            <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setShowLoadModal(true); setFileMenuOpen(false); }}><i className="bi bi-folder2-open text-info me-2"></i> Open Saved Plan</button></li>
                                            <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                                            <li><button className="dropdown-item py-2 fw-bold" onClick={handleExportJson}><i className="bi bi-download text-success me-2"></i> Export to PC (.json)</button></li>
                                            <li><button className="dropdown-item py-2 fw-bold text-warning" onClick={() => { setFileMenuOpen(false); plannerFileInputRef.current?.click(); }}><i className="bi bi-upload me-2"></i> Load from PC (.json)</button></li>
                                            <li><button className="dropdown-item py-2 fw-bold text-info" onClick={() => { setFileMenuOpen(false); setPastedJsonText(''); setShowPasteJsonModal(true); }}><i className="bi bi-clipboard-check me-2"></i> Paste JSON Plan</button></li>
                                            <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                                            <li><button className="dropdown-item py-2 fw-bold text-danger" onClick={() => { setShowResetConfirm(true); setFileMenuOpen(false); }}><i className="bi bi-trash3-fill me-2"></i> Reset Current Plan</button></li>
                                        </ul>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="d-flex align-items-center gap-2">
                        {/* EXPENSES ACTIONS (Clear & Upload) -> Moved here! */}
                        {activeModule === 'expenses' && (
                            <div className="d-flex gap-2 me-md-2">
                                <button 
                                    className="btn btn-sm btn-outline-danger bg-input fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center transition-all" 
                                    onClick={() => setShowClearExpenseModal(true)}
                                    style={{ height: '36px' }}
                                >
                                    <i className="bi bi-trash3-fill me-1 d-none d-sm-inline"></i> Clear
                                </button>
                                <button 
                                    className="btn btn-sm btn-success fw-bold rounded-pill px-3 shadow-sm d-flex align-items-center transition-all" 
                                    onClick={() => expenseFileInputRef.current?.click()} 
                                    disabled={isParsing}
                                    style={{ height: '36px' }}
                                >
                                    {isParsing ? (
                                        <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Parsing...</>
                                    ) : (
                                        <><i className="bi bi-cloud-arrow-up-fill me-1 d-none d-sm-inline"></i> Upload CSV</>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* TODAY'S $ TOGGLE (Only in Planner) */}
                        {activeModule === 'planner' && (
                            <div className="d-flex align-items-center bg-input border border-secondary rounded-pill px-3 shadow-sm transition-all" style={{ height: '36px' }} title="Toggle Real vs Nominal Dollars.">
                                <div className="form-check form-switch mb-0 d-flex align-items-center p-0 m-0">
                                    <input className="form-check-input m-0 cursor-pointer shadow-none" type="checkbox" id="useRealDollars" checked={data.useRealDollars ?? false} onChange={(e) => updateUseRealDollars(e.target.checked)} />
                                    <label className="form-check-label small fw-bold text-info ms-2 cursor-pointer d-none d-md-block" style={{paddingTop: '2px'}} htmlFor="useRealDollars">Today's $</label>
                                </div>
                            </div>
                        )}

                        {/* THEME TOGGLE */}
                        <button type="button" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0" style={{ width: '36px', height: '36px' }} onClick={toggleTheme}>
                            <i className={`fs-6 ${theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi-moon-fill text-primary'}`}></i>
                        </button>

                        <a href="https://ko-fi.com/P5P11UYZUD" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0 d-none d-sm-flex" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-cup-hot-fill fs-6" style={{ color: '#72a4f2' }}></i>
                        </a>

                        {/* PROFILE */}
                        {session ? (
                            <div className="position-relative cursor-pointer" onClick={() => signOut()} title="Sign Out">
                                {session.user?.image ? (
                                    <img src={session.user.image} alt="User" className="rounded-circle shadow-sm border border-secondary" width="36" height="36" />
                                ) : (
                                    <button className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm p-0" style={{ width: '36px', height: '36px' }}><i className="bi bi-person-fill fs-6"></i></button>
                                )}
                            </div>
                        ) : (
                            <button type="button" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm opacity-50 p-0" style={{ width: '36px', height: '36px', cursor: 'not-allowed' }} title="Google Sync coming soon" onClick={(e) => e.preventDefault()}><i className="bi bi-google fs-6"></i></button>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================== */}
            {/* ALL MODALS                   */}
            {/* ========================================== */}

            {/* EXPENSES: CLEAR DATA MODAL */}
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

            {/* PLANNER: SAVE MODAL */}
            {showSaveModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowSaveModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{zIndex: 1060}}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center"><i className="bi bi-floppy-fill text-primary me-2"></i> Save Plan</h6>
                                <button type="button" className="btn-close" onClick={() => setShowSaveModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <label className="form-label small text-muted fw-bold">Plan Name</label>
                                <input type="text" className="form-control bg-input border-secondary fw-bold text-main mb-3" value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="e.g. Base Plan" autoFocus onKeyDown={e => e.key === 'Enter' && executeSave()} />
                                <button className="btn btn-primary w-100 fw-bold shadow-sm rounded-pill" onClick={executeSave}>Save to Browser</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLANNER: LOAD MODAL */}
            {showLoadModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowLoadModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered position-relative" style={{zIndex: 1060}}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center"><i className="bi bi-folder2-open text-info me-2"></i> Open Saved Plan</h6>
                                <button type="button" className="btn-close" onClick={() => setShowLoadModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {savedPlans.length === 0 ? (
                                    <div className="text-center text-muted small fst-italic py-3">No saved plans found in this browser.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2 pe-1" style={{maxHeight: '300px', overflowY: 'auto'}}>
                                        {savedPlans.map(planName => (
                                            <div key={planName} className="d-flex justify-content-between align-items-center bg-input border border-secondary rounded-3 p-2 px-3 shadow-sm transition-all hover-opacity-75">
                                                <span className={`fw-bold text-truncate me-2 ${activePlanName === planName ? 'text-primary' : 'text-main'}`}>
                                                    {planName}
                                                    {activePlanName === planName && <span className="badge bg-primary ms-2 small">ACTIVE</span>}
                                                </span>
                                                <div className="d-flex gap-2 align-items-center">
                                                    <button className="btn btn-sm btn-outline-info fw-bold rounded-pill px-3" onClick={() => setPlanToLoad(planName)}>Open</button>
                                                    <button className="btn btn-sm btn-link text-danger p-1 opacity-50 hover-opacity-100" title="Delete Plan" onClick={() => setPlanToDelete(planName)}><i className="bi bi-x-lg fs-5"></i></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLANNER: PASTE JSON MODAL */}
            {showPasteJsonModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowPasteJsonModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-lg position-relative" style={{zIndex: 1060}}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center"><i className="bi bi-clipboard-check text-info me-2"></i> Paste JSON Plan</h6>
                                <button type="button" className="btn-close" onClick={() => setShowPasteJsonModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <textarea className="form-control bg-input border-secondary text-main mb-3" rows={10} value={pastedJsonText} onChange={e => setPastedJsonText(e.target.value)} placeholder="Paste your JSON data here..." autoFocus></textarea>
                                <div className="d-flex gap-2 justify-content-end">
                                    <button className="btn btn-outline-secondary fw-bold rounded-pill px-4" onClick={() => setShowPasteJsonModal(false)}>Cancel</button>
                                    <button className="btn btn-info fw-bold rounded-pill text-dark px-4" onClick={handleLoadFromPaste}>Load Plan</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLANNER: CONFIRM LOAD MODAL */}
            {planToLoad && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setPlanToLoad(null)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{zIndex: 1080}}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center text-warning"><i className="bi bi-exclamation-triangle-fill me-2"></i> Confirm Load</h6>
                                <button type="button" className="btn-close" onClick={() => setPlanToLoad(null)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="text-muted small mb-4">Are you sure you want to load <strong>"{planToLoad}"</strong>?<br/><br/>Any unsaved changes in your current plan will be lost.</p>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary w-50 fw-bold rounded-pill" onClick={() => setPlanToLoad(null)}>Cancel</button>
                                    <button className="btn btn-warning w-50 fw-bold rounded-pill text-dark" onClick={confirmLoad}>Load Plan</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLANNER: DELETE PLAN MODAL */}
            {planToDelete && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setPlanToDelete(null)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{zIndex: 1080}}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center text-danger"><i className="bi bi-trash3-fill me-2"></i> Delete Plan</h6>
                                <button type="button" className="btn-close" onClick={() => setPlanToDelete(null)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="text-muted small mb-4">Are you sure you want to permanently delete <strong>"{planToDelete}"</strong>? This cannot be undone.</p>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary w-50 fw-bold rounded-pill" onClick={() => setPlanToDelete(null)}>Cancel</button>
                                    <button className="btn btn-danger w-50 fw-bold rounded-pill" onClick={confirmDelete}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PLANNER: RESET CURRENT PLAN MODAL */}
            {showResetConfirm && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowResetConfirm(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{zIndex: 1080}}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center text-danger"><i className="bi bi-exclamation-octagon-fill me-2"></i> Reset Plan</h6>
                                <button type="button" className="btn-close" onClick={() => setShowResetConfirm(false)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="text-muted small mb-4">Are you sure you want to completely clear your data and reset the calculator to its default state?</p>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary w-50 fw-bold rounded-pill" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                                    <button className="btn btn-danger w-50 fw-bold rounded-pill" onClick={confirmResetPlanner}>Reset</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}