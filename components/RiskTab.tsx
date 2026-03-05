import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Legend, Filler } from 'chart.js';
import { Line as ChartJSLine } from 'react-chartjs-2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Legend, Filler);

// --- MODERN SEGMENTED CONTROL (Zero-Lag UI) ---
const SegmentedControl = ({ options, value, onChange }: any) => (
    <div className="d-flex flex-wrap bg-input border border-secondary rounded-pill p-1 gap-1 w-100 shadow-sm mb-3">
        {options.map((opt: any) => {
            const isActive = value === opt.value;
            return (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={`btn btn-sm rounded-pill fw-bold flex-grow-1 border-0 transition-all text-nowrap px-3 py-2 ${isActive ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`}
                    style={{ fontSize: '0.85rem' }}
                >
                    {opt.label}
                </button>
            );
        })}
    </div>
);

const InfoBtn = ({ title, text, align = 'center' }: { title: string, text: string, align?: 'center'|'right'|'left' }) => {
    const [open, setOpen] = useState(false);
    let posStyles: React.CSSProperties = { top: '140%', backgroundColor: 'var(--bg-card)', minWidth: '300px' };
    if (align === 'right') { posStyles.right = '0'; }
    else if (align === 'left') { posStyles.left = '0'; }
    else { posStyles.left = '50%'; posStyles.transform = 'translateX(-50%)'; }

    return (
        <div className="position-relative d-inline-flex align-items-center ms-2" style={{zIndex: open ? 1050 : 1}}>
            <button type="button" className="btn btn-link p-0 text-muted info-btn text-decoration-none" onClick={(e) => { e.preventDefault(); setOpen(!open); }} onBlur={() => setTimeout(() => setOpen(false), 200)}>
                <i className="bi bi-info-circle" style={{fontSize: '0.85rem'}}></i>
            </button>
            {open && (
                <div className="position-absolute border border-secondary rounded-3 shadow-lg p-3 text-none-uppercase text-start" style={posStyles}>
                    <h6 className="fw-bold mb-2 text-main border-bottom border-secondary pb-1 text-capitalize" style={{fontSize: '0.85rem'}}>{title}</h6>
                    <div className="small text-muted fw-normal text-none-uppercase" style={{fontSize: '0.75rem', lineHeight: '1.5', whiteSpace: 'normal', textTransform: 'none'}} dangerouslySetInnerHTML={{__html: text}}></div>
                </div>
            )}
        </div>
    );
};

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

  const formatCurrency = (val: number) => {
      if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
      if (val >= 10000) return `$${(val / 1000).toFixed(0)}k`;
      return `$${Math.round(val)}`;
  };

  // --- SEQUENCE OF RETURNS RISK ENGINE ---
  useEffect(() => {
      if (!results || !results.timeline) return;
      setIsSorrCalculating(true);
      
      setTimeout(() => {
          const retAge = Number(data.inputs.p1_retireAge) || 65;
          const currentAge = Number(data.inputs.p1_age) || 35;
          const retYearIndex = Math.max(0, retAge - currentAge);
          
          // Generate a brutal Sequence of Returns Risk scenario (2008-style crash + Lost Decade)
          const shockSeq = new Array(100).fill(0);
          shockSeq[retYearIndex] = -0.35;      // -35% crash exact year of retirement
          shockSeq[retYearIndex + 1] = -0.15;  // -15% the next year
          shockSeq[retYearIndex + 2] = 0.05;   // +5% minor recovery
          shockSeq[retYearIndex + 3] = 0.05;   // +5% minor recovery

          // Spin up a silent, local sandbox Engine to test the crash against the user's plan
          const clonedData = JSON.parse(JSON.stringify(data));
          const engine = new FinanceEngine(clonedData);
          const sorrTimeline = engine.runSimulation(true, { shockSequence: shockSeq });

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
          setIsSorrCalculating(false);
      }, 50);

  }, [data, results]);

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


  // --- MONTE CARLO ENGINE ---
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
             for(let y = 0; y < 100; y++) {
               simContext.histSequence.push(sp500[(startIdx + y) % sp500.length]);
             }
          } else {
             simContext.volatility = volatility;
          }
          
          // Using false for detailed makes it much faster by just returning the array of NWs
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
        
      } catch(err) { 
          console.error(err); 
          alert("Simulation failed."); 
      }
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
                 responsive: true, 
                 maintainAspectRatio: false, 
                 interaction: { mode: 'index' as const, intersect: false }, 
                 plugins: { 
                     legend: { position: 'bottom' as const, labels: { color: '#6c757d' } },
                     tooltip: {
                         callbacks: {
                             label: function(context) {
                                 let label = context.dataset.label || '';
                                 if (label) {
                                     label += ': ';
                                 }
                                 if (context.parsed.y !== null) {
                                     label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(context.parsed.y);
                                 }
                                 return label;
                             }
                         }
                     }
                 }, 
                 scales: { 
                     x: { 
                         grid: { color: 'rgba(108, 117, 125, 0.2)' }, 
                         ticks: { color: '#6c757d' } 
                     }, 
                     y: { 
                         grid: { color: 'rgba(108, 117, 125, 0.2)' }, 
                         ticks: { color: '#6c757d', callback: (val: any) => '$' + (val / 1000000).toFixed(1) + 'M' } 
                     } 
                 } 
             }} />
          </div>
      );
  }, [chartData]);

  return (
    <div className="p-3 p-md-4">
      
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-danger mb-0 d-flex align-items-center">
              <i className="bi bi-shield-fill-exclamation me-3"></i> Stress Testing & Risk
          </h5>
          {(isSorrCalculating || isCalculating) && <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-3 py-2 shadow-sm"><span className="spinner-border spinner-border-sm me-2"></span> Simulating...</span>}
      </div>

      {/* --- MONTE CARLO --- */}
      <div className="row g-4 mb-5">
        
        <div className="col-12 col-xl-4">
          <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-gear-wide-connected me-2 text-primary"></i>Monte Carlo Setup</h5>
          <div className="rp-card p-4 surface-card border-secondary rounded-4 shadow-sm mb-4">
            
            <label className="form-label small fw-bold text-muted mb-2">Number of Runs</label>
            <SegmentedControl 
                value={simCount} 
                onChange={setSimCount} 
                options={[
                    { value: 100, label: '100 (Fast)' },
                    { value: 500, label: '500 (Balanced)' },
                    { value: 1000, label: '1000 (Precise)' }
                ]} 
            />
            
            <label className="form-label small fw-bold text-muted mb-2 mt-2">Simulation Method</label>
            <SegmentedControl 
                value={method} 
                onChange={setMethod} 
                options={[
                    { value: 'random', label: 'Standard (Bell Curve)' },
                    { value: 'historical', label: 'Historical (S&P500)' }
                ]} 
            />

            {method === 'random' && (
                <>
                    <label className="form-label small fw-bold text-muted mb-2 mt-2">Market Volatility</label>
                    <SegmentedControl 
                        value={volatility} 
                        onChange={setVolatility} 
                        options={[
                            { value: 0.08, label: 'Low (8%)' },
                            { value: 0.12, label: 'Med (12%)' },
                            { value: 0.16, label: 'High (16%)' }
                        ]} 
                    />
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
                    <path 
                        d="M 20 120 A 100 100 0 0 1 220 120" 
                        fill="none" 
                        stroke={gaugeColor} 
                        strokeWidth="25" 
                        strokeLinecap="round" 
                        strokeDasharray={gaugeCircumference} 
                        strokeDashoffset={gaugeStrokeDashoffset} 
                        style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 1s ease' }} 
                    />
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
      <div className="row">
          <div className="col-12">
              <div className="rp-card border border-secondary rounded-4 p-4 shadow-sm overflow-hidden position-relative h-100 d-flex flex-column">
                  
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-4 gap-3">
                      <div>
                          <h5 className="fw-bold text-main d-flex align-items-center mb-2">
                              Sequence of Returns Risk (SORR)
                              <InfoBtn align="left" title="Sequence of Returns Risk" text="A catastrophic sequence where a massive market crash occurs in the exact first year of your retirement, followed by several years of stagnation.<br/><br/>Because you are actively withdrawing money during the crash, your portfolio suffers permanent damage that normal average returns cannot heal." />
                          </h5>
                          <p className="text-muted small mb-0" style={{maxWidth: '600px'}}>
                              This sandbox simulates a devastating -35% market crash in the very first year of your retirement, followed by a -15% drop the next year. It stress-tests whether your withdrawal rate is low enough to survive a "Lost Decade" without running out of cash.
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
                                  <XAxis 
                                      dataKey="age" 
                                      stroke="#888" 
                                      tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} 
                                      tickMargin={12} 
                                      minTickGap={30} 
                                  />
                                  <YAxis 
                                      tickFormatter={(val) => formatCurrency(val)} 
                                      stroke="#888" 
                                      tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} 
                                      width={80} 
                                      axisLine={false}
                                      tickLine={false}
                                  />
                                  <Tooltip content={<CustomSorrTooltip />} cursor={{ stroke: 'var(--bs-danger)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                  
                                  <ReferenceLine x={data.inputs.p1_retireAge} stroke="var(--bs-primary)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Retirement Day (Crash Hits)', fill: 'var(--bs-primary)', fontSize: 11, fontWeight: 'bold' }} />
                                  
                                  <Line 
                                      type="monotone" 
                                      dataKey="Base" 
                                      name="Normal Expected Growth" 
                                      stroke="var(--bs-primary)" 
                                      strokeWidth={3} 
                                      dot={false} 
                                      activeDot={{ r: 6, fill: 'var(--bs-primary)', stroke: '#16181d', strokeWidth: 2 }} 
                                      opacity={0.4}
                                  />
                                  <Line 
                                      type="monotone" 
                                      dataKey="Crash" 
                                      name="SORR Crash Scenario" 
                                      stroke="var(--bs-danger)" 
                                      strokeWidth={4} 
                                      dot={false} 
                                      activeDot={{ r: 6, fill: 'var(--bs-danger)', stroke: '#16181d', strokeWidth: 2 }} 
                                  />
                              </LineChart>
                          </ResponsiveContainer>
                      ) : (
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                              <div className="spinner-border text-danger opacity-50"></div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
      
    </div>
  );
}