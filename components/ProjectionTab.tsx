import React from 'react';
import { useFinance } from '../lib/FinanceContext';

export default function ProjectionTab() {
  const { results } = useFinance();
  const timeline = results?.timeline || [];

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '$0';
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="p-0">
      <div className="card border-0 shadow-none bg-transparent">
        <div className="card-header d-flex justify-content-end p-3 border-bottom border-secondary bg-black bg-opacity-25">
          <button className="btn btn-sm btn-outline-success rounded-pill px-3" type="button">
            <i className="bi bi-download me-2"></i>Export to CSV
          </button>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive border-0 rounded-0" style={{ maxHeight: '80vh' }}>
            <table className="table table-dark table-sm table-striped table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="sticky-top bg-black shadow-sm">
                <tr>
                  <th className="text-secondary text-uppercase py-3 ps-3">Year</th>
                  <th className="text-secondary text-uppercase py-3">P1 Age</th>
                  <th className="text-secondary text-uppercase py-3">P2 Age</th>
                  <th className="text-secondary text-uppercase py-3">Gross Inflow</th>
                  <th className="text-warning text-uppercase py-3">Expenses</th>
                  <th className="text-danger text-uppercase py-3">Taxes</th>
                  <th className="text-info text-uppercase py-3">Liquid Assets</th>
                  <th className="text-success text-uppercase py-3 pe-3">Total Net Worth</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {timeline.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center p-5 text-muted fst-italic">Waiting for simulation data...</td>
                  </tr>
                )}
                {timeline.map((row: any, idx: number) => (
                  <tr key={idx}>
                    <td className="ps-3 fw-bold text-muted">{row.year}</td>
                    <td>{row.p1Age}</td>
                    <td>{row.p2Age || '--'}</td>
                    <td>{formatCurrency(row.grossInflow)}</td>
                    <td className="text-warning">{formatCurrency(row.expenses)}</td>
                    <td className="text-danger">{formatCurrency(row.taxP1 + (row.taxP2 || 0))}</td>
                    <td className="text-info fw-bold">{formatCurrency(row.liquidNW)}</td>
                    <td className="text-success fw-bold pe-3">{formatCurrency(row.debugNW)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}