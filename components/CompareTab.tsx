import React from 'react';

export default function CompareTab() {
  return (
    <div className="p-4 p-md-5">
      <div className="row mb-5">
        <div className="col-12">
          <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary"><i className="bi bi-input-cursor me-2 text-info"></i>Comparison Controls</h5>
          <div className="card p-4 mb-3 surface-card bg-black bg-opacity-10 border-secondary rounded-4 shadow-sm">
            <p className="small text-muted mb-4 fw-medium">Select the scenarios you wish to compare. The chart will update automatically to display their Net Worth trajectories side-by-side.</p>
            <div className="d-flex flex-wrap gap-3 text-muted fst-italic">
              (Comparison checkboxes will render here)
            </div>
          </div>
        </div>
      </div>
      <div className="row g-4">
        <div className="col-12">
          <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4">
            <h6 className="text-center text-success mb-4 fw-bold text-uppercase ls-1">Net Worth Trajectory Comparison</h6>
            <div style={{ height: '500px', position: 'relative', width: '100%' }}>
              <canvas id="chartNW"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}