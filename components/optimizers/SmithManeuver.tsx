import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput, PercentInput } from '../SharedUI';

export default function SmithManeuver() {
    const { results } = useFinance();
    const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate * 100 || 30;

    const [smLoan, setSmLoan] = useState(100000);
    const [smHelocRate, setSmHelocRate] = useState(7.2);
    const [smInvestReturn, setSmInvestReturn] = useState(8.0);
    const [smTaxRate, setSmTaxRate] = useState(p1Marginal);

    const smEffectiveBorrowingRate = smHelocRate * (1 - (smTaxRate / 100));
    const smSpread = smInvestReturn - smEffectiveBorrowingRate;
    const smAnnualProfit = smLoan * (smSpread / 100);

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-arrow-repeat fs-4"></i>
                </div>
                <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Smith Maneuver</h5>
            </div>
            <p className="text-muted small mb-4">Calculate the arbitrage of converting your non-deductible mortgage into a tax-deductible investment loan.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">HELOC Amount to Invest</label>
                    <CurrencyInput className="form-control form-control-sm" value={smLoan} onChange={setSmLoan} />
                </div>
                <div className="col-4">
                    <label className="form-label small fw-bold text-muted mb-1">Tax %</label>
                    <PercentInput className="form-control form-control-sm" value={smTaxRate} onChange={setSmTaxRate} />
                </div>
                <div className="col-4">
                    <label className="form-label small fw-bold text-muted mb-1">Loan %</label>
                    <PercentInput className="form-control form-control-sm border-danger" value={smHelocRate} onChange={setSmHelocRate} />
                </div>
                <div className="col-4">
                    <label className="form-label small fw-bold text-muted mb-1">Inv %</label>
                    <PercentInput className="form-control form-control-sm border-success" value={smInvestReturn} onChange={setSmInvestReturn} />
                </div>
            </div>

            <div className="bg-input border border-secondary rounded-4 p-3 text-center mt-auto shadow-inner">
                <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                    <div>
                        <div className="small text-muted fw-bold mb-1" style={{fontSize: '0.7rem'}}>Effective Loan</div>
                        <div className="fs-5 fw-bold text-danger">{smEffectiveBorrowingRate.toFixed(2)}%</div>
                    </div>
                    <div className="text-muted opacity-50"><i className="bi bi-arrow-right"></i></div>
                    <div>
                        <div className="small text-muted fw-bold mb-1" style={{fontSize: '0.7rem'}}>Arb Spread</div>
                        <div className={`fs-5 fw-bold ${smSpread > 0 ? 'text-success' : 'text-danger'}`}>{smSpread > 0 ? '+' : ''}{smSpread.toFixed(2)}%</div>
                    </div>
                </div>
                <div className="pt-2 border-top border-secondary">
                    <div className="fw-bold text-muted text-uppercase ls-1 mb-1" style={{fontSize: '0.65rem'}}>Est. Net Annual Wealth Created</div>
                    <div className={`fs-3 fw-bold ${smAnnualProfit > 0 ? 'text-success' : 'text-danger'}`}>
                        {smAnnualProfit > 0 ? '+' : ''}{formatCurrency(smAnnualProfit)}
                    </div>
                    {smSpread <= 0 && <span className="badge bg-danger mt-1 px-2 py-1" style={{fontSize:'0.65rem'}}>NOT FEASIBLE - LOAN TOO EXPENSIVE</span>}
                </div>
            </div>
        </div>
    );
}