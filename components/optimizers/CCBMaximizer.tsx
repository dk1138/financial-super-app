import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput } from '../SharedUI';

export default function CCBMaximizer() {
    const { data, results } = useFinance();
    const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate * 100 || 30;
    const householdIncome = (Number(data.inputs.p1_income) || 0) + (data.mode === 'Couple' ? (Number(data.inputs.p2_income) || 0) : 0);
    const kidsCount = data.dependents?.length || 0;

    const [ccbIncome, setCcbIncome] = useState(householdIncome || 100000);
    const [ccbKidsUnder6, setCcbKidsUnder6] = useState(kidsCount > 0 ? kidsCount : 1);
    const [ccbKidsOver6, setCcbKidsOver6] = useState(0);
    const [ccbRrspContrib, setCcbRrspContrib] = useState(5000);

    const calcCCB = (netIncome: number, u6: number, o6: number) => {
        const maxU6 = 7437; const maxO6 = 6275;
        const t1 = 34863; const t2 = 75537;
        const totalKids = u6 + o6;
        if (totalKids === 0) return 0;
        let maxBenefit = (u6 * maxU6) + (o6 * maxO6);
        let rateIndex = Math.min(totalKids - 1, 3);
        const rate1 = [0.07, 0.135, 0.19, 0.23];
        const rate2 = [0.032, 0.057, 0.08, 0.095];
        let reduction = 0;
        if (netIncome > t2) {
            reduction = ((t2 - t1) * rate1[rateIndex]) + ((netIncome - t2) * rate2[rateIndex]);
        } else if (netIncome > t1) {
            reduction = (netIncome - t1) * rate1[rateIndex];
        }
        return Math.max(0, maxBenefit - reduction);
    };

    const currentCCB = calcCCB(ccbIncome, ccbKidsUnder6, ccbKidsOver6);
    const newCCB = calcCCB(ccbIncome - ccbRrspContrib, ccbKidsUnder6, ccbKidsOver6);
    const ccbBoost = newCCB - currentCCB;
    const ccbTaxRefund = ccbRrspContrib * (p1Marginal / 100);
    const ccbTotalROI = ((ccbBoost + ccbTaxRefund) / (ccbRrspContrib || 1)) * 100;

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-people-fill fs-4"></i>
                </div>
                <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">CCB Maximizer</h5>
            </div>
            <p className="text-muted small mb-4">Because CCB payouts are tied to Adjusted Family Net Income (AFNI), RRSP contributions do double-duty: they generate a tax refund AND boost your monthly CCB payments. Find your true ROI.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Adj. Family Net Income</label>
                    <CurrencyInput className="form-control form-control-sm" value={ccbIncome} onChange={setCcbIncome} />
                </div>
                <div className="col-12">
                    <label className="form-label small fw-bold text-muted mb-1">Hypothetical RRSP Contrib.</label>
                    <CurrencyInput className="form-control form-control-sm border-success text-success" value={ccbRrspContrib} onChange={setCcbRrspContrib} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Kids &lt;6</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ccbKidsUnder6} onChange={e => setCcbKidsUnder6(parseInt(e.target.value)||0)} />
                </div>
                <div className="col-6">
                    <label className="form-label small fw-bold text-muted mb-1">Kids 6-17</label>
                    <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ccbKidsOver6} onChange={e => setCcbKidsOver6(parseInt(e.target.value)||0)} />
                </div>
            </div>

            <div className="bg-success bg-opacity-10 border border-success border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted fw-bold small">Tax Refund <span className="fw-normal">(@ {p1Marginal.toFixed(0)}%)</span></span>
                    <span className="fw-bold text-main">+{formatCurrency(ccbTaxRefund)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-success border-opacity-25">
                    <span className="text-muted fw-bold small">CCB Boost <span className="fw-normal">(Annual)</span></span>
                    <span className="fw-bold text-info">+{formatCurrency(ccbBoost)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-success fw-bolder">Effective ROI</span>
                    <span className="fw-bolder fs-4 text-success">{ccbTotalROI.toFixed(1)}%</span>
                </div>
            </div>
        </div>
    );
}