import { FinanceEngine } from '../financeEngine';

export interface HeatmapCell {
  retireAgeP1: number;
  retireOffset: number;
  spendPctDelta: number; // -20, -10, 0, +10, +20
  monthlyRetireSpend: number;
  afterTaxEstate: number;
  survived: boolean;
  shortfallAge: number | null;
  isBaseCell: boolean;
}

export interface SensitivityHeatmapResult {
  retireAges: number[];
  spendDeltas: number[];
  baseMonthlyRetireSpend: number;
  cells: HeatmapCell[][];
}

export interface MaxSpendResult {
  targetEstate: number;
  baseMonthlySpend: number;
  maxMonthlySpend: number;
  deltaMonthly: number;
  deltaPct: number;
  multiplier: number;
  projectedEstate: number;
}

function getBaseMonthlyRetireSpend(data: any): number {
  let annual = 0;
  const cats = data?.expensesByCategory || {};
  Object.values(cats).forEach((cat: any) => {
    if (Array.isArray(cat?.items)) {
      cat.items.forEach((item: any) => {
        const freq = Number(item.freq) || 12;
        const val = Number(item.ret ?? item.gogo ?? item.curr ?? 0);
        annual += val * freq;
      });
    }
  });
  return Math.round(annual / 12);
}

function scaleRetirementExpenses(plan: any, multiplier: number) {
  if (!plan?.expensesByCategory) return;
  Object.values(plan.expensesByCategory).forEach((cat: any) => {
    if (Array.isArray(cat?.items)) {
      cat.items.forEach((item: any) => {
        ['ret', 'trans', 'gogo', 'slow', 'nogo'].forEach((field) => {
          if (typeof item[field] === 'number') {
            item[field] = Math.round(item[field] * multiplier);
          }
        });
      });
    }
  });
}

function evaluatePlan(plan: any, useReal: boolean, inflation: number) {
  const engine = new FinanceEngine(plan);
  const timeline = engine.runSimulation(true, null);
  const startYear = timeline[0]?.year || new Date().getFullYear();
  const last = timeline[timeline.length - 1];
  const rawEstate = last
    ? last.afterTaxEstate !== undefined
      ? last.afterTaxEstate
      : last.liquidNW + (last.reIncludedEq || 0)
    : 0;
  const years = Math.max(0, (last?.year || startYear) - startYear);
  const afterTaxEstate = Math.round(
    useReal ? rawEstate / Math.pow(1 + inflation, years) : rawEstate
  );
  const shortfall = timeline.find((y: any) => Math.round(y.liquidNW || 0) < 0);
  return {
    afterTaxEstate,
    survived: !shortfall,
    shortfallAge: shortfall ? shortfall.p1Age : null,
  };
}

export function runSensitivityHeatmap(
  data: any,
  onProgress?: (pct: number) => void
): SensitivityHeatmapResult {
  const useReal = Boolean(data?.useRealDollars);
  const inflation = (Number(data?.inputs?.inflation_rate) || 2.1) / 100;
  const p1Age = Number(data?.inputs?.p1_age) || 35;
  const baseRetAge = Number(data?.inputs?.p1_retireAge) || 65;
  const p1LifeExp = Number(data?.inputs?.p1_lifeExp) || 90;
  const isCouple = data?.mode === 'Couple';
  const baseP2RetAge = Number(data?.inputs?.p2_retireAge) || baseRetAge;
  const p2Age = Number(data?.inputs?.p2_age) || p1Age;
  const p2LifeExp = Number(data?.inputs?.p2_lifeExp) || 92;

  const offsets = [-4, -2, 0, 2, 4];
  const spendDeltas = [-20, -10, 0, 10, 20];
  const baseMonthlyRetireSpend = getBaseMonthlyRetireSpend(data);

  const retireAges = offsets.map((off) =>
    Math.min(p1LifeExp - 1, Math.max(p1Age, baseRetAge + off))
  );

  const cells: HeatmapCell[][] = [];
  const totalRuns = offsets.length * spendDeltas.length;
  let completed = 0;

  for (let r = 0; r < offsets.length; r++) {
    const off = offsets[r];
    const targetP1Ret = retireAges[r];
    const rowCells: HeatmapCell[] = [];

    for (let c = 0; c < spendDeltas.length; c++) {
      const spendDelta = spendDeltas[c];
      const mult = 1 + spendDelta / 100;
      const cloned = JSON.parse(JSON.stringify(data));
      cloned.inputs.p1_retireAge = targetP1Ret;
      if (isCouple) {
        cloned.inputs.p2_retireAge = Math.min(
          p2LifeExp - 1,
          Math.max(p2Age, baseP2RetAge + off)
        );
      }
      if (spendDelta !== 0) {
        scaleRetirementExpenses(cloned, mult);
      }

      const res = evaluatePlan(cloned, useReal, inflation);
      rowCells.push({
        retireAgeP1: targetP1Ret,
        retireOffset: off,
        spendPctDelta: spendDelta,
        monthlyRetireSpend: Math.round(baseMonthlyRetireSpend * mult),
        afterTaxEstate: res.afterTaxEstate,
        survived: res.survived,
        shortfallAge: res.shortfallAge,
        isBaseCell: off === 0 && spendDelta === 0,
      });

      completed += 1;
      if (onProgress) {
        onProgress(Math.round((completed / totalRuns) * 100));
      }
    }
    cells.push(rowCells);
  }

  return {
    retireAges,
    spendDeltas,
    baseMonthlyRetireSpend,
    cells,
  };
}

export function solveMaxRetirementSpend(
  data: any,
  options: { targetEstate: number }
): MaxSpendResult {
  const { targetEstate } = options;
  const useReal = Boolean(data?.useRealDollars);
  const inflation = (Number(data?.inputs?.inflation_rate) || 2.1) / 100;
  const baseMonthlySpend = getBaseMonthlyRetireSpend(data);

  if (baseMonthlySpend <= 0) {
    return {
      targetEstate,
      baseMonthlySpend: 0,
      maxMonthlySpend: 0,
      deltaMonthly: 0,
      deltaPct: 0,
      multiplier: 1,
      projectedEstate: 0,
    };
  }

  let low = 0.25;
  let high = 3.5;
  let bestMult = low;
  let bestEstate = 0;

  for (let iter = 0; iter < 14; iter++) {
    const mid = (low + high) / 2;
    const cloned = JSON.parse(JSON.stringify(data));
    scaleRetirementExpenses(cloned, mid);
    const res = evaluatePlan(cloned, useReal, inflation);

    if (res.survived && res.afterTaxEstate >= targetEstate) {
      bestMult = mid;
      bestEstate = res.afterTaxEstate;
      low = mid;
    } else {
      high = mid;
    }
  }

  const maxMonthlySpend = Math.round(baseMonthlySpend * bestMult);
  const deltaMonthly = maxMonthlySpend - baseMonthlySpend;
  const deltaPct = Math.round((bestMult - 1) * 100);

  return {
    targetEstate,
    baseMonthlySpend,
    maxMonthlySpend,
    deltaMonthly,
    deltaPct,
    multiplier: Number(bestMult.toFixed(3)),
    projectedEstate: bestEstate,
  };
}
