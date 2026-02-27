import React, { useRef } from 'react';
import { useFinance } from '../lib/FinanceContext';

// Helper to map raw IDs to pretty labels and icons for EVERY account
const ACCOUNT_MAP: Record<string, { label: string, icon: string, color: string }> = {
  tfsa: { label: 'TFSA', icon: 'bi-piggy-bank', color: 'text-success' },
  rrsp: { label: 'RRSP', icon: 'bi-bank', color: 'text-warning' },
  fhsa: { label: 'FHSA', icon: 'bi-house-add', color: 'text-info' },
  nreg: { label: 'Non-Registered', icon: 'bi-graph-up-arrow', color: 'text-secondary' },
  cash: { label: 'Cash / HYSA', icon: 'bi-cash', color: 'text-white' },
  crypto: { label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-primary' },
  resp: { label: 'RESP', icon: 'bi-mortarboard', color: 'text-primary' },
  rrif_acct: { label: 'RRIF', icon: 'bi-bank2', color: 'text-warning' },
  lif: { label: 'LIF', icon: 'bi-safe', color: 'text-white' },
  lirf: { label: 'LIRA / LIRF', icon: 'bi-lock', color: 'text-muted' },
};

export default function StrategyTab() {
  const { data, updateInput, updateStrategy } = useFinance();
  
  // References for the drag-and-drop logic
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Handle Drag Sorting
  const handleSort = (type: 'accum' | 'decum') => {
    let _strategies = [...data.strategies[type]];
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const draggedItemContent = _strategies.splice(dragItem.current, 1)[0];
      _strategies.splice(dragOverItem.current, 0, draggedItemContent);
      updateStrategy(type, _strategies);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleNumberChange = (key: string, value: string) => {
    const num = parseFloat(value);
    updateInput(key, isNaN(num) ? 0 : num);
  };

  const renderDraggableList = (type: 'accum' | 'decum') => {
    return data.strategies[type].map((item: string, index: number) => {
      const details = ACCOUNT_MAP[item] || { label: item, icon: 'bi-wallet', color: 'text-white' };
      return (
        <div
          key={item}
          draggable
          onDragStart={() => (dragItem.current = index)}
          onDragEnter={() => (dragOverItem.current = index)}
          onDragEnd={() => handleSort(type)}
          onDragOver={(e) => e.preventDefault()}
          className="d-flex align-items-center justify-content-between p-3 mb-2 bg-black bg-opacity-25 border border-secondary rounded-3 shadow-sm"
          style={{ cursor: 'grab' }}
        >
          <div className="d-flex align-items-center">
            <span className="badge bg-secondary me-3 rounded-circle text-dark">{index + 1}</span>
            <i className={`bi ${details.icon} ${details.color} fs-5 me-3`}></i>
            <span className="fw-bold">{details.label}</span>
          </div>
          <i className="bi bi-grip-vertical text-muted"></i>
        </div>
      );
    });
  };

  return (
    <div className="p-4 p-md-5">
      <div className="row g-4 mb-4 pb-4 border-bottom border-secondary">
        
        {/* Accumulation Strategy */}
        <div className="col-md-6 border-end border-secondary pe-md-4">
          <div className="d-flex align-items-center mb-4 pb-2 border-bottom border-success border-opacity-50">
            <div className="bg-success bg-opacity-10 text-success p-2 rounded me-3 d-flex"><i className="bi bi-piggy-bank fs-3"></i></div>
            <h5 className="text-success mb-0 fw-bold text-uppercase ls-1 me-2">Accumulation Strategy</h5>
          </div>
          <p className="small text-muted mb-4 px-2">Drag to prioritize where surplus cash is saved. Top items fill first.</p>
          <div className="px-2">
            {renderDraggableList('accum')}
          </div>
        </div>

        {/* Decumulation Strategy */}
        <div className="col-md-6 ps-md-4">
          <div className="d-flex align-items-center mb-4 pb-2 border-bottom border-warning border-opacity-50">
            <div className="bg-warning bg-opacity-10 text-warning p-2 rounded me-3 d-flex"><i className="bi bi-wallet2 fs-3"></i></div>
            <h5 className="text-warning mb-0 fw-bold text-uppercase ls-1 me-2">Decumulation Strategy</h5>
          </div>
          <p className="small text-muted mb-4 px-2">Drag to prioritize withdrawal sources during retirement/deficits.</p>
          <div className="px-2">
            {renderDraggableList('decum')}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Annual Limits */}
        <div className="col-md-6 border-end border-secondary pe-md-4 d-flex flex-column">
          <div className="rp-card surface-card bg-black bg-opacity-10 h-100 border border-secondary rounded-3">
            <div className="card-header border-secondary text-uppercase small fw-bold text-muted p-3">
              Annual Contribution Limits
            </div>
            <div className="card-body p-3">
              <div className="row g-2">
                <div className="col-6">
                  <label className="form-label small text-success fw-bold">TFSA Annual Limit</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-dark border-secondary text-muted">$</span>
                    <input type="number" className="form-control bg-black border-secondary text-white" value={data.inputs.cfg_tfsa_limit} onChange={(e) => handleNumberChange('cfg_tfsa_limit', e.target.value)} />
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label small text-warning fw-bold">RRSP Max Limit</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-dark border-secondary text-muted">$</span>
                    <input type="number" className="form-control bg-black border-secondary text-white" value={data.inputs.cfg_rrsp_limit} onChange={(e) => handleNumberChange('cfg_rrsp_limit', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="row g-2 mt-2 pt-2 border-top border-secondary">
                <div className="col-6">
                  <label className="form-label small text-info fw-bold">FHSA Annual Limit</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-dark border-secondary text-muted">$</span>
                    <input type="number" className="form-control bg-black border-secondary text-white" value={data.inputs.cfg_fhsa_limit} onChange={(e) => handleNumberChange('cfg_fhsa_limit', e.target.value)} />
                  </div>
                </div>
                <div className="col-6">
                  <label className="form-label small text-primary fw-bold">RESP Target</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-dark border-secondary text-muted">$</span>
                    <input type="number" className="form-control bg-black border-secondary text-white" value={data.inputs.cfg_resp_limit} onChange={(e) => handleNumberChange('cfg_resp_limit', e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="row g-2 mt-2 pt-2 border-top border-secondary">
                <div className="col-12">
                  <label className="form-label small text-info fw-bold">Crypto Annual Limit</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-dark border-secondary text-muted">$</span>
                    <input type="number" className="form-control bg-black border-secondary text-white" value={data.inputs.cfg_crypto_limit} onChange={(e) => handleNumberChange('cfg_crypto_limit', e.target.value)} />
                    <span className="input-group-text bg-dark border-secondary text-muted">/ yr</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimizations */}
        <div className="col-md-6 ps-md-4 d-flex flex-column gap-4">
          <div className="rp-card surface-card bg-black bg-opacity-10 border border-secondary rounded-3">
            <div className="card-header border-secondary text-uppercase small fw-bold text-muted p-3">Tax & Benefit Optimization</div>
            <div className="card-body p-3">
              <div className="form-check form-switch ms-2 mb-3">
                <input className="form-check-input fs-5 mt-0" type="checkbox" id="fully_optimize_tax" role="switch" checked={data.inputs.fully_optimize_tax} onChange={(e) => updateInput('fully_optimize_tax', e.target.checked)} />
                <label className="form-check-label ms-2 small fw-bold text-success" htmlFor="fully_optimize_tax">Fully Optimize to Reduce Tax</label>
                <div className="small text-muted mt-1">Overrides drag-and-drop order. Automatically melts down RRSPs in low tax brackets to minimize lifetime tax.</div>
              </div>
              <div className="form-check form-switch ms-2 mb-0 border-top border-secondary pt-3">
                <input className="form-check-input fs-5 mt-0" type="checkbox" id="oas_clawback_optimize" role="switch" checked={data.inputs.oas_clawback_optimize} onChange={(e) => updateInput('oas_clawback_optimize', e.target.checked)} />
                <label className="form-check-label ms-2 small fw-bold text-info" htmlFor="oas_clawback_optimize">Optimize to Avoid OAS Clawback</label>
              </div>
            </div>
          </div>

          <div className="rp-card surface-card bg-black bg-opacity-10 border border-secondary rounded-3 flex-grow-1">
            <div className="card-header border-secondary text-uppercase small fw-bold text-muted p-3">Exceptions & Overrides</div>
            <div className="card-body p-3">
              <div className="form-check ms-2 mb-3">
                <input className="form-check-input mt-1" type="checkbox" id="skip_first_tfsa_p1" checked={data.inputs.skip_first_tfsa_p1} onChange={(e) => updateInput('skip_first_tfsa_p1', e.target.checked)} />
                <label className="form-check-label small fw-medium" htmlFor="skip_first_tfsa_p1">Player 1: Skip 1st Year TFSA Contrib.</label>
              </div>
              <div className="form-check ms-2 mb-4 pb-3 border-bottom border-secondary">
                <input className="form-check-input mt-1" type="checkbox" id="skip_first_rrsp_p1" checked={data.inputs.skip_first_rrsp_p1} onChange={(e) => updateInput('skip_first_rrsp_p1', e.target.checked)} />
                <label className="form-check-label small fw-medium" htmlFor="skip_first_rrsp_p1">Player 1: Skip 1st Year RRSP Contrib.</label>
              </div>
              <div className="form-check ms-2 mb-3">
                <input className="form-check-input mt-1" type="checkbox" id="skip_first_tfsa_p2" checked={data.inputs.skip_first_tfsa_p2} onChange={(e) => updateInput('skip_first_tfsa_p2', e.target.checked)} />
                <label className="form-check-label small fw-medium" style={{ color: 'var(--bs-purple)' }} htmlFor="skip_first_tfsa_p2">Player 2: Skip 1st Year TFSA Contrib.</label>
              </div>
              <div className="form-check ms-2 mb-2">
                <input className="form-check-input mt-1" type="checkbox" id="skip_first_rrsp_p2" checked={data.inputs.skip_first_rrsp_p2} onChange={(e) => updateInput('skip_first_rrsp_p2', e.target.checked)} />
                <label className="form-check-label small fw-medium" style={{ color: 'var(--bs-purple)' }} htmlFor="skip_first_rrsp_p2">Player 2: Skip 1st Year RRSP Contrib.</label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}