import React from 'react';
import { useFinance } from '../lib/FinanceContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

export default function DashboardTab() {
  const { results } = useFinance();
  const timeline = results?.timeline || [];

  const formatCurrency = (val: number | undefined) => {
      if (val === undefined || isNaN(val)) return '$0';
      return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
  };

  const finalNetWorth = results?.dashboard?.finalNetWorth || 0;
  const totalTax = results?.dashboard?.totalTax || 0;
  
  // Calculate Totals for the Donut Chart
  const totalExpenses = timeline.reduce((sum: number, r: any) => sum + r.expenses, 0);
  const totalEstate = finalNetWorth;

  // Prepare Data for the Net Worth Line Chart
  const chartLabels = timeline.map((r: any) => r.p1Age);
  const liquidData = timeline.map((r: any) => r.liquidNW);
  const realEstateData = timeline.map((r: any) => r.reIncludedEq);

  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Liquid Assets',
        data: liquidData,
        borderColor: '#0dcaf0', // Info blue
        backgroundColor: 'rgba(13, 202, 240, 0.5)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Real Estate Equity',
        data: realEstateData,
        borderColor: '#198754', // Success green
        backgroundColor: 'rgba(25, 135, 84, 0.5)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      }
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    scales: {
      x: { grid: { color: '#333' }, ticks: { color: '#888' } },
      y: { 
        stacked: true, 
        grid: { color: '#333' }, 
        ticks: { color: '#888', callback: (val: any) => '$' + (val / 1000000).toFixed(1) + 'M' } 
      }
    },
    plugins: { legend: { labels: { color: '#fff' } } }
  };

  const donutData = {
    labels: ['Living Expenses', 'Taxes Paid', 'Final Estate (Leftover)'],
    datasets: [{
      data: [totalExpenses, totalTax, totalEstate],
      backgroundColor: ['#ffc107', '#dc3545', '#0dcaf0'],
      borderWidth: 0,
    }]
  };

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const, labels: { color: '#fff' } } }
  };

  return (
    <div className="p-4 p-md-5">
      <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary">
        <i className="bi bi-clipboard2-data text-primary me-2"></i>Lifetime Summary
      </h5>
      
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
            <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100 text-center">
              <div className="text-muted small text-uppercase fw-bold mb-2">Total Investment Growth</div>
              <div className="fs-2 fw-bold text-success">Calculated Below</div>
              <div className="small text-muted mt-1">Pure market compounding</div>
            </div>
        </div>
        <div className="col-12 col-md-4">
            <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100 text-center">
              <div className="text-muted small text-uppercase fw-bold mb-2">Govt Benefits Collected</div>
              <div className="fs-2 fw-bold text-info">Calculated Below</div>
              <div className="small text-muted mt-1">Lifetime CPP & OAS</div>
            </div>
        </div>
        <div className="col-12 col-md-4">
            <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100 text-center">
              <div className="text-muted small text-uppercase fw-bold mb-2">Total Lifetime Tax Paid</div>
              <div className="fs-2 fw-bold text-danger">{formatCurrency(totalTax)}</div>
              <div className="small text-muted mt-1">Combined Fed & Prov</div>
            </div>
        </div>
      </div>
      
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
          <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100 flex-column d-flex">
            <h6 className="text-info fw-bold text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary">Milestones & Estate</h6>
            <div className="d-flex justify-content-between mb-3 mt-3">
              <span className="text-muted fw-bold">Final Estate Value</span>
              <span className="fw-bold text-white fs-5">{formatCurrency(finalNetWorth)}</span>
            </div>
            <div className="d-flex justify-content-between pt-3 border-top border-secondary mt-auto">
              <span className="text-muted fw-bold">Plan Health</span>
              <span className="fw-bold text-success">
                {finalNetWorth > 0 ? 'On Track' : 'Shortfall Detected'}
              </span>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100">
            <h6 className="fw-bold text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary" style={{ color: 'var(--bs-purple)' }}>Lifetime Cash Distribution</h6>
            <div style={{ height: '250px', position: 'relative', width: '100%' }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12">
          <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100">
            <h6 className="text-success fw-bold text-uppercase ls-1 mb-3 pb-2 border-bottom border-secondary">Net Worth Composition Over Time (Age)</h6>
            <div style={{ height: '400px', position: 'relative', width: '100%' }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}