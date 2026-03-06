'use client'; 

import React, { useState, useEffect, useRef } from 'react';
import PlanTab from '../components/PlanTab';
import StrategyTab from '../components/StrategyTab';
import DashboardTab from '../components/DashboardTab';
import ProjectionTab from '../components/ProjectionTab';
import RiskTab from '../components/RiskTab';
import CashFlowTab from '../components/CashFlowTab';
import OptimizersTab from '../components/OptimizersTab';
import CompareTab from '../components/CompareTab';
import { FinanceProvider, useFinance } from '../lib/FinanceContext';
import { signIn, signOut, useSession } from 'next-auth/react';

// --- TYPABLE STEPPER ---
const StepperInput = ({ value, onChange, min, max, suffix = "" }: any) => {
    const numVal = Number(value) || 0; 
    const [textVal, setTextVal] = useState(numVal.toString());

    useEffect(() => {
        setTextVal(numVal.toString());
    }, [numVal]);

    const handleDec = () => { if (numVal > min) onChange(numVal - 1); };
    const handleInc = () => { if (numVal < max) onChange(numVal + 1); };

    const handleBlur = () => {
        let parsed = parseInt(textVal);
        if (isNaN(parsed)) parsed = numVal;
        parsed = Math.max(min, Math.min(max, parsed)); 
        setTextVal(parsed.toString());
        onChange(parsed);
    };

    const handleKeyDown = (e: any) => {
        if (e.key === 'Enter') {
            e.target.blur(); 
        }
    };

    return (
        <div className="d-inline-flex align-items-center bg-input border border-secondary rounded-pill p-1 shadow-sm">
            <button type="button" className="btn btn-sm btn-link text-muted p-0 px-2 d-flex align-items-center text-decoration-none hover-opacity-100" onClick={handleDec}><i className="bi bi-dash-circle-fill fs-5"></i></button>
            <div className="d-flex align-items-center justify-content-center">
                <input 
                    type="text" 
                    className="bg-transparent border-0 text-center fw-bold text-main p-0 m-0" 
                    style={{ width: '30px', outline: 'none', boxShadow: 'none', fontSize: '0.95rem' }}
                    value={textVal}
                    onChange={(e) => setTextVal(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                />
                {suffix && <span className="text-muted fw-bold pe-1" style={{fontSize: '0.95rem'}}>{suffix}</span>}
            </div>
            <button type="button" className="btn btn-sm btn-link text-primary p-0 px-2 d-flex align-items-center text-decoration-none hover-opacity-100" onClick={handleInc}><i className="bi bi-plus-circle-fill fs-5"></i></button>
        </div>
    );
};

// --- SMART TOOLTIP ---
const InfoBtn = ({ title, text, align = 'center' }: { title: string, text: string, align?: 'center'|'right'|'left' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { top: '140%', backgroundColor: 'var(--bg-card)', minWidth: '280px' };
    if (align === 'right') { posStyles.right = '0'; }
    else if (align === 'left') { posStyles.left = '0'; }
    else { posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }
    return (
        <div className="position-relative d-inline-flex align-items-center ms-2" style={{zIndex: open ? 1050 : 1}}>
            <button type="button" className="btn btn-link p-0 text-muted info-btn text-decoration-none" onClick={(e) => { e.preventDefault(); setOpen(!open); }} onBlur={() => setTimeout(() => setOpen(false), 200)}>
                <i className="bi bi-info-circle" style={{fontSize: '0.85rem'}}></i>
            </button>
            {open && (
                <div className="position-absolute border border-secondary rounded-3 shadow-lg p-3 text-none-uppercase text-start" style={posStyles}>
                    <h6 className="fw-bold mb-2 text-main border-bottom border-secondary pb-1 text-capitalize" style={{fontSize: '0.85rem'}}>{title}</h6>
                    <div className="small text-muted fw-normal text-none-uppercase" style={{fontSize: '0.75rem', lineHeight: '1.5', whiteSpace: 'normal', textTransform: 'none'}} dangerouslySetInnerHTML={{__html: text}}></div>
                </div>
            )}
        </div>
    );
};

function DashboardLayout() {
  const { data: session } = useSession();
  const financeContext = useFinance() as any; 
  const { data, updateUseRealDollars, updateInput, resetData } = financeContext;
  
  const [activeTab, setActiveTab] = useState('plan');
  const [theme, setTheme] = useState('dark');
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
  const [retireSameTime, setRetireSameTime] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activePlanName, setActivePlanName] = useState('Untitled Plan');
  const [savedPlans, setSavedPlans] = useState<string[]>([]);
  const [newPlanName, setNewPlanName] = useState('');
  
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showPasteJsonModal, setShowPasteJsonModal] = useState(false);
  const [pastedJsonText, setPastedJsonText] = useState('');
  const [planToLoad, setPlanToLoad] = useState<string | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
  }, [theme]);

  useEffect(() => {
      const currentName = localStorage.getItem('active_plan_name') || 'Untitled Plan';
      setActivePlanName(currentName);
      setNewPlanName(currentName === 'Untitled Plan' ? '' : currentName);
      const plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
      setSavedPlans(plans);
  }, []);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 3000);
  };

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
          if (planDataStr) {
              const planData = JSON.parse(planDataStr);
              if (financeContext.loadData) {
                  financeContext.loadData(planData); 
                  localStorage.setItem('active_plan_name', planToLoad);
                  setActivePlanName(planToLoad);
                  showToast(`Loaded ${planToLoad}`);
              }
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
              const fileContent = event.target?.result as string;
              const parsedData = JSON.parse(fileContent);
              
              if (!parsedData.inputs) throw new Error("Invalid plan data structure");

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

          } catch (err) {
              console.error("Import Error:", err);
              alert("Error loading file. Please ensure it is a valid JSON file.");
          }
      };
      reader.readAsText(file);
      
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
      setFileMenuOpen(false);
  };

  const handleLoadFromPaste = () => {
      if (!pastedJsonText.trim()) return;
      try {
          const parsedData = JSON.parse(pastedJsonText);
          if (!parsedData.inputs) throw new Error("Invalid plan data structure");

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
      } catch (err) {
          console.error("Paste Import Error:", err);
          alert("Error loading pasted text. Please ensure it is valid JSON data from this app.");
      }
  };

  const confirmReset = () => {
      if (resetData) {
          resetData();
      }
      localStorage.setItem('active_plan_name', 'Untitled Plan');
      setActivePlanName('Untitled Plan');
      setShowResetConfirm(false);
      showToast("Current plan has been reset.");
  };

  const handleRetireAgeChange = (player: 'p1'|'p2', newAge: number) => {
      updateInput(`${player}_retireAge`, newAge);
      if (retireSameTime && data.mode === 'Couple') {
          const p1Yob = parseInt((data.inputs.p1_dob || "1990").split('-')[0]);
          const p2Yob = parseInt((data.inputs.p2_dob || "1990").split('-')[0]);
          if (player === 'p1') {
              updateInput('p2_retireAge', (p1Yob + newAge) - p2Yob);
          } else {
              updateInput('p1_retireAge', (p2Yob + newAge) - p1Yob);
          }
      }
  };

  const tabs = [
    { id: 'plan', label: 'Inputs', icon: 'bi-pencil-square' },
    { id: 'strategy', label: 'Strategy', icon: 'bi-sliders' },
    { id: 'dashboard', label: 'Summary', icon: 'bi-clipboard2-data' },
    { id: 'projection', label: 'Projection', icon: 'bi-table' },
    { id: 'risk', label: 'Risk', icon: 'bi-activity' },
    { id: 'cashflow', label: 'Cash Flow', icon: 'bi-diagram-3' },
    { id: 'optimizers', label: 'Tools & Calculators', icon: 'bi-magic' },
    { id: 'compare', label: 'Compare', icon: 'bi-bar-chart-line' }
  ];

  return (
    <div className="container-fluid py-4 min-vh-100 transition-all position-relative d-flex flex-column" style={{ maxWidth: '1700px' }}>
      
      <input 
          type="file" 
          accept=".json" 
          className="d-none" 
          ref={fileInputRef} 
          onChange={handleLoadJson} 
      />

      {toastMsg && (
          <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{zIndex: 1060}}>
              <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                  <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                  {toastMsg}
              </div>
          </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="d-flex flex-wrap justify-content-between align-items-center shadow-sm mb-4 rounded-4 p-2 p-md-3 border border-secondary rp-card mb-0 gap-3">
        
        {/* LEFT: Branding & File Management */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <h4 className="mb-0 text-nowrap fw-bold d-flex align-items-center me-1">
            <i className="bi bi-graph-up-arrow text-primary me-2 fs-4"></i>
            <span className="d-none d-lg-inline fs-5">Retirement Planner</span>
          </h4>
          
          {/* File Menu combined with Active Plan Name */}
          <div className="position-relative">
            <button 
                className="btn btn-sm btn-outline-secondary bg-input d-flex align-items-center fw-bold rounded-pill px-3 shadow-sm transition-all" 
                type="button" 
                onClick={() => setFileMenuOpen(!fileMenuOpen)} 
                style={{ height: '40px' }}
            >
                <i className="bi bi-folder2-open text-primary me-2 fs-6"></i>
                <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>{activePlanName}</span>
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
                        <li>
                            <button className="dropdown-item py-2 fw-bold text-warning" onClick={() => { setFileMenuOpen(false); fileInputRef.current?.click(); }}>
                                <i className="bi bi-upload me-2"></i> Load from PC (.json)
                            </button>
                        </li>
                        <li>
                            <button className="dropdown-item py-2 fw-bold text-info" onClick={() => { setFileMenuOpen(false); setPastedJsonText(''); setShowPasteJsonModal(true); }}>
                                <i className="bi bi-clipboard-check me-2"></i> Paste JSON Plan
                            </button>
                        </li>
                        <li><hr className="dropdown-divider border-secondary opacity-25" /></li>
                        <li><button className="dropdown-item py-2 fw-bold text-danger" onClick={() => { setShowResetConfirm(true); setFileMenuOpen(false); }}><i className="bi bi-trash3-fill me-2"></i> Reset Current Plan</button></li>
                    </ul>
                </>
            )}
          </div>
        </div>
        
        {/* RIGHT: Global Utilities & Display Toggles */}
        <div className="d-flex align-items-center gap-2">
          
          {/* Today's Dollar Toggle (Pill) */}
          <div 
              className="d-flex align-items-center bg-input border border-secondary rounded-pill px-3 shadow-sm transition-all" 
              style={{ height: '40px' }} 
              title="Toggle Real vs Nominal Dollars. When enabled, future values are discounted by inflation to show today's purchasing power."
          >
              <div className="form-check form-switch mb-0 d-flex align-items-center p-0 m-0">
                  <input 
                      className="form-check-input m-0 cursor-pointer shadow-none" 
                      type="checkbox" 
                      id="useRealDollars" 
                      checked={data.useRealDollars ?? false} 
                      onChange={(e) => updateUseRealDollars(e.target.checked)} 
                  />
                  <label className="form-check-label small fw-bold text-info ms-2 cursor-pointer d-none d-md-block pt-1" htmlFor="useRealDollars">
                      Today's $
                  </label>
              </div>
          </div>

          {/* Theme Toggle (Circular) */}
          <button 
              type="button"
              className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all" 
              style={{ width: '40px', height: '40px' }} 
              onClick={toggleTheme} 
              title="Toggle Light/Dark Mode"
          >
              <i className={`fs-5 ${theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi-moon-fill text-primary'}`}></i>
          </button>

          {/* Ko-fi Support Button (Circular) */}
          <a 
              href="https://ko-fi.com/P5P11UYZUD" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all" 
              style={{ width: '40px', height: '40px' }}
              title="Support me on Ko-fi"
          >
              <i className="bi bi-cup-hot-fill fs-5" style={{ color: '#72a4f2' }}></i>
          </a>

          {/* Google Login (Greyed out Circular) */}
          {session ? (
            <div className="position-relative cursor-pointer" onClick={() => signOut()} title="Sign Out">
                {session.user?.image ? (
                    <img src={session.user.image} alt="User" className="rounded-circle shadow-sm border border-secondary" width="40" height="40" />
                ) : (
                    <button className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm" style={{ width: '40px', height: '40px' }}>
                        <i className="bi bi-person-fill fs-5"></i>
                    </button>
                )}
            </div>
          ) : (
              <button 
                  disabled 
                  className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm opacity-50" 
                  style={{ width: '40px', height: '40px', cursor: 'not-allowed' }} 
                  title="Sign in is temporarily disabled"
              >
                  <i className="bi bi-google fs-5"></i> 
              </button>
          )}
          
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-pills nav-fill gap-2 flex-nowrap overflow-auto hide-scrollbar m-0 px-1" style={{ cursor: 'pointer' }}>
            {tabs.map(tab => (
              <li className="nav-item flex-fill" key={tab.id}>
                <div 
                  className={`nav-link rounded-3 fw-bold transition-all d-flex align-items-center justify-content-center py-2 px-3 border ${activeTab === tab.id ? 'bg-primary text-white border-primary shadow' : 'bg-input text-muted border-secondary opacity-75'}`} 
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon} me-2 ${activeTab === tab.id ? 'text-white' : ''}`}></i>
                  <span className="text-nowrap">{tab.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="row g-4 flex-grow-1">
        <div className="col-12">
          <div className="card shadow-sm mb-2 h-100 rounded-4 border-0 bg-transparent">
            {/* APPLY FADE-IN ANIMATION AND KEY HERE */}
            <div className="card-body p-0 fade-in-tab" key={activeTab}>
              {activeTab === 'plan' && <PlanTab />}
              {activeTab === 'strategy' && <StrategyTab />}
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'projection' && <ProjectionTab />}
              {activeTab === 'risk' && <RiskTab />}
              {activeTab === 'cashflow' && <CashFlowTab />}
              {activeTab === 'optimizers' && <OptimizersTab />}
              {activeTab === 'compare' && <CompareTab />}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto pt-5 pb-3 border-top border-secondary border-opacity-50 text-center">
          <div className="px-3" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <p className="text-muted mb-3 text-start text-md-center" style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>
                  <strong>Disclaimer:</strong> Retirement Planner Pro is a simulation tool intended strictly for educational, informational, and personal use. It does not constitute professional financial, tax, or legal advice. While we strive for mathematical accuracy, tax laws and economic variables are complex and subject to change. You must verify all calculations and consult with a certified financial planner or tax professional before making any financial decisions. The developer(s) assume no liability for any actions taken based on this tool.
              </p>
              <p className="text-muted mb-3" style={{ fontSize: '0.75rem' }}>
                  This tool is for <strong>personal use only</strong>. For commercial use, integration, or licensing inquiries, please contact the developer.
              </p>
              <p className="text-muted fw-bold ls-1" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-shield-check text-success me-1"></i> Retirement Planner Pro © {new Date().getFullYear()}. Data is processed securely and locally.
              </p>
          </div>
      </footer>

      {/* --- MODALS --- */}
      {/* ... (Modals remain unchanged) ... */}
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
                          <textarea 
                              className="form-control bg-input border-secondary text-main mb-3" 
                              rows={10} 
                              value={pastedJsonText} 
                              onChange={e => setPastedJsonText(e.target.value)} 
                              placeholder="Paste your JSON data here..." 
                              autoFocus 
                          ></textarea>
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

      {/* Quick Adjust Floating Overlay */}
      {showQuickAdjust && (
          <div className="position-fixed border border-secondary shadow-lg rounded-4 p-3 transition-all" 
               style={{ 
                   bottom: '100px', 
                   right: '30px', 
                   zIndex: 1040, 
                   minWidth: '280px', 
                   backgroundColor: theme === 'dark' ? '#16181d' : '#ffffff', 
                   boxShadow: '0 15px 50px rgba(0,0,0,0.6)' 
               }}>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary">
                  <h6 className="mb-0 fw-bold text-info text-uppercase ls-1" style={{fontSize: '0.8rem'}}>
                      <i className="bi bi-sliders me-2"></i>Quick Adjust
                  </h6>
              </div>
              {data.mode === 'Couple' && (
                  <div className="form-check form-switch mb-3 pb-3 border-bottom border-secondary border-opacity-50 d-flex align-items-center justify-content-between px-0">
                      <label className="form-check-label small fw-bold text-muted cursor-pointer" htmlFor="syncRetire">Retire at same time</label>
                      <input className="form-check-input ms-0 mt-0 cursor-pointer" type="checkbox" id="syncRetire" checked={retireSameTime} onChange={e => setRetireSameTime(e.target.checked)} />
                  </div>
              )}
              <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-muted small me-3">P1 Retire Age</span>
                      <StepperInput min={data.inputs.p1_age ?? 18} max={data.inputs.p1_lifeExp ?? 90} value={data.inputs.p1_retireAge ?? 60} onChange={(val: any) => handleRetireAgeChange('p1', val)} />
                  </div>
                  {data.mode === 'Couple' && (
                      <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-bold text-muted small me-3">P2 Retire Age</span>
                          <StepperInput min={data.inputs.p2_age ?? 18} max={data.inputs.p2_lifeExp ?? 90} value={data.inputs.p2_retireAge ?? 60} onChange={(val: any) => handleRetireAgeChange('p2', val)} />
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button 
        className="btn btn-primary rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center hover-opacity-100 transition-all" 
        style={{ width: '60px', height: '60px', bottom: '30px', right: '30px', zIndex: 1050 }}
        title="Quick Adjust Variables"
        onClick={() => setShowQuickAdjust(!showQuickAdjust)}
      >
        <i className={`bi ${showQuickAdjust ? 'bi-x-lg' : 'bi-sliders'} fs-4`}></i>
      </button>

    </div>
  );
}

export default function RetirementDashboard() {
  return (
    <FinanceProvider>
      <DashboardLayout />
    </FinanceProvider>
  );
}