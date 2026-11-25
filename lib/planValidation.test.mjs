import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePlanInputs, getSectionCompletion } from './planValidation.ts';
import { formatCurrencyLocale, formatShortCurrencyLocale } from './formatters.ts';

test('validatePlanInputs catches negative mortgage amortization and $0 retirement expenses', () => {
  const plan = {
    mode: 'Single',
    expenseMode: 'basic',
    inputs: {
      p1_age: 40,
      p1_retireAge: 65,
      p1_lifeExp: 90,
      housing_status: 'own',
      mortgage_balance: 500000,
      mortgage_rate: 6,
      mortgage_payment: 2000, // $24k/yr < $30k/yr interest
      exp_basic_ret: 0,
      p1_cpp_start: 65,
      p1_oas_start: 65,
      inflation_rate: 2.1,
    },
    expensePhases: [],
  };

  const warnings = validatePlanInputs(plan, 'en');
  assert.ok(warnings.realestate?.some((w) => w.id === 'mortgage_neg_amort'));
  assert.ok(warnings.living?.some((w) => w.id === 'zero_ret_expenses'));
  assert.equal(warnings.personal, undefined);
});

test('validatePlanInputs catches life expectancy <= retirement age and extreme inflation in French', () => {
  const plan = {
    mode: 'Single',
    expenseMode: 'basic',
    inputs: {
      p1_age: 45,
      p1_retireAge: 65,
      p1_lifeExp: 65,
      exp_basic_ret: 50000,
      inflation_rate: 12,
    },
  };
  const warnings = validatePlanInputs(plan, 'fr');
  assert.ok(warnings.personal?.some((w) => w.id === 'p1_life_le_ret'));
  assert.ok(warnings.economic?.some((w) => w.id === 'extreme_inflation'));
});

test('getSectionCompletion detects populated sections accurately', () => {
  const comp = getSectionCompletion({
    mode: 'Single',
    expenseMode: 'basic',
    inputs: {
      p1_age: 35,
      p1_retireAge: 60,
      p1_tfsa: 50000,
      p1_income: 90000,
      exp_basic_curr: 45000,
      housing_status: 'rent',
      rent_monthly: 2200,
      inflation_rate: 2.1,
    },
    dependents: [],
    debt: [],
    windfalls: [],
  });
  assert.equal(comp.personal, true);
  assert.equal(comp.portfolio, true);
  assert.equal(comp.tax, true);
  assert.equal(comp.living, true);
  assert.equal(comp.realestate, true);
  assert.equal(comp.dependents, false);
});

test('formatCurrencyLocale and formatShortCurrencyLocale format en-CA and fr-CA natively', () => {
  assert.equal(formatCurrencyLocale(125000, 'en'), '$125,000');
  assert.match(formatCurrencyLocale(125000, 'fr'), /125[\s\u00a0\u202f]000[\s\u00a0\u202f]\$/);
  assert.equal(formatShortCurrencyLocale(1250000, 'en'), '$1.25M');
  assert.equal(formatShortCurrencyLocale(1250000, 'fr'), '1,25 M$');
  assert.equal(formatShortCurrencyLocale(450000, 'fr'), '450 k$');
});
