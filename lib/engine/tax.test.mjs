import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FINANCIAL_CONSTANTS } from '../config.js';
import {
  calculateProgressiveTax,
  getInflatedTaxData,
  calculateTaxDetailed,
} from './tax.ts';
import {
  calcTaxableCapitalGain,
  applyPensionSplitting,
} from './cashflow.ts';

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
  it('inflates brackets and surtaxes while keeping statutory frozen brackets (ON $150k/$220k, MB, YT $500k, BC 2027-2030) unindexed', () => {
    const inflated = getInflatedTaxData(FINANCIAL_CONSTANTS.TAX_DATA, 1.10, 2);

    assertClose(inflated.ON.brackets[0], 53891 * 1.10);
    assertClose(inflated.ON.brackets[1], 107785 * 1.10);
    assert.equal(inflated.ON.brackets[2], 150000);
    assert.equal(inflated.ON.brackets[3], 220000);
    assert.equal(inflated.MB.brackets[0], 47000);
    assert.equal(inflated.MB.brackets[1], 100000);
    assert.equal(inflated.YT.brackets[3], 500000);
    assert.equal(inflated.BC.brackets[0], 50363);

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

  it('uses configured Ontario surtax thresholds ($5,818 / $7,446), stacked 20%/36% surtax, and zeroes OTR at high income', () => {
    const res = calculateTaxDetailed(250000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 250000, 1);
    assert.ok(res.surtax > 8000, `Expected Ontario surtax > $8,000, got ${res.surtax}`);
    // Top ON bracket (13.16%) * 1.56 = 20.5296%, plus fed bracket (29% at $250k)
    assertClose(res.margRate, 0.29 + 0.1316 * 1.56, 0.0001);

    // Low-income Ontario filer ($18,000 pension/investment income -> ~$253 basic ON tax) gets full OTR wipeout to $0 basic tax
    const low = calculateTaxDetailed(18000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 0, 1, 0, 40);
    assert.equal(low.prov, 0);
  });

  it('applies Ontario Dividend Tax Credit BEFORE Ontario Surtax (CRA ON428)', () => {
    // $138,000 taxable income from $100,000 eligible Canadian dividends (1.38x gross-up)
    const withDivs = calculateTaxDetailed(138000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 0, 1, 100000, 50, 0, -1, true);
    const noDivs = calculateTaxDetailed(138000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 0, 1, 0, 50, 0, -1, true);

    assert.equal(withDivs.surtax, 0);
    assert.ok(noDivs.surtax > 0);
  });

  it('calculates OAS clawback at 15% above threshold and caps it at OAS received', () => {
    const threshold = FINANCIAL_CONSTANTS.OAS_CLAWBACK_THRESHOLD;
    const oas = 8560;

    const partial = calculateTaxDetailed(threshold + 10000, 'ON', taxData, FINANCIAL_CONSTANTS, oas, threshold, 0, 1, 0, 67);
    assertClose(partial.oas_clawback, 1500);

    const full = calculateTaxDetailed(threshold + 200000, 'ON', taxData, FINANCIAL_CONSTANTS, oas, threshold, 0, 1, 0, 67);
    assertClose(full.oas_clawback, oas);
  });

  it('applies Quebec 16.5% federal abatement, QPP/QC-EI/QPIP payroll rates, and abated QC marginal rate', () => {
    // Non-employment income: exact 16.5% federal abatement vs Ontario
    const onInv = calculateTaxDetailed(100000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 0, 1);
    const qcInv = calculateTaxDetailed(100000, 'QC', taxData, FINANCIAL_CONSTANTS, 0, 0, 0, 1);
    assertClose(qcInv.fed, onInv.fed * (1 - 0.165));
    assertClose(qcInv.margRate, 0.205 * (1 - 0.165) + 0.19, 0.0001);

    // Employment income ($100,000): QPP (6.30% to $74,600) + QPP2 (4% to $85,000) + QC EI (1.30% to $68,900) + QPIP (0.43% to $100,000)
    const qcEmp = calculateTaxDetailed(100000, 'QC', taxData, FINANCIAL_CONSTANTS, 0, 0, 100000, 1);
    const expQpp = (74600 - 3500) * (0.053 + 0.01) + (85000 - 74600) * 0.04;
    const expQcEi = 68900 * 0.0130;
    const expQpip = 100000 * 0.0043;
    assertClose(qcEmp.cpp_ei, expQpp + expQcEi + expQpip);
  });

  it('computes CPP Tier 1, CPP Tier 2 (YAMPE), and EI premiums accurately and exempts age 70+ from CPP', () => {
    const res = calculateTaxDetailed(100000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 100000, 1, 0, 45);
    const expectedCppBase = (FINANCIAL_CONSTANTS.YMPE - FINANCIAL_CONSTANTS.CPP_EXEMPTION) * FINANCIAL_CONSTANTS.CPP_RATE;
    const expectedCppEnh1 = (FINANCIAL_CONSTANTS.YMPE - FINANCIAL_CONSTANTS.CPP_EXEMPTION) * FINANCIAL_CONSTANTS.CPP_ENHANCED_RATE;
    const expectedCppEnh2 = (FINANCIAL_CONSTANTS.YAMPE - FINANCIAL_CONSTANTS.YMPE) * FINANCIAL_CONSTANTS.CPP_ENHANCED_TIER2_RATE;
    const expectedEi = FINANCIAL_CONSTANTS.EI_MAX_INSURABLE * FINANCIAL_CONSTANTS.EI_RATE;

    assertClose(res.cpp_ei, expectedCppBase + expectedCppEnh1 + expectedCppEnh2 + expectedEi);

    const seniorWorker = calculateTaxDetailed(50000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 50000, 1, 0, 72);
    assert.equal(seniorWorker.cppPremium, 0);
    assert.equal(seniorWorker.cpp2Premium, 0);
  });

  it('allows Ontario Seniors Public Transit refundable credit to reduce provincial tax below zero', () => {
    const res = calculateTaxDetailed(12000, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, 0, 1, 0, 68, 0, -1, true, { transit: 2000 });
    assertClose(res.rtc.transit, 300);
    assertClose(res.prov, -300);
  });

  it('defines complete provincial/territorial constants for all 13 jurisdictions', () => {
    const jurisdictions = ['ON', 'BC', 'AB', 'QC', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'YT', 'NT', 'NU'];
    for (const j of jurisdictions) {
      assert.ok(FINANCIAL_CONSTANTS.PROV_BPA[j] > 0, `Missing PROV_BPA for ${j}`);
      assert.ok(FINANCIAL_CONSTANTS.PROV_PENSION_AMOUNT[j] > 0, `Missing PROV_PENSION_AMOUNT for ${j}`);
      assert.ok(FINANCIAL_CONSTANTS.PROV_DISABILITY_AMOUNT[j] > 0, `Missing PROV_DISABILITY_AMOUNT for ${j}`);
      assert.ok(FINANCIAL_CONSTANTS.PROV_DIV_CREDIT_ELIGIBLE[j] > 0, `Missing PROV_DIV_CREDIT_ELIGIBLE for ${j}`);
      assert.ok(FINANCIAL_CONSTANTS.PROV_DIV_CREDIT_NON_ELIGIBLE[j] > 0, `Missing PROV_DIV_CREDIT_NON_ELIGIBLE for ${j}`);
      const res = calculateTaxDetailed(90000, j, taxData, FINANCIAL_CONSTANTS, 0, 0, 90000, 1);
      assert.ok(res.totalTax > 0 && Number.isFinite(res.totalTax), `Invalid tax for ${j}`);
    }
  });

  it('computes Ontario Health Premium accurately across all statutory tier boundaries', () => {
    const ohpAt = (income) =>
      calculateTaxDetailed(income, 'ON', taxData, FINANCIAL_CONSTANTS, 0, 0, income, 1).ohp;

    assert.equal(ohpAt(20000), 0);
    assertClose(ohpAt(25000), 300);
    assertClose(ohpAt(36000), 300);
    assertClose(ohpAt(38500), 450);
    assertClose(ohpAt(48600), 600);
    assertClose(ohpAt(72600), 750);
    assertClose(ohpAt(200600), 900);
    assertClose(ohpAt(300000), 900);
  });
});

describe('Capital Gains & Pension Splitting Statutory Caps (2026)', () => {
  it('applies flat 50% capital gains inclusion rate across all gain sizes (March 2025 cancellation)', () => {
    assert.equal(calcTaxableCapitalGain(100000, 0), 50000);
    assert.equal(calcTaxableCapitalGain(400000, 0), 200000);
    assert.equal(calcTaxableCapitalGain(200000, 200000), 100000);
  });

  it('enforces the 50% statutory RRIF pension-splitting cap even when wdBreakdown mirrors regMins', () => {
    let splitAmt = 0;
    applyPensionSplitting(
      100000,
      20000,
      { p1: { pension: 0 }, p2: { pension: 0 } },
      { p1: 40000, p2: 0, lifTaken1: 0, lifTaken2: 0 },
      72,
      70,
      (_new1, _new2, amt) => { splitAmt = amt; },
      { p1: { RRIF: 40000 }, p2: {} }
    );
    assert.equal(splitAmt, 20000);
  });
});

describe('2026 CRA Verification Test Matrix (5 Household Benchmarks)', () => {
  const taxData = getInflatedTaxData(FINANCIAL_CONSTANTS.TAX_DATA, 1);
  const oasThresh = FINANCIAL_CONSTANTS.OAS_CLAWBACK_THRESHOLD;

  it('Case 1: Single ON retiree (age 70) at $98k income hitting OAS clawback', () => {
    const res = calculateTaxDetailed(98000, 'ON', taxData, FINANCIAL_CONSTANTS, 8560, oasThresh, 0, 1, 0, 70, 71440);
    assertClose(res.oas_clawback, 401.55, 0.5);
    assertClose(res.fed, 13406, 2);
    assertClose(res.prov, 6755, 2);
    assertClose(res.totalTax, 20563, 2);
  });

  it('Case 2: Alberta couple (age 72/72) splitting $90k RRIF income (50% cap = $45k) to eliminate OAS clawback', () => {
    const pre1 = calculateTaxDetailed(113560, 'AB', taxData, FINANCIAL_CONSTANTS, 8560, oasThresh, 0, 1, 0, 72, 90000, 18560);
    const pre2 = calculateTaxDetailed(18560, 'AB', taxData, FINANCIAL_CONSTANTS, 8560, oasThresh, 0, 1, 0, 72, 0, 113560);
    const post1 = calculateTaxDetailed(68560, 'AB', taxData, FINANCIAL_CONSTANTS, 8560, oasThresh, 0, 1, 0, 72, 45000, 63560);
    const post2 = calculateTaxDetailed(63560, 'AB', taxData, FINANCIAL_CONSTANTS, 8560, oasThresh, 0, 1, 0, 72, 45000, 68560);

    assert.equal(post1.oas_clawback, 0);
    assert.equal(post2.oas_clawback, 0);
    assertClose(pre1.totalTax + pre2.totalTax, 26780, 200);
    assertClose(post1.totalTax + post2.totalTax, 18874, 3);
  });

  it('Case 3: BC high-earner (age 50) with $150k salary + $50k cash eligible dividends ($69k grossed-up)', () => {
    const res = calculateTaxDetailed(219000, 'BC', taxData, FINANCIAL_CONSTANTS, 0, 0, 150000, 1, 50000, 50, 0, -1, true);
    assertClose(res.cpp_ei, 5770, 2);
    assertClose(res.fed, 34079, 2);
    assertClose(res.prov, 13992, 2);
    assertClose(res.totalTax, 53840, 2);
  });

  it('Case 4: Single ON retiree (age 76) with $45k RRIF + $40k cash eligible dividends + age-75 OAS boost', () => {
    const oas75 = 8560 * 1.10; // $9,416
    const line23400 = 45000 + 40000 * 1.38 + oas75; // $109,616
    const res = calculateTaxDetailed(line23400, 'ON', taxData, FINANCIAL_CONSTANTS, oas75, oasThresh, 0, 1, 40000, 76, 45000, -1, true);
    assertClose(res.oas_clawback, 2144, 2);
    assert.equal(res.surtax, 0);
    assertClose(res.fed, 7346, 2);
    assertClose(res.prov, 2080, 2);
    assertClose(res.totalTax, 11570, 2);
  });

  it('Case 5: Single QC employee (age 45) with $90k salary + $300k realized capital gain ($150k taxable @ flat 50%)', () => {
    const taxCg = calcTaxableCapitalGain(300000, 0);
    assert.equal(taxCg, 150000);
    const res = calculateTaxDetailed(90000 + taxCg, 'QC', taxData, FINANCIAL_CONSTANTS, 0, 0, 90000, 1, 0, 45, 0, -1, true, {}, 300000);
    assertClose(res.cpp_ei, 6178, 2);
    assert.equal(res.amt, 0);
    assertClose(res.fed, 42199, 2);
    assertClose(res.prov, 48391, 2);
    assertClose(res.totalTax, 96768, 2);
  });
});

