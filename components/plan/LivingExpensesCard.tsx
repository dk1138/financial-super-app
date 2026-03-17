import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, StepperInput, FrequencyToggle } from '../SharedUI';

export default function LivingExpensesCard() {
  const { data, updateInput, updateExpenseCategory, addArrayItem, updateArrayItem, removeArrayItem } = useFinance(); 
  const [expenseAdvancedMode, setExpenseAdvancedMode] = useState(false);

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

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex align-items-center justify-content-between border-bottom border-secondary p-3 surface-card">
        <div className="d-flex align-items-center">
            <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
                <i className="bi bi-cart4 text-main me-3"></i>6. Living Expenses
                <InfoBtn align="left" title="Budgeting" text="Enter your current monthly or annual spending. <br><br><b>Simple Mode:</b> Set one budget for working years and one for retirement.<br><b>Advanced Mode:</b> Define spending for 3 phases of retirement: Go-Go (Active), Slow-Go (Less active), and No-Go (Late stage)." />
            </h5>
        </div>
        <div className="form-check form-switch mb-0">
            <input className="form-check-input mt-1 cursor-pointer" type="checkbox" checked={expenseAdvancedMode} onChange={(e) => setExpenseAdvancedMode(e.target.checked)} />
            <label className="form-check-label small fw-bold text-uppercase ls-1 text-muted ms-1 cursor-pointer">Adv. Mode</label>
        </div>
      </div>
      <div className="card-body p-3 p-md-4">
        
        {/* --- NEW PHASED EXPENSES SECTION FOR RENT/LTC --- */}
        <div className="card border-info border-opacity-50 surface-card shadow-sm rounded-4 mb-5">
            <div className="card-header bg-info bg-opacity-10 border-bottom border-info border-opacity-50 p-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold text-info text-uppercase ls-1 d-flex align-items-center gap-2">
                    <i className="bi bi-calendar-range"></i> Phased Expenses & Housing Transitions
                    <InfoBtn title="Phased Expenses" text="Use this section to model expenses that only occur during a specific window of time.<br><br><b>Perfect for Downsizing:</b> If you told the engine to 'Sell' your primary home at age 80 in the Real Estate tab, you can use this section to add a new '$4,000/mo Rent/LTC' expense starting at age 80. The engine will automatically pay for this new rent using the cash windfall from your house sale!" />
                </h6>
                <button type="button" className="btn btn-sm btn-info fw-bold rounded-pill px-3 py-1 text-dark" onClick={() => addArrayItem('expensePhases', { name: 'Future Rent / LTC', amount: 4000, startAge: 80, endAge: 100, isPhased: true })}>
                    <i className="bi bi-plus-lg me-1"></i> Add Phase
                </button>
            </div>
            
            {(!data.expensePhases || data.expensePhases.length === 0) ? (
                <div className="card-body p-4 text-center">
                    <span className="text-muted small fst-italic">No phased expenses added. Click "Add Phase" to model future rent, LTC, or temporary care costs.</span>
                </div>
            ) : (
                <div className="card-body p-3">
                    <div className="row g-3">
                        {data.expensePhases.map((phase: any, idx: number) => (
                            <div className="col-12 col-xl-6" key={`phase_${idx}`}>
                                <div className="border border-secondary rounded-4 bg-input p-3 position-relative shadow-sm h-100">
                                    <button type="button" className="btn btn-sm btn-link text-danger position-absolute top-0 end-0 mt-2 me-2 p-0 opacity-75 hover-opacity-100" onClick={() => removeArrayItem('expensePhases', idx)}>
                                        <i className="bi bi-x-lg fs-5"></i>
                                    </button>
                                    
                                    <div className="d-flex align-items-center gap-2 mb-3 w-75">
                                        <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                                            <i className="bi bi-clock-history"></i>
                                        </div>
                                        <input type="text" maxLength={50} className="form-control form-control-sm bg-transparent border-0 text-main fw-bold shadow-none p-0" value={phase.name || ''} onChange={(e) => updateArrayItem('expensePhases', idx, 'name', e.target.value)} placeholder="Phase Name (e.g. Rent)" />
                                    </div>
                                    
                                    <div className="row g-2 align-items-end">
                                        <div className="col-12 col-sm-4">
                                            <label className="form-label small text-muted fw-bold mb-1">Monthly Cost</label>
                                            <CurrencyInput className="form-control form-control-sm" value={phase.amount} onChange={(val: any) => updateArrayItem('expensePhases', idx, 'amount', val)} />
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="form-label small text-muted fw-bold mb-1">Starts (Age)</label>
                                            <StepperInput min={18} max={120} value={phase.startAge || 60} onChange={(val: any) => updateArrayItem('expensePhases', idx, 'startAge', val)} />
                                        </div>
                                        <div className="col-6 col-sm-4">
                                            <label className="form-label small text-muted fw-bold mb-1">Ends (Age)</label>
                                            <StepperInput min={18} max={120} value={phase.endAge || 90} onChange={(val: any) => updateArrayItem('expensePhases', idx, 'endAge', val)} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {/* --- END PHASED EXPENSES SECTION --- */}

        {expenseAdvancedMode && (
          <div className="card border-secondary surface-card shadow-sm rounded-4 mb-4">
            <div className="card-body p-3">
              <div className="row g-3">
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center justify-content-between bg-input p-2 px-3 rounded-3 border border-secondary h-100">
                        <label className="form-label text-success fw-bold mb-0 text-nowrap">Go-Go Age Ends:</label>
                        <div style={{width: '180px'}}><StepperInput min={60} max={100} value={data.inputs.exp_gogo_age || 75} onChange={(val: any) => {
                            updateInput('exp_gogo_age', val);
                            if (val > (data.inputs.exp_slow_age || 85)) updateInput('exp_slow_age', val);
                        }} /></div>
                    </div>
                </div>
                <div className="col-12 col-md-6">
                    <div className="d-flex align-items-center justify-content-between bg-input p-2 px-3 rounded-3 border border-secondary h-100">
                        <label className="form-label text-primary fw-bold mb-0 text-nowrap">Slow-Go Age Ends:</label>
                        <div style={{width: '180px'}}><StepperInput min={60} max={120} value={data.inputs.exp_slow_age || 85} onChange={(val: any) => {
                            if (val >= (data.inputs.exp_gogo_age || 75)) updateInput('exp_slow_age', val);
                        }} /></div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="d-flex flex-column gap-4">
            {Object.keys(data.expensesByCategory).map(cat => (
                <div className="card surface-card border-secondary shadow-sm rounded-4 overflow-hidden" key={cat}>
                    <div className="card-header bg-secondary bg-opacity-10 border-bottom border-secondary d-flex justify-content-between align-items-center p-3">
                        <h6 className="text-uppercase mb-0 fw-bold d-flex align-items-center gap-2">
                            {getCategoryIcon(cat)} <span className="ls-1">{cat}</span>
                        </h6>
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1 fw-bold" style={{fontSize: '0.75rem'}} onClick={() => { 
                            const newList = [...data.expensesByCategory[cat].items, { name: '', curr: 0, ret: 0, trans: 0, gogo: 0, slow: 0, nogo: 0, freq: 12 }]; 
                            updateExpenseCategory(cat, newList); 
                        }}>
                            <i className="bi bi-plus-lg me-1"></i> Add Item
                        </button>
                    </div>
                    <div className="card-body p-0 table-responsive hide-scrollbar">
                        <table className="table table-borderless table-hover align-middle mb-0 m-0 w-100" style={{ minWidth: expenseAdvancedMode ? '1000px' : '650px' }}>
                            <thead className="border-bottom border-secondary text-muted text-uppercase" style={{fontSize: '0.7rem', letterSpacing: '0.05em'}}>
                                <tr>
                                    <th className="ps-4 py-3 fw-semibold" style={{ width: '25%' }}>Expense Item</th>
                                    <th className="py-3 fw-semibold text-start">Working</th>
                                    {expenseAdvancedMode && <th className="py-3 fw-semibold text-start text-primary">Transition</th>}
                                    <th className="py-3 fw-semibold text-start">Retire (Base)</th>
                                    {expenseAdvancedMode && <>
                                        <th className="py-3 fw-semibold text-start text-success">Go-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">(Ret. to {data.inputs.exp_gogo_age || 75})</span></th>
                                        <th className="py-3 fw-semibold text-start text-primary">Slow-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">({data.inputs.exp_gogo_age || 75} to {data.inputs.exp_slow_age || 85})</span></th>
                                        <th className="py-3 fw-semibold text-start text-danger">No-Go<br/><span style={{fontSize:'0.65rem', letterSpacing:'normal'}} className="text-muted fw-normal text-nowrap">({data.inputs.exp_slow_age || 85}+)</span></th>
                                    </>}
                                    <th className="py-3 fw-semibold text-center" style={{width: '110px'}}>Frequency</th>
                                    <th className="pe-4 py-3 text-end" style={{width: '50px'}}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.expensesByCategory[cat].items.map((exp:any, idx:number) => (
                                    <tr key={`${cat}_${idx}`} className="border-bottom border-secondary border-opacity-25">
                                        <td className="ps-4 py-2">
                                            <input type="text" maxLength={50} className="form-control form-control-sm bg-input border border-secondary fw-bold text-main shadow-none rounded-3" placeholder="Item name..." value={exp.name || ''} onChange={(e) => updateExpense(cat, idx, 'name', e.target.value)} />
                                        </td>
                                        <td className="py-2"><CurrencyInput className="form-control form-control-sm rounded-3 bg-input border-secondary" value={exp.curr ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'curr', val)} /></td>
                                        {expenseAdvancedMode && <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary rounded-3 bg-input border-secondary" value={exp.trans ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'trans', val)} /></td>}
                                        <td className="py-2"><CurrencyInput className="form-control form-control-sm rounded-3 bg-input border-secondary" value={exp.ret ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'ret', val)} /></td>
                                        {expenseAdvancedMode && (
                                            <>
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm text-success rounded-3 bg-input border-secondary" value={exp.gogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'gogo', val)} /></td>
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm text-primary rounded-3 bg-input border-secondary" value={exp.slow ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'slow', val)} /></td>
                                            <td className="py-2"><CurrencyInput className="form-control form-control-sm text-danger rounded-3 bg-input border-secondary" value={exp.nogo ?? ''} onChange={(val: any) => updateExpense(cat, idx, 'nogo', val)} /></td>
                                            </>
                                        )}
                                        <td className="py-2 text-center">
                                            <FrequencyToggle mode="number" value={exp.freq || 12} onChange={(v: any) => updateExpense(cat, idx, 'freq', v)} />
                                        </td>
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
    </div>
  );
}