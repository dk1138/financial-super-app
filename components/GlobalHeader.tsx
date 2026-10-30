'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useFinance } from '../lib/FinanceContext';
import { useTranslation } from '../lib/LanguageContext';
import ExpenseHeaderActions from './expenses/ExpenseHeaderActions';
import { ENGINE_VERSION } from '../lib/financeEngine';

export default function GlobalHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const financeContext = useFinance() as any;
    const { data, updateUseRealDollars, resetData } = financeContext;
    const { lang, setLang, t } = useTranslation();

    // --- REFS ---
    const headerRef = useRef<HTMLDivElement>(null);
    const plannerFileInputRef = useRef<HTMLInputElement>(null);
    const fileMenuRef = useRef<HTMLDivElement>(null);

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

    // --- MODAL VISIBILITY STATE (Planner Only) ---
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showPasteJsonModal, setShowPasteJsonModal] = useState(false);
    const [planToLoad, setPlanToLoad] = useState<string | null>(null);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Click outside handler for dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setFileMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- INITIAL LOAD: LOCAL STORAGE SYNC ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('appTheme') || 'dark';
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-bs-theme', savedTheme);

        const currentName = localStorage.getItem('active_plan_name') || 'Untitled Plan';
        setActivePlanName(currentName);

        setSavedPlans(JSON.parse(localStorage.getItem('rp_plan_list') || '[]'));

        // Broadcast header height dynamically to CSS variable
        const updateHeaderHeight = () => {
            if (headerRef.current) {
                const height = headerRef.current.offsetHeight;
                document.documentElement.style.setProperty('--global-header-height', `${height}px`);
            }
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);
        return () => window.removeEventListener('resize', updateHeaderHeight);
    }, []);

    // --- TOAST NOTIFICATIONS ---
    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(''), 3000);
    };

    // --- THEME TOGGLE ---
    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        localStorage.setItem('appTheme', newTheme);
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
        if (!data) return;
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filename = `${activePlanName.replace(/[^a-z0-9_-]/gi, '_')}_v${ENGINE_VERSION}_${new Date().toISOString().split('T')[0]}.json`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Plan downloaded as JSON!');
        setFileMenuOpen(false);
    };

    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsedData = JSON.parse(event.target?.result as string);
                
                if (financeContext.loadData) {
                    financeContext.loadData(parsedData);
                }

                let importedName = file.name.replace(/\.json$/i, '');
                importedName = importedName.replace(/_v[\d.]+_[\d-]+$/, ''); 
                
                localStorage.setItem(`rp_saved_plan_${importedName}`, JSON.stringify(parsedData));
                localStorage.setItem('active_plan_name', importedName);
                setActivePlanName(importedName);

                let plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
                if (!plans.includes(importedName)) {
                    plans.push(importedName);
                    localStorage.setItem('rp_plan_list', JSON.stringify(plans));
                    setSavedPlans(plans);
                }

                showToast(`Imported & Saved: "${importedName}"`);
            } catch (err) {
                alert('Invalid JSON file format.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handlePasteJsonSubmit = () => {
        if (!pastedJsonText.trim()) return;
        try {
            const parsedData = JSON.parse(pastedJsonText.trim());
            if (financeContext.loadData) {
                financeContext.loadData(parsedData);
            }
            const importedName = `Pasted Plan (${new Date().toLocaleTimeString()})`;
            localStorage.setItem(`rp_saved_plan_${importedName}`, JSON.stringify(parsedData));
            localStorage.setItem('active_plan_name', importedName);
            setActivePlanName(importedName);

            let plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
            if (!plans.includes(importedName)) {
                plans.push(importedName);
                localStorage.setItem('rp_plan_list', JSON.stringify(plans));
                setSavedPlans(plans);
            }
            showToast('JSON Plan loaded successfully!');
            setShowPasteJsonModal(false);
            setPastedJsonText('');
        } catch (err) {
            alert('Failed to parse JSON text. Ensure it is valid JSON.');
        }
    };

    const confirmResetPlanner = () => {
        if (resetData) {
            resetData();
        }
        localStorage.setItem('active_plan_name', 'Untitled Plan');
        setActivePlanName('Untitled Plan');
        setShowResetConfirm(false);
        showToast('Plan reset to defaults.');
    };

    return (
        <>
            <input 
                type="file" 
                ref={plannerFileInputRef} 
                style={{ display: 'none' }} 
                accept=".json" 
                onChange={handleImportJson} 
            />

            {/* FLOATING TOAST NOTIFICATION */}
            {toastMsg && (
                <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{zIndex: 2000}}>
                    <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                        <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                        {toastMsg}
                    </div>
                </div>
            )}

            <div 
                ref={headerRef} 
                className="position-sticky top-0 pt-2 pb-2 px-2" 
                style={{ backgroundColor: 'var(--bg-body)', zIndex: 1040, borderBottom: '1px solid var(--border-color)' }}
            >
                <div className="d-flex flex-nowrap align-items-center justify-content-between shadow-sm mb-0 rounded-4 p-2 border border-secondary rp-card m-0 position-relative w-100 gap-2 overflow-visible">
                    
                    {/* 1. LEFT: Branding & Module Navigator */}
                    <div className="d-flex align-items-center gap-2">
                        <div className="d-flex align-items-center justify-content-center text-primary ms-1" title="Planfolio" style={{ flexShrink: 0 }}>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                style={{ width: '28px', height: '28px' }}
                            >
                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                            </svg>
                        </div>

                        {/* MODULE PILL SELECTOR */}
                        <div className="bg-input border border-secondary rounded-pill p-1 d-flex align-items-center shadow-sm" style={{ width: 'fit-content', whiteSpace: 'nowrap' }}>
                            <Link 
                                href="/planner"
                                prefetch={true}
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none ${activeModule === 'planner' ? 'bg-primary text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className="bi bi-pie-chart-fill me-1.5"></i> {t('nav.planner')}
                            </Link>
                            <Link 
                                href="/expenses"
                                prefetch={true}
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none ${activeModule === 'expenses' ? 'bg-primary text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                                style={{ fontSize: '0.85rem' }}
                            >
                                <i className="bi bi-receipt-cutoff me-1.5"></i> {t('nav.expenses')}
                            </Link>
                        </div>
                    </div>

                    {/* 2. CENTER: Plan Title & File Menu */}
                    {activeModule === 'planner' && (
                        <div className="d-none d-lg-flex align-items-center gap-2 justify-content-center flex-grow-1">
                            <div className="position-relative" ref={fileMenuRef}>
                                <button 
                                    className="btn btn-sm bg-input border border-secondary rounded-pill px-3 py-1.5 d-flex align-items-center shadow-sm transition-all"
                                    onClick={() => setFileMenuOpen(!fileMenuOpen)}
                                    title="Plan Options"
                                >
                                    <i className="bi bi-folder2-open text-primary me-2 fs-5"></i>
                                    <span className="text-truncate d-inline-block text-primary fw-bold" style={{ maxWidth: '250px', fontSize: '0.95rem', letterSpacing: '0.3px' }}>
                                        {activePlanName}
                                    </span>
                                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center ms-3 shadow-sm" style={{ width: '24px', height: '24px' }}>
                                        <i className={`bi bi-chevron-${fileMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', strokeWidth: '2px' }}></i>
                                    </span>
                                </button>
                                
                                {fileMenuOpen && (
                                    <ul className="dropdown-menu shadow-lg border-secondary rounded-3 show position-absolute mt-2 start-50 translate-middle-x" style={{zIndex: 1060, top: '100%', minWidth: '260px'}}>
                                        <li>
                                            <h6 className="dropdown-header text-muted text-uppercase ls-1 d-flex justify-content-between align-items-center" style={{fontSize: '0.7rem'}}>
                                                <span>{t('nav.fileOptions')}</span>
                                                <span className="badge bg-secondary bg-opacity-25 text-secondary">v{ENGINE_VERSION}</span>
                                            </h6>
                                        </li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setShowSaveModal(true); setFileMenuOpen(false); }}><i className="bi bi-floppy-fill text-primary me-2"></i> {t('nav.savePlan')}</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setNewPlanName(`${activePlanName} (Copy)`); setShowSaveModal(true); setFileMenuOpen(false); }}><i className="bi bi-copy text-info me-2"></i> {t('nav.saveCopy')}</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setShowLoadModal(true); setFileMenuOpen(false); }}><i className="bi bi-folder2-open text-info me-2"></i> {t('nav.openPlan')}</button></li>
                                        <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={handleExportJson}><i className="bi bi-download text-success me-2"></i> {t('nav.exportJson')}</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-warning" onClick={() => { setFileMenuOpen(false); plannerFileInputRef.current?.click(); }}><i className="bi bi-upload me-2"></i> {t('nav.loadJson')}</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-info" onClick={() => { setFileMenuOpen(false); setPastedJsonText(''); setShowPasteJsonModal(true); }}><i className="bi bi-clipboard-check me-2"></i> {t('nav.pasteJson')}</button></li>
                                        <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-danger" onClick={() => { setShowResetConfirm(true); setFileMenuOpen(false); }}><i className="bi bi-trash3-fill me-2"></i> {t('nav.resetPlan')}</button></li>
                                    </ul>
                                )}
                            </div>

                            <span 
                                className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1.5 rounded-pill fw-bold shadow-sm" 
                                style={{ fontSize: '0.75rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}
                                title={`Planfolio Version ${ENGINE_VERSION}`}
                            >
                                v{ENGINE_VERSION}
                            </span>
                        </div>
                    )}

                    {/* 3. RIGHT: Language Toggle, Theme, Today's $ & Profile */}
                    <div className="d-flex align-items-center gap-2 justify-content-end" style={{ flexShrink: 0 }}>
                        
                        {activeModule === 'expenses' && <ExpenseHeaderActions showToast={showToast} />}

                        {/* TODAY'S $ TOGGLE */}
                        {activeModule === 'planner' && (
                            <div className="d-flex align-items-center bg-input border border-secondary rounded-pill px-3 shadow-sm transition-all d-none d-sm-flex" style={{ height: '36px' }} title="Toggle Real vs Nominal Dollars.">
                                <div className="form-check form-switch mb-0 d-flex align-items-center p-0 m-0">
                                    <input className="form-check-input m-0 cursor-pointer shadow-none" type="checkbox" id="useRealDollars" checked={data.useRealDollars ?? false} onChange={(e) => updateUseRealDollars(e.target.checked)} />
                                    <label className="form-check-label small fw-bold text-info ms-2 cursor-pointer d-none d-xl-block" style={{paddingTop: '2px'}} htmlFor="useRealDollars">{t('nav.todaysDollars')}</label>
                                </div>
                            </div>
                        )}

                        {/* LANGUAGE TOGGLE (EN / FR) */}
                        <div className="bg-input border border-secondary rounded-pill p-1 d-flex align-items-center shadow-sm" style={{ height: '36px' }} title="Toggle Language / Basculer la langue (EN / FR)">
                            <button 
                                type="button" 
                                onClick={() => setLang('en')} 
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-2 py-0.5 transition-all ${lang === 'en' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent opacity-75 hover-opacity-100'}`}
                                style={{ fontSize: '0.75rem', lineHeight: '1.2' }}
                            >
                                EN
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setLang('fr')} 
                                className={`btn btn-sm rounded-pill border-0 fw-bold px-2 py-0.5 transition-all ${lang === 'fr' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent opacity-75 hover-opacity-100'}`}
                                style={{ fontSize: '0.75rem', lineHeight: '1.2' }}
                            >
                                FR
                            </button>
                        </div>

                        {/* THEME TOGGLE */}
                        <button type="button" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0" style={{ width: '36px', height: '36px' }} onClick={toggleTheme}>
                            <i className={`fs-6 ${theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi-moon-fill text-primary'}`}></i>
                        </button>

                        <a href="https://ko-fi.com/P5P11UYZUD" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0 d-none d-md-flex" style={{ width: '36px', height: '36px' }}>
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

            {/* SAVE MODAL */}
            {showSaveModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{zIndex: 1070}}>
                    <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 p-4" style={{maxWidth: '400px'}}>
                        <h5 className="fw-bold mb-3">Save Plan</h5>
                        <input type="text" className="form-control mb-3" placeholder="Enter plan name..." value={newPlanName} onChange={e => setNewPlanName(e.target.value)} />
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowSaveModal(false)}>Cancel</button>
                            <button className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={executeSave}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* OPEN MODAL */}
            {showLoadModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{zIndex: 1070}}>
                    <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 p-4" style={{maxWidth: '480px'}}>
                        <h5 className="fw-bold mb-3">Open Plan</h5>
                        {savedPlans.length === 0 ? <p className="text-muted small">No saved plans found.</p> : (
                            <div className="list-group mb-3" style={{maxHeight: '250px', overflowY: 'auto'}}>
                                {savedPlans.map(p => (
                                    <div key={p} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2 surface-card border-secondary">
                                        <span className="fw-bold cursor-pointer flex-grow-1" onClick={() => setPlanToLoad(p)}>{p}</span>
                                        <button className="btn btn-sm btn-link text-danger p-0 ms-2" onClick={() => setPlanToDelete(p)}><i className="bi bi-trash"></i></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowLoadModal(false)}>Cancel</button>
                            {planToLoad && <button className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={confirmLoad}>Load &quot;{planToLoad}&quot;</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* PASTE JSON MODAL */}
            {showPasteJsonModal && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{zIndex: 1070}}>
                    <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 p-4" style={{maxWidth: '550px', width: '100%'}}>
                        <h5 className="fw-bold mb-2">Paste JSON Plan</h5>
                        <p className="text-muted small mb-3">Paste your raw exported plan JSON string below.</p>
                        <textarea className="form-control mb-3 font-monospace" style={{fontSize: '0.8rem', height: '180px'}} value={pastedJsonText} onChange={e => setPastedJsonText(e.target.value)} placeholder="Paste JSON here..."></textarea>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowPasteJsonModal(false)}>Cancel</button>
                            <button className="btn btn-sm btn-primary rounded-pill px-3 fw-bold" onClick={handlePasteJsonSubmit}>Apply Plan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESET CONFIRMATION MODAL */}
            {showResetConfirm && (
                <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center p-3" style={{zIndex: 1070}}>
                    <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 p-4" style={{maxWidth: '400px'}}>
                        <h5 className="fw-bold text-danger mb-2"><i className="bi bi-exclamation-triangle-fill me-2"></i>Reset Current Plan?</h5>
                        <p className="text-muted small mb-4">This will clear your active inputs and reset all values back to starting defaults.</p>
                        <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowResetConfirm(false)}>Cancel</button>
                            <button className="btn btn-sm btn-danger rounded-pill px-3 fw-bold" onClick={confirmResetPlanner}>Yes, Reset Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}