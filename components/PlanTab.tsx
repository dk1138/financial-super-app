import React, { useState, useEffect, useRef } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FINANCIAL_CONSTANTS } from '../lib/config';

const ACCOUNT_TYPES = [
  { id: 'cash', label: 'Cash', icon: 'bi-cash-stack', color: 'text-success', tooltip: 'Interest income is 100% taxable at your marginal rate. No tax sheltering.' },
  { id: 'tfsa', label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info', tooltip: 'Tax-Free Savings Account. Growth and withdrawals are 100% tax-free.' },
  { id: 'fhsa', label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary', tooltip: 'First Home Savings Account. Tax-deductible contributions, tax-free withdrawals for a qualifying first home.' },
  { id: 'rrsp', label: 'RRSP', icon: 'bi-bank2', color: 'text-danger', tooltip: 'Registered Retirement Savings Plan. Tax-deductible contributions. Tax-deferred growth. 100% taxable withdrawals.' },
  { id: 'resp', label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple', tooltip: 'Registered Education Savings Plan. 20% CESG match on first $2,500/yr.' },
  { id: 'lirf', label: 'LIRA', icon: 'bi-lock-fill', color: 'text-secondary', tooltip: 'Locked-in Retirement Account (LIRA). Pension funds locked until retirement. Tax-deferred.' },
  { id: 'lif', label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary', tooltip: 'Life Income Fund. Payout vehicle for LIRA. Has min/max annual limits. 100% taxable.' },
  { id: 'rrif_acct', label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger', tooltip: 'Registered Retirement Income Fund. Payout vehicle for RRSP. Mandatory minimum withdrawals. 100% taxable.' }
];

const EXTENDED_ACCOUNT_TYPES = [
  { id: 'tfsa', label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info' },
  { id: 'rrsp', label: 'RRSP', icon: 'bi-bank2', color: 'text-danger' },
  { id: 'fhsa', label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary' },
  { id: 'nonreg', label: 'Non-Reg', icon: 'bi-graph-up-arrow', color: 'text-secondary' },
  { id: 'crypto', label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-warning' },
  { id: 'cash', label: 'Cash', icon: 'bi-cash-stack', color: 'text-success' },
  { id: 'lirf', label: 'LIRA', icon: 'bi-lock-fill', color: 'text-secondary' },
  { id: 'lif', label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary' },
  { id: 'rrif_acct', label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger' },
  { id: 'resp', label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple' }
];

const calcAmortization = (principal: number, rate: number, payment: number) => {
    if (!principal || !payment || principal <= 0 || payment <= 0) return '';
    const r = (rate || 0) / 100 / 12; 
    if (r === 0) return `${Math.floor((principal/payment) / 12)}y ${Math.ceil((principal/payment) % 12)}m`;
    if (payment <= principal * r) return 'Never (Payment too low)';
    const months = -Math.log(1 - (r * principal) / payment) / Math.log(1 + r);
    if (!isFinite(months)) return '';
    return `${Math.floor(months / 12)}y ${Math.ceil(months % 12)}m`;
};

const calc25YearPayment = (principal: number, rate: number) => {
    if (!principal || principal <= 0) return 0;
    const r = (rate || 0) / 100 / 12;
    if (r === 0) return principal / 300;
    return (principal * r) / (1 - Math.pow(1 + r, -300));
};

const getAdjustedCPP = (basePerYear: number, startAge: number) => {
    let val = Number(basePerYear) || 0;
    let diff = (startAge - 65) * 12;
    if (diff < 0) val *= (1 - (Math.abs(diff) * 0.006));
    else if (diff > 0) val *= (1 + (diff * 0.007));
    return val;
};

const getAdjustedOAS = (yearsInCanada: number, startAge: number) => {
    let maxOAS = FINANCIAL_CONSTANTS?.MAX_OAS || 8560; 
    let proportion = Math.max(0, Math.min(40, yearsInCanada || 40)) / 40;
    let val = maxOAS * proportion;
    let diff = (startAge - 65) * 12;
    if (diff > 0) val *= (1 + (diff * 0.006));
    return val;
};

// --- ZERO-LAG UI COMPONENTS ---

const CustomAccountDropdown = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const selected = EXTENDED_ACCOUNT_TYPES.find(a => a.id === value) || EXTENDED_ACCOUNT_TYPES[0];

    return (
        <div className="position-relative w-100 d-flex align-items-center bg-black bg-opacity-25 border border-secondary rounded-3 shadow-sm px-2 overflow-hidden" style={{ height: '31px' }}>
            <i className={`bi ${selected.icon} ${selected.color} flex-shrink-0`} style={{fontSize: '0.85rem'}}></i>
            <select
                className="form-select form-select-sm bg-transparent border-0 text-main fw-bold shadow-none p-0 ps-2"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ outline: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
            >
                {EXTENDED_ACCOUNT_TYPES.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-dark text-light">
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

const SegmentedControl = ({ options, value, onChange }: any) => (
    <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1 shadow-sm w-100">
        {options.map((opt: any) => {
            const isActive = value === opt.value;
            return (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-3 py-1 flex-grow-1 ${isActive ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`}
                    style={{ fontSize: '0.75rem' }}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

const ProvinceSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [localVal, setLocalVal] = useState(value);
    useEffect(() => setLocalVal(value), [value]);

    const handleToggle = (newVal: string) => {
        setLocalVal(newVal);
        setTimeout(() => onChange(newVal), 50);
    };

    const provs = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'NB', 'NS', 'PE', 'NL', 'YT', 'NT', 'NU'];

    return (
        <div className="d-flex flex-wrap bg-input border border-secondary rounded-4 p-1 gap-1 shadow-sm">
            {provs.map(p => (
                <button 
                    key={p} type="button" onClick={() => handleToggle(p)} 
                    className={`btn btn-sm rounded-pill fw-bold border-0 transition-all py-2 flex-grow-1 ${localVal === p ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} 
                    style={{ fontSize: '0.8rem', minWidth: '45px' }}
                >
                    {p}
                </button>
            ))}
        </div>
    );
};

const FrequencyToggle = ({ value, onChange, mode = 'number' }: { value: any, onChange: (val: any) => void, mode?: 'number'|'string' }) => {
    const [localVal, setLocalVal] = useState(value);
    useEffect(() => setLocalVal(value), [value]);

    const handleToggle = (isMonthly: boolean) => {
        const newVal = isMonthly ? (mode === 'number' ? 12 : 'month') : (mode === 'number' ? 1 : 'year');
        setLocalVal(newVal);
        setTimeout(() => onChange(newVal), 50); 
    };

    const isMo = localVal === 12 || localVal === 'month';
    const isYr = localVal === 1 || localVal === 'year';

    return (
        <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1 shadow-sm w-100">
            <button type="button" onClick={() => handleToggle(true)} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 w-50 ${isMo ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>/mo</button>
            <button type="button" onClick={() => handleToggle(false)} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 w-50 ${isYr ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>/yr</button>
        </div>
    );
};

// --- DATA INPUTS ---
const CurrencyInput = ({ value, onChange, className, placeholder, style, disabled, suffix, noBg }: any) => {
    const [localValue, setLocalValue] = useState('');
    useEffect(() => {
        if (value !== undefined && value !== '' && value !== null) { setLocalValue(Number(Math.round(value)).toLocaleString('en-US')); } else { setLocalValue(''); }
    }, [value]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let rawStr = e.target.value;
        if (rawStr.length > 15) rawStr = rawStr.substring(0, 15);
        const rawValue = rawStr.replace(/[^0-9]/g, ''); 
        if (rawValue === '') onChange(''); else onChange(parseInt(rawValue, 10));
    };
    return (
        <div className="position-relative w-100 d-flex align-items-center" style={{ minWidth: 0 }}>
            <span className="position-absolute text-muted fw-bold" style={{ left: noBg ? '4px' : '10px', fontSize: '0.9em', pointerEvents: 'none', zIndex: 5 }}>$</span>
            <input type="text" maxLength={15} className={`w-100 ${className} text-start ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'} ${disabled ? 'opacity-50' : ''}`} style={{ ...style, minWidth: 0, paddingLeft: noBg ? '16px' : '22px', paddingRight: suffix ? '45px' : '8px', fontWeight: '600', outline: 'none' }} value={localValue} onChange={handleChange} placeholder={placeholder} disabled={disabled} />
            {suffix && <span className="position-absolute text-muted small fw-bold" style={{ right: '10px', pointerEvents: 'none', zIndex: 5 }}>{suffix}</span>}
        </div>
    );
};

const PercentInput = ({ value, onChange, className, placeholder, noBg, disabled }: any) => {
    const [focused, setFocused] = useState(false);
    let displayValue = value ?? '';
    if (!focused && displayValue !== '') displayValue = Number(displayValue).toFixed(2);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (val.length > 8) val = val.substring(0, 8);
        onChange(val === '' ? '' : parseFloat(val));
    };

    return (
        <div className="position-relative w-100 d-flex align-items-center" style={{ minWidth: 0 }}>
            <input type="number" step="0.01" max={1000} min={-100} className={`w-100 ${className} text-start ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'} ${disabled ? 'opacity-50 bg-secondary bg-opacity-25' : ''}`} style={{ minWidth: 0, paddingLeft: '8px', paddingRight: '22px', fontWeight: '600', outline: 'none' }} value={focused ? (value ?? '') : displayValue} onChange={handleChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder} disabled={disabled} />
            <span className="position-absolute text-muted fw-bold" style={{ right: '8px', fontSize: '0.9em', pointerEvents: 'none', zIndex: 5 }}>%</span>
        </div>
    );
};

// Pure React State InfoBtn (Identical to DashboardTab) - Safe from clipping!
const InfoBtn = ({ title, text, align = 'center', direction = 'down' }: { title: string, text: string, align?: 'center'|'right'|'left', direction?: 'up'|'down' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { backgroundColor: 'var(--bg-card)', minWidth: '280px' };
    
    if (direction === 'up') { posStyles.bottom = '140%'; } 
    else { posStyles.top = '140%'; }

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

const StepperInput = ({ value, onChange, min, max, suffix = "" }: any) => {
    const numVal = Number(value) || 0; 
    const [textVal, setTextVal] = useState(numVal.toString());
    useEffect(() => { setTextVal(numVal.toString()); }, [numVal]);
    
    const handleDec = () => { if (numVal > min) onChange(numVal - 1); };
    const handleInc = () => { if (numVal < max) onChange(numVal + 1); };
    
    const handleBlur = () => {
        let parsed = parseInt(textVal);
        if (isNaN(parsed)) parsed = numVal;
        parsed = Math.max(min, Math.min(max, parsed)); 
        setTextVal(parsed.toString());
        onChange(parsed);
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { 
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); 
    };
    
    return (
        <div className="d-inline-flex align-items-center bg-input border border-secondary rounded-pill p-1 shadow-sm w-100 justify-content-between">
            <button type="button" className="btn btn-sm btn-link text-muted p-0 px-2 d-flex align-items-center text-decoration-none hover-opacity-100" onClick={handleDec}><i className="bi bi-dash-circle-fill fs-5"></i></button>
            <div className="d-flex align-items-center justify-content-center flex-grow-1">
                <input type="text" maxLength={4} className="bg-transparent border-0 text-center fw-bold text-main p-0 m-0 w-100" style={{ outline: 'none', boxShadow: 'none', fontSize: '0.95rem' }} value={textVal} onChange={(e) => setTextVal(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} />
                {suffix && <span className="text-muted fw-bold pe-1" style={{fontSize: '0.95rem'}}>{suffix}</span>}
            </div>
            <button type="button" className="btn btn-sm btn-link text-primary p-0 px-2 d-flex align-items-center text-decoration-none hover-opacity-100" onClick={handleInc}><i className="bi bi-plus-circle-fill fs-5"></i></button>
        </div>
    );
};

const MonthYearStepper = ({ value, onChange, minYear = 1900, maxYear = 2100 }: any) => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const [yearStr, monthStr] = (value || "1990-01").split('-');
    const y = parseInt(yearStr, 10) || 1990;
    const m = parseInt(monthStr, 10) || 1;

    const [localY, setLocalY] = useState(y.toString());
    const [localM, setLocalM] = useState(MONTHS[m - 1]);

    useEffect(() => { 
        setLocalY(y.toString()); 
        setLocalM(MONTHS[m - 1]);
    }, [y, m]);

    const commitDate = (newY: number, newM: number) => {
        const safeY = Math.max(minYear, Math.min(maxYear, newY));
        const safeM = Math.max(1, Math.min(12, newM));
        onChange(`${safeY}-${safeM.toString().padStart(2, '0')}`);
    };

    const handleYDec = () => commitDate(y - 1, m);
    const handleYInc = () => commitDate(y + 1, m);
    
    const handleMDec = () => { 
        let newM = m - 1; let newY = y;
        if (newM < 1) { newM = 12; newY--; }
        commitDate(newY, newM);
    };
    const handleMInc = () => { 
        let newM = m + 1; let newY = y;
        if (newM > 12) { newM = 1; newY++; }
        commitDate(newY, newM);
    };

    const commitY = () => {
        let parsed = parseInt(localY, 10);
        if(isNaN(parsed)) parsed = y;
        commitDate(parsed, m);
    };

    const commitM = () => {
        let parsed = parseInt(localM, 10);
        if (!isNaN(parsed)) {
            commitDate(y, parsed);
        } else {
            const idx = MONTHS.findIndex(mo => mo.toLowerCase() === localM.toLowerCase().trim());
            if (idx !== -1) {
                commitDate(y, idx + 1);
            } else {
                commitDate(y, m); 
            }
        }
    };

    return (
        <div className="d-inline-flex align-items-center bg-input border border-secondary rounded-pill p-1 shadow-sm gap-1 w-100 justify-content-between" style={{ minWidth: '170px' }}>
            <div className="d-flex align-items-center flex-grow-1 justify-content-center">
                <button type="button" className="btn btn-sm btn-link text-muted p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleMDec}><i className="bi bi-dash-circle-fill fs-5"></i></button>
                <input 
                    type="text" 
                    maxLength={3}
                    className="bg-transparent border-0 text-center fw-bold text-main p-0 m-0" 
                    style={{ width: '40px', outline: 'none', fontSize: '0.95rem' }} 
                    value={localM} 
                    onChange={e => setLocalM(e.target.value)} 
                    onBlur={commitM} 
                    onFocus={e => (e.target as HTMLInputElement).select()}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} 
                />
                <button type="button" className="btn btn-sm btn-link text-primary p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleMInc}><i className="bi bi-plus-circle-fill fs-5"></i></button>
            </div>
            <div className="border-start border-secondary opacity-50 flex-shrink-0" style={{height: '20px'}}></div>
            <div className="d-flex align-items-center flex-grow-1 justify-content-center">
                <button type="button" className="btn btn-sm btn-link text-muted p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleYDec}><i className="bi bi-dash-circle-fill fs-5"></i></button>
                <input 
                    type="text" 
                    maxLength={4}
                    className="bg-transparent border-0 text-center fw-bold text-main p-0 m-0" 
                    style={{ width: '46px', outline: 'none', fontSize: '0.95rem' }} 
                    value={localY} 
                    onChange={e => setLocalY(e.target.value)} 
                    onBlur={commitY} 
                    onFocus={e => (e.target as HTMLInputElement).select()}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} 
                />
                <button type="button" className="btn btn-sm btn-link text-primary p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleYInc}><i className="bi bi-plus-circle-fill fs-5"></i></button>
            </div>
        </div>
    );
};

export default function PlanTab() {
  const { data, results, updateInput, updateMultipleInputs, updateMode, addArrayItem, updateArrayItem, removeArrayItem, updateExpenseCategory } = useFinance(); 
  
  const [expenseAdvancedMode, setExpenseAdvancedMode] = useState(false);
  const [p1DbEnabled, setP1DbEnabled] = useState(data.inputs.p1_db_enabled ?? false);
  const [p2DbEnabled, setP2DbEnabled] = useState(data.inputs.p2_db_enabled ?? false);
  
  const [assetsOpen, setAssetsOpen] = useState(true);

  const isCouple = data.mode === 'Couple';
  const hasAutoAllocation = data.inputs.portfolio_allocation !== 'custom' && data.inputs.portfolio_allocation !== undefined;
  const showAssetMixUI = data.inputs.asset_mode_advanced ?? false;

  const [localAlloc, setLocalAlloc] = useState(data.inputs.portfolio_allocation || 'custom');
  const [localGlide, setLocalGlide] = useState(data.inputs.use_glide_path || false);

  useEffect(() => {
      setLocalAlloc(data.inputs.portfolio_allocation || 'custom');
      setLocalGlide(data.inputs.use_glide_path || false);
      setP1DbEnabled(data.inputs.p1_db_enabled ?? false);
      setP2DbEnabled(data.inputs.p2_db_enabled ?? false);
  }, [data.inputs.portfolio_allocation, data.inputs.use_glide_path, data.inputs.p1_db_enabled, data.inputs.p2_db_enabled]);

  const handleDobChange = (player: 'p1'|'p2', dobStr: string) => {
      updateInput(`${player}_dob`, dobStr);
      const newAge = new Date().getFullYear() - parseInt(dobStr.split('-')[0]);
      updateInput(`${player}_age`, newAge);

      const currentRetAge = data.inputs[`${player}_retireAge`] || 60;
      const currentLifeExp = data.inputs[`${player}_lifeExp`] || 90;

      if (newAge > currentRetAge) updateInput(`${player}_retireAge`, newAge);
      if (newAge > currentLifeExp) updateInput(`${player}_lifeExp`, newAge);
  };

  const handleAgeChange = (player: 'p1'|'p2', newAge: number) => {
      const currentYear = new Date().getFullYear();
      const currentMonth = (data.inputs[`${player}_dob`] || "1990-01").split('-')[1];
      const newBirthYear = currentYear - newAge;
      
      updateInput(`${player}_dob`, `${newBirthYear}-${currentMonth}`);
      updateInput(`${player}_age`, newAge);

      const currentRetAge = data.inputs[`${player}_retireAge`] || 60;
      const currentLifeExp = data.inputs[`${player}_lifeExp`] || 90;

      if (newAge > currentRetAge) updateInput(`${player}_retireAge`, newAge);
      if (newAge > currentLifeExp) updateInput(`${player}_lifeExp`, newAge);
  };

  const handleAllocationChange = (val: string) => {
      if (val === 'custom') {
          updateInput('portfolio_allocation', val);
          return;
      }
      
      let rate = 6.0;
      if (val === 'aggressive') rate = 8.0;
      if (val === 'balanced') rate = 6.0;
      if (val === 'conservative') rate = 4.5;

      const updates: Record<string, any> = { portfolio_allocation: val };
      
      ['p1', 'p2'].forEach(p => {
          ['tfsa', 'rrsp', 'nonreg', 'lirf', 'lif', 'rrif_acct', 'fhsa', 'resp'].forEach(acct => {
              updates[`${p}_${acct}_ret`] = rate;
              updates[`${p}_${acct}_retire_ret`] = rate;
          });
          updates[`${p}_crypto_ret`] = rate + 2.0; 
          updates[`${p}_crypto_retire_ret`] = rate + 2.0;
          updates[`${p}_cash_ret`] = 2.0;
          updates[`${p}_cash_retire_ret`] = 2.0;
      });

      updateMultipleInputs(updates);
  };

  const handleAllocationChangeWrapper = (val: string) => {
      setLocalAlloc(val); 
      setTimeout(() => handleAllocationChange(val), 50); 
  };

  const handleGlideChangeWrapper = (checked: boolean) => {
      setLocalGlide(checked);
      setTimeout(() => updateInput('use_glide_path', checked), 50);
  };

  const handleManualReturnChange = (key: string, val: any) => {
      if (data.inputs.portfolio_allocation !== 'custom') {
          updateMultipleInputs({ portfolio_allocation: 'custom', [key]: val });
      } else {
          updateInput(key, val);
      }
  };

  const updateExpense = (cat: string, idx: number, field: string, value: any) => {
    const newItems = [...data.expensesByCategory[cat].items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    updateExpenseCategory(cat, newItems);
  };

  const customP1Total = data.customAssets?.filter((a: any) => a.owner === 'p1').reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0) || 0;
  const customP2Total = data.customAssets?.filter((a: any) => a.owner === 'p2').reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0) || 0;

  const p1Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p1_${acct.id}`]) || 0), 0) + (Number(data.inputs['p1_nonreg']) || 0) + (Number(data.inputs['p1_crypto']) || 0) + customP1Total;
  const p2Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p2_${acct.id}`]) || 0), 0) + (Number(data.inputs['p2_nonreg']) || 0) + (Number(data.inputs['p2_crypto']) || 0) + customP2Total;
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
          <div className="border border-secondary rounded-4 overflow-hidden mt-4 shadow-sm">
            <div className="bg-danger bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3">
                <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-receipt"></i></div>
                <span className="fw-bold text-danger small text-uppercase ls-1">Estimated Tax Breakdown</span>
            </div>
            <div className="p-3 bg-input d-flex flex-column gap-2">
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-50 pb-2"><span className="text-muted small fw-medium">Federal Tax</span> <span className="small fw-bold">(${Math.round(taxDetails.fed).toLocaleString()}) <span className="text-muted fw-normal ms-1">{((taxDetails.fed/gross)*100).toFixed(1)}%</span></span></div>
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-50 pb-2"><span className="text-muted small fw-medium">Provincial Tax</span> <span className="small fw-bold">(${Math.round(taxDetails.prov).toLocaleString()}) <span className="text-muted fw-normal ms-1">{((taxDetails.prov/gross)*100).toFixed(1)}%</span></span></div>
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-50 pb-2"><span className="text-muted small fw-medium">CPP / EI Premiums</span> <span className="small fw-bold">(${Math.round(taxDetails.cpp_ei).toLocaleString()})</span></div>
              <div className="d-flex justify-content-between mt-1"><span className="text-danger fw-bold small">Total Tax Paid</span> <span className="text-danger fw-bold small">(${Math.round(taxDetails.totalTax).toLocaleString()})</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted small fw-medium">Marginal Rate</span> <span className="small fw-bold">{(taxDetails.margRate*100).toFixed(1)}%</span></div>
              <div className="d-flex justify-content-between mt-2 pt-3 border-top border-secondary"><span className="text-success fw-bold">After-Tax Net</span> <span className="text-success fw-bold fs-5">${Math.round(gross - taxDetails.totalTax).toLocaleString()}</span></div>
            </div>
          </div>
      );
  };

  const getCategoryIcon = (cat: string) => {
      const icons: Record<string, any> = {
          housing: <i className="bi bi-house-door-fill text-primary"></i>,
          transport: <i className="bi bi-car-front-fill text-info"></i>,
          lifestyle: <i className="bi bi-airplane-fill text-primary"></i>,
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
  const totalTax = (results?.timeline?.[0]?.taxP1 || 0) + (isCouple ? (results?.timeline?.[0]?.taxP2 || 0) : 0);
  
  const hhNet = hhGross > 0 ? Math.max(0, hhGross - totalTax) : 0;

  return (
    <div className="p-3 p-md-4">

      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type="number"] {
            -moz-appearance: textfield;
        }
      `}</style>

      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        
        {/* 1. Personal Information */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-vcard text-primary fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1">1. Personal Information</h5>
              <InfoBtn title="Personal Details" text="Set your Age (or Date of Birth) and targeted Retirement Age. <br><br><b>Life Expectancy</b> defines how long the simulation runs (ensuring you don't run out of money too early)." />
            </div>
            <div className="d-inline-flex bg-input rounded-pill p-1 border border-secondary shadow-sm">
                <button type="button" className={`btn btn-sm rounded-pill px-4 fw-bold transition-all border-0 ${!isCouple ? 'bg-primary shadow text-white' : 'text-muted bg-transparent hover-opacity-100'}`} onClick={() => updateMode('Single')}>Single</button>
                <button type="button" className={`btn btn-sm rounded-pill px-4 fw-bold transition-all border-0 ${isCouple ? 'shadow text-white' : 'text-muted bg-transparent hover-opacity-100'}`} style={isCouple ? {backgroundColor: 'var(--bs-purple)'} : {}} onClick={() => updateMode('Couple')}>Couple</button>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              
              <div className="col-12 col-xl-6">
                <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card">
                    <div className="bg-info bg-opacity-10 border-bottom border-secondary p-3 d-flex align-items-center gap-3">
                        <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center" style={{width: '36px', height: '36px'}}>
                            <i className="bi bi-person-fill fs-5"></i>
                        </div>
                        <h6 className="fw-bold mb-0 text-uppercase ls-1 text-info">Player 1 (P1)</h6>
                    </div>
                    <div className="p-3 d-flex flex-column gap-2 bg-secondary bg-opacity-10 h-100">
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Birth Date</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><MonthYearStepper value={data.inputs.p1_dob} onChange={(val: string) => handleDobChange('p1', val)} /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Current Age</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={18} max={100} value={data.inputs.p1_age ?? 38} onChange={(val: any) => handleAgeChange('p1', val)} /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Target Retirement</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={data.inputs.p1_age ?? 18} max={100} value={data.inputs.p1_retireAge ?? 60} onChange={(val: any) => { updateInput(`p1_retireAge`, val); if (val > (data.inputs.p1_lifeExp || 90)) updateInput('p1_lifeExp', val); }} /></div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                            <span className="small text-muted fw-bold text-nowrap">Life Expectancy</span>
                            <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={Math.max(data.inputs.p1_age ?? 18, data.inputs.p1_retireAge ?? 60)} max={120} value={data.inputs.p1_lifeExp ?? 90} onChange={(val: any) => updateInput(`p1_lifeExp`, val)} /></div>
                        </div>
                    </div>
                </div>
              </div>
              
              {isCouple && (
                <div className="col-12 col-xl-6">
                    <div className="p-0 border border-secondary rounded-4 overflow-hidden h-100 shadow-sm surface-card">
                        <div className="border-bottom border-secondary p-3 d-flex align-items-center gap-3" style={{ backgroundColor: 'rgba(111, 66, 193, 0.1)' }}>
                            <div className="rounded-circle d-flex align-items-center justify-content-center" style={{width: '36px', height: '36px', backgroundColor: 'rgba(111, 66, 193, 0.25)', color: 'var(--bs-purple)'}}>
                                <i className="bi bi-person-fill fs-5"></i>
                            </div>
                            <h6 className="fw-bold mb-0 text-uppercase ls-1" style={{color: 'var(--bs-purple)'}}>Player 2 (P2)</h6>
                        </div>
                        <div className="p-3 d-flex flex-column gap-2 bg-secondary bg-opacity-10 h-100">
                            <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                                <span className="small text-muted fw-bold text-nowrap">Birth Date</span>
                                <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><MonthYearStepper value={data.inputs.p2_dob} onChange={(val: string) => handleDobChange('p2', val)} /></div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                                <span className="small text-muted fw-bold text-nowrap">Current Age</span>
                                <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={18} max={100} value={data.inputs.p2_age ?? 34} onChange={(val: any) => handleAgeChange('p2', val)} /></div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                                <span className="small text-muted fw-bold text-nowrap">Target Retirement</span>
                                <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={data.inputs.p2_age ?? 18} max={100} value={data.inputs.p2_retireAge ?? 60} onChange={(val: any) => { updateInput(`p2_retireAge`, val); if (val > (data.inputs.p2_lifeExp || 90)) updateInput('p2_lifeExp', val); }} /></div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center p-2 px-3 bg-input border border-secondary rounded-3 shadow-sm gap-3">
                                <span className="small text-muted fw-bold text-nowrap">Life Expectancy</span>
                                <div className="w-50 flex-grow-1" style={{maxWidth: '240px'}}><StepperInput min={Math.max(data.inputs.p2_age ?? 18, data.inputs.p2_retireAge ?? 60)} max={120} value={data.inputs.p2_lifeExp ?? 95} onChange={(val: any) => updateInput(`p2_lifeExp`, val)} /></div>
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
            
            <div className="row g-3">
                {data.dependents.map((dep: any, index: number) => (
                    <div className="col-12 col-xl-6" key={`dep_${index}`}>
                        <div className="d-flex align-items-center justify-content-between p-3 border border-secondary rounded-4 bg-secondary bg-opacity-10 shadow-sm h-100 gap-3">
                            <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '40px', height: '40px'}}>
                                <i className="bi bi-emoji-smile-fill fs-5"></i>
                            </div>
                            <div className="d-flex flex-column flex-md-row gap-3 w-100 align-items-md-center">
                                <input type="text" maxLength={50} className="form-control bg-transparent border-0 fw-bold fs-6 p-0 shadow-none text-main flex-grow-1" placeholder="Child's Name" value={dep.name || ''} onChange={(e) => updateArrayItem('dependents', index, 'name', e.target.value)} />
                                <div style={{minWidth: '200px'}} className="w-100 flex-shrink-0">
                                    <MonthYearStepper value={dep.dob || ''} onChange={(val: string) => updateArrayItem('dependents', index, 'dob', val)} />
                                </div>
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-2 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeArrayItem('dependents', index)}>
                                <i className="bi bi-x-lg fs-5"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* 3. Portfolio Assets & Asset Allocation (MODERN CARD GRID) */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-wallet2 text-success fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                  3. Portfolio Assets 
              </h5>
            </div>
            <div className="form-check form-switch mb-0">
              <input className="form-check-input mt-1 cursor-pointer" type="checkbox" checked={showAssetMixUI} onChange={(e) => updateInput('asset_mode_advanced', e.target.checked)} />
              <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-1 cursor-pointer">Adv. Mode</label>
            </div>
          </div>
          <div className="card-body p-4">
            
            <div className="p-3 border border-secondary rounded-3 bg-secondary bg-opacity-10 mb-4 d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3 shadow-sm">
                <div className="d-flex align-items-center gap-3" style={{ minWidth: '250px' }}>
                    <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner flex-shrink-0" style={{width: '40px', height: '40px'}}>
                        <i className="bi bi-pie-chart-fill fs-5"></i>
                    </div>
                    <div>
                        <h6 className="fw-bold mb-1">Asset Allocation</h6>
                        <span className="small text-muted">Preset or manual rates.</span>
                    </div>
                </div>
                
                <div className="d-flex flex-column flex-lg-row gap-3 w-100 justify-content-lg-end align-items-lg-center">
                    <SegmentedControl 
                        value={localAlloc} 
                        onChange={handleAllocationChangeWrapper} 
                        options={[
                            { value: 'custom', label: 'Custom' },
                            { value: 'aggressive', label: 'Aggressive' },
                            { value: 'balanced', label: 'Balanced' },
                            { value: 'conservative', label: 'Conservative' }
                        ]} 
                    />
                    
                    <div className="form-check form-switch mb-0 d-flex align-items-center px-0 justify-content-start flex-shrink-0 border-start border-secondary ps-lg-3 ms-lg-1 pt-2 pt-lg-0">
                        <label className="form-check-label small fw-bold text-primary cursor-pointer me-2 text-nowrap" htmlFor="use_glide_path">
                            Glide Path <InfoBtn direction="up" title="Glide Path" text="Automatically reduces your equity exposure (risk) by 0.1% per year starting at Age 50 to protect your wealth heading into retirement." />
                        </label>
                        <input className="form-check-input ms-0 mt-0 cursor-pointer fs-5" type="checkbox" id="use_glide_path" checked={localGlide} onChange={e => handleGlideChangeWrapper(e.target.checked)} />
                    </div>
                </div>
            </div>

            <div className="row g-4">
              {['p1', 'p2'].map((p) => {
                if (!isCouple && p === 'p2') return null;
                const isP1 = p === 'p1';
                
                const playerCustomAssets = data.customAssets?.filter((ca: any) => ca.owner === p) || [];

                return (
                <div className="col-12" key={p}>
                  <div className="card border-secondary surface-card shadow-none h-100">
                    <div className="card-body p-3 p-md-4">
                      
                      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary cursor-pointer user-select-none" onClick={() => setAssetsOpen(!assetsOpen)}>
                          <h6 className={`fw-bold text-uppercase ls-1 mb-0 ${isP1 ? 'text-info' : ''}`} style={!isP1 ? {color: 'var(--bs-purple)'} : {}}>{p.toUpperCase()} Asset Mix</h6>
                          <button type="button" className="btn btn-sm btn-link text-muted p-0"><i className={`bi bi-chevron-${assetsOpen ? 'up' : 'down'} fs-5`}></i></button>
                      </div>

                      {assetsOpen && (
                          <div className="d-flex flex-column gap-4 mb-2 transition-all">
                              
                              {/* --- BENTO BOX GRID LAYOUT (No Overflow Wrappers!) --- */}
                              <div className="row g-3">
                                  
                                  {/* Standard Accounts */}
                                  {ACCOUNT_TYPES.map(acct => (
                                      <div className="col-12 col-md-6 col-xxl-4" key={`${p}_${acct.id}`}>
                                          <div className="bg-input border border-secondary rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-between">
                                              
                                              <div className="d-flex justify-content-between align-items-center mb-3">
                                                  <div className="d-flex align-items-center gap-2">
                                                      <i className={`bi ${acct.icon} fs-5 ${acct.color}`}></i>
                                                      <span className="fw-bold text-main small">{acct.label}</span>
                                                  </div>
                                                  <InfoBtn align="right" title={acct.label} text={acct.tooltip} />
                                              </div>

                                              <div className="d-flex flex-column gap-3">
                                                  <div>
                                                      <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Balance</label>
                                                      <CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct.id}`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct.id}`, val)} placeholder="$0" />
                                                  </div>
                                                  <div className="row g-2">
                                                      <div className={showAssetMixUI ? "col-6" : "col-12"}>
                                                          <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Pre %</label>
                                                          <PercentInput disabled={hasAutoAllocation && acct.id !== 'cash'} className="form-control form-control-sm" value={data.inputs[`${p}_${acct.id}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct.id}_ret`, val)} />
                                                      </div>
                                                      {showAssetMixUI && (
                                                          <div className="col-6">
                                                              <label className="small text-primary mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Post %</label>
                                                              <PercentInput disabled={hasAutoAllocation && acct.id !== 'cash'} className="form-control form-control-sm border-primary text-primary" value={data.inputs[`${p}_${acct.id}_retire_ret`] ?? data.inputs[`${p}_${acct.id}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct.id}_retire_ret`, val)} />
                                                          </div>
                                                      )}
                                                  </div>
                                              </div>

                                          </div>
                                      </div>
                                  ))}

                                  {/* Non-Reg & Crypto Accounts */}
                                  {['nonreg', 'crypto'].map(acct => (
                                      <div className="col-12 col-md-6 col-xxl-4" key={`${p}_adv_${acct}`}>
                                          <div className="bg-input border border-secondary rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-between">
                                              
                                              <div className="d-flex justify-content-between align-items-center mb-3">
                                                  <div className="d-flex align-items-center gap-2">
                                                      <i className={`bi ${acct === 'crypto' ? 'bi-currency-bitcoin text-primary' : 'bi-graph-up-arrow text-secondary'} fs-5`}></i>
                                                      <span className="fw-bold text-main small">{acct === 'crypto' ? 'Crypto' : 'Non-Reg'}</span>
                                                  </div>
                                                  <InfoBtn align="right" title={acct === 'crypto' ? 'Crypto' : 'Non-Reg'} text={acct === 'nonreg' ? 'Taxable Investment Account. Yields taxed annually. Capital gains taxed at 50% inclusion.' : 'Capital Asset. Gains subject to Capital Gains Tax when sold.'} />
                                              </div>

                                              <div className="d-flex flex-column gap-3">
                                                  <div>
                                                      <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Market Value</label>
                                                      <CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct}`, val)} placeholder="$0" />
                                                  </div>
                                                  
                                                  <div className="row g-2">
                                                      <div className={showAssetMixUI ? "col-6" : "col-12"}>
                                                          <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Pre %</label>
                                                          <PercentInput disabled={hasAutoAllocation} className="form-control form-control-sm" value={data.inputs[`${p}_${acct}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct}_ret`, val)} />
                                                      </div>
                                                      {showAssetMixUI && (
                                                          <div className="col-6">
                                                              <label className="small text-primary mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Post %</label>
                                                              <PercentInput disabled={hasAutoAllocation} className="form-control form-control-sm border-primary text-primary" value={data.inputs[`${p}_${acct}_retire_ret`] ?? data.inputs[`${p}_${acct}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct}_retire_ret`, val)} />
                                                          </div>
                                                      )}
                                                  </div>

                                                  <div className="mt-1 pt-3 border-top border-secondary border-opacity-25 row g-2">
                                                      <div className="col-6">
                                                          <label className="small text-muted mb-1 fw-bold text-uppercase ls-1 d-flex align-items-center" style={{fontSize: '0.65rem'}}>
                                                              ACB
                                                              <InfoBtn align="left" title="Adjusted Cost Base (ACB)" text="The total capital you've contributed to this account. Used to calculate capital gains tax. Only the growth above this number is taxed." />
                                                          </label>
                                                          <CurrencyInput className="form-control form-control-sm border-warning text-warning" value={data.inputs[`${p}_${acct}_acb`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct}_acb`, val)} placeholder="$0" />
                                                      </div>
                                                      <div className="col-6">
                                                          <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Yield %</label>
                                                          <PercentInput disabled={hasAutoAllocation && acct !== 'crypto'} className="form-control form-control-sm border-warning text-warning" value={data.inputs[`${p}_${acct}_yield`]} onChange={(val: any) => updateInput(`${p}_${acct}_yield`, val)} placeholder="Yield" />
                                                      </div>
                                                  </div>
                                              </div>

                                          </div>
                                      </div>
                                  ))}

                              </div>

                              {/* --- CUSTOM ACCOUNTS (CARD GRID) --- */}
                              <div className="mt-3 pt-4 border-top border-secondary">
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-0">Additional Accounts</h6>
                                      <button type="button" className={`btn btn-sm rounded-pill px-3 py-1 fw-bold btn-outline-${isP1 ? 'info' : 'primary'}`} style={!isP1 ? {color:'var(--bs-purple)', borderColor:'var(--bs-purple)'} : {}} onClick={() => addArrayItem('customAssets', { owner: p, name: '', type: 'tfsa', balance: 0, rate: 6.0, retireRate: 6.0, acb: 0 })}>
                                          <i className="bi bi-plus-lg me-1"></i> Add Account
                                      </button>
                                  </div>
                                  
                                  {playerCustomAssets.length === 0 && (
                                      <div className="text-center small text-muted fst-italic py-3 border border-secondary border-opacity-50 rounded-4">No additional accounts added.</div>
                                  )}
                                  
                                  <div className="row g-3">
                                      {playerCustomAssets.map((ca: any) => {
                                          const globalIdx = data.customAssets.indexOf(ca);
                                          const updateCa = (field: string, val: any) => updateArrayItem('customAssets', globalIdx, field, val);
                                          const isNonReg = ca.type === 'nonreg' || ca.type === 'crypto';

                                          return (
                                              <div className="col-12 col-md-6 col-xxl-4" key={`ca_${globalIdx}`}>
                                                  <div className="bg-input border border-secondary rounded-4 p-3 shadow-sm h-100 d-flex flex-column justify-content-between">
                                                      
                                                      <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
                                                          <div className="flex-grow-1" style={{maxWidth: '180px'}}>
                                                              <CustomAccountDropdown value={ca.type || 'tfsa'} onChange={val => updateCa('type', val)} />
                                                          </div>
                                                          <button type="button" className="btn btn-sm btn-link text-danger p-0 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('customAssets', globalIdx)} title="Remove Account">
                                                              <i className="bi bi-x-lg" style={{fontSize: '1rem'}}></i>
                                                          </button>
                                                      </div>

                                                      <div className="d-flex flex-column gap-3">
                                                          <div>
                                                              <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Account Name</label>
                                                              <input type="text" maxLength={30} className="form-control form-control-sm shadow-sm border border-secondary bg-black bg-opacity-25 text-main" style={{fontWeight: '600'}} value={ca.name || ''} onChange={(e) => updateCa('name', e.target.value)} placeholder="e.g. Wealthsimple TFSA" />
                                                          </div>

                                                          <div>
                                                              <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Balance</label>
                                                              <CurrencyInput className="form-control form-control-sm" value={ca.balance ?? ''} onChange={(val: any) => updateCa('balance', val)} placeholder="$0" />
                                                          </div>
                                                          
                                                          <div className="row g-2">
                                                              <div className={showAssetMixUI ? "col-6" : "col-12"}>
                                                                  <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Pre %</label>
                                                                  <PercentInput disabled={hasAutoAllocation && ca.type !== 'cash'} className="form-control form-control-sm" value={ca.rate} onChange={(val: any) => updateCa('rate', val)} />
                                                              </div>
                                                              {showAssetMixUI && (
                                                                  <div className="col-6">
                                                                      <label className="small text-primary mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Post %</label>
                                                                      <PercentInput disabled={hasAutoAllocation && ca.type !== 'cash'} className="form-control form-control-sm border-primary text-primary" value={ca.retireRate ?? ca.rate} onChange={(val: any) => updateCa('retireRate', val)} />
                                                                  </div>
                                                              )}
                                                          </div>

                                                          {isNonReg && (
                                                              <div className="mt-1 pt-3 border-top border-secondary border-opacity-25 row g-2">
                                                                  <div className="col-6">
                                                                      <label className="small text-muted mb-1 fw-bold text-uppercase ls-1 d-flex align-items-center" style={{fontSize: '0.65rem'}}>
                                                                          ACB
                                                                          <InfoBtn align="left" title="Adjusted Cost Base (ACB)" text="The total capital you've contributed to this account." />
                                                                      </label>
                                                                      <CurrencyInput className="form-control form-control-sm border-warning text-warning" value={ca.acb ?? ''} onChange={(val: any) => updateCa('acb', val)} placeholder="$0" />
                                                                  </div>
                                                                  <div className="col-6">
                                                                      <label className="small text-muted mb-1 fw-bold text-uppercase ls-1" style={{fontSize: '0.65rem'}}>Yield %</label>
                                                                      <PercentInput disabled={hasAutoAllocation && ca.type !== 'crypto'} className="form-control form-control-sm border-warning text-warning" value={ca.yield ?? ''} onChange={(val: any) => updateCa('yield', val)} placeholder="Yield" />
                                                                  </div>
                                                              </div>
                                                          )}
                                                      </div>

                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>

                          </div>
                      )}

                      {!assetsOpen && <div className="text-center text-muted small fst-italic py-2" onClick={() => setAssetsOpen(!assetsOpen)} style={{cursor: 'pointer'}}>Click to expand account details</div>}

                    </div>
                  </div>
                </div>
              )})}
            </div>

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
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('properties', { name: `Primary Residence`, value: 800000, mortgage: 400000, rate: 3.5, payment: 2000, growth: 3.0, includeInNW: true, sellEnabled: false })}>
                <i className="bi bi-plus-lg me-1"></i> Add Property
            </button>
          </div>
          <div className="card-body p-4">
            {data.properties.length === 0 && <div className="text-center text-muted small fst-italic">No properties added.</div>}
            
            {data.properties.map((prop: any, idx: number) => (
                <div className="p-0 border border-secondary rounded-4 overflow-hidden mb-4 shadow-sm" key={`prop_${idx}`}>
                    
                    <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-3 d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-3 w-75">
                            <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '40px', height: '40px'}}>
                                <i className="bi bi-house-door-fill fs-5"></i>
                            </div>
                            <input type="text" maxLength={50} className="form-control bg-transparent border-0 text-main fw-bold fs-5 px-0 shadow-none" value={prop.name || ''} onChange={(e) => updateArrayItem('properties', idx, 'name', e.target.value)} placeholder="Property Name" />
                        </div>
                        <div className="d-flex align-items-center gap-3">
                            <div className="form-check form-switch mb-0 d-flex align-items-center" title="Include property equity in total Net Worth">
                                <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={prop.includeInNW ?? false} onChange={(e) => updateArrayItem('properties', idx, 'includeInNW', e.target.checked)} />
                                <label className="form-check-label small fw-bold text-muted ms-2 cursor-pointer d-none d-md-block">Include in NW</label>
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('properties', idx)}><i className="bi bi-x-lg fs-5"></i></button>
                        </div>
                    </div>

                    <div className="p-4 bg-input">
                        <div className="row g-4">
                            
                            <div className="col-12 col-xl-5 border-end-xl border-secondary pe-xl-4">
                                <h6 className="fw-bold text-success small text-uppercase ls-1 mb-3"><i className="bi bi-graph-up-arrow me-2"></i>Property Value</h6>
                                <div className="row g-3">
                                    <div className="col-sm-7">
                                        <label className="form-label small text-muted mb-1">Current Value ($)</label>
                                        <CurrencyInput className="form-control" value={prop.value ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'value', val)} />
                                    </div>
                                    <div className="col-sm-5">
                                        <label className="form-label small text-muted mb-1">Growth (%)</label>
                                        <PercentInput className="form-control" value={prop.growth} onChange={(val: any) => updateArrayItem('properties', idx, 'growth', val)} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-12 col-xl-7 ps-xl-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="fw-bold text-danger small text-uppercase ls-1 mb-0"><i className="bi bi-bank me-2"></i>Mortgage Details</h6>
                                    {prop.mortgage > 0 && prop.rate > 0 && (
                                        <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 fw-bold" style={{fontSize: '0.7rem'}} onClick={() => updateArrayItem('properties', idx, 'payment', Math.round(calc25YearPayment(prop.mortgage, prop.rate)))}>
                                            <i className="bi bi-magic me-1 text-primary"></i> Auto 25-Yr
                                        </button>
                                    )}
                                </div>
                                <div className="row g-3">
                                    <div className="col-sm-4">
                                        <label className="form-label small text-muted mb-1">Balance ($)</label>
                                        <CurrencyInput className="form-control" value={prop.mortgage ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'mortgage', val)} />
                                    </div>
                                    <div className="col-sm-4">
                                        <label className="form-label small text-muted mb-1">Int. Rate (%)</label>
                                        <PercentInput className="form-control" value={prop.rate} onChange={(val: any) => updateArrayItem('properties', idx, 'rate', val)} />
                                    </div>
                                    <div className="col-sm-4">
                                        <label className="form-label small text-muted mb-1">Payment /mo ($)</label>
                                        <CurrencyInput className="form-control" value={prop.payment ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'payment', val)} />
                                        <div className="text-info fw-bold mt-1 text-end text-nowrap" style={{fontSize: '0.7rem', height: '14px', letterSpacing: '-0.2px'}}>
                                            {prop.mortgage > 0 && prop.payment > 0 ? `Payoff: ${calcAmortization(prop.mortgage, prop.rate, prop.payment)}` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* HOME UPGRADE UI */}
                            <div className="col-12 mt-2 pt-3 border-top border-secondary border-opacity-25">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-house-up-fill text-info fs-5"></i>
                                        <span className="fw-bold text-main small text-uppercase ls-1">Future Sell / Upgrade Plan</span>
                                        <InfoBtn title="Home Upgrade" text="Simulate selling this property at a specific age. <br><br>If you enter a Replacement Value, it will buy a new home (applying 5% seller fees and 2% buyer fees), roll the equity, and calculate a new mortgage if needed. <br><br>If Replacement Value is $0, you downsize to renting and keep the cash." />
                                    </div>
                                    <div className="form-check form-switch mb-0">
                                        <input className="form-check-input mt-0 cursor-pointer fs-5" type="checkbox" checked={prop.sellEnabled ?? false} onChange={(e) => updateArrayItem('properties', idx, 'sellEnabled', e.target.checked)} />
                                    </div>
                                </div>

                                {prop.sellEnabled && (
                                    <div className="row g-3 bg-info bg-opacity-10 p-3 rounded-4 border border-secondary border-opacity-50">
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small text-muted mb-1 fw-bold">Sell at P1 Age</label>
                                            <div style={{maxWidth: '200px'}}>
                                                <StepperInput min={data.inputs.p1_age || 18} max={120} value={prop.sellAge ?? (data.inputs.p1_retireAge || 60)} onChange={(val: any) => updateArrayItem('properties', idx, 'sellAge', val)} />
                                            </div>
                                        </div>
                                        <div className="col-12 col-md-6">
                                            <label className="form-label small text-muted mb-1 fw-bold">Replacement Home Value</label>
                                            <CurrencyInput className="form-control border-secondary bg-black bg-opacity-25" value={prop.replacementValue ?? 0} onChange={(val: any) => updateArrayItem('properties', idx, 'replacementValue', val)} placeholder="Target Price (Today's $)" />
                                        </div>
                                    </div>
                                )}
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
              <i className="bi bi-cash-coin text-success fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                  5. Income & Taxation
                  <InfoBtn align="left" title="Income & Tax" text="Enter <b>Gross Annual Income</b> (before tax). The system automatically calculates Federal and Provincial taxes based on your selected Province." />
              </h5>
          </div>
          <div className="card-body p-4">
            
            <div className="mb-5">
                <label className="form-label fw-bold small text-muted text-uppercase ls-1">Province of Residence</label>
                <div className="d-flex w-100">
                    <ProvinceSelector value={data.inputs.tax_province} onChange={(v) => updateInput('tax_province', v)} />
                </div>
            </div>

            <div className="row g-4">
              {['p1', 'p2'].map((p) => {
                if (!isCouple && p === 'p2') return null;
                return (
                <div className="col-12 col-xl-6" key={p}>
                  
                  <div className="card h-100 border-secondary surface-card shadow-none mb-4">
                    <div className="card-body p-4">
                      <div className="d-flex justify-content-between mb-4 border-bottom border-secondary pb-2">
                        <h6 className={`fw-bold text-uppercase ls-1 ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color:'var(--bs-purple)'} : {}}>{p.toUpperCase()} Income</h6>
                        <div className="d-flex gap-2">
                          <button type="button" className={`btn btn-sm btn-outline-${p === 'p1' ? 'info' : 'primary'} rounded-pill px-3 py-1 fw-bold`} style={p === 'p2' ? {color:'var(--bs-purple)', borderColor:'var(--bs-purple)'} : {}} onClick={() => addArrayItem('additionalIncome', { owner: p, name: 'Side Hustle', amount: 5000, freq: 'year', growth: 2.0, startMode: 'date', start: '2026-01', endMode: 'never', taxable: true })}>+ Stream</button>
                        </div>
                      </div>

                      <div className="border border-secondary rounded-4 overflow-hidden mb-3 shadow-sm">
                          <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3">
                              <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-cash-stack"></i></div>
                              <span className="fw-bold text-main small text-uppercase ls-1">Base Salary</span>
                          </div>
                          <div className="p-3 bg-input">
                              <div className="row g-3">
                                  <div className="col-12 col-md-7">
                                      <label className="form-label small text-muted mb-1">Gross Annual Income</label>
                                      <CurrencyInput className="form-control" value={data.inputs[`${p}_income`] ?? ''} onChange={(val: any) => updateInput(`${p}_income`, val)} />
                                  </div>
                                  <div className="col-12 col-md-5">
                                      <label className="form-label small text-muted mb-1">Yearly Growth (%)</label>
                                      <PercentInput className="form-control" value={data.inputs[`${p}_income_growth`]} onChange={(val: any) => updateInput(`${p}_income_growth`, val)} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="border border-secondary rounded-4 overflow-hidden mb-3 shadow-sm">
                          <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3">
                              <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-building"></i></div>
                              <span className="fw-bold text-main small text-uppercase ls-1">Employer RRSP Match</span>
                          </div>
                          <div className="p-3 bg-input">
                              <div className="row g-3">
                                  <div className="col-12 col-md-6">
                                      <label className="form-label small text-muted mb-1">Max Match (%)</label>
                                      <PercentInput className="form-control" value={data.inputs[`${p}_rrsp_match`]} onChange={(val: any) => updateInput(`${p}_rrsp_match`, val)} />
                                  </div>
                                  <div className="col-12 col-md-6">
                                      <label className="form-label small text-muted mb-1 d-flex align-items-center">Match Rate (%) <InfoBtn title="Match Rate" text="If they match 50 cents on the dollar, enter 50."/></label>
                                      <PercentInput className="form-control" value={data.inputs[`${p}_rrsp_match_tier`]} onChange={(val: any) => updateInput(`${p}_rrsp_match_tier`, val)} />
                                  </div>
                              </div>
                          </div>
                      </div>

                      {data.additionalIncome.filter((inc: any) => inc.owner === p).map((inc: any) => {
                          const realIdx = data.additionalIncome.indexOf(inc);
                          const updateInc = (field: string, val: any) => updateArrayItem('additionalIncome', realIdx, field, val);
                          return (
                            <div className="border border-secondary rounded-4 overflow-hidden mb-3 shadow-sm" key={`inc_${realIdx}`}>
                              <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center">
                                  <div className="d-flex align-items-center gap-3 w-100">
                                      <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-briefcase-fill"></i></div>
                                      <input type="text" maxLength={50} className="form-control bg-transparent border-0 text-main fw-bold p-0 shadow-none" value={inc.name || ''} onChange={(e) => updateInc('name', e.target.value)} placeholder="Stream Name" />
                                  </div>
                                  <button type="button" className="btn btn-sm btn-link text-danger p-0 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeArrayItem('additionalIncome', realIdx)}><i className="bi bi-x-lg fs-5"></i></button>
                              </div>
                              <div className="p-3 bg-input">
                                  <div className="row g-3 mb-3">
                                      <div className="col-12 col-md-5">
                                          <label className="small text-muted mb-1 fw-medium">Amount ($)</label>
                                          <CurrencyInput className="form-control form-control-sm" value={inc.amount} onChange={(val: any) => updateInc('amount', val)} />
                                      </div>
                                      <div className="col-6 col-md-4">
                                          <label className="small text-muted mb-1 fw-medium">Frequency</label>
                                          <FrequencyToggle mode="string" value={inc.freq || 'year'} onChange={(v: any) => updateInc('freq', v)} />
                                      </div>
                                      <div className="col-6 col-md-3">
                                          <label className="small text-muted mb-1 fw-medium text-nowrap">Growth (%)</label>
                                          <PercentInput className="form-control form-control-sm" value={inc.growth ?? 2.0} onChange={(val: any) => updateInc('growth', val)} />
                                      </div>
                                  </div>
                                  <div className="row g-3">
                                      <div className="col-12 col-md-6">
                                          <label className="small text-muted mb-1 fw-medium d-block border-bottom border-secondary border-opacity-50 pb-1">Starts</label>
                                          <div className="d-flex bg-secondary bg-opacity-10 border border-secondary rounded-pill p-1 gap-1 shadow-sm mb-2 w-100">
                                              <button type="button" onClick={() => updateInc('startMode', 'date')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.startMode === 'date' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Specific Date</button>
                                              <button type="button" onClick={() => updateInc('startMode', 'ret_relative')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.startMode === 'ret_relative' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>At Retirement</button>
                                          </div>
                                          {inc.startMode === 'ret_relative' ? (
                                              <div className="input-group input-group-sm border border-secondary rounded-pill overflow-hidden shadow-sm">
                                                <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2 shadow-none" placeholder="Yrs" value={inc.startRelative ?? 0} onChange={e => updateInc('startRelative', e.target.value)} />
                                                <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                              </div>
                                          ) : (
                                              <MonthYearStepper value={inc.start} onChange={(val: string) => updateInc('start', val)} />
                                          )}
                                      </div>
                                      <div className="col-12 col-md-6">
                                          <label className="small text-muted mb-1 fw-medium d-block border-bottom border-secondary border-opacity-50 pb-1">Ends</label>
                                          <div className="d-flex bg-secondary bg-opacity-10 border border-secondary rounded-pill p-1 gap-1 shadow-sm mb-2 w-100">
                                              <button type="button" onClick={() => updateInc('endMode', 'never')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.endMode === 'never' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Never</button>
                                              <button type="button" onClick={() => updateInc('endMode', 'date')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.endMode === 'date' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Specific Date</button>
                                              <button type="button" onClick={() => updateInc('endMode', 'ret_relative')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.endMode === 'ret_relative' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>At Retirement</button>
                                          </div>
                                          {inc.endMode === 'ret_relative' ? (
                                              <div className="input-group input-group-sm border border-secondary rounded-pill overflow-hidden shadow-sm">
                                                <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2 shadow-none" placeholder="Yrs" value={inc.endRelative ?? 0} onChange={e => updateInc('endRelative', e.target.value)} />
                                                <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                              </div>
                                          ) : inc.endMode === 'date' ? (
                                              <MonthYearStepper value={inc.end} onChange={(val: string) => updateInc('end', val)} />
                                          ) : null}
                                      </div>
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

        {/* 6. Living Expenses */}
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
                <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-1 cursor-pointer">Adv. Mode</label>
            </div>
          </div>
          <div className="card-body p-3 p-md-4">
            
            {expenseAdvancedMode && (
              <div className="row g-4 mb-4 p-4 border border-secondary rounded-4 surface-card shadow-sm">
                <div className="col-md-6 d-flex align-items-center justify-content-between bg-input p-2 px-3 rounded-3 border border-secondary">
                    <label className="form-label text-success fw-bold mb-0 text-nowrap">Go-Go Age Ends:</label>
                    <div style={{width: '180px'}}><StepperInput min={60} max={100} value={data.inputs.exp_gogo_age || 75} onChange={(val: any) => {
                        updateInput('exp_gogo_age', val);
                        if (val > (data.inputs.exp_slow_age || 85)) updateInput('exp_slow_age', val);
                    }} /></div>
                </div>
                <div className="col-md-6 d-flex align-items-center justify-content-between bg-input p-2 px-3 rounded-3 border border-secondary">
                    <label className="form-label text-primary fw-bold mb-0 text-nowrap">Slow-Go Age Ends:</label>
                    <div style={{width: '180px'}}><StepperInput min={60} max={120} value={data.inputs.exp_slow_age || 85} onChange={(val: any) => {
                        if (val >= (data.inputs.exp_gogo_age || 75)) updateInput('exp_slow_age', val);
                    }} /></div>
                </div>
              </div>
            )}
            
            <div className="d-flex flex-column gap-4">
                {Object.keys(data.expensesByCategory).map(cat => (
                    <div className="card surface-card border-secondary shadow-sm rounded-4 overflow-hidden" key={cat}>
                        <div className="card-header bg-secondary bg-opacity-10 border-bottom border-secondary d-flex justify-content-between align-items-center p-3">
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
                                        <th className="py-3 fw-semibold text-start">Working</th>
                                        {expenseAdvancedMode && <th className="py-3 fw-semibold text-start text-primary">Transition</th>}
                                        <th className="py-3 fw-semibold text-start">Retire (Base)</th>
                                        {expenseAdvancedMode && <>
                                            <th className="py-3 fw-semibold text-start text-success">Go-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">(Ret. to {data.inputs.exp_gogo_age || 75})</span></th>
                                            <th className="py-3 fw-semibold text-start text-primary">Slow-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">({data.inputs.exp_gogo_age || 75} to {data.inputs.exp_slow_age || 85})</span></th>
                                            <th className="py-3 fw-semibold text-start text-danger">No-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">({data.inputs.exp_slow_age || 85}+)</span></th>
                                        </>}
                                        <th className="py-3 fw-semibold text-center" style={{width: '110px'}}>Frequency</th>
                                        <th className="pe-4 py-3 text-end" style={{width: '50px'}}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.expensesByCategory[cat].items.map((exp:any, idx:number) => (
                                        <tr key={`${cat}_${idx}`} className="border-bottom border-secondary border-opacity-25">
                                            <td className="ps-4 py-2">
                                                <input type="text" maxLength={50} className="form-control form-control-sm bg-black bg-opacity-25 border border-secondary fw-bold text-main shadow-none rounded-3" placeholder="Item name..." value={exp.name || ''} onChange={(e) => updateExpense(cat, idx, 'name', e.target.value)} />
                                            </td>
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm rounded-3 bg-black bg-opacity-25 border-secondary" value={exp.curr ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'curr', val)} /></td>
                                            {expenseAdvancedMode && <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary rounded-3 bg-black bg-opacity-25 border-secondary" value={exp.trans ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'trans', val)} /></td>}
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm rounded-3 bg-black bg-opacity-25 border-secondary" value={exp.ret ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'ret', val)} /></td>
                                            {expenseAdvancedMode && (
                                                <>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-success rounded-3 bg-black bg-opacity-25 border-secondary" value={exp.gogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'gogo', val)} /></td>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary rounded-3 bg-black bg-opacity-25 border-secondary" value={exp.slow ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'slow', val)} /></td>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-danger rounded-3 bg-black bg-opacity-25 border-secondary" value={exp.nogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'nogo', val)} /></td>
                                                </>
                                            )}
                                            <td className="py-2 text-center">
                                                <FrequencyToggle mode="number" value={exp.freq || 12} onChange={(v: any) => updateExpense(cat, idx, 'freq', v)} />
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

        {/* 7. Future Expenses - LOAN ENGINE ADDED */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
                <i className="bi bi-cart-dash text-danger fs-4 me-3"></i>
                <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                    7. Future Expenses & Debts
                    <InfoBtn align="left" title="Large Purchases" text="Plan for future large expenses (like buying a car, renovation, or wedding) or lump-sum debt payoffs. <br><br>The amount will be deducted directly from your cash flow in the selected year." />
                </h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('debt', { name: 'New Expense', amount: 20000, start: '2026-01', type: 'one', duration: 1, rate: 0 })}>
                <i className="bi bi-plus-lg me-1"></i> Add Expense
            </button>
          </div>
          <div className="card-body p-4">
            {data.debt.length === 0 && <div className="text-center text-muted small fst-italic">No future expenses added.</div>}
            <div className="row g-3">
                {data.debt.map((d: any, idx: number) => {
                    const isRecurring = d.type === 'monthly' || d.type === 'yearly';
                    return (
                        <div className="col-12 col-xl-6" key={`debt_${idx}`}>
                            <div className="d-flex flex-column p-3 border border-secondary rounded-4 bg-secondary bg-opacity-10 shadow-sm h-100 gap-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div className="d-flex align-items-center gap-3 flex-grow-1">
                                        <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                            <i className="bi bi-cart-x-fill fs-5"></i>
                                        </div>
                                        <input type="text" maxLength={50} className="form-control bg-transparent border-0 fw-bold fs-6 p-0 shadow-none text-main" placeholder="Expense Name" value={d.name || ''} onChange={(e) => updateArrayItem('debt', idx, 'name', e.target.value)} />
                                    </div>
                                    <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-2 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeArrayItem('debt', idx)}><i className="bi bi-x-lg fs-5"></i></button>
                                </div>
                                
                                <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1 shadow-sm w-100">
                                    <button type="button" onClick={() => updateArrayItem('debt', idx, 'type', 'one')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${(!d.type || d.type === 'one') ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>One-Time</button>
                                    <button type="button" onClick={() => updateArrayItem('debt', idx, 'type', 'monthly')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${d.type === 'monthly' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Monthly</button>
                                    <button type="button" onClick={() => updateArrayItem('debt', idx, 'type', 'yearly')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${d.type === 'yearly' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Yearly</button>
                                </div>

                                <div className="d-flex flex-wrap align-items-sm-end gap-3 bg-input p-2 rounded-3">
                                    <div className="flex-grow-1" style={{ minWidth: '140px' }}>
                                        <label className="small text-muted mb-1 fw-bold">{isRecurring && d.rate > 0 ? 'Principal Amount ($)' : 'Amount ($)'}</label>
                                        <CurrencyInput className="form-control form-control-sm border-secondary" value={d.amount ?? ''} onChange={(val: any) => updateArrayItem('debt', idx, 'amount', val)} placeholder="Amount ($)" />
                                    </div>
                                    
                                    {isRecurring && (
                                        <div style={{width: '90px'}}>
                                            <label className="small text-muted mb-1 fw-bold">Rate (%)</label>
                                            <PercentInput className="form-control form-control-sm border-secondary" value={d.rate ?? ''} onChange={(val: any) => updateArrayItem('debt', idx, 'rate', val)} />
                                        </div>
                                    )}

                                    {isRecurring && (
                                        <div style={{width: '110px'}}>
                                            <label className="small text-muted mb-1 fw-bold">Term (Yrs)</label>
                                            <div className="input-group input-group-sm border border-secondary rounded-pill overflow-hidden shadow-sm">
                                                <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2 shadow-none" value={d.duration ?? 1} onChange={e => updateArrayItem('debt', idx, 'duration', e.target.value)} />
                                                <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div style={{minWidth: '220px'}} className="flex-grow-1">
                                        <label className="small text-muted mb-1 fw-bold">Start Date</label>
                                        <MonthYearStepper value={d.start || ''} onChange={(e: any) => updateArrayItem('debt', idx, 'start', e)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </div>

        {/* 8. Windfalls - MODERNIZED */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
                <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                    <i className="bi bi-gift text-success me-3"></i>8. Windfalls & Inheritance
                    <InfoBtn align="left" title="Windfalls" text="One-time cash inflows like inheritance, selling a business, or downsizing property. <br><b>Taxable:</b> Check this if the amount will be added to your taxable income for that year (e.g. severance, RRSP deregistration)." />
                </h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('windfalls', { name: 'Inheritance', amount: 100000, start: '2030-01', freq: 'one', end: '', taxable: false })}>
                <i className="bi bi-plus-lg me-1"></i> Add Event
            </button>
          </div>
          <div className="card-body p-4">
            {data.windfalls.length === 0 && <div className="text-center text-muted small fst-italic">No windfalls added.</div>}
            <div className="row g-3">
                {data.windfalls.map((w: any, idx: number) => (
                    <div className="col-12 col-xl-6" key={`wind_${idx}`}>
                        <div className="d-flex flex-column p-3 border border-secondary rounded-4 bg-secondary bg-opacity-10 shadow-sm h-100 gap-3">
                            
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-3 flex-grow-1">
                                    <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                        <i className="bi bi-gift-fill fs-5"></i>
                                    </div>
                                    <input type="text" maxLength={50} className="form-control bg-transparent border-0 fw-bold fs-6 p-0 shadow-none text-main" placeholder="Description" value={w.name || ''} onChange={(e) => updateArrayItem('windfalls', idx, 'name', e.target.value)} />
                                </div>
                                <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-2 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeArrayItem('windfalls', idx)}><i className="bi bi-x-lg fs-5"></i></button>
                            </div>

                            <div className="d-flex bg-input border border-secondary rounded-pill p-1 gap-1 shadow-sm w-100" style={{maxWidth: '300px'}}>
                                <button type="button" onClick={() => updateArrayItem('windfalls', idx, 'freq', 'one')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-3 py-1 flex-grow-1 ${(!w.freq || w.freq === 'one') ? 'bg-success text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>One-Time</button>
                                <button type="button" onClick={() => updateArrayItem('windfalls', idx, 'freq', 'month')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-3 py-1 flex-grow-1 ${w.freq === 'month' ? 'bg-success text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Monthly</button>
                                <button type="button" onClick={() => updateArrayItem('windfalls', idx, 'freq', 'year')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-3 py-1 flex-grow-1 ${w.freq === 'year' ? 'bg-success text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Yearly</button>
                            </div>

                            <div className="d-flex flex-wrap align-items-end gap-3 bg-input p-2 rounded-3">
                                
                                <div className="flex-grow-1" style={{minWidth: '140px'}}>
                                    <label className="small text-muted mb-1 fw-bold">Amount ($)</label>
                                    <CurrencyInput className="form-control form-control-sm border-secondary" value={w.amount ?? ''} onChange={(val: any) => updateArrayItem('windfalls', idx, 'amount', val)} placeholder="Amount ($)" />
                                </div>
                                
                                <div className="d-flex align-items-center gap-2 pe-3 border-end border-secondary border-opacity-50 pb-1" style={{height: '31px'}}>
                                    <div className="form-check form-switch mb-0 d-flex align-items-center flex-shrink-0" style={{minHeight: 0}}>
                                        <input className="form-check-input m-0 cursor-pointer shadow-none fs-5" type="checkbox" checked={w.taxable ?? false} onChange={(e) => updateArrayItem('windfalls', idx, 'taxable', e.target.checked)} />
                                    </div>
                                    <label className="form-check-label small text-muted fw-bold mb-0 text-nowrap mt-1">Taxable</label>
                                </div>
                                
                                <div style={{minWidth: '170px'}} className="flex-grow-1">
                                    <label className="small text-muted mb-1 fw-bold">Receive Date</label>
                                    <MonthYearStepper value={w.start || ''} onChange={(e: any) => updateArrayItem('windfalls', idx, 'start', e)} />
                                </div>

                                {w.freq && w.freq !== 'one' && (
                                    <div style={{minWidth: '170px'}} className="flex-grow-1">
                                        <label className="small text-muted mb-1 fw-bold">End Date</label>
                                        <MonthYearStepper value={w.end || ''} onChange={(e: any) => updateArrayItem('windfalls', idx, 'end', e)} />
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>

        {/* 9. Government Benefits */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header border-bottom border-secondary p-3 surface-card">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div className="d-flex align-items-center">
                        <i className="bi bi-bank text-primary fs-4 me-3"></i>
                        <h5 className="mb-0 fw-bold text-uppercase ls-1">9. Government Benefits</h5>
                        <InfoBtn 
                            align="left" 
                            title="CPP / OAS / Pension" 
                            text={`<b>CPP:</b> Enter the estimate from your Service Canada account. The app will automatically adjust it if you take it early (age 60) or late (age 70).<br><br>
                                <b>OAS:</b> Max OAS requires 40 years of residency in Canada between ages 18 and 65. If you have less, it is prorated.<br><br>
                                <b>OAS Clawback (2026):</b> If your Net Income exceeds <b>$95,323</b>, your OAS is reduced by 15 cents for every dollar above the threshold. It is fully eliminated at <b>$154,708</b> (or <b>$160,647</b> for ages 75+).`} 
                        />
                    </div>
                  {isCouple && (
                      <div className="form-check form-switch m-0 d-flex align-items-center bg-black bg-opacity-25 px-3 py-2 rounded-pill border border-secondary shadow-inner">
                          <input 
                              className="form-check-input cursor-pointer m-0 me-2 fs-5" 
                              type="checkbox" 
                              checked={data.inputs.pension_split_enabled} 
                              onChange={(e) => updateInput('pension_split_enabled', e.target.checked)} 
                          />
                          <label className="form-check-label fw-bold text-muted small mt-1 d-flex align-items-center">
                              Pension Income Splitting
                              <InfoBtn align="right" title="Pension Income Splitting" text="Allows you to allocate up to 50% of eligible pension income to your spouse for tax purposes. <br><br><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/pension-income-splitting.html' target='_blank' class='text-primary'>Learn more at Canada.ca</a>" />
                          </label>
                      </div>
                  )}
              </div>
          </div>
          <div className="card-body p-4">
            
            <div className="row g-4">
              {['p1', 'p2'].map((p) => {
                if (!isCouple && p === 'p2') return null;
                
                // MATH: Dynamic UI Previews for CPP and OAS
                const cppBase = Number(data.inputs[`${p}_cpp_est_base`]) || 0;
                const cppStart = Number(data.inputs[`${p}_cpp_start`]) || 65;
                const cppAdjYr = getAdjustedCPP(cppBase, cppStart);
                const cppAdjMo = cppAdjYr / 12;
                const isCppEarly = cppStart < 65;
                const isCppLate = cppStart > 65;
                const cppColor = isCppEarly ? 'text-danger' : isCppLate ? 'text-success' : 'text-primary';

                const oasStart = Number(data.inputs[`${p}_oas_start`]) || 65;
                const oasYears = Number(data.inputs[`${p}_oas_years`]) ?? 40;
                const oasAdjYr = getAdjustedOAS(oasYears, oasStart);
                const oasAdjMo = oasAdjYr / 12;
                const isOasLate = oasStart > 65;
                const oasColor = isOasLate ? 'text-success' : 'text-primary';

                return (
                <div className="col-12 col-xl-6" key={p}>
                    <div className="card h-100 border-secondary surface-card shadow-none">
                        <div className="card-body p-4">
                            <h6 className={`fw-bold text-uppercase ls-1 mb-4 pb-2 border-bottom border-secondary ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color:'var(--bs-purple)'} : {}}>{p.toUpperCase()} Benefits</h6>
                            
                            {/* CPP Box */}
                            <div className="border border-secondary rounded-4 overflow-hidden mb-3 shadow-sm">
                                <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}><i className="bi bi-map-fill"></i></div>
                                        <span className="fw-bold text-main small text-uppercase ls-1">CPP</span>
                                    </div>
                                    <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={data.inputs[`${p}_cpp_enabled`] ?? true} onChange={(e) => updateInput(`${p}_cpp_enabled`, e.target.checked)} /></div>
                                </div>
                                {(data.inputs[`${p}_cpp_enabled`] ?? true) && (
                                    <div className="p-3 bg-input d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <label className="form-label small text-muted mb-0">Est. Base Payout (Age 65)</label>
                                            <div style={{width: '170px'}}><CurrencyInput suffix="/yr" className="form-control form-control-sm" value={data.inputs[`${p}_cpp_est_base`]} onChange={(val: any) => updateInput(`${p}_cpp_est_base`, val)} /></div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="small text-muted fw-bold">Starts at Age:</span>
                                            <div style={{width: '170px'}}><StepperInput min={60} max={70} value={data.inputs[`${p}_cpp_start`]} onChange={(val: any) => updateInput(`${p}_cpp_start`, val)} /></div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-50">
                                            <span className="small text-muted">Adjusted Payout:</span>
                                            <div className="text-end">
                                                <span className={`small fw-bold ${cppColor}`}>{formatCurrency(cppAdjMo)} <span className="text-muted fw-normal" style={{fontSize:'0.7rem'}}>/mo</span></span>
                                                <div className="text-muted fw-normal" style={{fontSize: '0.65rem'}}>{formatCurrency(cppAdjYr)} /yr</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* OAS Box */}
                            <div className="border border-secondary rounded-4 overflow-hidden mb-3 shadow-sm">
                                <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}><i className="bi bi-shield-fill-check"></i></div>
                                        <span className="fw-bold text-main small text-uppercase ls-1">OAS</span>
                                    </div>
                                    <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={data.inputs[`${p}_oas_enabled`] ?? true} onChange={(e) => updateInput(`${p}_oas_enabled`, e.target.checked)} /></div>
                                </div>
                                {(data.inputs[`${p}_oas_enabled`] ?? true) && (
                                    <div className="p-3 bg-input d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <label className="form-label small text-muted mb-0">Years in Canada <InfoBtn title="OAS Proration" text="Max OAS requires 40 years of residency in Canada between ages 18 and 65."/></label>
                                            <div style={{width: '170px'}}><StepperInput min={0} max={40} value={oasYears} onChange={(val: any) => updateInput(`${p}_oas_years`, val)} /></div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="small text-muted fw-bold">Starts at Age:</span>
                                            <div style={{width: '170px'}}><StepperInput min={65} max={70} value={oasStart} onChange={(val: any) => updateInput(`${p}_oas_start`, val)} /></div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-50">
                                            <span className="small text-muted">Adjusted Payout:</span>
                                            <div className="text-end">
                                                <span className={`small fw-bold ${oasColor}`}>{formatCurrency(oasAdjMo)} <span className="text-muted fw-normal" style={{fontSize:'0.7rem'}}>/mo</span></span>
                                                <div className="text-muted fw-normal" style={{fontSize: '0.65rem'}}>{formatCurrency(oasAdjYr)} /yr</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* DB Pension Box */}
                            <div className="border border-secondary rounded-4 overflow-hidden shadow-sm">
                                <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}><i className="bi bi-briefcase-fill"></i></div>
                                        <span className="fw-bold text-main small text-uppercase ls-1">DB Pension</span>
                                    </div>
                                    <div className="form-check form-switch mb-0">
                                        <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={p === 'p1' ? p1DbEnabled : p2DbEnabled} onChange={(e) => {
                                            const isChecked = e.target.checked;
                                            if(p==='p1') setP1DbEnabled(isChecked); else setP2DbEnabled(isChecked);
                                            updateInput(`${p}_db_enabled`, isChecked);
                                        }} />
                                    </div>
                                </div>
                                {(p === 'p1' ? p1DbEnabled : p2DbEnabled) && (
                                    <div className="p-3 bg-input d-flex flex-column gap-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div className="d-flex align-items-center">
                                                <label className="form-label small fw-bold text-muted mb-0">Index to Inflation</label>
                                                <InfoBtn title="Index to Inflation" text="If checked, the pension amount will grow with inflation. If unchecked, the payout remains flat for life." />
                                            </div>
                                            <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={data.inputs[`${p}_db_indexed`] ?? true} onChange={(e) => updateInput(`${p}_db_indexed`, e.target.checked)} /></div>
                                        </div>
                                        
                                        <div className="border-top border-secondary pt-3 mt-1">
                                            <h6 className="small fw-bold mb-3" style={p === 'p2' ? {color: 'var(--bs-purple)'} : {color: 'var(--bs-info)'}}>Lifetime Pension</h6>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="small text-muted mb-0">Amount</label>
                                                <div style={{width: '170px'}}><CurrencyInput suffix="/mo" className="form-control form-control-sm" value={data.inputs[`${p}_db_lifetime`] ?? ''} onChange={(val: any) => updateInput(`${p}_db_lifetime`, val)} /></div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="small text-muted fw-bold">Starts at Age:</span>
                                                <div style={{width: '170px'}}><StepperInput min={50} max={75} value={data.inputs[`${p}_db_lifetime_start`] ?? 60} onChange={(val: any) => updateInput(`${p}_db_lifetime_start`, val)} /></div>
                                            </div>
                                        </div>

                                        <div className="border-top border-secondary pt-3 mt-1">
                                            <h6 className="small fw-bold text-muted mb-3">Bridge Benefit <span className="text-muted fw-normal">(Ends at 65)</span></h6>
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="small text-muted mb-0">Amount</label>
                                                <div style={{width: '170px'}}><CurrencyInput suffix="/mo" className="form-control form-control-sm" value={data.inputs[`${p}_db_bridge`] ?? ''} onChange={(val: any) => updateInput(`${p}_db_bridge`, val)} /></div>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="small text-muted fw-bold">Starts at Age:</span>
                                                <div style={{width: '170px'}}><StepperInput min={50} max={65} value={data.inputs[`${p}_db_bridge_start`] ?? 60} onChange={(val: any) => updateInput(`${p}_db_bridge_start`, val)} /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
                )})}
            </div>
          </div>
        </div>

        {/* 10. Economic Assumptions */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
              <i className="bi bi-graph-up-arrow text-secondary fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">10. Economic Assumptions</h5>
          </div>
          <div className="card-body p-4">
              <div className="row">
                  <div className="col-12 col-md-6 col-xl-4">
                      <div className="border border-secondary rounded-4 overflow-hidden shadow-sm">
                          <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3">
                              <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                                  <i className="bi bi-percent"></i>
                              </div>
                              <span className="fw-bold text-main small text-uppercase ls-1">Inflation Rate</span>
                          </div>
                          <div className="p-3 bg-input">
                              <label className="form-label small text-muted mb-2 d-flex align-items-center">Long-term Target <InfoBtn align="right" title="Inflation Rate" text="The expected annual increase in the cost of living. The Bank of Canada target is 2.0%."/></label>
                              <PercentInput className="form-control" value={data.inputs.inflation_rate} onChange={(val: any) => updateInput('inflation_rate', val)} />
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        </div>

      </form>
    </div>
  );
}