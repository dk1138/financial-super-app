// lib/engine/optimizers.ts
// Worker-safe heavy optimizer and stress-test calculations offloaded from the main UI thread.

import { FinanceEngine } from '../financeEngine';

function getRealValue(data: any, nominalValue: number, startYear: number, endYear: number): number {
  const useReal = Boolean(
    data?.useRealDollars === true ||
      data?.inputs?.todays_dollars === true ||
      data?.inputs?.use_real_dollars === true ||
      data?.inputs?.useRealDollars === true
  );
  if (!useReal) return nominalValue;
  const inflation =
    (data?.inputs?.inflation_rate !== undefined && data?.inputs?.inflation_rate !== ''
      ? Number(data.inputs.inflation_rate)
      : 2.1) / 100;
  const yearsOut = Math.max(0, endYear - startYear);
  return nominalValue / Math.pow(1 + inflation, yearsOut);
}

export function runCppGridSearch(data: any) {
  const cppResultsArr: Array<{ cppAge: number; oasAge: number; finalEstate: number }> = [];

  for (let cpp = 60; cpp <= 70; cpp++) {
    for (let oas = 65; oas <= 70; oas++) {
      const clonedData = JSON.parse(JSON.stringify(data));
      Object.assign(clonedData.inputs, {
        p1_cpp_start: cpp,
        p2_cpp_start: cpp,
        p1_oas_start: oas,
        p2_oas_start: oas,
      });
      const engine = new FinanceEngine(clonedData);
      const timeline = engine.runSimulation(true, null);
      if (!timeline || timeline.length === 0) continue;

      const startYear = timeline[0].year;
      const last = timeline[timeline.length - 1];
      const finalEstate =
        last.afterTaxEstate !== undefined
          ? last.afterTaxEstate
          : last.liquidNW + (last.reIncludedEq || 0);

      cppResultsArr.push({
        cppAge: cpp,
        oasAge: oas,
        finalEstate: getRealValue(data, finalEstate, startYear, last.year),
      });
    }
  }

  const sortedCpp = [...cppResultsArr].sort((a, b) => b.finalEstate - a.finalEstate);
  return {
    winner: sortedCpp[0] || null,
    scenarios: sortedCpp.slice(0, 5),
  };
}

export function runDieWithZero(data: any) {
  const runSandbox = (expenseMultiplier: number = 1.0) => {
    const clonedData = JSON.parse(JSON.stringify(data));
    if (expenseMultiplier !== 1.0 && clonedData.expensesByCategory) {
      Object.keys(clonedData.expensesByCategory).forEach((cat) => {
        clonedData.expensesByCategory[cat]?.items?.forEach((item: any) => {
          if (item.curr) item.curr *= expenseMultiplier;
          if (item.ret) item.ret *= expenseMultiplier;
          if (item.trans) item.trans *= expenseMultiplier;
          if (item.gogo) item.gogo *= expenseMultiplier;
          if (item.slow) item.slow *= expenseMultiplier;
          if (item.nogo) item.nogo *= expenseMultiplier;
        });
      });
    }
    const engine = new FinanceEngine(clonedData);
    return engine.runSimulation(true, null);
  };

  let low = 0.05;
  let high = 5.0;
  let bestMultiplier = 0;
  let bestEstate = 0;
  let bestTimeline: any[] | null = null;

  for (let i = 0; i < 15; i++) {
    const mid = (low + high) / 2;
    const timeline = runSandbox(mid);
    const isSuccess = timeline.every((y: any) => y.liquidNW > 0);

    if (isSuccess) {
      bestMultiplier = mid;
      const last = timeline[timeline.length - 1];
      bestEstate =
        last.afterTaxEstate !== undefined
          ? last.afterTaxEstate
          : last.liquidNW + (last.reIncludedEq || 0);
      bestTimeline = timeline;
      low = mid;
    } else {
      high = mid;
    }
  }

  if (bestTimeline && bestMultiplier > 0) {
    const baseTimeline = runSandbox(1.0);
    const retAge = Number(data?.inputs?.p1_retireAge) || 65;
    const baseRetYear =
      baseTimeline.find((y: any) => y.p1Age >= retAge) || baseTimeline[baseTimeline.length - 1];
    const optRetYear =
      bestTimeline.find((y: any) => y.p1Age >= retAge) || bestTimeline[bestTimeline.length - 1];

    const startYear = baseTimeline[0].year;
    const baseSpend = getRealValue(data, baseRetYear.expenses || 0, startYear, baseRetYear.year);
    const optSpend = getRealValue(data, optRetYear.expenses || 0, startYear, optRetYear.year);

    return {
      multiplier: bestMultiplier,
      baseSpend,
      optSpend,
      difference: optSpend - baseSpend,
      finalEstate: getRealValue(
        data,
        bestEstate,
        startYear,
        bestTimeline[bestTimeline.length - 1].year
      ),
    };
  }

  return { difference: -999999, optSpend: 0 };
}

export function runConsumptionSmoother(
  data: any,
  opts: { testRetAge: number; targetLegacy: number }
) {
  const isCouple = data?.mode === 'Couple';
  const defaultRetAge = Number(data?.inputs?.p1_retireAge) || 65;
  const testRetAge = Number(opts?.testRetAge) || defaultRetAge;
  const targetLegacy = Number(opts?.targetLegacy) || 0;

  const solveMaxDiscretionary = (
    candidateRetAge: number,
    delayCppTo70: boolean = false,
    legacyTarget: number = 0
  ) => {
    const runWithBudget = (annualRealSpend: number) => {
      const clonedData = JSON.parse(JSON.stringify(data));
      clonedData.inputs.p1_retireAge = candidateRetAge;
      if (isCouple) clonedData.inputs.p2_retireAge = candidateRetAge;

      if (delayCppTo70) {
        clonedData.inputs.p1_cpp_start = 70;
        clonedData.inputs.p1_oas_start = 70;
        if (isCouple) {
          clonedData.inputs.p2_cpp_start = 70;
          clonedData.inputs.p2_oas_start = 70;
        }
      }

      if (clonedData.expensesByCategory) {
        const cats = Object.keys(clonedData.expensesByCategory);
        if (cats.length > 0) {
          const firstCat = cats[0];
          clonedData.expensesByCategory[firstCat].items = [
            {
              name: 'Smoothed Lifestyle',
              curr: annualRealSpend,
              ret: annualRealSpend,
              trans: annualRealSpend,
              gogo: annualRealSpend,
              slow: annualRealSpend,
              nogo: annualRealSpend,
              freq: 1,
            },
          ];
          for (let c = 1; c < cats.length; c++) {
            clonedData.expensesByCategory[cats[c]].items = [];
          }
        }
      }

      const engine = new FinanceEngine(clonedData);
      return engine.runSimulation(true, null);
    };

    let low = 12000;
    let high = 350000;
    let bestSpend = low;

    for (let iter = 0; iter < 18; iter++) {
      const mid = (low + high) / 2;
      const timeline = runWithBudget(mid);
      if (!timeline || timeline.length === 0) break;

      const finalYear = timeline[timeline.length - 1];
      const finalLiquid = finalYear.liquidNW || 0;
      const isSolvent =
        timeline.every((y: any) => (y.liquidNW || 0) >= 0) && finalLiquid >= legacyTarget;

      if (isSolvent) {
        bestSpend = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    return {
      annualSpend: Math.round(bestSpend),
      monthlySpend: Math.round(bestSpend / 12),
    };
  };

  const baseOptimal = solveMaxDiscretionary(testRetAge, false, targetLegacy);
  const delayedOptimal = solveMaxDiscretionary(testRetAge, true, targetLegacy);
  const cppDelayGainMonthly = Math.max(0, delayedOptimal.monthlySpend - baseOptimal.monthlySpend);

  const retireEarlierAge = Math.max(55, testRetAge - 2);
  const earlierOptimal = solveMaxDiscretionary(retireEarlierAge, false, targetLegacy);
  const earlyRetireCostMonthly = Math.max(0, baseOptimal.monthlySpend - earlierOptimal.monthlySpend);

  const baseEngine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
  const defaultTimeline = baseEngine.runSimulation(true, null);
  const retYearItem =
    defaultTimeline.find((y: any) => y.p1Age >= defaultRetAge) ||
    defaultTimeline[defaultTimeline.length - 1];
  const startYear = defaultTimeline[0]?.year || new Date().getFullYear();
  const baselineCurrentSpend = retYearItem
    ? getRealValue(data, retYearItem.expenses || 60000, startYear, retYearItem.year)
    : 60000;

  return {
    annualSpend: baseOptimal.annualSpend,
    monthlySpend: baseOptimal.monthlySpend,
    baselineSpend: Math.round(baselineCurrentSpend),
    baselineMonthly: Math.round(baselineCurrentSpend / 12),
    differenceAnnual: baseOptimal.annualSpend - Math.round(baselineCurrentSpend),
    differenceMonthly: baseOptimal.monthlySpend - Math.round(baselineCurrentSpend / 12),
    cppDelayGainMonthly,
    earlyRetireCostMonthly,
    retireEarlierAge,
  };
}

export function runSorrShock(data: any) {
  const retAge = Number(data?.inputs?.p1_retireAge) || 65;
  const currentAge = Number(data?.inputs?.p1_age) || 35;
  const retYearIndex = Math.max(0, retAge - currentAge);

  const shockSeq = new Array(100).fill(0);
  shockSeq[retYearIndex] = -0.35;
  shockSeq[retYearIndex + 1] = -0.15;
  shockSeq[retYearIndex + 2] = 0.05;
  shockSeq[retYearIndex + 3] = 0.05;

  const clonedData = JSON.parse(JSON.stringify(data));
  const sorrEngine = new FinanceEngine(clonedData);
  const sorrTimeline = sorrEngine.runSimulation(true, { shockSequence: shockSeq });

  return { sorrTimeline, retAge };
}
