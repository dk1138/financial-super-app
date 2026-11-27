import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSpreadsheetColumns,
  extractSpreadsheetRow,
  generateDetailedProjectionCSV,
} from './projectionSpreadsheet.ts';

const sampleTimelineRow = {
  year: 2035,
  p1Age: 66,
  p2Age: 64,
  incomeP1: 0,
  incomeP2: 45000,
  cppP1: 14500,
  cppP2: 0,
  oasP1: 8800,
  oasP2: 0,
  dbP1: 24000,
  dbP2: 12000,
  invIncP1: 3200,
  invIncP2: 1500,
  rentalP1: 0,
  rentalP2: 0,
  otherP1: 0,
  otherP2: 0,
  postRetP1: 0,
  postRetP2: 0,
  ccbP1: 0,
  cesgGrant: 500,
  eiMatP1: 0,
  eiMatP2: 0,
  flows: {
    contributions: {
      p1: { nonreg: 2000, tfsa: 7000, rrsp: 0, fhsa: 0, resp: 2500, cash: 0 },
      p2: { nonreg: 1000, tfsa: 7000, rrsp: 5000, fhsa: 0, resp: 0, cash: 500 },
    },
    withdrawals: {
      'P1 Non-Reg': 8000,
      'P1 TFSA': 5000,
      'P1 RRSP': 10000,
      'P1 RRIF': 4000,
      'P2 Non-Reg': 3000,
      'P2 RRIF': 2000,
    },
  },
  expenses: 72000,
  rentPay: 0,
  mortgagePay: 18000,
  debtRepayment: 0,
  eduExpense: 0,
  taxP1: 11200,
  taxP2: 9500,
  taxDetailsP1: { oas_clawback: 1200 },
  taxDetailsP2: { oas_clawback: 0 },
  pensionSplit: { p1ToP2: 6000, p2ToP1: 0 },
  assetsP1: { nonreg: 150000, tfsa: 120000, rrsp: 200000, rrif_acct: 100000, lif: 50000, cash: 20000 },
  assetsP2: { nonreg: 80000, tfsa: 110000, rrsp: 180000, rrif_acct: 0, lif: 0, cash: 10000 },
  liquidNW: 1020000,
  reIncludedEq: 650000,
  reExcludedEq: 0,
  afterTaxEstate: 1450000,
};

test('buildSpreadsheetColumns includes P2 columns only in Couple mode', () => {
  const coupleCols = buildSpreadsheetColumns(true, 'Alex', 'Sam');
  const singleCols = buildSpreadsheetColumns(false, 'Alex', 'Sam');

  assert.ok(coupleCols.some((c) => c.key === 'p2_cpp' && c.label === 'Sam CPP'));
  assert.ok(coupleCols.some((c) => c.key === 'p1_w_rrif' && c.label === 'Alex RRIF'));
  assert.equal(singleCols.some((c) => c.key === 'p2_cpp'), false);
  assert.equal(singleCols.some((c) => c.key === 'p2Age'), false);
  assert.ok(coupleCols.length > singleCols.length);
});

test('extractSpreadsheetRow accurately maps P1 & P2 income, benefits, contributions, withdrawals, spending, taxes, and balances', () => {
  const row = extractSpreadsheetRow(sampleTimelineRow, {
    isCouple: true,
    p1Label: 'P1',
    p2Label: 'P2',
    p1RetireAge: 65,
    p2RetireAge: 65,
    gogoAge: 75,
    slowAge: 85,
    getRealValue: (v) => v,
  });

  assert.equal(row.year, 2035);
  assert.equal(row.phase, 'Transition');
  assert.equal(row.p1_cpp, 14500);
  assert.equal(row.p1_oas, 8800);
  assert.equal(row.p1_db, 24000);
  assert.equal(row.p2_db, 12000);
  assert.equal(row.cesg, 500);
  assert.equal(row.p1_c_tfsa, 7000);
  assert.equal(row.p2_c_rrsp, 5000);
  assert.equal(row.total_contrib, 25000);
  assert.equal(row.p1_w_rrsp, 10000);
  assert.equal(row.p1_w_rrif, 4000);
  assert.equal(row.total_wd, 32000);
  assert.equal(row.total_spending, 90000);
  assert.equal(row.p1_tax, 10000); // 11200 - 1200 clawback
  assert.equal(row.oas_clawback, 1200);
  assert.equal(row.total_tax, 20700);
  assert.equal(row.pension_split, 6000);
  assert.equal(row.p1_b_rrsp_rrif, 300000);
  assert.equal(row.total_estate, 1450000);
});

test('generateDetailedProjectionCSV outputs UTF-8 BOM, headers, and discounted values', () => {
  const csv = generateDetailedProjectionCSV([sampleTimelineRow], {
    isCouple: true,
    p1Label: 'P1',
    p2Label: 'P2',
    p1RetireAge: 65,
    p2RetireAge: 65,
    gogoAge: 75,
    slowAge: 85,
    getRealValue: (v) => v * 0.5,
  });

  assert.ok(csv.startsWith('\uFEFFYear,P1 Age,P2 Age,Phase,'));
  const lines = csv.slice(1).split('\n');
  assert.equal(lines.length, 2);
  assert.ok(lines[0].includes('P1 CPP'));
  assert.ok(lines[0].includes('P2 DB Pension'));
  assert.ok(lines[0].includes('P1 Contrib: TFSA'));
  assert.ok(lines[0].includes('P1 Wd: RRIF'));
  assert.ok(lines[1].includes(',7250,')); // P1 CPP 14500 * 0.5
});
