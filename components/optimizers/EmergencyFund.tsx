import React, { useState } from 'react';
import { CurrencyInput } from '../SharedUI';

export default function EmergencyFund() {
    const [emMonthlyExp, setEmMonthlyExp] = useState(5000);
    const [emMonthsToHire, setEmMonthsToHire] = useState(6);
    const [emEiEligible, setEmEiEligible] = useState(true);
    const [emSeverance, setEmSeverance] = useState(1);

    const emEiWeekly = 668; 
    const emEiMonthly = (emEiWeekly * 52) / 12;
    const emTotalNeeded = emMonthlyExp * emMonthsToHire;
    const emSeveranceCash = emMonthlyExp * emSeverance;
    const emEiCash = emEiEligible ? Math.max(0, (emMonthsToHire - emSeverance - 0.5)) * emEiMonthly : 0; 
    const emCashRequired = Math.max(0, emTotalNeeded - emSeveranceCash - emEiCash);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-life-preserver fs-4"></i>
                </div>
                <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Emergency Fund Sizer</h5>
            </div>
            <p className="text-muted small mb-4">Factor in Employment Insurance (EI) and Severance to calculate exactly how much cash you actually need to hoard.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Monthly Core Expenses</label>
                    <CurrencyInput className="form-control form-control-sm" value={emMonthlyExp} onChange={setEmMonthlyExp} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Mos to find job</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={emMonthsToHire} onChange={e => setEmMonthsToHire(parseInt(e.target.value)||0)} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Est. Severance (Mos)</label>
                    <input type="number" step="0.5" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={emSeverance} onChange={e => setEmSeverance(parseFloat(e.target.value)||0)} />
                </div>
                <div className="col-12">
                    <div className="form-check form-switch d-flex align-items-center ps-0 mt-1">
                        <input className="form-check-input cursor-pointer ms-0 me-2" type="checkbox" checked={emEiEligible} onChange={e => setEmEiEligible(e.target.checked)} />
                        <label className="form-check-label small fw-bold text-muted mt-1">Eligible for Max EI ($668/wk)</label>
                    </div>
                </div>
            </div>

            <div className="bg-info bg-opacity-10 border border-info border-opacity-50 rounded-4 p-3 mt-auto text-center shadow-inner">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-bold small">Total Cash Needed</span>
                    <span className="fw-bold text-main">{formatCurrency(emTotalNeeded)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-1 text-success small">
                    <span>- Severance Payout</span>
                    <span>-{formatCurrency(emSeveranceCash)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 text-success small pb-2 border-bottom border-info border-opacity-25">
                    <span>- Est. EI Payouts</span>
                    <span>-{formatCurrency(emEiCash)}</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="text-info fw-bolder text-uppercase ls-1 small">Actual Cash Needed</span>
                    <span className="fw-bolder fs-4 text-info">{formatCurrency(emCashRequired)}</span>
                </div>
            </div>
        </div>
    );
}