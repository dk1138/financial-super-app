import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePlanScore } from './scoring.ts';

describe('calculatePlanScore', () => {
  it('returns zeroes for empty timeline', () => {
    const score = calculatePlanScore({ mode: 'Single', inputs: { inflation_rate: 2.1, p1_retireAge: 65 } }, []);
    assert.equal(score.totalScore, 0);
  });

  it('awards strong scores for a healthy funded plan with 6+ months cash, 20%+ savings, and low DTI', () => {
    const data = { mode: 'Single', inputs: { inflation_rate: 2.0, p1_retireAge: 65 } };
    const timeline = [
      {
        year: 2026,
        p1Age: 40,
        expenses: 48000,
        mortgagePay: 12000,
        debtRepayment: 0,
        grossInflow: 120000,
        liquidNW: 500000,
        assetsP1: { cash: 20000, tfsa: 20000 },
        flows: { contributions: { p1: { rrsp: 18000, tfsa: 7000 } } },
      },
      {
        year: 2051,
        p1Age: 65,
        expenses: 60000,
        mortgagePay: 0,
        debtRepayment: 0,
        grossInflow: 70000,
        liquidNW: 1500000,
      },
    ];

    const score = calculatePlanScore(data, timeline);
    assert.equal(score.emergencyFund, 10);
    assert.equal(score.savingsRate, 20);
    assert.equal(score.debtHealth, 20);
    assert.ok(score.retirementReadiness >= 30 && score.retirementReadiness <= 50);
    assert.ok(score.totalScore >= 80);
  });

  it('sets retirementReadiness to 0 when portfolio runs out during retirement', () => {
    const data = { mode: 'Single', inputs: { inflation_rate: 2.0, p1_retireAge: 65 } };
    const timeline = [
      {
        year: 2026,
        p1Age: 60,
        expenses: 60000,
        mortgagePay: 0,
        debtRepayment: 0,
        grossInflow: 80000,
        liquidNW: 100000,
        assetsP1: { cash: 10000, tfsa: 0 },
        flows: { contributions: { p1: {} } },
      },
      {
        year: 2031,
        p1Age: 65,
        expenses: 65000,
        mortgagePay: 0,
        debtRepayment: 0,
        grossInflow: 20000,
        liquidNW: 0,
      },
    ];

    const score = calculatePlanScore(data, timeline);
    assert.equal(score.retirementReadiness, 0);
  });

  it('awards full savingsRate points when user is already retired in Year 0', () => {
    const data = { mode: 'Single', inputs: { inflation_rate: 2.0, p1_retireAge: 65 } };
    const timeline = [
      {
        year: 2026,
        p1Age: 67,
        expenses: 50000,
        mortgagePay: 0,
        debtRepayment: 0,
        grossInflow: 60000,
        liquidNW: 1200000,
        assetsP1: { cash: 30000, tfsa: 50000 },
        flows: { contributions: { p1: {} } },
      },
    ];

    const score = calculatePlanScore(data, timeline);
    assert.equal(score.savingsRate, 20);
    assert.equal(score.debtHealth, 20);
    assert.equal(score.emergencyFund, 10);
  });
});
