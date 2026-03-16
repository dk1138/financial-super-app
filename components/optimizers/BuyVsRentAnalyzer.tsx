import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { InfoBtn, CurrencyInput } from './SharedUI';

export default function BuyVsRentAnalyzer() {
  // --- CORE TIER 1 INPUTS ---
  const [homePrice, setHomePrice] = useState(1200000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(4.5);
  const [monthlyRent, setMonthlyRent] = useState(3500);
  const [marketReturn, setMarketReturn] = useState(6.0);

  // --- TIER 2 ADVANCED ASSUMPTIONS ---
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Buying Costs
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
  const { data, winner, difference } = useMemo(() => {
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

    const finalBuyer = timeline[timeHorizon - 1].buyerNW;
    const finalRenter = timeline[timeHorizon - 1].renterNW;
    
    return {
      data: timeline,
      winner: finalBuyer > finalRenter ? 'Buying' : 'Renting',
      difference: Math.abs(finalBuyer - finalRenter)
    };
  }, [homePrice, downPaymentPct, mortgageRate, monthlyRent, marketReturn, closingCostsPct, realtorCommPct, propertyTaxRate, maintenanceRate, condoFees, homeInsurance, rentInflation, propertyAppreciation, renterInsurance]);

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="d-flex flex-column gap-4">
      {/* HEADER & SUMMARY */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h4 className="fw-bold mb-1 text-main d-flex align-items-center gap-2">
            <i className="bi bi-house-door text-primary"></i> Buy vs. Rent Sandbox
          </h4>
          <p className="text-muted small mb-0">Compare the unrecoverable costs of homeownership vs. investing the down payment.</p>
        </div>
        <div className={`p-3 rounded-4 shadow-sm border ${winner === 'Buying' ? 'border-primary bg-primary bg-opacity-10' : 'border-success bg-success bg-opacity-10'} text-center px-4`}>
          <div className="small fw-bold text-uppercase ls-1 text-muted mb-1">Year 25 Winner</div>
          <h5 className={`fw-bold mb-0 ${winner === 'Buying' ? 'text-primary' : 'text-success'}`}>
            {winner} by {formatCurrency(difference)}
          </h5>
        </div>
      </div>

      <div className="row g-4">
        {/* LEFT COLUMN: INPUTS */}
        <div className="col-12 col-xl-4 d-flex flex-column gap-3">
            
          {/* TIER 1: CORE INPUTS */}
          <div className="rp-card border border-secondary rounded-4 shadow-sm p-4 bg-secondary bg-opacity-10 d-flex flex-column gap-3">
            <h6 className="fw-bold text-uppercase ls-1 mb-2 border-bottom border-secondary pb-2">Core Parameters</h6>
            
            <div>
              <div className="d-flex justify-content-between mb-1">
                <label className="small fw-bold text-main">Home Price</label>
                <span className="small text-muted">{formatCurrency(homePrice)}</span>
              </div>
              <input type="range" className="form-range" min="300000" max="3000000" step="25000" value={homePrice} onChange={(e) => setHomePrice(Number(e.target.value))} />
            </div>

            <div className="row g-2">
                <div className="col-6">
                    <label className="small fw-bold text-main mb-1">Down Payment %</label>
                    <div className="input-group input-group-sm shadow-sm">
                        <input type="number" className="form-control border-secondary bg-input text-main" value={downPaymentPct} onChange={(e) => setDownPaymentPct(Number(e.target.value))} />
                        <span className="input-group-text border-secondary bg-secondary bg-opacity-25 text-muted">%</span>
                    </div>
                </div>
                <div className="col-6">
                    <label className="small fw-bold text-main mb-1">Mortgage Rate</label>
                    <div className="input-group input-group-sm shadow-sm">
                        <input type="number" className="form-control border-secondary bg-input text-main" step="0.1" value={mortgageRate} onChange={(e) => setMortgageRate(Number(e.target.value))} />
                        <span className="input-group-text border-secondary bg-secondary bg-opacity-25 text-muted">%</span>
                    </div>
                </div>
            </div>

            <div className="pt-2 border-top border-secondary">
              <div className="d-flex justify-content-between mb-1">
                <label className="small fw-bold text-main">Alternative Monthly Rent</label>
                <span className="small text-muted">{formatCurrency(monthlyRent)}/mo</span>
              </div>
              <input type="range" className="form-range" min="1000" max="8000" step="100" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
            </div>

            <div>
              <div className="d-flex justify-content-between mb-1">
                <label className="small fw-bold text-main">Expected Market Return</label>
                <InfoBtn align="right" title="Market Return" text="The average annual return the renter earns by investing their down payment and monthly cashflow savings." />
              </div>
              <div className="input-group input-group-sm shadow-sm">
                  <input type="number" className="form-control border-secondary bg-input text-main" step="0.1" value={marketReturn} onChange={(e) => setMarketReturn(Number(e.target.value))} />
                  <span className="input-group-text border-secondary bg-secondary bg-opacity-25 text-muted">%</span>
              </div>
            </div>
          </div>

          {/* TIER 2: ADVANCED ASSUMPTIONS TOGGLE */}
          <button 
            className="btn btn-outline-secondary rounded-4 py-2 shadow-sm d-flex justify-content-between align-items-center"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <span className="fw-bold small text-uppercase ls-1"><i className="bi bi-gear-fill me-2"></i> Advanced Assumptions</span>
            <i className={`bi bi-chevron-${showAdvanced ? 'up' : 'down'}`}></i>
          </button>

          {showAdvanced && (
            <div className="rp-card border border-secondary rounded-4 shadow-sm p-4 bg-input transition-all">
                
                <h6 className="small fw-bold text-muted text-uppercase ls-1 mb-3">Buying: One-Time Costs</h6>
                <div className="row g-2 mb-3">
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Closing Costs (LTT)</label>
                        <div className="input-group input-group-sm"><input type="number" step="0.1" className="form-control border-secondary bg-transparent text-main" value={closingCostsPct} onChange={(e) => setClosingCostsPct(Number(e.target.value))} /><span className="input-group-text border-secondary bg-transparent text-muted">%</span></div>
                    </div>
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Selling Realtor Fee</label>
                        <div className="input-group input-group-sm"><input type="number" step="0.1" className="form-control border-secondary bg-transparent text-main" value={realtorCommPct} onChange={(e) => setRealtorCommPct(Number(e.target.value))} /><span className="input-group-text border-secondary bg-transparent text-muted">%</span></div>
                    </div>
                </div>

                <h6 className="small fw-bold text-muted text-uppercase ls-1 mb-3">Buying: Ongoing Costs</h6>
                <div className="row g-2 mb-3">
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Property Tax/yr</label>
                        <div className="input-group input-group-sm"><input type="number" step="0.05" className="form-control border-secondary bg-transparent text-main" value={propertyTaxRate} onChange={(e) => setPropertyTaxRate(Number(e.target.value))} /><span className="input-group-text border-secondary bg-transparent text-muted">%</span></div>
                    </div>
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Maintenance/yr</label>
                        <div className="input-group input-group-sm"><input type="number" step="0.1" className="form-control border-secondary bg-transparent text-main" value={maintenanceRate} onChange={(e) => setMaintenanceRate(Number(e.target.value))} /><span className="input-group-text border-secondary bg-transparent text-muted">%</span></div>
                    </div>
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Condo/HOA Fee</label>
                        <CurrencyInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={condoFees} onChange={(val: any) => setCondoFees(val)} />
                    </div>
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Home Ins. /mo</label>
                        <CurrencyInput className="form-control form-control-sm border-secondary bg-transparent text-main" value={homeInsurance} onChange={(val: any) => setHomeInsurance(val)} />
                    </div>
                </div>

                <h6 className="small fw-bold text-muted text-uppercase ls-1 mb-3 pt-2 border-top border-secondary">Market Realities</h6>
                <div className="row g-2">
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Property Apprec.</label>
                        <div className="input-group input-group-sm"><input type="number" step="0.1" className="form-control border-secondary bg-transparent text-main" value={propertyAppreciation} onChange={(e) => setPropertyAppreciation(Number(e.target.value))} /><span className="input-group-text border-secondary bg-transparent text-muted">%</span></div>
                    </div>
                    <div className="col-6">
                        <label className="small text-muted mb-1" style={{fontSize: '0.7rem'}}>Rent Inflation</label>
                        <div className="input-group input-group-sm"><input type="number" step="0.1" className="form-control border-secondary bg-transparent text-main" value={rentInflation} onChange={(e) => setRentInflation(Number(e.target.value))} /><span className="input-group-text border-secondary bg-transparent text-muted">%</span></div>
                    </div>
                </div>

            </div>
          )}
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
                    formatter={(value: number) => formatCurrency(value)}
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