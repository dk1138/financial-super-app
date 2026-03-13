import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, CurrencyInput, PercentInput, ProvinceSelector, FrequencyToggle, MonthYearStepper } from '../SharedUI';

export default function IncomeTaxCard() {
  const { data, results, updateInput, addArrayItem, updateArrayItem, removeArrayItem } = useFinance();
  const isCouple = data.mode === 'Couple';
  
  // State for collapsible tax credits sections
  const [showCredits, setShowCredits] = useState<Record<string, boolean>>({ p1: false, p2: false });
  
  // State for collapsible non-refundable tax credits breakdown in the tax box
  const [showNrtc, setShowNrtc] = useState<Record<string, boolean>>({ p1: false, p2: false });

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  const getActiveIncome = (player: string) => {
      let base = Number(data.inputs[`${player}_income`]) || 0;
      let addl = data.additionalIncome.filter((inc: any) => inc.owner === player).reduce((sum: number, inc: any) => sum + ((Number(inc.amount) || 0) * (inc.freq === 'month' ? 12 : 1)), 0);
      return base + addl;
  };

  const p1Gross = getActiveIncome('p1');
  const p2Gross = isCouple ? getActiveIncome('p2') : 0;
  const hhGross = p1Gross + p2Gross;
  const totalTax = (results?.timeline?.[0]?.taxP1 || 0) + (isCouple ? (results?.timeline?.[0]?.taxP2 || 0) : 0);
  
  const hhNet = hhGross > 0 ? Math.max(0, hhGross - totalTax) : 0;

  const toggleCredits = (p: string) => setShowCredits(prev => ({ ...prev, [p]: !prev[p] }));
  const toggleNrtc = (p: string) => setShowNrtc(prev => ({ ...prev, [p]: !prev[p] }));

  const renderTaxBox = (taxDetails: any, gross: number, p: string) => {
      if (!taxDetails || gross <= 0) return <div className="text-muted text-center mt-3 small fst-italic">No Tax Data / Income</div>;
      
      const hasNrtc = taxDetails.nrtc && Object.values(taxDetails.nrtc).some((v: any) => v > 0);
      const nrtcTotal = hasNrtc ? Object.values(taxDetails.nrtc).reduce((a: any, b: any) => a + b, 0) as number : 0;

      return (
          <div className="border border-secondary rounded-4 mt-4 shadow-sm">
            <div className="bg-danger bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center justify-content-between rounded-top-4">
                <div className="d-flex align-items-center gap-3">
                    <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-receipt"></i></div>
                    <span className="fw-bold text-danger small text-uppercase ls-1">Estimated Tax Breakdown</span>
                </div>
                <InfoBtn 
                    title="Applied Tax Credits" 
                    align="right" 
                    text="The tax engine calculates and applies non-refundable tax credits automatically based on your profile and inputs.<br/><br/><b>Automatic Credits:</b><br/>• Basic Personal Amount (Fed & Prov)<br/>• Age Amount (65+)<br/>• Pension Income Amount<br/>• Canada Employment Amount<br/>• CPP/EI Premium Credits<br/>• Dividend Tax Credits<br/><br/><b>User-Specified Credits:</b><br/>• Disability & Caregiver Amount<br/>• First-Time Home Buyer<br/>• Medical Expenses<br/>• Charitable Donations" 
                />
            </div>
            <div className="p-3 bg-input d-flex flex-column gap-2 rounded-bottom-4">
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-50 pb-2"><span className="text-muted small fw-medium">Federal Tax</span> <span className="small fw-bold">(${Math.round(taxDetails.fed).toLocaleString()}) <span className="text-muted fw-normal ms-1">{((taxDetails.fed/gross)*100).toFixed(1)}%</span></span></div>
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-50 pb-2"><span className="text-muted small fw-medium">Provincial Tax</span> <span className="small fw-bold">(${Math.round(taxDetails.prov).toLocaleString()}) <span className="text-muted fw-normal ms-1">{((taxDetails.prov/gross)*100).toFixed(1)}%</span></span></div>
              <div className="d-flex justify-content-between border-bottom border-secondary border-opacity-50 pb-2"><span className="text-muted small fw-medium">CPP / EI Premiums</span> <span className="small fw-bold">(${Math.round(taxDetails.cpp_ei).toLocaleString()})</span></div>
              
              <div className="d-flex justify-content-between mt-1"><span className="text-danger fw-bold small">Total Tax Paid</span> <span className="text-danger fw-bold small">(${Math.round(taxDetails.totalTax).toLocaleString()})</span></div>
              <div className="d-flex justify-content-between"><span className="text-muted small fw-medium">Marginal Rate</span> <span className="small fw-bold">{(taxDetails.margRate*100).toFixed(1)}%</span></div>

              {/* Collapsible Applied Non-Refundable Tax Credits */}
              {hasNrtc && (
                  <div className="mt-2 pt-2 border-top border-secondary border-opacity-50">
                      <div 
                          className="d-flex justify-content-between align-items-center cursor-pointer transition-all user-select-none"
                          onClick={() => toggleNrtc(p)}
                      >
                          <span className="text-info small fw-bold d-flex align-items-center gap-1">
                              <i className={`bi bi-chevron-${showNrtc[p] ? 'up' : 'down'} small`}></i> Applied Non-Refundable Credits
                          </span>
                          <span className="small fw-bold text-info">
                              -${Math.round(nrtcTotal).toLocaleString()}
                          </span>
                      </div>
                      
                      {showNrtc[p] && (
                          <div className="ps-3 pt-2 mt-1 mb-1 d-flex flex-column gap-1 border-start border-info ms-1 border-opacity-25">
                              {taxDetails.nrtc.disability > 0 && (
                                  <div className="d-flex justify-content-between align-items-center">
                                      <span className="text-muted small fst-italic d-flex align-items-center gap-1">
                                          Disability Tax Credit
                                          <InfoBtn title="Disability Tax Credit Math" text="A non-refundable tax credit that reduces the income tax you may have to pay. The base amount is multiplied by the lowest Federal and Provincial tax bracket rates.<br/><br/><b>Calculation:</b> Base Amount × Lowest Tax Rate<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit.html' target='_blank'>Learn more on Canada.ca</a>" />
                                      </span>
                                      <span className="small text-info fw-bold opacity-75">-${Math.round(taxDetails.nrtc.disability).toLocaleString()}</span>
                                  </div>
                              )}
                              {taxDetails.nrtc.caregiver > 0 && (
                                  <div className="d-flex justify-content-between align-items-center">
                                      <span className="text-muted small fst-italic d-flex align-items-center gap-1">
                                          Caregiver Amount
                                          <InfoBtn title="Caregiver Amount Math" text="Tax savings are calculated by multiplying the eligible base amounts for your dependants by the lowest Federal and Provincial tax bracket rates.<br/><br/><b>Federal Savings:</b> Base Amount × Lowest Fed Rate<br/><b>Provincial Savings:</b> Base Amount × Lowest Prov Rate<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/canada-caregiver-amount.html' target='_blank'>Learn more on Canada.ca</a>" />
                                      </span>
                                      <span className="small text-info fw-bold opacity-75">-${Math.round(taxDetails.nrtc.caregiver).toLocaleString()}</span>
                                  </div>
                              )}
                              {taxDetails.nrtc.medical > 0 && (
                                  <div className="d-flex justify-content-between align-items-center">
                                      <span className="text-muted small fst-italic d-flex align-items-center gap-1">
                                          Medical Expenses
                                          <InfoBtn title="Medical Expenses Math" text="Your total eligible expenses are first reduced by a minimum threshold (the lesser of 3% of your net income or a fixed max cap). The remainder is then multiplied by the lowest Federal and Provincial tax bracket rates.<br/><br/><b>Calculation:</b> (Total Expenses - Threshold) × Lowest Tax Rate<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html' target='_blank'>Learn more on Canada.ca</a>" />
                                      </span>
                                      <span className="small text-info fw-bold opacity-75">-${Math.round(taxDetails.nrtc.medical).toLocaleString()}</span>
                                  </div>
                              )}
                              {taxDetails.nrtc.homeBuyer > 0 && (
                                  <div className="d-flex justify-content-between align-items-center">
                                      <span className="text-muted small fst-italic d-flex align-items-center gap-1">
                                          First-Time Home Buyer
                                          <InfoBtn title="First-Time Home Buyer Math" text="The $10,000 base amount is multiplied by the lowest Federal tax bracket rate.<br/><br/><b>Note:</b> Only SK and QC offer a provincial income tax credit for this. Other provinces issue Land Transfer Tax rebates at closing instead, which do not appear on your income tax return.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31270-home-buyers-amount.html' target='_blank'>Learn more on Canada.ca</a>" />
                                      </span>
                                      <span className="small text-info fw-bold opacity-75">-${Math.round(taxDetails.nrtc.homeBuyer).toLocaleString()}</span>
                                  </div>
                              )}
                              {taxDetails.nrtc.donations > 0 && (
                                  <div className="d-flex justify-content-between align-items-center">
                                      <span className="text-muted small fst-italic d-flex align-items-center gap-1">
                                          Charitable Donations
                                          <InfoBtn title="Charitable Donations Math" text="Donations are calculated using a 2-tiered system to encourage larger gifts.<br/><br/><b>First $200:</b> Multiplied by the lowest tax bracket rates.<br/><b>Amount over $200:</b> Multiplied by the highest tax bracket rates.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-34900-donations-gifts.html' target='_blank'>Learn more on Canada.ca</a>" />
                                      </span>
                                      <span className="small text-info fw-bold opacity-75">-${Math.round(taxDetails.nrtc.donations).toLocaleString()}</span>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )}

              <div className="d-flex justify-content-between mt-2 pt-3 border-top border-secondary"><span className="text-success fw-bold">After-Tax Net</span> <span className="text-success fw-bold fs-5">${Math.round(gross - taxDetails.totalTax).toLocaleString()}</span></div>
            </div>
          </div>
      );
  };

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
          <i className="bi bi-cash-coin text-success fs-4 me-3"></i>
          <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">
              5. Income & Taxation
              <InfoBtn align="left" title="Income & Tax" text="Enter <b>Gross Annual Income</b> (before tax). The system automatically calculates Federal and Provincial taxes based on your selected Province, automatically applying basic, age, and pension tax credits where eligible." />
          </h5>
      </div>
      <div className="card-body p-4">
        
        <div className="mb-5">
            <label className="form-label fw-bold small text-muted text-uppercase ls-1">Province of Residence</label>
            <div className="d-flex w-100">
                <ProvinceSelector value={data.inputs.tax_province} onChange={(v) => updateInput('tax_province', v)} />
            </div>
        </div>

        <div className="row g-4">
          {['p1', 'p2'].map((p) => {
            if (!isCouple && p === 'p2') return null;
            return (
            <div className="col-12 col-xl-6" key={p}>
              
              <div className="card h-100 border-secondary surface-card shadow-none mb-4">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between mb-4 border-bottom border-secondary pb-2">
                    <h6 className={`fw-bold text-uppercase ls-1 ${p === 'p1' ? 'text-info' : ''}`} style={p === 'p2' ? {color:'var(--bs-purple)'} : {}}>{p.toUpperCase()} Income</h6>
                    <div className="d-flex gap-2">
                      <button type="button" className={`btn btn-sm btn-outline-${p === 'p1' ? 'info' : 'primary'} rounded-pill px-3 py-1 fw-bold`} style={p === 'p2' ? {color:'var(--bs-purple)', borderColor:'var(--bs-purple)'} : {}} onClick={() => addArrayItem('additionalIncome', { owner: p, name: 'Side Hustle', amount: 5000, freq: 'year', growth: 2.0, startMode: 'date', start: '2026-01', endMode: 'never', taxable: true })}>+ Stream</button>
                    </div>
                  </div>

                  <div className="border border-secondary rounded-4 mb-3 shadow-sm">
                      <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3 rounded-top-4">
                          <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-cash-stack"></i></div>
                          <span className="fw-bold text-main small text-uppercase ls-1">Base Salary</span>
                      </div>
                      <div className="p-3 bg-input rounded-bottom-4">
                          <div className="row g-3">
                              <div className="col-12 col-md-7">
                                  <label className="form-label small text-muted mb-1">Gross Annual Income</label>
                                  <CurrencyInput className="form-control" value={data.inputs[`${p}_income`] ?? ''} onChange={(val: any) => updateInput(`${p}_income`, val)} />
                              </div>
                              <div className="col-12 col-md-5">
                                  <label className="form-label small text-muted mb-1">Yearly Growth (%)</label>
                                  <PercentInput className="form-control" value={data.inputs[`${p}_income_growth`]} onChange={(val: any) => updateInput(`${p}_income_growth`, val)} />
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="border border-secondary rounded-4 mb-3 shadow-sm">
                      <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3 rounded-top-4">
                          <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-building"></i></div>
                          <span className="fw-bold text-main small text-uppercase ls-1">Employer RRSP Match</span>
                      </div>
                      <div className="p-3 bg-input rounded-bottom-4">
                          <div className="row g-3">
                              <div className="col-12 col-md-6">
                                  <label className="form-label small text-muted mb-1">Max Match (%)</label>
                                  <PercentInput className="form-control" value={data.inputs[`${p}_rrsp_match`]} onChange={(val: any) => updateInput(`${p}_rrsp_match`, val)} />
                              </div>
                              <div className="col-12 col-md-6">
                                  <label className="form-label small text-muted mb-1 d-flex align-items-center">Match Rate (%) <InfoBtn title="Match Rate" text="If they match 50 cents on the dollar, enter 50."/></label>
                                  <PercentInput className="form-control" value={data.inputs[`${p}_rrsp_match_tier`]} onChange={(val: any) => updateInput(`${p}_rrsp_match_tier`, val)} />
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* TAX CREDITS COLLAPSIBLE PANEL */}
                  <div className="border border-secondary rounded-4 mb-3 shadow-sm">
                      <div 
                          className={`bg-secondary bg-opacity-10 p-2 px-3 d-flex align-items-center justify-content-between cursor-pointer hover-bg-input transition-all rounded-top-4 ${showCredits[p] ? 'border-bottom border-secondary' : 'rounded-bottom-4'}`} 
                          onClick={() => toggleCredits(p)}
                      >
                          <div className="d-flex align-items-center gap-3">
                              <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                                  <i className="bi bi-shield-check"></i>
                              </div>
                              <span className="fw-bold text-main small text-uppercase ls-1">Tax Credits & Deductions</span>
                          </div>
                          <i className={`bi bi-chevron-${showCredits[p] ? 'up' : 'down'} text-muted`}></i>
                      </div>
                      
                      {showCredits[p] && (
                          <div className="p-3 bg-input rounded-bottom-4">
                              <div className="row g-2">
                                  
                                  {/* Left Column: Disability & Caregiver */}
                                  <div className="col-12 col-md-6 d-flex flex-column gap-2 pt-1">
                                      
                                      {/* Disability Tax Credit */}
                                      <div className="d-flex align-items-center justify-content-between bg-black bg-opacity-10 rounded-3 px-3 py-2 border border-secondary border-opacity-25">
                                          <span className="small fw-medium text-main d-flex align-items-center gap-1">
                                              Disability Tax Credit
                                              <InfoBtn title="Disability Tax Credit" text="A non-refundable tax credit that helps persons with disabilities or their supporting persons reduce the amount of income tax they may have to pay.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/segments/tax-credits-deductions-persons-disabilities/disability-tax-credit.html' target='_blank'>Learn more on Canada.ca</a>" />
                                          </span>
                                          <div className="form-check form-switch mb-0">
                                              <input className="form-check-input cursor-pointer m-0 shadow-none" type="checkbox" id={`${p}_disability`} checked={data.inputs[`${p}_disability`] || false} onChange={(e) => updateInput(`${p}_disability`, e.target.checked)} />
                                          </div>
                                      </div>
                                      
                                      {/* Caregiver Block */}
                                      <div className="bg-black bg-opacity-10 border border-secondary border-opacity-25 rounded-3 p-2">
                                          <div className="d-flex align-items-center px-1 mb-2">
                                              <span className="small fw-medium text-main mb-0 me-1">Canada Caregiver Credit</span>
                                              <InfoBtn title="Canada Caregiver Amount" text="This non-refundable tax credit helps caregivers with the expenses involved with taking care of their spouse or common-law partner or dependant who has an impairment in physical or mental functions.<br/><br/>Enter the number of eligible dependants you are claiming for this credit.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/canada-caregiver-amount.html' target='_blank'>Learn more on Canada.ca</a>" />
                                          </div>
                                          
                                          <div className="d-flex align-items-center justify-content-between bg-black bg-opacity-25 rounded-pill px-3 py-1 mb-2 border border-secondary border-opacity-25 user-select-none">
                                              <span className="small fw-medium text-muted">Under 18</span>
                                              <div className="d-flex align-items-center gap-3">
                                                  <i className="bi bi-dash-circle cursor-pointer text-muted hover-text-main transition-all fs-6" onClick={() => updateInput(`${p}_caregiver_under_18`, Math.max(0, (data.inputs[`${p}_caregiver_under_18`] || 0) - 1))}></i>
                                                  <span className="fw-bold text-main" style={{width: '12px', textAlign: 'center'}}>{data.inputs[`${p}_caregiver_under_18`] || 0}</span>
                                                  <i className="bi bi-plus-circle cursor-pointer text-muted hover-text-main transition-all fs-6" onClick={() => updateInput(`${p}_caregiver_under_18`, Math.min(9, (data.inputs[`${p}_caregiver_under_18`] || 0) + 1))}></i>
                                              </div>
                                          </div>

                                          <div className="d-flex align-items-center justify-content-between bg-black bg-opacity-25 rounded-pill px-3 py-1 border border-secondary border-opacity-25 user-select-none">
                                              <span className="small fw-medium text-muted">18 or Older</span>
                                              <div className="d-flex align-items-center gap-3">
                                                  <i className="bi bi-dash-circle cursor-pointer text-muted hover-text-main transition-all fs-6" onClick={() => updateInput(`${p}_caregiver_over_18`, Math.max(0, (data.inputs[`${p}_caregiver_over_18`] || 0) - 1))}></i>
                                                  <span className="fw-bold text-main" style={{width: '12px', textAlign: 'center'}}>{data.inputs[`${p}_caregiver_over_18`] || 0}</span>
                                                  <i className="bi bi-plus-circle cursor-pointer text-muted hover-text-main transition-all fs-6" onClick={() => updateInput(`${p}_caregiver_over_18`, Math.min(9, (data.inputs[`${p}_caregiver_over_18`] || 0) + 1))}></i>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                                  
                                  {/* Right Column: Home Buyer, Medical, Donations */}
                                  <div className="col-12 col-md-6 d-flex flex-column gap-2 pt-1">
                                      
                                      {/* Home Buyer */}
                                      <div className="d-flex align-items-center justify-content-between bg-black bg-opacity-10 rounded-3 px-3 py-2 border border-secondary border-opacity-25 user-select-none">
                                          <span className="small fw-medium text-main d-flex align-items-center gap-1">
                                              Home Buyer Yr <InfoBtn title="First-Time Home Buyer" text="Select the year you plan to buy your first home to apply the $10,000 base credit for that specific year.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-31270-home-buyers-amount.html' target='_blank'>Learn more on Canada.ca</a>"/>
                                          </span>
                                          <div className="d-flex align-items-center gap-2 bg-black bg-opacity-25 rounded-pill px-2 py-1 border border-secondary border-opacity-25">
                                              <i className="bi bi-dash-circle cursor-pointer text-muted hover-text-main transition-all fs-6" onClick={() => {
                                                  const cy = new Date().getFullYear();
                                                  const yr = data.inputs[`${p}_first_time_home_buyer_year`];
                                                  if (yr && Number(yr) > cy) updateInput(`${p}_first_time_home_buyer_year`, Number(yr) - 1);
                                                  else if (yr && Number(yr) <= cy) updateInput(`${p}_first_time_home_buyer_year`, '');
                                              }}></i>
                                              <span className="fw-bold text-main" style={{width: '36px', textAlign: 'center', fontSize: '0.85rem'}}>{data.inputs[`${p}_first_time_home_buyer_year`] || 'None'}</span>
                                              <i className="bi bi-plus-circle cursor-pointer text-muted hover-text-main transition-all fs-6" onClick={() => {
                                                  const cy = new Date().getFullYear();
                                                  const yr = data.inputs[`${p}_first_time_home_buyer_year`];
                                                  if (!yr) updateInput(`${p}_first_time_home_buyer_year`, cy);
                                                  else updateInput(`${p}_first_time_home_buyer_year`, Math.min(cy + 50, Number(yr) + 1));
                                              }}></i>
                                          </div>
                                      </div>

                                      {/* Medical Expenses */}
                                      <div className="d-flex align-items-center justify-content-between bg-black bg-opacity-10 rounded-3 px-3 py-2 border border-secondary border-opacity-25">
                                          <span className="small fw-medium text-main d-flex align-items-center gap-1">
                                              Medical Exp. <InfoBtn title="Medical Expense Tax Credit" text="Enter your total eligible medical expenses for the year. The system automatically calculates the eligible amount by subtracting the threshold (the lesser of 3% of your net income or the maximum base amount) before applying the credit rate.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/lines-33099-33199-eligible-medical-expenses-you-claim-on-your-tax-return.html' target='_blank'>Learn more on Canada.ca</a>" />
                                          </span>
                                          <div style={{ width: '120px' }}>
                                              <CurrencyInput className="form-control form-control-sm bg-black bg-opacity-25 border-secondary text-main text-end rounded-3 shadow-none py-1" value={data.inputs[`${p}_medical_expenses`] ?? ''} onChange={(val: any) => updateInput(`${p}_medical_expenses`, val)} />
                                          </div>
                                      </div>

                                      {/* Charitable Donations */}
                                      <div className="d-flex align-items-center justify-content-between bg-black bg-opacity-10 rounded-3 px-3 py-2 border border-secondary border-opacity-25">
                                          <span className="small fw-medium text-main d-flex align-items-center gap-1">
                                              Donations
                                              <InfoBtn title="Charitable Donations" text="Enter your total annual charitable donations. The system automatically calculates the tax credit using the federal and provincial 2-tiered rates.<br/><br/><a href='https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/about-your-tax-return/tax-return/completing-a-tax-return/deductions-credits-expenses/line-34900-donations-gifts.html' target='_blank'>Learn more on Canada.ca</a>" />
                                          </span>
                                          <div style={{ width: '120px' }}>
                                              <CurrencyInput className="form-control form-control-sm bg-black bg-opacity-25 border-secondary text-main text-end rounded-3 shadow-none py-1" value={data.inputs[`${p}_donations`] ?? ''} onChange={(val: any) => updateInput(`${p}_donations`, val)} />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {data.additionalIncome.filter((inc: any) => inc.owner === p).map((inc: any) => {
                      const realIdx = data.additionalIncome.indexOf(inc);
                      const updateInc = (field: string, val: any) => updateArrayItem('additionalIncome', realIdx, field, val);
                      return (
                        <div className="border border-secondary rounded-4 mb-3 shadow-sm" key={`inc_${realIdx}`}>
                          <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex justify-content-between align-items-center rounded-top-4">
                              <div className="d-flex align-items-center gap-3 w-100">
                                  <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}><i className="bi bi-briefcase-fill"></i></div>
                                  <input type="text" maxLength={50} className="form-control bg-transparent border-0 text-main fw-bold p-0 shadow-none" value={inc.name || ''} onChange={(e) => updateInc('name', e.target.value)} placeholder="Stream Name" />
                              </div>
                              <button type="button" className="btn btn-sm btn-link text-danger p-0 ms-2 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeArrayItem('additionalIncome', realIdx)}><i className="bi bi-x-lg fs-5"></i></button>
                          </div>
                          <div className="p-3 bg-input rounded-bottom-4">
                              <div className="row g-3 mb-3">
                                  <div className="col-12 col-md-5">
                                      <label className="small text-muted mb-1 fw-medium">Amount ($)</label>
                                      <CurrencyInput className="form-control form-control-sm" value={inc.amount} onChange={(val: any) => updateInc('amount', val)} />
                                  </div>
                                  <div className="col-6 col-md-4">
                                      <label className="small text-muted mb-1 fw-medium">Frequency</label>
                                      <FrequencyToggle mode="string" value={inc.freq || 'year'} onChange={(v: any) => updateInc('freq', v)} />
                                  </div>
                                  <div className="col-6 col-md-3">
                                      <label className="small text-muted mb-1 fw-medium text-nowrap">Growth (%)</label>
                                      <PercentInput className="form-control form-control-sm" value={inc.growth ?? 2.0} onChange={(val: any) => updateInc('growth', val)} />
                                  </div>
                              </div>
                              <div className="row g-3">
                                  <div className="col-12 col-md-6">
                                      <label className="small text-muted mb-1 fw-medium d-block border-bottom border-secondary border-opacity-50 pb-1">Starts</label>
                                      <div className="d-flex bg-secondary bg-opacity-10 border border-secondary rounded-pill p-1 gap-1 shadow-sm mb-2 w-100">
                                          <button type="button" onClick={() => updateInc('startMode', 'date')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.startMode === 'date' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Specific Date</button>
                                          <button type="button" onClick={() => updateInc('startMode', 'ret_relative')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.startMode === 'ret_relative' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>At Retirement</button>
                                      </div>
                                      {inc.startMode === 'ret_relative' ? (
                                          <div className="input-group input-group-sm border border-secondary rounded-pill overflow-hidden shadow-sm">
                                            <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2 shadow-none" placeholder="Yrs" value={inc.startRelative ?? 0} onChange={e => updateInc('startRelative', e.target.value)} />
                                            <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                          </div>
                                      ) : (
                                          <MonthYearStepper value={inc.start} onChange={(val: string) => updateInc('start', val)} />
                                      )}
                                  </div>
                                  <div className="col-12 col-md-6">
                                      <label className="small text-muted mb-1 fw-medium d-block border-bottom border-secondary border-opacity-50 pb-1">Ends</label>
                                      <div className="d-flex bg-secondary bg-opacity-10 border border-secondary rounded-pill p-1 gap-1 shadow-sm mb-2 w-100">
                                          <button type="button" onClick={() => updateInc('endMode', 'never')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.endMode === 'never' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Never</button>
                                          <button type="button" onClick={() => updateInc('endMode', 'date')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.endMode === 'date' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>Specific Date</button>
                                          <button type="button" onClick={() => updateInc('endMode', 'ret_relative')} className={`btn btn-sm rounded-pill fw-bold border-0 transition-all text-nowrap px-2 py-1 flex-grow-1 ${inc.endMode === 'ret_relative' ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`} style={{ fontSize: '0.7rem' }}>At Retirement</button>
                                      </div>
                                      {inc.endMode === 'ret_relative' ? (
                                          <div className="input-group input-group-sm border border-secondary rounded-pill overflow-hidden shadow-sm">
                                            <input type="number" className="form-control border-0 fw-bold bg-input text-main text-end px-2 shadow-none" placeholder="Yrs" value={inc.endRelative ?? 0} onChange={e => updateInc('endRelative', e.target.value)} />
                                            <span className="input-group-text bg-input border-0 text-muted fw-bold">yrs</span>
                                          </div>
                                      ) : inc.endMode === 'date' ? (
                                          <MonthYearStepper value={inc.end} onChange={(val: string) => updateInc('end', val)} />
                                      ) : null}
                                  </div>
                              </div>
                          </div>
                        </div>
                      );
                  })}
                  {renderTaxBox(p === 'p1' ? results?.timeline?.[0]?.taxDetailsP1 : results?.timeline?.[0]?.taxDetailsP2, p === 'p1' ? p1Gross : p2Gross, p)}
                </div>
              </div>
            </div>
          )})}
        </div>

        <div className="card border-primary border-opacity-50 bg-primary bg-opacity-10 mt-4 shadow-sm">
            <div className="card-body p-4">
              <div className="row text-center align-items-center">
                <div className="col-md-6 border-end border-primary border-opacity-25 mb-3 mb-md-0">
                  <div className="small fw-bold text-primary text-uppercase ls-1 mb-2">Total Household (Gross)</div>
                  <div className="fs-3 fw-bold text-primary mb-1">{formatCurrency(hhGross)} <span className="fs-6 text-muted fw-normal">/yr</span></div>
                  <div className="small text-muted fw-bold">{formatCurrency(hhGross / 12)} /mo</div>
                </div>
                <div className="col-md-6">
                  <div className="small fw-bold text-success text-uppercase ls-1 mb-2">Total Household (After-Tax Net)</div>
                  <div className="fs-3 fw-bold text-success mb-1">{formatCurrency(hhNet)} <span className="fs-6 text-muted fw-normal">/yr</span></div>
                  <div className="small text-muted fw-bold">{formatCurrency(hhNet / 12)} /mo</div>
                </div>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}