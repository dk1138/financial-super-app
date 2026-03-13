import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput, SegmentedControl, ModernDropdown } from '../SharedUI';

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

export default function PortfolioAssetsCard() {
  const { data, updateInput, updateMultipleInputs, addArrayItem, updateArrayItem, removeArrayItem } = useFinance();
  
  const isCouple = data.mode === 'Couple';
  const hasAutoAllocation = data.inputs.portfolio_allocation !== 'custom' && data.inputs.portfolio_allocation !== undefined;
  const showAssetMixUI = data.inputs.asset_mode_advanced ?? false;

  const [assetsOpen, setAssetsOpen] = useState(true);
  const [localAlloc, setLocalAlloc] = useState(data.inputs.portfolio_allocation || 'custom');
  const [localGlide, setLocalGlide] = useState(data.inputs.use_glide_path || false);

  useEffect(() => {
      setLocalAlloc(data.inputs.portfolio_allocation || 'custom');
      setLocalGlide(data.inputs.use_glide_path || false);
  }, [data.inputs.portfolio_allocation, data.inputs.use_glide_path]);

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

  const customP1Total = data.customAssets?.filter((a: any) => a.owner === 'p1').reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0) || 0;
  const customP2Total = data.customAssets?.filter((a: any) => a.owner === 'p2').reduce((sum: number, a: any) => sum + (Number(a.balance) || 0), 0) || 0;

  const p1Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p1_${acct.id}`]) || 0), 0) + (Number(data.inputs['p1_nonreg']) || 0) + (Number(data.inputs['p1_crypto']) || 0) + customP1Total;
  const p2Total = ACCOUNT_TYPES.reduce((sum, acct) => sum + (Number(data.inputs[`p2_${acct.id}`]) || 0), 0) + (Number(data.inputs['p2_nonreg']) || 0) + (Number(data.inputs['p2_crypto']) || 0) + customP2Total;
  const hhTotal = p1Total + (isCouple ? p2Total : 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
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
            <div className="col-12 col-xl-6" key={p}>
              <div className="card border-secondary surface-card shadow-none h-100">
                <div className="card-body p-3 p-md-4">
                  
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom border-secondary cursor-pointer user-select-none" onClick={() => setAssetsOpen(!assetsOpen)}>
                      <h6 className={`fw-bold text-uppercase ls-1 mb-0 ${isP1 ? 'text-info' : ''}`} style={!isP1 ? {color: 'var(--bs-purple)'} : {}}>{p.toUpperCase()} Asset Mix</h6>
                      <button type="button" className="btn btn-sm btn-link text-muted p-0"><i className={`bi bi-chevron-${assetsOpen ? 'up' : 'down'} fs-5`}></i></button>
                  </div>

                  {assetsOpen && (
                      <div className="d-flex flex-column gap-2 mb-2 transition-all">
                          
                          {/* Headers (Standard & Adv) */}
                          <div className="d-flex align-items-end gap-2 px-2 mb-1 text-muted fw-bold text-uppercase ls-1 w-100" style={{fontSize: '0.65rem'}}>
                              <div style={{flex: '0 0 135px'}} className="text-start">Account</div>
                              <div style={{flex: '1 1 0%', minWidth: '80px'}} className="text-start ps-1">Balance</div>
                              <div style={{flex: '0 0 75px'}} className="text-start ps-1">{showAssetMixUI ? 'Pre-Ret %' : 'Return %'}</div>
                              {showAssetMixUI && <div style={{flex: '0 0 75px'}} className="text-start ps-1 text-primary">Post-Ret %</div>}
                          </div>

                          {/* --- COMPACT STANDARD ACCOUNTS --- */}
                          {ACCOUNT_TYPES.map(acct => (
                              <div className="d-flex align-items-center gap-2 p-2 bg-input border border-secondary rounded-3 shadow-sm mb-1 w-100" key={`${p}_${acct.id}`}>
                                  <div className="d-flex justify-content-between align-items-center pe-1" style={{flex: '0 0 135px'}}>
                                      <div className="d-flex align-items-center gap-1">
                                          <i className={`bi ${acct.icon} fs-6 ${acct.color}`}></i>
                                          <span className="fw-bold text-main" style={{fontSize: '0.75rem'}}>{acct.label}</span>
                                      </div>
                                      <InfoBtn direction="up" title={acct.label} text={acct.tooltip} />
                                  </div>
                                  <div style={{flex: '1 1 0%', minWidth: '80px'}}>
                                      <CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct.id}`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct.id}`, val)} placeholder="$0" />
                                  </div>
                                  <div style={{flex: '0 0 75px'}}>
                                      <PercentInput disabled={hasAutoAllocation && acct.id !== 'cash'} className="form-control form-control-sm px-1" value={data.inputs[`${p}_${acct.id}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct.id}_ret`, val)} />
                                  </div>
                                  {showAssetMixUI && (
                                      <div style={{flex: '0 0 75px'}}>
                                          <PercentInput disabled={hasAutoAllocation && acct.id !== 'cash'} className="form-control form-control-sm px-1 border-primary text-primary" value={data.inputs[`${p}_${acct.id}_retire_ret`] ?? data.inputs[`${p}_${acct.id}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct.id}_retire_ret`, val)} />
                                      </div>
                                  )}
                              </div>
                          ))}
                          
                          {/* --- NON-REG & CRYPTO --- */}
                          {['nonreg', 'crypto'].map(acct => (
                              <div className="d-flex flex-column p-2 bg-input border border-secondary rounded-3 shadow-sm mb-1 mt-2 w-100" key={`${p}_adv_${acct}`}>
                                  <div className="d-flex align-items-center gap-2 w-100">
                                      <div className="d-flex justify-content-between align-items-center pe-1" style={{flex: '0 0 135px'}}>
                                          <div className="d-flex align-items-center gap-1">
                                              <i className={`bi ${acct === 'crypto' ? 'bi-currency-bitcoin text-primary' : 'bi-graph-up-arrow text-secondary'} fs-6`}></i>
                                              <span className="fw-bold text-main" style={{fontSize: '0.75rem'}}>{acct === 'crypto' ? 'Crypto' : 'Non-Reg'}</span>
                                          </div>
                                          <InfoBtn direction="up" title={acct === 'crypto' ? 'Crypto' : 'Non-Reg'} text={acct === 'nonreg' ? 'Taxable Account. Capital gains taxed at 50% inclusion.' : 'Capital Asset. Gains subject to Capital Gains Tax when sold.'} />
                                      </div>
                                      <div style={{flex: '1 1 0%', minWidth: '80px'}}>
                                          <CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct}`, val)} placeholder="$0" />
                                      </div>
                                      <div style={{flex: '0 0 75px'}}>
                                          <PercentInput disabled={hasAutoAllocation} className="form-control form-control-sm px-1" value={data.inputs[`${p}_${acct}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct}_ret`, val)} />
                                      </div>
                                      {showAssetMixUI && (
                                          <div style={{flex: '0 0 75px'}}>
                                              <PercentInput disabled={hasAutoAllocation} className="form-control form-control-sm px-1 border-primary text-primary" value={data.inputs[`${p}_${acct}_retire_ret`] ?? data.inputs[`${p}_${acct}_ret`]} onChange={(val: any) => handleManualReturnChange(`${p}_${acct}_retire_ret`, val)} />
                                          </div>
                                      )}
                                  </div>
                                  <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25 w-100">
                                      <div className="d-flex justify-content-end align-items-center pe-1" style={{flex: '0 0 135px'}}>
                                          <span className="small fw-bold text-muted text-uppercase ls-1 me-1" style={{fontSize: '0.65rem'}}>ACB</span>
                                          <InfoBtn direction="up" title="Adjusted Cost Base (ACB)" text="The total capital you've contributed to this account." />
                                      </div>
                                      <div style={{flex: '1 1 0%', minWidth: '80px'}}>
                                          <CurrencyInput className="form-control form-control-sm" value={data.inputs[`${p}_${acct}_acb`] ?? ''} onChange={(val: any) => updateInput(`${p}_${acct}_acb`, val)} placeholder="$0" />
                                      </div>
                                      <div style={{flex: '0 0 75px'}} className="position-relative">
                                          <span className="position-absolute text-muted small fw-bold text-uppercase ls-1" style={{left: '-30px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem'}}>Yld</span>
                                          <PercentInput disabled={hasAutoAllocation && acct !== 'crypto'} className="form-control form-control-sm px-1" value={data.inputs[`${p}_${acct}_yield`]} onChange={(val: any) => updateInput(`${p}_${acct}_yield`, val)} placeholder="Yield" />
                                      </div>
                                      {showAssetMixUI && <div style={{flex: '0 0 75px'}}></div>}
                                  </div>
                              </div>
                          ))}

                          {/* --- CUSTOM ACCOUNTS --- */}
                          <div className="mt-3 pt-3 border-top border-secondary">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                  <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-0">Additional Accounts</h6>
                                  <button type="button" className={`btn btn-sm rounded-pill px-3 py-1 fw-bold btn-outline-${isP1 ? 'info' : 'primary'}`} style={!isP1 ? {color:'var(--bs-purple)', borderColor:'var(--bs-purple)'} : {}} onClick={() => addArrayItem('customAssets', { owner: p, name: '', type: 'tfsa', balance: 0, rate: 6.0, retireRate: 6.0, acb: 0 })}>
                                      <i className="bi bi-plus-lg me-1"></i> Add Account
                                  </button>
                              </div>
                              
                              {playerCustomAssets.length === 0 && (
                                  <div className="text-center small text-muted fst-italic py-2">No additional accounts added.</div>
                              )}
                              
                              {playerCustomAssets.length > 0 && (
                                  <>
                                      <div className="d-flex align-items-end gap-2 px-2 mb-1 text-muted fw-bold text-uppercase ls-1 w-100 mt-2" style={{fontSize: '0.65rem'}}>
                                          <div style={{flex: '0 0 24px'}}></div>
                                          <div style={{flex: '0 0 130px'}} className="text-start">Type</div>
                                          <div style={{flex: '1 1 0%', minWidth: '60px'}} className="text-start ps-1">Name</div>
                                          <div style={{flex: '1 1 0%', minWidth: '80px'}} className="text-start ps-1">Balance</div>
                                          <div style={{flex: '0 0 75px'}} className="text-start ps-1">{showAssetMixUI ? 'Pre-Ret %' : 'Return %'}</div>
                                          {showAssetMixUI && <div style={{flex: '0 0 75px'}} className="text-start ps-1 text-primary">Post-Ret %</div>}
                                      </div>

                                      {playerCustomAssets.map((ca: any) => {
                                          const globalIdx = data.customAssets.indexOf(ca);
                                          const updateCa = (field: string, val: any) => updateArrayItem('customAssets', globalIdx, field, val);
                                          const isNonReg = ca.type === 'nonreg' || ca.type === 'crypto';

                                          return (
                                              <div className="d-flex flex-column p-2 bg-input border border-secondary rounded-3 shadow-sm mb-2 w-100" key={`ca_${globalIdx}`}>
                                                  <div className="d-flex align-items-center gap-2 w-100">
                                                      <div style={{flex: '0 0 24px'}} className="text-center">
                                                          <button type="button" className="btn btn-sm btn-link text-danger p-0 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('customAssets', globalIdx)}>
                                                              <i className="bi bi-x-lg" style={{fontSize: '0.9rem'}}></i>
                                                          </button>
                                                      </div>
                                                      <div style={{flex: '0 0 130px'}}>
                                                          <ModernDropdown value={ca.type || 'tfsa'} onChange={val => updateCa('type', val)} options={EXTENDED_ACCOUNT_TYPES} />
                                                      </div>
                                                      <div style={{flex: '1 1 0%', minWidth: '60px'}}>
                                                          <input type="text" maxLength={20} className="w-100 form-control form-control-sm px-2 text-start shadow-sm border border-secondary bg-black bg-opacity-25 text-main" style={{fontWeight: '600', height: '31px'}} value={ca.name || ''} onChange={(e) => updateCa('name', e.target.value)} placeholder="Name" />
                                                      </div>
                                                      <div style={{flex: '1 1 0%', minWidth: '80px'}}>
                                                          <CurrencyInput className="form-control form-control-sm" value={ca.balance ?? ''} onChange={(val: any) => updateCa('balance', val)} placeholder="$0" />
                                                      </div>
                                                      <div style={{flex: '0 0 75px'}}>
                                                          <PercentInput disabled={hasAutoAllocation && ca.type !== 'cash'} className="form-control form-control-sm px-1" value={ca.rate} onChange={(val: any) => updateCa('rate', val)} />
                                                      </div>
                                                      {showAssetMixUI && (
                                                          <div style={{flex: '0 0 75px'}}>
                                                              <PercentInput disabled={hasAutoAllocation && ca.type !== 'cash'} className="form-control form-control-sm px-1 border-primary text-primary" value={ca.retireRate ?? ca.rate} onChange={(val: any) => updateCa('retireRate', val)} />
                                                          </div>
                                                      )}
                                                  </div>

                                                  {isNonReg && (
                                                      <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25 w-100">
                                                          <div style={{flex: '0 0 24px'}}></div>
                                                          <div style={{flex: '0 0 130px'}}></div>
                                                          <div style={{flex: '1 1 0%', minWidth: '60px'}} className="d-flex justify-content-end align-items-center pe-1">
                                                              <span className="small fw-bold text-muted text-uppercase ls-1 me-1" style={{fontSize: '0.65rem'}}>ACB</span>
                                                              <InfoBtn direction="up" title="Adjusted Cost Base (ACB)" text="The total capital you've contributed to this account." />
                                                          </div>
                                                          <div style={{flex: '1 1 0%', minWidth: '80px'}}>
                                                              <CurrencyInput className="form-control form-control-sm" value={ca.acb ?? ''} onChange={(val: any) => updateCa('acb', val)} placeholder="$0" />
                                                          </div>
                                                          <div style={{flex: '0 0 75px'}} className="position-relative">
                                                              <span className="position-absolute text-muted small fw-bold text-uppercase ls-1" style={{left: '-30px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem'}}>Yld</span>
                                                              <PercentInput disabled={hasAutoAllocation && ca.type !== 'crypto'} className="form-control form-control-sm px-1" value={ca.yield ?? ''} onChange={(val: any) => updateCa('yield', val)} placeholder="Yield" />
                                                          </div>
                                                          {showAssetMixUI && <div style={{flex: '0 0 75px'}}></div>}
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })}
                                  </>
                              )}
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
  );
}