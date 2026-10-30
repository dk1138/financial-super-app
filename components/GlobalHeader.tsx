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
    const translationCtx = useTranslation() as any;
    const { lang } = translationCtx;
    const setLanguage = translationCtx.setLang || translationCtx.setLanguage;

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

    // --- RENAMING STATE ---
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renameInputVal, setRenameInputVal] = useState('');
    const [isInlineEditingName, setIsInlineEditingName] = useState(false);
    const [inlineNameVal, setInlineNameVal] = useState('');

    // --- MODAL VISIBILITY STATE (Planner Only) ---
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showPasteJsonModal, setShowPasteJsonModal] = useState(false);
    const [planToLoad, setPlanToLoad] = useState<string | null>(null);
    const [planToDelete, setPlanToDelete] = useState<string | null>(null);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

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

    // Handle clicking outside of the file menu to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (fileMenuRef.current && !fileMenuRef.current.contains(event.target as Node)) {
                setFileMenuOpen(false);
            }
        };

        if (fileMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [fileMenuOpen]);

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

    const toggleLanguage = () => {
        const nextLang = lang === 'en' ? 'fr' : 'en';
        setLanguage(nextLang);
    };

    // ==========================================
    //        RENAME OPERATIONS
    // ==========================================
    const executeRename = (oldName: string, targetName: string) => {
        const trimmed = targetName.trim();
        if (!trimmed) {
            showToast('Please enter a valid plan name.');
            return;
        }
        if (trimmed === oldName) {
            setShowRenameModal(false);
            setIsInlineEditingName(false);
            return;
        }

        // 1. Move stored data to new key in localStorage
        const existingData = localStorage.getItem(`rp_saved_plan_${oldName}`);
        if (existingData) {
            localStorage.setItem(`rp_saved_plan_${trimmed}`, existingData);
            localStorage.removeItem(`rp_saved_plan_${oldName}`);
        } else {
            localStorage.setItem(`rp_saved_plan_${trimmed}`, JSON.stringify(data));
        }

        // 2. Update saved plans list
        let plans: string[] = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
        if (plans.includes(oldName)) {
            plans = plans.map(p => p === oldName ? trimmed : p);
        } else if (!plans.includes(trimmed)) {
            plans.push(trimmed);
        }
        localStorage.setItem('rp_plan_list', JSON.stringify(plans));
        setSavedPlans(plans);

        // 3. Update active plan state and broadcast
        localStorage.setItem('active_plan_name', trimmed);
        setActivePlanName(trimmed);
        setNewPlanName(trimmed);
        window.dispatchEvent(new CustomEvent('updateActivePlan', { detail: trimmed }));

        showToast(`Plan renamed to "${trimmed}"!`);
        setShowRenameModal(false);
        setIsInlineEditingName(false);
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
        const exportPayload = {
            ...data,
            version: ENGINE_VERSION,
            exportedAt: new Date().toISOString()
        };
        const dataStr = JSON.stringify(exportPayload, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activePlanName.replace(/\s+/g, '_')}_v${ENGINE_VERSION}_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast(`Plan exported to PC (v${ENGINE_VERSION})!`);
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
            <input type="file" accept=".json" className="d-none" ref={plannerFileInputRef} onChange={handleLoadJson} />

            {toastMsg && (
                <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{ zIndex: 2000 }}>
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
                    
                    {/* 1. LEFT: Branding & Navigation Modules */}
                    <div className="d-flex align-items-center gap-2">
                        {/* BRAND ICON */}
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
                                <i className="bi bi-graph-up-arrow me-2 d-none d-sm-inline"></i>
                                <span className="d-none d-md-inline">Retirement Planner</span>
                                <span className="d-inline d-md-none">Planner</span>
                            </Link>
                            
                            {/* EXPENSE TRACKER (BLOCKED PLACEHOLDER) */}
                            <span 
                                className="btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none text-muted opacity-50" 
                                style={{ fontSize: '0.85rem', cursor: 'not-allowed', pointerEvents: 'none' }}
                                title="Coming soon"
                            >
                                <i className="bi bi-receipt me-2 d-none d-sm-inline"></i>
                                <span className="d-none d-md-inline">Expense Tracker</span>
                                <span className="d-inline d-md-none">Expenses</span>
                            </span>

                            {/* PORTFOLIO TRACKER (BLOCKED PLACEHOLDER) */}
                            <span 
                                className="btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all text-decoration-none text-muted opacity-50" 
                                style={{ fontSize: '0.85rem', cursor: 'not-allowed', pointerEvents: 'none' }}
                                title="Coming soon"
                            >
                                <i className="bi bi-pie-chart-fill me-2 d-none d-sm-inline"></i>
                                <span className="d-none d-lg-inline">Portfolio Tracker</span>
                                <span className="d-inline d-lg-none">Portfolio</span>
                            </span>
                        </div>
                    </div>
                    
                    {/* 2. CENTER: File Menu & Renaming Pill */}
                    {activeModule === 'planner' && (
                        <div ref={fileMenuRef} className="d-none d-lg-flex align-items-center gap-2 position-absolute start-50 translate-middle-x" style={{ zIndex: 1050 }}>
                            <div className="position-relative">
                                {isInlineEditingName ? (
                                    <div className="d-flex align-items-center bg-input border border-primary rounded-pill px-3 shadow-sm" style={{ height: '40px' }}>
                                        <i className="bi bi-pencil-square text-primary me-2 fs-6"></i>
                                        <input
                                            type="text"
                                            className="bg-transparent border-0 fw-bold text-main p-0 shadow-none"
                                            style={{ outline: 'none', fontSize: '0.95rem', minWidth: '160px', maxWidth: '240px' }}
                                            value={inlineNameVal}
                                            autoFocus
                                            onChange={(e) => setInlineNameVal(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') executeRename(activePlanName, inlineNameVal);
                                                if (e.key === 'Escape') setIsInlineEditingName(false);
                                            }}
                                            onBlur={() => executeRename(activePlanName, inlineNameVal)}
                                        />
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-link text-success p-0 ms-2"
                                            onMouseDown={(e) => { e.preventDefault(); executeRename(activePlanName, inlineNameVal); }}
                                            title="Confirm name"
                                        >
                                            <i className="bi bi-check-lg fs-5"></i>
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-sm btn-link text-muted p-0 ms-2"
                                            onMouseDown={(e) => { e.preventDefault(); setIsInlineEditingName(false); }}
                                            title="Cancel"
                                        >
                                            <i className="bi bi-x fs-5"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        className="btn btn-sm d-flex align-items-center fw-bold rounded-pill px-3 shadow-sm transition-all border border-primary border-opacity-25" 
                                        type="button" 
                                        onClick={() => setFileMenuOpen(!fileMenuOpen)} 
                                        style={{ height: '40px', backgroundColor: 'rgba(13, 110, 253, 0.08)' }}
                                    >
                                        <i className="bi bi-folder2-open text-primary me-2 fs-5"></i>
                                        <span className="text-truncate d-inline-block text-primary" style={{ maxWidth: '220px', fontSize: '0.95rem', letterSpacing: '0.3px' }}>
                                            {activePlanName}
                                        </span>
                                        <span 
                                            className="btn btn-sm btn-link p-0 text-primary opacity-50 hover-opacity-100 ms-2"
                                            style={{ pointerEvents: 'auto' }}
                                            title="Quick rename plan"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setInlineNameVal(activePlanName);
                                                setIsInlineEditingName(true);
                                            }}
                                        >
                                            <i className="bi bi-pencil" style={{ fontSize: '0.78rem' }}></i>
                                        </span>
                                        <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center ms-2 shadow-sm" style={{ width: '22px', height: '22px' }}>
                                            <i className={`bi bi-chevron-${fileMenuOpen ? 'up' : 'down'}`} style={{ fontSize: '0.75rem', strokeWidth: '2px' }}></i>
                                        </span>
                                    </button>
                                )}
                                
                                {fileMenuOpen && (
                                    <ul className="dropdown-menu shadow-lg border-secondary rounded-3 show position-absolute mt-2 start-50 translate-middle-x" style={{ zIndex: 1060, top: '100%', minWidth: '260px' }}>
                                        <li>
                                            <h6 className="dropdown-header text-muted text-uppercase ls-1 d-flex justify-content-between align-items-center" style={{ fontSize: '0.7rem' }}>
                                                <span>File Options</span>
                                                <span className="badge bg-secondary bg-opacity-25 text-secondary">v{ENGINE_VERSION}</span>
                                            </h6>
                                        </li>
                                        <li>
                                            <button 
                                                className="dropdown-item py-2 fw-bold" 
                                                onClick={() => { 
                                                    setRenameInputVal(activePlanName); 
                                                    setShowRenameModal(true); 
                                                    setFileMenuOpen(false); 
                                                }}
                                            >
                                                <i className="bi bi-pencil-square text-warning me-2"></i> Rename Current Plan...
                                            </button>
                                        </li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setShowSaveModal(true); setFileMenuOpen(false); }}><i className="bi bi-floppy-fill text-primary me-2"></i> Save Current Plan</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setNewPlanName(`${activePlanName} (Copy)`); setShowSaveModal(true); setFileMenuOpen(false); }}><i className="bi bi-copy text-info me-2"></i> Save As Copy...</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={() => { setShowLoadModal(true); setFileMenuOpen(false); }}><i className="bi bi-folder2-open text-info me-2"></i> Open Saved Plan</button></li>
                                        <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                                        <li><button className="dropdown-item py-2 fw-bold" onClick={handleExportJson}><i className="bi bi-download text-success me-2"></i> Export to PC (.json)</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-warning" onClick={() => { setFileMenuOpen(false); plannerFileInputRef.current?.click(); }}><i className="bi bi-upload me-2"></i> Load from PC (.json)</button></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-info" onClick={() => { setFileMenuOpen(false); setPastedJsonText(''); setShowPasteJsonModal(true); }}><i className="bi bi-clipboard-check me-2"></i> Paste JSON Plan</button></li>
                                        <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                                        <li><button className="dropdown-item py-2 fw-bold text-danger" onClick={() => { setShowResetConfirm(true); setFileMenuOpen(false); }}><i className="bi bi-trash3-fill me-2"></i> Reset Current Plan</button></li>
                                    </ul>
                                )}
                            </div>

                            {/* VERSION BADGE */}
                            <span 
                                className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1.5 rounded-pill fw-bold shadow-sm" 
                                style={{ fontSize: '0.75rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}
                                title={`Planfolio Version ${ENGINE_VERSION}`}
                            >
                                v{ENGINE_VERSION}
                            </span>
                        </div>
                    )}

                    {/* 3. RIGHT: Tools & Profile */}
                    <div className="d-flex align-items-center gap-2 justify-content-end" style={{ flexShrink: 0 }}>
                        {activeModule === 'expenses' && <ExpenseHeaderActions showToast={showToast} />}

                        {/* TODAY'S $ TOGGLE */}
                        {activeModule === 'planner' && (
                            <div className="d-flex align-items-center bg-input border border-secondary rounded-pill px-3 shadow-sm transition-all d-none d-sm-flex" style={{ height: '36px' }} title="Toggle Real vs Nominal Dollars.">
                                <div className="form-check form-switch mb-0 d-flex align-items-center p-0 m-0">
                                    <input className="form-check-input m-0 cursor-pointer shadow-none" type="checkbox" id="useRealDollars" checked={data.useRealDollars ?? false} onChange={(e) => updateUseRealDollars(e.target.checked)} />
                                    <label className="form-check-label small fw-bold text-info ms-2 cursor-pointer d-none d-xl-block" style={{ paddingTop: '2px' }} htmlFor="useRealDollars">Today's $</label>
                                </div>
                            </div>
                        )}

                        {/* LANGUAGE TOGGLE [EN | FR] */}
                        <button 
                            type="button" 
                            className="btn btn-outline-secondary rounded-pill bg-input d-flex align-items-center justify-content-center shadow-sm px-2.5 fw-bold" 
                            style={{ height: '36px', fontSize: '0.78rem' }}
                            onClick={toggleLanguage}
                            title="Toggle Language / Changer de langue"
                        >
                            <i className="bi bi-translate me-1.5 text-primary"></i>
                            <span className={lang === 'en' ? 'text-primary' : 'text-muted'}>EN</span>
                            <span className="text-secondary opacity-50 mx-1">|</span>
                            <span className={lang === 'fr' ? 'text-primary' : 'text-muted'}>FR</span>
                        </button>

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

            {/* ========================================== */}
            {/* PLANNER MODALS                             */}
            {/* ========================================== */}

            {/* RENAME MODAL */}
            {showRenameModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1060 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowRenameModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{ zIndex: 1070 }}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center">
                                    <i className="bi bi-pencil-square text-warning me-2"></i> Rename Plan
                                </h6>
                                <button type="button" className="btn-close" onClick={() => setShowRenameModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                <label className="form-label small text-muted fw-bold">Plan Name</label>
                                <input 
                                    type="text" 
                                    className="form-control bg-input border-secondary fw-bold text-main mb-3" 
                                    value={renameInputVal} 
                                    onChange={e => setRenameInputVal(e.target.value)} 
                                    placeholder="Enter new plan name..." 
                                    autoFocus 
                                    onKeyDown={e => e.key === 'Enter' && executeRename(activePlanName, renameInputVal)} 
                                />
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary w-50 fw-bold rounded-pill" onClick={() => setShowRenameModal(false)}>Cancel</button>
                                    <button className="btn btn-warning w-50 fw-bold rounded-pill text-dark" onClick={() => executeRename(activePlanName, renameInputVal)}>Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SAVE MODAL */}
            {showSaveModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowSaveModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{ zIndex: 1060 }}>
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

            {/* OPEN SAVED PLAN MODAL */}
            {showLoadModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowLoadModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered position-relative" style={{ zIndex: 1060 }}>
                        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4">
                            <div className="modal-header border-bottom border-secondary p-3">
                                <h6 className="modal-title fw-bold d-flex align-items-center"><i className="bi bi-folder2-open text-info me-2"></i> Open Saved Plan</h6>
                                <button type="button" className="btn-close" onClick={() => setShowLoadModal(false)}></button>
                            </div>
                            <div className="modal-body p-4">
                                {savedPlans.length === 0 ? (
                                    <div className="text-center text-muted small fst-italic py-3">No saved plans found in this browser.</div>
                                ) : (
                                    <div className="d-flex flex-column gap-2 pe-1" style={{ maxHeight: '300px', overflowY: 'auto' }}>
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

            {/* PASTE JSON MODAL */}
            {showPasteJsonModal && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1050 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowPasteJsonModal(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-lg position-relative" style={{ zIndex: 1060 }}>
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

            {/* CONFIRM LOAD MODAL */}
            {planToLoad && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setPlanToLoad(null)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{ zIndex: 1080 }}>
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

            {/* CONFIRM DELETE MODAL */}
            {planToDelete && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setPlanToDelete(null)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{ zIndex: 1080 }}>
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

            {/* CONFIRM RESET MODAL */}
            {showResetConfirm && (
                <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1070 }}>
                    <div className="position-fixed top-0 start-0 w-100 h-100" onClick={() => setShowResetConfirm(false)}></div>
                    <div className="modal-dialog modal-dialog-centered modal-sm position-relative" style={{ zIndex: 1080 }}>
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