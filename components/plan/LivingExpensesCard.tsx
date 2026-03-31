import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, StepperInput, FrequencyToggle } from '../SharedUI';

export default function LivingExpensesCard() {
  const { data, updateInput, updateExpenseCategory, addArrayItem, updateArrayItem, removeArrayItem } = useFinance(); 
  const [expenseAdvancedMode, setExpenseAdvancedMode] = useState(false);

  // --- STATE FOR THEMED POPUPS ---
  const [showSyncError, setShowSyncError] = useState(false);
  const [showSyncConfirm, setShowSyncConfirm] = useState(false);
  const [pendingSyncData, setPendingSyncData] = useState<{ annual: number, categories: any } | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  const updateExpense = (cat: string, idx: number, field: string, value: any) => {
    const newItems = [...data.expensesByCategory[cat].items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    updateExpenseCategory(cat, newItems);
  };

  const calcExpenseTotal = (phase: string) => {
      let total = 0;
      Object.values(data.expensesByCategory || {}).forEach((cat: any) => {
          if(cat && cat.items) cat.items.forEach((item: any) => { total += (item[phase] || 0) * (item.freq || 12); });
      });
      return total;
  };

  const getCategoryIcon = (cat: string) => {
      const icons: Record<string, any> = {
          housing: <i className="bi bi-house-door-fill text-primary"></i>,
          transport: <i className="bi bi-car-front-fill text-info"></i>,
          lifestyle: <i className="bi bi-airplane-fill text-primary"></i>,
          essentials: <i className="bi bi-basket3-fill text-success"></i>,
          other: <i className="bi bi-grid-3x3-gap-fill text-secondary"></i>
      };
      return icons[cat.toLowerCase()] || <i className="bi bi-tag-fill text-muted"></i>;
  };

  // --- SYNC FROM EXPENSE TRACKER ---
  const handleSyncFromTracker = (e: React.MouseEvent) => {
      e.preventDefault(); 
      
      const val = localStorage.getItem('superapp_shared_annual_spend');
      const catVal = localStorage.getItem('superapp_shared_category_spend');
      
      if (!val || !catVal) {
          setShowSyncError(true);
          return;
      }

      setPendingSyncData({
          annual: Number(val),
          categories: JSON.parse(catVal)
      });
      setShowSyncConfirm(true);
  };

  const executeSync = () => {
      if (!pendingSyncData) return;

      const mapping: Record<string, string> = {
          'Housing': 'housing',
          'Utilities': 'housing',
          'Transport': 'transport',
          'Food & Dining': 'lifestyle',
          'Lifestyle': 'lifestyle',
          'Grocery': 'essentials',
          'Essentials': 'essentials',
          'Shopping': 'essentials',
          'Health': 'essentials',
          'Uncategorized': 'other'
      };

      const newPlannerItems: Record<string, any[]> = {
          housing: [], transport: [], lifestyle: [], essentials: [], other: []
      };

      Object.entries(pendingSyncData.categories).forEach(([expenseCat, avgMonthly]: [string, any]) => {
          if (avgMonthly > 0) {
              const targetCat = mapping[expenseCat] || 'other'; 
              newPlannerItems[targetCat].push({
                  name: `${expenseCat} (Tracked)`,
                  curr: avgMonthly,
                  ret: Math.round(avgMonthly * 0.8),
                  trans: 0, gogo: 0, slow: 0, nogo: 0, freq: 12
              });
          }
      });

      Object.keys(newPlannerItems).forEach(cat => {
          const finalItems = newPlannerItems[cat].length > 0 
              ? newPlannerItems[cat] 
              : [{ name: '', curr: 0, ret: 0, trans: 0, gogo: 0, slow: 0, nogo: 0, freq: 12 }];
          
          updateExpenseCategory(cat, finalItems);
      });

      setShowSyncConfirm(false);
      setPendingSyncData(null);
  };

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex flex-wrap align-items-center justify-content-between border-bottom border-secondary p-3 surface-card gap-2">
        <div className="d-flex align-items-center">
            <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                <i className="bi bi-cart4 text-main me-3"></i>6. Living Expenses
                <InfoBtn align="left" title="Budgeting" text="Enter your current monthly or annual spending." />
            </h5>
            
            <button 
                type="button" 
                className="btn btn-sm btn-outline-secondary rounded-pill fw-bold ms-3 d-flex align-items-center shadow-sm opacity-50"
                disabled
                style={{ cursor: 'not-allowed' }}
                title="Auto-Fill is currently unavailable"
            >
                <i className="bi bi-magic me-1"></i> Auto-Fill
            </button>
        </div>
        <div className="form-check form-switch mb-0 d-flex align-items-center">
            <input className="form-check-input m-0 mt-1 cursor-pointer" type="checkbox" id="advancedModeToggle" checked={expenseAdvancedMode} onChange={(e) => setExpenseAdvancedMode(e.target.checked)} />
            <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-2 cursor-pointer d-flex align-items-center" htmlFor="advancedModeToggle">
                Adv. Mode
            </label>
        </div>
      </div>

      <div className="card-body p-3 p-md-4">
        {/* --- PHASED EXPENSES SECTION --- */}
        <div className="card border-info border-opacity-50 surface-card shadow-sm rounded-4 mb-5">
            <div className="card-header bg-info bg-opacity-10 border-bottom border-info border-opacity-50 p-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-info text-uppercase ls-1 d-flex align-items-center gap-2">
                    <i className="bi bi-calendar-range"></i> Phased Expenses & Housing Transitions
                </h6>
                <button type="button" className="btn btn-sm btn-info fw-bold rounded-pill px-3 py-1 text-dark" onClick={() => addArrayItem('expensePhases', { name: 'Future Rent / LTC', amount: 4000, startAge: 80, endAge: 100, isPhased: true })}>
                    <i className="bi bi-plus-lg me-1"></i> Add Phase
                </button>
            </div>
            
            {(!data.expensePhases || data.expensePhases.length === 0) ? (
                <div className="card-body p-4 text-center">
                    <span className="text-muted small fst-italic">No phased expenses added.</span>
                </div>
            ) : (
                <div className="card-body p-3">
                    <div className="row g-3">
                        {data.expensePhases.map((phase: any, idx: number) => (
                            <div className="col-12 col-xl-6" key={`phase_${idx}`}>
                                <div className="border border-secondary rounded-4 bg-input p-3 position-relative shadow-sm h-100">
                                    <button type="button" className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 mt-2 me-2 p-0" onClick={() => removeArrayItem('expensePhases', idx)}>
                                        <i className="bi bi-x-lg fs-5"></i>
                                    </button>
                                    <input type="text" className="form-control form-control-sm bg-transparent border-0 text-main fw-bold mb-2 shadow-none" value={phase.name || ''} onChange={(e) => updateArrayItem('expensePhases', idx, 'name', e.target.value)} placeholder="Phase Name" />
                                    <div className="row g-2">
                                        <div className="col-4"><CurrencyInput className="form-control form-control-sm" value={phase.amount} onChange={(val: any) => updateArrayItem('expensePhases', idx, 'amount', val)} /></div>
                                        <div className="col-4"><StepperInput min={18} max={120} value={phase.startAge || 60} onChange={(val: any) => updateArrayItem('expensePhases', idx, 'startAge', val)} /></div>
                                        <div className="col-4"><StepperInput min={18} max={120} value={phase.endAge || 90} onChange={(val: any) => updateArrayItem('expensePhases', idx, 'endAge', val)} /></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* --- CATEGORY TABLES --- */}
        <div className="d-flex flex-column gap-4">
            {Object.keys(data.expensesByCategory).map(cat => (
                <div className="card surface-card border-secondary shadow-sm rounded-4 overflow-hidden" key={cat}>
                    <div className="card-header bg-secondary bg-opacity-10 border-bottom border-secondary d-flex justify-content-between align-items-center p-3">
                        <h6 className="text-uppercase mb-0 fw-bold d-flex align-items-center gap-2">
                            {getCategoryIcon(cat)} <span className="ls-1">{cat}</span>
                        </h6>
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" onClick={() => { 
                            const newList = [...data.expensesByCategory[cat].items, { name: '', curr: 0, ret: 0, trans: 0, gogo: 0, slow: 0, nogo: 0, freq: 12 }]; 
                            updateExpenseCategory(cat, newList); 
                        }}>
                            <i className="bi bi-plus-lg me-1"></i> Add Item
                        </button>
                    </div>
                    <div className="card-body p-0 table-responsive hide-scrollbar">
                        <table className="table table-borderless align-middle mb-0 w-100" style={{ minWidth: expenseAdvancedMode ? '1000px' : '650px' }}>
                            <thead className="border-bottom border-secondary text-muted text-uppercase" style={{fontSize: '0.7rem'}}>
                                <tr>
                                    <th className="ps-4 py-3" style={{ width: '25%' }}>Expense Item</th>
                                    <th className="py-3">Working</th>
                                    {expenseAdvancedMode && <th className="py-3 text-primary">Transition</th>}
                                    <th className="py-3">Retire (Base)</th>
                                    {expenseAdvancedMode && (
                                        <>
                                            <th className="py-3 text-success">Go-Go</th>
                                            <th className="py-3 text-primary">Slow-Go</th>
                                            <th className="py-3 text-danger">No-Go</th>
                                        </>
                                    )}
                                    <th className="py-3 text-center" style={{width: '110px'}}>Freq</th>
                                    <th className="pe-4 py-3" style={{width: '50px'}}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.expensesByCategory[cat].items.map((exp: any, idx: number) => (
                                    <tr key={`${cat}_${idx}`} className="border-bottom border-secondary border-opacity-25">
                                        <td className="ps-4 py-2">
                                            <input type="text" className="form-control form-control-sm bg-input border border-secondary fw-bold text-main rounded-3 shadow-none" value={exp.name || ''} onChange={(e) => updateExpense(cat, idx, 'name', e.target.value)} />
                                        </td>
                                        <td className="py-2"><CurrencyInput className="form-control form-control-sm" value={exp.curr ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'curr', val)} /></td>
                                        {expenseAdvancedMode && <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary" value={exp.trans ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'trans', val)} /></td>}
                                        <td className="py-2"><CurrencyInput className="form-control form-control-sm" value={exp.ret ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'ret', val)} /></td>
                                        {expenseAdvancedMode && (
                                            <>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-success" value={exp.gogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'gogo', val)} /></td>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary" value={exp.slow ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'slow', val)} /></td>
                                                <td className="py-2"><CurrencyInput className="form-control form-control-sm text-danger" value={exp.nogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'nogo', val)} /></td>
                                            </>
                                        )}
                                        <td className="py-2 text-center"><FrequencyToggle mode="number" value={exp.freq || 12} onChange={(v: any) => updateExpense(cat, idx, 'freq', v)} /></td>
                                        <td className="pe-4 py-2 text-end">
                                            <button type="button" className="btn btn-sm btn-link text-danger p-1 opacity-75 hover-opacity-100" onClick={() => { const newList = [...data.expensesByCategory[cat].items]; newList.splice(idx, 1); updateExpenseCategory(cat, newList); }}>
                                                <i className="bi bi-x-lg fs-5"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>

        {/* --- SUMMARY SECTION --- */}
        <div className="card border-primary border-opacity-50 surface-card mt-4 shadow-sm">
            <div className="card-body p-4">
                <div className="row text-center">
                    <div className="col-6 border-end border-primary border-opacity-25">
                        <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Annual Working Budget</div>
                        <div className="fs-3 fw-bold text-main mb-1">{formatCurrency(calcExpenseTotal('curr'))}</div>
                        <div className="small text-muted fw-bold">{formatCurrency(calcExpenseTotal('curr') / 12)} /mo</div>
                    </div>
                    <div className="col-6">
                        <div className="small fw-bold text-muted text-uppercase ls-1 mb-1">Annual Retirement (Base)</div>
                        <div className="fs-3 fw-bold text-primary mb-1">{formatCurrency(calcExpenseTotal('ret'))}</div>
                        <div className="small text-muted fw-bold">{formatCurrency(calcExpenseTotal('ret') / 12)} /mo</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- THEMED POPUPS (Currently Hidden via disabled button) --- */}
      {(showSyncError || showSyncConfirm) && (
          <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center z-3" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="card border-secondary shadow-lg p-4 fade-in-tab" style={{ maxWidth: '400px', width: '90%' }}>
                  <div className="text-center mb-3">
                      <i className={`bi ${showSyncError ? 'bi-exclamation-triangle text-warning' : 'bi-magic text-primary'} fs-1`}></i>
                      <h5 className="fw-bold mt-2 text-main">{showSyncError ? 'No Data Found' : 'Sync Tracked Expenses?'}</h5>
                  </div>
                  
                  <p className="small text-muted text-center mb-4">
                      {showSyncError 
                          ? "We couldn't find any tracked data. Head to your Expense Dashboard and click 'Sync' to save your spending first." 
                          : `We found ${formatCurrency(pendingSyncData?.annual || 0)}/year in your tracker. This will replace your current planner entries with these detailed categories.`}
                  </p>

                  <div className="d-flex gap-2">
                      {showSyncError ? (
                          <button className="btn btn-primary w-100 rounded-pill fw-bold" onClick={() => setShowSyncError(false)}>Got it</button>
                      ) : (
                          <>
                              <button className="btn btn-outline-secondary w-50 rounded-pill fw-bold" onClick={() => setShowSyncConfirm(false)}>Cancel</button>
                              <button className="btn btn-primary w-50 rounded-pill fw-bold" onClick={executeSync}>Sync Now</button>
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}