import React from 'react';

export default function OptimizersTab() {
  return (
    <div className="p-4 p-md-5">
      <h5 className="text-muted small text-uppercase fw-bold ls-1 mb-4 pb-2 border-bottom border-secondary">
        <i className="bi bi-lightbulb text-warning me-2"></i>Smart Optimizers
      </h5>
      <div className="row g-4">
        {[
          { title: "Optimal RRSP Calculator", icon: "bi-bullseye", color: "text-success", desc: "Find your RRSP Sweet Spot to maximize your tax refund before dropping into a lower tax bracket.", btnText: "Calculate Sweet Spot", btnClass: "btn-outline-success" },
          { title: "RRSP Gross-Up Optimizer", icon: "bi-rocket-takeoff", color: "text-info", desc: "Calculate how to maximize your RRSP contribution by using a short-term loan paid off by the tax refund.", btnText: "Calculate Gross-Up", btnClass: "btn-outline-info" },
          { title: "Smith Maneuver Simulator", icon: "bi-arrow-repeat", color: "text-primary", desc: "Convert your non-deductible mortgage into a tax-deductible investment loan.", btnText: "Run Simulator", btnClass: "btn-outline-primary" },
          { title: "CPP Smart Importer & Analyzer", icon: "bi-file-earmark-spreadsheet", color: "text-white", desc: "Upload your Service Canada records to accurately calculate your exact lifetime average.", btnText: "Launch Importer", btnClass: "btn-outline-secondary text-white" }
        ].map((opt, idx) => (
          <div className="col-12 col-xl-6" key={idx}>
            <div className="rp-card p-4 surface-card bg-black bg-opacity-10 border border-secondary rounded-4 h-100 d-flex flex-column">
              <h6 className={`${opt.color} fw-bold mb-2 fs-5`}><i className={`bi ${opt.icon} me-2`}></i>{opt.title}</h6>
              <p className="small text-muted mb-4">{opt.desc}</p>
              <div className="d-grid mb-3 mt-auto">
                <button className={`btn ${opt.btnClass} fw-bold py-2`}>
                  <i className="bi bi-play-circle-fill me-2"></i>{opt.btnText}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}