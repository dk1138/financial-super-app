'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link'; // <-- Added for instant pre-fetching
import { signOut, useSession } from 'next-auth/react';
import { useFinance } from '../lib/FinanceContext';

export default function GlobalHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const financeContext = useFinance() as any;
    const { data, updateUseRealDollars, resetData } = financeContext;

    const headerRef = useRef<HTMLDivElement>(null);

    // --- THEME STATE ---
    const [theme, setTheme] = useState('dark');

    // --- FILE MANAGEMENT STATE ---
    const [fileMenuOpen, setFileMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activePlanName, setActivePlanName] = useState('Untitled Plan');
    const [savedPlans, setSavedPlans] = useState<string[]>([]);
    const [newPlanName, setNewPlanName] = useState('');
    const [toastMsg, setToastMsg] = useState('');

    // --- MODAL STATE ---
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showPasteJsonModal, setShowPasteJsonModal] = useState(false);
    const [pastedJsonText, setPastedJsonText] = useState('');
    const [planToLoad, setPlanToLoad] = useState<string | null>(null);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    const activeModule = pathname.includes('/expenses') ? 'expenses' : 'planner';

    // --- INITIALIZATION & DYNAMIC HEIGHT SYNC ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('appTheme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-bs-theme', savedTheme);

        const currentName = localStorage.getItem('active_plan_name') || 'Untitled Plan';
        setActivePlanName(currentName);
        setNewPlanName(currentName === 'Untitled Plan' ? '' : currentName);
        setSavedPlans(JSON.parse(localStorage.getItem('rp_plan_list') || '[]'));

        const handlePlanChange = (e: Event) => {
            setActivePlanName((e as CustomEvent).detail);
        };
        window.addEventListener('updateActivePlan', handlePlanChange);

        // Perfectly calculate header height so tabs stick precisely below it
        const updateHeight = () => {
            if (headerRef.current) {
                document.documentElement.style.setProperty('--global-header-height', `${headerRef.current.offsetHeight}px`);
            }
        };
        updateHeight();
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('updateActivePlan', handlePlanChange);
            window.removeEventListener('resize', updateHeight);
        };
    }, [activeModule]); // Re-calculate if layout shifts between modules

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('appTheme', newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme);
    };

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    // --- FILE OPERATIONS ---
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
        showToast(`Plan "${name}" successfully saved!`);
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
        if (fileInputRef.current) fileInputRef.current.value = '';
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

    const confirmReset = () => {
        if (resetData) resetData();
        localStorage.setItem('active_plan_name', 'Untitled Plan');
        setActivePlanName('Untitled Plan');
        setShowResetConfirm(false);
        showToast("Current plan has been reset.");
    };

    return (
        <>
            <input type="file" accept=".json" className="d-none" ref={fileInputRef} onChange={handleLoadJson} />

            {toastMsg && (
                <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{zIndex: 1060}}>
                    <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                        <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                        {toastMsg}
                    </div>
                </div>
            )}

            <div 
                ref={headerRef} // <-- Added reference for dynamic height calculation
                className="position-sticky top-0 pt-2 pb-2" // <-- Removed mb-2 margin gap
                style={{ backgroundColor: 'var(--bg-body)', zIndex: 1040, borderBottom: '1px solid var(--border-color)' }}
            >
                {/* Notice the mb-0 so the card touches the bottom border padding cleanly */}
                <div className="d-flex flex-wrap justify-content-between align-items-center shadow-sm mb-0 rounded-4 p-2 border border-secondary rp-card gap-2 m-0">
                    
                    <div className="d-flex align-items-center gap-2">
                        {/* --- INSTANT NAVIGATION LINKS --- */}
                        <div className="bg-input border border-secondary rounded-pill p-1 d-flex align-items-center shadow-sm me-1" style={{ width: 'fit-content' }}>
                            <Link 
                                href="/planner"
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none ${activeModule === 'planner' ? 'bg-primary text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className="bi bi-graph-up-arrow me-2"></i>
                                <span className="d-none d-sm-inline">Retirement Planner</span>
                                <span className="d-inline d-sm-none">Planner</span>
                            </Link>
                            
                            <Link 
                                href="/expenses"
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none ${activeModule === 'expenses' ? 'bg-success text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className="bi bi-receipt me-2"></i>
                                <span className="d-none d-sm-inline">Expense Tracker</span>
                                <span className="d-inline d-sm-none">Expenses</span>
                            </Link>
                        </div>
                    
                        {/* --- FILE MANAGER --- */}
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
                                            <li><button className="dropdown-item py-2 fw-bold text-warning" onClick={() => { setFileMenuOpen(false); fileInputRef.current?.click(); }}><i className="bi bi-upload me-2"></i> Load from PC (.json)</button></li>
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
                        {activeModule === 'planner' && (
                            <div className="d-flex align-items-center bg-input border border-secondary rounded-pill px-3 shadow-sm transition-all" style={{ height: '36px' }} title="Toggle Real vs Nominal Dollars.">
                                <div className="form-check form-switch mb-0 d-flex align-items-center p-0 m-0">
                                    <input className="form-check-input m-0 cursor-pointer shadow-none" type="checkbox" id="useRealDollars" checked={data.useRealDollars ?? false} onChange={(e) => updateUseRealDollars(e.target.checked)} />
                                    <label className="form-check-label small fw-bold text-info ms-2 cursor-pointer d-none d-md-block" style={{paddingTop: '2px'}} htmlFor="useRealDollars">Today's $</label>
                                </div>
                            </div>
                        )}

                        <button type="button" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0" style={{ width: '36px', height: '36px' }} onClick={toggleTheme}>
                            <i className={`fs-6 ${theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi-moon-fill text-primary'}`}></i>
                        </button>

                        <a href="https://ko-fi.com/P5P11UYZUD" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-cup-hot-fill fs-6" style={{ color: '#72a4f2' }}></i>
                        </a>

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

            {/* --- GLOBAL FILE MODALS --- */}
            {/* ... Modal code remains identical ... */}
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
                                    <button className="btn btn-danger w-50 fw-bold rounded-pill" onClick={confirmReset}>Reset</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}