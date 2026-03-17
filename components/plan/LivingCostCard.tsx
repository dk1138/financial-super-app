import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput, StepperInput, SegmentedControl } from '../SharedUI';

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

export default function LivingCostCard() {
  const { data, updateInput, updateArrayItem, addArrayItem, removeArrayItem } = useFinance();

  const currentMode = data.inputs.housing_mode || 'own';
  const transitions = data.housingTransitions || [];
  const rentals = data.properties || []; // Now strictly used for Investment/Rental properties

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
        <div className="d-flex align-items-center">
            <i className="bi bi-house-heart text-danger fs-4 me-3"></i>
            <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                4. Housing & Living Costs
                <InfoBtn title="Housing Timeline" text="Map out your entire housing journey.<br><br>Start with your <b>Current Situation</b>. Then, add <b>Future Phases</b> to automatically simulate selling your home to downsize, moving into a rental, or transitioning to Long-Term Care (LTC) later in life.<br><br>Any net cash from selling a home will automatically flow into your portfolio." />
            </h5>
        </div>
      </div>
      <div className="card-body p-3 p-md-4">
        
        {/* --- SECTION 1: CURRENT SITUATION --- */}
        <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-3"><i className="bi bi-geo-alt-fill text-primary me-2"></i>Current Primary Residence</h6>
        <div className="p-0 border border-secondary rounded-4 mb-5 shadow-sm overflow-hidden">
            <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-3 d-flex flex-column align-items-center">
                <div style={{ maxWidth: '400px', width: '100%' }}>
                    <SegmentedControl 
                        value={currentMode} 
                        onChange={(val: any) => updateInput('housing_mode', val)} 
                        options={[
                            { value: 'own', label: 'Own Home' },
                            { value: 'rent', label: 'Renting' },
                            { value: 'free', label: 'No Cost' }
                        ]} 
                    />
                </div>
            </div>

            <div className="p-4 bg-input">
                {currentMode === 'own' && (
                    <div className="row g-4">
                        <div className="col-12 col-xl-5 border-end-xl border-secondary pe-xl-4">
                            <h6 className="fw-bold text-success small text-uppercase ls-1 mb-3">Property Value</h6>
                            <div className="row g-3">
                                <div className="col-sm-7">
                                    <label className="form-label small text-muted mb-1">Current Value ($)</label>
                                    <CurrencyInput className="form-control border-secondary" value={data.inputs.primary_value ?? 800000} onChange={(val: any) => updateInput('primary_value', val)} />
                                </div>
                                <div className="col-sm-5">
                                    <label className="form-label small text-muted mb-1">Growth (%)</label>
                                    <PercentInput className="form-control border-secondary" value={data.inputs.primary_growth ?? 3.0} onChange={(val: any) => updateInput('primary_growth', val)} />
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-xl-7 ps-xl-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="fw-bold text-danger small text-uppercase ls-1 mb-0">Mortgage Details</h6>
                                {(data.inputs.primary_mortgage > 0) && (data.inputs.primary_rate > 0) && (
                                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 fw-bold" style={{fontSize: '0.7rem'}} onClick={() => updateInput('primary_payment', Math.round(calc25YearPayment(data.inputs.primary_mortgage, data.inputs.primary_rate)))}>
                                        <i className="bi bi-magic me-1 text-primary"></i> Auto 25-Yr
                                    </button>
                                )}
                            </div>
                            <div className="row g-3">
                                <div className="col-sm-4">
                                    <label className="form-label small text-muted mb-1">Balance ($)</label>
                                    <CurrencyInput className="form-control border-secondary" value={data.inputs.primary_mortgage ?? 400000} onChange={(val: any) => updateInput('primary_mortgage', val)} />
                                </div>
                                <div className="col-sm-4">
                                    <label className="form-label small text-muted mb-1">Int. Rate (%)</label>
                                    <PercentInput className="form-control border-secondary" value={data.inputs.primary_rate ?? 4.0} onChange={(val: any) => updateInput('primary_rate', val)} />
                                </div>
                                <div className="col-sm-4">
                                    <label className="form-label small text-muted mb-1">Payment /mo ($)</label>
                                    <CurrencyInput className="form-control border-secondary" value={data.inputs.primary_payment ?? 2000} onChange={(val: any) => updateInput('primary_payment', val)} />
                                    <div className="text-info fw-bold mt-1 text-end text-nowrap" style={{fontSize: '0.7rem', height: '14px', letterSpacing: '-0.2px'}}>
                                        {data.inputs.primary_mortgage > 0 && data.inputs.primary_payment > 0 ? `Payoff: ${calcAmortization(data.inputs.primary_mortgage, data.inputs.primary_rate, data.inputs.primary_payment)}` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentMode === 'rent' && (
                    <div className="row justify-content-center">
                        <div className="col-12 col-md-6 col-lg-4 text-center py-3">
                            <label className="form-label small text-muted fw-bold mb-2">Current Monthly Rent ($)</label>
                            <CurrencyInput className="form-control form-control-lg text-center border-primary border-opacity-50 text-main fw-bold shadow-sm" value={data.inputs.primary_rent ?? 2500} onChange={(val: any) => updateInput('primary_rent', val)} />
                            <div className="small text-muted mt-2 fst-italic">This amount will be inflated automatically over time.</div>
                        </div>
                    </div>
                )}

                {currentMode === 'free' && (
                    <div className="text-center py-4">
                        <i className="bi bi-emoji-sunglasses text-success fs-1 mb-2 d-block opacity-75"></i>
                        <h6 className="fw-bold text-main">Living Rent-Free!</h6>
                        <span className="text-muted small">You currently have no primary housing expenses dragging down your cash flow.</span>
                    </div>
                )}
            </div>
        </div>

        {/* --- SECTION 2: FUTURE HOUSING PHASES --- */}
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-0"><i className="bi bi-fast-forward-circle-fill text-info me-2"></i>Future Housing Phases</h6>
            <button type="button" className="btn btn-sm btn-info fw-bold rounded-pill px-3 py-1 text-dark" onClick={() => addArrayItem('housingTransitions', { age: data.inputs.p1_retireAge || 65, action: 'downsize', price: 500000, mortgage: 0, rent: 0 })}>
                <i className="bi bi-plus-lg me-1"></i> Add Phase
            </button>
        </div>
        
        {transitions.length === 0 ? (
            <div className="border border-secondary rounded-4 bg-input p-4 text-center mb-5 border-opacity-50 border-dashed">
                <span className="text-muted small fst-italic">No future housing changes planned. You will stay in your current living situation indefinitely.</span>
            </div>
        ) : (
            <div className="d-flex flex-column gap-3 mb-5 border-start border-4 border-info ps-3 ms-2">
                {transitions.map((phase: any, idx: number) => (
                    <div className="border border-secondary rounded-4 bg-input p-3 position-relative shadow-sm" key={`phase_${idx}`}>
                        <button type="button" className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 mt-2 me-2 p-0 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('housingTransitions', idx)}>
                            <i className="bi bi-x-lg fs-5"></i>
                        </button>
                        
                        <div className="row g-3 align-items-center mb-3">
                            <div className="col-12 col-sm-auto d-flex align-items-center gap-2">
                                <span className="fw-bold text-muted small text-uppercase">At P1 Age</span>
                                <div style={{width: '100px'}}>
                                    <StepperInput min={18} max={120} value={phase.age || 65} onChange={(val: any) => updateArrayItem('housingTransitions', idx, 'age', val)} />
                                </div>
                            </div>
                            <div className="col-12 col-sm-auto d-flex align-items-center gap-2">
                                <span className="fw-bold text-muted small text-uppercase">I plan to</span>
                                <select className="form-select form-select-sm bg-secondary bg-opacity-10 border-secondary fw-bold text-main shadow-none w-auto" value={phase.action} onChange={(e) => updateArrayItem('housingTransitions', idx, 'action', e.target.value)}>
                                    {currentMode === 'own' && <option value="downsize">Sell current home & Buy a new home</option>}
                                    {currentMode === 'own' && <option value="rent">Sell current home & Start Renting</option>}
                                    {currentMode === 'own' && <option value="ltc">Sell current home & Move to Long-Term Care (LTC)</option>}
                                    {currentMode !== 'own' && <option value="buy">Stop Renting & Buy a Home</option>}
                                    {currentMode !== 'own' && <option value="rent">Change Rental / Move to LTC</option>}
                                </select>
                            </div>
                        </div>

                        <div className="p-3 bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-50">
                            {/* IF BUYING A HOME */}
                            {(phase.action === 'downsize' || phase.action === 'buy') && (
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small text-muted fw-bold mb-1">New Home Target Price (Today's $)</label>
                                        <CurrencyInput className="form-control border-secondary" value={phase.price ?? 500000} onChange={(val: any) => updateArrayItem('housingTransitions', idx, 'price', val)} />
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small text-muted fw-bold mb-1">Planned New Mortgage (Today's $)</label>
                                        <CurrencyInput className="form-control border-secondary" value={phase.mortgage ?? 0} onChange={(val: any) => updateArrayItem('housingTransitions', idx, 'mortgage', val)} />
                                    </div>
                                </div>
                            )}

                            {/* IF RENTING OR LTC */}
                            {(phase.action === 'rent' || phase.action === 'ltc') && (
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label small text-muted fw-bold mb-1">Monthly Cost (Today's $)</label>
                                        <CurrencyInput className="form-control border-secondary text-primary fw-bold" value={phase.rent ?? 4000} onChange={(val: any) => updateArrayItem('housingTransitions', idx, 'rent', val)} />
                                    </div>
                                    <div className="col-12 col-md-6 d-flex align-items-center">
                                        <span className="small text-muted fst-italic mt-md-4">
                                            {currentMode === 'own' ? "Net cash from your home sale will be added to your portfolio to help fund this cost." : "This new amount will override your previous rent."}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}


        {/* --- SECTION 3: INVESTMENT / RENTAL PROPERTIES --- */}
        <hr className="border-secondary opacity-50 mb-4" />
        
        <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-0"><i className="bi bi-building-up text-success me-2"></i>Investment & Rental Properties</h6>
            <button type="button" className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 fw-bold" onClick={() => addArrayItem('properties', { name: `Rental Property`, value: 600000, mortgage: 300000, rate: 4.5, payment: 1700, growth: 3.0, rentalIncome: 2500, includeInNW: true, sellEnabled: false })}>
                <i className="bi bi-plus-lg me-1"></i> Add Property
            </button>
        </div>

        {rentals.length === 0 ? (
            <div className="text-center text-muted small fst-italic">No investment properties added.</div>
        ) : (
            <div className="row g-4">
                {rentals.map((prop: any, idx: number) => (
                    <div className="col-12 col-xl-6" key={`rental_${idx}`}>
                        <div className="p-0 border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column">
                            
                            <div className="bg-success bg-opacity-10 border-bottom border-secondary p-3 d-flex justify-content-between align-items-center rounded-top-4">
                                <div className="d-flex align-items-center gap-3 w-75">
                                    <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '36px', height: '36px'}}>
                                        <i className="bi bi-building-fill"></i>
                                    </div>
                                    <input type="text" maxLength={50} className="form-control bg-transparent border-0 text-main fw-bold px-0 shadow-none" value={prop.name || ''} onChange={(e) => updateArrayItem('properties', idx, 'name', e.target.value)} placeholder="Property Name" />
                                </div>
                                <button type="button" className="btn btn-sm btn-link text-danger p-0 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('properties', idx)}><i className="bi bi-x-lg fs-5"></i></button>
                            </div>

                            <div className="p-3 bg-input flex-grow-1">
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small text-muted fw-bold mb-1">Value ($)</label>
                                        <CurrencyInput className="form-control form-control-sm border-secondary" value={prop.value ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'value', val)} />
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small text-muted fw-bold mb-1">Growth (%)</label>
                                        <PercentInput className="form-control form-control-sm border-secondary" value={prop.growth} onChange={(val: any) => updateArrayItem('properties', idx, 'growth', val)} />
                                    </div>
                                </div>

                                <div className="p-2 bg-secondary bg-opacity-10 rounded-3 border border-secondary border-opacity-50 mb-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="small text-danger fw-bold text-uppercase ls-1">Mortgage</span>
                                        {prop.mortgage > 0 && prop.rate > 0 && (
                                            <button type="button" className="btn btn-sm btn-link text-primary p-0 text-decoration-none fw-bold" style={{fontSize: '0.7rem'}} onClick={() => updateArrayItem('properties', idx, 'payment', Math.round(calc25YearPayment(prop.mortgage, prop.rate)))}>
                                                Auto 25-Yr
                                            </button>
                                        )}
                                    </div>
                                    <div className="row g-2">
                                        <div className="col-4">
                                            <CurrencyInput className="form-control form-control-sm border-secondary" value={prop.mortgage ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'mortgage', val)} placeholder="Bal" />
                                        </div>
                                        <div className="col-4">
                                            <PercentInput className="form-control form-control-sm border-secondary" value={prop.rate} onChange={(val: any) => updateArrayItem('properties', idx, 'rate', val)} placeholder="Rate" />
                                        </div>
                                        <div className="col-4">
                                            <CurrencyInput className="form-control form-control-sm border-secondary" value={prop.payment ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'payment', val)} placeholder="/mo" />
                                        </div>
                                    </div>
                                </div>

                                <div className="d-flex align-items-center justify-content-between p-2 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-25 mb-3">
                                    <span className="small text-success fw-bold text-uppercase ls-1">Gross Rent Income/mo</span>
                                    <div style={{maxWidth: '120px'}}>
                                        <CurrencyInput className="form-control form-control-sm border-success text-success fw-bold" value={prop.rentalIncome ?? ''} onChange={(val: any) => updateArrayItem('properties', idx, 'rentalIncome', val)} />
                                    </div>
                                </div>
                                
                                <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-2 mt-auto">
                                    <div className="form-check form-switch mb-0 d-flex align-items-center p-0">
                                        <label className="form-check-label small fw-bold text-muted cursor-pointer me-5" style={{fontSize: '0.75rem'}}>Sell in Future?</label>
                                        <input className="form-check-input mt-0 cursor-pointer" type="checkbox" checked={prop.sellEnabled ?? false} onChange={(e) => updateArrayItem('properties', idx, 'sellEnabled', e.target.checked)} />
                                    </div>
                                    {prop.sellEnabled && (
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="small text-muted fw-bold">Age</span>
                                            <div style={{width: '80px'}}>
                                                <StepperInput min={18} max={120} value={prop.sellAge ?? (data.inputs.p1_retireAge || 60)} onChange={(val: any) => updateArrayItem('properties', idx, 'sellAge', val)} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}