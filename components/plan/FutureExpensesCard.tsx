import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput, MonthYearStepper } from '../SharedUI';

export default function FutureExpensesCard() {
  const { data, addArrayItem, updateArrayItem, removeArrayItem } = useFinance();

  return (
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
  );
}