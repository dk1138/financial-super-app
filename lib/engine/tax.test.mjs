import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FINANCIAL_CONSTANTS } from '../config.js';
import {
  calculateProgressiveTax,
  getInflatedTaxData,
  calculateTaxDetailed,
} from './tax.ts';

const assertClose = (actual, expected, tolerance = 0.01) => {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `Expected ${actual} to be within ${tolerance} of ${expected}`
  );
};

describe('calculateProgressiveTax', () => {
  it('computes progressive tax and marginal rate across brackets', () => {
    const brackets = [50000, 100000];
    const rates = [0.10, 0.20, 0.30];

    assert.deepEqual(calculateProgressiveTax(30000, brackets, rates), {
      tax: 3000,
      marginalRate: 0.10,
    });

    assert.deepEqual(calculateProgressiveTax(75000, brackets, rates), {
      tax: 50000 * 0.10 + 25000 * 0.20,
      marginalRate: 0.20,
    });

    assert.deepEqual(calculateProgressiveTax(120000, brackets, rates), {
      tax: 50000 * 0.10 + 50000 * 0.20 + 20000 * 0.30,
      marginalRate: 0.30,
    });
  });
});

describe('getInflatedTaxData', () => {
  it('inflates brackets and surtaxes while keeping Ontario fixed top brackets ($150k / $220k) unindexed', () => {
    const inflated = getInflatedTaxData(FINANCIAL_CONSTANTS.TAX_DATA, 1.10);

    assertClose(inflated.ON.brackets[0], 53891 * 1.10);
    assertClose(inflated.ON.brackets[1], 107785 * 1.10);
    assert.equal(inflated.ON.brackets[2], 150000);
    assert.equal(inflated.ON.brackets[3], 220000);

    assert.equal(inflated.ON.surtaxes.length, 2);
    assertClose(inflated.ON.surtaxes[0].threshold, 5818 * 1.10);
    assertClose(inflated.ON.surtaxes[1].threshold, 7446 * 1.10);
  });
});

describe('calculateTaxDetailed', () => {
  const taxData = getInflatedTaxData(FINANCIAL_CONSTANTS.TAX_DATA, 1);

  it('returns zeroes for zero or negative taxable income', () => {
    const res = calculateTaxDetailed(0, 'ON', taxData, FINANCIAL_CONSTANTS);
    assert.equal(res.totalTax, 0);
    assert.equal(res.margRate, 0);

    const neg = calculateTaxDetailed(-5000, 'ON', taxData, FINANCIAL_CONSTANTS);
    assert.equal(neg.totalTax, 0);
  });

  it('uses configured Ontario surtax thresholds ($5,818 / $7,446) and applies stacked 20%/36% surtax', () => {
    const res = calculateTaxDetailed(250000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 250000, 1);
    assert.ok(res.surtax > 8000, `Expected Ontario surtax > $8,000, got ${res.surtax}`);
    // Top ON bracket (13.16%) * 1.56 = 20.5296%, plus fed bracket (29% at $250k)
    assertClose(res.margRate, 0.29 + 0.1316 * 1.56, 0.0001);
  });

  it('applies Ontario Dividend Tax Credit BEFORE Ontario Surtax (CRA ON428)', () => {
    // $138,000 taxable income from $100,000 eligible Canadian dividends (1.38x gross-up)
    const withDivs = calculateTaxDetailed(
      138000,
      'ON',
      taxData,
      FINANCIAL_CONSTANTS,
      0,
      0,
      0,
      1,
      100000,
      50,
      0,
      -1,
      true
    );
    const noDivs = calculateTaxDetailed(
      138000,
      'ON',
      taxData,
      FINANCIAL_CONSTANTS,
      0,
      0,
      0,
      1,
      0,
      50,
      0,
      -1,
      true
    );

    // Eligible DTC wipes out Basic Ontario Tax at $100k actual dividends, so Ontario surtax must be $0
    assert.equal(withDivs.surtax, 0);
    assert.ok(noDivs.surtax > 0);
  });

  it('calculates OAS clawback at 15% above threshold and caps it at OAS received', () => {
    const threshold = FINANCIAL_CONSTANTS.OAS_CLAWBACK_THRESHOLD;
    const oas = 8560;

    const partial = calculateTaxDetailed(
      threshold + 10000,
      'ON',
      taxData,
      FINANCIAL_CONSTANTS,
      oas,
      threshold,
      0,
      1,
      0,
      67
    );
    assertClose(partial.oas_clawback, 1500);

    const full = calculateTaxDetailed(
      threshold + 200000,
      'ON',
      taxData,
      FINANCIAL_CONSTANTS,
      oas,
      threshold,
      0,
      1,
      0,
      67
    );
    assertClose(full.oas_clawback, oas);
  });

  it('applies Quebec 16.5% federal tax abatement', () => {
    const onTax = calculateTaxDetailed(100000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 100000, 1);
    const qcTax = calculateTaxDetailed(100000, 'QC', taxData, FINANCIAL_CONSTANTS, 0, 0, 100000, 1);

    assertClose(qcTax.fed, onTax.fed * (1 - 0.165));
  });

  it('computes CPP Tier 1, CPP Tier 2 (YAMPE), and EI premiums accurately', () => {
    const res = calculateTaxDetailed(100000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 100000, 1);
    const expectedCppBase = (FINANCIAL_CONSTANTS.YMPE - FINANCIAL_CONSTANTS.CPP_EXEMPTION) * FINANCIAL_CONSTANTS.CPP_RATE;
    const expectedCppEnh1 = (FINANCIAL_CONSTANTS.YMPE - FINANCIAL_CONSTANTS.CPP_EXEMPTION) * FINANCIAL_CONSTANTS.CPP_ENHANCED_RATE;
    const expectedCppEnh2 = (FINANCIAL_CONSTANTS.YAMPE - FINANCIAL_CONSTANTS.YMPE) * FINANCIAL_CONSTANTS.CPP_ENHANCED_TIER2_RATE;
    const expectedEi = FINANCIAL_CONSTANTS.EI_MAX_INSURABLE * FINANCIAL_CONSTANTS.EI_RATE;

    assertClose(res.cpp_ei, expectedCppBase + expectedCppEnh1 + expectedCppEnh2 + expectedEi);
  });

  it('allows Ontario Seniors Public Transit refundable credit to reduce provincial tax below zero', () => {
    const res = calculateTaxDetailed(
      12000,
      'ON',
      taxData,
      FINANCIAL_CONSTANTS,
      0,
      0,
      0,
      1,
      0,
      68,
      0,
      -1,
      true,
      { transit: 2000 }
    );

    assertClose(res.rtc.transit, 300);
    assertClose(res.prov, -300);
  });
});
