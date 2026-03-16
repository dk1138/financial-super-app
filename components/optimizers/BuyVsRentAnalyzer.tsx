import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

export default function BuyVsRentAnalyzer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'core' | 'adv'>('core');

  // --- CORE TIER 1 INPUTS ---
  const [homePrice, setHomePrice] = useState(1200000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(4.5);
  const [monthlyRent, setMonthlyRent] = useState(3500);
  const [marketReturn, setMarketReturn] = useState(6.0);

  // --- TIER 2 ADVANCED ASSUMPTIONS ---
  const [closingCostsPct, setClosingCostsPct] = useState(2.0); // Land Transfer, Legal
  const [realtorCommPct, setRealtorCommPct] = useState(5.0); // Paid when selling
  const [propertyTaxRate, setPropertyTaxRate] = useState(0.75); // Vaughan/GTA standard
  const [maintenanceRate, setMaintenanceRate] = useState(1.0);
  const [condoFees, setCondoFees] = useState(0);
  const [homeInsurance, setHomeInsurance] = useState(150);

  // Renting / Market
  const [rentInflation, setRentInflation] = useState(2.5);
  const [propertyAppreciation, setPropertyAppreciation] = useState(3.5);
  const [renterInsurance, setRenterInsurance] = useState(30);
  
  const timeHorizon = 25; // Standard 25-year amortization view

  // --- THE MATH ENGINE ---
  const { data, winner, difference, finalBuyer, finalRenter } = useMemo(() => {
    let timeline = [];
    
    // Initial Variables
    const downPayment = homePrice * (downPaymentPct / 100);
    const closingCosts = homePrice * (closingCostsPct / 100);
    let mortgageBal = homePrice - downPayment;
    let currentHomeValue = homePrice;
    
    // Renter invests the exact same upfront cash the buyer had to burn
    let renterPortfolio = downPayment + closingCosts;
    let currentRent = monthlyRent;

    // Canadian Mortgage Math (Approx monthly for sandbox)
    const r = (mortgageRate / 100) / 12;
    const n = timeHorizon * 12;
    const monthlyMortgage = r === 0 ? mortgageBal / n : mortgageBal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    // Inflating Variables
    let currentPropertyTax = homePrice * (propertyTaxRate / 100);
    let currentMaintenance = homePrice * (maintenanceRate / 100);
    let currentCondoFees = condoFees * 12;
    let currentHomeIns = homeInsurance * 12;
    let currentRentIns = renterInsurance * 12;

    for (let year = 1; year <= timeHorizon; year++) {
      // 1. Buyer Cashflow
      const annualInterest = mortgageBal * (mortgageRate / 100); // Rough annual estimate
      const annualPrincipal = (monthlyMortgage * 12) - annualInterest;
      mortgageBal = Math.max(0, mortgageBal - annualPrincipal);
      
      const buyerTotalOutflow = (monthlyMortgage * 12) + currentPropertyTax + currentMaintenance + currentCondoFees + currentHomeIns;

      // 2. Renter Cashflow
      const renterTotalOutflow = (currentRent * 12) + currentRentIns;

      // 3. The Opportunity Cost Differential
      const cashflowDiff = buyerTotalOutflow - renterTotalOutflow;
      
      // Renter portfolio grows, plus they invest the monthly savings (or withdraw if rent is more expensive!)
      renterPortfolio *= (1 + (marketReturn / 100));
      renterPortfolio += cashflowDiff; 

      // 4. Update Net Worths
      currentHomeValue *= (1 + (propertyAppreciation / 100));
      const sellingCosts = currentHomeValue * (realtorCommPct / 100);
      const buyerNetWorth = currentHomeValue - mortgageBal - sellingCosts;

      timeline.push({
        year,
        buyerNW: Math.round(buyerNetWorth),
        renterNW: Math.round(renterPortfolio),
        cashflowDiff: Math.round(cashflowDiff)
      });

      // 5. Inflate for next year
      currentRent *= (1 + (rentInflation / 100));
      currentPropertyTax *= (1 + (propertyAppreciation / 100)); 
      currentMaintenance *= (1 + (rentInflation / 100));
      currentCondoFees *= (1 + (rentInflation / 100));
      currentHomeIns *= (1 + (rentInflation / 100));
      currentRentIns *= (1 + (rentInflation / 100));
    }

    const endBuyer = timeline[timeHorizon - 1].buyerNW;
    const endRenter = timeline[timeHorizon - 1].renterNW;
    
    return {
      data: timeline,
      winner: endBuyer > endRenter ? 'BUYING' : 'RENTING',
      difference: Math.abs(endBuyer - endRenter),
      finalBuyer: endBuyer,
      finalRenter: endRenter
    };
  }, [homePrice, downPaymentPct, mortgageRate, monthlyRent, marketReturn, closingCostsPct, realtorCommPct, propertyTaxRate, maintenanceRate, condoFees, homeInsurance, rentInflation, propertyAppreciation, renterInsurance]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

  // =======================================================================
  // COLLAPSED CARD VIEW
  // =======================================================================
  if (!isExpanded) {
      return (
          <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm transition-all hover-border-primary">
              <div className="d-flex align-items-center mb-3">
                  <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                      <i className="bi bi-houses fs-4"></i>
                  </div>
                  <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Buy vs. Rent</h5>
              </div>
              <p className="text-muted small mb-4">Compare the unrecoverable costs of homeownership vs. investing the down payment.</p>
              
              <div className="row g-3 mb-4">
                  <div className="col-12">
                      <label className="form-label small fw-bold text-muted mb-1">Target Home Price</label>
                      <CurrencyInput className="form-control form-control-sm" value={homePrice} onChange={setHomePrice} />
                  </div>
                  <div className="col-12">
                      <label className="form-label small fw-bold text-muted mb-1">Equivalent Rent/mo</label>
                      <CurrencyInput className="form-control form-control-sm border-secondary" value={monthlyRent} onChange={setMonthlyRent} />
                  </div>
                  <div className="col-6">
                      <label className="form-label small fw-bold text-muted mb-1">Mort %</label>
                      <PercentInput className="form-control form-control-sm border-primary" value={mortgageRate} onChange={setMortgageRate} />
                  </div>
                  <div className="col-6">
                      <label className="form-label small fw-bold text-muted mb-1">Mkt Ret %</label>
                      <PercentInput className="form-control form-control-sm border-success" value={marketReturn} onChange={setMarketReturn} />
                  </div>
              </div>

              <div className="row g-2 mt-auto text-center">
                  <div className="col-6">
                      <div className={`p-2 rounded-3 border h-100 d-flex flex-column justify-content-center ${winner === 'BUYING' ? 'bg-primary bg-opacity-10 border-primary' : 'bg-black bg-opacity-25 border-secondary'}`}>
                          <div className="text-muted fw-bold" style={{fontSize: '0.65rem'}}>BUYER NET WORTH</div>
                          <div className={`fs-5 fw-bold ${winner === 'BUYING' ? 'text-primary' : 'text-main'}`}>{formatCurrency(finalBuyer)}</div>
                      </div>
                  </div>
                  <div className="col-6">
                      <div className={`p-2 rounded-3 border h-100 d-flex flex-column justify-content-center ${winner === 'RENTING' ? 'bg-success bg-opacity-10 border-success' : 'bg-black bg-opacity-25 border-secondary'}`}>
                          <div className="text-muted fw-bold" style={{fontSize: '0.65rem'}}>RENTER NET WORTH</div>
                          <div className={`fs-5 fw-bold ${winner === 'RENTING' ? 'text-success' : 'text-main'}`}>{formatCurrency(finalRenter)}</div>
                      </div>
                  </div>
              </div>
              
              <div className="text-center mt-3 pt-3 border-top border-secondary">
                  <h6 className="fw-bold mb-2 small">Winner: <span className={winner === 'RENTING' ? 'text-success' : 'text-primary'}>{winner}</span></h6>
                  <button onClick={() => setIsExpanded(true)} className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold shadow-sm">
                      Expand Analyzer <i className="bi bi-arrows-angle-expand ms-1"></i>
                  </button>
              </div>
          </div>
      );
  }

  // =======================================================================
  // EXPANDED DASHBOARD VIEW
  // =======================================================================
  return (
    <div className="rp-card border-primary rounded-4 p-4 shadow-lg position-relative d-flex flex-column" style={{ zIndex: 10 }}>
      {/* HEADER & SUMMARY */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary">
        <div className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '50px', height: '50px'}}>
                <i className="bi bi-houses fs-4"></i>
            </div>
            <div>
            <h4 className="fw-bold mb-1 text-main">Buy vs. Rent Sandbox</h4>
            <p className="text-muted small mb-0">Detailed unrecoverable cost & net worth modeling (25 Yrs)</p>
            </div>
        </div>
        <div className="d-flex align-items-center gap-3">
            <div className={`p-2 rounded-3 shadow-sm border ${winner === 'BUYING' ? 'border-primary bg-primary bg-opacity-10' : 'border-success bg-success bg-opacity-10'} text-center px-4`}>
            <div className="small fw-bold text-uppercase ls-1 text-muted mb-1" style={{fontSize: '0.7rem'}}>Year 25 Winner</div>
            <h5 className={`fw-bold mb-0 ${winner === 'BUYING' ? 'text-primary' : 'text-success'}`}>
                {winner} by {formatCurrency(difference)}
            </h5>
            </div>
            <button className="btn btn-outline-secondary rounded-circle shadow-sm ms-2" style={{width: '40px', height: '40px'}} onClick={() => setIsExpanded(false)}>
                <i className="bi bi-x-lg"></i>
            </button>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: INPUT TABS */}
        <div className="col-12 col-xl-4 d-flex flex-column gap-3">
            
          <div className="d-flex p-1 bg-black bg-opacity-25 rounded-pill shadow-inner border border-secondary">
              <button 
                className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${activeTab === 'core' ? 'bg-primary text-white shadow-sm' : 'text-muted border-0 hover-opacity-100'}`} 
                onClick={() => setActiveTab('core')}
              >
                Core Params
              </button>
              <button 
                className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${activeTab === 'adv' ? 'bg-primary text-white shadow-sm' : 'text-muted border-0 hover-opacity-100'}`} 
                onClick={() => setActiveTab('adv')}
              >
                Advanced
              </button>
          </div>

          <div className="rp-card border border-secondary rounded-4 shadow-sm p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-3 h-100">
              
              {/* --- TAB 1: CORE --- */}
              {activeTab === 'core' && (
                <>
                    <div>
                        <div className="d-flex justify-content-between mb-1">
                            <label className="small fw-bold text-main">Home Price</label>
                            <span className="small text-primary fw-bold">{formatCurrency(homePrice)}</span>
                        </div>
                        <input type="range" className="form-range" min="300000" max="3000000" step="25000" value={homePrice} onChange={(e) => setHomePrice(Number(e.target.value))} />
                    </div>

                    <div className="row g-2">
                        <div className="col-6">
                            <label className="small fw-bold text-muted mb-1">Down Payment %</label>
                            <PercentInput className="form-control form-control-sm border-secondary" value={downPaymentPct} onChange={setDownPaymentPct} />
                        </div>
                        <div className="col-6">
                            <label className="small fw-bold text-muted mb-1">Mortgage Rate</label>
                            <PercentInput className="form-control form-control-sm border-secondary" value={mortgageRate} onChange={setMortgageRate} />
                        </div>
                    </div>

                    <div className="pt-3 border-top border-secondary">
                        <div className="d-flex justify-content-between mb-1">
                            <label className="small fw-bold text-main">Alt. Monthly Rent</label>
                            <span className="small text-success fw-bold">{formatCurrency(monthlyRent)}/mo</span>
                        </div>
                        <input type="range" className="form-range" min="1000" max="8000" step="100" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
                    </div>

                    <div className="mt-auto pt-3">
                        <div className="d-flex justify-content-between mb-1">
                            <label className="small fw-bold text-muted">Expected Market Return</label>
                            <InfoBtn align="right" title="Market Return" text="The average annual return the renter earns by investing their down payment and monthly cashflow savings." />
                        </div>
                        <PercentInput className="form-control form-control-sm border-success" value={marketReturn} onChange={setMarketReturn} />
                    </div>
                </>
              )}

              {/* --- TAB 2: ADVANCED --- */}
              {activeTab === 'adv' && (
                <div className="d-flex flex-column gap-3 overflow-auto" style={{maxHeight: '400px'}}>
                    <div>
                        <h6 className="small fw-bold text-primary text-uppercase ls-1 mb-2 border-bottom border-secondary pb-1">Buy: One-Time Costs</h6>
                        <div className="row g-2">
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Closing/LTT (%)</label>
                                <PercentInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={closingCostsPct} onChange={setClosingCostsPct} />
                            </div>
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Realtor Fee (%)</label>
                                <PercentInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={realtorCommPct} onChange={setRealtorCommPct} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h6 className="small fw-bold text-primary text-uppercase ls-1 mb-2 border-bottom border-secondary pb-1">Buy: Ongoing Costs</h6>
                        <div className="row g-2">
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Prop Tax/yr (%)</label>
                                <PercentInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={propertyTaxRate} onChange={setPropertyTaxRate} />
                            </div>
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Maint/yr (%)</label>
                                <PercentInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={maintenanceRate} onChange={setMaintenanceRate} />
                            </div>
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Condo Fee /mo</label>
                                <CurrencyInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={condoFees} onChange={setCondoFees} />
                            </div>
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Home Ins. /mo</label>
                                <CurrencyInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={homeInsurance} onChange={setHomeInsurance} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h6 className="small fw-bold text-success text-uppercase ls-1 mb-2 border-bottom border-secondary pb-1">Market Realities</h6>
                        <div className="row g-2">
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Prop Apprec. (%)</label>
                                <PercentInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={propertyAppreciation} onChange={setPropertyAppreciation} />
                            </div>
                            <div className="col-6">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Rent Infl. (%)</label>
                                <PercentInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={rentInflation} onChange={setRentInflation} />
                            </div>
                            <div className="col-12 mt-2">
                                <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Renter Insurance /mo</label>
                                <CurrencyInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={renterInsurance} onChange={setRenterInsurance} />
                            </div>
                        </div>
                    </div>
                </div>
              )}

          </div>
        </div>

        {/* RIGHT COLUMN: VISUALIZATION */}
        <div className="col-12 col-xl-8">
          <div className="rp-card border border-secondary rounded-4 shadow-sm p-4 h-100 surface-card d-flex flex-column">
            <h6 className="fw-bold text-uppercase ls-1 mb-4 d-flex align-items-center">
              <i className="bi bi-graph-up text-info me-2"></i> Net Worth Trajectory (25 Years)
              <InfoBtn align="left" title="How is this calculated?" text="This chart compares <b>Liquid Net Worth</b>.<br><br><b>Buyer:</b> The value of the home minus the remaining mortgage and the realtor fees required to sell it.<br><br><b>Renter:</b> The initial down payment and closing costs invested in the market, plus the monthly cashflow difference between the cost of owning vs renting." />
            </h6>
            
            <div className="flex-grow-1" style={{ minHeight: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis dataKey="year" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickFormatter={(val) => `Yr ${val}`} />
                  <YAxis 
                    stroke="#888" 
                    tick={{ fill: '#888', fontSize: 12 }} 
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                    width={60} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bs-gray-900)', borderColor: 'var(--bs-border-color)', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                    labelFormatter={(label) => `Year ${label}`}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  
                  <Line type="monotone" name="Buyer Equity" dataKey="buyerNW" stroke="var(--bs-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" name="Renter Portfolio" dataKey="renterNW" stroke="var(--bs-success)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}