import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { InfoBtn, CurrencyInput, PercentInput } from '../SharedUI';

interface Props {
    isExpanded?: boolean;
    onToggle?: () => void;
}

export default function BuyVsRentAnalyzer({ isExpanded: externalIsExpanded, onToggle }: Props) {
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : localIsExpanded;
  
  const handleToggle = () => {
      if (onToggle) onToggle();
      else setLocalIsExpanded(!localIsExpanded);
  };

  const [activeTab, setActiveTab] = useState<'core' | 'adv'>('core');

  // --- CORE TIER 1 INPUTS ---
  const [homePrice, setHomePrice] = useState(1200000);
  const [downPaymentPct, setDownPaymentPct] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(4.5);
  const [monthlyRent, setMonthlyRent] = useState(3500);
  const [marketReturn, setMarketReturn] = useState(6.0);

  // --- TIER 2 ADVANCED ASSUMPTIONS ---
  const [closingCostsPct, setClosingCostsPct] = useState(2.0);
  const [realtorCommPct, setRealtorCommPct] = useState(5.0);
  const [propertyTaxRate, setPropertyTaxRate] = useState(0.75);
  const [maintenanceRate, setMaintenanceRate] = useState(1.0);
  const [condoFees, setCondoFees] = useState(0);
  const [homeInsurance, setHomeInsurance] = useState(150);

  const [rentInflation, setRentInflation] = useState(2.5);
  const [propertyAppreciation, setPropertyAppreciation] = useState(3.5);
  const [renterInsurance, setRenterInsurance] = useState(30);
  
  const timeHorizon = 25; 

  // --- THE MATH ENGINE ---
  const { data, winner, difference, finalBuyer, finalRenter } = useMemo(() => {
    let timeline = [];
    
    const downPayment = homePrice * (downPaymentPct / 100);
    const closingCosts = homePrice * (closingCostsPct / 100);
    let mortgageBal = homePrice - downPayment;
    let currentHomeValue = homePrice;
    
    let renterPortfolio = downPayment + closingCosts;
    let currentRent = monthlyRent;

    const r = (mortgageRate / 100) / 12;
    const n = timeHorizon * 12;
    const monthlyMortgage = r === 0 ? mortgageBal / n : mortgageBal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

    let currentPropertyTax = homePrice * (propertyTaxRate / 100);
    let currentMaintenance = homePrice * (maintenanceRate / 100);
    let currentCondoFees = condoFees * 12;
    let currentHomeIns = homeInsurance * 12;
    let currentRentIns = renterInsurance * 12;

    for (let year = 1; year <= timeHorizon; year++) {
      const annualInterest = mortgageBal * (mortgageRate / 100);
      const annualPrincipal = (monthlyMortgage * 12) - annualInterest;
      mortgageBal = Math.max(0, mortgageBal - annualPrincipal);
      
      const buyerTotalOutflow = (monthlyMortgage * 12) + currentPropertyTax + currentMaintenance + currentCondoFees + currentHomeIns;
      const renterTotalOutflow = (currentRent * 12) + currentRentIns;

      const cashflowDiff = buyerTotalOutflow - renterTotalOutflow;
      
      renterPortfolio *= (1 + (marketReturn / 100));
      renterPortfolio += cashflowDiff; 

      currentHomeValue *= (1 + (propertyAppreciation / 100));
      const sellingCosts = currentHomeValue * (realtorCommPct / 100);
      const buyerNetWorth = currentHomeValue - mortgageBal - sellingCosts;

      timeline.push({
        year,
        buyerNW: Math.round(buyerNetWorth),
        renterNW: Math.round(renterPortfolio),
        cashflowDiff: Math.round(cashflowDiff)
      });

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

  return (
    <>
      <style>{`
        @keyframes slideFadeIn {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtleFadeIn {
          0% { opacity: 0; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        .anim-slide-up {
          animation: slideFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .anim-fade-in {
          animation: subtleFadeIn 0.25s ease-out forwards;
        }
      `}</style>

      {!isExpanded ? (
        // --- COLLAPSED CARD VIEW (Instant render, no animations to match grid) ---
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-houses fs-4"></i>
                </div>
                <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Buy vs. Rent</h5>
            </div>
            <p className="text-muted small mb-4">Compare the unrecoverable costs of homeownership vs. investing the down payment.</p>
            
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">Target Home Price</label>
                    </div>
                    <CurrencyInput className="form-control form-control-sm" value={homePrice} onChange={setHomePrice} />
                </div>
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">Equivalent Rent/mo</label>
                    </div>
                    <CurrencyInput className="form-control form-control-sm border-secondary" value={monthlyRent} onChange={setMonthlyRent} />
                </div>
                <div className="col-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">Mort %</label>
                    </div>
                    <PercentInput className="form-control form-control-sm border-primary" value={mortgageRate} onChange={setMortgageRate} />
                </div>
                <div className="col-6">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                        <label className="form-label small fw-bold text-muted mb-0">Mkt Ret %</label>
                    </div>
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
                <button onClick={handleToggle} className="btn btn-sm btn-outline-primary rounded-pill px-4 fw-bold shadow-sm">
                    Expand Analyzer <i className="bi bi-arrows-angle-expand ms-1"></i>
                </button>
            </div>
        </div>

      ) : (

        // --- EXPANDED DASHBOARD VIEW (Animated entry) ---
        <div className="rp-card border-primary rounded-4 p-4 p-md-5 shadow-lg position-relative d-flex flex-column anim-slide-up bg-surface" style={{ zIndex: 10 }}>
          
          <button 
            className="btn btn-dark border-secondary rounded-circle shadow-sm position-absolute d-flex align-items-center justify-content-center transition-all hover-scale" 
            style={{top: '15px', right: '15px', width: '40px', height: '40px', zIndex: 20}} 
            onClick={handleToggle}
            title="Minimize Simulator"
          >
            <i className="bi bi-dash-lg text-muted"></i>
          </button>

          {/* SYMMETRICAL HEADER (3-Columns to perfectly center the winner badge) */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 mb-4 pb-4 border-bottom border-secondary border-opacity-50">
            
            {/* Left: Title Area */}
            <div className="d-flex align-items-center justify-content-center justify-content-md-start" style={{ flex: '1 1 0%', width: '100%' }}>
                <div className="bg-gradient bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3 flex-shrink-0" style={{width: '55px', height: '55px'}}>
                    <i className="bi bi-houses fs-3"></i>
                </div>
                <div>
                    <h3 className="fw-bold mb-1 text-main ls-1">Buy vs. Rent Sandbox</h3>
                    <p className="text-muted mb-0 d-none d-xl-block">Detailed unrecoverable cost & net worth modeling</p>
                </div>
            </div>
            
            {/* Center: Winner Badge */}
            <div className="d-flex align-items-center justify-content-center" style={{ flex: '1 1 0%', width: '100%' }}>
                <div className={`p-3 rounded-4 shadow-sm border w-100 text-center ${winner === 'BUYING' ? 'border-primary bg-primary bg-opacity-10' : 'border-success bg-success bg-opacity-10'}`} style={{ maxWidth: '300px' }}>
                    <div className="small fw-bold text-uppercase ls-1 text-muted mb-1 d-flex align-items-center justify-content-center" style={{fontSize: '0.75rem'}}>
                        <i className="bi bi-trophy-fill me-2 text-warning"></i> Year 25 Winner
                    </div>
                    <h4 className={`fw-bold mb-0 ${winner === 'BUYING' ? 'text-primary' : 'text-success'}`}>
                        {winner} by {formatCurrency(difference)}
                    </h4>
                </div>
            </div>

            {/* Right: Invisible Spacer to Balance the Flexbox */}
            <div className="d-none d-md-block" style={{ flex: '1 1 0%', width: '100%' }}></div>
          </div>

          <div className="row g-4">
            {/* LEFT COLUMN: INPUT TABS & CONTROL PANEL */}
            <div className="col-12 col-xl-4 d-flex flex-column gap-3">
                
              <div className="d-flex p-1 bg-black bg-opacity-50 rounded-pill shadow-inner border border-secondary border-opacity-50">
                  <button 
                    className={`btn btn-sm rounded-pill flex-grow-1 fw-bold transition-all ${activeTab === 'core' ? 'bg-primary text-white shadow' : 'text-muted border-0 hover-opacity-100'}`} 
                    onClick={() => setActiveTab('core')}
                  >
                    Core
                  </button>
                  <button 
                    className={`btn btn-sm rounded-pill flex-grow-1 fw-bold transition-all ${activeTab === 'adv' ? 'bg-primary text-white shadow' : 'text-muted border-0 hover-opacity-100'}`} 
                    onClick={() => setActiveTab('adv')}
                  >
                    Advanced
                  </button>
              </div>

              <div className="rp-card border border-secondary rounded-4 shadow-sm p-4 bg-black bg-opacity-10 d-flex flex-column gap-3 h-100">
                  
                  {/* --- TAB 1: CORE --- */}
                  {activeTab === 'core' && (
                    <div className="anim-fade-in d-flex flex-column h-100">
                        <div className="mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="small fw-bold text-main mb-0">Home Price</label>
                                    <InfoBtn align="left" title="Home Price" text="The total estimated purchase price of the property." />
                                </div>
                                <span className="small text-primary fw-bold fs-6">{formatCurrency(homePrice)}</span>
                            </div>
                            <input type="range" className="form-range" min="300000" max="3000000" step="25000" value={homePrice} onChange={(e) => setHomePrice(Number(e.target.value))} />
                        </div>

                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="small fw-bold text-muted mb-0">Down Payment %</label>
                                    <InfoBtn align="right" title="Down Payment" text="The percentage of the home's price paid upfront." />
                                </div>
                                <PercentInput className="form-control border-secondary bg-input shadow-sm" value={downPaymentPct} onChange={setDownPaymentPct} />
                            </div>
                            <div className="col-6">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                    <label className="small fw-bold text-muted mb-0">Mortgage Rate</label>
                                    <InfoBtn align="right" title="Mortgage Rate" text="The annual interest rate applied to your mortgage balance." />
                                </div>
                                <PercentInput className="form-control border-secondary bg-input shadow-sm" value={mortgageRate} onChange={setMortgageRate} />
                            </div>
                        </div>

                        <div className="pt-3 pb-3 border-top border-secondary border-opacity-50">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <div className="d-flex align-items-center gap-2">
                                    <label className="small fw-bold text-main mb-0">Alt. Monthly Rent</label>
                                    <InfoBtn align="left" title="Alternative Rent" text="How much you would expect to pay to rent an equivalent home in the same area." />
                                </div>
                                <span className="small text-success fw-bold fs-6">{formatCurrency(monthlyRent)}/mo</span>
                            </div>
                            <input type="range" className="form-range" min="1000" max="8000" step="100" value={monthlyRent} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
                        </div>

                        <div className="mt-auto pt-3 border-top border-secondary border-opacity-50">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <label className="small fw-bold text-muted mb-0">Expected Market Return</label>
                                <InfoBtn align="right" title="Market Return" text="The average annual return the renter earns by investing their down payment and monthly cashflow savings in the stock market." />
                            </div>
                            <PercentInput className="form-control border-success bg-success bg-opacity-10 text-success fw-bold shadow-sm" value={marketReturn} onChange={setMarketReturn} />
                        </div>
                    </div>
                  )}

                  {/* --- TAB 2: ADVANCED --- */}
                  {activeTab === 'adv' && (
                    <div className="anim-fade-in d-flex flex-column h-100">
                        
                        <div className="mb-2">
                            <label className="small fw-bold text-main mb-2 d-block">Transaction Costs</label>
                            <div className="row g-2">
                                <div className="col-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.7rem'}}>Closing/LTT (%)</label>
                                        <InfoBtn align="right" title="Closing Costs" text="Land Transfer Tax, legal fees, and administrative closing costs." />
                                    </div>
                                    <PercentInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={closingCostsPct} onChange={setClosingCostsPct} />
                                </div>
                                <div className="col-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.7rem'}}>Realtor Fee (%)</label>
                                        <InfoBtn align="right" title="Realtor Fee" text="Commission paid to the real estate agent when you eventually sell the home." />
                                    </div>
                                    <PercentInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={realtorCommPct} onChange={setRealtorCommPct} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 pb-2 border-top border-secondary border-opacity-50">
                            <label className="small fw-bold text-main mb-2 d-block">Ongoing Home Costs</label>
                            <div className="row g-2">
                                <div className="col-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.7rem'}}>Prop Tax/yr (%)</label>
                                        <InfoBtn align="right" title="Property Tax" text="Annual property taxes, expressed as a percentage of the home's total value." />
                                    </div>
                                    <PercentInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={propertyTaxRate} onChange={setPropertyTaxRate} />
                                </div>
                                <div className="col-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.7rem'}}>Maint/yr (%)</label>
                                        <InfoBtn align="right" title="Maintenance" text="Estimated annual maintenance and repair costs, expressed as a percentage of the home's value." />
                                    </div>
                                    <PercentInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={maintenanceRate} onChange={setMaintenanceRate} />
                                </div>
                                <div className="col-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.7rem'}}>Condo Fee /mo</label>
                                        <InfoBtn align="right" title="Condo Fees" text="Monthly condominium or HOA maintenance fees." />
                                    </div>
                                    <CurrencyInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={condoFees} onChange={setCondoFees} />
                                </div>
                                <div className="col-6">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.7rem'}}>Home Ins. /mo</label>
                                        <InfoBtn align="right" title="Home Insurance" text="Monthly homeowner's insurance premium." />
                                    </div>
                                    <CurrencyInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={homeInsurance} onChange={setHomeInsurance} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto pt-2 border-top border-secondary border-opacity-50">
                            <label className="small fw-bold text-main mb-2 d-block">Market Realities</label>
                            <div className="row g-2">
                                <div className="col-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.65rem'}}>Apprec. (%)</label>
                                        <InfoBtn align="right" title="Property Appreciation" text="Expected annual growth rate of the property's market value." />
                                    </div>
                                    <PercentInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={propertyAppreciation} onChange={setPropertyAppreciation} />
                                </div>
                                <div className="col-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.65rem'}}>Rent Infl. (%)</label>
                                        <InfoBtn align="right" title="Rent Inflation" text="Expected annual increase in your monthly rent." />
                                    </div>
                                    <PercentInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={rentInflation} onChange={setRentInflation} />
                                </div>
                                <div className="col-4">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                        <label className="small text-muted fw-bold mb-0" style={{fontSize: '0.65rem'}}>Rent Ins/mo</label>
                                        <InfoBtn align="right" title="Renter Insurance" text="Monthly renter's insurance premium." />
                                    </div>
                                    <CurrencyInput className="form-control form-control-sm border-secondary bg-input shadow-sm" value={renterInsurance} onChange={setRenterInsurance} />
                                </div>
                            </div>
                        </div>

                    </div>
                  )}

              </div>
            </div>

            {/* RIGHT COLUMN: VISUALIZATION */}
            <div className="col-12 col-xl-8">
              <div className="rp-card border border-secondary rounded-4 shadow-sm p-4 p-md-5 h-100 bg-secondary bg-opacity-10 d-flex flex-column">
                <h5 className="fw-bold text-uppercase ls-1 mb-4 d-flex align-items-center">
                  <i className="bi bi-bar-chart-fill text-info me-3 fs-4"></i> Net Worth Trajectory
                  <InfoBtn align="left" title="How is this calculated?" text="This chart compares <b>Liquid Net Worth</b>.<br><br><b>Buyer:</b> The value of the home minus the remaining mortgage and the realtor fees required to sell it.<br><br><b>Renter:</b> The initial down payment and closing costs invested in the market, plus the monthly cashflow difference between the cost of owning vs renting." />
                </h5>
                
                <div className="flex-grow-1 position-relative" style={{ minHeight: '450px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis 
                        dataKey="year" 
                        stroke="#888" 
                        tick={{ fill: '#888', fontSize: 13 }} 
                        tickFormatter={(val) => `Yr ${val}`} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#888" 
                        tick={{ fill: '#888', fontSize: 13 }} 
                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} 
                        width={65} 
                        axisLine={false}
                        tickLine={false}
                        dx={-10}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bs-gray-900)', borderColor: 'var(--bs-border-color)', borderRadius: '12px', color: '#fff', padding: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}
                        itemStyle={{ fontWeight: 'bold', padding: '4px 0' }}
                        formatter={(value: any) => formatCurrency(Number(value) || 0)}
                        labelFormatter={(label) => <span className="text-muted fw-bold text-uppercase ls-1" style={{fontSize: '0.75rem'}}>Year {label}</span>}
                        cursor={{ stroke: 'rgba(255,255,255,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        height={40} 
                        iconType="circle" 
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '14px', fontWeight: '500' }}
                      />
                      
                      <Line 
                        type="monotone" 
                        name="Buyer Equity" 
                        dataKey="buyerNW" 
                        stroke="var(--bs-primary)" 
                        strokeWidth={4} 
                        dot={false} 
                        activeDot={{ r: 7, strokeWidth: 0, fill: 'var(--bs-primary)' }} 
                        animationDuration={1500}
                      />
                      <Line 
                        type="monotone" 
                        name="Renter Portfolio" 
                        dataKey="renterNW" 
                        stroke="var(--bs-success)" 
                        strokeWidth={4} 
                        dot={false} 
                        activeDot={{ r: 7, strokeWidth: 0, fill: 'var(--bs-success)' }} 
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}