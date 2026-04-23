'use client'; 

import React, { useState, useEffect } from 'react';
import PlanTab from '../../components/PlanTab';
import StrategyTab from '../../components/StrategyTab';
import DashboardTab from '../../components/DashboardTab';
import ProjectionTab from '../../components/ProjectionTab';
import RiskTab from '../../components/RiskTab';
import CashFlowTab from '../../components/CashFlowTab';
import OptimizersTab from '../../components/OptimizersTab';
import CompareTab from '../../components/CompareTab';
import { useFinance } from '../../lib/FinanceContext';
import { StepperInput } from '../../components/SharedUI'; 

import SplashScreen from '../../components/SplashScreen';
import { sampleProfile } from '../../lib/sampleData';

export default function PlannerPage() {
  const financeContext = useFinance() as any; 
  const { data, updateInput, updateMultipleInputs, resetData } = financeContext;
  
  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState('plan');
  const [showQuickAdjust, setShowQuickAdjust] = useState(false);
  
  // --- FEEDBACK STATE ---
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const isCouple = data.mode === 'Couple';

  // --- SET PAGE TITLE ---
  useEffect(() => {
      document.title = "Planfolio - Planner";
  }, []);

  // --- HANDLERS ---
  const handleStartBlankPlan = () => {
      if (resetData) resetData();
      localStorage.setItem('active_plan_name', 'Untitled Plan');
      window.dispatchEvent(new CustomEvent('updateActivePlan', { detail: 'Untitled Plan' }));
      setActiveTab('plan'); 
  };

  const handleLoadDummyData = () => {
      if (financeContext.loadData) {
          financeContext.loadData(sampleProfile);
          const sampleName = "Sarah & John (Sample)";
          localStorage.setItem('active_plan_name', sampleName);
          window.dispatchEvent(new CustomEvent('updateActivePlan', { detail: sampleName }));
      }
      setActiveTab('dashboard'); 
  };

  const handleRetireAgeChange = (player: 'p1'|'p2', newRetAge: number) => {
      const updates: Record<string, any> = { [`${player}_retireAge`]: newRetAge };
      if (newRetAge > (data.inputs[`${player}_lifeExp`] || 90)) {
          updates[`${player}_lifeExp`] = newRetAge;
      }
      if (isCouple && data.inputs.retire_same_time) {
          const playerAge = data.inputs[`${player}_age`] ?? (player === 'p1' ? 38 : 34);
          const yearsToRetire = newRetAge - playerAge;
          const otherPlayer = player === 'p1' ? 'p2' : 'p1';
          const otherAge = data.inputs[`${otherPlayer}_age`] ?? (player === 'p1' ? 34 : 38);
          const otherNewRetAge = Math.max(18, otherAge + yearsToRetire);
          
          updates[`${otherPlayer}_retireAge`] = otherNewRetAge;
          if (otherNewRetAge > (data.inputs[`${otherPlayer}_lifeExp`] || 90)) {
              updates[`${otherPlayer}_lifeExp`] = otherNewRetAge;
          }
      }
      updateMultipleInputs(updates);
  };

  const handleSyncToggle = (checked: boolean) => {
      if (checked) {
          const p1Age = data.inputs.p1_age ?? 38;
          const p1Ret = data.inputs.p1_retireAge ?? 60;
          const p2Age = data.inputs.p2_age ?? 34;
          const yearsToRetire = p1Ret - p1Age;
          const newP2Ret = Math.max(18, p2Age + yearsToRetire);
          
          const updates: Record<string, any> = { 
              retire_same_time: true, 
              p2_retireAge: newP2Ret 
          };
          if (newP2Ret > (data.inputs.p2_lifeExp || 95)) updates.p2_lifeExp = newP2Ret;
          updateMultipleInputs(updates);
      } else {
          updateInput('retire_same_time', false);
      }
  };

    const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const response = await fetch('/api/auth/feedback', { // Make sure this path is correct!
        method: 'POST',
        body: JSON.stringify({ message: feedbackText }),
    });

    if (response.ok) {
        // If the POST was successful, the email was sent!
        // No need to GET or check any IDs.
        setSendSuccess(true);
        setFeedbackText('');
        setTimeout(() => {
        setShowFeedbackModal(false);
        setSendSuccess(false);
        }, 2000);
    }
    setIsSending(false);
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
    <div 
        className="container-fluid d-flex flex-column min-vh-100" 
        style={{ paddingLeft: 'clamp(1rem, 8vw, 15rem)', paddingRight: 'clamp(1rem, 8vw, 15rem)' }}
    >
      <SplashScreen onLoadDummyData={handleLoadDummyData} onStartBlankPlan={handleStartBlankPlan} />

      {/* --- STICKY NAVIGATION TABS --- */}
      <div 
        className="position-sticky pt-2 pb-2 mb-3 shadow-sm" 
        style={{ 
            top: 'var(--global-header-height, 65px)', 
            backgroundColor: 'var(--bg-body)', 
            zIndex: 1030,
            borderBottom: '1px solid var(--border-color)',
            margin: '0 -0.5rem',
            padding: '0 0.5rem'
        }}
      >
          <div className="row fade-in">
              <div className="col-12">
              <ul className="nav nav-pills nav-fill gap-2 flex-nowrap overflow-auto hide-scrollbar m-0 px-1" style={{ cursor: 'pointer' }}>
                  {tabs.map(tab => (
                  <li className="nav-item flex-fill" key={tab.id}>
                      <div 
                      className={`nav-link rounded-3 fw-bold transition-all d-flex align-items-center justify-content-center py-1 px-2 border ${activeTab === tab.id ? 'bg-primary text-white border-primary shadow' : 'bg-input text-muted border-secondary opacity-75'}`} 
                      onClick={() => setActiveTab(tab.id)}
                      style={{ fontSize: '0.85rem' }}
                      >
                      <i className={`bi ${tab.icon} me-2 ${activeTab === tab.id ? 'text-white' : ''}`}></i>
                      <span className="text-nowrap">{tab.label}</span>
                      </div>
                  </li>
                  ))}
              </ul>
              </div>
          </div>
      </div>

      {/* --- TAB CONTENT --- */}
      <div className="row g-4 flex-grow-1">
        <div className="col-12">
          <div className="card shadow-sm mb-2 h-100 rounded-4 border-0 bg-transparent">
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

      {/* --- FOOTER --- */}
      <footer className="mt-auto pt-5 pb-3 border-top border-secondary border-opacity-50 text-center">
          <div className="px-3" style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <p className="text-muted mb-3 text-start text-md-center" style={{ fontSize: '0.75rem', lineHeight: '1.6' }}>
                  <strong>Disclaimer:</strong> Planfolio is a simulation tool intended strictly for educational, informational, and personal use. It does not constitute professional financial, tax, or legal advice.
              </p>
              <p className="text-muted fw-bold ls-1" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-shield-check text-success me-1"></i> Planfolio © {new Date().getFullYear()}. Data is processed securely and locally.
              </p>
          </div>
      </footer>

      {/* --- FEEDBACK MODAL POPUP --- */}
      {showFeedbackModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center px-3" style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-body border border-secondary shadow-lg rounded-4 overflow-hidden fade-in" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0 fw-bold text-uppercase ls-1"><i className="bi bi-chat-left-heart text-primary me-2"></i>Send Feedback</h6>
                <button className="btn-close" onClick={() => setShowFeedbackModal(false)}></button>
              </div>

              {sendSuccess ? (
                <div className="text-center py-4">
                  <div className="text-success fs-1 mb-2"><i className="bi bi-check-circle-fill"></i></div>
                  <h6 className="fw-bold">Feedback Sent!</h6>
                  <p className="text-muted small">Thanks for helping us improve Planfolio.</p>
                </div>
              ) : (
                <form onSubmit={handleSendFeedback}>
                  <textarea 
                    className="form-control bg-input border-secondary mb-3 rounded-3 text-sm" 
                    rows={5} 
                    placeholder="Found a bug? Have a feature request? Let us know..."
                    required
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    style={{ resize: 'none', fontSize: '0.9rem' }}
                  ></textarea>
                  <button 
                    type="submit" 
                    disabled={isSending || !feedbackText.trim()}
                    className="btn btn-primary w-100 fw-bold py-2 rounded-3 d-flex align-items-center justify-content-center gap-2"
                  >
                    {isSending ? (
                      <><span className="spinner-border spinner-border-sm"></span> Sending...</>
                    ) : (
                      <><i className="bi bi-send"></i> Submit Feedback</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- QUICK ADJUST POPUP --- */}
      {showQuickAdjust && (
          <div className="position-fixed border border-secondary shadow-lg rounded-4 p-3 pt-2 transition-all" 
               style={{ bottom: '90px', right: '30px', zIndex: 1040, minWidth: '260px', backgroundColor: 'var(--bg-body)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 mt-1 border-bottom border-secondary">
                  <h6 className="mb-0 fw-bold text-info text-uppercase ls-1" style={{fontSize: '0.7rem'}}><i className="bi bi-sliders me-2"></i>Quick Adjust</h6>
              </div>
              {isCouple && (
                  <div className="form-check form-switch mb-2 pb-2 border-bottom border-secondary border-opacity-50 d-flex align-items-center justify-content-between px-0">
                      <label className="form-check-label fw-bold text-muted cursor-pointer text-nowrap" style={{fontSize: '0.75rem'}} htmlFor="syncRetireFAB">Retire at same time</label>
                      <input className="form-check-input ms-0 mt-0 cursor-pointer flex-shrink-0" style={{transform: 'scale(0.8)'}} type="checkbox" id="syncRetireFAB" checked={data.inputs.retire_same_time ?? false} onChange={e => handleSyncToggle(e.target.checked)} />
                  </div>
              )}
              <div className="d-flex flex-column gap-2">
                  <div className="d-flex justify-content-between align-items-center gap-2">
                      <span className="fw-bold text-muted text-nowrap" style={{fontSize: '0.75rem'}}>P1 Retire Age</span>
                      <div style={{width: '120px'}}><StepperInput min={data.inputs.p1_age ?? 18} max={data.inputs.p1_lifeExp ?? 90} value={data.inputs.p1_retireAge ?? 60} onChange={(val: any) => handleRetireAgeChange('p1', val)} /></div>
                  </div>
                  {isCouple && (
                      <div className="d-flex justify-content-between align-items-center gap-2">
                          <span className="fw-bold text-muted text-nowrap" style={{fontSize: '0.75rem'}}>P2 Retire Age</span>
                          <div style={{width: '120px'}}><StepperInput disabled={data.inputs.retire_same_time} min={data.inputs.p2_age ?? 18} max={data.inputs.p2_lifeExp ?? 90} value={data.inputs.p2_retireAge ?? 60} onChange={(val: any) => handleRetireAgeChange('p2', val)} /></div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- FEEDBACK BUTTON (Right Side, Indigo Pop) --- */}
      <button 
          onClick={() => setShowFeedbackModal(true)}
          className="btn shadow-lg position-fixed d-flex align-items-center justify-content-center hover-opacity-100 transition-all border-0" 
          style={{ 
              width: '48px', 
              height: '48px', 
              bottom: '30px', 
              right: '90px', // Positioned to the left of the Quick Adjust button
              zIndex: 1050,
              backgroundColor: '#6366f1', // Vibrant Indigo (Distinct from Primary Blue)
              color: 'white'
          }} 
          title="Send Feedback"
      >
          <i className="bi bi-chat-left-dots fs-5"></i>
      </button>

      {/* --- QUICK ADJUST BUTTON (Bottom Right, Primary Blue) --- */}
      <button 
          className="btn btn-primary rounded-circle shadow-lg position-fixed d-flex align-items-center justify-content-center hover-opacity-100 transition-all" 
          style={{ 
              width: '48px', 
              height: '48px', 
              bottom: '30px', 
              right: '30px', 
              zIndex: 1050 
          }} 
          title="Quick Adjust Variables" 
          onClick={() => setShowQuickAdjust(!showQuickAdjust)}
      >
          <i className={`bi ${showQuickAdjust ? 'bi-x-lg' : 'bi-sliders'} fs-5`}></i>
      </button>
    </div>
  );
}