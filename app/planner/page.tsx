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
import { StepperInput, PercentInput } from '../../components/SharedUI'; 

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

    const response = await fetch('/api/auth/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: feedbackText })
    });

    if (response.ok) {
        setSendSuccess(true);
        setTimeout(() => {
            setShowFeedbackModal(false);
            setSendSuccess(false);
            setFeedbackText('');
        }, 2000);
    }
    setIsSending(false);
  };

  const tabs = [
    { id: 'plan', label: '1. Plan', icon: 'bi-pencil-square' },
    { id: 'strategy', label: '2. Strategy', icon: 'bi-sliders2' },
    { id: 'dashboard', label: '3. Dashboard', icon: 'bi-speedometer2' },
    { id: 'projection', label: '4. Projections', icon: 'bi-graph-up' },
    { id: 'risk', label: '5. Risk', icon: 'bi-shield-check' },
    { id: 'cashflow', label: '6. Cash Flow', icon: 'bi-cash-stack' },
    { id: 'optimizers', label: '7. Optimizers', icon: 'bi-magic' },
    { id: 'compare', label: '8. Compare', icon: 'bi-layout-split' }
  ];

  return (
    <div 
        className="container-fluid d-flex flex-column min-vh-100" 
        style={{ paddingLeft: 'clamp(1rem, 8vw, 15rem)', paddingRight: 'clamp(1rem, 8vw, 15rem)' }}
    >
      <SplashScreen onLoadDummyData={handleLoadDummyData} onStartBlankPlan={handleStartBlankPlan} />

      {/* --- STICKY NAVIGATION TABS (KUMO CENTRALIZED) --- */}
      <div className="planner-tabs-bar shadow-sm">
          <div className="row fade-in">
              <div className="col-12">
              <ul className="nav-pills-kumo hide-scrollbar">
                  {tabs.map(tab => (
                  <li className="nav-item" key={tab.id}>
                      <button 
                        type="button"
                        className={`nav-link w-100 ${activeTab === tab.id ? 'active' : ''}`} 
                        onClick={() => setActiveTab(tab.id)}
                      >
                        <i className={`bi ${tab.icon}`}></i>
                        <span>{tab.label}</span>
                      </button>
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
                  />
                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={() => setShowFeedbackModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-sm btn-primary px-3 fw-bold" disabled={isSending}>
                      {isSending ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}