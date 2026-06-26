import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn, CurrencyInput, SegmentedControl } from './SharedUI';

const ACCOUNT_MAP: Record<string, { label: string, icon: string, color: string, desc: string, contextDesc?: Record<string, string> }> = {
  tfsa: { 
    label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info', desc: 'Tax-Free Savings Account',
    contextDesc: { shortfall: 'Taps flexible tax shelter; withdrawals recreate contribution room next calendar year.', decum: 'Tax-Free systematic depletion pool.' }
  },
  rrsp: { 
    label: 'RRSP', icon: 'bi-bank2', color: 'text-danger', desc: 'Registered Retirement Savings Plan',
    contextDesc: { shortfall: 'RISK ALERT: Early withdrawal permanently burns room and triggers immediate withholding tax.', decum: 'Taxable systematic income conversions.' }
  },
  fhsa: { label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary', desc: 'First Home Savings Account' },
  nonreg: { 
    label: 'Non-Reg', icon: 'bi-graph-up-arrow', color: 'text-success', desc: 'Taxable Investments',
    contextDesc: { shortfall: 'Liquidates open assets; triggers taxable capital gains or losses.', decum: 'Tax-efficient margin or capital gains draw.' }
  },
  cash: { 
    label: 'Cash / HYSA', icon: 'bi-cash-stack', color: 'text-secondary', desc: 'High-Yield Savings Accounts',
    contextDesc: { shortfall: 'Taps uninvested cash buffer first to preserve compounding assets.', decum: 'Liquid transactional buffer depletion.' }
  },
  crypto: { label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-warning', desc: 'Digital Assets', contextDesc: { shortfall: 'Taps speculative alternative asset positions.', decum: 'Alternative asset run-down.' } },
  resp: { label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple', desc: 'Education Savings Plan' },
  spending_cash: { label: 'Spending Cash', icon: 'bi-bag-heart-fill', color: 'text-warning', desc: 'Unbudgeted Lifestyle Cash' },
  rrif_acct: { label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger', desc: 'Converted RRSP Pool', contextDesc: { shortfall: 'N/A Pre-Retirement', decum: 'Mandatory minimum registered withdrawals.' } },
  lif: { label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary', desc: 'Life Income Fund', contextDesc: { shortfall: 'N/A Pre-Retirement', decum: 'Locked-in retirement payroll conversions.' } },
  lirf: { label: 'LIRA / LIRF', icon: 'bi-lock-fill', color: 'text-muted', desc: 'Locked-In Retirement Account', contextDesc: { shortfall: 'N/A Locked Asset', decum: 'Locked-in supplemental liquidation layers.' } },
};

export default function StrategyTab() {
  const { data, updateInput, updateStrategy, results } = useFinance();
  
  const isCouple = data.mode === 'Couple';
  const isOptimized = data.inputs.fully_optimize_tax ?? false;
  const isSplitLimits = isCouple && (data.inputs.split_annual_limits ?? false);

  // Fallbacks for customized names
  const p1Name = data.inputs.p1_name || 'Player 1';
  const p2Name = data.inputs.p2_name || 'Player 2';

  // --- EMERGENCY FUND MATH ---
  const calcMonthlyExpenses = () => {
      let total = 0;
      Object.values(data.expensesByCategory || {}).forEach((cat: any) => {
          if(cat && cat.items) cat.items.forEach((item: any) => { total += (item.curr || 0) * (item.freq || 12); });
      });
      return total / 12;
  };
  const monthlyExp = calcMonthlyExpenses();
  const efMode = data.inputs.emergency_fund_mode || 'none';
  const efCustomAmt = data.inputs.emergency_fund_custom_amount || 0;
  const showCashDragWarning = efMode === 'custom' && efCustomAmt > 100000;

  // --- 3-WAY INSTANT-SWAP DRAG & DROP ENGINE ---
  const [draggingType, setDraggingType] = useState<'accum' | 'shortfall' | 'decum' | null>(null);
  
  // HARD FILTERS: Prevent structural anomalies across discrete life periods
  const filterAccum = (list: string[]) => {
      const filtered = list.filter(a => !['rrif_acct', 'lif', 'lirf'].includes(a));
      if (!filtered.includes('spending_cash')) {
          filtered.push('spending_cash');
      }
      return filtered;
  };
  const filterShortfall = (list: string[]) => list.filter(a => !['rrif_acct', 'lif', 'lirf', 'fhsa', 'resp', 'spending_cash'].includes(a));
  const filterDecum = (list: string[]) => list.filter(a => !['fhsa', 'resp', 'spending_cash'].includes(a));

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [localAccum, setLocalAccum] = useState<string[]>([]);
  const [localShortfall, setLocalShortfall] = useState<string[]>([]);
  const [localDecum, setLocalDecum] = useState<string[]>([]);

  // Synchronize state loops
  useEffect(() => {
      if (!draggingType) {
          setLocalAccum(filterAccum(data.strategies.accum || []));
          setLocalShortfall(filterShortfall(data.strategies.shortfall || ['cash', 'tfsa', 'nonreg', 'crypto', 'rrsp']));
          setLocalDecum(filterDecum(data.strategies.decum || []));
      }
  }, [data.strategies, draggingType]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, type: 'accum' | 'shortfall' | 'decum') => {
      if (type === 'decum' && isOptimized) return; 
      
      setDraggingType(type);
      setDraggedItemIndex(index);
      
      const target = e.target as HTMLElement;
      setTimeout(() => { target.style.opacity = '0.4'; }, 0);
  };

  const handleDragEnter = (index: number, type: 'accum' | 'shortfall' | 'decum') => {
      if (draggingType !== type || draggedItemIndex === null || draggedItemIndex === index) return;
      if (type === 'decum' && isOptimized) return; 

      let list = [];
      if (type === 'accum') list = [...localAccum];
      else if (type === 'shortfall') list = [...localShortfall];
      else list = [...localDecum];

      const draggedItemContent = list[draggedItemIndex];
      list.splice(draggedItemIndex, 1);
      list.splice(index, 0, draggedItemContent);

      if (type === 'accum') setLocalAccum(list);
      else if (type === 'shortfall') setLocalShortfall(list);
      else setLocalDecum(list);

      setDraggedItemIndex(index); 
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, type: 'accum' | 'shortfall' | 'decum') => {
      if (type === 'decum' && isOptimized) return; 
      
      const target = e.target as HTMLElement;
      target.style.opacity = '1';

      const listToSave = type === 'accum' ? localAccum : (type === 'shortfall' ? localShortfall : localDecum);
      updateStrategy(type, listToSave); 
      setDraggingType(null);
      setDraggedItemIndex(null);
  };

  const renderDraggableList = (type: 'accum' | 'shortfall' | 'decum') => {
    let currentList = type === 'accum' ? localAccum : (type === 'shortfall' ? localShortfall : localDecum);

    if (type === 'decum' && isOptimized) {
        const engineOptimalRoute = results?.timeline?.[0]?.optimalStrategy;
        if (engineOptimalRoute && Array.isArray(engineOptimalRoute) && engineOptimalRoute.length > 0) {
            currentList = filterDecum(engineOptimalRoute); 
        } else {
            const fallbackOrder = ['nonreg', 'cash', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'tfsa', 'crypto'];
            currentList = [...currentList].sort((a, b) => fallbackOrder.indexOf(a) - fallbackOrder.indexOf(b));
        }
    }

    return currentList.map((item: string, index: number) => {
      const details = ACCOUNT_MAP[item] || { label: item, icon: 'bi-wallet', color: 'text-white', desc: '' };
      const isDragging = draggingType === type && draggedItemIndex === index;
      const isLocked = type === 'decum' && isOptimized;
      const displayIndex = (type === 'decum' && isOptimized) ? index + 2 : index + 1;

      const contextualDescription = details.contextDesc?.[type] || details.desc;

      return (
        <div
          key={item}
          draggable={!isLocked}
          onDragStart={!isLocked ? (e) => handleDragStart(e, index, type) : undefined}
          onDragEnter={!isLocked ? () => handleDragEnter(index, type) : undefined}
          onDragEnd={!isLocked ? (e) => handleDragEnd(e, type) : undefined}
          onDragOver={(e) => e.preventDefault()}
          className={`d-flex align-items-center justify-content-between p-3 mb-2 rounded-4 transition-all shadow-sm ${isDragging ? 'border border-primary bg-primary bg-opacity-10 shadow' : 'border border-secondary bg-input hover-bg-secondary hover-bg-opacity-10'}`}
          style={{ cursor: isLocked ? 'default' : (isDragging ? 'grabbing' : 'grab') }}
        >
          <div className="d-flex align-items-center gap-3 flex-grow-1">
            <div className={`d-flex align-items-center justify-content-center ${isLocked ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-25 text-muted'} rounded-circle fw-bold`} style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                {displayIndex}
            </div>
            <div className={`bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center ${details.color} flex-shrink-0`} style={{width: '42px', height: '42px'}}>
                <i className={`bi ${details.icon} fs-5`}></i>
            </div>
            
            {item === 'spending_cash' ? (
              <div className="d-flex align-items-center justify-content-between flex-grow-1 me-2 gap-3">
                <div>
                    <h6 className="mb-0 fw-bold text-main">{details.label}</h6>
                    <div className="small fw-medium text-muted" style={{ fontSize: '0.7rem' }}>
                        {contextualDescription}
                    </div>
                </div>
                <div 
                  className="d-flex align-items-center gap-2" 
                  style={{ maxWidth: '140px' }} 
                  draggable={false}
                  onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="small text-muted fw-bold text-nowrap" style={{ fontSize: '0.65rem' }}>MAX:</span>
                  <CurrencyInput 
                    className="form-control form-control-sm border-secondary shadow-none text-end fw-bold" 
                    value={data.inputs.max_annual_spending_cash || 0} 
                    onChange={(val: any) => updateInput('max_annual_spending_cash', val)} 
                  />
                </div>
              </div>
            ) : (
              <div>
                  <h6 className="mb-0 fw-bold text-main">{details.label}</h6>
                  <div className={`small fw-medium ${isLocked ? 'text-success opacity-75' : (item === 'rrsp' && type === 'shortfall' ? 'text-warning font-semibold' : 'text-muted')}`} style={{ fontSize: '0.7rem' }}>
                      {isLocked ? 'Auto-Managed' : contextualDescription}
                  </div>
              </div>
            )}
          </div>
          
          {isLocked ? (
              <i className="bi bi-lock-fill text-success fs-5 opacity-50 ms-2"></i>
          ) : (
              <i className="bi bi-grip-vertical text-muted fs-4 opacity-50 ms-2"></i>
          )}
        </div>
      );
    });
  };

  const renderLimitField = (label: string, colorClass: string, sharedKey: string, p1Key: string, p2Key: string) => {
    if (isSplitLimits) {
      return (
        <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
          <span className={`small fw-bold ${colorClass} text-uppercase ls-1`}>{label}</span>
          <div className="d-flex flex-column gap-2 mt-1">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-secondary bg-opacity-25 text-muted fw-bold px-2 py-1" style={{ fontSize: '0.6rem', minWidth: '28px' }}>{p1Name}</span>
              <CurrencyInput className="form-control form-control-sm border-secondary shadow-none flex-grow-1" value={data.inputs[p1Key] || 0} onChange={(val: any) => updateInput(p1Key, val)} />
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-purple bg-opacity-10 text-purple fw-bold px-2 py-1" style={{ fontSize: '0.6rem', minWidth: '28px' }}>{p2Name}</span>
              <CurrencyInput className="form-control form-control-sm border-secondary shadow-none flex-grow-1" value={data.inputs[p2Key] || 0} onChange={(val: any) => updateInput(p2Key, val)} />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
        <span className={`small fw-bold ${colorClass} text-uppercase ls-1`}>
          {label} {isCouple ? 'MAX (Combined)' : 'MAX'}
        </span>
        <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs[sharedKey] || 0} onChange={(val: any) => updateInput(sharedKey, val)} />
      </div>
    );
  };

  return (
    <div className="p-3 p-md-4 d-flex flex-column gap-4">
      
      {/* --- SECTION 1: PRIORITY QUEUES --- */}
      <div className="rp-card border border-secondary rounded-4 shadow-sm">
        <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
          <div className="d-flex align-items-center">
            <i className="bi bi-arrow-down-up text-primary fs-4 me-3"></i>
            <h5 className="mb-0 fw-bold text-uppercase ls-1">1. Financial Optimization & Flow Priority Queues</h5>
            <InfoBtn align="left" title="Flow Hierarchies" text="The execution stack segregates optimization pipelines completely across three lifecycle environments. Re-order each stack independently." />
          </div>
        </div>
        <div className="card-header bg-secondary bg-opacity-10 p-4 pb-0 border-0">
            {/* Shortfall Mitigation alert banner layer built using core Bootstrap styling tokens */}
            <div className="alert border-info bg-info bg-opacity-10 rounded-4 p-3 mb-0 d-flex gap-3 align-items-start">
              <div className="bg-info bg-opacity-25 rounded-circle p-2 text-info d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '36px', height: '36px' }}>
                <i className="bi bi-shield-check-fill fs-5"></i>
              </div>
              <div>
                <h6 className="fw-bold mb-1 text-info text-uppercase ls-1" style={{ fontSize: '0.8rem' }}>Guaranteed Alpha Return Safeguard Enabled</h6>
                <p className="small text-muted mb-0 lh-sm" style={{ fontSize: '0.75rem' }}>
                  The engine dynamically isolates your <strong>RRSP Employer Match</strong> as an untouchable baseline priority. If income drops during a high-expense working year, matching payroll allocations are fulfilled as a mandatory constraint. The resulting mid-career expense shortfall is cleared according to your specific <strong>Working-Year Shortfall Hierarchy</strong> stack, protecting matched returns before liquidation occurs.
                </p>
              </div>
            </div>
        </div>

        <div className="card-body p-4 bg-secondary bg-opacity-10">
            <div className="row g-4">
                {/* 1. ACCUMULATION ROUTE */}
                <div className="col-12 col-xl-4">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card">
                        <div className="bg-success bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                            <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                <i className="bi bi-piggy-bank-fill fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-uppercase ls-1 text-success" style={{ fontSize: '0.85rem' }}>Surplus Savings</h6>
                                <span className="small text-muted" style={{fontSize: '0.65rem'}}>Order of filling spaces when surplus cash exists</span>
                            </div>
                        </div>
                        <div className="p-3 bg-transparent h-100">
                            {renderDraggableList('accum')}
                        </div>
                    </div>
                </div>

                {/* 2. WORKING-YEAR SHORTFALL HIERARCHY */}
                <div className="col-12 col-xl-4">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card">
                        <div className="bg-warning bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                            <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                <i className="bi bi-exclamation-triangle-fill fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-uppercase ls-1 text-warning" style={{ fontSize: '0.85rem' }}>Working-Year Shortfalls</h6>
                                <span className="small text-muted" style={{fontSize: '0.65rem'}}>Order of drawing buffers if cash dips mid-career</span>
                            </div>
                        </div>
                        <div className="p-3 bg-transparent h-100">
                            {renderDraggableList('shortfall')}
                        </div>
                    </div>
                </div>

                {/* 3. RETIREMENT DECUMULATION ROUTE */}
                <div className="col-12 col-xl-4">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card position-relative">
                        <div className="bg-primary bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                <i className="bi bi-wallet2 fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-uppercase ls-1 text-primary" style={{ fontSize: '0.85rem' }}>Retirement Decumulation</h6>
                                <span className="small text-muted" style={{fontSize: '0.65rem'}}>Drawdown sequence across terminal years</span>
                            </div>
                        </div>
                        
                        <div 
                            className="p-3 bg-transparent h-100 transition-all" 
                            style={{ 
                                opacity: isOptimized ? 0.7 : 1, 
                                pointerEvents: isOptimized ? 'none' : 'auto'
                            }}
                        >
                            {renderDraggableList('decum')}
                        </div>

                        {/* COMPACT OVERLAY FOR SMART OPTIMIZER */}
                        {isOptimized && (
                            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10, width: 'fit-content', minWidth: '220px' }}>
                                <div className="bg-success bg-opacity-10 border border-success rounded-4 shadow-lg p-3 py-4 px-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ backdropFilter: 'blur(3px)' }}>
                                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm" style={{width: '36px', height: '36px'}}>
                                        <i className="bi bi-lock-fill fs-5"></i>
                                    </div>
                                    <span className="text-uppercase fw-bold text-success ls-1 mb-1" style={{ fontSize: '0.85rem' }}>Optimized & Locked</span>
                                    <span className="small text-muted fw-medium lh-sm" style={{fontSize: '0.7rem'}}>
                                        Engine's tax-efficient route handles this stack.
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- SECTION 2: MAX ANNUAL LIMITS --- */}
      <div className="rp-card border border-secondary rounded-4 shadow-sm">
        <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
          <div className="d-flex align-items-center">
            <i className="bi bi-sliders text-warning fs-4 me-3"></i>
            <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">2. Max Annual Limits</h5>
            <InfoBtn align="left" title="Custom Limits" text="Set a manual upper boundary in flat dollars. Excess cash flows down to the next priority container." />
          </div>
          {isCouple && (
            <div className="form-check form-switch mb-0 d-flex align-items-center gap-2 bg-input border border-secondary py-1 px-3 rounded-pill shadow-sm">
              <label className="form-check-label small fw-bold text-muted cursor-pointer mb-0 text-uppercase ls-1" htmlFor="toggleSplitLimits" style={{ fontSize: '0.65rem' }}>Split {p1Name} / {p2Name}</label>
              <input className="form-check-input cursor-pointer shadow-none m-0 border-secondary" type="checkbox" id="toggleSplitLimits" checked={data.inputs.split_annual_limits ?? false} onChange={(e) => updateInput('split_annual_limits', e.target.checked)} />
            </div>
          )}
        </div>
        <div className="card-body p-4 bg-secondary bg-opacity-10">
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">{renderLimitField('TFSA', 'text-info', 'max_annual_tfsa', 'max_annual_tfsa_p1', 'max_annual_tfsa_p2')}</div>
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">{renderLimitField('RRSP', 'text-danger', 'max_annual_rrsp', 'max_annual_rrsp_p1', 'max_annual_rrsp_p2')}</div>
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">{renderLimitField('FHSA', 'text-primary', 'max_annual_fhsa', 'max_annual_fhsa_p1', 'max_annual_fhsa_p2')}</div>
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">{renderLimitField('Non-Reg', 'text-success', 'max_annual_nonreg', 'max_annual_nonreg_p1', 'max_annual_nonreg_p2')}</div>
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">{renderLimitField('Cash', 'text-secondary', 'max_annual_cash', 'max_annual_cash_p1', 'max_annual_cash_p2')}</div>
            <div className="col-12 col-sm-6 col-md-4 col-xl-2">{renderLimitField('Crypto', 'text-warning', 'max_annual_crypto', 'max_annual_crypto_p1', 'max_annual_crypto_p2')}</div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* --- SECTION 3: ACCOUNT GUIDELINES --- */}
        <div className="col-12 col-xl-5 d-flex flex-column">
            <div className="rp-card border border-secondary rounded-4 shadow-sm flex-grow-1">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-speedometer2 text-info fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">3. Account Guidelines</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10">
                    <div className="row g-3">
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-info text-uppercase ls-1">TFSA</span>
                                    <InfoBtn align="right" title="TFSA Limit" text="The annual contribution room granted by the CRA for a Tax-Free Savings Account." />
                                </div>
                                <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_tfsa_limit} onChange={(val: any) => updateInput('cfg_tfsa_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-danger text-uppercase ls-1">RRSP Max</span>
                                    <InfoBtn align="right" title="RRSP Limit" text="The absolute maximum RRSP contribution cap set by the CRA for the year." />
                                </div>
                                <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_rrsp_limit} onChange={(val: any) => updateInput('cfg_rrsp_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-primary text-uppercase ls-1">FHSA</span>
                                </div>
                                <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_fhsa_limit} onChange={(val: any) => updateInput('cfg_fhsa_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-muted text-uppercase ls-1">Crypto Limit</span>
                                </div>
                                <CurrencyInput suffix="/ yr" className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_crypto_limit} onChange={(val: any) => updateInput('cfg_crypto_limit', val)} />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="small fw-bold text-purple text-uppercase ls-1">RESP Strategy</span>
                                </div>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <label className="small text-muted fw-bold mb-1" style={{fontSize:'0.7rem'}}>Annual Target</label>
                                        <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_resp_limit} onChange={(val: any) => updateInput('cfg_resp_limit', val)} />
                                    </div>
                                    <div className="col-6">
                                        <label className="small text-muted fw-bold mb-1" style={{fontSize:'0.7rem'}}>Stop Age</label>
                                        <div className="d-flex align-items-center position-relative w-100">
                                           <input type="number" className="form-control form-control-sm bg-transparent border border-secondary text-main shadow-none text-end w-100" style={{paddingRight: '35px', fontWeight: '600'}} value={data.inputs.cfg_resp_stop_age !== undefined ? data.inputs.cfg_resp_stop_age : 17} onChange={(e) => updateInput('cfg_resp_stop_age', parseInt(e.target.value) || 0)} max={31} />
                                           <span className="position-absolute text-muted small fw-bold" style={{right: '10px', pointerEvents: 'none', fontSize: '0.8em'}}>Yrs</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* EMERGENCY FUND UI */}
                        <div className="col-12 mt-2 pt-3 border-top border-secondary border-opacity-50">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="fw-bold text-success text-uppercase ls-1">Emergency Fund Buffer</span>
                            </div>
                            <SegmentedControl 
                                value={efMode} 
                                onChange={(val: string) => updateInput('emergency_fund_mode', val)} 
                                options={[
                                    { value: 'none', label: 'None ($0)' },
                                    { value: '3_months', label: '3 Months' },
                                    { value: '6_months', label: '6 Months' },
                                    { value: 'custom', label: 'Custom' }
                                ]} 
                            />
                            <div className="mt-3">
                                {efMode === 'none' && (
                                    <div className="bg-black bg-opacity-25 border border-secondary rounded-3 p-2 text-center text-muted small fst-italic shadow-inner">
                                        $0 reserved. All cash is available for spending or investing.
                                    </div>
                                )}
                                {(efMode === '3_months' || efMode === '6_months') && (
                                    <div className="bg-black bg-opacity-25 border border-secondary rounded-3 p-2 d-flex justify-content-between align-items-center px-3 shadow-inner">
                                        <span className="small text-muted fw-bold">Dynamic Target:</span>
                                        <span className="fw-bold text-success">
                                            {new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(monthlyExp * (efMode === '3_months' ? 3 : 6))}
                                        </span>
                                    </div>
                                )}
                                {efMode === 'custom' && (
                                    <div className="position-relative">
                                        <CurrencyInput className={`form-control border-secondary shadow-none ${showCashDragWarning ? 'border-warning text-warning' : ''}`} value={efCustomAmt} onChange={(val: any) => updateInput('emergency_fund_custom_amount', val)} placeholder="Enter base amount..." />
                                        {showCashDragWarning && (
                                            <div className="d-flex align-items-center mt-2 text-warning small fw-bold">
                                                <i className="bi bi-exclamation-triangle-fill me-2"></i> High cash balances create cash drag.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SECTION 4 & 5: OPTIMIZATIONS & EXCEPTIONS --- */}
        <div className="col-12 col-xl-7 d-flex flex-column gap-4">
            <div className="rp-card border border-secondary rounded-4 shadow-sm">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-cpu text-primary fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">4. Engine Optimizations</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-3">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4 transition-all hover-border-primary">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-success text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-magic me-2 fs-5"></i> Smart RRSP Meltdown & Tax Optimizer
                            </h6>
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Overrides your retirement decumulation order to mathematically minimize lifetime taxes. Proactively draws down RRSPs early to perfectly fill lower brackets.
                            </p>
                        </div>
                        <div className="form-check form-switch mb-0 flex-shrink-0 mt-2 mt-md-0 d-flex align-items-center justify-content-end">
                            <input className="form-check-input mt-0 cursor-pointer shadow-none border-secondary" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={data.inputs.fully_optimize_tax ?? false} onChange={(e) => updateInput('fully_optimize_tax', e.target.checked)} />
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4 transition-all hover-border-info">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-info text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-shield-check me-2 fs-5"></i> Avoid OAS Clawbacks
                            </h6>
                        </div>
                        <div className="form-check form-switch mb-0 flex-shrink-0 mt-2 mt-md-0 d-flex align-items-center justify-content-end">
                            <input className="form-check-input mt-0 cursor-pointer shadow-none border-secondary" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={data.inputs.oas_clawback_optimize ?? false} onChange={(e) => updateInput('oas_clawback_optimize', e.target.checked)} />
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4 transition-all hover-border-warning">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-warning text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-arrow-down-up me-2 fs-5"></i> Variable Spending (Guardrails)
                            </h6>
                        </div>
                        <div className="form-check form-switch mb-0 flex-shrink-0 mt-2 mt-md-0 d-flex align-items-center justify-content-end">
                            <input className="form-check-input mt-0 cursor-pointer shadow-none border-secondary" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={data.inputs.enable_guardrails ?? false} onChange={(e) => updateInput('enable_guardrails', e.target.checked)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="rp-card border border-secondary rounded-4 shadow-sm flex-grow-1 d-flex flex-column">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card flex-shrink-0">
                    <i className="bi bi-x-octagon text-danger fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">5. First-Year Overrides</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10 flex-grow-1">
                    <div className="row g-4 h-100">
                        <div className={`col-12 ${isCouple ? 'col-md-6' : ''}`}>
                            <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center">
                                <h6 className="fw-bold small text-info text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary border-opacity-50">{p1Name}</h6>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-check-label small text-muted fw-bold">Skip TFSA Contrib.</label>
                                    <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5 shadow-none border-secondary" type="checkbox" checked={data.inputs.skip_first_tfsa_p1 ?? false} onChange={(e) => updateInput('skip_first_tfsa_p1', e.target.checked)} /></div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <label className="form-check-label small text-muted fw-bold">Skip RRSP Contrib.</label>
                                    <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5 shadow-none border-secondary" type="checkbox" checked={data.inputs.skip_first_rrsp_p1 ?? false} onChange={(e) => updateInput('skip_first_rrsp_p1', e.target.checked)} /></div>
                                </div>
                            </div>
                        </div>
                        {isCouple && (
                            <div className="col-12 col-md-6">
                                <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center">
                                    <h6 className="fw-bold small text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary border-opacity-50" style={{color: 'var(--bs-purple)'}}>{p2Name}</h6>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <label className="form-check-label small text-muted fw-bold">Skip TFSA Contrib.</label>
                                        <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5 shadow-none border-secondary" type="checkbox" checked={data.inputs.skip_first_tfsa_p2 ?? false} onChange={(e) => updateInput('skip_first_tfsa_p2', e.target.checked)} /></div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-check-label small text-muted fw-bold">Skip RRSP Contrib.</label>
                                        <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5 shadow-none border-secondary" type="checkbox" checked={data.inputs.skip_first_rrsp_p2 ?? false} onChange={(e) => updateInput('skip_first_rrsp_p2', e.target.checked)} /></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}