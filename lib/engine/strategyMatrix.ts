import { FinanceEngine } from '../financeEngine';

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  tags: string[];
  isBaseline?: boolean;
  inputOverrides: Record<string, any>;
  decumOverride?: string[];
}

export interface StrategyMatrixRow {
  id: string;
  name: string;
  description: string;
  tags: string[];
  isBaseline: boolean;
  afterTaxEstate: number;
  lifetimeTax: number;
  survived: boolean;
  deltaEstate: number;
  deltaTax: number;
  inputOverrides: Record<string, any>;
  decumOverride?: string[];
}

export function buildStrategyPresets(data: any): StrategyPreset[] {
  const isCouple = data?.mode === 'Couple';
  const cppOas = (cppAge: number, oasAge: number) => {
    const out: Record<string, any> = {
      p1_cpp_start: cppAge,
      p1_oas_start: oasAge,
    };
    if (isCouple) {
      out.p2_cpp_start = cppAge;
      out.p2_oas_start = oasAge;
    }
    return out;
  };

  const classicDecum = ['nonreg', 'cash', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'tfsa', 'crypto'];
  const tfsaFirstDecum = ['tfsa', 'cash', 'nonreg', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto'];

  return [
    {
      id: 'current',
      name: 'Your Current Setup',
      description: 'Your live withdrawal order, tax toggles, and CPP/OAS start ages.',
      tags: ['Baseline'],
      isBaseline: true,
      inputOverrides: {},
    },
    {
      id: 'meltdown_split',
      name: 'RRSP Meltdown + Pension Split',
      description: 'Proactively draws RRSPs in lower brackets before age 72 and splits eligible pension income.',
      tags: ['Tax Optimizer', ...(isCouple ? ['Pension Split'] : [])],
      inputOverrides: {
        fully_optimize_tax: true,
        oas_clawback_optimize: false,
        pension_split_enabled: isCouple,
      },
    },
    {
      id: 'oas_shield',
      name: 'OAS Clawback Shield + Meltdown',
      description: 'Combines RRSP meltdown with active OAS recovery tax capping to protect government benefits.',
      tags: ['Tax Optimizer', 'OAS Shield'],
      inputOverrides: {
        fully_optimize_tax: true,
        oas_clawback_optimize: true,
        pension_split_enabled: isCouple,
      },
    },
    {
      id: 'defer_70_combo',
      name: 'Defer CPP & OAS to 70 + Meltdown',
      description: 'Maximizes guaranteed indexed pensions (+42% CPP / +36% OAS) while melting down RRSPs in your 60s.',
      tags: ['CPP/OAS 70', 'Tax Optimizer', 'OAS Shield'],
      inputOverrides: {
        fully_optimize_tax: true,
        oas_clawback_optimize: true,
        pension_split_enabled: isCouple,
        ...cppOas(70, 70),
      },
    },
    {
      id: 'early_cpp_60',
      name: 'Early CPP at 60 + Meltdown',
      description: 'Starts CPP early at 60 (-36%) to bridge early retirement cash flow and preserve invested capital.',
      tags: ['CPP 60', 'Tax Optimizer'],
      inputOverrides: {
        fully_optimize_tax: true,
        oas_clawback_optimize: false,
        pension_split_enabled: isCouple,
        ...cppOas(60, 65),
      },
    },
    {
      id: 'classic_order',
      name: 'Classic Order (Non-Reg → RRSP → TFSA)',
      description: 'Standard textbook drawdown preserving TFSA for last, with CPP/OAS at 65.',
      tags: ['Classic', 'CPP/OAS 65'],
      inputOverrides: {
        fully_optimize_tax: false,
        oas_clawback_optimize: false,
        pension_split_enabled: isCouple,
        ...cppOas(65, 65),
      },
      decumOverride: classicDecum,
    },
    {
      id: 'tfsa_first',
      name: 'TFSA First (Benchmark)',
      description: 'Spends tax-free TFSA balances early before touching taxable accounts—typically less tax-efficient.',
      tags: ['Benchmark'],
      inputOverrides: {
        fully_optimize_tax: false,
        oas_clawback_optimize: false,
        pension_split_enabled: isCouple,
      },
      decumOverride: tfsaFirstDecum,
    },
  ];
}

export function runStrategyMatrix(
  data: any,
  onProgress?: (pct: number) => void
): StrategyMatrixRow[] {
  const presets = buildStrategyPresets(data);
  const useReal = Boolean(data?.useRealDollars);
  const inflation = (Number(data?.inputs?.inflation_rate) || 2.1) / 100;

  const rawRows: Omit<StrategyMatrixRow, 'deltaEstate' | 'deltaTax'>[] = [];

  for (let i = 0; i < presets.length; i++) {
    const preset = presets[i];
    const cloned = JSON.parse(JSON.stringify(data));
    cloned.inputs = { ...cloned.inputs, ...preset.inputOverrides };
    if (preset.decumOverride) {
      cloned.strategies = { ...cloned.strategies, decum: [...preset.decumOverride] };
    }

    const engine = new FinanceEngine(cloned);
    const timeline = engine.runSimulation(true, null);

    const startYear = timeline[0]?.year || new Date().getFullYear();
    const getReal = (nominal: number, year: number) =>
      useReal ? nominal / Math.pow(1 + inflation, Math.max(0, year - startYear)) : nominal;

    const finalYear = timeline[timeline.length - 1];
    const finalEstateNominal = finalYear
      ? finalYear.afterTaxEstate !== undefined
        ? finalYear.afterTaxEstate
        : finalYear.liquidNW + (finalYear.reIncludedEq || 0)
      : 0;

    const afterTaxEstate = Math.round(getReal(finalEstateNominal, finalYear?.year || startYear));
    const lifetimeTax = Math.round(
      timeline.reduce(
        (sum: number, y: any) => sum + getReal((y.taxP1 || 0) + (y.taxP2 || 0), y.year),
        0
      )
    );
    const survived = timeline.every((y: any) => Math.round(y.liquidNW || 0) >= 0);

    rawRows.push({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      tags: preset.tags,
      isBaseline: Boolean(preset.isBaseline),
      afterTaxEstate,
      lifetimeTax,
      survived,
      inputOverrides: preset.inputOverrides,
      decumOverride: preset.decumOverride,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / presets.length) * 100));
    }
  }

  const baseline = rawRows.find((r) => r.isBaseline) || rawRows[0];

  return rawRows.map((row) => ({
    ...row,
    deltaEstate: row.afterTaxEstate - baseline.afterTaxEstate,
    deltaTax: row.lifetimeTax - baseline.lifetimeTax,
  }));
}
