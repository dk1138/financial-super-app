import React, { useState } from 'react';
import { CurrencyInput } from '../SharedUI';

export default function CarLease() {
    const [carLeaseMo, setCarLeaseMo] = useState(550);
    const [carLeaseDown, setCarLeaseDown] = useState(3000);
    const [carLeaseBuyout, setCarLeaseBuyout] = useState(20000);
    const [carFinanceMo, setCarFinanceMo] = useState(700);
    const [carFinanceDown, setCarFinanceDown] = useState(5000);
    const [carTerm, setCarTerm] = useState(48);

    const totalLeaseToOwn = carLeaseDown + (carLeaseMo * carTerm) + carLeaseBuyout;
    const totalFinance = carFinanceDown + (carFinanceMo * carTerm);
    const carDiff = totalLeaseToOwn - totalFinance;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-car-front-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-secondary mb-0 text-uppercase ls-1">Buy vs Lease Car</h5>
            </div>
            <p className="text-muted small mb-3">Calculate the true Total Cost of Ownership (TCO) at the end of the term.</p>
            
            <div className="row g-3 mb-3 flex-grow-1">
                <div className="col-6">
                    <div className="p-3 h-100 border border-info rounded-4 bg-info bg-opacity-10 shadow-sm d-flex flex-column gap-2">
                        <h6 className="fw-bold text-info small text-uppercase ls-1 mb-2 text-center">Lease to Own</h6>
                        <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Down Pmt</label><CurrencyInput className="form-control form-control-sm" value={carLeaseDown} onChange={setCarLeaseDown} /></div>
                        <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Monthly</label><CurrencyInput className="form-control form-control-sm" value={carLeaseMo} onChange={setCarLeaseMo} /></div>
                        <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Residual</label><CurrencyInput className="form-control form-control-sm" value={carLeaseBuyout} onChange={setCarLeaseBuyout} /></div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="p-3 h-100 border border-warning rounded-4 bg-warning bg-opacity-10 shadow-sm d-flex flex-column gap-2">
                        <h6 className="fw-bold text-warning small text-uppercase ls-1 mb-2 text-center">Finance</h6>
                        <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Down Pmt</label><CurrencyInput className="form-control form-control-sm" value={carFinanceDown} onChange={setCarFinanceDown} /></div>
                        <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Monthly</label><CurrencyInput className="form-control form-control-sm" value={carFinanceMo} onChange={setCarFinanceMo} /></div>
                        <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Term (Mos)</label><input type="number" className="form-control form-control-sm text-center fw-bold bg-input border-secondary" value={carTerm} onChange={e => setCarTerm(parseInt(e.target.value)||0)} /></div>
                    </div>
                </div>
            </div>

            <div className="row g-2 text-center mt-auto">
                <div className="col-6">
                    <div className={`p-2 rounded-4 border shadow-inner ${carDiff > 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-info bg-opacity-25 border-info'}`}>
                        <div className="text-muted fw-bold text-uppercase ls-1 mb-1" style={{fontSize:'0.65rem'}}>TCO (Lease)</div>
                        <div className="fs-5 fw-bold text-main">{formatCurrency(totalLeaseToOwn)}</div>
                    </div>
                </div>
                <div className="col-6">
                    <div className={`p-2 rounded-4 border shadow-inner ${carDiff < 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-warning bg-opacity-25 border-warning'}`}>
                        <div className="text-muted fw-bold text-uppercase ls-1 mb-1" style={{fontSize:'0.65rem'}}>TCO (Finance)</div>
                        <div className="fs-5 fw-bold text-main">{formatCurrency(totalFinance)}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}