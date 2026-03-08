import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, Filler } from 'chart.js';
import { Line as ChartJSLine } from 'react-chartjs-2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { InfoBtn, SegmentedControl, CurrencyInput, PercentInput } from './SharedUI';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, ChartTooltip, Legend, Filler);

export default function RiskTab() {
  const { data, results } = useFinance();
  
  // Monte Carlo States
  const [simCount, setSimCount] = useState(100);
  const [method, setMethod] = useState('random');
  const [volatility, setVolatility] = useState(0.12);
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);

  // SORR States
  const [sorrData, setSorrData] = useState<any[]>([]);
  const [isSorrSuccess, setIsSorrSuccess] = useState(false);
  const [shortfallYear, setShortfallYear] = useState<number | null>(null);
  const [isSorrCalculating, setIsSorrCalculating] = useState(true);

  // Life & Macro Stress Test States
  const [ltcAge, setLtcAge] = useState(82);
  const [ltcCost, setLtcCost] = useState(80000);
  const [ltcDuration, setLtcDuration] = useState(5);
  const [ltcResult, setLtcResult] = useState<any>(null);

  const [infRate, setInfRate] = useState(6.0);
  const [infResult, setInfResult] = useState<any>(null);

  const [widowAge, setWidowAge] = useState(75);
  const [widowResult, setWidowResult] = useState<any>(null);

  const [reCrashPct, setReCrashPct] = useState(30);
  const [reResult, setReResult] = useState<any>(null);

  const isCouple = data.mode === 'Couple';

  const formatCurrency = (val: number) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
      return `$${Math.round(val)}`;
  };

  const runSandbox = (modifyDataFn: (d: any) => void) => {
      const clonedData = JSON.parse(JSON.stringify(data));
      modifyDataFn(clonedData);
      const engine = new FinanceEngine(clonedData);
      return engine.runSimulation(true, null);
  };

  // --- CORE RISK ENGINES ---

  useEffect(() => {
      if (!results || !results.timeline) return;
      setIsSorrCalculating(true);
      
      setTimeout(() => {
          // 1. SORR MATH
          const retAge = Number(data.inputs.p1_retireAge) || 65;
          const currentAge = Number(data.inputs.p1_age) || 35;
          const retYearIndex = Math.max(0, retAge - currentAge);
          
          const shockSeq = new Array(100).fill(0);
          shockSeq[retYearIndex] = -0.35;      
          shockSeq[retYearIndex + 1] = -0.15;  
          shockSeq[retYearIndex + 2] = 0.05;   
          shockSeq[retYearIndex + 3] = 0.05;   

          const clonedData = JSON.parse(JSON.stringify(data));
          const sorrEngine = new FinanceEngine(clonedData);
          const sorrTimeline = sorrEngine.runSimulation(true, { shockSequence: shockSeq });

          let localChartData: any[] = [];
          let failedYear = null;
          let ok = true;

          for (let i=0; i<results.timeline.length; i++) {
              const baseYear = results.timeline[i];
              const sorrYear = sorrTimeline[i];
              if (!baseYear || !sorrYear) break;

              const baseNW = baseYear.liquidNW + (baseYear.reIncludedEq || 0);
              const sorrNW = sorrYear.liquidNW + (sorrYear.reIncludedEq || 0);
              
              localChartData.push({
                  year: baseYear.year,
                  age: baseYear.p1Age,
                  Base: baseNW,
                  Crash: Math.max(0, sorrNW)
              });

              if (sorrYear.liquidNW < 1 && ok && baseYear.p1Age >= retAge) {
                  ok = false;
                  failedYear = sorrYear.p1Age;
              }
          }
          setSorrData(localChartData);
          setIsSorrSuccess(ok);
          setShortfallYear(failedYear);

          // 2. WIDOW'S PENALTY MATH
          if (isCouple) {
              const widowYr = results.timeline.find((y: any) => y.p1Age === widowAge);
              if (widowYr) {
                  const jointGovt = (widowYr.cppP1||0) + (widowYr.cppP2||0) + (widowYr.oasP1||0) + (widowYr.oasP2||0);
                  const jointPen = (widowYr.dbP1||0) + (widowYr.dbP2||0);
                  const jointInc = jointGovt + jointPen;
                  
                  const survivorCpp = Math.min(16000, (widowYr.cppP1||0) + (widowYr.cppP2||0));
                  const survivorOas = widowYr.oasP1||0;
                  const survivorPen = (widowYr.dbP1||0) + ((widowYr.dbP2||0) * 0.6); 
                  const survivorInc = survivorCpp + survivorOas + survivorPen;

                  setWidowResult({
                      jointIncome: jointInc,
                      survivorIncome: survivorInc,
                      drop: jointInc - survivorInc,
                      dropPct: jointInc > 0 ? ((jointInc - survivorInc) / jointInc) * 100 : 0
                  });
              }
          }

          setIsSorrCalculating(false);
      }, 50);
  }, [data, results, widowAge, isCouple]);

  const runLtcShock = () => {
      const p1Age = Number(data.inputs.p1_age) || 35;
      const startYearOffset = Math.max(0, ltcAge - p1Age);
      const startYearStr = `${new Date().getFullYear() + startYearOffset}-01`;

      const ltcTimeline = runSandbox((d: any) => {
          if(!d.debt) d.debt = [];
          d.debt.push({ name: 'LTC Facility', amount: ltcCost, start: startYearStr, type: 'yearly', duration: ltcDuration, rate: 0 });
      });

      const baseFinal = results?.timeline[results.timeline.length - 1];
      const ltcFinal = ltcTimeline[ltcTimeline.length - 1];

      if (baseFinal && ltcFinal) {
          const bEstate = baseFinal.afterTaxEstate !== undefined ? baseFinal.afterTaxEstate : (baseFinal.liquidNW + (baseFinal.reIncludedEq || 0));
          const lEstate = ltcFinal.afterTaxEstate !== undefined ? ltcFinal.afterTaxEstate : (ltcFinal.liquidNW + (ltcFinal.reIncludedEq || 0));
          setLtcResult({
              baseEstate: bEstate,
              shockEstate: lEstate,
              survived: ltcTimeline.every((y:any) => y.liquidNW > 0)
          });
      }
  };

  const runInflationShock = () => {
      const infTimeline = runSandbox((d: any) => { d.inputs.inflation_rate = infRate; });
      const targetAge = 85;
      
      const baseYear = results?.timeline.find((y:any) => y.p1Age === targetAge);
      const infYear = infTimeline.find((y:any) => y.p1Age === targetAge);

      if (baseYear && infYear) {
          const baseReal = (baseYear.liquidNW + (baseYear.reIncludedEq || 0)) / Math.pow(1 + ((data.inputs.inflation_rate||2.1)/100), targetAge - (data.inputs.p1_age||35));
          const infReal = (infYear.liquidNW + (infYear.reIncludedEq || 0)) / Math.pow(1 + (infRate/100), targetAge - (data.inputs.p1_age||35));
          
          setInfResult({
              basePurchasingPower: baseReal,
              shockPurchasingPower: infReal,
              lossPct: baseReal > 0 ? ((baseReal - infReal) / baseReal) * 100 : 0
          });
      }
  };

  const runReCrash = () => {
      const crashTimeline = runSandbox((d: any) => {
          if (d.properties) {
              d.properties.forEach((p:any) => {
                  p.value = p.value * (1 - (reCrashPct/100));
              });
          }
      });
      const baseFinal = results?.timeline[results.timeline.length - 1];
      const crashFinal = crashTimeline[crashTimeline.length - 1];

      if (baseFinal && crashFinal) {
          const bEstate = baseFinal.afterTaxEstate !== undefined ? baseFinal.afterTaxEstate : (baseFinal.liquidNW + (baseFinal.reIncludedEq || 0));
          const cEstate = crashFinal.afterTaxEstate !== undefined ? crashFinal.afterTaxEstate : (crashFinal.liquidNW + (crashFinal.reIncludedEq || 0));
          setReResult({
              baseEstate: bEstate,
              shockEstate: cEstate,
              drop: bEstate - cEstate
          });
      }
  };


  const runMonteCarlo = () => {
    setIsCalculating(true);
    setTimeout(() => {
      try {
        const trajectories: number[][] = [];
        const p1Age = data.inputs.p1_age || 38;
        const inflationRate = (data.inputs.inflation_rate || 2.1) / 100;
        
        for (let i = 0; i < simCount; i++) {
          const engine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
          let simContext: any = { method };
          if (method === 'historical') {
             const sp500 = FINANCIAL_CONSTANTS.SP500_HISTORICAL;
             const startIdx = Math.floor(Math.random() * sp500.length);
             simContext.histSequence = [];
             for(let y = 0; y < 100; y++) { simContext.histSequence.push(sp500[(startIdx + y) % sp500.length]); }
          } else {
             simContext.volatility = volatility;
          }
          const result = engine.runSimulation(false, simContext);
          trajectories.push(result);
        }
        
        trajectories.sort((a, b) => a[a.length - 1] - b[b.length - 1]);
        const runs = trajectories.length;
        const successCount = trajectories.filter(t => t[t.length - 1] > 0).length;
        
        setSuccessRate(Number(((successCount / runs) * 100).toFixed(1)));
        const discount = (val: number, idx: number) => Math.round(val / Math.pow(1 + inflationRate, idx));
        
        setChartData({
          labels: trajectories[0].map((_: any, i: number) => p1Age + i),
          datasets: [
            { label: 'Optimistic (Top 10%)', data: trajectories[Math.floor(runs * 0.90)].map(discount), borderColor: '#10b981', borderWidth: 2, pointRadius: 0, tension: 0.4 },
            { label: 'Median Scenario', data: trajectories[Math.floor(runs * 0.50)].map(discount), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, borderWidth: 3, pointRadius: 0, tension: 0.4 },
            { label: 'Pessimistic (Bottom 10%)', data: trajectories[Math.floor(runs * 0.10)].map(discount), borderColor: '#ef4444', borderDash: [5, 5], borderWidth: 2, pointRadius: 0, tension: 0.4 }
          ]
        });
      } catch(err) { console.error(err); alert("Simulation failed."); }
      setIsCalculating(false);
    }, 50);
  };

  const gaugeRadius = 100;
  const gaugeCircumference = Math.PI * gaugeRadius;
  const gaugeStrokeDashoffset = successRate !== null ? gaugeCircumference - (successRate / 100) * gaugeCircumference : gaugeCircumference;
  const gaugeColor = successRate !== null ? (successRate >= 90 ? '#10b981' : successRate >= 75 ? '#f59e0b' : '#ef4444') : '#6c757d';

  const chartComponent = useMemo(() => {
      if (!chartData) return (
          <div className="d-flex flex-grow-1 align-items-center justify-content-center text-muted fst-italic p-5 border border-secondary border-opacity-25 rounded" style={{ height: '500px' }}>
              Click "Run Monte Carlo" to generate projections.
          </div>
      );
      return (
          <div style={{ height: '500px', position: 'relative', width: '100%', flexGrow: 1 }}>
             <ChartJSLine data={chartData} options={{ 
                 responsive: true, maintainAspectRatio: false, interaction: { mode: 'index' as const, intersect: false }, 
                 plugins: { 
                     legend: { position: 'bottom' as const, labels: { color: '#6c757d' } },
                     tooltip: { callbacks: {
                         label: function(context) {
                             let label = context.dataset.label || '';
                             if (label) label += ': ';
                             if (context.parsed.y !== null) label += new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(context.parsed.y);
                             return label;
                         },
                         title: function(context) { return `Age ${context[0].label}`; }
                     }}
                 }, 
                 scales: { x: { grid: { color: 'rgba(108, 117, 125, 0.2)' }, ticks: { color: '#6c757d' } }, y: { grid: { color: 'rgba(108, 117, 125, 0.2)' }, ticks: { color: '#6c757d', callback: (val: any) => '$' + (val / 1000000).toFixed(1) + 'M' } } } 
             }} />
          </div>
      );
  }, [chartData]);

  const CustomSorrTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
          return (
              <div className="bg-input border border-secondary p-3 rounded-4 shadow-lg" style={{ minWidth: '220px' }}>
                  <p className="fw-bold mb-2 border-bottom border-secondary pb-2 text-muted text-uppercase ls-1" style={{fontSize: '0.75rem'}}>Age {label}</p>
                  <div className="d-flex flex-column gap-2">
                      {payload.map((entry: any, index: number) => (
                          <div key={index} className="d-flex justify-content-between align-items-center gap-4">
                              <div className="d-flex align-items-center">
                                  <span className="rounded-circle me-2" style={{width: '8px', height: '8px', backgroundColor: entry.color}}></span>
                                  <span className="fw-bold small text-muted">{entry.name}</span>
                              </div>
                              <span className="fw-bolder text-main small">{formatCurrency(entry.value)}</span>
                          </div>
                      ))}
                  </div>
              </div>
          );
      }
      return null;
  };

  return (
    <div className="p-3 p-md-4">
      
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-danger mb-0 d-flex align-items-center">
              <i className="bi bi-shield-fill-exclamation me-3"></i> Stress Testing & Risk
          </h5>
          {(isSorrCalculating || isCalculating) && <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-3 py-2 shadow-sm"><span className="spinner-border spinner-border-sm me-2"></span> Simulating...</span>}
      </div>

      {/* --- MONTE CARLO --- */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-xl-4">
          <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-gear-wide-connected me-2 text-primary"></i>Monte Carlo Setup</h5>
          <div className="rp-card p-4 surface-card border-secondary rounded-4 shadow-sm mb-4">
            <label className="form-label small fw-bold text-muted mb-2">Number of Runs</label>
            <SegmentedControl value={simCount} onChange={setSimCount} options={[{ value: 100, label: '100 (Fast)' }, { value: 500, label: '500 (Balanced)' }, { value: 1000, label: '1000 (Precise)' }]} />
            <label className="form-label small fw-bold text-muted mb-2 mt-2">Simulation Method</label>
            <SegmentedControl value={method} onChange={setMethod} options={[{ value: 'random', label: 'Standard (Bell Curve)' }, { value: 'historical', label: 'Historical (S&P500)' }]} />
            {method === 'random' && (
                <>
                    <label className="form-label small fw-bold text-muted mb-2 mt-2">Market Volatility</label>
                    <SegmentedControl value={volatility} onChange={setVolatility} options={[{ value: 0.08, label: 'Low (8%)' }, { value: 0.12, label: 'Med (12%)' }, { value: 0.16, label: 'High (16%)' }]} />
                </>
            )}
            <button className="btn btn-primary w-100 fw-bold py-2 mt-4 shadow rounded-pill" onClick={runMonteCarlo} disabled={isCalculating}>
              {isCalculating ? <><span className="spinner-border spinner-border-sm me-2"></span>Running...</> : <><i className="bi bi-play-circle-fill me-2"></i> Run Monte Carlo</>}
            </button>
          </div>

          <div className="rp-card p-4 text-center surface-card border-secondary rounded-4 shadow-sm align-items-center">
            <h6 className="text-muted small fw-bold text-uppercase ls-1 mb-3">Probability of Success</h6>
            <div className="position-relative d-flex justify-content-center" style={{ width: '240px', height: '130px', overflow: 'hidden', margin: '0 auto' }}>
                <svg width="240" height="120" viewBox="0 0 240 120">
                    <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke="rgba(108, 117, 125, 0.2)" strokeWidth="25" strokeLinecap="round" />
                    <path d="M 20 120 A 100 100 0 0 1 220 120" fill="none" stroke={gaugeColor} strokeWidth="25" strokeLinecap="round" strokeDasharray={gaugeCircumference} strokeDashoffset={gaugeStrokeDashoffset} style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 1s ease' }} />
                </svg>
                <div className="position-absolute bottom-0 text-center" style={{ marginBottom: '-10px' }}>
                    <div className="display-4 fw-bolder" style={{ color: gaugeColor }}>{successRate !== null ? `${successRate}%` : '--'}</div>
                </div>
            </div>
            <div className="mt-3 small fw-bold text-muted text-uppercase ls-1">
                {successRate === null ? 'Run simulation' : (successRate >= 90 ? 'Highly Confident' : successRate >= 75 ? 'On Track' : 'Needs Adjustment')}
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8 d-flex flex-column">
          <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-graph-up me-2 text-info"></i>Monte Carlo Distributions</h5>
          <div className="rp-card p-4 surface-card border border-secondary rounded-4 flex-grow-1 d-flex flex-column shadow-sm">
             {chartComponent}
          </div>
        </div>
      </div>

      {/* --- SORR VISUALIZER --- */}
      <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-activity me-2 text-warning"></i>Market Timing Risk</h5>
      <div className="row mb-5">
          <div className="col-12">
              <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm overflow-hidden position-relative h-100 d-flex flex-column">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-4 gap-3">
                      <div>
                          <h5 className="fw-bold text-main d-flex align-items-center mb-2">
                              Sequence of Returns Risk (SORR)
                              <InfoBtn align="left" title="Sequence of Returns Risk" text="A catastrophic sequence where a massive market crash occurs in the exact first year of your retirement, followed by several years of stagnation.<br/><br/>Because you are actively withdrawing money during the crash, your portfolio suffers permanent damage that normal average returns cannot heal." />
                          </h5>
                          <p className="text-muted small mb-0" style={{maxWidth: '600px'}}>
                              This sandbox simulates a devastating -35% market crash in the very first year of your retirement, followed by a -15% drop the next year. It stress-tests whether your withdrawal rate is low enough to survive a "Lost Decade".
                          </p>
                      </div>
                      <div className="flex-shrink-0 text-md-end">
                          <span className="small text-muted fw-bold text-uppercase ls-1 d-block mb-2">Stress Test Result</span>
                          {isSorrSuccess ? (
                              <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-4 py-2 fs-6 shadow-sm"><i className="bi bi-shield-fill-check me-2"></i> PLAN SURVIVES CRASH</span>
                          ) : (
                              <div className="d-flex flex-column align-items-md-end">
                                  <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-4 py-2 fs-6 shadow-sm mb-2"><i className="bi bi-shield-fill-x me-2"></i> PLAN FAILS AT AGE {shortfallYear}</span>
                                  <span className="small text-muted fst-italic">Consider enabling Guardrails in the Strategy tab.</span>
                              </div>
                          )}
                      </div>
                  </div>

                  <div className="flex-grow-1" style={{ height: '400px' }}>
                      {sorrData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={sorrData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.4} />
                                  <XAxis dataKey="age" stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} tickMargin={12} minTickGap={30} />
                                  <YAxis tickFormatter={(val) => formatCurrency(val)} stroke="#888" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} width={80} axisLine={false} tickLine={false} />
                                  <Tooltip content={<CustomSorrTooltip />} cursor={{ stroke: 'var(--bs-danger)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                  <ReferenceLine x={data.inputs.p1_retireAge} stroke="var(--bs-primary)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Retirement Day (Crash Hits)', fill: 'var(--bs-primary)', fontSize: 11, fontWeight: 'bold' }} />
                                  <Line type="monotone" dataKey="Base" name="Normal Expected Growth" stroke="var(--bs-primary)" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: 'var(--bs-primary)', stroke: '#16181d', strokeWidth: 2 }} opacity={0.4} />
                                  <Line type="monotone" dataKey="Crash" name="SORR Crash Scenario" stroke="var(--bs-danger)" strokeWidth={4} dot={false} activeDot={{ r: 6, fill: 'var(--bs-danger)', stroke: '#16181d', strokeWidth: 2 }} />
                              </LineChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center"><div className="spinner-border text-danger opacity-50"></div></div>
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* --- LIFE & MACRO SHOCKS GRID --- */}
      <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-heart-pulse-fill me-2 text-danger"></i>Life & Macro Shocks</h5>
      <div className="row g-4">
          
          {/* LTC SHOCK */}
          <div className="col-12 col-xl-6">
              <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-bandaid-fill fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Long-Term Care Shock</h5>
                  </div>
                  <p className="text-muted small mb-4">Injects a massive healthcare expense into your retirement plan to see if your portfolio can survive a nursing home without bankrupting the surviving spouse.</p>
                  
                  <div className="row g-3 mb-4">
                      <div className="col-4">
                          <label className="form-label small fw-bold text-muted mb-1">Start Age</label>
                          <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ltcAge} onChange={e => setLtcAge(parseInt(e.target.value)||0)} />
                      </div>
                      <div className="col-4">
                          <label className="form-label small fw-bold text-muted mb-1">Duration (Yrs)</label>
                          <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ltcDuration} onChange={e => setLtcDuration(parseInt(e.target.value)||0)} />
                      </div>
                      <div className="col-4">
                          <label className="form-label small fw-bold text-muted mb-1">Cost /yr</label>
                          <CurrencyInput className="form-control form-control-sm border-danger text-danger" value={ltcCost} onChange={setLtcCost} />
                      </div>
                  </div>

                  <button className="btn btn-outline-danger w-100 fw-bold py-2 rounded-pill mt-auto mb-4" onClick={runLtcShock}>Run LTC Stress Test</button>

                  {ltcResult && (
                      <div className={`p-3 rounded-4 border shadow-inner text-center ${ltcResult.survived ? 'bg-success bg-opacity-10 border-success' : 'bg-danger bg-opacity-10 border-danger'}`}>
                          <h6 className="fw-bold text-uppercase ls-1 small mb-3">Impact on Final Estate</h6>
                          <div className="d-flex justify-content-around align-items-center mb-2">
                              <div className="d-flex flex-column text-muted small fw-bold"><span>Baseline</span><span className="text-main fs-6 mt-1">{formatCurrency(ltcResult.baseEstate)}</span></div>
                              <i className="bi bi-arrow-right text-muted opacity-50"></i>
                              <div className="d-flex flex-column small fw-bold"><span>Post-Shock</span><span className={`fs-6 mt-1 ${ltcResult.survived ? 'text-success' : 'text-danger'}`}>{formatCurrency(ltcResult.shockEstate)}</span></div>
                          </div>
                          {!ltcResult.survived && <span className="badge bg-danger mt-2">PORTFOLIO DEPLETED PREMATURELY</span>}
                      </div>
                  )}
              </div>
          </div>

          {/* HIGH INFLATION DECADE */}
          <div className="col-12 col-xl-6">
              <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-graph-down-arrow fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">High Inflation Era</h5>
                  </div>
                  <p className="text-muted small mb-4">Overrides your baseline inflation assumption. Discover how badly a prolonged period of high inflation silently destroys your real purchasing power.</p>
                  
                  <div className="row g-3 mb-4">
                      <div className="col-12">
                          <label className="form-label small fw-bold text-muted mb-1">Simulated Persistent Inflation Rate</label>
                          <PercentInput className="form-control form-control-sm border-warning text-warning" value={infRate} onChange={setInfRate} />
                      </div>
                  </div>

                  <button className="btn btn-outline-warning w-100 fw-bold py-2 rounded-pill mt-auto mb-4" onClick={runInflationShock}>Run Inflation Stress Test</button>

                  {infResult && (
                      <div className="p-3 rounded-4 border border-warning bg-warning bg-opacity-10 shadow-inner text-center">
                          <h6 className="fw-bold text-uppercase ls-1 small text-warning mb-3">Real Purchasing Power at Age 85</h6>
                          <div className="d-flex justify-content-around align-items-center mb-2">
                              <div className="d-flex flex-column text-muted small fw-bold"><span>Baseline</span><span className="text-main fs-6 mt-1">{formatCurrency(infResult.basePurchasingPower)}</span></div>
                              <i className="bi bi-arrow-right text-warning opacity-50"></i>
                              <div className="d-flex flex-column small fw-bold text-warning"><span>Post-Shock</span><span className="fs-6 mt-1">{formatCurrency(infResult.shockPurchasingPower)}</span></div>
                          </div>
                          <span className="badge bg-warning text-dark mt-2 fw-bold px-3">Wealth Eroded by {infResult.lossPct.toFixed(1)}%</span>
                      </div>
                  )}
              </div>
          </div>

          {/* WIDOW'S PENALTY */}
          {isCouple && (
              <div className="col-12 col-xl-6">
                  <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-purple bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0, color: 'var(--bs-purple)'}}>
                              <i className="bi bi-person-dash-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold mb-0 text-uppercase ls-1" style={{color: 'var(--bs-purple)'}}>The Widow's Penalty</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculates the immediate loss of household income (lost OAS, CPP max caps, reduced pensions) if one spouse passes away early.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Simulated Age of Death (P2)</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={widowAge} onChange={e => setWidowAge(parseInt(e.target.value)||0)} />
                          </div>
                      </div>

                      {widowResult ? (
                          <div className="p-3 rounded-4 border border-secondary bg-black bg-opacity-25 shadow-inner mt-auto">
                              <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                                  <span className="text-muted fw-bold small">Joint Gov/Pension Income</span>
                                  <span className="fw-bold text-main">{formatCurrency(widowResult.jointIncome)} <span className="small text-muted fw-normal">/yr</span></span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                  <span className="text-muted fw-bold small">Survivor Income <InfoBtn title="Survivor Income" text="Survivor retains 1 OAS, max 1 standard CPP limit, and 60% of spouse's DB pension." /></span>
                                  <span className="fw-bold text-danger">{formatCurrency(widowResult.survivorIncome)} <span className="small text-muted fw-normal">/yr</span></span>
                              </div>
                              <div className="text-center">
                                  <span className="badge px-3 py-2" style={{backgroundColor: 'var(--bs-purple)'}}>Income Drops by {formatCurrency(widowResult.drop)} ({widowResult.dropPct.toFixed(1)}%)</span>
                              </div>
                          </div>
                      ) : (
                          <div className="mt-auto text-center text-muted small fst-italic py-4 border border-secondary border-opacity-25 rounded-4">
                              Data available once retirement plan is calculated.
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* REAL ESTATE CRASH */}
          <div className="col-12 col-xl-6">
              <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                      <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                          <i className="bi bi-houses-fill fs-4"></i>
                      </div>
                      <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Real Estate Crash</h5>
                  </div>
                  <p className="text-muted small mb-4">Many Canadians rely on downsizing to fund their late-stage retirement. Test what happens if the housing market crashes exactly when you plan to sell.</p>
                  
                  <div className="row g-3 mb-4">
                      <div className="col-12">
                          <label className="form-label small fw-bold text-muted mb-1">Property Value Drop</label>
                          <PercentInput className="form-control form-control-sm border-info text-info" value={reCrashPct} onChange={setReCrashPct} />
                      </div>
                  </div>

                  <button className="btn btn-outline-info w-100 fw-bold py-2 rounded-pill mt-auto mb-4" onClick={runReCrash}>Run Housing Stress Test</button>

                  {reResult && (
                      <div className="p-3 rounded-4 border border-info bg-info bg-opacity-10 shadow-inner text-center">
                          <h6 className="fw-bold text-uppercase ls-1 small text-info mb-3">Impact on Final Estate</h6>
                          <div className="d-flex justify-content-around align-items-center mb-2">
                              <div className="d-flex flex-column text-muted small fw-bold"><span>Baseline</span><span className="text-main fs-6 mt-1">{formatCurrency(reResult.baseEstate)}</span></div>
                              <i className="bi bi-arrow-right text-info opacity-50"></i>
                              <div className="d-flex flex-column small fw-bold text-info"><span>Post-Crash</span><span className="fs-6 mt-1 text-danger">{formatCurrency(reResult.shockEstate)}</span></div>
                          </div>
                      </div>
                  )}
              </div>
          </div>

      </div>

    </div>
  );
}