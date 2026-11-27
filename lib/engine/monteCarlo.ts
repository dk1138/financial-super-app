import { FinanceEngine } from '../financeEngine';
import { FINANCIAL_CONSTANTS } from '../config';

export type MonteCarloMethod = 'lhs' | 'qhs' | 'random' | 'historical';

export interface MonteCarloOptions {
    simCount: number;
    method: MonteCarloMethod;
    volatility: number;
}

export interface MonteCarloPoint {
    age: number;
    optimistic: number;
    median: number;
    pessimistic: number;
}

export interface MonteCarloResult {
    chartData: MonteCarloPoint[];
    successRate: number;
    simCount: number;
    method: MonteCarloMethod;
    volatility: number;
}

/**
 * High-precision Inverse Normal Cumulative Distribution Function (Probit function)
 * Peter J. Acklam's algorithm (error < 1.15e-9).
 */
export function invNorm(p: number): number {
    if (p <= 0.00001) return -4.5;
    if (p >= 0.99999) return 4.5;

    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    if (p < pLow) {
        const q = Math.sqrt(-2 * Math.log(p));
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
               ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }
    if (p <= pHigh) {
        const q = p - 0.5;
        const r = q * q;
        return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
               (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
            ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

/**
 * Latin Hypercube Sampling (LHS) Generator.
 */
export function generateLHSShocks(runs: number, years: number, volatility: number): number[][] {
    const matrix: number[][] = Array.from({ length: runs }, () => new Array(years).fill(0));

    for (let y = 0; y < years; y++) {
        const yearSamples: number[] = [];
        for (let i = 0; i < runs; i++) {
            const u = (i + Math.random()) / runs;
            yearSamples.push(invNorm(u) * volatility);
        }

        for (let i = runs - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = yearSamples[i];
            yearSamples[i] = yearSamples[j];
            yearSamples[j] = temp;
        }

        for (let i = 0; i < runs; i++) {
            matrix[i][y] = yearSamples[i];
        }
    }

    return matrix;
}

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
function getPrime(idx: number): number {
    if (idx < PRIMES.length) return PRIMES[idx];
    let candidate = PRIMES[PRIMES.length - 1] + 2;
    while (true) {
        let isPrime = true;
        for (let i = 2; i * i <= candidate; i++) {
            if (candidate % i === 0) { isPrime = false; break; }
        }
        if (isPrime) {
            PRIMES.push(candidate);
            if (PRIMES.length > idx) return candidate;
        }
        candidate += 2;
    }
}

function halton(index: number, base: number): number {
    let result = 0;
    let f = 1 / base;
    let i = index;
    while (i > 0) {
        result += f * (i % base);
        i = Math.floor(i / base);
        f /= base;
    }
    return result;
}

/**
 * Quasi-Monte Carlo (QHS) Generator using Low-Discrepancy Halton Sequences.
 */
export function generateQHSShocks(runs: number, years: number, volatility: number): number[][] {
    const matrix: number[][] = Array.from({ length: runs }, () => new Array(years).fill(0));
    const offset = Math.floor(Math.random() * 1000) + 1;

    for (let y = 0; y < years; y++) {
        const base = getPrime(y);
        for (let i = 0; i < runs; i++) {
            let u = halton(offset + i, base);
            u = Math.max(0.0001, Math.min(0.9999, u));
            matrix[i][y] = invNorm(u) * volatility;
        }
    }

    return matrix;
}

/**
 * Runs a full Monte Carlo simulation suite and returns cross-sectional percentiles.
 */
export function runMonteCarloSimulation(
    data: any,
    options: MonteCarloOptions,
    onProgress?: (pct: number) => void
): MonteCarloResult {
    const { simCount, method, volatility } = options;
    const trajectories: number[][] = [];
    const p1Age = data.inputs?.p1_dob
        ? (new Date().getFullYear() - new Date(data.inputs.p1_dob).getFullYear())
        : (Number(data.inputs?.p1_age) || 38);
    const inflationRate = (data.inputs.inflation_rate || 2.1) / 100;
    let successCount = 0;

    let structuredShocks: number[][] | null = null;
    if (method === 'lhs') {
        structuredShocks = generateLHSShocks(simCount, 100, volatility);
    } else if (method === 'qhs') {
        structuredShocks = generateQHSShocks(simCount, 100, volatility);
    }

    const progressStep = Math.max(1, Math.floor(simCount / 20));

    for (let i = 0; i < simCount; i++) {
        const engine = new FinanceEngine(JSON.parse(JSON.stringify(data)));
        const simContext: any = { method };

        if (method === 'historical') {
            const sp500 = FINANCIAL_CONSTANTS.SP500_HISTORICAL;
            const startIdx = Math.floor(Math.random() * sp500.length);
            simContext.shockSequence = [];

            for (let y = 0; y < 100; y++) {
                const historicalReturn = sp500[(startIdx + y) % sp500.length];
                simContext.shockSequence.push(historicalReturn - 0.09);
            }
        } else if ((method === 'lhs' || method === 'qhs') && structuredShocks) {
            simContext.shockSequence = structuredShocks[i];
        } else {
            simContext.volatility = volatility;
        }

        const detailedResult = engine.runSimulation(true, simContext);
        const liquidTrajectory = detailedResult.map((y: any) => y.liquidNW);
        trajectories.push(liquidTrajectory);

        const hadShortfall = detailedResult.some((y: any) => (y.unfundedShortfall || 0) > 1);
        if (liquidTrajectory[liquidTrajectory.length - 1] > 0 && !hadShortfall) {
            successCount++;
        }

        if (onProgress && ((i + 1) % progressStep === 0 || i === simCount - 1)) {
            onProgress(Math.round(((i + 1) / simCount) * 100));
        }
    }

    const runs = trajectories.length;
    const finalSuccessRate = Number(((successCount / runs) * 100).toFixed(1));
    const discount = (val: number, idx: number) => Math.max(0, Math.round(val / Math.pow(1 + inflationRate, idx)));

    const yearsCount = trajectories[0].length;
    const formattedData: MonteCarloPoint[] = [];

    for (let y = 0; y < yearsCount; y++) {
        const yearValues = trajectories.map(t => t[y]).sort((a, b) => a - b);

        formattedData.push({
            age: p1Age + y,
            optimistic: discount(yearValues[Math.floor(runs * 0.90)], y),
            median: discount(yearValues[Math.floor(runs * 0.50)], y),
            pessimistic: discount(yearValues[Math.floor(runs * 0.10)], y),
        });
    }

    return {
        chartData: formattedData,
        successRate: finalSuccessRate,
        simCount,
        method,
        volatility,
    };
}
