import React, { useState } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function RiskTab() {
  const { data } = useFinance();
  
  // Local state for the simulation controls
  const [simCount, setSimCount] = useState(100);
  const [method, setMethod] = useState('random');
  const [volatility, setVolatility] = useState(0.12);
  
  // Local state for the results
  const [isCalculating, setIsCalculating] = useState(false);
  const [chartData, setChartData] = useState<any>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);

  const runMonteCarlo = () => {
    setIsCalculating(true);
    
    // We use a small timeout so React has time to render the "Calculating..." spinner
    setTimeout(() => {
      try {
        const trajectories: number[][] = [];
        const startYear = new Date().getFullYear();
        const p1Age = data.inputs.p1_age || 38;
        const inflationRate = (data.inputs.inflation_rate || 2.1) / 100;
        
        // 1. Run the loop!
        for (let i = 0; i < simCount; i++) {
          // Deep clone data to ensure a clean slate for every single run
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
          
          // Run the engine in lightweight mode (false = returns only Net Worth array)
          const result = engine.runSimulation(false, simContext);
          trajectories.push(result);
        }
        
        // 2. Sort the outcomes from worst to best
        trajectories.sort((a, b) => a[a.length - 1] - b[b.length - 1]);
        
        // 3. Extract the Percentiles
        const runs = trajectories.length;
        const p10Data = trajectories[Math.floor(runs * 0.10)];
        const p50Data = trajectories[Math.floor(runs * 0.50)];
        const p90Data = trajectories[Math.floor(runs * 0.90)];
        
        // 4. Calculate Success Rate (Simulations that didn't go bankrupt)
        const successCount = trajectories.filter(t => t[t.length - 1] > 0).length;
        setSuccessRate(Number(((successCount / runs) * 100).toFixed(1)));
        
        // 5. Discount to Today's Dollars
        const discount = (val: number, idx: number) => Math.round(val / Math.pow(1 + inflationRate, idx));
        const labels = p50Data.map((_: any, i: number) => p1Age + i);
        
        // 6. Build the Chart
        setChartData({
          labels,
          datasets: [
            {
              label: 'Optimistic (Top 10%)',
              data: p90Data.map(discount),
              borderColor: '#10b981', // Success Green
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4
            },
            {
              label: 'Median Scenario',
              data: p50Data.map(discount),
              borderColor: '#3b82f6', // Info Blue
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              fill: true,
              borderWidth: 3,
              pointRadius: 0,
              tension: 0.4
            },
            {
              label: 'Pessimistic (Bottom 10%)',
              data: p10Data.map(discount),
              borderColor: '#ef4444', // Danger Red
              borderDash: [5, 5],
              borderWidth: 2,
              pointRadius: 0,
              tension: 0.4
            }
          ]
        });
        
      } catch(err) {
        console.error(err);
        alert("Simulation failed to run. Check console.");
      }
      setIsCalculating(false);
    }, 50);
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#cbd5e1' } },
      tooltip: {
        callbacks: {
            label: (context: any) => `${context.dataset.label}: $${(context.raw / 1000000).toFixed(2)}M`
        }
      }
    },
    scales: {
      x: { title: { display: true, text: 'Age', color: '#cbd5e1' }, grid: { color: '#334155' }, ticks: { color: '#cbd5e1' } },
      y: { grid: { color: '#334155' }, ticks: { color: '#cbd5e1', callback: (val: any) => '$' + (val / 1000000).toFixed(1) + 'M' } }
    }
  };

  return (
    <div className="p-4 p-md-5">
      <div className="row g-5">
        
        {/* Settings Panel */}
        <div className="col-12 col-xl-3">
          <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary d-flex align-items-center">
            <i className="bi bi-gear-wide-connected me-2 text-danger"></i><span className="me-2">Simulation Settings</span>
          </h5>
          <div className="card p-4 surface-card bg-black bg-opacity-10 border-secondary rounded-4 shadow-sm mb-4">
            
            <label className="form-label small fw-bold text-muted">Number of Runs</label>
            <select className="form-select mb-3 bg-dark border-secondary text-white" value={simCount} onChange={e => setSimCount(Number(e.target.value))}>
              <option value={100}>100 (Fast)</option>
              <option value={500}>500 (Balanced)</option>
              <option value={1000}>1000 (Precise)</option>
            </select>
            
            <label className="form-label small fw-bold text-muted">Simulation Method</label>
            <select className="form-select mb-3 bg-dark border-secondary text-white" value={method} onChange={e => setMethod(e.target.value)}>
              <option value="random">Standard (Normal Distribution)</option>
              <option value="historical">Historical Data (Bootstrap)</option>
            </select>

            {method === 'random' && (
                <>
                    <label className="form-label small fw-bold text-muted">Market Volatility</label>
                    <select className="form-select mb-4 bg-dark border-secondary text-white" value={volatility} onChange={e => setVolatility(Number(e.target.value))}>
                    <option value={0.08}>Low (8% Std Dev)</option>
                    <option value={0.12}>Medium (12% Std Dev)</option>
                    <option value={0.16}>High (16% Std Dev)</option>
                    </select>
                </>
            )}
            
            <button 
                className="btn btn-danger w-100 fw-bold py-2 mt-2" 
                onClick={runMonteCarlo} 
                disabled={isCalculating}
            >
              {isCalculating ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Running...</>
              ) : (
                  <><i className="bi bi-play-circle-fill me-2"></i> Run Monte Carlo</>
              )}
            </button>
          </div>

          {/* Dynamic Success Rate Box */}
          {successRate !== null && (
            <div className={`card p-3 rounded-4 text-center ${successRate >= 90 ? 'border-success bg-success' : successRate >= 75 ? 'border-warning bg-warning' : 'border-danger bg-danger'} bg-opacity-10`}>
                <div className={`small text-uppercase fw-bold mb-1 ${successRate >= 90 ? 'text-success' : successRate >= 75 ? 'text-warning' : 'text-danger'}`}>
                    Success Rate
                </div>
                <div className={`display-4 fw-bold ${successRate >= 90 ? 'text-success' : successRate >= 75 ? 'text-warning' : 'text-danger'}`}>
                    {successRate}%
                </div>
                <div className="small text-muted mt-2">Simulations ending {">"} $0</div>
            </div>
          )}
        </div>

        {/* Chart Panel */}
        <div className="col-12 col-xl-9">
          <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-activity me-2 text-info"></i>Simulation Outcomes</h5>
          <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100 d-flex flex-column">
             
             {chartData ? (
                 <div style={{ height: '500px', position: 'relative', width: '100%', flexGrow: 1 }}>
                    <Line data={chartData} options={chartOptions} />
                 </div>
             ) : (
                 <div className="d-flex flex-grow-1 align-items-center justify-content-center text-muted fst-italic p-5 border border-secondary border-opacity-25 rounded" style={{ height: '500px' }}>
                    Click "Run Monte Carlo" to generate your projections.
                 </div>
             )}

             <div className="text-center text-muted small mt-4 pt-3 border-top border-secondary border-opacity-50">
                 Displaying random scenarios based on standard deviation. 
                 <span className="text-white fw-bold ms-1">Solid Lines</span> represent the Median (50th percentile) and "Bad Luck" (10th percentile) cases.
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}