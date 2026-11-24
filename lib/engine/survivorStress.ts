import { FinanceEngine } from '../financeEngine';

export interface SurvivorStressOptions {
  deceased: 'p1' | 'p2';
  deathAge: number;
  expenseReductionPct: number; // e.g. 20 means survivor spends 20% less than couple
}

export interface SurvivorStressPoint {
  age: number;
  baselineNW: number;
  survivorNW: number;
  baselineTax: number;
  survivorTax: number;
}

export interface SurvivorStressResult {
  deceased: 'p1' | 'p2';
  deathAge: number;
  expenseReductionPct: number;
  baselineEstate: number;
  survivorEstate: number;
  estateDelta: number;
  baselineLifetimeTax: number;
  survivorLifetimeTax: number;
  taxDelta: number;
  peakTaxRateBaseline: number;
  peakTaxRateSurvivor: number;
  survived: boolean;
  firstShortfallAge: number | null;
  chartData: SurvivorStressPoint[];
}

export function runSurvivorStressTest(
  data: any,
  options: SurvivorStressOptions
): SurvivorStressResult {
  const { deceased, deathAge, expenseReductionPct } = options;
  const useReal = Boolean(data?.useRealDollars);
  const inflation = (Number(data?.inputs?.inflation_rate) || 2.1) / 100;

  // 1. Baseline simulation
  const baseEngine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
  const baseTimeline = baseEngine.runSimulation(true, null);

  // 2. Survivor simulation: shorten deceased spouse's lifeExp to deathAge
  const survData = JSON.parse(JSON.stringify(data));
  const survivor = deceased === 'p1' ? 'p2' : 'p1';
  const deceasedLifeExpKey = `${deceased}_lifeExp`;
  const survivorLifeExpKey = `${survivor}_lifeExp`;

  const currentDeceasedAge = Number(survData.inputs[`${deceased}_age`]) || 35;
  const clampedDeathAge = Math.max(currentDeceasedAge + 1, deathAge);
  survData.inputs[deceasedLifeExpKey] = clampedDeathAge;

  // Ensure survivor lives at least to 90 so the widow period is actually modeled
  if ((Number(survData.inputs[survivorLifeExpKey]) || 90) <= clampedDeathAge) {
    survData.inputs[survivorLifeExpKey] = Math.min(100, clampedDeathAge + 15);
  }

  // Scale down retirement expenses modestly for single-person household if requested
  if (expenseReductionPct > 0 && survData.expensesByCategory) {
    const factor = Math.max(0.5, 1 - expenseReductionPct / 100);
    Object.values(survData.expensesByCategory).forEach((cat: any) => {
      if (cat?.items && Array.isArray(cat.items)) {
        cat.items.forEach((item: any) => {
          ['ret', 'trans', 'gogo', 'slow', 'nogo'].forEach((field) => {
            if (typeof item[field] === 'number') {
              item[field] = Math.round(item[field] * factor);
            }
          });
        });
      }
    });
  }

  const survEngine = new FinanceEngine(survData);
  const survTimeline = survEngine.runSimulation(true, null);

  const startYear = baseTimeline[0]?.year || new Date().getFullYear();
  const getReal = (nominal: number, year: number) =>
    useReal ? nominal / Math.pow(1 + inflation, Math.max(0, year - startYear)) : nominal;

  const extractFinalEstate = (tl: any[]) => {
    const last = tl[tl.length - 1];
    if (!last) return 0;
    const raw =
      last.afterTaxEstate !== undefined
        ? last.afterTaxEstate
        : last.liquidNW + (last.reIncludedEq || 0);
    return Math.round(getReal(raw, last.year));
  };

  const sumTax = (tl: any[]) =>
    Math.round(
      tl.reduce((sum, y) => sum + getReal((y.taxP1 || 0) + (y.taxP2 || 0), y.year), 0)
    );

  const peakEffRate = (tl: any[]) => {
    let maxRate = 0;
    for (const y of tl) {
      const gross = (y.grossInflow || 0);
      const tax = (y.taxP1 || 0) + (y.taxP2 || 0);
      if (gross > 20000) {
        const rate = (tax / gross) * 100;
        if (rate > maxRate && rate < 100) maxRate = rate;
      }
    }
    return Number(maxRate.toFixed(1));
  };

  const baselineEstate = extractFinalEstate(baseTimeline);
  const survivorEstate = extractFinalEstate(survTimeline);
  const baselineLifetimeTax = sumTax(baseTimeline);
  const survivorLifetimeTax = sumTax(survTimeline);

  const shortfallRow = survTimeline.find((y: any) => Math.round(y.liquidNW || 0) < 0);
  const survived = !shortfallRow;
  const firstShortfallAge = shortfallRow
    ? (survivor === 'p1' ? shortfallRow.p1Age : shortfallRow.p2Age) || shortfallRow.p1Age
    : null;

  const maxLen = Math.max(baseTimeline.length, survTimeline.length);
  const chartData: SurvivorStressPoint[] = [];
  for (let i = 0; i < maxLen; i++) {
    const b = baseTimeline[i];
    const s = survTimeline[i];
    const ref = b || s;
    const yr = ref?.year || startYear + i;
    const age = (survivor === 'p1' ? ref?.p1Age : ref?.p2Age) ?? (ref?.p1Age || i);
    chartData.push({
      age,
      baselineNW: b ? Math.max(0, Math.round(getReal(b.liquidNW || 0, yr))) : 0,
      survivorNW: s ? Math.max(0, Math.round(getReal(s.liquidNW || 0, yr))) : 0,
      baselineTax: b ? Math.round(getReal((b.taxP1 || 0) + (b.taxP2 || 0), yr)) : 0,
      survivorTax: s ? Math.round(getReal((s.taxP1 || 0) + (s.taxP2 || 0), yr)) : 0,
    });
  }

  return {
    deceased,
    deathAge: clampedDeathAge,
    expenseReductionPct,
    baselineEstate,
    survivorEstate,
    estateDelta: survivorEstate - baselineEstate,
    baselineLifetimeTax,
    survivorLifetimeTax,
    taxDelta: survivorLifetimeTax - baselineLifetimeTax,
    peakTaxRateBaseline: peakEffRate(baseTimeline),
    peakTaxRateSurvivor: peakEffRate(survTimeline),
    survived,
    firstShortfallAge,
    chartData,
  };
}
