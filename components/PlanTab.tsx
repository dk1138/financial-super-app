import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';

const ACCOUNT_TYPES = [
  { id: 'cash', label: 'Cash', tooltip: 'Interest income is 100% taxable at your marginal rate. No tax sheltering.' },
  { id: 'tfsa', label: 'TFSA', tooltip: 'Tax-Free Savings Account. Growth and withdrawals are 100% tax-free.' },
  { id: 'fhsa', label: 'FHSA', tooltip: 'First Home Savings Account. Tax-deductible contributions, tax-free withdrawals for a qualifying first home.' },
  { id: 'rrsp', label: 'RRSP', tooltip: 'Registered Retirement Savings Plan. Tax-deductible contributions. Tax-deferred growth. 100% taxable withdrawals.' },
  { id: 'resp', label: 'RESP', tooltip: 'Registered Education Savings Plan. 20% CESG match on first $2,500/yr.' },
  { id: 'lirf', label: 'LIRF', tooltip: 'Locked-in Retirement Account (LIRA). Pension funds locked until retirement. Tax-deferred.' },
  { id: 'lif', label: 'LIF', tooltip: 'Life Income Fund. Payout vehicle for LIRA. Has min/max annual limits. 100% taxable.' },
  { id: 'rrif_acct', label: 'RRIF', tooltip: 'Registered Retirement Income Fund. Payout vehicle for RRSP. Mandatory minimum withdrawals. 100% taxable.' }
];

// --- HELPER: Mortgage Calculators ---
const calcAmortization = (principal: number, rate: number, payment: number) => {
    if (!principal || !payment || principal <= 0 || payment <= 0) return '';
    const r = (rate || 0) / 100 / 12; 
    if (r === 0) {
        const months = principal / payment;
        return `${Math.floor(months / 12)}y ${Math.ceil(months % 12)}m`;
    }
    if (payment <= principal * r) return 'Never (Payment too low)';
    const months = -Math.log(1 - (r * principal) / payment) / Math.log(1 + r);
    if (!isFinite(months)) return '';
    return `${Math.floor(months / 12)}y ${Math.ceil(months % 12)}m`;
};

const calc25YearPayment = (principal: number, rate: number) => {
    if (!principal || principal <= 0) return 0;
    const r = (rate || 0) / 100 / 12;
    const n = 300; 
    if (r === 0) return principal / n;
    return (principal * r) / (1 - Math.pow(1 + r, -n));
};

// --- MODERN UI COMPONENTS ---

const CurrencyInput = ({ value, onChange, className, placeholder, style, disabled, suffix, noBg }: any) => {
    const [localValue, setLocalValue] = useState('');

    useEffect(() => {
        if (value !== undefined && value !== '' && value !== null) {
            setLocalValue(Number(Math.round(value)).toLocaleString('en-US'));
        } else {
            setLocalValue('');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Blocks decimals perfectly
        if (rawValue === '') {
            onChange('');
        } else {
            onChange(parseInt(rawValue, 10));
        }
    };

    return (
        <div className="position-relative w-100 d-flex align-items-center">
            <span className="position-absolute text-muted fw-bold" style={{ left: noBg ? '4px' : '12px', fontSize: '0.9em', pointerEvents: 'none', zIndex: 5 }}>$</span>
            <input 
                type="text" 
                className={`${className} text-end ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'}`} 
                style={{ 
                    ...style, 
                    paddingLeft: noBg ? '18px' : '28px', 
                    paddingRight: suffix ? '45px' : (noBg ? '4px' : '12px'),
                    fontWeight: '600',
                    outline: 'none'
                }}
                value={localValue} 
                onChange={handleChange} 
                placeholder={placeholder} 
                disabled={disabled} 
            />
            {suffix && <span className="position-absolute text-muted small fw-bold" style={{ right: '12px', pointerEvents: 'none', zIndex: 5 }}>{suffix}</span>}
        </div>
    );
};

const PercentInput = ({ value, onChange, className, placeholder, noBg }: any) => {
    const [focused, setFocused] = useState(false);
    let displayValue = value ?? '';
    if (!focused && displayValue !== '') displayValue = Number(displayValue).toFixed(2);

    return (
        <div className="position-relative w-100 d-flex align-items-center">
            <input 
                type="number" 
                step="0.01" 
                className={`${className} text-end ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'}`} 
                style={{ paddingRight: noBg ? '18px' : '28px', fontWeight: '600', outline: 'none' }}
                value={focused ? (value ?? '') : displayValue} 
                onChange={(e) => onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} 
                onFocus={() => setFocused(true)} 
                onBlur={() => setFocused(false)} 
                placeholder={placeholder} 
            />
            <span className="position-absolute text-muted fw-bold" style={{ right: noBg ? '4px' : '12px', fontSize: '0.9em', pointerEvents: 'none', zIndex: 5 }}>%</span>
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
            <button type="button" className="btn btn-link p-0 text-muted info-btn" onClick={(e) => { e.preventDefault(); setOpen(!open); }} onBlur={() => setTimeout(() => setOpen(false), 200)}>
                <i className="bi bi-info-circle" style={{fontSize: '0.85rem'}}></i>
            </button>
            {open && (
                <div className="position-absolute border border-secondary rounded-3 shadow-lg p-3" style={posStyles}>
                    <h6 className="fw-bold mb-2 text-main border-bottom border-secondary pb-1" style={{fontSize: '0.85rem'}}>{title}</h6>
                    <div className="small text-muted text-start fw-normal" style={{fontSize: '0.75rem', lineHeight: '1.5', whiteSpace: 'normal'}} dangerouslySetInnerHTML={{__html: text}}></div>
                </div>
            )}
        </div>
    );
};

// --- UPGRADED TYPABLE STEPPER ---
const StepperInput = ({ value, onChange, min, max, suffix = "" }: any) => {
    const numVal = Number(value) || 0; 
    const [textVal, setTextVal] = useState(numVal.toString());

    // Sync local text state if external value changes
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

export default function PlanTab() {
  const { data, results, updateInput, updateMode, addArrayItem, updateArrayItem, removeArrayItem, updateExpenseCategory } = useFinance(); 
  
  const [assetAdvancedMode, setAssetAdvancedMode] = useState(false);
  const [expenseAdvancedMode, setExpenseAdvancedMode] = useState(false);
  const [p1DbEnabled, setP1DbEnabled] = useState(false);
  const [p2DbEnabled, setP2DbEnabled] = useState(false);
  
  const [p1AssetsOpen, setP1AssetsOpen] = useState(false);
  const [p2AssetsOpen, setP2AssetsOpen] = useState(false);

  const isCouple = data.mode === 'Couple';

  const handleAgeChange = (player: 'p1'|'p2', newAge: number) => {
      const currentYear = new Date().getFullYear();
      const newBirthYear = currentYear - newAge;
      
      updateInput(`${player}_dob`, `${newBirthYear}-01`);
      updateInput(`${player}_age`, newAge);

      // Auto-bump constraints so plan doesn't break
      const currentRetAge = data.inputs[`${player}_retireAge`] || 60;
      const currentLifeExp = data.inputs[`${player}_lifeExp`] || 90;

      if (newAge > currentRetAge) updateInput(`${player}_retireAge`, newAge);
      if (newAge > currentLifeExp) updateInput(`${player}_lifeExp`, newAge);
  };

  const updateExpense = (cat: string, idx: number, field: string, value: any) => {
    const newItems = [...data.expensesByCategory[cat].items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    updateExpenseCategory(cat, newItems);
  };

  const p1Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p1_${acct.id}`]) || 0), 0) + (Number(data.inputs['p1_nonreg']) || 0) + (Number(data.inputs['p1_crypto']) || 0);
  const p2Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p2_${acct.id}`]) || 0), 0) + (Number(data.inputs['p2_nonreg']) || 0) + (Number(data.inputs['p2_crypto']) || 0);
  const hhTotal = p1Total + (isCouple ? p2Total : 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  const calcExpenseTotal = (phase: string) => {
      let total = 0;
      Object.values(data.expensesByCategory || {}).forEach((cat: any) => {
          if(cat && cat.items) cat.items.forEach((item: any) => { total += (item[phase] || 0) * (item.freq || 12); });
      });
      return total;
  };

  const renderTaxBox = (taxDetails: any, gross: number) => {
      if (!taxDetails || gross <= 0) return <div className="text-muted text-center mt-3 small fst-italic">No Tax Data / Income</div>;
      return (
          <div className="tax-details-box border-secondary p-3 mt-3 rounded bg-black bg-opacity-25 border shadow-sm">
              <div className="d-flex justify-content-between border-bottom border-secondary pb-1 mb-1"><span className="text-muted small">Federal Tax</span> <span className="small">(${Math.round(taxDetails.fed).toLocaleString()}) {((taxDetails.fed/gross)*100).toFixed(1)}%</span></div>
              <div className="d-flex justify-content-between border-bottom border-secondary pb-1 mb-1"><span className="text-muted small">Provincial Tax</span> <span className="small">(${Math.round(taxDetails.prov).toLocaleString()}) {((taxDetails.prov/gross)*100).toFixed(1)}%</span></div>
              <div className="d-flex justify-content-between border-bottom border-secondary pb-1 mb-1"><span className="text-muted small">CPP/EI Prem.</span> <span className="small">(${Math.round(taxDetails.cpp_ei).toLocaleString()})</span></div>
              <div className="d-flex justify-content-between mt-2"><span className="text-warning fw-bold small">Total Tax Paid</span> <span className="text-warning fw-bold small">(${Math.round(taxDetails.totalTax).toLocaleString()})</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted small">Marginal Rate</span> <span className="small">{(taxDetails.margRate*100).toFixed(1)}%</span></div>
              <div className="d-flex justify-content-between mt-2 pt-2 border-top border-secondary"><span className="text-success fw-bold small">After-Tax Net</span> <span className="text-success fw-bold small">${Math.round(gross - taxDetails.totalTax).toLocaleString()}</span></div>
          </div>
      );
  };

  const getCategoryIcon = (cat: string) => {
      const icons: Record<string, any> = {
          housing: <i className="bi bi-house-door-fill text-primary"></i>,
          transport: <i className="bi bi-car-front-fill text-info"></i>,
          lifestyle: <i className="bi bi-airplane-fill text-warning"></i>,
          essentials: <i className="bi bi-basket3-fill text-success"></i>,
          other: <i className="bi bi-grid-3x3-gap-fill text-secondary"></i>
      };
      return icons[cat.toLowerCase()] || <i className="bi bi-tag-fill text-muted"></i>;
  };

  const getActiveIncome = (player: string) => {
      let base = Number(data.inputs[`${player}_income`]) || 0;
      let addl = data.additionalIncome.filter((inc: any) => inc.owner === player).reduce((sum: number, inc: any) => sum + ((Number(inc.amount) || 0) * (inc.freq === 'month' ? 12 : 1)), 0);
      return base + addl;
  };

  const p1Gross = getActiveIncome('p1');
  const p2Gross = isCouple ? getActiveIncome('p2') : 0;
  const hhGross = p1Gross + p2Gross;
  const hhNet = hhGross - (results?.timeline?.[0]?.taxDetailsP1?.totalTax || 0) - (isCouple ? (results?.timeline?.[0]?.taxDetailsP2?.totalTax || 0) : 0);

  const balCol = assetAdvancedMode ? 'col-3' : 'col-5';
  const retCol = assetAdvancedMode ? 'col-3' : 'col-4';

  return (
    <div className="p-3 p-md-4">
      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        
        {/* 1. Personal Information */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-vcard text-primary fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1">1. Personal Information</h5>
              <InfoBtn align="left" title="Personal Details" text="Set your Age (or Date of Birth) and targeted Retirement Age. <br><br><b>Life Expectancy</b> defines how long the simulation runs (ensuring you don't run out of money too early)." />
            </div>
            <div className="d-inline-flex bg-input rounded-pill p-1 border border-secondary shadow-sm">
                <button type="button" className={`btn btn-sm rounded-pill px-4 fw-bold transition-all border-0 ${!isCouple ? 'bg-primary shadow text-white' : 'text-muted'}`} onClick={() => updateMode('Single')}>Single</button>
                <button type="button" className={`btn btn-sm rounded-pill px-4 fw-bold transition-all border-0 ${isCouple ? 'shadow text-white' : 'text-muted'}`} style={isCouple ? {backgroundColor: 'var(--bs-purple)'} : {}} onClick={() => updateMode('Couple')}>Couple</button>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-12 col-xl-6">
                 <div className="p-4 border border-secondary rounded-3 h-100 position-relative overflow-hidden surface-card shadow-sm">
                  <div className="position-absolute top-0 start-0 w-100 border-top border-3 border-info"></div>
                  <h6 className="fw-bold mb-4 text-uppercase ls-1 text-info"><i className="bi bi-person-fill me-2"></i>Player 1 (P1)</h6>
                  <div className="row g-3 mb-2 align-items-center">
                     <div className="col-12 col-md-4 text-center d-flex flex-column align-items-center">
                        <label className="form-label text-muted fw-bold small mb-2">Birth Month</label>
                        <input type="month" className="form-control text-info fw-bold bg-input border border-secondary text-center w-75" value={data.inputs.p1_dob ?? ''} onChange={(e) => {
                            updateInput(`p1_dob`, e.target.value);
                            if (e.target.value) {
                                const newAge = new Date().getFullYear() - parseInt(e.target.value.split('-')[0]);
                                updateInput(`p1_age`, newAge);
                                if (newAge > (data.inputs.p1_retireAge || 60)) updateInput('p1_retireAge', newAge);
                                if (newAge > (data.inputs.p1_lifeExp || 90)) updateInput('p1_lifeExp', newAge);
                            }
                        }} />
                     </div>
                     <div className="col-12 col-md-3 text-center d-flex flex-column align-items-center">
                        <label className="form-label text-muted fw-bold small mb-2">Age</label>
                        <div><StepperInput min={18} max={100} value={data.inputs.p1_age ?? 38} onChange={(val: any) => handleAgeChange('p1', val)} /></div>
                     </div>
                     <div className="col-6 col-md-2 text-center d-flex flex-column align-items-center">
                        <label className="form-label text-muted fw-bold text-nowrap small mb-2">Retire At</label>
                        <div><StepperInput min={data.inputs.p1_age ?? 18} max={100} value={data.inputs.p1_retireAge ?? 60} onChange={(val: any) => {
                            updateInput(`p1_retireAge`, val);
                            if (val > (data.inputs.p1_lifeExp || 90)) updateInput('p1_lifeExp', val);
                        }} /></div>
                     </div>
                     <div className="col-6 col-md-3 text-center d-flex flex-column align-items-center">
                        <label className="form-label text-muted fw-bold text-nowrap small mb-2">Life Expect.</label>
                        <div><StepperInput min={Math.max(data.inputs.p1_age ?? 18, data.inputs.p1_retireAge ?? 60)} max={120} value={data.inputs.p1_lifeExp ?? 90} onChange={(val: any) => updateInput(`p1_lifeExp`, val)} /></div>
                     </div>
                  </div>
                </div>
              </div>
              
              {isCouple && (
                <div className="col-12 col-xl-6">
                   <div className="p-4 border border-secondary rounded-3 h-100 position-relative overflow-hidden surface-card shadow-sm">
                    <div className="position-absolute top-0 start-0 w-100 border-top border-3" style={{borderColor: 'var(--bs-purple)'}}></div>
                    <h6 className="fw-bold mb-4 text-uppercase ls-1" style={{color: 'var(--bs-purple)'}}><i className="bi bi-person-fill me-2"></i>Player 2 (P2)</h6>
                    <div className="row g-3 mb-2 align-items-center">
                       <div className="col-12 col-md-4 text-center d-flex flex-column align-items-center">
                          <label className="form-label text-muted fw-bold small mb-2">Birth Month</label>
                          <input type="month" className="form-control fw-bold bg-input border border-secondary text-center w-75" style={{color: 'var(--bs-purple)'}} value={data.inputs.p2_dob ?? ''} onChange={(e) => {
                              updateInput(`p2_dob`, e.target.value);
                              if (e.target.value) {
                                  const newAge = new Date().getFullYear() - parseInt(e.target.value.split('-')[0]);
                                  updateInput(`p2_age`, newAge);
                                  if (newAge > (data.inputs.p2_retireAge || 60)) updateInput('p2_retireAge', newAge);
                                  if (newAge > (data.inputs.p2_lifeExp || 90)) updateInput('p2_lifeExp', newAge);
                              }
                          }} />
                       </div>
                       <div className="col-12 col-md-3 text-center d-flex flex-column align-items-center">
                          <label className="form-label text-muted fw-bold small mb-2">Age</label>
                          <div><StepperInput min={18} max={100} value={data.inputs.p2_age ?? 34} onChange={(val: any) => handleAgeChange('p2', val)} /></div>
                       </div>
                       <div className="col-6 col-md-2 text-center d-flex flex-column align-items-center">
                          <label className="form-label text-muted fw-bold text-nowrap small mb-2">Retire At</label>
                          <div><StepperInput min={data.inputs.p2_age ?? 18} max={100} value={data.inputs.p2_retireAge ?? 60} onChange={(val: any) => {
                              updateInput(`p2_retireAge`, val);
                              if (val > (data.inputs.p2_lifeExp || 90)) updateInput('p2_lifeExp', val);
                          }} /></div>
                       </div>
                       <div className="col-6 col-md-3 text-center d-flex flex-column align-items-center">
                          <label className="form-label text-muted fw-bold text-nowrap small mb-2">Life Expect.</label>
                          <div><StepperInput min={Math.max(data.inputs.p2_age ?? 18, data.inputs.p2_retireAge ?? 60)} max={120} value={data.inputs.p2_lifeExp ?? 95} onChange={(val: any) => updateInput(`p2_lifeExp`, val)} /></div>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Dependents */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-people text-info fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                  2. Dependents (CCB & RESP) 
                  <InfoBtn title="Dependents" text="Adding dependents automatically calculates Canada Child Benefit (CCB) payments and applies any RESP strategy rules." />
              </h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('dependents', { name: `Child ${data.dependents.length + 1}`, dob: '2024-01' })}>
              <i className="bi bi-plus-lg me-1"></i> Add Child
            </button>
          </div>
          <div className="card-body p-4">
            {data.dependents.length === 0 && <div className="text-center text-muted small fst-italic">No dependents added.</div>}
            {data.dependents.map((dep: any, index: number) => (
              <div className="row g-3 mb-3 align-items-end" key={`dep_${index}`}>
                <div className="col-5"><label className="form-label small text-muted">Name</label><input type="text" className="form-control fw-bold bg-input border border-secondary" value={dep.name || ''} onChange={(e) => updateArrayItem('dependents', index, 'name', e.target.value)} /></div>
                <div className="col-5"><label className="form-label small text-muted">Birth Month</label><input type="month" className="form-control fw-bold bg-input border border-secondary" value={dep.dob || ''} onChange={(e) => updateArrayItem('dependents', index, 'dob', e.target.value)} /></div>
                <div className="col-2"><button type="button" className="btn btn-sm btn-link text-danger p-1 opacity-75 hover-opacity-100 w-100" onClick={() => removeArrayItem('dependents', index)}><i className="bi bi-x-lg fs-5"></i></button></div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Portfolio Assets */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-wallet2 text-success fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                  3. Portfolio Assets 
                  <InfoBtn title="Assets & Returns" text="Enter your <b>current</b> balances. The <b>Return %</b> is your expected annual growth. <br><br>Toggle <b>Advanced Mode</b> to set different return rates for after you retire." />
              </h5>
            </div>
            <div className="form-check form-switch mb-0">
              <input className="form-check-input mt-1 cursor-pointer" type="checkbox" checked={assetAdvancedMode} onChange={(e) => setAssetAdvancedMode(e.target.checked)} />
              <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-1 cursor-pointer">Adv. Mode</label>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {['p1', 'p2'].map((p) => {
                if (!isCouple && p === 'p2') return null;
                const isP1 = p === 'p1';
                const isOpen = isP1 ? p1AssetsOpen : p2AssetsOpen;
                const toggleOpen = isP1 ? () => setP1AssetsOpen(!p1AssetsOpen) : () => setP2AssetsOpen(!p2AssetsOpen);

                return (
                <div className="col-12 col-xl-6" key={p}>
                  <div className="card border-secondary surface-card shadow-none h-100">
                    <div className="card-body p-3 p-md-4">
                      
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary cursor-pointer user-select-none" onClick={toggleOpen}>
                          <h6 className={`fw-bold text-uppercase ls-1 mb-0 ${isP1 ? 'text-info' : ''}`} style={!isP1 ? {color: 'var(--bs-purple)'} : {}}>{p.toUpperCase()} Asset Mix</h6>
                          <button type="button" className="btn btn-sm btn-link text-muted p-0"><i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} fs-5`}></i></button>
                      </div>

                      {isOpen && (
                          <div className="mb-2 transition-all">
                              <div className="row g-2 align-items-end mb-3">
                                  <div className="col-3"><label className="form-label text-muted mb-0 small">Account</label></div>
                                  <div className={balCol}><label className="form-label text-muted mb-0 small">Balance ($)</label></div>
                                  <div className={retCol}><label className="form-label text-muted mb-0 small">Return</label></div>
                                  {assetAdvancedMode && <div className="col-3"><label className="form-label text-warning mb-0 small text-nowrap">Ret. Ret</label></div>}
                              </div>
                              {ACCOUNT_TYPES.map(acct => (
                                  <div className="row g-2 mb-2" key={`${p}_${acct.id}`}>
                                      <div className="col-3 pt-2 small fw-medium text-main d-flex align-items-center text-nowrap">
                                          {acct.label} <InfoBtn align={isP1 ? 'center' : 'right'} title={acct.label} text={acct.tooltip} />
                                      </div>
                                      <div className={balCol}><CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct.id}`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct.id}`, val)} /></div>
                                      <div className={retCol}><PercentInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct.id}_ret`]} onChange={(val: any) => updateInput(`${p}_${acct.id}_ret`, val)} /></div>
                                      {assetAdvancedMode && <div className="col-3"><PercentInput className="form-control form-control-sm border-warning text-warning" value={data.inputs[`${p}_${acct.id}_retire_ret`] ?? data.inputs[`${p}_${acct.id}_ret`]} onChange={(val: any) => updateInput(`${p}_${acct.id}_retire_ret`, val)} /></div>}
                                  </div>
                              ))}
                              {/* Non-Reg and Crypto */}
                              {['nonreg', 'crypto'].map(acct => (
                                  <div className="row g-2 mb-2 align-items-center" key={`${p}_adv_${acct}`}>
                                      <div className="col-3 small fw-medium text-main d-flex align-items-center text-nowrap">
                                          {acct === 'nonreg' ? 'Non-Reg' : 'Crypto'}
                                          <InfoBtn align={isP1 ? 'center' : 'right'} title={acct === 'nonreg' ? 'Non-Registered' : 'Crypto'} text={acct === 'nonreg' ? 'Taxable Investment Account. Yields taxed annually. Capital gains taxed at 50% inclusion.' : 'Capital Asset. Gains subject to Capital Gains Tax when sold.'} />
                                      </div>
                                      <div className={balCol}>
                                          <div className="d-flex flex-column gap-1">
                                              <div className="d-flex align-items-center gap-2"><span className="small text-muted fw-bold" style={{width:'35px', fontSize:'0.7rem'}}>MKT</span><CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct}`, val)} /></div>
                                              <div className="d-flex align-items-center gap-2 mt-1"><span className="small text-muted fw-bold" style={{width:'35px', fontSize:'0.7rem'}}>ACB</span><CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}_acb`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct}_acb`, val)} /></div>
                                          </div>
                                      </div>
                                      <div className={retCol}>
                                          <div className="d-flex flex-column gap-1">
                                              <div className="d-flex align-items-center gap-2"><span className="small text-muted fw-bold text-end" style={{width:'35px', fontSize:'0.7rem'}}>TOT</span><PercentInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}_ret`]} onChange={(val: any) => updateInput(`${p}_${acct}_ret`, val)} /></div>
                                              <div className="d-flex align-items-center gap-2 mt-1"><span className="small text-muted fw-bold text-end" style={{width:'35px', fontSize:'0.7rem'}}>YLD</span><PercentInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}_yield`]} onChange={(val: any) => updateInput(`${p}_${acct}_yield`, val)} /></div>
                                          </div>
                                      </div>
                                      {assetAdvancedMode && (
                                          <div className="col-3">
                                              <div className="d-flex flex-column gap-1">
                                                  <div className="d-flex align-items-center gap-2"><span className="small text-muted fw-bold text-end invisible" style={{width:'35px', fontSize:'0.7rem'}}>TOT</span><PercentInput className="form-control form-control-sm border-warning text-warning" value={data.inputs[`${p}_${acct}_retire_ret`] ?? data.inputs[`${p}_${acct}_ret`]} onChange={(val: any) => updateInput(`${p}_${acct}_retire_ret`, val)} /></div>
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      )}

                      {!isOpen && <div className="text-center text-muted small fst-italic py-2" onClick={toggleOpen} style={{cursor: 'pointer'}}>Click to expand account details</div>}

                    </div>
                  </div>
                </div>
              )})}
            </div>

            {/* Portfolio Total Summary Box */}
            <div className="card border-success border-opacity-50 surface-card mt-4 shadow-sm">
              <div className="card-body p-3">
                  <div className="row text-center align-items-center">
                      <div className={isCouple ? "col-4 border-end border-success border-opacity-25" : "col-6 border-end border-success border-opacity-25"}>
                          <div className="small fw-bold text-success text-uppercase ls-1 mb-1">P1 Portfolio</div>
                          <div className="fs-5 fw-bold text-success">{formatCurrency(p1Total)}</div>
                      </div>
                      {isCouple && (
                        <div className="col-4 border-end border-success border-opacity-25">
                            <div className="small fw-bold text-uppercase ls-1 mb-1" style={{ color: 'var(--bs-purple)' }}>P2 Portfolio</div>
                            <div className="fs-5 fw-bold" style={{ color: 'var(--bs-purple)' }}>{formatCurrency(p2Total)}</div>
                        </div>
                      )}
                      <div className={isCouple ? "col-4" : "col-6"}>
                          <div className="small fw-bold text-main text-uppercase ls-1 mb-1">Household Total</div>
                          <div className="fs-5 fw-bold text-main">{formatCurrency(hhTotal)}</div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Real Estate */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
                <i className="bi bi-house-heart text-danger fs-4 me-3"></i>
                <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                    4. Real Estate & Mortgage
                    <InfoBtn title="Property Tracking" text="Track home equity and mortgage payoff. <br><b>Growth:</b> Annual increase in property value.<br><b>Include in NW:</b> Toggle this if you plan to sell the home to fund retirement. If unchecked, it remains an asset but isn't counted as liquid retirement cash." />
                </h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('properties', { name: `Primary Residence`, value: 800000, mortgage: 400000, rate: 3.5, payment: 2000, growth: 3.0, includeInNW: true })}>
                <i className="bi bi-plus-lg me-1"></i> Add Property
            </button>
          </div>
          <div className="card-body p-4">
            {data.properties.length === 0 && <div className="text-center text-muted small fst-italic">No properties added.</div>}
            {data.properties.map((prop: any, idx: number) => (
              <div className="p-3 border border-secondary rounded-3 surface-card mb-3 shadow-sm" key={`prop_${idx}`}>
                <div className="d-flex justify-content-between mb-3 align-items-center">
                    <input type="text" className="form-control form-control-sm bg-transparent border-0 text-danger fw-bold fs-5 w-50 px-0" value={prop.name || ''} onChange={(e) => updateArrayItem('properties', idx, 'name', e.target.value)} />
                    <button type="button" className="btn btn-sm btn-link text-danger p-1 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('properties', idx)}><i className="bi bi-x-lg fs-5"></i></button>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4"><label className="form-label small text-muted">Value ($)</label><CurrencyInput className="form-control" value={prop.value ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'value', val)} /></div>
                  <div className="col-12 col-md-4"><label className="form-label small text-muted">Mortgage ($)</label><CurrencyInput className="form-control" value={prop.mortgage ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'mortgage', val)} /></div>
                  
                  {/* Monthly Payment with 25y Auto-Calc Button */}
                  <div className="col-12 col-md-4">
                      <label className="form-label small text-muted d-flex justify-content-between align-items-end w-100 mb-1">
                          <span>Monthly Pay ($)</span>
                          {prop.mortgage > 0 && prop.rate > 0 && (
                              <button type="button" className="btn btn-sm btn-link p-0 text-info fw-bold text-decoration-none" style={{fontSize: '0.65rem'}} onClick={() => updateArrayItem('properties', idx, 'payment', Math.round(calc25YearPayment(prop.mortgage, prop.rate)))}>
                                  Set 25y Min
                              </button>
                          )}
                      </label>
                      <CurrencyInput className="form-control" value={prop.payment ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'payment', val)} />
                      <div className="text-info fw-bold mt-1 text-end" style={{fontSize: '0.7rem', height: '14px'}}>
                          {prop.mortgage > 0 && prop.payment > 0 ? `Est. Payoff: ${calcAmortization(prop.mortgage, prop.rate, prop.payment)}` : ''}
                      </div>
                  </div>
                </div>
                <div className="row g-3 align-items-center mt-0">
                  <div className="col-6 col-md-4"><label className="form-label small text-muted">Mortgage Rate (%)</label><PercentInput className="form-control" value={prop.rate} onChange={(val: any) => updateArrayItem('properties', idx, 'rate', val)} /></div>
                  <div className="col-6 col-md-4"><label className="form-label small text-muted">Property Growth (%)</label><PercentInput className="form-control" value={prop.growth} onChange={(val: any) => updateArrayItem('properties', idx, 'growth', val)} /></div>
                  <div className="col-12 col-md-4 mt-md-4 pt-md-2">
                    <div className="form-check form-switch d-flex align-items-center mb-0 ps-0 gap-2">
                        <input className="form-check-input ms-0 mt-0 cursor-pointer" type="checkbox" checked={prop.includeInNW ?? false} onChange={(e) => updateArrayItem('properties', idx, 'includeInNW', e.target.checked)} />
                        <label className="form-check-label small text-muted fw-bold mt-0 cursor-pointer">Include in Net Worth</label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Income & Taxation */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
              <i className="bi bi-cash-coin text-warning fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                  5. Income & Taxation
                  <InfoBtn align="left" title="Income & Tax" text="Enter <b>Gross Annual Income</b> (before tax). The system automatically calculates Federal and Provincial taxes based on your selected Province. <br><br>Use 'Add Stream' for side hustles or rental income." />
              </h5>
          </div>
          <div className="card-body p-4">
            <div className="col-md-4 mb-4">
                <label className="form-label fw-bold">Province</label>
                <select className="form-select fw-bold bg-input border border-secondary" value={data.inputs.tax_province} onChange={(e) => updateInput('tax_province', e.target.value)}>
                    <option value="ON">Ontario</option><option value="AB">Alberta</option><option value="BC">British Columbia</option><option value="MB">Manitoba</option><option value="NB">New Brunswick</option><option value="NL">Newfoundland & Labrador</option><option value="NS">Nova Scotia</option><option value="PE">Prince Edward Island</option><option value="QC">Quebec</option><option value="SK">Saskatchewan</option><option value="NT">Northwest Territories</option><option value="NU">Nunavut</option><option value="YT">Yukon</option>
                </select>
            </div>
            <div className="row g-4">
              {['p1', 'p2'].map((p) => {
                if (!isCouple && p === 'p2') return null;
                return (
                <div className="col-12 col-xl-6" key={p}>
                  <div className="card h-100 border-secondary surface-card shadow-none">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between mb-4 border-bottom border-secondary pb-2">
                        <h6 className={`fw-bold text-uppercase ls-1 ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color:'var(--bs-purple)'} : {}}>{p.toUpperCase()} Income</h6>
                        <div className="d-flex gap-2">
                          <button type="button" className={`btn btn-sm btn-outline-${p === 'p1' ? 'info' : 'primary'} rounded-pill px-3 py-1 fw-bold`} style={p === 'p2' ? {color:'var(--bs-purple)', borderColor:'var(--bs-purple)'} : {}} onClick={() => addArrayItem('additionalIncome', { owner: p, name: 'Side Hustle', amount: 5000, freq: 'year', growth: 2.0, startMode: 'date', start: '2026-01', endMode: 'never', taxable: true })}>+ Stream</button>
                        </div>
                      </div>
                      <div className="row g-3 mb-4">
                        <div className="col-8">
                            <label className="form-label d-flex align-items-center">Gross Income <InfoBtn align={p==='p2'?'right':'center'} title="Gross Annual Income" text="Your current base salary or gross income before taxes."/></label>
                            <CurrencyInput className="form-control" value={data.inputs[`${p}_income`] ?? ''} onChange={(val: any) => updateInput(`${p}_income`, val)} />
                        </div>
                        <div className="col-4">
                            <label className="form-label d-flex align-items-center">Growth <InfoBtn align="right" title="Growth" text="Estimated annual raise or growth rate of your income."/></label>
                            <PercentInput className="form-control" value={data.inputs[`${p}_income_growth`]} onChange={(val: any) => updateInput(`${p}_income_growth`, val)} />
                        </div>
                      </div>
                      <div className="row g-3 mb-4 border-top border-secondary pt-3">
                        <div className="col-6">
                            <label className="form-label d-flex align-items-center text-nowrap">RRSP Max Match <InfoBtn align={p==='p2'?'right':'center'} title="RRSP Max Match" text="The maximum percentage of your gross salary that your employer will contribute to your RRSP."/></label>
                            <PercentInput className="form-control" value={data.inputs[`${p}_rrsp_match`]} onChange={(val: any) => updateInput(`${p}_rrsp_match`, val)} />
                        </div>
                        <div className="col-6">
                            <label className="form-label d-flex align-items-center text-nowrap">Match Rate <InfoBtn align="right" title="Match Rate" text="The percentage of your contribution the employer matches. E.g., if they match 50 cents on the dollar, enter 50."/></label>
                            <PercentInput className="form-control" value={data.inputs[`${p}_rrsp_match_tier`]} onChange={(val: any) => updateInput(`${p}_rrsp_match_tier`, val)} />
                        </div>
                      </div>

                      {/* Addl Streams Map */}
                      {data.additionalIncome.filter((inc: any) => inc.owner === p).map((inc: any) => {
                          const realIdx = data.additionalIncome.indexOf(inc);
                          const updateInc = (field: string, val: any) => updateArrayItem('additionalIncome', realIdx, field, val);
                          return (
                            <div className="p-3 border border-secondary rounded-4 bg-input mb-3 shadow-sm" key={`inc_${realIdx}`}>
                              <div className="d-flex justify-content-between mb-3 align-items-center">
                                  <input type="text" className={`form-control form-control-sm bg-transparent border-0 fw-bold fs-6 p-0 ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color:'var(--bs-purple)'} : {}} value={inc.name || ''} onChange={(e) => updateInc('name', e.target.value)} placeholder="Income Name" />
                                  <button type="button" className="btn btn-sm btn-link text-danger p-1 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('additionalIncome', realIdx)}><i className="bi bi-x-lg fs-5"></i></button>
                              </div>
                              <div className="row g-2 align-items-end mb-3">
                                  <div className="col-4">
                                      <label className="small text-muted mb-1">Amount ($)</label>
                                      <CurrencyInput className="form-control form-control-sm" value={inc.amount} onChange={(val: any) => updateInc('amount', val)} />
                                  </div>
                                  <div className="col-4">
                                      <label className="small text-muted mb-1">Frequency</label>
                                      <select className="form-select form-select-sm fw-bold text-muted cursor-pointer" value={inc.freq || 'year'} onChange={(e) => updateInc('freq', e.target.value)}><option value="year">/yr</option><option value="month">/mo</option></select>
                                  </div>
                                  <div className="col-4">
                                      <label className="small text-muted mb-1">Growth (%)</label>
                                      <PercentInput className="form-control form-control-sm" value={inc.growth ?? 2.0} onChange={(val: any) => updateInc('growth', val)} />
                                  </div>
                              </div>
                              <div className="row g-2 align-items-end mb-1">
                                  <div className="col-6">
                                      <label className="small text-muted mb-1 d-block border-bottom border-secondary pb-1">Starts</label>
                                      <select className="form-select form-select-sm border-secondary mb-1 text-muted cursor-pointer fw-bold" value={inc.startMode || 'date'} onChange={e => updateInc('startMode', e.target.value)}>
                                          <option value="date">Specific Date</option>
                                          <option value="ret_relative">Relative to Ret.</option>
                                      </select>
                                      {inc.startMode === 'ret_relative' ? (
                                          <div className="input-group input-group-sm border border-secondary rounded overflow-hidden">
                                            <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2" placeholder="Yrs" value={inc.startRelative ?? 0} onChange={e => updateInc('startRelative', e.target.value)} />
                                            <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                          </div>
                                      ) : (
                                          <input type="month" className="form-control form-control-sm fw-bold border-secondary bg-input text-main" value={inc.start} onChange={e => updateInc('start', e.target.value)} />
                                      )}
                                  </div>
                                  <div className="col-6">
                                      <label className="small text-muted mb-1 d-block border-bottom border-secondary pb-1">Ends</label>
                                      <select className="form-select form-select-sm border-secondary mb-1 text-muted cursor-pointer fw-bold" value={inc.endMode || 'never'} onChange={e => updateInc('endMode', e.target.value)}>
                                          <option value="never">Never (For Life)</option>
                                          <option value="date">Specific Date</option>
                                          <option value="ret_relative">Relative to Ret.</option>
                                      </select>
                                      {inc.endMode === 'ret_relative' ? (
                                          <div className="input-group input-group-sm border border-secondary rounded overflow-hidden">
                                            <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2" placeholder="Yrs" value={inc.endRelative ?? 0} onChange={e => updateInc('endRelative', e.target.value)} />
                                            <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                          </div>
                                      ) : inc.endMode === 'date' ? (
                                          <input type="month" className="form-control form-control-sm fw-bold border-secondary bg-input text-main" value={inc.end} onChange={e => updateInc('end', e.target.value)} />
                                      ) : null}
                                  </div>
                              </div>
                            </div>
                          );
                      })}
                      {renderTaxBox(p === 'p1' ? results?.timeline?.[0]?.taxDetailsP1 : results?.timeline?.[0]?.taxDetailsP2, p === 'p1' ? p1Gross : p2Gross)}
                    </div>
                  </div>
                </div>
              )})}
            </div>

            <div className="card border-primary border-opacity-50 bg-primary bg-opacity-10 mt-4 shadow-sm">
                <div className="card-body p-4">
                  <div className="row text-center align-items-center">
                    <div className="col-md-6 border-end border-primary border-opacity-25 mb-3 mb-md-0">
                      <div className="small fw-bold text-primary text-uppercase ls-1 mb-2">Total Household (Gross)</div>
                      <div className="fs-3 fw-bold text-primary mb-1">{formatCurrency(hhGross)} <span className="fs-6 text-muted fw-normal">/yr</span></div>
                      <div className="small text-muted fw-bold">{formatCurrency(hhGross / 12)} /mo</div>
                    </div>
                    <div className="col-md-6">
                      <div className="small fw-bold text-success text-uppercase ls-1 mb-2">Total Household (After-Tax Net)</div>
                      <div className="fs-3 fw-bold text-success mb-1">{formatCurrency(hhNet)} <span className="fs-6 text-muted fw-normal">/yr</span></div>
                      <div className="small text-muted fw-bold">{formatCurrency(hhNet / 12)} /mo</div>
                    </div>
                  </div>
                </div>
            </div>

          </div>
        </div>

        {/* 6. Living Expenses - MODERN REWORK */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
                <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                    <i className="bi bi-cart4 text-main me-3"></i>6. Living Expenses
                    <InfoBtn align="left" title="Budgeting" text="Enter your current monthly or annual spending. <br><br><b>Simple Mode:</b> Set one budget for working years and one for retirement.<br><b>Advanced Mode:</b> Define spending for 3 phases of retirement: Go-Go (Active), Slow-Go (Less active), and No-Go (Late stage)." />
                </h5>
            </div>
            <div className="form-check form-switch mb-0">
                <input className="form-check-input mt-1 cursor-pointer" type="checkbox" checked={expenseAdvancedMode} onChange={(e) => setExpenseAdvancedMode(e.target.checked)} />
                <label className="form-check-label small fw-bold text-muted ms-1 cursor-pointer">Adv. Mode</label>
            </div>
          </div>
          <div className="card-body p-3 p-md-4">
            
            {expenseAdvancedMode && (
              <div className="row g-4 mb-4 p-4 border border-secondary rounded-4 surface-card shadow-sm">
                <div className="col-md-6 d-flex align-items-center gap-3">
                    <label className="form-label text-info fw-bold mb-0 text-nowrap">Go-Go Age Ends:</label>
                    <StepperInput min={60} max={100} value={data.inputs.exp_gogo_age || 75} onChange={(val: any) => {
                        updateInput('exp_gogo_age', val);
                        if (val > (data.inputs.exp_slow_age || 85)) updateInput('exp_slow_age', val);
                    }} />
                </div>
                <div className="col-md-6 d-flex align-items-center gap-3">
                    <label className="form-label text-primary fw-bold mb-0 text-nowrap">Slow-Go Age Ends:</label>
                    <StepperInput min={60} max={120} value={data.inputs.exp_slow_age || 85} onChange={(val: any) => {
                        if (val >= (data.inputs.exp_gogo_age || 75)) updateInput('exp_slow_age', val);
                    }} />
                </div>
              </div>
            )}
            
            <div className="d-flex flex-column gap-4">
                {Object.keys(data.expensesByCategory).map(cat => (
                    <div className="card surface-card border-secondary shadow-sm rounded-4 overflow-hidden" key={cat}>
                        <div className="card-header bg-black bg-opacity-25 border-bottom border-secondary d-flex justify-content-between align-items-center p-3">
                            <h6 className="text-uppercase mb-0 fw-bold d-flex align-items-center gap-2">
                                {getCategoryIcon(cat)} <span className="ls-1">{cat}</span>
                            </h6>
                            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" style={{fontSize: '0.75rem'}} onClick={() => { 
                                const newList = [...data.expensesByCategory[cat].items, { name: '', curr: 0, ret: 0, trans: 0, gogo: 0, slow: 0, nogo: 0, freq: 12 }]; 
                                updateExpenseCategory(cat, newList); 
                            }}>
                                <i className="bi bi-plus-lg me-1"></i> Add Item
                            </button>
                        </div>
                        <div className="card-body p-0 table-responsive hide-scrollbar">
                            <table className="table table-borderless table-hover align-middle mb-0 m-0 w-100" style={{ minWidth: expenseAdvancedMode ? '1000px' : '650px' }}>
                                <thead className="border-bottom border-secondary text-muted text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '0.05em'}}>
                                    <tr>
                                        <th className="ps-4 py-3 fw-semibold" style={{ width: '25%' }}>Expense Item</th>
                                        <th className="py-3 fw-semibold text-end">Working</th>
                                        {expenseAdvancedMode && <th className="py-3 fw-semibold text-end text-warning">Transition</th>}
                                        <th className="py-3 fw-semibold text-end">Retire (Base)</th>
                                        {expenseAdvancedMode && <>
                                            <th className="py-3 fw-semibold text-end text-info">Go-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">(Ret. to {data.inputs.exp_gogo_age || 75})</span></th>
                                            <th className="py-3 fw-semibold text-end text-primary">Slow-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">({data.inputs.exp_gogo_age || 75} to {data.inputs.exp_slow_age || 85})</span></th>
                                            <th className="py-3 fw-semibold text-end text-secondary">No-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">({data.inputs.exp_slow_age || 85}+)</span></th>
                                        </>}
                                        <th className="py-3 fw-semibold text-center" style={{width: '130px'}}>Frequency</th>
                                        <th className="pe-4 py-3 text-end" style={{width: '50px'}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expensesByCategory[cat].items.map((exp:any, idx:number) => (
                                        <tr key={`${cat}_${idx}`} className="border-bottom border-secondary border-opacity-25">
                                            <td className="ps-4 py-2">
                                                <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold text-main px-0 shadow-none" placeholder="Item name..." value={exp.name || ''} onChange={(e) => updateExpense(cat, idx, 'name', e.target.value)} />
                                            </td>
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm" noBg={true} value={exp.curr ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'curr', val)} /></td>
                                            {expenseAdvancedMode && <td className="py-2"><CurrencyInput className="form-control form-control-sm text-warning" noBg={true} value={exp.trans ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'trans', val)} /></td>}
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm" noBg={true} value={exp.ret ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'ret', val)} /></td>
                                            {expenseAdvancedMode && (
                                                <>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-info" noBg={true} value={exp.gogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'gogo', val)} /></td>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary" noBg={true} value={exp.slow ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'slow', val)} /></td>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-secondary" noBg={true} value={exp.nogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'nogo', val)} /></td>
                                                </>
                                            )}
                                            <td className="py-2 text-center">
                                                <select className="form-select form-select-sm bg-input border-secondary text-muted rounded-pill px-3 py-1 w-100 fw-bold cursor-pointer" style={{fontSize: '0.8rem'}} value={exp.freq || 12} onChange={(e) => updateExpense(cat, idx, 'freq', parseInt(e.target.value))}>
                                                    <option value={12}>Monthly</option>
                                                    <option value={1}>Annually</option>
                                                </select>
                                            </td>
                                            <td className="pe-4 py-2 text-end">
                                                <button type="button" className="btn btn-sm btn-link text-danger p-1 opacity-75 hover-opacity-100" onClick={() => { const newList = [...data.expensesByCategory[cat].items]; newList.splice(idx, 1); updateExpenseCategory(cat, newList); }}>
                                                    <i className="bi bi-x-lg fs-5"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="card border-primary border-opacity-50 surface-card mt-4 shadow-sm">
                <div className="card-body p-4">
                    <div className="row text-center">
                        <div className="col-6 border-end border-primary border-opacity-25">
                            <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Annual Working Budget</div>
                            <div className="fs-3 fw-bold text-main mb-1">{formatCurrency(calcExpenseTotal('curr'))}</div>
                            <div className="small text-muted fw-bold">{formatCurrency(calcExpenseTotal('curr') / 12)} /mo</div>
                        </div>
                        <div className="col-6">
                            <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Annual Retirement (Base)</div>
                            <div className="fs-3 fw-bold text-primary mb-1">{formatCurrency(calcExpenseTotal('ret'))}</div>
                            <div className="small text-muted fw-bold">{formatCurrency(calcExpenseTotal('ret') / 12)} /mo</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* 7. Future Expenses */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
                <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                    <i className="bi bi-cart-plus text-danger me-3"></i>7. Future Expenses & Debts
                    <InfoBtn align="left" title="Large Purchases" text="Plan for future large expenses (like buying a car, renovation, or wedding) or lump-sum debt payoffs. <br><br>The amount will be deducted directly from your cash flow in the selected year." />
                </h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('debt', { name: 'New Expense', amount: 20000, start: '2026-01' })}>
                <i className="bi bi-plus-lg me-1"></i> Add Expense
            </button>
          </div>
          <div className="card-body p-4">{data.debt.map((d: any, idx: number) => (
              <div className="row g-3 mb-3 align-items-end" key={`debt_${idx}`}>
                  <div className="col-5"><label className="form-label small text-muted">Name</label><input type="text" className="form-control fw-medium" value={d.name || ''} onChange={(e) => updateArrayItem('debt', idx, 'name', e.target.value)} /></div>
                  <div className="col-4"><label className="form-label small text-muted">Amount ($)</label><CurrencyInput className="form-control" value={d.amount ?? ''} onChange={(val: any) => updateArrayItem('debt', idx, 'amount', val)} /></div>
                  <div className="col-2"><label className="form-label small text-muted">Year</label><input type="month" className="form-control fw-bold bg-input border-secondary text-main" value={d.start || ''} onChange={(e) => updateArrayItem('debt', idx, 'start', e.target.value)} /></div>
                  <div className="col-1"><button type="button" className="btn btn-sm btn-link text-danger p-1 w-100 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('debt', idx)}><i className="bi bi-x-lg fs-5"></i></button></div>
              </div>
          ))}</div>
        </div>

        {/* 8. Windfalls */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
                <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                    <i className="bi bi-gift text-success me-3"></i>8. Windfalls & Inheritance
                    <InfoBtn align="left" title="Windfalls" text="One-time cash inflows like inheritance, selling a business, or downsizing property. <br><b>Taxable:</b> Check this if the amount will be added to your taxable income for that year (e.g. severance, RRSP deregistration)." />
                </h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('windfalls', { name: 'Inheritance', amount: 100000, start: '2030-01' })}>
                <i className="bi bi-plus-lg me-1"></i> Add Event
            </button>
          </div>
          <div className="card-body p-4">{data.windfalls.map((w: any, idx: number) => (
              <div className="row g-3 mb-3 align-items-end" key={`wind_${idx}`}>
                  <div className="col-5"><label className="form-label small text-muted">Description</label><input type="text" className="form-control fw-medium" value={w.name || ''} onChange={(e) => updateArrayItem('windfalls', idx, 'name', e.target.value)} /></div>
                  <div className="col-4"><label className="form-label small text-muted">Amount ($)</label><CurrencyInput className="form-control" value={w.amount ?? ''} onChange={(val: any) => updateArrayItem('windfalls', idx, 'amount', val)} /></div>
                  <div className="col-2"><label className="form-label small text-muted">Year</label><input type="month" className="form-control fw-bold bg-input border-secondary text-main" value={w.start || ''} onChange={(e) => updateArrayItem('windfalls', idx, 'start', e.target.value)} /></div>
                  <div className="col-1"><button type="button" className="btn btn-sm btn-link text-danger p-1 w-100 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('windfalls', idx)}><i className="bi bi-x-lg fs-5"></i></button></div>
              </div>
          ))}</div>
        </div>

        {/* 9. Gov Benefits */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header border-bottom border-secondary p-3 surface-card">
              <div className="d-flex align-items-center">
                  <i className="bi bi-bank text-primary fs-4 me-3"></i>
                  <h5 className="mb-0 fw-bold text-uppercase ls-1">9. Government Benefits</h5>
                  <InfoBtn align="left" title="CPP / OAS / Pension" text="<b>CPP:</b> Enter the estimate from your Service Canada account. The app will automatically adjust it if you take it early (age 60) or late (age 70).<br><br><b>OAS:</b> Max OAS requires 40 years of residency in Canada between ages 18 and 65. If you have less, it is prorated." />
              </div>
          </div>
          <div className="card-body p-4">
            
            {isCouple && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="p-3 border border-secondary rounded-3 surface-card bg-info bg-opacity-10">
                            <div className="form-check form-switch d-flex align-items-center gap-3 ms-2 mb-0">
                                <input className="form-check-input fs-4 mt-0 cursor-pointer" type="checkbox" id="pension_split_enabled" checked={data.inputs.pension_split_enabled ?? false} onChange={(e) => updateInput('pension_split_enabled', e.target.checked)} />
                                <div>
                                    <label className="form-check-label fw-bold cursor-pointer" htmlFor="pension_split_enabled">Enable Pension Income Splitting</label>
                                    <div className="small text-muted">Automatically optimizes taxes by splitting eligible pension income (RRIF, LIF, DB Pension) between spouses aged 65+.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
              {['p1', 'p2'].map((p) => {
                if (!isCouple && p === 'p2') return null;
                return (
                <div className="col-12 col-md-6" key={p}>
                    <div className="p-4 border border-secondary rounded-3 h-100 surface-card">
                        <h6 className={`fw-bold text-uppercase mb-4 pb-2 border-bottom border-secondary ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color: 'var(--bs-purple)'} : {}}>{p.toUpperCase()} Benefits</h6>
                        
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <label className="form-label mb-0 fw-bold fs-6 text-main">Canada Pension Plan (CPP)</label>
                                <div className="form-check form-switch min-h-0 mb-0"><input className="form-check-input mt-0 fs-5 cursor-pointer" type="checkbox" role="switch" checked={data.inputs[`${p}_cpp_enabled`] ?? true} onChange={(e) => updateInput(`${p}_cpp_enabled`, e.target.checked)} /></div>
                            </div>
                            {(data.inputs[`${p}_cpp_enabled`] ?? true) && (
                                <div>
                                    <label className="form-label small text-muted mb-2">Est. Payout at 65/yr</label>
                                    <CurrencyInput className="form-control mb-3" value={data.inputs[`${p}_cpp_est_base`]} onChange={(val: any) => updateInput(`${p}_cpp_est_base`, val)} />
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="small text-muted fw-bold">Starts at Age:</span>
                                        <StepperInput min={60} max={70} value={data.inputs[`${p}_cpp_start`]} onChange={(val: any) => updateInput(`${p}_cpp_start`, val)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mb-4 pt-4 border-top border-secondary">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <label className="form-label mb-0 fw-bold fs-6 text-main">Old Age Security (OAS)</label>
                                <div className="form-check form-switch min-h-0 mb-0"><input className="form-check-input mt-0 fs-5 cursor-pointer" type="checkbox" role="switch" checked={data.inputs[`${p}_oas_enabled`] ?? true} onChange={(e) => updateInput(`${p}_oas_enabled`, e.target.checked)} /></div>
                            </div>
                            {(data.inputs[`${p}_oas_enabled`] ?? true) && (
                                <div>
                                    <div className="d-flex align-items-center gap-3">
                                        <span className="small text-muted fw-bold">Starts at Age:</span>
                                        <StepperInput min={65} max={70} value={data.inputs[`${p}_oas_start`]} onChange={(val: any) => updateInput(`${p}_oas_start`, val)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-top border-secondary">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <label className="form-label mb-0 fw-bold fs-6 text-main">Defined Benefit (DB) Pension</label>
                                <div className="form-check form-switch min-h-0 mb-0">
                                    <input className="form-check-input mt-0 fs-5 cursor-pointer" type="checkbox" role="switch" checked={p === 'p1' ? p1DbEnabled : p2DbEnabled} onChange={(e) => p === 'p1' ? setP1DbEnabled(e.target.checked) : setP2DbEnabled(e.target.checked)} />
                                </div>
                            </div>
                            {(p === 'p1' ? p1DbEnabled : p2DbEnabled) && (
                                <>
                                    <div className="mb-3 border-bottom border-secondary pb-3 mt-3">
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center">
                                                <label className="form-label small fw-bold text-muted mb-0">Index to Inflation</label>
                                                <InfoBtn align={p==='p2'?'right':'center'} title="Index to Inflation" text="If checked, the pension amount will grow with inflation. If unchecked, the payout remains flat for life." />
                                            </div>
                                            <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" role="switch" checked={data.inputs[`${p}_db_indexed`] ?? true} onChange={(e) => updateInput(`${p}_db_indexed`, e.target.checked)} /></div>
                                        </div>
                                        <label className="form-label small fw-bold mb-2" style={p === 'p2' ? {color: 'var(--bs-purple)'} : {color: 'var(--bs-info)'}}>Lifetime Pension / mo</label>
                                        <CurrencyInput className="form-control mb-3" suffix="/mo" value={data.inputs[`${p}_db_lifetime`] ?? ''} onChange={(val: any) => updateInput(`${p}_db_lifetime`, val)} />
                                        <div className="d-flex align-items-center gap-3 mt-2">
                                            <span className="small text-muted fw-bold">Starts at Age:</span>
                                            <StepperInput min={50} max={75} value={data.inputs[`${p}_db_lifetime_start`] ?? 60} onChange={(val: any) => updateInput(`${p}_db_lifetime_start`, val)} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label small fw-bold mb-2" style={p === 'p2' ? {color: 'var(--bs-purple)'} : {color: 'var(--bs-info)'}}>Bridge Benefit <span className="text-muted fw-normal">(Ends at 65)</span></label>
                                        <CurrencyInput className="form-control mb-3" suffix="/mo" value={data.inputs[`${p}_db_bridge`] ?? ''} onChange={(val: any) => updateInput(`${p}_db_bridge`, val)} />
                                        <div className="d-flex align-items-center gap-3 mt-2">
                                            <span className="small text-muted fw-bold">Starts at Age:</span>
                                            <StepperInput min={50} max={65} value={data.inputs[`${p}_db_bridge_start`] ?? 60} onChange={(val: any) => updateInput(`${p}_db_bridge_start`, val)} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                    </div>
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* 10. Economic Assumptions */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header surface-card border-bottom border-secondary p-3"><h5 className="mb-0 fw-bold text-uppercase ls-1"><i className="bi bi-graph-up-arrow text-secondary me-3"></i>10. Economic Assumptions</h5></div>
          <div className="card-body p-4"><div className="col-md-4"><label className="form-label fw-bold mb-2 d-flex align-items-center">Long-term Inflation Rate <InfoBtn align="left" title="Inflation Rate" text="The expected annual increase in the cost of living. The Bank of Canada target is 2.0%."/></label><PercentInput className="form-control mb-2" value={data.inputs.inflation_rate} onChange={(val: any) => updateInput('inflation_rate', val)} /></div></div>
        </div>

      </form>
    </div>
  );
}