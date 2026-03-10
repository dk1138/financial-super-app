import React from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { InfoBtn, PercentInput, SegmentedControl } from '../SharedUI';

export default function EconomicAssumptionsCard() {
  const { data, updateInput } = useFinance();

  return (
    <div className="rp-card border border-secondary rounded-4 mb-4">
      <div className="card-header d-flex align-items-center border-bottom border-secondary p-3 surface-card">
          <i className="bi bi-graph-up-arrow text-secondary fs-4 me-3"></i>
          <h5 className="mb-0 fw-bold text-uppercase ls-1 d-flex align-items-center">10. Economic Assumptions</h5>
      </div>
      <div className="card-body p-4">
          <div className="row g-4">
              
              {/* Inflation Rate */}
              <div className="col-12 col-lg-4">
                  <div className="border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column">
                      <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3 rounded-top-4 flex-shrink-0">
                          <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                              <i className="bi bi-percent"></i>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-main small text-uppercase ls-1">Inflation Rate</span>
                              <InfoBtn align="right" title="Inflation Rate" text="The expected annual increase in the cost of living. The Bank of Canada target is 2.0%."/>
                          </div>
                      </div>
                      <div className="p-3 bg-input rounded-bottom-4 flex-grow-1 d-flex flex-column justify-content-center">
                          <PercentInput className="form-control" value={data.inputs.inflation_rate} onChange={(val: any) => updateInput('inflation_rate', val)} />
                      </div>
                  </div>
              </div>
              
              {/* Contribution Timing */}
              <div className="col-12 col-lg-4">
                  <div className="border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column">
                      <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3 rounded-top-4 flex-shrink-0">
                          <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                              <i className="bi bi-box-arrow-in-right"></i>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-main small text-uppercase ls-1">Contribution Timing</span>
                              <InfoBtn align="right" title="Contribution Timing" text="Determines when surplus cash is invested into your portfolio.<br/><br/><b class='text-main'>End of Year (Conservative):</b> Earns no investment growth during the current year.<br/><br/><b class='text-main'>Mid-Year:</b> Earns half a year of growth.<br/><br/><b class='text-main'>Start of Year (Aggressive):</b> Earns a full year of growth immediately."/>
                          </div>
                      </div>
                      <div className="p-3 bg-input rounded-bottom-4 flex-grow-1 d-flex flex-column justify-content-center">
                          <SegmentedControl 
                              value={data.inputs.contribution_timing || data.inputs.cashflow_timing || 'end'} 
                              onChange={(val: string) => updateInput('contribution_timing', val)}
                              options={[
                                  { value: 'start', label: 'Start' },
                                  { value: 'mid', label: 'Mid' },
                                  { value: 'end', label: 'End' }
                              ]}
                          />
                      </div>
                  </div>
              </div>

              {/* Withdrawal Timing */}
              <div className="col-12 col-lg-4">
                  <div className="border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column">
                      <div className="bg-secondary bg-opacity-10 border-bottom border-secondary p-2 px-3 d-flex align-items-center gap-3 rounded-top-4 flex-shrink-0">
                          <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '32px', height: '32px'}}>
                              <i className="bi bi-box-arrow-right"></i>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                              <span className="fw-bold text-main small text-uppercase ls-1">Withdrawal Timing</span>
                              <InfoBtn align="right" title="Withdrawal Timing" text="Determines when cash is withdrawn to fund your lifestyle.<br/><br/><b class='text-main'>Start of Year (Conservative):</b> Misses out on a full year of growth.<br/><br/><b class='text-main'>Mid-Year:</b> Misses out on half a year of growth.<br/><br/><b class='text-main'>End of Year (Aggressive):</b> Benefits from a full year of growth before being withdrawn."/>
                          </div>
                      </div>
                      <div className="p-3 bg-input rounded-bottom-4 flex-grow-1 d-flex flex-column justify-content-center">
                          <SegmentedControl 
                              value={data.inputs.withdrawal_timing || data.inputs.cashflow_timing || 'end'} 
                              onChange={(val: string) => updateInput('withdrawal_timing', val)}
                              options={[
                                  { value: 'start', label: 'Start' },
                                  { value: 'mid', label: 'Mid' },
                                  { value: 'end', label: 'End' }
                              ]}
                          />
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
}