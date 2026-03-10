import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, MonthYearStepper } from '../SharedUI';

export default function MedicalExpenseOptimizer() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    
    const initialMedIncome = isCouple ? Math.min(Number(data.inputs.p1_income)||0, Number(data.inputs.p2_income)||0) || 50000 : Number(data.inputs.p1_income) || 50000;
    const [medIncome, setMedIncome] = useState(initialMedIncome);
    const [medBills, setMedBills] = useState<{id: string, date: string, amount: number}[]>([
        { id: '1', date: '2024-03', amount: 1500 },
        { id: '2', date: '2024-08', amount: 800 },
        { id: '3', date: '2025-01', amount: 2200 }
    ]);
    
    const medHurdle = Math.min(2759, medIncome * 0.03); 
    let bestMedWindow = { start: '', end: '', total: 0, eligible: 0 };
    
    if (medBills.length > 0) {
        const sortedBills = [...medBills].sort((a,b) => a.date.localeCompare(b.date));
        sortedBills.forEach(bill => {
            const endD = new Date(bill.date + '-01');
            const startD = new Date(endD);
            startD.setMonth(startD.getMonth() - 11); 
            
            const startStr = startD.toISOString().substring(0,7);
            const endStr = bill.date;
            
            let windowTotal = 0;
            sortedBills.forEach(b => {
                if (b.date >= startStr && b.date <= endStr) {
                    windowTotal += b.amount;
                }
            });
            
            const eligible = Math.max(0, windowTotal - medHurdle);
            if (eligible >= bestMedWindow.eligible && windowTotal > bestMedWindow.total) {
                bestMedWindow = { start: startStr, end: endStr, total: windowTotal, eligible };
            }
        });
    }

    const addMedBill = () => {
        const lastDate = medBills.length > 0 ? medBills[medBills.length - 1].date : `${new Date().getFullYear()}-01`;
        setMedBills([...medBills, { id: Math.random().toString(), date: lastDate, amount: 0 }]);
    };
    const updateMedBill = (id: string, field: string, val: any) => {
        setMedBills(medBills.map(b => b.id === id ? { ...b, [field]: val } : b));
    };
    const removeMedBill = (id: string) => {
        setMedBills(medBills.filter(b => b.id !== id));
    };
    const formatMonthYear = (yyyymm: string) => {
        if (!yyyymm) return '';
        const [y, m] = yyyymm.split('-');
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[parseInt(m, 10)-1]} ${y}`;
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-hospital fs-4"></i>
                </div>
                <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Medical Exp. Window</h5>
            </div>
            <p className="text-muted small mb-3">The CRA allows you to claim medical expenses for <i>any</i> 12-month period. Find the exact rolling window that maximizes your tax credit over the 3% net income hurdle.</p>
            
            <div className="mb-3">
                <label className="form-label small fw-bold text-muted mb-1">Net Income (Lower Earning Spouse)</label>
                <CurrencyInput className="form-control form-control-sm" value={medIncome} onChange={setMedIncome} />
            </div>

            <div className="d-flex align-items-center gap-2 px-1 mb-1">
                <span className="small fw-bold text-muted w-50">Month</span>
                <span className="small fw-bold text-muted w-50">Bill Amount ($)</span>
            </div>
            
            <div className="flex-grow-1 overflow-auto pe-1 mb-3 custom-scrollbar" style={{minHeight: '120px', maxHeight: '180px'}}>
                {medBills.map(bill => (
                    <div key={bill.id} className="d-flex gap-2 mb-2 align-items-center">
                        <div className="w-50 flex-shrink-0">
                            <MonthYearStepper value={bill.date} onChange={(val: string) => updateMedBill(bill.id, 'date', val)} />
                        </div>
                        <div className="w-50 d-flex gap-2 align-items-center">
                            <CurrencyInput className="form-control form-control-sm border-secondary text-main fw-bold w-100" value={bill.amount} onChange={(val: any) => updateMedBill(bill.id, 'amount', val)} />
                            <button className="btn btn-sm btn-link text-danger p-0 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeMedBill(bill.id)}><i className="bi bi-x-lg"></i></button>
                        </div>
                    </div>
                ))}
            </div>
            <button className="btn btn-sm btn-outline-secondary w-100 fw-bold mb-3 mt-auto" onClick={addMedBill}>+ Add Expense Event</button>

            <div className="bg-danger bg-opacity-10 border border-danger border-opacity-50 rounded-4 p-3 shadow-inner text-center">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-danger border-opacity-25">
                    <span className="text-muted fw-bold small">CRA Hurdle (3%)</span>
                    <span className="fw-bold text-main">{formatCurrency(medHurdle)}</span>
                </div>
                
                {bestMedWindow.eligible > 0 ? (
                    <>
                        <div className="small text-danger fw-bold text-uppercase ls-1 mb-1">Optimal 12-Month Window</div>
                        <div className="fw-bold text-main mb-2">{formatMonthYear(bestMedWindow.start)} to {formatMonthYear(bestMedWindow.end)}</div>
                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-danger border-opacity-25">
                            <span className="text-danger fw-bolder small">Eligible to Claim</span>
                            <span className="fw-bolder fs-4 text-danger">{formatCurrency(bestMedWindow.eligible)}</span>
                        </div>
                    </>
                ) : (
                    <span className="small text-muted fst-italic py-2 d-block">No window exceeds the 3% income hurdle.</span>
                )}
            </div>
        </div>
    );
}