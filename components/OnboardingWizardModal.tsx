'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CurrencyInput, StepperInput, SegmentedControl } from './SharedUI';
import { CANADIAN_PERSONAS, buildPlanFromWizard, QuickWizardInputs } from '../lib/personas';

interface OnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlan: (planData: any, planName: string) => void;
}

const PROVINCES = [
  { code: 'ON', name: 'Ontario' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'AB', name: 'Alberta' },
  { code: 'QC', name: 'Quebec' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland & Labrador' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'YT', name: 'Yukon' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
];

export default function OnboardingWizardModal({
  isOpen,
  onClose,
  onApplyPlan,
}: OnboardingWizardModalProps) {
  const [tab, setTab] = useState<'wizard' | 'personas'>('wizard');
  const [step, setStep] = useState<number>(1);
  const [form, setForm] = useState<QuickWizardInputs>({
    mode: 'Couple',
    province: 'ON',
    p1Age: 35,
    p1RetireAge: 62,
    p2Age: 33,
    p2RetireAge: 62,
    p1Income: 95000,
    p2Income: 80000,
    monthlySpendNow: 5000,
    monthlySpendRetire: 5200,
    tfsa: 60000,
    rrsp: 80000,
    nonReg: 15000,
    cash: 20000,
    ownsHome: true,
    homeValue: 750000,
    mortgageBalance: 420000,
    mortgagePayment: 2350,
  });

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isCouple = form.mode === 'Couple';
  const totalSavings = form.tfsa + form.rrsp + form.nonReg + form.cash;
  const totalIncome = form.p1Income + (isCouple ? form.p2Income : 0);
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(n || 0);

  const handleFinishWizard = () => {
    const plan = buildPlanFromWizard(form);
    onApplyPlan(plan, 'My Quick-Start Plan');
    onClose();
  };

  const handleSelectPersona = (persona: (typeof CANADIAN_PERSONAS)[number]) => {
    onApplyPlan(persona.buildPlan(), `${persona.title} (Preset)`);
    onClose();
  };

  return createPortal(
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        zIndex: 10050,
        overflowY: 'auto',
        padding: '1rem',
      }}
    >
      <div className="position-fixed top-0 start-0 w-100 h-100" onClick={onClose} />
      <div
        className="modal-dialog modal-dialog-centered modal-lg position-relative"
        style={{ maxWidth: '780px', zIndex: 10060 }}
      >
        <div className="modal-content surface-card border border-secondary shadow-2xl rounded-4 overflow-hidden">
          {/* HEADER */}
          <div className="modal-header border-bottom border-secondary px-4 py-3 d-flex align-items-center justify-content-between surface-card">
            <div className="d-flex align-items-center gap-2.5">
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                }}
              >
                <img
                  src="/icon-192.png"
                  alt="Planfolio"
                  width={34}
                  height={34}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-main mb-0" style={{ fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                  Quick Setup Wizard
                </h5>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                  Build your Canadian retirement projection in 60 seconds
                </div>
              </div>
            </div>

            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          {/* MODE SWITCHER */}
          <div className="px-4 pt-3 pb-0">
            <SegmentedControl
              value={tab}
              onChange={(val: 'wizard' | 'personas') => setTab(val)}
              options={[
                { value: 'wizard', label: '60-Second Guided Setup' },
                { value: 'personas', label: 'Canadian Personas (1-Click)' },
              ]}
            />
          </div>

          {/* BODY */}
          <div className="modal-body p-4">
            {tab === 'personas' ? (
              <div className="row g-3">
                {CANADIAN_PERSONAS.map((persona) => (
                  <div key={persona.id} className="col-12 col-md-6">
                    <div className="p-3 bg-input border border-secondary rounded-4 shadow-sm h-100 d-flex flex-column justify-content-between">
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className={`bg-${persona.badgeColor} bg-opacity-10 text-${persona.badgeColor} rounded-circle d-flex align-items-center justify-content-center`}
                              style={{ width: '34px', height: '34px' }}
                            >
                              <i className={`bi ${persona.icon}`}></i>
                            </div>
                            <div>
                              <div className="fw-bold text-main small">{persona.title}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>{persona.subtitle}</div>
                            </div>
                          </div>
                          <span className={`badge bg-${persona.badgeColor} bg-opacity-10 text-${persona.badgeColor} border border-${persona.badgeColor} border-opacity-25 rounded-pill`} style={{ fontSize: '0.65rem' }}>
                            {persona.badge}
                          </span>
                        </div>
                        <ul className="list-unstyled small text-muted mb-3 mt-2 d-flex flex-column gap-1" style={{ fontSize: '0.76rem' }}>
                          {persona.highlights.map((h) => (
                            <li key={h}>
                              <i className="bi bi-check2 text-success me-1.5"></i>
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm fw-bold rounded-pill w-100"
                        onClick={() => handleSelectPersona(persona)}
                      >
                        Load Persona & View Summary <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* STEP PROGRESS BAR */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                  {[
                    { num: 1, label: 'Basics' },
                    { num: 2, label: 'Income & Spend' },
                    { num: 3, label: 'Savings & Home' },
                    { num: 4, label: 'Review' },
                  ].map((s) => (
                    <button
                      key={s.num}
                      type="button"
                      onClick={() => setStep(s.num)}
                      className={`btn btn-sm border-0 d-flex align-items-center gap-1.5 px-2 py-1 rounded-pill ${
                        step === s.num ? 'bg-primary bg-opacity-10 text-primary fw-bold' : step > s.num ? 'text-success fw-semibold' : 'text-muted'
                      }`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      <span
                        className={`badge rounded-pill ${
                          step === s.num ? 'bg-primary text-white' : step > s.num ? 'bg-success text-white' : 'bg-secondary bg-opacity-25 text-muted'
                        }`}
                      >
                        {step > s.num ? <i className="bi bi-check"></i> : s.num}
                      </span>
                      <span className="d-none d-sm-inline">{s.label}</span>
                    </button>
                  ))}
                </div>

                {/* STEP 1: BASICS */}
                {step === 1 && (
                  <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column gap-3">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Planning Mode</label>
                        <SegmentedControl
                          value={form.mode}
                          onChange={(val: 'Single' | 'Couple') => setForm((f) => ({ ...f, mode: val }))}
                          options={[
                            { value: 'Single', label: 'Single' },
                            { value: 'Couple', label: 'Couple' },
                          ]}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Province / Territory</label>
                        <select
                          className="form-select border-secondary fw-bold"
                          value={form.province}
                          onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                        >
                          {PROVINCES.map((p) => (
                            <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-muted d-block">P1 Age</label>
                        <StepperInput min={18} max={85} value={form.p1Age} onChange={(v: number) => setForm((f) => ({ ...f, p1Age: v }))} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-muted d-block">P1 Retire Age</label>
                        <StepperInput min={form.p1Age} max={85} value={form.p1RetireAge} onChange={(v: number) => setForm((f) => ({ ...f, p1RetireAge: v }))} />
                      </div>
                      {isCouple && (
                        <>
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted d-block">P2 Age</label>
                            <StepperInput min={18} max={85} value={form.p2Age} onChange={(v: number) => setForm((f) => ({ ...f, p2Age: v }))} />
                          </div>
                          <div className="col-6 col-md-3">
                            <label className="form-label small fw-bold text-muted d-block">P2 Retire Age</label>
                            <StepperInput min={form.p2Age} max={85} value={form.p2RetireAge} onChange={(v: number) => setForm((f) => ({ ...f, p2RetireAge: v }))} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2: INCOME & SPENDING */}
                {step === 2 && (
                  <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column gap-3">
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">P1 Annual Gross Income</label>
                        <CurrencyInput value={form.p1Income} onChange={(v: number) => setForm((f) => ({ ...f, p1Income: v }))} />
                      </div>
                      {isCouple && (
                        <div className="col-12 col-md-6">
                          <label className="form-label small fw-bold text-muted">P2 Annual Gross Income</label>
                          <CurrencyInput value={form.p2Income} onChange={(v: number) => setForm((f) => ({ ...f, p2Income: v }))} />
                        </div>
                      )}
                    </div>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Monthly Living Expenses (Now, excl. mortgage)</label>
                        <CurrencyInput value={form.monthlySpendNow} onChange={(v: number) => setForm((f) => ({ ...f, monthlySpendNow: v }))} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-bold text-muted">Target Monthly Spend (In Retirement)</label>
                        <CurrencyInput value={form.monthlySpendRetire} onChange={(v: number) => setForm((f) => ({ ...f, monthlySpendRetire: v }))} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SAVINGS & REAL ESTATE */}
                {step === 3 && (
                  <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm d-flex flex-column gap-3">
                    <div className="small text-muted fw-semibold">
                      Enter combined household balances{isCouple ? ' (automatically split 50/50 — you can fine-tune per spouse anytime in Inputs)' : ''}:
                    </div>
                    <div className="row g-3">
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-muted">TFSA</label>
                        <CurrencyInput value={form.tfsa} onChange={(v: number) => setForm((f) => ({ ...f, tfsa: v }))} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-muted">RRSP</label>
                        <CurrencyInput value={form.rrsp} onChange={(v: number) => setForm((f) => ({ ...f, rrsp: v }))} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-muted">Non-Registered</label>
                        <CurrencyInput value={form.nonReg} onChange={(v: number) => setForm((f) => ({ ...f, nonReg: v }))} />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label small fw-bold text-muted">Cash / HISA</label>
                        <CurrencyInput value={form.cash} onChange={(v: number) => setForm((f) => ({ ...f, cash: v }))} />
                      </div>
                    </div>

                    <div className="border-top border-secondary pt-3 mt-1">
                      <div className="form-check form-switch mb-3">
                        <input
                          className="form-check-input cursor-pointer"
                          type="checkbox"
                          id="wizardOwnsHome"
                          checked={form.ownsHome}
                          onChange={(e) => setForm((f) => ({ ...f, ownsHome: e.target.checked }))}
                        />
                        <label className="form-check-label small fw-bold text-main cursor-pointer" htmlFor="wizardOwnsHome">
                          Include Primary Residence
                        </label>
                      </div>
                      {form.ownsHome && (
                        <div className="row g-3">
                          <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold text-muted">Home Value</label>
                            <CurrencyInput value={form.homeValue} onChange={(v: number) => setForm((f) => ({ ...f, homeValue: v }))} />
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold text-muted">Mortgage Balance</label>
                            <CurrencyInput value={form.mortgageBalance} onChange={(v: number) => setForm((f) => ({ ...f, mortgageBalance: v }))} />
                          </div>
                          <div className="col-12 col-md-4">
                            <label className="form-label small fw-bold text-muted">Monthly Payment</label>
                            <CurrencyInput value={form.mortgagePayment} onChange={(v: number) => setForm((f) => ({ ...f, mortgagePayment: v }))} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW */}
                {step === 4 && (
                  <div className="p-4 bg-input border border-secondary rounded-4 shadow-sm">
                    <h6 className="fw-bold text-primary text-uppercase ls-1 mb-3" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-check2-circle me-2"></i>Plan Summary Ready
                    </h6>
                    <div className="row g-3 small">
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Household</div>
                        <div className="fw-bold text-main">{form.mode} • {form.province}</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Retirement Target</div>
                        <div className="fw-bold text-main">
                          Age {form.p1RetireAge}{isCouple ? ` & ${form.p2RetireAge}` : ''}
                        </div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Gross Income</div>
                        <div className="fw-bold text-main">{fmt(totalIncome)}/yr</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Invested & Cash</div>
                        <div className="fw-bold text-success">{fmt(totalSavings)}</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Retirement Spend</div>
                        <div className="fw-bold text-main">{fmt(form.monthlySpendRetire)}/mo</div>
                      </div>
                      <div className="col-6 col-md-4">
                        <div className="text-muted">Primary Residence</div>
                        <div className="fw-bold text-main">
                          {form.ownsHome ? `${fmt(form.homeValue)} (${fmt(form.mortgageBalance)} mtg)` : 'Renting'}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted small mb-0 mt-3 pt-3 border-top border-secondary border-opacity-50">
                      CPP & OAS defaults and 6% growth / 2.1% inflation assumptions are pre-filled. You can refine every detail in the <strong>Inputs</strong> and <strong>Strategy</strong> tabs after viewing your dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="modal-footer border-top border-secondary px-4 py-3 bg-input d-flex justify-content-between align-items-center">
            {tab === 'wizard' ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold"
                  onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
                >
                  {step > 1 ? (
                    <><i className="bi bi-arrow-left me-1"></i> Back</>
                  ) : (
                    'Cancel'
                  )}
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm"
                    onClick={() => setStep(step + 1)}
                  >
                    Next <i className="bi bi-arrow-right ms-1"></i>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-success btn-sm rounded-pill px-4 fw-bold shadow-sm"
                    onClick={handleFinishWizard}
                  >
                    <i className="bi bi-rocket-takeoff-fill me-2"></i>Generate My Plan
                  </button>
                )}
              </>
            ) : (
              <div className="w-100 d-flex justify-content-between align-items-center">
                <span className="small text-muted">All personas run 100% locally in your browser.</span>
                <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold" onClick={onClose}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
