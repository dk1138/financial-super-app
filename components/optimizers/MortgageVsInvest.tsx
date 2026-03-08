import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput, PercentInput } from '../SharedUI';

export default function MortgageVsInvest() {
    const { data } = useFinance();
    const firstMortgage = data.properties?.find((p: any) => p.mortgage > 0);

    const [mviLumpSum, setMviLumpSum] = useState(10000);
    const [mviMortgageRate, setMviMortgageRate] = useState(firstMortgage?.rate || 4.5);
    const [mviInvestReturn, setMviInvestReturn] = useState(7.0);
    const [mviYears, setMviYears] = useState(10);
    const [mviTaxRate, setMviTaxRate] = useState(0); 

    const mviInvestVal = mviLumpSum * Math.pow(1 + ((mviInvestReturn / 100) * (1 - (mviTaxRate / 100))), mviYears);
    const mviMortgageVal = mviLumpSum * Math.pow(1 + (mviMortgageRate / 100), mviYears);
    const mviDiff = mviInvestVal - mviMortgageVal;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-house-check fs-4"></i>
                </div>
                <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Mortgage vs Invest</h5>
            </div>
            <p className="text-muted small mb-4">Compare the guaranteed tax-free return of paying down debt versus compounding the money in the market.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Lump Sum Available</label>
                    <CurrencyInput className="form-control form-control-sm" value={mviLumpSum} onChange={setMviLumpSum} />
                </div>
                <div className="col-4">
                    <label className="form-label small fw-bold text-muted mb-1">Yrs</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={mviYears} onChange={e => setMviYears(parseInt(e.target.value)||0)} />
                </div>
                <div className="col-4">
                    <label className="form-label small fw-bold text-muted mb-1">Mort %</label>
                    <PercentInput className="form-control form-control-sm border-danger" value={mviMortgageRate} onChange={setMviMortgageRate} />
                </div>
                <div className="col-4">
                    <label className="form-label small fw-bold text-muted mb-1">Inv %</label>
                    <PercentInput className="form-control form-control-sm border-success" value={mviInvestReturn} onChange={setMviInvestReturn} />
                </div>
            </div>

            <div className="row g-2 mt-auto text-center">
                <div className="col-6">
                    <div className={`p-2 rounded-3 border h-100 d-flex flex-column justify-content-center ${mviDiff > 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-success bg-opacity-10 border-success'}`}>
                        <div className="text-muted fw-bold" style={{fontSize: '0.65rem'}}>GUARANTEED SAVED</div>
                        <div className="fs-5 fw-bold text-main">{formatCurrency(mviMortgageVal - mviLumpSum)}</div>
                    </div>
                </div>
                <div className="col-6">
                    <div className={`p-2 rounded-3 border h-100 d-flex flex-column justify-content-center ${mviDiff > 0 ? 'bg-success bg-opacity-10 border-success' : 'bg-black bg-opacity-25 border-secondary'}`}>
                        <div className="text-muted fw-bold" style={{fontSize: '0.65rem'}}>AFTER-TAX PROFIT</div>
                        <div className="fs-5 fw-bold text-success">{formatCurrency(mviInvestVal - mviLumpSum)}</div>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-3 pt-2 border-top border-secondary">
                <h6 className="fw-bold mb-1 small">Winner: <span className={mviDiff > 0 ? 'text-success' : 'text-primary'}>{mviDiff > 0 ? 'INVESTING' : 'PAYING MORTGAGE'}</span></h6>
                <span className="text-muted" style={{fontSize: '0.7rem'}}>Diff: <b>{formatCurrency(Math.abs(mviDiff))}</b></span>
            </div>
        </div>
    );
}