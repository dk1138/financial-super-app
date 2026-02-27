'use client'; 

import React, { useState } from 'react';
import PlanTab from '../components/PlanTab';
import StrategyTab from '../components/StrategyTab';
import DashboardTab from '../components/DashboardTab';
import ProjectionTab from '../components/ProjectionTab';
import RiskTab from '../components/RiskTab';
import CashFlowTab from '../components/CashFlowTab';
import OptimizersTab from '../components/OptimizersTab';
import CompareTab from '../components/CompareTab';
import { FinanceProvider } from '../lib/FinanceContext';

export default function RetirementDashboard() {
  const [activeTab, setActiveTab] = useState('plan');
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  const tabs = [
    { id: 'plan', label: 'Inputs', icon: 'bi-pencil-square' },
    { id: 'strategy', label: 'Strategy', icon: 'bi-sliders' },
    { id: 'dashboard', label: 'Summary', icon: 'bi-clipboard2-data' },
    { id: 'projection', label: 'Projection', icon: 'bi-table' },
    { id: 'risk', label: 'Risk (Monte Carlo)', icon: 'bi-activity' },
    { id: 'cashflow', label: 'Cash Flow', icon: 'bi-diagram-3' },
    { id: 'optimizers', label: 'Optimizers', icon: 'bi-magic' },
    { id: 'compare', label: 'Compare', icon: 'bi-bar-chart-line' }
  ];

  return (
    <FinanceProvider>
      <div className="container-fluid py-4 min-h-screen transition-all" style={{ maxWidth: '1700px' }}>
        
        {/* Main Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center shadow-sm gap-3 mb-4 rounded-4 p-3 border border-secondary rp-card mb-0">
          <div className="d-flex align-items-center flex-wrap gap-3">
            <h4 className="mb-0 text-nowrap fw-bold d-flex align-items-center">
              <i className="bi bi-graph-up-arrow text-primary me-3 fs-3"></i>Retirement Planner
            </h4>
          </div>
          
          <div className="d-flex align-items-center flex-wrap gap-3">
            <div className="form-check form-switch mb-0 d-flex align-items-center me-2">
               <input className="form-check-input mt-0" type="checkbox" id="useRealDollars" />
               <label className="form-check-label small text-nowrap fw-bold text-info ms-2" htmlFor="useRealDollars">Today's $</label>
            </div>
            
            <button 
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center bg-input" 
                style={{ width: '40px', height: '40px' }} 
                onClick={toggleTheme} 
                title="Toggle Light/Dark Mode"
            >
              <i className={theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi bi-moon-fill text-primary'}></i>
            </button>

            <button className="btn btn-primary fw-bold">
               <i className="bi bi-file-earmark-text me-2"></i>File
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="row mb-4">
          <div className="col-12">
            <ul className="nav nav-tabs border-0 flex-nowrap overflow-auto m-0 hide-scrollbar pt-2" style={{ cursor: 'pointer' }}>
              {tabs.map(tab => (
                <li className="nav-item" key={tab.id}>
                  <span 
                    className={`nav-link border-0 rounded-top ${activeTab === tab.id ? 'active surface-card border-bottom border-primary border-3 fw-bold text-main' : 'text-muted'}`} 
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <i className={`bi ${tab.icon} me-2`}></i>{tab.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Tab Content Rendering */}
        <div className="row g-4">
          <div className="col-12">
            <div className="card shadow-sm mb-5 h-100 rounded-bottom-4 rounded-end-4" style={{ borderTopLeftRadius: 0 }}>
              <div className="card-body p-0">
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

      </div>
    </FinanceProvider>
  );
}