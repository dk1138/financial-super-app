import React, { useState, useEffect, useRef } from 'react';

// --- FLUID TOOLTIP ---
export const InfoBtn = ({ title, text, align = 'center', direction = 'down' }: { title: string, text: string, align?: 'center'|'right'|'left', direction?: 'up'|'down' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { backgroundColor: 'var(--bg-card)', minWidth: '280px' };
    
    if (direction === 'up') { posStyles.bottom = '140%'; } 
    else { posStyles.top = '140%'; }

    if (align === 'right') { posStyles.right = '0'; }
    else if (align === 'left') { posStyles.left = '0'; }
    else { posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }

    return (
        <div className="position-relative d-inline-flex align-items-center ms-1" style={{zIndex: open ? 1050 : 1}}>
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

// --- DATA INPUTS ---
export const CurrencyInput = ({ value, onChange, className, placeholder, style, disabled, suffix, noBg }: any) => {
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
            <span className="position-absolute text-muted fw-bold" style={{ left: noBg ? '4px' : '8px', fontSize: '0.85em', pointerEvents: 'none', zIndex: 5 }}>$</span>
            <input type="text" maxLength={15} className={`w-100 ${className} text-start ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'} ${disabled ? 'opacity-50' : ''}`} style={{ ...style, minWidth: 0, paddingLeft: noBg ? '16px' : '28px', paddingRight: suffix ? '45px' : '12px', fontWeight: '600', outline: 'none' }} value={localValue} onChange={handleChange} placeholder={placeholder} disabled={disabled} />
            {suffix && <span className="position-absolute text-muted small fw-bold" style={{ right: '10px', pointerEvents: 'none', zIndex: 5 }}>{suffix}</span>}
        </div>
    );
};

export const PercentInput = ({ value, onChange, className, placeholder, noBg, disabled }: any) => {
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
            <input type="number" step="0.01" max={1000} min={-100} className={`w-100 ${className} text-start ${noBg ? 'bg-transparent border-0' : 'shadow-sm border border-secondary bg-input text-main'} ${disabled ? 'opacity-50 bg-secondary bg-opacity-25' : ''}`} style={{ minWidth: 0, paddingLeft: '6px', paddingRight: '28px', fontWeight: '600', outline: 'none' }} value={focused ? (value ?? '') : displayValue} onChange={handleChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder} disabled={disabled} />
            <span className="position-absolute text-muted fw-bold" style={{ right: '12px', fontSize: '0.85em', pointerEvents: 'none', zIndex: 5 }}>%</span>
        </div>
    );
};

// --- CONTROLS & STEPPERS ---
export const SegmentedControl = ({ options, value, onChange }: any) => (
    <div className="d-flex flex-wrap bg-input border border-secondary rounded-pill p-1 gap-1 shadow-sm w-100">
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

export const StepperInput = ({ value, onChange, min, max, suffix = "" }: any) => {
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

export const MonthYearStepper = ({ value, onChange, minYear = 1900, maxYear = 2100 }: any) => {
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
    const handleMDec = () => { let newM = m - 1; let newY = y; if (newM < 1) { newM = 12; newY--; } commitDate(newY, newM); };
    const handleMInc = () => { let newM = m + 1; let newY = y; if (newM > 12) { newM = 1; newY++; } commitDate(newY, newM); };

    const commitY = () => { let parsed = parseInt(localY, 10); if(isNaN(parsed)) parsed = y; commitDate(parsed, m); };
    const commitM = () => {
        let parsed = parseInt(localM, 10);
        if (!isNaN(parsed)) commitDate(y, parsed);
        else {
            const idx = MONTHS.findIndex(mo => mo.toLowerCase() === localM.toLowerCase().trim());
            if (idx !== -1) commitDate(y, idx + 1);
            else commitDate(y, m); 
        }
    };

    return (
        <div className="d-inline-flex align-items-center bg-input border border-secondary rounded-pill p-1 shadow-sm gap-1 w-100 justify-content-between" style={{ minWidth: '170px' }}>
            <div className="d-flex align-items-center flex-grow-1 justify-content-center">
                <button type="button" className="btn btn-sm btn-link text-muted p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleMDec}><i className="bi bi-dash-circle-fill fs-5"></i></button>
                <input type="text" maxLength={3} className="bg-transparent border-0 text-center fw-bold text-main p-0 m-0" style={{ width: '40px', outline: 'none', fontSize: '0.95rem' }} value={localM} onChange={e => setLocalM(e.target.value)} onBlur={commitM} onFocus={e => (e.target as HTMLInputElement).select()} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
                <button type="button" className="btn btn-sm btn-link text-primary p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleMInc}><i className="bi bi-plus-circle-fill fs-5"></i></button>
            </div>
            <div className="border-start border-secondary opacity-50 flex-shrink-0" style={{height: '20px'}}></div>
            <div className="d-flex align-items-center flex-grow-1 justify-content-center">
                <button type="button" className="btn btn-sm btn-link text-muted p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleYDec}><i className="bi bi-dash-circle-fill fs-5"></i></button>
                <input type="text" maxLength={4} className="bg-transparent border-0 text-center fw-bold text-main p-0 m-0" style={{ width: '46px', outline: 'none', fontSize: '0.95rem' }} value={localY} onChange={e => setLocalY(e.target.value)} onBlur={commitY} onFocus={e => (e.target as HTMLInputElement).select()} onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
                <button type="button" className="btn btn-sm btn-link text-primary p-0 px-1 hover-opacity-100 text-decoration-none" onClick={handleYInc}><i className="bi bi-plus-circle-fill fs-5"></i></button>
            </div>
        </div>
    );
};

export const ProvinceSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
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

export const FrequencyToggle = ({ value, onChange, mode = 'number' }: { value: any, onChange: (val: any) => void, mode?: 'number'|'string' }) => {
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

// --- MODERN DROPDOWN ---
export const ModernDropdown = ({ value, onChange, options }: { value: string, onChange: (val: string) => void, options: {id: string, label: string, icon?: string, color?: string}[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [localVal, setLocalVal] = useState(value);
    useEffect(() => setLocalVal(value), [value]);

    const handleSelect = (id: string) => {
        setLocalVal(id);
        setIsOpen(false);
        setTimeout(() => onChange(id), 10);
    };

    const selected = options.find(a => a.id === localVal) || options[0] || { label: 'Select' };

    return (
        <div className="position-relative w-100" ref={dropdownRef}>
            <div 
                className={`d-flex justify-content-between align-items-center bg-input border ${isOpen ? 'border-primary shadow' : 'border-secondary shadow-sm'} rounded-3 px-2 cursor-pointer text-main user-select-none transition-all`}
                style={{ height: '31px' }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="d-flex align-items-center gap-1 overflow-hidden me-1">
                    {selected.icon && <i className={`bi ${selected.icon} ${selected.color || 'text-muted'} flex-shrink-0`} style={{fontSize: '0.85rem'}}></i>}
                    <span className="fw-bold text-truncate" style={{fontSize: '0.75rem'}}>{selected.label}</span>
                </div>
                <i className={`bi bi-chevron-${isOpen ? 'up text-primary' : 'down text-muted'} flex-shrink-0`} style={{fontSize: '0.7rem'}}></i>
            </div>
            
            {isOpen && (
                <div className="position-absolute w-100 bg-input border border-secondary rounded-3 shadow-lg z-3 overflow-hidden" style={{ top: 'calc(100% + 4px)', left: 0, minWidth: '140px' }}>
                    <div className="d-flex flex-column hide-scrollbar" style={{maxHeight: '250px', overflowY: 'auto'}}>
                        {options.map(opt => (
                            <div 
                                key={opt.id}
                                className={`d-flex align-items-center gap-2 px-3 py-2 cursor-pointer transition-all ${localVal === opt.id ? 'bg-secondary bg-opacity-25' : 'hover-bg-secondary'}`}
                                onClick={() => handleSelect(opt.id)}
                            >
                                {opt.icon && <i className={`bi ${opt.icon} ${opt.color || 'text-muted'}`} style={{fontSize: '0.85rem'}}></i>}
                                <span className="fw-bold text-main" style={{fontSize: '0.75rem'}}>{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};