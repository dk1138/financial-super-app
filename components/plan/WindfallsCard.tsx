import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, MonthYearStepper } from '../SharedUI';

export default function WindfallsCard() {
  const { data, addArrayItem, updateArrayItem, removeArrayItem } = useFinance();

  return (
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
  );
}