import React, { useState } from 'react';
import { useFinance } from '../lib/FinanceContext';

const ACCOUNT_TYPES = [
  { id: 'cash', label: 'Cash', tooltip: 'Interest income is 100% taxable at your marginal rate.' },
  { id: 'tfsa', label: 'TFSA', tooltip: 'Tax-Free Savings Account. Growth and withdrawals are 100% tax-free.' },
  { id: 'fhsa', label: 'FHSA', tooltip: 'First Home Savings Account. Tax-deductible contributions, tax-free withdrawals.' },
  { id: 'rrsp', label: 'RRSP', tooltip: 'Registered Retirement Savings Plan. Tax-deductible contributions. Tax-deferred growth.' },
  { id: 'resp', label: 'RESP', tooltip: 'Registered Education Savings Plan. 20% CESG match.' },
  { id: 'lirf', label: 'LIRF', tooltip: 'Locked-in Retirement Account (LIRA). Pension funds locked until retirement.' },
  { id: 'lif', label: 'LIF', tooltip: 'Life Income Fund. Payout vehicle for LIRA. Has min/max limits.' },
  { id: 'rrif_acct', label: 'RRIF', tooltip: 'Registered Retirement Income Fund. Mandatory minimum withdrawals.' }
];

export default function PlanTab() {
  const { data, updateInput, addArrayItem, updateArrayItem, removeArrayItem } = useFinance(); 
  
  const [advancedMode, setAdvancedMode] = useState(false);
  const [expenseAdvancedMode, setExpenseAdvancedMode] = useState(false);
  const [p1DbEnabled, setP1DbEnabled] = useState(false);
  const [p2DbEnabled, setP2DbEnabled] = useState(false);

  const handleNumberChange = (key: string, value: string) => {
    if (value === '') {
      updateInput(key, '');
      return;
    }
    const num = parseFloat(value);
    updateInput(key, isNaN(num) ? 0 : num);
  };

  // Calculate Portfolio Totals safely
  const p1Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p1_${acct.id}`]) || 0), 0) + (Number(data.inputs['p1_nonreg']) || 0) + (Number(data.inputs['p1_crypto']) || 0);
  const p2Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p2_${acct.id}`]) || 0), 0) + (Number(data.inputs['p2_nonreg']) || 0) + (Number(data.inputs['p2_crypto']) || 0);
  const hhTotal = p1Total + p2Total;

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="p-3 p-md-4">
      <form id="financialForm" onSubmit={e => e.preventDefault()}>
        
        {/* 1. Personal Information */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-person-vcard text-primary fs-4 me-3"></i>
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">1. Personal Information</h5>
            </div>
            <div className="btn-group bg-input rounded-3 shadow-sm p-1 border border-secondary" role="group">
              <input type="radio" className="btn-check" name="planMode" id="modeSingle" autoComplete="off" />
              <label className="btn btn-sm btn-outline-secondary px-3" htmlFor="modeSingle">Single</label>
              <input type="radio" className="btn-check" name="planMode" id="modeCouple" autoComplete="off" defaultChecked />
              <label className="btn btn-sm btn-outline-secondary px-3" htmlFor="modeCouple">Couple</label>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-12 col-xl-6">
                <div className="p-4 border border-secondary rounded-3 h-100 position-relative overflow-hidden surface-card">
                  <div className="position-absolute top-0 start-0 w-100 border-top border-info border-3"></div>
                  <h6 className="text-info fw-bold mb-4 text-uppercase ls-1"><i className="bi bi-person-fill me-2"></i>Player 1 (P1)</h6>
                  <div className="row g-4 mb-3">
                     <div className="col-6">
                        <label className="form-label text-muted fw-bold">Age</label>
                        <input type="number" className="form-control fw-bold text-info" value={data.inputs.p1_age ?? ''} onChange={(e) => handleNumberChange('p1_age', e.target.value)} />
                     </div>
                     <div className="col-6">
                        <label className="form-label text-muted fw-bold">Retirement Age</label>
                        <input type="number" className="form-control" value={data.inputs.p1_retireAge ?? ''} onChange={(e) => handleNumberChange('p1_retireAge', e.target.value)} />
                     </div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-xl-6">
                <div className="p-4 border border-secondary rounded-3 h-100 position-relative overflow-hidden surface-card">
                  <div className="position-absolute top-0 start-0 w-100 border-top border-3" style={{ borderColor: 'var(--bs-purple)' }}></div>
                  <h6 className="fw-bold mb-4 text-uppercase ls-1" style={{ color: 'var(--bs-purple)' }}><i className="bi bi-person-fill me-2"></i>Player 2 (P2)</h6>
                  <div className="row g-4 mb-3">
                     <div className="col-6">
                        <label className="form-label text-muted fw-bold">Age</label>
                        <input type="number" className="form-control fw-bold" style={{ color: 'var(--bs-purple)' }} value={data.inputs.p2_age ?? ''} onChange={(e) => handleNumberChange('p2_age', e.target.value)} />
                     </div>
                     <div className="col-6">
                        <label className="form-label text-muted fw-bold">Retirement Age</label>
                        <input type="number" className="form-control" value={data.inputs.p2_retireAge ?? ''} onChange={(e) => handleNumberChange('p2_retireAge', e.target.value)} />
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Dependents */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-people text-info fs-4 me-3"></i>
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">2. Dependents (CCB & RESP)</h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-info rounded-pill px-3" onClick={() => addArrayItem('dependents', { name: `Child ${data.dependents.length + 1}`, dob: '2024-01' })}>
              <i className="bi bi-plus-lg me-1"></i> Add Child
            </button>
          </div>
          <div className="card-body p-4">
            {data.dependents.length === 0 && <div className="text-center text-muted small fst-italic">No dependents added. Click "Add Child" above.</div>}
            {data.dependents.map((dep: any, index: number) => (
              <div className="row g-3 mb-3 align-items-end" key={`dep_${index}`}>
                <div className="col-5">
                  <label className="form-label small text-muted">Name</label>
                  <input type="text" className="form-control" value={dep.name || ''} onChange={(e) => updateArrayItem('dependents', index, 'name', e.target.value)} />
                </div>
                <div className="col-5">
                  <label className="form-label small text-muted">Birth Month</label>
                  <input type="month" className="form-control" value={dep.dob || ''} onChange={(e) => updateArrayItem('dependents', index, 'dob', e.target.value)} />
                </div>
                <div className="col-2">
                  <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeArrayItem('dependents', index)}><i className="bi bi-trash"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Portfolio Assets */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-wallet2 text-success fs-4 me-3"></i>
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">3. Portfolio Assets</h5>
            </div>
            <div className="form-check form-switch mb-0">
              <input className="form-check-input mt-1" type="checkbox" id="asset_mode_advanced" role="switch" checked={advancedMode} onChange={(e) => setAdvancedMode(e.target.checked)} />
              <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-1" htmlFor="asset_mode_advanced">Adv. Mode</label>
            </div>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              {/* P1 Assets */}
              <div className="col-12 col-xl-6">
                <div className="card border-secondary surface-card shadow-none h-100">
                  <div className="card-body p-3 p-md-4">
                    <h6 className="text-info mb-4 fw-bold text-uppercase ls-1 pb-2 border-bottom border-secondary">P1 Asset Mix</h6>
                    <div className="row g-2 align-items-end mb-3">
                        <div className="col-3"><label className="form-label text-muted mb-0 small">Account</label></div>
                        <div className="col-5"><label className="form-label text-muted mb-0 small">Balance ($)</label></div>
                        <div className="col-4"><label className="form-label text-muted mb-0 small">Return (%)</label></div>
                    </div>
                    {ACCOUNT_TYPES.map(acct => {
                        const balKey = `p1_${acct.id}`;
                        const retKey = `p1_${acct.id}_ret`;
                        return (
                            <div className="row g-2 mb-2" key={balKey}>
                                <div className="col-3 pt-2 small fw-medium d-flex align-items-center text-main" title={acct.tooltip}>{acct.label}</div>
                                <div className="col-5">
                                    <input type="number" className="form-control form-control-sm" value={data.inputs[balKey] ?? ''} onChange={(e) => handleNumberChange(balKey, e.target.value)} />
                                </div>
                                <div className="col-4">
                                    <div className="input-group input-group-sm">
                                        <input type="number" step="0.01" className="form-control" value={data.inputs[retKey] ?? ''} onChange={(e) => handleNumberChange(retKey, e.target.value)} />
                                        <span className="input-group-text bg-input">%</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    
                    {/* Non-Reg and Crypto (Advanced Inputs) */}
                    {['nonreg', 'crypto'].map(acct => (
                        <div className="row g-2 mb-2 align-items-center" key={`p1_${acct}`}>
                            <div className="col-3 pt-2 small fw-medium text-main">{acct === 'nonreg' ? 'Non-Reg' : 'Crypto'}</div>
                            <div className="col-5">
                                <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm" title="Current Market Value">
                                        <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>Mkt</span>
                                        <input type="number" className="form-control px-1" value={data.inputs[`p1_${acct}`] ?? ''} onChange={(e) => handleNumberChange(`p1_${acct}`, e.target.value)} />
                                    </div>
                                    <div className="input-group input-group-sm" title="Adjusted Cost Base">
                                        <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>ACB</span>
                                        <input type="number" className="form-control px-1" value={data.inputs[`p1_${acct}_acb`] ?? ''} onChange={(e) => handleNumberChange(`p1_${acct}_acb`, e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm" title="Total Return">
                                        <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>Tot</span>
                                        <input type="number" step="0.01" className="form-control px-1" value={data.inputs[`p1_${acct}_ret`] ?? ''} onChange={(e) => handleNumberChange(`p1_${acct}_ret`, e.target.value)} />
                                        <span className="input-group-text px-1">%</span>
                                    </div>
                                    {acct === 'nonreg' && (
                                        <div className="input-group input-group-sm" title="Dividend Yield">
                                            <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>Yld</span>
                                            <input type="number" step="0.01" className="form-control px-1" value={data.inputs[`p1_${acct}_yield`] ?? ''} onChange={(e) => handleNumberChange(`p1_${acct}_yield`, e.target.value)} />
                                            <span className="input-group-text px-1">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* P2 Assets */}
              <div className="col-12 col-xl-6">
                <div className="card border-secondary surface-card shadow-none h-100">
                  <div className="card-body p-3 p-md-4">
                    <h6 className="fw-bold mb-4 text-uppercase ls-1 pb-2 border-bottom border-secondary" style={{ color: 'var(--bs-purple)' }}>P2 Asset Mix</h6>
                    <div className="row g-2 align-items-end mb-3">
                        <div className="col-3"><label className="form-label text-muted mb-0 small">Account</label></div>
                        <div className="col-5"><label className="form-label text-muted mb-0 small">Balance ($)</label></div>
                        <div className="col-4"><label className="form-label text-muted mb-0 small">Return (%)</label></div>
                    </div>
                    {ACCOUNT_TYPES.map(acct => {
                        const balKey = `p2_${acct.id}`;
                        const retKey = `p2_${acct.id}_ret`;
                        return (
                            <div className="row g-2 mb-2" key={balKey}>
                                <div className="col-3 pt-2 small fw-medium d-flex align-items-center text-main" title={acct.tooltip}>{acct.label}</div>
                                <div className="col-5">
                                    <input type="number" className="form-control form-control-sm" value={data.inputs[balKey] ?? ''} onChange={(e) => handleNumberChange(balKey, e.target.value)} />
                                </div>
                                <div className="col-4">
                                    <div className="input-group input-group-sm">
                                        <input type="number" step="0.01" className="form-control" value={data.inputs[retKey] ?? ''} onChange={(e) => handleNumberChange(retKey, e.target.value)} />
                                        <span className="input-group-text bg-input">%</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}

                    {/* Non-Reg and Crypto (Advanced Inputs) */}
                    {['nonreg', 'crypto'].map(acct => (
                        <div className="row g-2 mb-2 align-items-center" key={`p2_${acct}`}>
                            <div className="col-3 pt-2 small fw-medium text-main">{acct === 'nonreg' ? 'Non-Reg' : 'Crypto'}</div>
                            <div className="col-5">
                                <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm" title="Current Market Value">
                                        <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>Mkt</span>
                                        <input type="number" className="form-control px-1" value={data.inputs[`p2_${acct}`] ?? ''} onChange={(e) => handleNumberChange(`p2_${acct}`, e.target.value)} />
                                    </div>
                                    <div className="input-group input-group-sm" title="Adjusted Cost Base">
                                        <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>ACB</span>
                                        <input type="number" className="form-control px-1" value={data.inputs[`p2_${acct}_acb`] ?? ''} onChange={(e) => handleNumberChange(`p2_${acct}_acb`, e.target.value)} />
                                    </div>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm" title="Total Return">
                                        <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>Tot</span>
                                        <input type="number" step="0.01" className="form-control px-1" value={data.inputs[`p2_${acct}_ret`] ?? ''} onChange={(e) => handleNumberChange(`p2_${acct}_ret`, e.target.value)} />
                                        <span className="input-group-text px-1">%</span>
                                    </div>
                                    {acct === 'nonreg' && (
                                        <div className="input-group input-group-sm" title="Dividend Yield">
                                            <span className="input-group-text border-secondary px-1" style={{fontSize:'0.7rem'}}>Yld</span>
                                            <input type="number" step="0.01" className="form-control px-1" value={data.inputs[`p2_${acct}_yield`] ?? ''} onChange={(e) => handleNumberChange(`p2_${acct}_yield`, e.target.value)} />
                                            <span className="input-group-text px-1">%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Portfolio Total Summary Box */}
            <div className="card border-success border-opacity-50 surface-card mt-4">
              <div className="card-body p-3">
                  <div className="row text-center align-items-center">
                      <div className="col-6 col-md-4 border-end border-success border-opacity-25">
                          <div className="small fw-bold text-success text-uppercase ls-1 mb-1">P1 Portfolio</div>
                          <div className="fs-5 fw-bold text-success">{formatCurrency(p1Total)}</div>
                      </div>
                      <div className="col-6 col-md-4 border-end border-success border-opacity-25">
                          <div className="small fw-bold text-uppercase ls-1 mb-1" style={{ color: 'var(--bs-purple)' }}>P2 Portfolio</div>
                          <div className="fs-5 fw-bold" style={{ color: 'var(--bs-purple)' }}>{formatCurrency(p2Total)}</div>
                      </div>
                      <div className="col-12 col-md-4 mt-3 mt-md-0 flex-grow-1">
                          <div className="small fw-bold text-main text-uppercase ls-1 mb-1">Total Liquid Assets</div>
                          <div className="fs-5 fw-bold text-main">{formatCurrency(hhTotal)}</div>
                      </div>
                  </div>
              </div>
            </div>
            
          </div>
        </div>

        {/* 4. Real Estate & Mortgage */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-house-heart text-danger fs-4 me-3"></i>
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">4. Real Estate & Mortgage</h5>
            </div>
            <button type="button" className="btn btn-sm btn-primary px-3 rounded-pill" onClick={() => addArrayItem('properties', { name: `Property ${data.properties.length + 1}`, value: 800000, mortgage: 400000, rate: 3.5, payment: 2000, growth: 3, includeInNW: true, sellEnabled: false, sellAge: 75, replacementValue: 0 })}>
              <i className="bi bi-plus-lg me-1"></i> Add Property
            </button>
          </div>
          <div className="card-body p-4">
            {data.properties.length === 0 && <div className="text-center text-muted small fst-italic">No properties added. Click "Add Property" above.</div>}
            
            {data.properties.map((prop: any, idx: number) => (
              <div className="p-3 border border-secondary rounded-3 surface-card mb-3" key={`prop_${idx}`}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <input type="text" className="form-control form-control-sm bg-transparent border-0 text-danger fw-bold fs-6 w-50" value={prop.name || ''} onChange={(e) => updateArrayItem('properties', idx, 'name', e.target.value)} />
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeArrayItem('properties', idx)}><i className="bi bi-trash"></i></button>
                </div>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted">Current Value ($)</label>
                    <input type="number" className="form-control" value={prop.value ?? ''} onChange={(e) => updateArrayItem('properties', idx, 'value', Number(e.target.value))} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted">Mortgage Balance ($)</label>
                    <input type="number" className="form-control" value={prop.mortgage ?? ''} onChange={(e) => updateArrayItem('properties', idx, 'mortgage', Number(e.target.value))} />
                  </div>
                  <div className="col-12 col-md-4">
                    <label className="form-label small text-muted">Monthly Payment ($)</label>
                    <input type="number" className="form-control" value={prop.payment ?? ''} onChange={(e) => updateArrayItem('properties', idx, 'payment', Number(e.target.value))} />
                  </div>
                </div>
                <div className="row g-3">
                  <div className="col-6 col-md-4">
                    <label className="form-label small text-muted">Mortgage Rate (%)</label>
                    <input type="number" step="0.1" className="form-control" value={prop.rate ?? ''} onChange={(e) => updateArrayItem('properties', idx, 'rate', Number(e.target.value))} />
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label small text-muted">Property Growth (%)</label>
                    <input type="number" step="0.1" className="form-control" value={prop.growth ?? ''} onChange={(e) => updateArrayItem('properties', idx, 'growth', Number(e.target.value))} />
                  </div>
                  <div className="col-12 col-md-4 d-flex align-items-end">
                    <div className="form-check form-switch mb-2">
                      <input className="form-check-input" type="checkbox" checked={prop.includeInNW ?? false} onChange={(e) => updateArrayItem('properties', idx, 'includeInNW', e.target.checked)} />
                      <label className="form-check-label small text-muted ms-1">Include in Liquid Net Worth</label>
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
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">5. Income & Taxation</h5>
          </div>
          <div className="card-body p-4">
            <div className="row mb-4">
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold d-flex align-items-center">Province of Residence</label>
                <select className="form-select" value={data.inputs.tax_province || 'ON'} onChange={(e) => updateInput('tax_province', e.target.value)}>
                  <option value="ON">Ontario</option>
                  <option value="AB">Alberta</option>
                  <option value="BC">British Columbia</option>
                  <option value="MB">Manitoba</option>
                  <option value="NB">New Brunswick</option>
                  <option value="NL">Newfoundland & Labrador</option>
                  <option value="NS">Nova Scotia</option>
                  <option value="PE">Prince Edward Island</option>
                  <option value="QC">Quebec</option>
                  <option value="SK">Saskatchewan</option>
                </select>
              </div>
            </div>
            
            <div className="row g-4 mb-4">
              {/* P1 Income Panel */}
              <div className="col-12 col-xl-6">
                <div className="card h-100 border-secondary surface-card shadow-none">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                      <h6 className="text-info mb-0 fw-bold text-uppercase ls-1">Player 1 Income</h6>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => addArrayItem('additionalIncome', { owner: 'p1', name: 'Side Hustle', amount: 5000, freq: 'year', growth: 2.0, startMode: 'date', start: '2026-01', endMode: 'ret_relative', taxable: true })}><i className="bi bi-plus-lg"></i> Stream</button>
                        <button type="button" className="btn btn-sm btn-outline-warning rounded-pill px-3" onClick={() => addArrayItem('leaves', { owner: 'p1', start: '2026-01', durationWeeks: 52, topUpWeeks: 12, topUpPercent: 100 })}><i className="bi bi-plus-lg"></i> Leave</button>
                      </div>
                    </div>
                    
                    {/* Core Income */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-8">
                            <label className="form-label d-flex align-items-center">Gross Annual Income</label>
                            <div className="input-group">
                              <span className="input-group-text bg-input">$</span>
                              <input type="number" className="form-control" value={data.inputs.p1_income ?? ''} onChange={(e) => handleNumberChange('p1_income', e.target.value)} />
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="form-label d-flex align-items-center">Growth</label>
                            <div className="input-group">
                              <input type="number" step="0.1" className="form-control" value={data.inputs.p1_income_growth !== undefined ? data.inputs.p1_income_growth : 2.0} onChange={(e) => handleNumberChange('p1_income_growth', e.target.value)} />
                              <span className="input-group-text bg-input">%</span>
                            </div>
                        </div>
                    </div>

                    {/* RRSP Match */}
                    <div className="row g-3 mb-4 border-top border-secondary pt-3">
                        <div className="col-6">
                            <label className="form-label d-flex align-items-center text-nowrap">RRSP Max Match</label>
                            <div className="input-group input-group-sm">
                              <input type="number" step="0.1" className="form-control" value={data.inputs.p1_rrsp_match ?? ''} onChange={(e) => handleNumberChange('p1_rrsp_match', e.target.value)} />
                              <span className="input-group-text bg-input">%</span>
                            </div>
                        </div>
                        <div className="col-6">
                            <label className="form-label d-flex align-items-center text-nowrap">Match Rate</label>
                            <div className="input-group input-group-sm">
                              <input type="number" step="1" className="form-control" value={data.inputs.p1_rrsp_match_tier !== undefined ? data.inputs.p1_rrsp_match_tier : 100} onChange={(e) => handleNumberChange('p1_rrsp_match_tier', e.target.value)} />
                              <span className="input-group-text bg-input">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Income Streams */}
                    {data.additionalIncome.filter((inc: any) => inc.owner === 'p1').map((inc: any) => {
                      const realIdx = data.additionalIncome.indexOf(inc);
                      return (
                        <div className="p-3 border border-secondary rounded-3 bg-input mb-3" key={`p1_inc_${realIdx}`}>
                          <div className="d-flex justify-content-between mb-2">
                            <input type="text" className="form-control form-control-sm bg-transparent border-0 text-info fw-bold p-0" value={inc.name || ''} onChange={(e) => updateArrayItem('additionalIncome', realIdx, 'name', e.target.value)} />
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeArrayItem('additionalIncome', realIdx)}><i className="bi bi-trash"></i></button>
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                               <label className="form-label small">Amount</label>
                               <input type="number" className="form-control form-control-sm" value={inc.amount ?? ''} onChange={(e) => updateArrayItem('additionalIncome', realIdx, 'amount', Number(e.target.value))} />
                            </div>
                            <div className="col-6">
                               <label className="form-label small">Start Date</label>
                               <input type="month" className="form-control form-control-sm" value={inc.start || ''} onChange={(e) => updateArrayItem('additionalIncome', realIdx, 'start', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Leaves */}
                    {data.leaves.filter((leave: any) => leave.owner === 'p1').map((leave: any) => {
                      const realIdx = data.leaves.indexOf(leave);
                      return (
                        <div className="p-3 border border-warning rounded-3 bg-input mb-3" key={`p1_leave_${realIdx}`}>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-warning fw-bold small">Maternity / Parental Leave</span>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeArrayItem('leaves', realIdx)}><i className="bi bi-trash"></i></button>
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                               <label className="form-label small">Start Date</label>
                               <input type="month" className="form-control form-control-sm" value={leave.start || ''} onChange={(e) => updateArrayItem('leaves', realIdx, 'start', e.target.value)} />
                            </div>
                            <div className="col-6">
                               <label className="form-label small">Duration (Wks)</label>
                               <input type="number" className="form-control form-control-sm" value={leave.durationWeeks ?? ''} onChange={(e) => updateArrayItem('leaves', realIdx, 'durationWeeks', Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* P2 Income Panel */}
              <div className="col-12 col-xl-6">
                <div className="card h-100 border-secondary surface-card shadow-none">
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary">
                      <h6 className="fw-bold mb-0 text-uppercase ls-1" style={{ color: 'var(--bs-purple)' }}>Player 2 Income</h6>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" style={{ color: 'var(--bs-purple)', borderColor: 'var(--bs-purple)' }} onClick={() => addArrayItem('additionalIncome', { owner: 'p2', name: 'Side Hustle', amount: 5000, freq: 'year', growth: 2.0, startMode: 'date', start: '2026-01', endMode: 'ret_relative', taxable: true })}><i className="bi bi-plus-lg"></i> Stream</button>
                        <button type="button" className="btn btn-sm btn-outline-warning rounded-pill px-3" onClick={() => addArrayItem('leaves', { owner: 'p2', start: '2026-01', durationWeeks: 52, topUpWeeks: 12, topUpPercent: 100 })}><i className="bi bi-plus-lg"></i> Leave</button>
                      </div>
                    </div>

                    {/* Core Income */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-8">
                            <label className="form-label d-flex align-items-center">Gross Annual Income</label>
                            <div className="input-group">
                              <span className="input-group-text bg-input">$</span>
                              <input type="number" className="form-control" value={data.inputs.p2_income ?? ''} onChange={(e) => handleNumberChange('p2_income', e.target.value)} />
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <label className="form-label d-flex align-items-center">Growth</label>
                            <div className="input-group">
                              <input type="number" step="0.1" className="form-control" value={data.inputs.p2_income_growth !== undefined ? data.inputs.p2_income_growth : 2.0} onChange={(e) => handleNumberChange('p2_income_growth', e.target.value)} />
                              <span className="input-group-text bg-input">%</span>
                            </div>
                        </div>
                    </div>

                    {/* RRSP Match */}
                    <div className="row g-3 mb-4 border-top border-secondary pt-3">
                        <div className="col-6">
                            <label className="form-label d-flex align-items-center text-nowrap">RRSP Max Match</label>
                            <div className="input-group input-group-sm">
                              <input type="number" step="0.1" className="form-control" value={data.inputs.p2_rrsp_match ?? ''} onChange={(e) => handleNumberChange('p2_rrsp_match', e.target.value)} />
                              <span className="input-group-text bg-input">%</span>
                            </div>
                        </div>
                        <div className="col-6">
                            <label className="form-label d-flex align-items-center text-nowrap">Match Rate</label>
                            <div className="input-group input-group-sm">
                              <input type="number" step="1" className="form-control" value={data.inputs.p2_rrsp_match_tier !== undefined ? data.inputs.p2_rrsp_match_tier : 100} onChange={(e) => handleNumberChange('p2_rrsp_match_tier', e.target.value)} />
                              <span className="input-group-text bg-input">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Income Streams */}
                    {data.additionalIncome.filter((inc: any) => inc.owner === 'p2').map((inc: any) => {
                      const realIdx = data.additionalIncome.indexOf(inc);
                      return (
                        <div className="p-3 border border-secondary rounded-3 bg-input mb-3" key={`p2_inc_${realIdx}`}>
                          <div className="d-flex justify-content-between mb-2">
                            <input type="text" className="form-control form-control-sm bg-transparent border-0 fw-bold p-0" style={{ color: 'var(--bs-purple)' }} value={inc.name || ''} onChange={(e) => updateArrayItem('additionalIncome', realIdx, 'name', e.target.value)} />
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeArrayItem('additionalIncome', realIdx)}><i className="bi bi-trash"></i></button>
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                               <label className="form-label small">Amount</label>
                               <input type="number" className="form-control form-control-sm" value={inc.amount ?? ''} onChange={(e) => updateArrayItem('additionalIncome', realIdx, 'amount', Number(e.target.value))} />
                            </div>
                            <div className="col-6">
                               <label className="form-label small">Start Date</label>
                               <input type="month" className="form-control form-control-sm" value={inc.start || ''} onChange={(e) => updateArrayItem('additionalIncome', realIdx, 'start', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Leaves */}
                    {data.leaves.filter((leave: any) => leave.owner === 'p2').map((leave: any) => {
                      const realIdx = data.leaves.indexOf(leave);
                      return (
                        <div className="p-3 border border-warning rounded-3 bg-input mb-3" key={`p2_leave_${realIdx}`}>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-warning fw-bold small">Maternity / Parental Leave</span>
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => removeArrayItem('leaves', realIdx)}><i className="bi bi-trash"></i></button>
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                               <label className="form-label small">Start Date</label>
                               <input type="month" className="form-control form-control-sm" value={leave.start || ''} onChange={(e) => updateArrayItem('leaves', realIdx, 'start', e.target.value)} />
                            </div>
                            <div className="col-6">
                               <label className="form-label small">Duration (Wks)</label>
                               <input type="number" className="form-control form-control-sm" value={leave.durationWeeks ?? ''} onChange={(e) => updateArrayItem('leaves', realIdx, 'durationWeeks', Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      )
                    })}

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
              <i className="bi bi-cart4 text-main fs-4 me-3"></i>
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">6. Living Expenses</h5>
            </div>
            <div className="form-check form-switch mb-0">
              <input className="form-check-input mt-1" type="checkbox" id="expense_mode_advanced" role="switch" checked={expenseAdvancedMode} onChange={(e) => setExpenseAdvancedMode(e.target.checked)} />
              <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-1" htmlFor="expense_mode_advanced">Adv. Mode</label>
            </div>
          </div>
          <div className="card-body p-4">
            {/* Phase Sliders (Advanced Mode) */}
            {expenseAdvancedMode && (
              <div className="row g-4 mb-4 p-4 border border-secondary rounded-3 surface-card text-start">
                <div className="col-md-6">
                  <label className="form-label text-info fw-bold">Go-Go Phase Ends (Age)</label>
                  <input type="range" className="form-range mt-2" min="60" max="90" value={data.inputs.exp_gogo_age || 75} onChange={(e) => handleNumberChange('exp_gogo_age', e.target.value)} />
                  <div className="d-flex justify-content-between text-muted small mt-1"><span>60</span><span className="fw-bold fs-6 text-info">{data.inputs.exp_gogo_age || 75}</span><span>90</span></div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-primary fw-bold">Slow-Go Phase Ends (Age)</label>
                  <input type="range" className="form-range mt-2" min="70" max="100" value={data.inputs.exp_slow_age || 85} onChange={(e) => handleNumberChange('exp_slow_age', e.target.value)} />
                  <div className="d-flex justify-content-between text-muted small mt-1"><span>70</span><span className="fw-bold fs-6 text-primary">{data.inputs.exp_slow_age || 85}</span><span>100</span></div>
                </div>
              </div>
            )}

            {/* Categorized Expense Tables */}
            {Object.keys(data.expensesByCategory || {}).map((catKey) => (
              <div key={catKey} className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="text-uppercase small fw-bold text-muted mb-0 ls-1">
                    {catKey.charAt(0).toUpperCase() + catKey.slice(1)}
                  </h6>
                  <div className="flex-grow-1 ms-3 border-bottom border-secondary border-opacity-25"></div>
                </div>
                <div className="table-responsive rounded-3 border border-secondary shadow-sm mb-2">
                  <table className="table table-dark table-sm align-middle mb-0">
                    <thead className="surface-card">
                      <tr style={{ fontSize: '0.7rem' }}>
                        <th className="text-muted text-uppercase p-2 ps-3" style={{ width: '40%' }}>Expense Item</th>
                        <th className="text-muted text-uppercase p-2">Working ($)</th>
                        <th className="text-muted text-uppercase p-2">Retirement ($)</th>
                        <th className="text-muted text-uppercase p-2 text-end pe-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.expensesByCategory[catKey].items.map((exp: any, idx: number) => (
                        <tr key={`${catKey}_${idx}`}>
                          <td className="p-2 ps-3">
                            <input type="text" className="form-control form-control-sm bg-input border-0" placeholder="e.g. Rent" value={exp.name || ''} onChange={(e) => {
                              const newItems = [...data.expensesByCategory[catKey].items];
                              newItems[idx].name = e.target.value;
                              updateInput('expensesByCategory', { ...data.expensesByCategory, [catKey]: { items: newItems } });
                            }} />
                          </td>
                          <td className="p-2">
                            <input type="number" className="form-control form-control-sm bg-input border-0" value={exp.curr ?? ''} onChange={(e) => {
                              const newItems = [...data.expensesByCategory[catKey].items];
                              newItems[idx].curr = Number(e.target.value);
                              updateInput('expensesByCategory', { ...data.expensesByCategory, [catKey]: { items: newItems } });
                            }} />
                          </td>
                          <td className="p-2">
                            <input type="number" className="form-control form-control-sm bg-input border-0" value={exp.ret ?? ''} onChange={(e) => {
                              const newItems = [...data.expensesByCategory[catKey].items];
                              newItems[idx].ret = Number(e.target.value);
                              updateInput('expensesByCategory', { ...data.expensesByCategory, [catKey]: { items: newItems } });
                            }} />
                          </td>
                          <td className="p-2 text-end pe-3">
                            <button type="button" className="btn btn-sm btn-link text-danger p-0" onClick={() => {
                              const newItems = [...data.expensesByCategory[catKey].items];
                              newItems.splice(idx, 1);
                              updateInput('expensesByCategory', { ...data.expensesByCategory, [catKey]: { items: newItems } });
                            }}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary border-0 rounded-pill px-3" style={{ fontSize: '0.75rem' }} onClick={() => {
                  const newItems = [...data.expensesByCategory[catKey].items, { name: '', curr: 0, ret: 0, freq: 1 }];
                  updateInput('expensesByCategory', { ...data.expensesByCategory, [catKey]: { items: newItems } });
                }}>
                  <i className="bi bi-plus-lg me-1"></i> Add to {catKey}
                </button>
              </div>
            ))}

            {/* RESTORED: Household Total Summary Box */}
            <div className="card border-primary border-opacity-50 surface-card mt-4">
              <div className="card-body p-3">
                <div className="row text-center align-items-center">
                  <div className="col-6 border-end border-primary border-opacity-25">
                    <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Total Annual (Current)</div>
                    <div className="fs-4 fw-bold text-main">
                      {formatCurrency(Object.values(data.expensesByCategory || {}).reduce((acc: number, cat: any) => 
                        acc + cat.items.reduce((sum: number, i: any) => sum + (i.curr * (i.freq || 1)), 0), 0
                      ))}
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Total Annual (Retirement)</div>
                    <div className="fs-4 fw-bold text-primary">
                      {formatCurrency(Object.values(data.expensesByCategory || {}).reduce((acc: number, cat: any) => 
                        acc + cat.items.reduce((sum: number, i: any) => sum + (i.ret * (i.freq || 1)), 0), 0
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 7. Future Expenses & Debts */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-cart-plus text-danger fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 me-2">7. Future Expenses & Debts</h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => addArrayItem('debt', { name: 'New Expense', amount: 15000, start: '2026-01' })}>
              <i className="bi bi-plus-lg me-1"></i> Add Expense/Debt
            </button>
          </div>
          <div className="card-body p-4">
             {data.debt.length === 0 && <div className="text-center text-muted small fst-italic">No future expenses added.</div>}
             {data.debt.map((d: any, idx: number) => (
                <div className="row g-3 mb-3 align-items-end" key={`debt_${idx}`}>
                  <div className="col-4">
                    <label className="form-label small text-muted">Expense Name</label>
                    <input type="text" className="form-control" value={d.name || ''} onChange={(e) => updateArrayItem('debt', idx, 'name', e.target.value)} />
                  </div>
                  <div className="col-3">
                    <label className="form-label small text-muted">Amount ($)</label>
                    <input type="number" className="form-control" value={d.amount ?? ''} onChange={(e) => updateArrayItem('debt', idx, 'amount', Number(e.target.value))} />
                  </div>
                  <div className="col-3">
                    <label className="form-label small text-muted">Target Year</label>
                    <input type="month" className="form-control" value={d.start || ''} onChange={(e) => updateArrayItem('debt', idx, 'start', e.target.value)} />
                  </div>
                  <div className="col-2">
                    <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeArrayItem('debt', idx)}><i className="bi bi-trash"></i></button>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* 8. Windfalls & Inheritance */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
            <div className="d-flex align-items-center">
              <i className="bi bi-gift text-success fs-4 me-3"></i>
              <h5 className="mb-0 fw-bold text-uppercase ls-1 me-2">8. Windfalls & Inheritance</h5>
            </div>
            <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3" onClick={() => addArrayItem('windfalls', { name: 'New Windfall', amount: 50000, start: '2026-01', taxable: false, freq: 'one' })}>
              <i className="bi bi-plus-lg me-1"></i> Add Event
            </button>
          </div>
          <div className="card-body p-4">
             {data.windfalls.length === 0 && <div className="text-center text-muted small fst-italic">No windfalls added.</div>}
             {data.windfalls.map((w: any, idx: number) => (
                <div className="row g-3 mb-3 align-items-end" key={`wind_${idx}`}>
                  <div className="col-4">
                    <label className="form-label small text-muted">Event Name</label>
                    <input type="text" className="form-control" value={w.name || ''} onChange={(e) => updateArrayItem('windfalls', idx, 'name', e.target.value)} />
                  </div>
                  <div className="col-3">
                    <label className="form-label small text-muted">Amount ($)</label>
                    <input type="number" className="form-control" value={w.amount ?? ''} onChange={(e) => updateArrayItem('windfalls', idx, 'amount', Number(e.target.value))} />
                  </div>
                  <div className="col-3">
                    <label className="form-label small text-muted">Target Year</label>
                    <input type="month" className="form-control" value={w.start || ''} onChange={(e) => updateArrayItem('windfalls', idx, 'start', e.target.value)} />
                  </div>
                  <div className="col-2">
                    <button type="button" className="btn btn-outline-danger w-100" onClick={() => removeArrayItem('windfalls', idx)}><i className="bi bi-trash"></i></button>
                  </div>
                </div>
             ))}
          </div>
        </div>

        {/* 9. Government Benefits */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
              <i className="bi bi-bank text-primary fs-4 me-3"></i>
              <h5 className="mb-0 me-2 fw-bold text-uppercase ls-1">9. Government Benefits</h5>
          </div>
          <div className="card-body p-4">
            <div className="row g-4">
              <div className="col-12 col-md-6">
                <div className="p-4 border border-secondary rounded-3 h-100 surface-card">
                  <h6 className="text-info mb-4 fw-bold text-uppercase ls-1 pb-2 border-bottom border-secondary">Player 1 Benefits</h6>
                  
                  {/* CPP */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0 fw-bold fs-6 text-main">Canada Pension Plan (CPP)</label>
                      <div className="form-check form-switch min-h-0 mb-0">
                        <input className="form-check-input mt-0 fs-5" type="checkbox" role="switch" defaultChecked />
                      </div>
                    </div>
                    <div>
                      <label className="form-label small text-muted mb-2">Est. Payout at Age 65</label>
                      <div className="input-group input-group-sm mb-3">
                        <span className="input-group-text bg-input">$</span>
                        <input type="number" className="form-control" value={data.inputs.p1_cpp_est_base ?? ''} onChange={(e) => handleNumberChange('p1_cpp_est_base', e.target.value)} />
                        <span className="input-group-text bg-input">/yr</span>
                      </div>
                      <label className="form-label small text-muted mt-2 d-flex justify-content-between">
                        <span>Starts at Age: <span className="text-info fw-bold fs-6 ms-1">{data.inputs.p1_cpp_start || 65}</span></span>
                      </label>
                      <input type="range" className="form-range mt-1" min="60" max="70" value={data.inputs.p1_cpp_start || 65} onChange={(e) => handleNumberChange('p1_cpp_start', e.target.value)} />
                    </div>
                  </div>

                  {/* OAS */}
                  <div className="mb-4 pt-4 border-top border-secondary">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0 fw-bold fs-6 text-main">Old Age Security (OAS)</label>
                      <div className="form-check form-switch min-h-0 mb-0">
                        <input className="form-check-input mt-0 fs-5" type="checkbox" role="switch" defaultChecked />
                      </div>
                    </div>
                    <div>
                      <label className="form-label small text-muted mt-2 d-flex justify-content-between">
                        <span>Starts at Age: <span className="text-info fw-bold fs-6 ms-1">{data.inputs.p1_oas_start || 65}</span></span>
                      </label>
                      <input type="range" className="form-range mt-1" min="65" max="70" value={data.inputs.p1_oas_start || 65} onChange={(e) => handleNumberChange('p1_oas_start', e.target.value)} />
                    </div>
                  </div>

                  {/* DB Pension */}
                  <div className="mt-4 pt-4 border-top border-secondary">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <label className="form-label mb-0 fw-bold fs-6 text-main">Defined Benefit (DB) Pension</label>
                        <div className="form-check form-switch min-h-0 mb-0">
                          <input className="form-check-input mt-0 fs-5" type="checkbox" role="switch" checked={p1DbEnabled} onChange={e => setP1DbEnabled(e.target.checked)} />
                        </div>
                    </div>
                    {p1DbEnabled && (
                      <div className="mb-3 border-bottom border-secondary pb-3 mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                              <label className="form-label small fw-bold text-muted mb-0">Index to Inflation</label>
                              <div className="form-check form-switch mb-0"><input className="form-check-input mt-0" type="checkbox" role="switch" defaultChecked /></div>
                          </div>
                          <label className="form-label small fw-bold text-info mb-2">Lifetime Pension</label>
                          <div className="input-group input-group-sm mb-2">
                            <span className="input-group-text bg-input">$</span>
                            <input type="number" className="form-control" defaultValue="0" />
                            <span className="input-group-text bg-input">/mo</span>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="p-4 border border-secondary rounded-3 h-100 surface-card">
                  <h6 className="fw-bold text-uppercase ls-1 mb-4 pb-2 border-bottom border-secondary" style={{ color: 'var(--bs-purple)' }}>Player 2 Benefits</h6>
                  
                  {/* CPP */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0 fw-bold fs-6 text-main">Canada Pension Plan (CPP)</label>
                      <div className="form-check form-switch min-h-0 mb-0">
                        <input className="form-check-input mt-0 fs-5" type="checkbox" role="switch" defaultChecked />
                      </div>
                    </div>
                    <div>
                      <label className="form-label small text-muted mb-2">Est. Payout at Age 65</label>
                      <div className="input-group input-group-sm mb-3">
                        <span className="input-group-text bg-input">$</span>
                        <input type="number" className="form-control" value={data.inputs.p2_cpp_est_base ?? ''} onChange={(e) => handleNumberChange('p2_cpp_est_base', e.target.value)} />
                        <span className="input-group-text bg-input">/yr</span>
                      </div>
                      <label className="form-label small text-muted mt-2 d-flex justify-content-between">
                        <span>Starts at Age: <span className="fw-bold fs-6 ms-1" style={{ color: 'var(--bs-purple)' }}>{data.inputs.p2_cpp_start || 65}</span></span>
                      </label>
                      <input type="range" className="form-range mt-1" min="60" max="70" value={data.inputs.p2_cpp_start || 65} onChange={(e) => handleNumberChange('p2_cpp_start', e.target.value)} />
                    </div>
                  </div>

                  {/* OAS */}
                  <div className="mb-4 pt-4 border-top border-secondary">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <label className="form-label mb-0 fw-bold fs-6 text-main">Old Age Security (OAS)</label>
                      <div className="form-check form-switch min-h-0 mb-0">
                        <input className="form-check-input mt-0 fs-5" type="checkbox" role="switch" defaultChecked />
                      </div>
                    </div>
                    <div>
                      <label className="form-label small text-muted mt-2 d-flex justify-content-between">
                        <span>Starts at Age: <span className="fw-bold fs-6 ms-1" style={{ color: 'var(--bs-purple)' }}>{data.inputs.p2_oas_start || 65}</span></span>
                      </label>
                      <input type="range" className="form-range mt-1" min="65" max="70" value={data.inputs.p2_oas_start || 65} onChange={(e) => handleNumberChange('p2_oas_start', e.target.value)} />
                    </div>
                  </div>

                  {/* DB Pension */}
                  <div className="mt-4 pt-4 border-top border-secondary">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <label className="form-label mb-0 fw-bold fs-6 text-main">Defined Benefit (DB) Pension</label>
                        <div className="form-check form-switch min-h-0 mb-0">
                          <input className="form-check-input mt-0 fs-5" type="checkbox" role="switch" checked={p2DbEnabled} onChange={e => setP2DbEnabled(e.target.checked)} />
                        </div>
                    </div>
                    {p2DbEnabled && (
                      <div className="mb-3 border-bottom border-secondary pb-3 mt-3">
                          <div className="d-flex justify-content-between align-items-center mb-3">
                              <label className="form-label small fw-bold text-muted mb-0">Index to Inflation</label>
                              <div className="form-check form-switch mb-0"><input className="form-check-input mt-0" type="checkbox" role="switch" defaultChecked /></div>
                          </div>
                          <label className="form-label small fw-bold mb-2" style={{ color: 'var(--bs-purple)' }}>Lifetime Pension</label>
                          <div className="input-group input-group-sm mb-2">
                            <span className="input-group-text bg-input">$</span>
                            <input type="text" className="form-control" defaultValue="0" />
                            <span className="input-group-text bg-input">/mo</span>
                          </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 10. Economic Assumptions */}
        <div className="rp-card border border-secondary rounded-4 mb-4">
          <div className="card-header d-flex align-items-center surface-card border-bottom border-secondary p-3">
            <i className="bi bi-graph-up-arrow text-secondary fs-4 me-3"></i>
            <h5 className="mb-0 fw-bold text-uppercase ls-1">10. Economic Assumptions</h5>
          </div>
          <div className="card-body p-4">
            <div className="row">
              <div className="col-md-4">
                <label className="form-label fw-bold mb-2">Long-term Inflation Rate</label>
                <div className="input-group mb-2">
                  <input type="number" step="0.01" className="form-control" value={data.inputs.inflation_rate ?? ''} onChange={(e) => handleNumberChange('inflation_rate', e.target.value)} />
                  <span className="input-group-text bg-input">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}