import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, PercentInput } from '../SharedUI';

export default function EconomicAssumptionsCard() {
  const { data, updateInput } = useFinance();

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
          <i className="bi bi-graph-up-arrow text-secondary fs-4 me-3"></i>
          <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">10. Economic Assumptions</h5>
      </div>
      <div className="card-body p-4">
          <div className="row">
              <div className="col-12 col-md-6 col-xl-4">
                  <div className="border border-secondary rounded-4 shadow-sm">
                      <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3 rounded-top-4">
                          <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                              <i className="bi bi-percent"></i>
                          </div>
                          <span className="fw-bold text-main small text-uppercase ls-1">Inflation Rate</span>
                      </div>
                      <div className="p-3 bg-input rounded-bottom-4">
                          <label className="form-label small text-muted mb-2 d-flex align-items-center">Long-term Target <InfoBtn align="right" title="Inflation Rate" text="The expected annual increase in the cost of living. The Bank of Canada target is 2.0%."/></label>
                          <PercentInput className="form-control" value={data.inputs.inflation_rate} onChange={(val: any) => updateInput('inflation_rate', val)} />
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}