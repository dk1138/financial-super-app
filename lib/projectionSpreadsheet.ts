/**
 * projectionSpreadsheet.ts
 * Single source of truth for both the in-app Full Yearly Spreadsheet view
 * and the Detailed Yearly Spreadsheet CSV export (Person 1 & Person 2).
 */

export type SpreadsheetGroupId =
  | 'income'
  | 'benefits'
  | 'contributions'
  | 'withdrawals'
  | 'spending'
  | 'taxes'
  | 'balances';

export interface SpreadsheetGroupMeta {
  id: SpreadsheetGroupId;
  label: string;
  shortLabel: string;
  accentClass: string;
  headerBg: string;
}

export const SPREADSHEET_GROUPS: SpreadsheetGroupMeta[] = [
  { id: 'income', label: 'Income & Pensions', shortLabel: 'Income & Pensions', accentClass: 'text-success', headerBg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'benefits', label: 'Gov Benefits', shortLabel: 'Gov Benefits', accentClass: 'text-info', headerBg: 'rgba(14, 165, 233, 0.12)' },
  { id: 'contributions', label: 'Contributions', shortLabel: 'Contributions', accentClass: 'text-primary', headerBg: 'rgba(59, 130, 246, 0.12)' },
  { id: 'withdrawals', label: 'Withdrawals', shortLabel: 'Withdrawals', accentClass: 'text-warning', headerBg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'spending', label: 'Spending', shortLabel: 'Spending', accentClass: 'text-warning', headerBg: 'rgba(217, 119, 6, 0.12)' },
  { id: 'taxes', label: 'Taxes', shortLabel: 'Taxes', accentClass: 'text-danger', headerBg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'balances', label: 'Ending Balances', shortLabel: 'Balances', accentClass: 'text-success', headerBg: 'rgba(34, 197, 94, 0.12)' },
];

export interface SpreadsheetColumn {
  key: string;
  label: string;
  csvHeader: string;
  group: SpreadsheetGroupId | 'core';
  isCurrency?: boolean;
  align?: 'left' | 'center' | 'right';
  colorClass?: string;
}

export interface SpreadsheetBuildOptions {
  isCouple: boolean;
  p1Label?: string;
  p2Label?: string;
  p1RetireAge: number;
  p2RetireAge: number;
  gogoAge: number;
  slowAge: number;
  getRealValue: (nominalValue: number, year: number) => number;
}

export function buildSpreadsheetColumns(
  isCouple: boolean,
  p1Label = 'P1',
  p2Label = 'P2'
): SpreadsheetColumn[] {
  const p1 = (p1Label || 'P1').trim();
  const p2 = (p2Label || 'P2').trim();

  const cols: SpreadsheetColumn[] = [
    // CORE
    { key: 'year', label: 'Year', csvHeader: 'Year', group: 'core', align: 'left' },
    { key: 'p1Age', label: `${p1} Age`, csvHeader: `${p1} Age`, group: 'core', align: 'center' },
    ...(isCouple ? [{ key: 'p2Age', label: `${p2} Age`, csvHeader: `${p2} Age`, group: 'core' as const, align: 'center' as const }] : []),
    { key: 'phase', label: 'Phase', csvHeader: 'Phase', group: 'core', align: 'center' },

    // INCOME & PENSIONS
    { key: 'p1_earned', label: `${p1} Income`, csvHeader: `${p1} Earned Income`, group: 'income', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_earned', label: `${p2} Income`, csvHeader: `${p2} Earned Income`, group: 'income' as const, isCurrency: true }] : []),
    { key: 'p1_cpp', label: `${p1} CPP`, csvHeader: `${p1} CPP`, group: 'income', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_cpp', label: `${p2} CPP`, csvHeader: `${p2} CPP`, group: 'income' as const, isCurrency: true }] : []),
    { key: 'p1_oas', label: `${p1} OAS`, csvHeader: `${p1} OAS`, group: 'income', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_oas', label: `${p2} OAS`, csvHeader: `${p2} OAS`, group: 'income' as const, isCurrency: true }] : []),
    { key: 'p1_db', label: `${p1} DB Plan`, csvHeader: `${p1} DB Pension`, group: 'income', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_db', label: `${p2} DB Plan`, csvHeader: `${p2} DB Pension`, group: 'income' as const, isCurrency: true }] : []),
    { key: 'p1_otherInc', label: `${p1} Inv/Other`, csvHeader: `${p1} Investment & Other Income`, group: 'income', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_otherInc', label: `${p2} Inv/Other`, csvHeader: `${p2} Investment & Other Income`, group: 'income' as const, isCurrency: true }] : []),

    // GOV BENEFITS
    { key: 'ccb', label: 'CCB', csvHeader: 'Gov Benefit: CCB', group: 'benefits', isCurrency: true },
    { key: 'cesg', label: 'CESG', csvHeader: 'Gov Benefit: RESP CESG Grant', group: 'benefits', isCurrency: true },
    { key: 'eiMat', label: 'EI / Mat', csvHeader: 'Gov Benefit: EI / Maternity', group: 'benefits', isCurrency: true },

    // CONTRIBUTIONS (Non-Reg, TFSA, RRSP, FHSA, RESP, Cash)
    { key: 'p1_c_nonreg', label: `${p1} Non-Reg`, csvHeader: `${p1} Contrib: Non-Reg`, group: 'contributions', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_c_nonreg', label: `${p2} Non-Reg`, csvHeader: `${p2} Contrib: Non-Reg`, group: 'contributions' as const, isCurrency: true }] : []),
    { key: 'p1_c_tfsa', label: `${p1} TFSA`, csvHeader: `${p1} Contrib: TFSA`, group: 'contributions', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_c_tfsa', label: `${p2} TFSA`, csvHeader: `${p2} Contrib: TFSA`, group: 'contributions' as const, isCurrency: true }] : []),
    { key: 'p1_c_rrsp', label: `${p1} RRSP`, csvHeader: `${p1} Contrib: RRSP`, group: 'contributions', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_c_rrsp', label: `${p2} RRSP`, csvHeader: `${p2} Contrib: RRSP`, group: 'contributions' as const, isCurrency: true }] : []),
    { key: 'p1_c_fhsa', label: `${p1} FHSA`, csvHeader: `${p1} Contrib: FHSA`, group: 'contributions', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_c_fhsa', label: `${p2} FHSA`, csvHeader: `${p2} Contrib: FHSA`, group: 'contributions' as const, isCurrency: true }] : []),
    { key: 'resp_c', label: 'RESP', csvHeader: 'Contrib: RESP', group: 'contributions', isCurrency: true },
    { key: 'cash_c', label: 'Cash/Other', csvHeader: 'Contrib: Cash & Crypto', group: 'contributions', isCurrency: true },
    { key: 'total_contrib', label: 'Total Contrib', csvHeader: 'Total Contributions', group: 'contributions', isCurrency: true, colorClass: 'fw-bold text-primary' },

    // WITHDRAWALS (Non-Reg, TFSA, RRSP, RRIF, LIF, FHSA, RESP, Cash)
    { key: 'p1_w_nonreg', label: `${p1} Non-Reg`, csvHeader: `${p1} Wd: Non-Reg`, group: 'withdrawals', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_w_nonreg', label: `${p2} Non-Reg`, csvHeader: `${p2} Wd: Non-Reg`, group: 'withdrawals' as const, isCurrency: true }] : []),
    { key: 'p1_w_tfsa', label: `${p1} TFSA`, csvHeader: `${p1} Wd: TFSA`, group: 'withdrawals', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_w_tfsa', label: `${p2} TFSA`, csvHeader: `${p2} Wd: TFSA`, group: 'withdrawals' as const, isCurrency: true }] : []),
    { key: 'p1_w_rrsp', label: `${p1} RRSP`, csvHeader: `${p1} Wd: RRSP`, group: 'withdrawals', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_w_rrsp', label: `${p2} RRSP`, csvHeader: `${p2} Wd: RRSP`, group: 'withdrawals' as const, isCurrency: true }] : []),
    { key: 'p1_w_rrif', label: `${p1} RRIF`, csvHeader: `${p1} Wd: RRIF`, group: 'withdrawals', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_w_rrif', label: `${p2} RRIF`, csvHeader: `${p2} Wd: RRIF`, group: 'withdrawals' as const, isCurrency: true }] : []),
    { key: 'p1_w_lif', label: `${p1} LIF/LIRA`, csvHeader: `${p1} Wd: LIF/LIRA`, group: 'withdrawals', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_w_lif', label: `${p2} LIF/LIRA`, csvHeader: `${p2} Wd: LIF/LIRA`, group: 'withdrawals' as const, isCurrency: true }] : []),
    { key: 'other_w', label: 'FHSA/RESP/Cash', csvHeader: 'Wd: FHSA/RESP/Cash/Crypto', group: 'withdrawals', isCurrency: true },
    { key: 'total_wd', label: 'Total Wd', csvHeader: 'Total Withdrawals', group: 'withdrawals', isCurrency: true, colorClass: 'fw-bold text-warning' },

    // SPENDING
    { key: 'living_exp', label: 'Living Exp', csvHeader: 'Spending: Living Expenses', group: 'spending', isCurrency: true },
    { key: 'housing_debt', label: 'Housing/Debt', csvHeader: 'Spending: Rent, Mortgage & Debt', group: 'spending', isCurrency: true },
    { key: 'edu_exp', label: 'Education', csvHeader: 'Spending: Education', group: 'spending', isCurrency: true },
    { key: 'total_spending', label: 'Total Spend', csvHeader: 'Total Spending', group: 'spending', isCurrency: true, colorClass: 'fw-bold' },

    // TAXES
    { key: 'p1_tax', label: `${p1} Tax`, csvHeader: `${p1} Income Tax`, group: 'taxes', isCurrency: true, colorClass: 'text-danger' },
    ...(isCouple ? [{ key: 'p2_tax', label: `${p2} Tax`, csvHeader: `${p2} Income Tax`, group: 'taxes' as const, isCurrency: true, colorClass: 'text-danger' }] : []),
    { key: 'oas_clawback', label: 'OAS Clawback', csvHeader: 'OAS Clawback', group: 'taxes', isCurrency: true, colorClass: 'text-danger' },
    ...(isCouple ? [{ key: 'pension_split', label: 'Pension Split', csvHeader: 'Pension Split Transfer', group: 'taxes' as const, isCurrency: true }] : []),
    { key: 'total_tax', label: 'Total Tax', csvHeader: 'Total Taxes Paid', group: 'taxes', isCurrency: true, colorClass: 'fw-bold text-danger' },

    // ENDING BALANCES
    { key: 'p1_b_nonreg', label: `${p1} Non-Reg`, csvHeader: `${p1} Bal: Non-Reg`, group: 'balances', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_b_nonreg', label: `${p2} Non-Reg`, csvHeader: `${p2} Bal: Non-Reg`, group: 'balances' as const, isCurrency: true }] : []),
    { key: 'p1_b_tfsa', label: `${p1} TFSA`, csvHeader: `${p1} Bal: TFSA`, group: 'balances', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_b_tfsa', label: `${p2} TFSA`, csvHeader: `${p2} Bal: TFSA`, group: 'balances' as const, isCurrency: true }] : []),
    { key: 'p1_b_rrsp_rrif', label: `${p1} RRSP/RRIF`, csvHeader: `${p1} Bal: RRSP/RRIF`, group: 'balances', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_b_rrsp_rrif', label: `${p2} RRSP/RRIF`, csvHeader: `${p2} Bal: RRSP/RRIF`, group: 'balances' as const, isCurrency: true }] : []),
    { key: 'p1_b_lif', label: `${p1} LIF/LIRA`, csvHeader: `${p1} Bal: LIF/LIRA`, group: 'balances', isCurrency: true },
    ...(isCouple ? [{ key: 'p2_b_lif', label: `${p2} LIF/LIRA`, csvHeader: `${p2} Bal: LIF/LIRA`, group: 'balances' as const, isCurrency: true }] : []),
    { key: 'other_b', label: 'FHSA/RESP/Cash', csvHeader: 'Bal: FHSA/RESP/Cash/Crypto', group: 'balances', isCurrency: true },
    { key: 'liquid_nw', label: 'Liquid NW', csvHeader: 'Liquid Net Worth', group: 'balances', isCurrency: true, colorClass: 'fw-bold text-success' },
    { key: 're_equity', label: 'Real Estate Eq', csvHeader: 'Real Estate Equity', group: 'balances', isCurrency: true },
    { key: 'total_estate', label: 'After-Tax Estate', csvHeader: 'After-Tax Estate', group: 'balances', isCurrency: true, colorClass: 'fw-bold text-success' },
  ];

  return cols;
}

export function extractSpreadsheetRow(
  y: any,
  opts: SpreadsheetBuildOptions
): Record<string, string | number> {
  const { isCouple, p1RetireAge, p2RetireAge, gogoAge, slowAge, getRealValue } = opts;
  const yr = y.year;
  const r = (val: number | undefined | null) => Math.round(getRealValue(Number(val) || 0, yr));

  const p1Age = y.p1Age ?? y.ageP1 ?? '';
  const p2Age = isCouple ? (y.p2Age ?? y.ageP2 ?? '') : '';

  const isP1Ret = Number(p1Age) >= p1RetireAge;
  const isP2Ret = isCouple ? Number(p2Age) >= p2RetireAge : true;

  let phase = 'Working';
  if (isP1Ret && isP2Ret) {
    const maxAge = isCouple ? Math.max(Number(p1Age) || 0, Number(p2Age) || 0) : Number(p1Age) || 0;
    if (maxAge <= gogoAge) phase = 'Go-Go';
    else if (maxAge <= slowAge) phase = 'Slow-Go';
    else phase = 'No-Go';
  } else if (isP1Ret !== isP2Ret) {
    phase = 'Transition';
  }

  const cP1 = y.flows?.contributions?.p1 || {};
  const cP2 = isCouple ? (y.flows?.contributions?.p2 || {}) : {};
  const w = y.flows?.withdrawals || {};
  const a1 = y.assetsP1 || {};
  const a2 = isCouple ? (y.assetsP2 || {}) : {};

  // Contributions
  const p1CNonReg = Number(cP1.nonreg) || 0;
  const p2CNonReg = Number(cP2.nonreg) || 0;
  const p1CTfsa = Number(cP1.tfsa) || 0;
  const p2CTfsa = Number(cP2.tfsa) || 0;
  const p1CRrsp = Number(cP1.rrsp) || 0;
  const p2CRrsp = Number(cP2.rrsp) || 0;
  const p1CFhsa = Number(cP1.fhsa) || 0;
  const p2CFhsa = Number(cP2.fhsa) || 0;
  const respC = (Number(cP1.resp) || 0) + (Number(cP2.resp) || 0);
  const cashC = (Number(cP1.cash) || 0) + (Number(cP2.cash) || 0) + (Number(cP1.crypto) || 0) + (Number(cP2.crypto) || 0);
  const totalContrib = p1CNonReg + p2CNonReg + p1CTfsa + p2CTfsa + p1CRrsp + p2CRrsp + p1CFhsa + p2CFhsa + respC + cashC;

  // Withdrawals
  const p1WNonReg = Number(w['P1 Non-Reg']) || 0;
  const p2WNonReg = isCouple ? (Number(w['P2 Non-Reg']) || 0) : 0;
  const p1WTfsa = (Number(w['P1 TFSA']) || 0) + (Number(w['P1 TFSA_SUCCESSOR']) || 0);
  const p2WTfsa = isCouple ? ((Number(w['P2 TFSA']) || 0) + (Number(w['P2 TFSA_SUCCESSOR']) || 0)) : 0;
  const p1WRrsp = Number(w['P1 RRSP']) || 0;
  const p2WRrsp = isCouple ? (Number(w['P2 RRSP']) || 0) : 0;
  const p1WRrif = Number(w['P1 RRIF']) || 0;
  const p2WRrif = isCouple ? (Number(w['P2 RRIF']) || 0) : 0;
  const p1WLif = (Number(w['P1 LIF']) || 0) + (Number(w['P1 LIRF']) || 0);
  const p2WLif = isCouple ? ((Number(w['P2 LIF']) || 0) + (Number(w['P2 LIRF']) || 0)) : 0;
  const otherW =
    (Number(w['P1 FHSA']) || 0) + (isCouple ? (Number(w['P2 FHSA']) || 0) : 0) +
    (Number(w['P1 RESP']) || 0) + (isCouple ? (Number(w['P2 RESP']) || 0) : 0) +
    (Number(w['P1 Cash']) || 0) + (isCouple ? (Number(w['P2 Cash']) || 0) : 0) +
    (Number(w['P1 Crypto']) || 0) + (isCouple ? (Number(w['P2 Crypto']) || 0) : 0);
  const totalWd = p1WNonReg + p2WNonReg + p1WTfsa + p2WTfsa + p1WRrsp + p2WRrsp + p1WRrif + p2WRrif + p1WLif + p2WLif + otherW;

  // Spending
  const respWd = (Number(w['P1 RESP']) || 0) + (Number(w['P2 RESP']) || 0);
  const unfundedEdu = Math.max(0, (Number(y.eduExpense) || 0) - respWd);
  const baseDebtRepayment = Math.max(0, (Number(y.debtRepayment) || 0) - unfundedEdu);
  const livingExp = Number(y.expenses) || 0;
  const housingDebt = (Number(y.rentPay) || 0) + (Number(y.mortgagePay) || 0) + baseDebtRepayment;
  const eduExp = Number(y.eduExpense) || 0;
  const totalSpending = livingExp + housingDebt + eduExp;

  // Taxes
  const p1Clawback = Number(y.taxDetailsP1?.oas_clawback ?? y.oasClawbackP1) || 0;
  const p2Clawback = isCouple ? (Number(y.taxDetailsP2?.oas_clawback ?? y.oasClawbackP2) || 0) : 0;
  const totalClawback = p1Clawback + p2Clawback;
  const p1TaxExclClawback = Math.max(0, (Number(y.taxP1) || 0) - p1Clawback);
  const p2TaxExclClawback = isCouple ? Math.max(0, (Number(y.taxP2) || 0) - p2Clawback) : 0;
  const totalTax = (Number(y.taxP1) || 0) + (isCouple ? (Number(y.taxP2) || 0) : 0);
  const pensionSplit = (Number(y.pensionSplit?.p1ToP2) || 0) + (Number(y.pensionSplit?.p2ToP1) || 0);

  // Other / Investment income
  const p1OtherInc =
    (Number(y.invIncP1) || 0) +
    (Number(y.rentalP1) || 0) +
    (Number(y.otherP1) || 0) +
    (Number(y.postRetP1) || 0) +
    (Number(y.taxFreeSideHustleP1) || 0);
  const p2OtherInc = isCouple
    ? (Number(y.invIncP2) || 0) +
      (Number(y.rentalP2) || 0) +
      (Number(y.otherP2) || 0) +
      (Number(y.postRetP2) || 0) +
      (Number(y.taxFreeSideHustleP2) || 0)
    : 0;

  // Ending Balances
  const p1BNonReg = Number(a1.nonreg) || 0;
  const p2BNonReg = Number(a2.nonreg) || 0;
  const p1BTfsa = (Number(a1.tfsa) || 0) + (Number(a1.tfsa_successor) || 0);
  const p2BTfsa = (Number(a2.tfsa) || 0) + (Number(a2.tfsa_successor) || 0);
  const p1BRrspRrif = (Number(a1.rrsp) || 0) + (Number(a1.rrif_acct) || 0);
  const p2BRrspRrif = (Number(a2.rrsp) || 0) + (Number(a2.rrif_acct) || 0);
  const p1BLif = (Number(a1.lif) || 0) + (Number(a1.lirf) || 0);
  const p2BLif = (Number(a2.lif) || 0) + (Number(a2.lirf) || 0);
  const otherB =
    (Number(a1.fhsa) || 0) + (Number(a2.fhsa) || 0) +
    (Number(a1.resp) || 0) + (Number(a2.resp) || 0) +
    (Number(a1.cash) || 0) + (Number(a2.cash) || 0) +
    (Number(a1.crypto) || 0) + (Number(a2.crypto) || 0);

  const reEquity = (Number(y.reIncludedEq) || 0) + (Number(y.reExcludedEq) || 0);
  const totalEstate =
    y.afterTaxEstate !== undefined
      ? Number(y.afterTaxEstate) || 0
      : (Number(y.liquidNW) || 0) + (Number(y.reIncludedEq) || 0);

  return {
    year: yr,
    p1Age,
    p2Age,
    phase,

    p1_earned: r(y.incomeP1),
    p2_earned: r(y.incomeP2),
    p1_cpp: r(y.cppP1),
    p2_cpp: r(y.cppP2),
    p1_oas: r(y.oasP1),
    p2_oas: r(y.oasP2),
    p1_db: r(y.dbP1),
    p2_db: r(y.dbP2),
    p1_otherInc: r(p1OtherInc),
    p2_otherInc: r(p2OtherInc),

    ccb: r(y.ccbP1),
    cesg: r(y.cesgGrant),
    eiMat: r((Number(y.eiMatP1) || 0) + (isCouple ? (Number(y.eiMatP2) || 0) : 0)),

    p1_c_nonreg: r(p1CNonReg),
    p2_c_nonreg: r(p2CNonReg),
    p1_c_tfsa: r(p1CTfsa),
    p2_c_tfsa: r(p2CTfsa),
    p1_c_rrsp: r(p1CRrsp),
    p2_c_rrsp: r(p2CRrsp),
    p1_c_fhsa: r(p1CFhsa),
    p2_c_fhsa: r(p2CFhsa),
    resp_c: r(respC),
    cash_c: r(cashC),
    total_contrib: r(totalContrib),

    p1_w_nonreg: r(p1WNonReg),
    p2_w_nonreg: r(p2WNonReg),
    p1_w_tfsa: r(p1WTfsa),
    p2_w_tfsa: r(p2WTfsa),
    p1_w_rrsp: r(p1WRrsp),
    p2_w_rrsp: r(p2WRrsp),
    p1_w_rrif: r(p1WRrif),
    p2_w_rrif: r(p2WRrif),
    p1_w_lif: r(p1WLif),
    p2_w_lif: r(p2WLif),
    other_w: r(otherW),
    total_wd: r(totalWd),

    living_exp: r(livingExp),
    housing_debt: r(housingDebt),
    edu_exp: r(eduExp),
    total_spending: r(totalSpending),

    p1_tax: r(p1TaxExclClawback),
    p2_tax: r(p2TaxExclClawback),
    oas_clawback: r(totalClawback),
    pension_split: r(pensionSplit),
    total_tax: r(totalTax),

    p1_b_nonreg: r(p1BNonReg),
    p2_b_nonreg: r(p2BNonReg),
    p1_b_tfsa: r(p1BTfsa),
    p2_b_tfsa: r(p2BTfsa),
    p1_b_rrsp_rrif: r(p1BRrspRrif),
    p2_b_rrsp_rrif: r(p2BRrspRrif),
    p1_b_lif: r(p1BLif),
    p2_b_lif: r(p2BLif),
    other_b: r(otherB),
    liquid_nw: r(y.liquidNW),
    re_equity: r(reEquity),
    total_estate: r(totalEstate),
  };
}

function escapeCsvCell(val: string | number): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function generateDetailedProjectionCSV(
  timeline: any[],
  opts: SpreadsheetBuildOptions
): string {
  const cols = buildSpreadsheetColumns(opts.isCouple, opts.p1Label, opts.p2Label);
  const headerLine = cols.map((c) => escapeCsvCell(c.csvHeader)).join(',');
  const dataLines = timeline.map((y) => {
    const row = extractSpreadsheetRow(y, opts);
    return cols.map((c) => escapeCsvCell(row[c.key] ?? '')).join(',');
  });
  // Prefix UTF-8 BOM so Excel opens accented/currency headers cleanly
  return '\uFEFF' + [headerLine, ...dataLines].join('\n');
}
