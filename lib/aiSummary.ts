import { formatCurrencyLocale, type SupportedLang } from './formatters';

/**
 * Builds a clean, anonymized Markdown summary of a Planfolio retirement plan
 * ready to paste into ChatGPT, Claude, or Gemini for a second-opinion review.
 */
export function buildAiReviewPrompt(
  data: any,
  results: any,
  planScore?: any,
  opts: { anonymize?: boolean; lang?: SupportedLang } = {}
): string {
  const { anonymize = true, lang = 'en' } = opts;
  const isFr = lang === 'fr';
  const fmt = (v: number) => formatCurrencyLocale(Math.round(v || 0), lang, 0);

  const inp = data?.inputs || {};
  const isCouple = data?.mode === 'Couple';
  const p1Label = anonymize ? 'Partner 1' : (inp.p1_name || 'Partner 1');
  const p2Label = anonymize ? 'Partner 2' : (inp.p2_name || 'Partner 2');

  const sumAcct = (key: string) =>
    (Number(inp[`p1_${key}`]) || 0) + (isCouple ? Number(inp[`p2_${key}`]) || 0 : 0);

  const tfsa = sumAcct('tfsa');
  const rrsp = sumAcct('rrsp') + sumAcct('rrif_acct');
  const fhsa = sumAcct('fhsa');
  const lira = sumAcct('lira') + sumAcct('lif');
  const nonreg = sumAcct('nonreg');
  const cash = sumAcct('cash');
  const crypto = sumAcct('crypto');
  const customTotal = (data?.customAssets || []).reduce(
    (s: number, a: any) => s + (Number(a.balance) || 0),
    0
  );
  const totalLiquid = tfsa + rrsp + fhsa + lira + nonreg + cash + crypto + customTotal;

  const timeline: any[] = results?.timeline || [];
  const baseYear = timeline[0]?.year || new Date().getFullYear();
  const inf = (inp.inflation_rate !== undefined && inp.inflation_rate !== '' ? Number(inp.inflation_rate) : 2.1) / 100;
  const useReal = Boolean(data?.useRealDollars);
  const toDisplay = (val: number, year: number) =>
    useReal ? val / Math.pow(1 + inf, Math.max(0, year - baseYear)) : val;

  const p1RetAge = Number(inp.p1_retireAge) || 65;
  const retRow = timeline.find((y) => y.p1Age >= p1RetAge) || timeline[0];
  const finalRow = timeline[timeline.length - 1];
  const firstShortfall = timeline.find((y) => y.p1Age >= p1RetAge && (y.liquidNW || 0) <= 0);

  const totalTax = timeline.reduce(
    (s, y) => s + toDisplay((y.taxP1 || 0) + (y.taxP2 || 0), y.year),
    0
  );
  const retLiquid = retRow ? toDisplay(retRow.liquidNW || 0, retRow.year) : 0;
  const finalEstate = finalRow
    ? toDisplay(
        finalRow.afterTaxEstate !== undefined
          ? finalRow.afterTaxEstate
          : (finalRow.liquidNW || 0) + (finalRow.reIncludedEq || 0),
        finalRow.year
      )
    : 0;

  // Retirement spending estimate
  let annualRetSpend = 0;
  if (data?.expenseMode === 'advanced') {
    Object.values(data?.expensesByCategory || {}).forEach((cat: any) => {
      if (cat?.items) {
        cat.items.forEach((item: any) => {
          annualRetSpend += (Number(item.ret) || 0) * (Number(item.freq) || 12);
        });
      }
    });
  } else {
    annualRetSpend = Number(inp.exp_basic_ret) || 0;
  }

  const lines: string[] = [];
  if (isFr) {
    lines.push('# Sommaire de plan de retraite canadien (Planfolio.ca)');
    lines.push('');
    lines.push('Veuillez analyser ce plan de retraite canadien et me signaler les angles morts, les occasions d’optimisation fiscale (REER/FERR, récupération de la SV, fractionnement de revenu, moment optimal du RPC/RRQ et de la SV) ainsi que les risques principaux.');
  } else {
    lines.push('# Canadian Retirement Plan Summary (Planfolio.ca)');
    lines.push('');
    lines.push('Please review this Canadian retirement plan and highlight blind spots, tax optimization opportunities (RRSP meltdown, OAS clawback, pension splitting, CPP/OAS start timing), and sequence-of-returns risks.');
  }

  lines.push('');
  lines.push(`## ${isFr ? 'Profil du ménage' : 'Household Profile'}`);
  lines.push(`- **Mode:** ${isCouple ? (isFr ? 'Couple' : 'Couple') : (isFr ? 'Célibataire' : 'Single')} | **Province:** ${inp.tax_province || 'ON'}`);
  lines.push(`- **${p1Label}:** ${isFr ? 'Âge' : 'Age'} ${inp.p1_age || 38} → ${isFr ? 'Retraite' : 'Retire'} ${p1RetAge} → ${isFr ? 'Horizon' : 'Life Exp.'} ${inp.p1_lifeExp || 95} | ${isFr ? 'Salaire' : 'Salary'}: ${fmt(Number(inp.p1_income) || 0)}`);
  if (isCouple) {
    lines.push(`- **${p2Label}:** ${isFr ? 'Âge' : 'Age'} ${inp.p2_age || 35} → ${isFr ? 'Retraite' : 'Retire'} ${inp.p2_retireAge || 65} → ${isFr ? 'Horizon' : 'Life Exp.'} ${inp.p2_lifeExp || 95} | ${isFr ? 'Salaire' : 'Salary'}: ${fmt(Number(inp.p2_income) || 0)}`);
  }

  lines.push('');
  lines.push(`## ${isFr ? 'Portefeuille actuel' : 'Current Portfolio'} (${fmt(totalLiquid)} ${isFr ? 'liquide' : 'liquid'})`);
  if (tfsa > 0) lines.push(`- **${isFr ? 'CELI' : 'TFSA'}:** ${fmt(tfsa)}`);
  if (rrsp > 0) lines.push(`- **${isFr ? 'REER / FERR' : 'RRSP / RRIF'}:** ${fmt(rrsp)}`);
  if (fhsa > 0) lines.push(`- **${isFr ? 'CELIAPP' : 'FHSA'}:** ${fmt(fhsa)}`);
  if (lira > 0) lines.push(`- **${isFr ? 'CRI / FRV' : 'LIRA / LIF'}:** ${fmt(lira)}`);
  if (nonreg > 0) lines.push(`- **${isFr ? 'Non enregistré' : 'Non-Registered'}:** ${fmt(nonreg)}`);
  if (cash > 0) lines.push(`- **${isFr ? 'Liquidités' : 'Cash'}:** ${fmt(cash)}`);
  if (crypto > 0) lines.push(`- **Crypto:** ${fmt(crypto)}`);
  if (inp.housing_status === 'own' && Number(inp.home_value) > 0) {
    lines.push(`- **${isFr ? 'Résidence principale' : 'Primary Residence'}:** ${fmt(Number(inp.home_value))} (${isFr ? 'Hypothèque' : 'Mortgage'}: ${fmt(Number(inp.mortgage_balance) || 0)} @ ${inp.mortgage_rate || 0}%)`);
  } else if (inp.housing_status === 'rent') {
    lines.push(`- **${isFr ? 'Logement' : 'Housing'}:** ${isFr ? 'Locataire' : 'Renting'} (${fmt(Number(inp.rent_monthly) || 0)}/mo)`);
  }

  lines.push('');
  lines.push(`## ${isFr ? 'Prestations, dépenses et stratégie' : 'Benefits, Spending & Strategy'}`);
  lines.push(`- **${isFr ? 'Dépenses annuelles à la retraite' : 'Target Annual Retirement Spend'}:** ${fmt(annualRetSpend)}/yr${data?.expensePhases?.length ? ` (+ ${data.expensePhases.length} phased transitions)` : ''}`);
  lines.push(`- **${isFr ? 'RPC/RRQ & SV' : 'CPP & OAS'} (${p1Label}):** CPP @ ${inp.p1_cpp_start || 65}, OAS @ ${inp.p1_oas_start || 65}${Number(inp.p1_db_pension) > 0 ? `, DB Pension ${fmt(Number(inp.p1_db_pension))}/yr` : ''}`);
  if (isCouple) {
    lines.push(`- **${isFr ? 'RPC/RRQ & SV' : 'CPP & OAS'} (${p2Label}):** CPP @ ${inp.p2_cpp_start || 65}, OAS @ ${inp.p2_oas_start || 65}${Number(inp.p2_db_pension) > 0 ? `, DB Pension ${fmt(Number(inp.p2_db_pension))}/yr` : ''}`);
  }
  lines.push(`- **${isFr ? 'Hypothèses' : 'Assumptions'}:** Inflation ${(inf * 100).toFixed(1)}% | Guardrails: ${inp.enable_guardrails ? 'ON' : 'OFF'} | Tax Optimizer: ${inp.fully_optimize_tax ? 'ON' : 'OFF'} | Pension Splitting: ${inp.enable_pension_split ? 'ON' : 'OFF'}`);

  if (timeline.length > 0) {
    lines.push('');
    lines.push(`## ${isFr ? 'Résultats projetés' : 'Projected Outcomes'} (${useReal ? (isFr ? "Dollars d'aujourd'hui" : "Today's Dollars") : (isFr ? 'Dollars nominaux' : 'Nominal Dollars')})`);
    if (planScore) lines.push(`- **Plan Score:** ${Math.round(planScore.totalScore)}/100`);
    lines.push(`- **${isFr ? 'Solvabilité' : 'Plan Solvency'}:** ${firstShortfall ? `${isFr ? 'Épuisé à l’âge' : 'Liquid portfolio depletes at age'} ${firstShortfall.p1Age}` : (isFr ? `Entièrement financé jusqu’à ${finalRow?.p1Age || 95} ans` : `Fully funded through age ${finalRow?.p1Age || 95}`)}`);
    lines.push(`- **${isFr ? 'Portefeuille liquide à la retraite' : 'Liquid Portfolio at Retirement'} (Age ${p1RetAge}):** ${fmt(retLiquid)}`);
    lines.push(`- **${isFr ? 'Succession nette après impôt' : 'Projected After-Tax Estate'}:** ${fmt(finalEstate)}`);
    lines.push(`- **${isFr ? 'Impôts totaux à vie' : 'Lifetime Taxes Paid'}:** ${fmt(totalTax)}`);
  }

  if (data?.notes && String(data.notes).trim()) {
    lines.push('');
    lines.push(`## ${isFr ? 'Notes du plan' : 'Plan Notes'}`);
    lines.push(String(data.notes).trim());
  }

  return lines.join('\n');
}
