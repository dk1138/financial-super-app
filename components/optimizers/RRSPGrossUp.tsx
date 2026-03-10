import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn } from '../SharedUI';

export default function RRSPGrossUp() {
    const { data, results } = useFinance();
    const isCouple = data.mode === 'Couple';
    
    const [grossUpTab, setGrossUpTab] = useState<'p1'|'p2'>('p1');
    const [grossUpCash, setGrossUpCash] = useState<number>(5000);

    const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate || 0.30;
    const p2Marginal = results?.timeline?.[0]?.taxDetailsP2?.margRate || 0.30;
    
    const activeMargRate = grossUpTab === 'p1' ? p1Marginal : p2Marginal;
    
    const grossedUpAmount = grossUpCash / (1 - activeMargRate);
    const loanAmount = grossedUpAmount - grossUpCash;
    const expectedRefund = grossedUpAmount * activeMargRate;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-piggy-bank-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">RRSP Gross-Up</h5>
            </div>
            <p className="text-muted small mb-4">Calculate how to maximize your RRSP using a short-term loan that is completely paid off by the resulting tax refund.</p>

            {isCouple && (
                <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                    <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${grossUpTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setGrossUpTab('p1')}>Player 1</button>
                    <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${grossUpTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setGrossUpTab('p2')}>Player 2</button>
                </div>
            )}

            <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <label className="fw-bold text-muted small">Cash on Hand:</label>
                    <div className="input-group input-group-sm w-50 shadow-sm">
                        <span className="input-group-text bg-secondary border-secondary text-white">$</span>
                        <input type="number" className="form-control bg-dark border-secondary text-white text-end fw-bold" value={grossUpCash} onChange={(e) => setGrossUpCash(Number(e.target.value) || 0)} />
                    </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-bold small">1. Borrow Short-Term Loan</span>
                    <span className="fw-bold text-danger">+{formatCurrency(loanAmount)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                    <span className="text-muted fw-bold small">2. Total RRSP Contribution</span>
                    <span className="fw-bold text-main">{formatCurrency(grossedUpAmount)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                    <span className="text-muted fw-bold small">3. Resulting Tax Refund</span>
                    <span className="fw-bold text-success">+{formatCurrency(expectedRefund)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted fw-bold small">4. Pay Off Loan</span>
                    <span className="fw-bold text-danger">-{formatCurrency(loanAmount)}</span>
                </div>
                
                <span className="small text-muted text-center fst-italic mt-4"><i className="bi bi-info-circle me-1"></i> Based on your current {(activeMargRate * 100).toFixed(1)}% marginal rate.</span>
            </div>
        </div>
    );
}