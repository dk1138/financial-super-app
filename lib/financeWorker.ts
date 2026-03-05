import { FinanceEngine } from './financeEngine';

self.onmessage = (e: MessageEvent) => {
    const { data, detailed, simContext } = e.data;

    try {
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