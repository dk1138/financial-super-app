import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput, StepperInput } from '../SharedUI';

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

export default function RealEstateCard() {
  const { data, updateArrayItem, addArrayItem, removeArrayItem } = useFinance();

  return (
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
            <div className="p-0 border border-secondary rounded-4 mb-4 shadow-sm" key={`prop_${idx}`}>
                
                <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-3 d-flex justify-content-between align-items-center rounded-top-4">
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

                <div className="p-4 bg-input rounded-bottom-4">
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
  );
}