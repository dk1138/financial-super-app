import { FinanceEngine } from './financeEngine';
import { runMonteCarloSimulation } from './engine/monteCarlo';
import { runStrategyMatrix } from './engine/strategyMatrix';
import { runSurvivorStressTest } from './engine/survivorStress';
import { runSensitivityHeatmap, solveMaxRetirementSpend } from './engine/sensitivity';
import {
    runCppGridSearch,
    runDieWithZero,
    runConsumptionSmoother,
    runSorrShock,
} from './engine/optimizers';

self.onmessage = (e: MessageEvent) => {
    const {
        type,
        data,
        detailed,
        simContext,
        simCount,
        method,
        volatility,
        deceased,
        deathAge,
        expenseReductionPct,
        targetEstate,
        testRetAge,
        targetLegacy,
    } = e.data;

    try {
        if (type === 'monteCarlo') {
            const results = runMonteCarloSimulation(
                data,
                { simCount, method, volatility },
                (progress) => {
                    self.postMessage({ status: 'progress', progress });
                }
            );
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'strategyMatrix') {
            const results = runStrategyMatrix(data, (progress) => {
                self.postMessage({ status: 'progress', progress });
            });
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'survivorStress') {
            const results = runSurvivorStressTest(data, {
                deceased,
                deathAge,
                expenseReductionPct,
            });
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'sensitivityHeatmap') {
            const results = runSensitivityHeatmap(data, (progress) => {
                self.postMessage({ status: 'progress', progress });
            });
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'maxSpend') {
            const results = solveMaxRetirementSpend(data, { targetEstate: Number(targetEstate) || 0 });
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'cppGridSearch') {
            const results = runCppGridSearch(data);
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'dieWithZero') {
            const results = runDieWithZero(data);
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'consumptionSmoother') {
            const results = runConsumptionSmoother(data, {
                testRetAge: Number(testRetAge),
                targetLegacy: Number(targetLegacy) || 0,
            });
            self.postMessage({ status: 'success', results });
            return;
        }

        if (type === 'sorrShock') {
            const results = runSorrShock(data);
            self.postMessage({ status: 'success', results });
            return;
        }

        // Instantiate the engine with the raw JSON data sent from the main thread
        const engine = new FinanceEngine(data);
        
        // Run the heavy simulation math in the background
        const simulation = engine.runSimulation(detailed, simContext);
        const finalYear = simulation[simulation.length - 1];

        // Package the results to send back to the UI
        const results = {
            timeline: simulation,
            dashboard: {
                finalNetWorth: finalYear ? (finalYear.afterTaxEstate !== undefined ? finalYear.afterTaxEstate : finalYear.liquidNW + (finalYear.reIncludedEq || 0)) : 0,
                totalTax: simulation.reduce((sum: number, year: any) => sum + year.taxP1 + (year.taxP2 || 0), 0)
            }
        };

        self.postMessage({ status: 'success', results });
    } catch (err: any) {
        console.error("Worker Simulation Error:", err);
        self.postMessage({ status: 'error', error: err.message });
    }
};