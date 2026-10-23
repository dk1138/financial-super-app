import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FINANCIAL_CONSTANTS } from '../../lib/config';
import { InfoBtn, CurrencyInput, StepperInput } from '../SharedUI';

const MONTH_OPTIONS = [
  { value: 1, label: 'Jan' },
  { value: 2, label: 'Feb' },
  { value: 3, label: 'Mar' },
  { value: 4, label: 'Apr' },
  { value: 5, label: 'May' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Jul' },
  { value: 8, label: 'Aug' },
  { value: 9, label: 'Sep' },
  { value: 10, label: 'Oct' },
  { value: 11, label: 'Nov' },
  { value: 12, label: 'Dec' },
];

const getAdjustedCPP = (basePerYear: number, startAge: number, startMonth: number = 1, birthMonth: number = 1) => {
    let val = Number(basePerYear) || 0;
    const monthOffset = startMonth - birthMonth;
    const diff = (startAge - 65) * 12 + monthOffset;
    if (diff < 0) val *= (1 - (Math.abs(diff) * 0.006));
    else if (diff > 0) val *= (1 + (diff * 0.007));
    return val;
};

const getAdjustedOAS = (yearsInCanada: number, startAge: number, startMonth: number = 1, birthMonth: number = 1) => {
    let maxOAS = FINANCIAL_CONSTANTS?.MAX_OAS || 8560; 
    let proportion = Math.max(0, Math.min(40, yearsInCanada || 40)) / 40;
    let val = maxOAS * proportion;
    const monthOffset = startMonth - birthMonth;
    const diff = (startAge - 65) * 12 + monthOffset;
    if (diff > 0) val *= (1 + (diff * 0.006));
    return val;
};

export default function GovtBenefitsCard() {
  const { data, updateInput } = useFinance();
  const isCouple = data.mode === 'Couple';

  const [p1DbEnabled, setP1DbEnabled] = useState(data.inputs.p1_db_enabled ?? false);
  const [p2DbEnabled, setP2DbEnabled] = useState(data.inputs.p2_db_enabled ?? false);

  useEffect(() => {
      setP1DbEnabled(data.inputs.p1_db_enabled ?? false);
      setP2DbEnabled(data.inputs.p2_db_enabled ?? false);
  }, [data.inputs.p1_db_enabled, data.inputs.p2_db_enabled]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header border-bottom border-secondary p-3 surface-card">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div className="d-flex align-items-center">
                    <i className="bi bi-bank text-primary fs-4 me-3"></i>
                    <h5 className="mb-0 fw-bold text-uppercase ls-1">9. Government Benefits</h5>
                    <InfoBtn 
                        align="left" 
                        title="CPP / OAS / Pension" 
                        text={`<b>CPP:</b> Enter the estimate from your Service Canada account. The app will automatically adjust it if you take it early (age 60) or late (age 70). <a href='https://www.canada.ca/en/services/benefits/publicpensions/cpp.html' target='_blank' class='text-primary'>Learn more</a><br><br>
                            <b>OAS:</b> Max OAS requires 40 years of residency in Canada between ages 18 and 65. If you have less, it is prorated. <a href='https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/eligibility.html' target='_blank' class='text-primary'>Learn more</a><br><br>
                            <b>OAS Clawback (2026):</b> If your Net Income exceeds <b>$95,323</b>, your OAS is reduced by 15 cents for every dollar above the threshold. It is fully eliminated at <b>$154,708</b> (or <b>$160,647</b> for ages 75+). <a href='https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/recovery-tax.html' target='_blank' class='text-primary'>Learn more</a>`} 
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
            
            // Resolve dynamic customized name
            const playerName = data.inputs[`${p}_name`] || (p === 'p1' ? 'Player 1' : 'Player 2');

            // Extract birth month from DOB for accurate month-level actuarial adjustment
            const birthMonth = parseInt((data.inputs[`${p}_dob`] || '').split('-')[1], 10) || 1;

            const cppBase = Number(data.inputs[`${p}_cpp_est_base`]) || 0;
            const cppStart = Number(data.inputs[`${p}_cpp_start`]) || 65;
            const cppStartMonth = Number(data.inputs[`${p}_cpp_start_month`]) || 1;
            const cppAdjYr = getAdjustedCPP(cppBase, cppStart, cppStartMonth, birthMonth);
            const cppAdjMo = cppAdjYr / 12;
            const totalCppMonthsDiff = (cppStart - 65) * 12 + (cppStartMonth - birthMonth);
            const isCppEarly = totalCppMonthsDiff < 0;
            const isCppLate = totalCppMonthsDiff > 0;
            const cppColor = isCppEarly ? 'text-danger' : isCppLate ? 'text-success' : 'text-primary';

            const oasStart = Number(data.inputs[`${p}_oas_start`]) || 65;
            const oasStartMonth = Number(data.inputs[`${p}_oas_start_month`]) || 1;
            const oasYears = Number(data.inputs[`${p}_oas_years`]) ?? 40;
            const oasAdjYr = getAdjustedOAS(oasYears, oasStart, oasStartMonth, birthMonth);
            const oasAdjMo = oasAdjYr / 12;
            const totalOasMonthsDiff = (oasStart - 65) * 12 + (oasStartMonth - birthMonth);
            const isOasLate = totalOasMonthsDiff > 0;
            const oasColor = isOasLate ? 'text-success' : 'text-primary';

            return (
            <div className="col-12 col-xl-6" key={p}>
                <div className="card h-100 border-secondary surface-card shadow-none">
                    <div className="card-body p-4">
                        <h6 className={`fw-bold text-uppercase ls-1 mb-4 pb-2 border-bottom border-secondary ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color:'var(--bs-purple)'} : {}}>{playerName} Benefits</h6>
                        
                        {/* CPP Box */}
                        <div className="border border-secondary rounded-4 mb-3 shadow-sm">
                            <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center rounded-top-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}><i className="bi bi-map-fill"></i></div>
                                    <span className="fw-bold text-main small text-uppercase ls-1">CPP</span>
                                </div>
                                <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={data.inputs[`${p}_cpp_enabled`] ?? true} onChange={(e) => updateInput(`${p}_cpp_enabled`, e.target.checked)} /></div>
                            </div>
                            {(data.inputs[`${p}_cpp_enabled`] ?? true) && (
                                <div className="p-3 bg-input d-flex flex-column gap-3 rounded-bottom-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-label small text-muted mb-0">Est. Base Payout (Age 65)</label>
                                        <div style={{width: '215px'}}><CurrencyInput suffix="/yr" className="form-control form-control-sm" value={data.inputs[`${p}_cpp_est_base`]} onChange={(val: any) => updateInput(`${p}_cpp_est_base`, val)} /></div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="small text-muted fw-bold">Starts (Age &amp; Mo):</span>
                                        <div className="d-flex align-items-center gap-2" style={{width: '215px'}}>
                                            <div className="flex-grow-1">
                                                <StepperInput min={60} max={70} value={data.inputs[`${p}_cpp_start`]} onChange={(val: any) => updateInput(`${p}_cpp_start`, val)} />
                                            </div>
                                            <select 
                                                className="form-select form-select-sm bg-input border-secondary text-main rounded-pill shadow-none" 
                                                style={{width: '88px', minWidth: '88px', paddingLeft: '0.75rem', paddingRight: '1.75rem', fontSize: '0.75rem', fontWeight: '600'}}
                                                value={data.inputs[`${p}_cpp_start_month`] ?? 1} 
                                                onChange={(e) => updateInput(`${p}_cpp_start_month`, parseInt(e.target.value, 10))}
                                                title="Start Month"
                                            >
                                                {MONTH_OPTIONS.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>
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
                        <div className="border border-secondary rounded-4 mb-3 shadow-sm">
                            <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center rounded-top-4">
                                <div className="d-flex align-items-center gap-3">
                                    <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center" style={{width: '32px', height: '32px'}}><i className="bi bi-shield-fill-check"></i></div>
                                    <span className="fw-bold text-main small text-uppercase ls-1">OAS</span>
                                </div>
                                <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={data.inputs[`${p}_oas_enabled`] ?? true} onChange={(e) => updateInput(`${p}_oas_enabled`, e.target.checked)} /></div>
                            </div>
                            {(data.inputs[`${p}_oas_enabled`] ?? true) && (
                                <div className="p-3 bg-input d-flex flex-column gap-3 rounded-bottom-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-label small text-muted mb-0">Years in Canada <InfoBtn title="OAS Proration" text="Max OAS requires 40 years of residency in Canada between ages 18 and 65.<br><br><a href='https://www.canada.ca/en/services/benefits/publicpensions/cpp/old-age-security/eligibility.html' target='_blank' class='text-primary'>Learn more at Canada.ca</a>"/></label>
                                        <div style={{width: '215px'}}><StepperInput min={0} max={40} value={oasYears} onChange={(val: any) => updateInput(`${p}_oas_years`, val)} /></div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="small text-muted fw-bold">Starts (Age &amp; Mo):</span>
                                        <div className="d-flex align-items-center gap-2" style={{width: '215px'}}>
                                            <div className="flex-grow-1">
                                                <StepperInput min={65} max={70} value={oasStart} onChange={(val: any) => updateInput(`${p}_oas_start`, val)} />
                                            </div>
                                            <select 
                                                className="form-select form-select-sm bg-input border-secondary text-main rounded-pill shadow-none" 
                                                style={{width: '88px', minWidth: '88px', paddingLeft: '0.75rem', paddingRight: '1.75rem', fontSize: '0.75rem', fontWeight: '600'}}
                                                value={data.inputs[`${p}_oas_start_month`] ?? 1} 
                                                onChange={(e) => updateInput(`${p}_oas_start_month`, parseInt(e.target.value, 10))}
                                                title="Start Month"
                                            >
                                                {MONTH_OPTIONS.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        </div>
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
                        <div className="border border-secondary rounded-4 shadow-sm">
                            <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center rounded-top-4">
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
                                <div className="p-3 bg-input d-flex flex-column gap-3 rounded-bottom-4">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="d-flex align-items-center">
                                            <label className="form-label small fw-bold text-muted mb-0">Index to Inflation</label>
                                            <InfoBtn title="Index to Inflation" text="If checked, the pension amount will grow with inflation. If unchecked, the payout remains flat for life.<br><br><a href='https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/pension-adjustment.html' target='_blank' class='text-primary'>Learn more at Canada.ca</a>" />
                                        </div>
                                        <div className="form-check form-switch mb-0"><input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={data.inputs[`${p}_db_indexed`] ?? true} onChange={(e) => updateInput(`${p}_db_indexed`, e.target.checked)} /></div>
                                    </div>
                                    
                                    <div className="border-top border-secondary pt-3 mt-1">
                                        <h6 className="small fw-bold mb-3" style={p === 'p2' ? {color: 'var(--bs-purple)'} : {color: 'var(--bs-info)'}}>Lifetime Pension</h6>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label className="small text-muted mb-0">Amount</label>
                                            <div style={{width: '215px'}}><CurrencyInput suffix="/mo" className="form-control form-control-sm" value={data.inputs[`${p}_db_lifetime`] ?? ''} onChange={(val: any) => updateInput(`${p}_db_lifetime`, val)} /></div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="small text-muted fw-bold">Starts (Age &amp; Mo):</span>
                                            <div className="d-flex align-items-center gap-2" style={{width: '215px'}}>
                                                <div className="flex-grow-1">
                                                    <StepperInput min={50} max={75} value={data.inputs[`${p}_db_lifetime_start`] ?? 60} onChange={(val: any) => updateInput(`${p}_db_lifetime_start`, val)} />
                                                </div>
                                                <select 
                                                    className="form-select form-select-sm bg-input border-secondary text-main rounded-pill shadow-none" 
                                                    style={{width: '88px', minWidth: '88px', paddingLeft: '0.75rem', paddingRight: '1.75rem', fontSize: '0.75rem', fontWeight: '600'}}
                                                    value={data.inputs[`${p}_db_lifetime_start_month`] ?? 1} 
                                                    onChange={(e) => updateInput(`${p}_db_lifetime_start_month`, parseInt(e.target.value, 10))}
                                                    title="Start Month"
                                                >
                                                    {MONTH_OPTIONS.map(m => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-top border-secondary pt-3 mt-1">
                                        <h6 className="small fw-bold text-muted mb-3">Bridge Benefit <span className="text-muted fw-normal">(Ends at 65)</span></h6>
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <label className="small text-muted mb-0">Amount</label>
                                            <div style={{width: '215px'}}><CurrencyInput suffix="/mo" className="form-control form-control-sm" value={data.inputs[`${p}_db_bridge`] ?? ''} onChange={(val: any) => updateInput(`${p}_db_bridge`, val)} /></div>
                                        </div>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="small text-muted fw-bold">Starts (Age &amp; Mo):</span>
                                            <div className="d-flex align-items-center gap-2" style={{width: '215px'}}>
                                                <div className="flex-grow-1">
                                                    <StepperInput min={50} max={65} value={data.inputs[`${p}_db_bridge_start`] ?? 60} onChange={(val: any) => updateInput(`${p}_db_bridge_start`, val)} />
                                                </div>
                                                <select 
                                                    className="form-select form-select-sm bg-input border-secondary text-main rounded-pill shadow-none" 
                                                    style={{width: '88px', minWidth: '88px', paddingLeft: '0.75rem', paddingRight: '1.75rem', fontSize: '0.75rem', fontWeight: '600'}}
                                                    value={data.inputs[`${p}_db_bridge_start_month`] ?? 1} 
                                                    onChange={(e) => updateInput(`${p}_db_bridge_start_month`, parseInt(e.target.value, 10))}
                                                    title="Start Month"
                                                >
                                                    {MONTH_OPTIONS.map(m => (
                                                        <option key={m.value} value={m.value}>{m.label}</option>
                                                    ))}
                                                </select>
                                            </div>
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
  );
}