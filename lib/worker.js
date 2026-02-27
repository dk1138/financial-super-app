/**
 * worker.js
 * Background thread for running Monte Carlo simulations without freezing the UI.
 * Updated for Next.js to use modern ES module imports.
 */
import { FinanceEngine } from './financeEngine.js';

self.addEventListener('message', function(e) {
    try {
        const data = e.data;
        const trajectories = [];
        
        if (!data || !data.simulations) {
            throw new Error("Invalid payload sent to the worker.");
        }
        
        for (let i = 0; i < data.simulations; i++) {
            // Deep clone the engine data for EVERY simulation run
            const clonedData = structuredClone(data);
            const engine = new FinanceEngine(clonedData);
            
            let simContext = { method: clonedData.method };
            
            if (clonedData.method === 'historical') {
                if (!clonedData.sp500 || clonedData.sp500.length === 0) {
                    throw new Error("Historical S&P 500 sequence is missing.");
                }
                const startIdx = Math.floor(Math.random() * clonedData.sp500.length);
                simContext.histSequence = [];
                for (let y = 0; y < 100; y++) {
                    simContext.histSequence.push(clonedData.sp500[(startIdx + y) % clonedData.sp500.length]);
                }
            } else {
                simContext.volatility = clonedData.volatility;
            }

            // Run simulation using the shared engine
            const result = engine.runSimulation(false, simContext);
            
            if (!result || result.length === 0) {
                throw new Error("Engine returned an empty projection.");
            }
            
            trajectories.push(result);
        }
        
        // Post the final success packet back to the main thread
        self.postMessage({ success: true, trajectories: trajectories });
        
    } catch (error) {
        // If anything crashes, catch it and send the exact error back to the UI
        self.postMessage({ success: false, error: error.message, stack: error.stack });
    }
});