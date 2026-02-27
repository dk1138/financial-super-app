import React from 'react';

export default function CashFlowTab() {
  return (
    <div className="p-3 p-md-5">
      <div className="card border-0 bg-transparent shadow-none" style={{ overflow: 'hidden', width: '100%' }}>
        <div className="card-body p-0">
          <div className="d-flex align-items-center justify-content-center mb-5 p-4 surface-card bg-black bg-opacity-25 border border-secondary rounded-3 shadow-sm mx-auto" style={{ maxWidth: '800px' }}>
            <label className="form-label me-4 mb-0 fw-bold fs-6">Timeline Year:</label>
            <input type="range" className="form-range flex-grow-1" min="0" max="40" defaultValue="0" />
            <div className="ms-4 ps-4 border-start border-secondary d-flex align-items-baseline justify-content-center gap-2 text-nowrap">
              <div className="fs-3 fw-bold text-info">2026</div>
              <div className="text-muted fw-medium text-uppercase ls-1" style={{ fontSize: '0.95rem' }}>(Age: --)</div>
            </div>
          </div>
          <div id="sankey_chart" style={{ width: '100%', height: '600px' }}></div>
        </div>
      </div>
    </div>
  );
}