import { emptyData } from './FinanceContext';

export interface CanadianPersona {
  id: string;
  title: string;
  subtitle: string;
  province: string;
  badge: string;
  badgeColor: string;
  icon: string;
  highlights: string[];
  buildPlan: () => any;
}

const buildSimpleExpenses = (monthlyNow: number, monthlyRet: number) => ({
  housing: { items: [{ name: 'Property Tax, Insurance & Utilities', curr: Math.round(monthlyNow * 0.25), ret: Math.round(monthlyRet * 0.25), trans: Math.round(monthlyRet * 0.25), gogo: Math.round(monthlyRet * 0.25), slow: Math.round(monthlyRet * 0.25), nogo: Math.round(monthlyRet * 0.25), freq: 12 }] },
  transport: { items: [{ name: 'Vehicle / Transit / Gas', curr: Math.round(monthlyNow * 0.15), ret: Math.round(monthlyRet * 0.12), trans: Math.round(monthlyRet * 0.12), gogo: Math.round(monthlyRet * 0.12), slow: Math.round(monthlyRet * 0.08), nogo: Math.round(monthlyRet * 0.05), freq: 12 }] },
  lifestyle: { items: [{ name: 'Dining, Travel & Hobbies', curr: Math.round(monthlyNow * 0.25), ret: Math.round(monthlyRet * 0.33), trans: Math.round(monthlyRet * 0.30), gogo: Math.round(monthlyRet * 0.33), slow: Math.round(monthlyRet * 0.20), nogo: Math.round(monthlyRet * 0.10), freq: 12 }] },
  essentials: { items: [{ name: 'Groceries & Health', curr: Math.round(monthlyNow * 0.25), ret: Math.round(monthlyRet * 0.22), trans: Math.round(monthlyRet * 0.23), gogo: Math.round(monthlyRet * 0.22), slow: Math.round(monthlyRet * 0.35), nogo: Math.round(monthlyRet * 0.48), freq: 12 }] },
  other: { items: [{ name: 'Miscellaneous', curr: Math.round(monthlyNow * 0.10), ret: Math.round(monthlyRet * 0.08), trans: Math.round(monthlyRet * 0.10), gogo: Math.round(monthlyRet * 0.08), slow: Math.round(monthlyRet * 0.12), nogo: Math.round(monthlyRet * 0.12), freq: 12 }] },
});

const dobForAge = (age: number) => `${new Date().getFullYear() - age}-01`;

export const CANADIAN_PERSONAS: CanadianPersona[] = [
  {
    id: 'toronto-couple',
    title: 'Toronto Starter Couple',
    subtitle: 'Ages 32 & 30 • Ontario • Growing Family',
    province: 'ON',
    badge: 'Accumulator',
    badgeColor: 'primary',
    icon: 'bi-house-heart-fill',
    highlights: ['$175k combined income', '$135k TFSA/RRSP/FHSA', '$780k home ($520k mtg)', 'Retire at 62'],
    buildPlan: () => {
      const base = JSON.parse(JSON.stringify(emptyData));
      base.mode = 'Couple';
      base.inputs = {
        ...base.inputs,
        tax_province: 'ON',
        p1_age: 32, p1_dob: dobForAge(32), p1_retireAge: 62, p1_lifeExp: 92,
        p1_income: 95000, p1_income_growth: 2.5, p1_rrsp_match: 4, p1_rrsp_match_tier: 100,
        p1_cash: 15000, p1_tfsa: 35000, p1_rrsp: 35000, p1_fhsa: 8000,
        p1_cpp_enabled: true, p1_cpp_est_base: 14500, p1_cpp_start: 65,
        p1_oas_enabled: true, p1_oas_years: 40, p1_oas_start: 65,

        p2_age: 30, p2_dob: dobForAge(30), p2_retireAge: 62, p2_lifeExp: 94,
        p2_income: 80000, p2_income_growth: 2.5, p2_rrsp_match: 3, p2_rrsp_match_tier: 100,
        p2_cash: 10000, p2_tfsa: 25000, p2_rrsp: 22000, p2_fhsa: 0,
        p2_cpp_enabled: true, p2_cpp_est_base: 13500, p2_cpp_start: 65,
        p2_oas_enabled: true, p2_oas_years: 40, p2_oas_start: 65,
        pension_split_enabled: true,
      };
      base.properties = [{
        name: 'Primary Residence',
        value: 780000,
        mortgage: 520000,
        rate: 4.5,
        payment: 2880,
        growth: 3.0,
        includeInNW: true,
        sellEnabled: false,
      }];
      base.expensesByCategory = buildSimpleExpenses(4800, 5200);
      return base;
    },
  },
  {
    id: 'vancouver-fire',
    title: 'Vancouver FIRE Single',
    subtitle: 'Age 38 • British Columbia • Early Retiree',
    province: 'BC',
    badge: 'FIRE at 50',
    badgeColor: 'success',
    icon: 'bi-fire',
    highlights: ['$145k salary', '$490k invested portfolio', 'Renting ($3,000/mo)', 'Retire early at 50'],
    buildPlan: () => {
      const base = JSON.parse(JSON.stringify(emptyData));
      base.mode = 'Single';
      base.inputs = {
        ...base.inputs,
        tax_province: 'BC',
        p1_age: 38, p1_dob: dobForAge(38), p1_retireAge: 50, p1_lifeExp: 92,
        p1_income: 145000, p1_income_growth: 2.5, p1_rrsp_match: 4, p1_rrsp_match_tier: 100,
        p1_cash: 30000, p1_tfsa: 135000, p1_rrsp: 215000, p1_nonreg: 110000, p1_nonreg_acb: 82000,
        p1_cpp_enabled: true, p1_cpp_est_base: 11500, p1_cpp_start: 65,
        p1_oas_enabled: true, p1_oas_years: 40, p1_oas_start: 65,
        fully_optimize_tax: true,
      };
      base.expensesByCategory = buildSimpleExpenses(5200, 4800);
      return base;
    },
  },
  {
    id: 'ottawa-db-couple',
    title: 'Ottawa DB Pension Couple',
    subtitle: 'Ages 55 & 53 • Ontario • Public Sector',
    province: 'ON',
    badge: 'DB Pension',
    badgeColor: 'info',
    icon: 'bi-building-check',
    highlights: ['$195k combined income', '$420k TFSA/RRSP', 'Paid-off $850k home', 'Retire at 60'],
    buildPlan: () => {
      const base = JSON.parse(JSON.stringify(emptyData));
      base.mode = 'Couple';
      base.inputs = {
        ...base.inputs,
        tax_province: 'ON',
        p1_age: 55, p1_dob: dobForAge(55), p1_retireAge: 60, p1_lifeExp: 90,
        p1_income: 110000, p1_income_growth: 2.0,
        p1_cash: 25000, p1_tfsa: 110000, p1_rrsp: 120000,
        p1_db_lifetime: 42000, p1_db_lifetime_start: 60, p1_db_indexed: true,
        p1_cpp_enabled: true, p1_cpp_est_base: 15000, p1_cpp_start: 65,
        p1_oas_enabled: true, p1_oas_years: 40, p1_oas_start: 65,

        p2_age: 53, p2_dob: dobForAge(53), p2_retireAge: 60, p2_lifeExp: 92,
        p2_income: 85000, p2_income_growth: 2.0,
        p2_cash: 20000, p2_tfsa: 95000, p2_rrsp: 95000,
        p2_db_lifetime: 28000, p2_db_lifetime_start: 60, p2_db_indexed: true,
        p2_cpp_enabled: true, p2_cpp_est_base: 13500, p2_cpp_start: 65,
        p2_oas_enabled: true, p2_oas_years: 40, p2_oas_start: 65,
        pension_split_enabled: true,
        oas_clawback_optimize: true,
      };
      base.properties = [{
        name: 'Primary Residence',
        value: 850000,
        mortgage: 0,
        rate: 0,
        payment: 0,
        growth: 2.5,
        includeInNW: true,
        sellEnabled: false,
      }];
      base.expensesByCategory = buildSimpleExpenses(6200, 6500);
      return base;
    },
  },
  {
    id: 'calgary-retiring-60',
    title: 'Retiring Soon (Age 60)',
    subtitle: 'Ages 60 & 59 • Alberta • Decumulation',
    province: 'AB',
    badge: 'Decumulation',
    badgeColor: 'warning',
    icon: 'bi-sun-fill',
    highlights: ['$1.15M liquid portfolio', 'Paid-off $650k home', 'RRSP Meltdown ready', 'Retiring next year'],
    buildPlan: () => {
      const base = JSON.parse(JSON.stringify(emptyData));
      base.mode = 'Couple';
      base.inputs = {
        ...base.inputs,
        tax_province: 'AB',
        p1_age: 60, p1_dob: dobForAge(60), p1_retireAge: 61, p1_lifeExp: 92,
        p1_income: 120000, p1_income_growth: 2.0,
        p1_cash: 45000, p1_tfsa: 150000, p1_rrsp: 380000, p1_nonreg: 120000, p1_nonreg_acb: 85000,
        p1_cpp_enabled: true, p1_cpp_est_base: 15500, p1_cpp_start: 65,
        p1_oas_enabled: true, p1_oas_years: 40, p1_oas_start: 65,

        p2_age: 59, p2_dob: dobForAge(59), p2_retireAge: 60, p2_lifeExp: 94,
        p2_income: 95000, p2_income_growth: 2.0,
        p2_cash: 35000, p2_tfsa: 140000, p2_rrsp: 280000,
        p2_cpp_enabled: true, p2_cpp_est_base: 14000, p2_cpp_start: 65,
        p2_oas_enabled: true, p2_oas_years: 40, p2_oas_start: 65,
        fully_optimize_tax: true,
        oas_clawback_optimize: true,
        pension_split_enabled: true,
      };
      base.properties = [{
        name: 'Primary Residence',
        value: 650000,
        mortgage: 0,
        rate: 0,
        payment: 0,
        growth: 2.5,
        includeInNW: true,
        sellEnabled: false,
      }];
      base.expensesByCategory = buildSimpleExpenses(6800, 6800);
      return base;
    },
  },
];

export interface QuickWizardInputs {
  mode: 'Single' | 'Couple';
  province: string;
  p1Age: number;
  p1RetireAge: number;
  p2Age: number;
  p2RetireAge: number;
  p1Income: number;
  p2Income: number;
  monthlySpendNow: number;
  monthlySpendRetire: number;
  tfsa: number;
  rrsp: number;
  nonReg: number;
  cash: number;
  ownsHome: boolean;
  homeValue: number;
  mortgageBalance: number;
  mortgagePayment: number;
}

export function buildPlanFromWizard(w: QuickWizardInputs) {
  const base = JSON.parse(JSON.stringify(emptyData));
  const isCouple = w.mode === 'Couple';
  const split = isCouple ? 0.5 : 1;

  base.mode = w.mode;
  base.inputs = {
    ...base.inputs,
    tax_province: w.province,
    p1_age: w.p1Age,
    p1_dob: dobForAge(w.p1Age),
    p1_retireAge: Math.max(w.p1Age, w.p1RetireAge),
    p1_lifeExp: 92,
    p1_income: w.p1Income,
    p1_cash: Math.round(w.cash * split),
    p1_tfsa: Math.round(w.tfsa * split),
    p1_rrsp: Math.round(w.rrsp * split),
    p1_nonreg: Math.round(w.nonReg * split),
    p1_nonreg_acb: Math.round(w.nonReg * split * 0.8),
    p1_cpp_enabled: true,
    p1_cpp_est_base: Math.min(17000, Math.round(w.p1Income * 0.16)),
    p1_cpp_start: 65,
    p1_oas_enabled: true,
    p1_oas_years: 40,
    p1_oas_start: 65,
    pension_split_enabled: isCouple,
  };

  if (isCouple) {
    base.inputs = {
      ...base.inputs,
      p2_age: w.p2Age,
      p2_dob: dobForAge(w.p2Age),
      p2_retireAge: Math.max(w.p2Age, w.p2RetireAge),
      p2_lifeExp: 94,
      p2_income: w.p2Income,
      p2_cash: w.cash - Math.round(w.cash * split),
      p2_tfsa: w.tfsa - Math.round(w.tfsa * split),
      p2_rrsp: w.rrsp - Math.round(w.rrsp * split),
      p2_nonreg: w.nonReg - Math.round(w.nonReg * split),
      p2_nonreg_acb: Math.round((w.nonReg - Math.round(w.nonReg * split)) * 0.8),
      p2_cpp_enabled: true,
      p2_cpp_est_base: Math.min(17000, Math.round(w.p2Income * 0.16)),
      p2_cpp_start: 65,
      p2_oas_enabled: true,
      p2_oas_years: 40,
      p2_oas_start: 65,
    };
  }

  if (w.ownsHome && w.homeValue > 0) {
    base.properties = [{
      name: 'Primary Residence',
      value: w.homeValue,
      mortgage: w.mortgageBalance,
      rate: w.mortgageBalance > 0 ? 4.5 : 0,
      payment: w.mortgageBalance > 0 ? w.mortgagePayment : 0,
      growth: 3.0,
      includeInNW: true,
      sellEnabled: false,
    }];
  }

  base.expensesByCategory = buildSimpleExpenses(w.monthlySpendNow, w.monthlySpendRetire);
  return base;
}
