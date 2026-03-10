import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, MonthYearStepper, CurrencyInput } from '../SharedUI';

export default function DependentsCard() {
  const { data, addArrayItem, updateArrayItem, removeArrayItem } = useFinance();

  return (
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
                    <div className="d-flex flex-column p-3 border border-secondary rounded-4 bg-secondary bg-opacity-10 shadow-sm h-100 gap-3">
                        <div className="d-flex align-items-center justify-content-between gap-3">
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

                        <div className="d-flex align-items-center justify-content-between mt-1 pt-3 border-top border-secondary border-opacity-25">
                            <div className="form-check form-switch mb-0">
                                <input className="form-check-input mt-1 cursor-pointer" type="checkbox" checked={dep.hasEdu || false} onChange={(e) => updateArrayItem('dependents', index, 'hasEdu', e.target.checked)} />
                                <label className="form-check-label small fw-bold text-muted ms-1 cursor-pointer">Plan for Post-Secondary</label>
                            </div>
                        </div>

                        {dep.hasEdu && (
                            <div className="row g-2 mt-0">
                                <div className="col-12 col-md-4">
                                    <label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.7rem'}}>Cost / Year ($)</label>
                                    <CurrencyInput className="form-control form-control-sm" value={dep.eduCost ?? 15000} onChange={(val: any) => updateArrayItem('dependents', index, 'eduCost', val)} placeholder="15000" />
                                </div>
                                <div className="col-6 col-md-4">
                                    <label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.7rem'}}>Start Age</label>
                                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={dep.eduStart ?? 18} onChange={e => updateArrayItem('dependents', index, 'eduStart', parseInt(e.target.value)||0)} />
                                </div>
                                <div className="col-6 col-md-4">
                                    <label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.7rem'}}>Duration (Yrs)</label>
                                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={dep.eduDuration ?? 4} onChange={e => updateArrayItem('dependents', index, 'eduDuration', parseInt(e.target.value)||0)} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}