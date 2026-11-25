'use client';

import React, { useMemo, useState } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { InfoBtn } from './SharedUI';

type ActionSeverity = 'danger' | 'warning' | 'info' | 'success';

interface NextBestAction {
  id: string;
  severity: ActionSeverity;
  icon: string;
  title: string;
  description: string;
  impactLabel?: string;
  ctaLabel?: string;
  onApply?: () => void;
}

const fmtCurrency = (val: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(
    Math.round(val || 0)
  );

interface NextBestActionsCardProps {
  onNavigate?: (tab: string, toolId?: string) => void;
}

export default function NextBestActionsCard({ onNavigate }: NextBestActionsCardProps = {}) {
  const { data, results, planScore, updateInput } = useFinance();
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});

  const actions = useMemo<NextBestAction[]>(() => {
    const timeline = results?.timeline || [];
    if (timeline.length === 0) return [];

    const list: NextBestAction[] = [];
    const inputs = data.inputs || {};
    const isCouple = data.mode === 'Couple';
    const retireAge = Number(inputs.p1_retireAge) || 65;

    // 1. Portfolio Shortfall Check
    const firstDepleted = timeline.find((y: any) => y.liquidNW <= 0 && y.p1Age >= retireAge);
    if (firstDepleted) {
      list.push({
        id: 'shortfall',
        severity: 'danger',
        icon: 'bi-exclamation-triangle-fill',
        title: `Liquid portfolio runs out at age ${firstDepleted.p1Age}`,
        description:
          'Your projected liquid assets hit $0 before the end of your plan. Open Tools & Calculators to run the Max Safe Spend Solver and 5×5 Sensitivity Heatmap, or run 1-Click Auto-Optimize in Strategy.',
        impactLabel: 'High Priority',
        ctaLabel: onNavigate ? 'Open Sensitivity Heatmap' : undefined,
        onApply: onNavigate ? () => onNavigate('optimizers', 'sensitivity') : undefined,
      });
    }

    // 2. Pension Income Splitting for Couples
    if (isCouple && !inputs.pension_split_enabled) {
      list.push({
        id: 'pension-split',
        severity: 'warning',
        icon: 'bi-people-fill',
        title: 'Enable Canadian Pension Income Splitting',
        description:
          'Couples can split up to 50% of eligible RRIF/LIF/DB pension income starting at age 65, lowering household marginal tax brackets and protecting both partners from OAS clawback.',
        impactLabel: 'Tax Savings',
        ctaLabel: 'Enable Pension Split',
        onApply: () => {
          updateInput('pension_split_enabled', true);
          setAppliedIds(prev => ({ ...prev, 'pension-split': true }));
        },
      });
    }

    // 3. OAS Clawback Shield
    let clawbackYears = 0;
    let totalClawback = 0;
    for (const yr of timeline) {
      const cb = (Number(yr.oasClawbackP1) || 0) + (Number(yr.oasClawbackP2) || 0);
      if (cb > 50) {
        clawbackYears += 1;
        totalClawback += cb;
      }
    }
    if (clawbackYears > 0 && !inputs.oas_clawback_optimize) {
      list.push({
        id: 'oas-shield',
        severity: 'warning',
        icon: 'bi-shield-exclamation',
        title: `OAS clawback detected in ${clawbackYears} ${clawbackYears === 1 ? 'year' : 'years'} (${fmtCurrency(totalClawback)} total)`,
        description:
          'Your taxable retirement income crosses the CRA OAS recovery threshold. Turning on the OAS Clawback Shield prioritizes TFSA/Non-Reg draws once you approach the threshold.',
        impactLabel: 'Protect OAS',
        ctaLabel: 'Enable OAS Shield',
        onApply: () => {
          updateInput('oas_clawback_optimize', true);
          setAppliedIds(prev => ({ ...prev, 'oas-shield': true }));
        },
      });
    }

    // 4. Smart RRSP Meltdown / Tax Bracket Filling
    const year0 = timeline[0];
    const totalRrsp =
      (Number(year0?.assetsP1?.rrsp) || 0) +
      (isCouple ? Number(year0?.assetsP2?.rrsp) || 0 : 0) +
      (Number(year0?.assetsP1?.rrif_acct) || 0) +
      (isCouple ? Number(year0?.assetsP2?.rrif_acct) || 0 : 0);

    if (totalRrsp >= 150000 && !inputs.fully_optimize_tax) {
      list.push({
        id: 'rrsp-meltdown',
        severity: 'info',
        icon: 'bi-sliders',
        title: 'Consider Smart RRSP Meltdown before age 71',
        description: `You hold ${fmtCurrency(totalRrsp)} in RRSP/RRIF accounts. Proactively melting down RRSPs in low-income early retirement years can reduce forced RRIF withdrawals and terminal estate taxes.`,
        impactLabel: 'Estate & Tax',
        ctaLabel: 'Enable RRSP Meltdown',
        onApply: () => {
          updateInput('fully_optimize_tax', true);
          setAppliedIds(prev => ({ ...prev, 'rrsp-meltdown': true }));
        },
      });
    }

    // 5. Emergency Fund Check
    if (planScore && planScore.emergencyFund < 8) {
      list.push({
        id: 'emergency-fund',
        severity: 'info',
        icon: 'bi-umbrella-fill',
        title: `Build liquid cash / TFSA buffer (Score: ${planScore.emergencyFund}/10)`,
        description:
          'Planfolio targets 6 months of core expenses in liquid cash or TFSA. Strengthening your short-term buffer prevents forced selling during market downturns.',
        impactLabel: 'Resilience',
        ctaLabel: onNavigate ? 'Emergency Fund Tool' : undefined,
        onApply: onNavigate ? () => onNavigate('optimizers', 'emerg') : undefined,
      });
    }

    // 6. Debt-to-Income Check
    if (planScore && planScore.debtHealth < 12) {
      list.push({
        id: 'debt-health',
        severity: 'warning',
        icon: 'bi-credit-card-2-back-fill',
        title: `High debt-to-income ratio (Score: ${planScore.debtHealth}/20)`,
        description:
          'Mortgage and debt repayments exceed the 36% DTI guideline. Accelerating high-interest debt payoff or refinancing before retirement improves cash-flow flexibility.',
        impactLabel: 'Cash Flow',
        ctaLabel: onNavigate ? 'Review Debt Inputs' : undefined,
        onApply: onNavigate ? () => onNavigate('plan') : undefined,
      });
    }

    return list.slice(0, 5);
  }, [data, results, planScore, updateInput, onNavigate]);

  return (
    <div className="rp-card border border-secondary rounded-4 shadow-sm mt-4" data-html2canvas-ignore="true">
      <div className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom border-secondary p-3 surface-card">
        <div className="d-flex align-items-center gap-2">
          <h6 className="fw-bold mb-0 text-uppercase ls-1 text-primary d-flex align-items-center">
            <i className="bi bi-check2-circle me-2"></i>
            Next Best Actions
          </h6>
          <InfoBtn
            title="Next Best Actions Checklist"
            text="Live diagnostics over your current projection checking for portfolio shortfalls, OAS clawbacks, pension splitting opportunities, RRSP meltdown potential, emergency reserves, and debt health."
          />
        </div>
        <span
          className={`badge rounded-pill px-3 py-2 border ${
            actions.length === 0
              ? 'bg-success bg-opacity-10 text-success border-success'
              : 'bg-primary bg-opacity-10 text-primary border-primary'
          }`}
          style={{ fontSize: '0.72rem' }}
        >
          {actions.length === 0
            ? 'All Checks Passing'
            : `${actions.length} ${actions.length === 1 ? 'Opportunity' : 'Opportunities'} Found`}
        </span>
      </div>

      <div className="card-body p-3 p-md-4 bg-secondary bg-opacity-10">
        {actions.length === 0 ? (
          <div className="p-3 rounded-4 bg-input border border-success border-opacity-50 d-flex align-items-center gap-3">
            <div
              className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: '40px', height: '40px' }}
            >
              <i className="bi bi-stars fs-5"></i>
            </div>
            <div>
              <div className="fw-bold text-main">Your plan looks well-optimized</div>
              <div className="small text-muted">
                No portfolio shortfalls, OAS clawback leaks, or unenabled Canadian tax optimizations were detected.
                Try Stress Testing &amp; Risk to test extreme market or survivor scenarios.
              </div>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {actions.map(item => {
              const tone =
                item.severity === 'danger'
                  ? 'danger'
                  : item.severity === 'warning'
                    ? 'warning'
                    : item.severity === 'success'
                      ? 'success'
                      : 'info';
              const isApplied = Boolean(appliedIds[item.id]);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-4 bg-input border border-secondary shadow-sm d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3"
                >
                  <div className="d-flex align-items-start gap-3">
                    <div
                      className={`rounded-3 bg-${tone} bg-opacity-10 text-${tone} d-flex align-items-center justify-content-center flex-shrink-0 mt-1`}
                      style={{ width: '36px', height: '36px' }}
                    >
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <div>
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                        <span className="fw-bold text-main" style={{ fontSize: '0.92rem' }}>
                          {item.title}
                        </span>
                        {item.impactLabel && (
                          <span
                            className={`badge rounded-pill bg-${tone} bg-opacity-10 text-${tone} border border-${tone}`}
                            style={{ fontSize: '0.68rem' }}
                          >
                            {item.impactLabel}
                          </span>
                        )}
                      </div>
                      <p className="small text-muted mb-0" style={{ lineHeight: 1.45 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.onApply && item.ctaLabel && (
                    <div className="flex-shrink-0 align-self-stretch align-self-md-center d-flex align-items-center">
                      <button
                        type="button"
                        className={`btn btn-sm fw-bold rounded-pill px-3 py-2 text-nowrap ${
                          isApplied ? 'btn-success' : `btn-outline-${tone}`
                        }`}
                        onClick={item.onApply}
                        disabled={isApplied}
                      >
                        <i className={`bi ${isApplied ? 'bi-check-lg' : 'bi-magic'} me-1`}></i>
                        {isApplied ? 'Applied' : item.ctaLabel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
