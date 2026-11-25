import type { SupportedLang } from './formatters';

export interface PlanWarning {
  id: string;
  severity: 'warning' | 'info';
  message: string;
}

export type SectionWarningsMap = Record<string, PlanWarning[]>;

/**
 * Runs non-blocking sanity checks across all 10 planner input sections
 * so users catch common entry errors (negative amortization, $0 retirement
 * expenses, invalid age ordering, extreme inflation) immediately.
 */
export function validatePlanInputs(
  data: any,
  lang: SupportedLang = 'en'
): SectionWarningsMap {
  const isFr = lang === 'fr';
  const warnings: SectionWarningsMap = {};
  const add = (section: string, warning: PlanWarning) => {
    if (!warnings[section]) warnings[section] = [];
    warnings[section].push(warning);
  };

  if (!data || !data.inputs) return warnings;
  const inp = data.inputs;
  const isCouple = data.mode === 'Couple';

  // 1. Personal Information
  const players = isCouple ? ['p1', 'p2'] : ['p1'];
  for (const p of players) {
    const label = p === 'p1' ? (inp.p1_name || 'P1') : (inp.p2_name || 'P2');
    const age = Number(inp[`${p}_age`]) || 0;
    const retAge = Number(inp[`${p}_retireAge`]) || 0;
    const lifeExp = Number(inp[`${p}_lifeExp`]) || 0;

    if (age > 0 && lifeExp > 0 && lifeExp <= age) {
      add('personal', {
        id: `${p}_life_le_age`,
        severity: 'warning',
        message: isFr
          ? `${label} : l'espérance de vie (${lifeExp}) doit dépasser l'âge actuel (${age}).`
          : `${label}: Life expectancy (${lifeExp}) should be greater than current age (${age}).`,
      });
    } else if (retAge > 0 && lifeExp > 0 && lifeExp <= retAge) {
      add('personal', {
        id: `${p}_life_le_ret`,
        severity: 'warning',
        message: isFr
          ? `${label} : l'espérance de vie (${lifeExp}) est égale ou inférieure à l'âge de retraite (${retAge}).`
          : `${label}: Life expectancy (${lifeExp}) is at or below retirement age (${retAge}).`,
      });
    }
  }

  // 3. Portfolio Assets
  for (const p of players) {
    const label = p === 'p1' ? (inp.p1_name || 'P1') : (inp.p2_name || 'P2');
    const fhsa = Number(inp[`${p}_fhsa`]) || 0;
    if (fhsa > 40000) {
      add('portfolio', {
        id: `${p}_fhsa_limit`,
        severity: 'info',
        message: isFr
          ? `${label} : solde CELIAPP supérieur au plafond de cotisation à vie de 40 000 $ (valide s'il s'agit de croissance).`
          : `${label}: FHSA balance exceeds the $40,000 lifetime contribution cap (valid if from investment growth).`,
      });
    }
  }

  // 4. Housing / Real Estate
  const housingStatus = inp.housing_status || 'own';
  if (housingStatus === 'own') {
    const mortBal = Number(inp.mortgage_balance) || 0;
    const mortRate = Number(inp.mortgage_rate) || 0;
    const mortPay = Number(inp.mortgage_payment) || 0;

    if (mortBal > 0 && mortPay <= 0) {
      add('realestate', {
        id: 'mortgage_zero_payment',
        severity: 'warning',
        message: isFr
          ? 'Solde hypothécaire saisi sans paiement mensuel : le prêt ne diminuera jamais.'
          : 'Mortgage balance entered with $0 monthly payment — balance will never pay down.',
      });
    } else if (mortBal > 0 && mortRate > 0 && mortPay * 12 <= mortBal * (mortRate / 100)) {
      const minMonthly = Math.ceil((mortBal * (mortRate / 100)) / 12);
      add('realestate', {
        id: 'mortgage_neg_amort',
        severity: 'warning',
        message: isFr
          ? `Paiement mensuel (${mortPay.toLocaleString('fr-CA')} $) inférieur aux intérêts (~${minMonthly.toLocaleString('fr-CA')} $/mois).`
          : `Monthly mortgage payment ($${mortPay.toLocaleString('en-CA')}) does not cover interest (~$${minMonthly.toLocaleString('en-CA')}/mo).`,
      });
    }
  }

  // 6. Living Expenses
  const isAdvExp = data.expenseMode === 'advanced';
  let retExpTotal = 0;
  if (isAdvExp) {
    Object.values(data.expensesByCategory || {}).forEach((cat: any) => {
      if (cat?.items) {
        cat.items.forEach((item: any) => {
          retExpTotal += (Number(item.ret) || 0) * (Number(item.freq) || 12);
        });
      }
    });
  } else {
    retExpTotal = Number(inp.exp_basic_ret) || 0;
  }
  const hasPhases = Array.isArray(data.expensePhases) && data.expensePhases.length > 0;
  if (retExpTotal <= 0 && !hasPhases) {
    add('living', {
      id: 'zero_ret_expenses',
      severity: 'warning',
      message: isFr
        ? 'Vos dépenses à la retraite sont à 0 $ : les projections peuvent sembler artificiellement élevées.'
        : 'Retirement living expenses are $0 — projections may appear artificially high.',
    });
  }

  // 9. Government Benefits
  for (const p of players) {
    const label = p === 'p1' ? (inp.p1_name || 'P1') : (inp.p2_name || 'P2');
    const cppStart = Number(inp[`${p}_cpp_start`] ?? 65);
    const oasStart = Number(inp[`${p}_oas_start`] ?? 65);
    if (cppStart < 60 || cppStart > 70) {
      add('govt', {
        id: `${p}_cpp_bounds`,
        severity: 'warning',
        message: isFr
          ? `${label} : l'âge de début du RPC/RRQ doit être entre 60 et 70 ans.`
          : `${label}: CPP start age should be between 60 and 70.`,
      });
    }
    if (oasStart < 65 || oasStart > 70) {
      add('govt', {
        id: `${p}_oas_bounds`,
        severity: 'warning',
        message: isFr
          ? `${label} : l'âge de début de la SV doit être entre 65 et 70 ans.`
          : `${label}: OAS start age should be between 65 and 70.`,
      });
    }
  }

  // 10. Economic Assumptions
  const inflation =
    inp.inflation_rate !== undefined && inp.inflation_rate !== ''
      ? Number(inp.inflation_rate)
      : 2.1;
  if (inflation < 0 || inflation > 8) {
    add('economic', {
      id: 'extreme_inflation',
      severity: 'warning',
      message: isFr
        ? `Taux d'inflation inhabituel (${inflation} %). La cible à long terme au Canada est ~2,0 % – 2,5 %.`
        : `Unusual inflation rate (${inflation}%). Long-term Canadian planning typically uses ~2.0% – 2.5%.`,
    });
  }

  return warnings;
}

/**
 * Computes which of the 10 Input sections have meaningful values populated,
 * driving subtle completion checkmarks in the sticky jump bar.
 */
export function getSectionCompletion(data: any): Record<string, boolean> {
  if (!data || !data.inputs) return {};
  const inp = data.inputs;
  const isCouple = data.mode === 'Couple';

  const portKeys = ['tfsa', 'rrsp', 'fhsa', 'resp', 'lira', 'lif', 'rrif_acct', 'nonreg', 'cash', 'crypto'];
  let portSum = 0;
  portKeys.forEach((k) => {
    portSum += Number(inp[`p1_${k}`]) || 0;
    if (isCouple) portSum += Number(inp[`p2_${k}`]) || 0;
  });
  (data.customAssets || []).forEach((ca: any) => {
    portSum += Number(ca.balance) || 0;
  });

  const incomeSum =
    (Number(inp.p1_income) || 0) +
    (isCouple ? Number(inp.p2_income) || 0 : 0) +
    (data.additionalIncome?.length || 0);

  let expSum = 0;
  if (data.expenseMode === 'advanced') {
    Object.values(data.expensesByCategory || {}).forEach((cat: any) => {
      if (cat?.items) {
        cat.items.forEach((item: any) => {
          expSum += (Number(item.curr) || 0) + (Number(item.ret) || 0);
        });
      }
    });
  } else {
    expSum = (Number(inp.exp_basic_curr) || 0) + (Number(inp.exp_basic_ret) || 0);
  }

  const hasHousing =
    inp.housing_status === 'none' ||
    (inp.housing_status === 'rent' && (Number(inp.rent_monthly) || 0) > 0) ||
    ((Number(inp.home_value) || 0) > 0);

  const hasGovt =
    (Number(inp.p1_cpp_est) || 0) > 0 ||
    (Number(inp.p1_oas_est) || 0) > 0 ||
    (Number(inp.p1_db_pension) || 0) > 0;

  return {
    personal: Boolean(Number(inp.p1_age) > 0 && Number(inp.p1_retireAge) > 0),
    dependents: (data.dependents?.length || 0) > 0,
    portfolio: portSum > 0,
    realestate: hasHousing,
    tax: incomeSum > 0,
    living: expSum > 0 || (data.expensePhases?.length || 0) > 0,
    future: (data.debt?.length || 0) > 0,
    windfalls: (data.windfalls?.length || 0) > 0,
    govt: hasGovt,
    economic: inp.inflation_rate !== undefined && inp.inflation_rate !== '',
  };
}
