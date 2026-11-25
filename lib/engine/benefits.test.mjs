import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FINANCIAL_CONSTANTS } from '../config.js';
import {
  getRrifFactor,
  getLifMaxFactor,
  calcBenefitAmount,
  calculateCCBForYear,
} from './benefits.ts';

const assertClose = (actual, expected, tolerance = 0.01) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`
  );
};

describe('getRrifFactor', () => {
  it('computes 1/(90-age) under age 71, CRA prescribed factors 71-94, and caps at 20% at 95+', () => {
    assertClose(getRrifFactor(65), 1 / 25, 0.0001);
    assert.equal(getRrifFactor(71), 0.0528);
    assert.equal(getRrifFactor(72), 0.0540);
    assert.equal(getRrifFactor(94), 0.1879);
    assert.equal(getRrifFactor(95), 0.20);
    assert.equal(getRrifFactor(102), 0.20);
  });
});

describe('getLifMaxFactor', () => {
  it('returns provincial group max withdrawal rates and 100% / 20% caps at 89+', () => {
    assert.equal(getLifMaxFactor(65, 'ON'), 0.0738);
    assert.equal(getLifMaxFactor(65, 'QC'), 0.0720);
    assert.equal(getLifMaxFactor(89, 'ON'), 1.0);
    assert.equal(getLifMaxFactor(89, 'QC'), 0.2);
  });
});

describe('calcBenefitAmount', () => {
  it('applies CPP early (-0.6%/mo) and late (+0.7%/mo) actuarial adjustments', () => {
    // Taking CPP at 60 = 60 months early -> -36%
    assertClose(calcBenefitAmount(18000, 60, 1, 60, 'cpp'), 18000 * 0.64);
    // Taking CPP at 65 = baseline
    assertClose(calcBenefitAmount(18000, 65, 1, 65, 'cpp'), 18000);
    // Taking CPP at 70 = 60 months late -> +42%
    assertClose(calcBenefitAmount(18000, 70, 1, 65, 'cpp'), 18000 * 1.42);
  });

  it('applies OAS deferral (+0.6%/mo up to +36% at age 70)', () => {
    assertClose(calcBenefitAmount(8560, 65, 1, 65, 'oas'), 8560);
    assertClose(calcBenefitAmount(8560, 70, 1, 65, 'oas'), 8560 * 1.36);
  });

  it('clamps CPP and OAS adjustments to CRA statutory bounds (60..70 for CPP, 65..70 for OAS)', () => {
    assertClose(calcBenefitAmount(18000, 75, 1, 65, 'cpp'), 18000 * 1.42);
    assertClose(calcBenefitAmount(18000, 55, 1, 60, 'cpp'), 18000 * 0.64);
    assertClose(calcBenefitAmount(8560, 74, 1, 65, 'oas'), 8560 * 1.36);
    assertClose(calcBenefitAmount(8560, 62, 1, 65, 'oas'), 8560);
  });
});

describe('calculateCCBForYear', () => {
  it('returns maximum CCB below first AFNI threshold and reduces above thresholds', () => {
    const deps = [{ name: 'Child 1', dob: '2023-06' }];
    const lowIncomeCCB = calculateCCBForYear(2026, deps, 30000, 1, FINANCIAL_CONSTANTS.CCB_RULES);
    assertClose(lowIncomeCCB, FINANCIAL_CONSTANTS.CCB_RULES.MAX_UNDER_6);

    const highIncomeCCB = calculateCCBForYear(2026, deps, 120000, 1, FINANCIAL_CONSTANTS.CCB_RULES);
    assert.ok(highIncomeCCB < lowIncomeCCB);
    assert.ok(highIncomeCCB >= 0);
  });

  it('returns 0 when there are no dependents', () => {
    assert.equal(calculateCCBForYear(2026, [], 50000, 1, FINANCIAL_CONSTANTS.CCB_RULES), 0);
  });
});
