import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';

const ACCOUNT_MAP: Record<string, { label: string, icon: string, color: string, desc: string }> = {
  tfsa: { label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info', desc: 'Tax-Free Savings' },
  rrsp: { label: 'RRSP', icon: 'bi-bank2', color: 'text-danger', desc: 'Registered Retirement' },
  fhsa: { label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary', desc: 'First Home Savings' },
  nonreg: { label: 'Non-Reg', icon: 'bi-graph-up-arrow', color: 'text-success', desc: 'Taxable Investments' },
  cash: { label: 'Cash / HYSA', icon: 'bi-cash-stack', color: 'text-secondary', desc: 'High-Yield Savings' },
  crypto: { label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-primary', desc: 'Digital Assets' },
  resp: { label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple', desc: 'Education Savings' },
  rrif_acct: { label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger', desc: 'Converted RRSP' },
  lif: { label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary', desc: 'Life Income Fund' },
  lirf: { label: 'LIRA / LIRF', icon: 'bi-lock-fill', color: 'text-muted', desc: 'Locked-In Retirement' },
};

// --- REUSABLE MICRO-COMPONENTS ---

const CurrencyInput = ({ value, onChange, className, placeholder, disabled, noBg, suffix }: any) => {
    const [localValue, setLocalValue] = useState('');
    useEffect(() => {
        if (value !== undefined && value !== '' && value !== null) { setLocalValue(Number(Math.round(value)).toLocaleString('en-US')); } else { setLocalValue(''); }
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, ''); 
        if (rawValue === '') onChange(''); else onChange(parseInt(rawValue, 10));
    };
    return (
        <div className="position-relative w-100 d-flex align-items-center">
            <span className="position-absolute text-muted fw-bold" style={{ left: noBg ? '4px' : '12px', fontSize: '0.9em', pointerEvents: 'none', zIndex: 5 }}>$</span>
            <input type="text" className={`${className} text-end ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'} ${disabled ? 'opacity-50' : ''}`} style={{ paddingLeft: noBg ? '18px' : '28px', paddingRight: suffix ? '45px' : (noBg ? '4px' : '12px'), fontWeight: '600', outline: 'none' }} value={localValue} onChange={handleChange} placeholder={placeholder} disabled={disabled} />
            {suffix && <span className="position-absolute text-muted small fw-bold" style={{ right: '12px', pointerEvents: 'none', zIndex: 5 }}>{suffix}</span>}
        </div>
    );
};

const InfoBtn = ({ title, text, align = 'center' }: { title: string, text: string, align?: 'center'|'right'|'left' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { top: '140%', backgroundColor: 'var(--bg-card)', minWidth: '260px' };
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

export default function StrategyTab() {
  const { data, updateInput, updateStrategy } = useFinance();
  
  const isCouple = data.mode === 'Couple';

  // --- INSTANT-SWAP DRAG & DROP ENGINE ---
  const [draggingType, setDraggingType] = useState<'accum' | 'decum' | null>(null);
  
  // HARD FILTER: Prevent non-contributable accounts from ever showing in Accumulation Queue
  const filterAccum = (list: string[]) => list.filter(a => !['rrif_acct', 'lif', 'lirf'].includes(a));

  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const [localAccum, setLocalAccum] = useState<string[]>(filterAccum(data.strategies.accum));
  const [localDecum, setLocalDecum] = useState<string[]>(data.strategies.decum);

  useEffect(() => {
      if (!draggingType) {
          setLocalAccum(filterAccum(data.strategies.accum));
          setLocalDecum(data.strategies.decum);
      }
  }, [data.strategies, draggingType]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, type: 'accum' | 'decum') => {
      setDraggingType(type);
      setDraggedItemIndex(index);
      
      const target = e.target as HTMLElement;
      setTimeout(() => {
          target.style.opacity = '0.4';
      }, 0);
  };

  const handleDragEnter = (index: number, type: 'accum' | 'decum') => {
      if (draggingType !== type || draggedItemIndex === null || draggedItemIndex === index) return;

      const list = type === 'accum' ? [...localAccum] : [...localDecum];
      const draggedItemContent = list[draggedItemIndex];

      list.splice(draggedItemIndex, 1);
      list.splice(index, 0, draggedItemContent);

      if (type === 'accum') setLocalAccum(list);
      else setLocalDecum(list);

      setDraggedItemIndex(index); 
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>, type: 'accum' | 'decum') => {
      const target = e.target as HTMLElement;
      target.style.opacity = '1';

      const listToSave = type === 'accum' ? localAccum : localDecum;
      updateStrategy(type, listToSave); 
      setDraggingType(null);
      setDraggedItemIndex(null);
  };

  const renderDraggableList = (type: 'accum' | 'decum') => {
    const currentList = type === 'accum' ? localAccum : localDecum;

    return currentList.map((item: string, index: number) => {
      const details = ACCOUNT_MAP[item] || { label: item, icon: 'bi-wallet', color: 'text-white', desc: '' };
      const isDragging = draggingType === type && draggedItemIndex === index;

      return (
        <div
          key={item}
          draggable
          onDragStart={(e) => handleDragStart(e, index, type)}
          onDragEnter={() => handleDragEnter(index, type)}
          onDragEnd={(e) => handleDragEnd(e, type)}
          onDragOver={(e) => e.preventDefault()}
          className={`d-flex align-items-center justify-content-between p-3 mb-2 rounded-4 transition-all shadow-sm ${isDragging ? 'border border-primary bg-primary bg-opacity-10 shadow' : 'border border-secondary bg-input'}`}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center justify-content-center bg-secondary bg-opacity-25 rounded-circle fw-bold text-muted" style={{ width: '28px', height: '28px', fontSize: '0.8rem' }}>
                {index + 1}
            </div>
            <div className={`bg-black bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center ${details.color} flex-shrink-0`} style={{width: '42px', height: '42px'}}>
                <i className={`bi ${details.icon} fs-5`}></i>
            </div>
            <div>
                <h6 className="mb-0 fw-bold text-main">{details.label}</h6>
                <div className="small text-muted fw-medium" style={{ fontSize: '0.7rem' }}>{details.desc}</div>
            </div>
          </div>
          <i className="bi bi-grip-vertical text-muted fs-4 opacity-50 ms-2"></i>
        </div>
      );
    });
  };

  return (
    <div className="p-3 p-md-4">
      
      {/* --- SECTION 1: PRIORITY QUEUES --- */}
      <div className="rp-card border border-secondary rounded-4 mb-4">
        <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
          <div className="d-flex align-items-center">
            <i className="bi bi-arrow-down-up text-primary fs-4 me-3"></i>
            <h5 className="mb-0 fw-bold text-uppercase ls-1">1. Priority Queues</h5>
            <InfoBtn align="left" title="Priority Routing" text="The engine processes events sequentially. Drag to reorder how the algorithm handles surplus cash and retirement deficits." />
          </div>
        </div>
        <div className="card-body p-4">
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
                        <div className="p-3 bg-secondary bg-opacity-10 h-100">
                            {renderDraggableList('accum')}
                        </div>
                    </div>
                </div>

                {/* Decumulation */}
                <div className="col-12 col-xl-6">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card">
                        <div className="bg-primary bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                            <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                <i className="bi bi-wallet2 fs-5"></i>
                            </div>
                            <div>
                                <h6 className="fw-bold mb-0 text-uppercase ls-1 text-primary">Decumulation Route</h6>
                                <span className="small text-muted" style={{fontSize: '0.7rem'}}>Order of draining accounts during retirement</span>
                            </div>
                        </div>
                        <div className="p-3 bg-secondary bg-opacity-10 h-100">
                            {renderDraggableList('decum')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="row g-4">
        {/* --- SECTION 2: ANNUAL LIMITS --- */}
        <div className="col-12 col-xl-5 d-flex flex-column">
            <div className="rp-card border border-secondary rounded-4 mb-4 flex-grow-1">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-speedometer2 text-info fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">2. Annual Limits</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10">
                    <div className="row g-3">
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-info text-uppercase ls-1">TFSA</span>
                                    <InfoBtn align="right" title="TFSA Limit" text="The annual contribution room granted by the CRA for a Tax-Free Savings Account.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributions.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm" value={data.inputs.cfg_tfsa_limit} onChange={(val: any) => updateInput('cfg_tfsa_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-danger text-uppercase ls-1">RRSP Max</span>
                                    <InfoBtn align="right" title="RRSP Limit" text="The absolute maximum RRSP contribution cap set by the CRA for the year.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp/contributions-affect-your-rrsp-prpp-deduction-limit.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm" value={data.inputs.cfg_rrsp_limit} onChange={(val: any) => updateInput('cfg_rrsp_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-primary text-uppercase ls-1">FHSA</span>
                                    <InfoBtn align="right" title="FHSA Limit" text="The annual contribution limit for a First Home Savings Account (Max $8,000/yr).<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account/contributing-your-fhsa.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm" value={data.inputs.cfg_fhsa_limit} onChange={(val: any) => updateInput('cfg_fhsa_limit', val)} />
                            </div>
                        </div>
                        <div className="col-6">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-purple text-uppercase ls-1">RESP</span>
                                    <InfoBtn align="right" title="RESP Target" text="The optimal annual contribution to maximize the 20% CESG government match ($2,500).<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/registered-education-savings-plans-resps.html' target='_blank' rel='noopener noreferrer' class='text-primary text-decoration-none fw-bold'>CRA Reference <i class='bi bi-box-arrow-up-right ms-1'></i></a>" />
                                </div>
                                <CurrencyInput className="form-control form-control-sm" value={data.inputs.cfg_resp_limit} onChange={(val: any) => updateInput('cfg_resp_limit', val)} />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column justify-content-between h-100 gap-2">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <span className="small fw-bold text-muted text-uppercase ls-1">Crypto Limit</span>
                                    <InfoBtn align="right" title="Crypto Constraint" text="A self-imposed maximum amount of cash you are willing to invest into Crypto per year to control risk exposure." />
                                </div>
                                <CurrencyInput suffix="/ yr" className="form-control form-control-sm" value={data.inputs.cfg_crypto_limit} onChange={(val: any) => updateInput('cfg_crypto_limit', val)} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* --- SECTION 3 & 4: OPTIMIZATIONS & EXCEPTIONS --- */}
        <div className="col-12 col-xl-7 d-flex flex-column gap-4">
            
            <div className="rp-card border border-secondary rounded-4">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-cpu text-primary fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">3. Engine Optimizations</h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-3">
                    
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-success text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-magic me-2 fs-5"></i> Smart RRSP Meltdown & Tax Optimizer
                            </h6>
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Overrides your manual withdrawal order to mathematically minimize lifetime taxes. It proactively draws down your RRSP early (a "Meltdown") to completely fill your lowest tax brackets, while aggressively sheltering your TFSA for as long as possible. 
                                <br/><br/>
                                <span className="fw-bold text-main">Example:</span> If you have $20,000 of 0% tax room left in a year, the engine will automatically withdraw exactly $20,000 from your RRSP before touching any other account.
                            </p>
                        </div>
                        <div className="form-check form-switch mb-0 flex-shrink-0 mt-2 mt-md-0 d-flex align-items-center justify-content-end">
                            <input className="form-check-input mt-0 cursor-pointer" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={data.inputs.fully_optimize_tax ?? false} onChange={(e) => updateInput('fully_optimize_tax', e.target.checked)} />
                        </div>
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-info text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-shield-check me-2 fs-5"></i> Avoid OAS Clawbacks
                            </h6>
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Prioritizes withdrawing from non-taxable accounts (like your TFSA) or strictly limiting RRSP/RRIF withdrawals to stay below the CRA's OAS repayment threshold, preserving your full government benefits.
                            </p>
                        </div>
                        <div className="form-check form-switch mb-0 flex-shrink-0 mt-2 mt-md-0 d-flex align-items-center justify-content-end">
                            <input className="form-check-input mt-0 cursor-pointer" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={data.inputs.oas_clawback_optimize ?? false} onChange={(e) => updateInput('oas_clawback_optimize', e.target.checked)} />
                        </div>
                    </div>

                    {/* RESTORED GUARDRAILS TOGGLE */}
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start align-items-lg-center p-4 bg-input border border-secondary rounded-4 shadow-sm gap-4">
                        <div className="flex-grow-1 pe-md-3">
                            <h6 className="fw-bold mb-2 text-warning text-uppercase ls-1 d-flex align-items-center">
                                <i className="bi bi-arrow-down-up me-2 fs-5"></i> Variable Spending (Guardrails)
                            </h6>
                            <p className="small text-muted mb-0" style={{lineHeight: 1.5}}>
                                Implements the Guyton-Klinger Guardrails rule. If a market crash pushes your withdrawal rate 20% higher than your initial retirement withdrawal rate, the engine automatically cuts your lifestyle spending by 10% to preserve capital.
                            </p>
                        </div>
                        <div className="form-check form-switch mb-0 flex-shrink-0 mt-2 mt-md-0 d-flex align-items-center justify-content-end">
                            <input className="form-check-input mt-0 cursor-pointer" style={{width: '3em', height: '1.5em'}} type="checkbox" checked={data.inputs.enable_guardrails ?? false} onChange={(e) => updateInput('enable_guardrails', e.target.checked)} />
                        </div>
                    </div>

                </div>
            </div>

            <div className="rp-card border border-secondary rounded-4 flex-grow-1">
                <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
                    <i className="bi bi-x-octagon text-danger fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                        4. First-Year Overrides
                        <InfoBtn align="left" title="First-Year Overrides" text="Useful for simulating real-world scenarios where you have already maxed out your registered accounts for the current year. The engine will skip contributions in Year 1 and resume normally in Year 2." />
                    </h5>
                </div>
                <div className="card-body p-4 bg-secondary bg-opacity-10">
                    <div className="row g-4 h-100">
                        <div className="col-12 col-md-6">
                            <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center">
                                <h6 className="fw-bold small text-info text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary border-opacity-50">Player 1 (P1)</h6>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <label className="form-check-label small text-muted fw-bold">Skip TFSA Contrib.</label>
                                    <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5" type="checkbox" checked={data.inputs.skip_first_tfsa_p1 ?? false} onChange={(e) => updateInput('skip_first_tfsa_p1', e.target.checked)} /></div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <label className="form-check-label small text-muted fw-bold">Skip RRSP Contrib.</label>
                                    <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5" type="checkbox" checked={data.inputs.skip_first_rrsp_p1 ?? false} onChange={(e) => updateInput('skip_first_rrsp_p1', e.target.checked)} /></div>
                                </div>
                            </div>
                        </div>
                        {isCouple && (
                            <div className="col-12 col-md-6">
                                <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column justify-content-center">
                                    <h6 className="fw-bold small text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary border-opacity-50" style={{color: 'var(--bs-purple)'}}>Player 2 (P2)</h6>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <label className="form-check-label small text-muted fw-bold">Skip TFSA Contrib.</label>
                                        <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5" type="checkbox" checked={data.inputs.skip_first_tfsa_p2 ?? false} onChange={(e) => updateInput('skip_first_tfsa_p2', e.target.checked)} /></div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-check-label small text-muted fw-bold">Skip RRSP Contrib.</label>
                                        <div className="form-check form-switch mb-0"><input className="form-check-input m-0 cursor-pointer fs-5" type="checkbox" checked={data.inputs.skip_first_rrsp_p2 ?? false} onChange={(e) => updateInput('skip_first_rrsp_p2', e.target.checked)} /></div>
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