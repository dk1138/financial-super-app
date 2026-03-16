import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn, CurrencyInput, SegmentedControl } from './SharedUI';

const ACCOUNT_MAP: Record<string, { label: string, icon: string, color: string, desc: string }> = {
  tfsa: { label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info', desc: 'Tax-Free Savings' },
  rrsp: { label: 'RRSP', icon: 'bi-bank2', color: 'text-danger', desc: 'Registered Retirement' },
  fhsa: { label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary', desc: 'First Home Savings' },
  nonreg: { label: 'Non-Reg', icon: 'bi-graph-up-arrow', color: 'text-success', desc: 'Taxable Investments' },
  cash: { label: 'Cash / HYSA', icon: 'bi-cash-stack', color: 'text-secondary', desc: 'High-Yield Savings' },
  crypto: { label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-warning', desc: 'Digital Assets' },
  resp: { label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple', desc: 'Education Savings' },
  rrif_acct: { label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger', desc: 'Converted RRSP' },
  lif: { label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary', desc: 'Life Income Fund' },
  lirf: { label: 'LIRA / LIRF', icon: 'bi-lock-fill', color: 'text-muted', desc: 'Locked-In Retirement' },
};

export default function StrategyTab() {
  const { data, updateInput, updateStrategy, results } = useFinance();
  
  const isCouple = data.mode === 'Couple';
  const isOptimized = data.inputs.fully_optimize_tax ?? false;

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

  // --- INSTANT-SWAP DRAG & DROP ENGINE ---
  const [draggingType, setDraggingType] = useState<'accum' | 'decum' | null>(null);
  
  // HARD FILTERS: Prevent impossible accounts from showing in the queues
  const filterAccum = (list: string[]) => list.filter(a => !['rrif_acct', 'lif', 'lirf'].includes(a));
  const filterDecum = (list: string[]) => list.filter(a => !['fhsa', 'resp'].includes(a));

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [localAccum, setLocalAccum] = useState<string[]>(filterAccum(data.strategies.accum || []));
  const [localDecum, setLocalDecum] = useState<string[]>(filterDecum(data.strategies.decum || []));

  useEffect(() => {
      if (!draggingType) {
          setLocalAccum(filterAccum(data.strategies.accum || []));
          setLocalDecum(filterDecum(data.strategies.decum || []));
      }
  }, [data.strategies, draggingType]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, type: 'accum' | 'decum') => {
      if (type === 'decum' && isOptimized) return; // Failsafe
      
      setDraggingType(type);
      setDraggedItemIndex(index);
      
      const target = e.target as HTMLElement;
      setTimeout(() => {
          target.style.opacity = '0.4';
      }, 0);
  };

  const handleDragEnter = (index: number, type: 'accum' | 'decum') => {
      if (draggingType !== type || draggedItemIndex === null || draggedItemIndex === index) return;
      if (type === 'decum' && isOptimized) return; // Failsafe

      const list = type === 'accum' ? [...localAccum] : [...localDecum];
      const draggedItemContent = list[draggedItemIndex];

      list.splice(draggedItemIndex, 1);
      list.splice(index, 0, draggedItemContent);

      if (type === 'accum') setLocalAccum(list);
      else setLocalDecum(list);

      setDraggedItemIndex(index); 
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, type: 'accum' | 'decum') => {
      if (type === 'decum' && isOptimized) return; // Failsafe
      
      const target = e.target as HTMLElement;
      target.style.opacity = '1';

      const listToSave = type === 'accum' ? localAccum : localDecum;
      updateStrategy(type, listToSave); 
      setDraggingType(null);
      setDraggedItemIndex(null);
  };

  const renderDraggableList = (type: 'accum' | 'decum') => {
    let currentList = type === 'accum' ? localAccum : localDecum;

    // OVERRIDE: If Smart Optimizer is on, dynamically read the exact winning route from the Meta-Runner
    if (type === 'decum' && isOptimized) {
        const engineOptimalRoute = results?.timeline?.[0]?.optimalStrategy;
        
        if (engineOptimalRoute && Array.isArray(engineOptimalRoute) && engineOptimalRoute.length > 0) {
            currentList = filterDecum(engineOptimalRoute); // Filter the engine's list too!
        } else {
            // Fallback while waiting for calculation to finish (Removed FHSA & RESP)
            const fallbackOrder = ['nonreg', 'cash', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'tfsa', 'crypto'];
            currentList = [...currentList].sort((a, b) => {
                const idxA = fallbackOrder.indexOf(a);
                const idxB = fallbackOrder.indexOf(b);
                return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
            });
        }
    }

    const listItems = currentList.map((item: string, index: number) => {
      const details = ACCOUNT_MAP[item] || { label: item, icon: 'bi-wallet', color: 'text-white', desc: '' };
      const isDragging = draggingType === type && draggedItemIndex === index;
      const isLocked = type === 'decum' && isOptimized;
      
      // If optimized, we shift the numbering down by 1 because we are injecting a "Virtual Step 1" above it
      const displayIndex = (type === 'decum' && isOptimized) ? index + 2 : index + 1;

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
          <div className="d-flex align-items-center gap-3">
            <div className={`d-flex align-items-center justify-content-center ${isLocked ? 'bg-success bg-opacity-10 text-success' : 'bg-secondary bg-opacity-25 text-muted'} rounded-circle fw-bold`} style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                {displayIndex}
            </div>
            <div className={`bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center ${details.color} flex-shrink-0`} style={{width: '42px', height: '42px'}}>
                <i className={`bi ${details.icon} fs-5`}></i>
            </div>
            <div>
                <h6 className="mb-0 fw-bold text-main">{details.label}</h6>
                <div className={`small fw-medium ${isLocked ? 'text-success opacity-75' : 'text-muted'}`} style={{ fontSize: '0.7rem' }}>
                    {isLocked ? 'Auto-Managed' : details.desc}
                </div>
            </div>
          </div>
          {isLocked ? (
              <i className="bi bi-lock-fill text-success fs-5 opacity-50 ms-2"></i>
          ) : (
              <i className="bi bi-grip-vertical text-muted fs-4 opacity-50 ms-2"></i>
          )}
        </div>
      );
    });

    // Inject the visual "Phase 1: Meltdown" block when optimized
    if (type === 'decum' && isOptimized) {
        return (
            <div className="d-flex flex-column">
                <div className="mb-2 ms-2 mt-1 small fw-bold text-danger text-uppercase ls-1" style={{fontSize: '0.65rem', letterSpacing: '1px'}}>Phase 1: Bracket Filling</div>
                <div className="d-flex align-items-center justify-content-between p-3 mb-3 rounded-4 shadow-sm border border-danger bg-danger bg-opacity-10" style={{ cursor: 'default' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex align-items-center justify-content-center bg-danger text-white rounded-circle fw-bold shadow-sm" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                        1
                    </div>
                    <div className="bg-danger bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center text-danger flex-shrink-0" style={{width: '42px', height: '42px'}}>
                        <i className="bi bi-fire fs-5"></i>
                    </div>
                    <div>
                        <h6 className="mb-0 fw-bold text-danger">Proactive RRSP Meltdown</h6>
                        <div className="small fw-medium text-danger opacity-75" style={{ fontSize: '0.7rem', lineHeight: 1.2 }}>
                            Sips from RRSP to perfectly fill the lowest tax brackets.
                        </div>
                    </div>
                  </div>
                  <i className="bi bi-lock-fill text-danger fs-5 opacity-50 ms-2"></i>
                </div>

                <div className="mb-2 ms-2 mt-2 small fw-bold text-primary text-uppercase ls-1" style={{fontSize: '0.65rem', letterSpacing: '1px'}}>Phase 2: Lifestyle Funding</div>
                {listItems}
            </div>
        );
    }

    return listItems;
  };

  return (
    <div className="p-3 p-md-4 d-flex flex-column gap-4">
      
      {/* --- SECTION 1: PRIORITY QUEUES --- */}
      <div className="rp-card border border-secondary rounded-4 shadow-sm">
        <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
          <div className="d-flex align-items-center">
            <i className="bi bi-arrow-down-up text-primary fs-4 me-3"></i>
            <h5 className="mb-0 fw-bold text-uppercase ls-1">1. Priority Queues</h5>
            <InfoBtn align="left" title="Priority Routing" text="The engine processes events sequentially. Drag to reorder how the algorithm handles surplus cash and retirement deficits." />
          </div>
        </div>
        <div className="card-body p-4 bg-secondary bg-opacity-10">
            <div className="row g-4">
                {/* Accumulation */}
                <div className="col-12 col-xl-6">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card">
                        <div className="bg-success bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                            <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                <i className="bi bi-piggy-bank-fill fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-uppercase ls-1 text-success">Accumulation Route</h6>
                                <span className="small text-muted" style={{fontSize: '0.7rem'}}>Order of filling accounts when surplus cash exists</span>
                            </div>
                        </div>
                        <div className="p-3 bg-transparent h-100">
                            {renderDraggableList('accum')}
                        </div>
                    </div>
                </div>

                {/* Decumulation */}
                <div className="col-12 col-xl-6">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card position-relative">
                        <div className="bg-primary bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                <i className="bi bi-wallet2 fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-uppercase ls-1 text-primary">Decumulation Route</h6>
                                <span className="small text-muted" style={{fontSize: '0.7rem'}}>Order of draining accounts during retirement</span>
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

                        {/* COMPACT OVERLAY FOR SMART OPTIMIZER (CENTERED & HUGGED) */}
                        {isOptimized && (
                            <div className="position-absolute top-50 start-50 translate-middle" style={{ zIndex: 10, width: 'fit-content', minWidth: '220px' }}>
                                <div className="bg-success bg-opacity-10 border border-success rounded-4 shadow-lg p-3 py-4 px-4 text-center d-flex flex-column align-items-center justify-content-center" style={{ backdropFilter: 'blur(3px)' }}>
                                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center mb-2 shadow-sm" style={{width: '36px', height: '36px'}}>
                                        <i className="bi bi-lock-fill fs-5"></i>
                                    </div>
                                    <span className="text-uppercase fw-bold text-success ls-1 mb-1" style={{ fontSize: '0.85rem' }}>Optimized & Locked</span>
                                    <span className="small text-muted fw-medium lh-sm" style={{fontSize: '0.7rem'}}>
                                        Engine's tax-efficient route is locked in.
                                    </span>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="row g-4">
        {/* --- SECTION 2: ANNUAL LIMITS & EMERGENCY FUND --- */}
        <div className="col-12 col-xl-5 d-flex flex-column">
            <div className="rp-card border border-secondary rounded-4 shadow-sm flex-grow-1">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-speedometer2 text-info fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">2. Account Limits</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10">
                    <div className="row g-3">
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-info text-uppercase ls-1">TFSA</span>
                                    <InfoBtn align="right" title="TFSA Limit" text="The annual contribution room granted by the CRA for a Tax-Free Savings Account.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributions.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_tfsa_limit} onChange={(val: any) => updateInput('cfg_tfsa_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-danger text-uppercase ls-1">RRSP Max</span>
                                    <InfoBtn align="right" title="RRSP Limit" text="The absolute maximum RRSP contribution cap set by the CRA for the year.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_rrsp_limit} onChange={(val: any) => updateInput('cfg_rrsp_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-primary text-uppercase ls-1">FHSA</span>
                                    <InfoBtn align="right" title="FHSA Limit" text="The annual contribution limit for a First Home Savings Account (Max $8,000/yr).<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/contributing-your-fhsa.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_fhsa_limit} onChange={(val: any) => updateInput('cfg_fhsa_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-muted text-uppercase ls-1">Crypto Limit</span>
                                    <InfoBtn align="right" title="Crypto Constraint" text="A self-imposed maximum amount of cash you are willing to invest into Crypto per year to control risk exposure." />
                                </div>
                                <CurrencyInput suffix="/ yr" className="form-control form-control-sm border-secondary shadow-none" value={data.inputs.cfg_crypto_limit} onChange={(val: any) => updateInput('cfg_crypto_limit', val)} />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="small fw-bold text-purple text-uppercase ls-1">RESP Strategy</span>
                                    <InfoBtn align="right" title="RESP Guidelines" text="The optimal annual contribution to maximize the 20% CESG match is $2,500. CESG grants are only paid on contributions made up to the end of the year the child turns 17.<br/><br/><a href='https://www.canada.ca/en/services/benefits/education/education-savings.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>Govt of Canada Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
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
                                <InfoBtn align="right" title="Emergency Fund" text="A protected cash buffer that the engine will not touch for normal retirement spending.<br><br><b>Break-the-Glass:</b> If your other accounts completely run out of money, the engine will be allowed to spend this buffer to prevent immediate plan failure.<br><br><b>Inflation:</b> Custom amounts will automatically inflate over time to preserve purchasing power." />
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
                                                <i className="bi bi-exclamation-triangle-fill me-2"></i> 
                                                High cash balances create "cash drag," losing value to inflation over decades.
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

        {/* --- SECTION 3 & 4: OPTIMIZATIONS & EXCEPTIONS --- */}
        <div className="col-12 col-xl-7 d-flex flex-column gap-4">
            
            <div className="rp-card border border-secondary rounded-4 shadow-sm">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-cpu text-primary fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">3. Engine Optimizations</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-3">
                    
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4 transition-all hover-border-primary">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-success text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-magic me-2 fs-5"></i> Smart RRSP Meltdown & Tax Optimizer
                            </h6>
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Overrides your manual withdrawal order to mathematically minimize lifetime taxes. It proactively draws down your RRSP early (a "Meltdown") to completely fill your lowest tax brackets, while aggressively sheltering your TFSA for as long as possible. 
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
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Prioritizes withdrawing from non-taxable accounts (like your TFSA) or strictly limiting RRSP/RRIF withdrawals to stay below the CRA's OAS repayment threshold, preserving your full government benefits.
                            </p>
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
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Implements the Guyton-Klinger Guardrails rule. If a market crash pushes your withdrawal rate 20% higher than your initial retirement withdrawal rate, the engine automatically cuts your lifestyle spending by 10% to preserve capital.
                            </p>
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
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                        4. First-Year Overrides
                        <InfoBtn align="left" title="First-Year Overrides" text="Useful for simulating real-world scenarios where you have already maxed out your registered accounts for the current year. The engine will skip contributions in Year 1 and resume normally in Year 2." />
                    </h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10 flex-grow-1">
                    <div className="row g-4 h-100">
                        <div className={`col-12 ${isCouple ? 'col-md-6' : ''}`}>
                            <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center">
                                <h6 className="fw-bold small text-info text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary border-opacity-50">Player 1 (P1)</h6>
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
                                    <h6 className="fw-bold small text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary border-opacity-50" style={{color: 'var(--bs-purple)'}}>Player 2 (P2)</h6>
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