import { useState, useEffect } from 'react';

/**
 * Safely parses any input into a valid number.
 * Completely prevents NaN, Infinity, or string-math crashes in the engine.
 */
export const parseFormattedNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') {
        return 0;
    }
    
    if (typeof value === 'number') {
        if (isNaN(value) || !isFinite(value)) return 0;
        return value;
    }
    
    if (typeof value === 'string') {
        // Strip out everything except numbers, decimals, and negative signs
        const cleanStr = value.replace(/[^0-9.-]+/g, "");
        const parsed = parseFloat(cleanStr);
        
        if (isNaN(parsed) || !isFinite(parsed)) return 0;
        return parsed;
    }
    
    return 0;
};

/**
 * Client-Side Rate Limiter (Debounce Hook)
 * Prevents the app from running complex state calculations on every single keystroke.
 * * @param value The value to track (e.g., text input)
 * @param delay The time to wait in milliseconds (e.g., 300ms)
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timer to update the value only after the delay has passed
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clear the timer if the value changes again BEFORE the delay passes
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

// lib/utils.ts or financeEngine.ts

export const calculatePlanScore = (simResults: any[], inputs: any) => {
    if (!simResults || simResults.length === 0) return 0;

    const finalYear = simResults[simResults.length - 1];
    const firstYear = simResults[0];
    const totalYears = simResults.length;
    
    // 1. SUSTAINABILITY SCORE (0-50 pts)
    // Percentage of retirement years where liquid assets are > 0
    const yearsWithMoney = simResults.filter(y => y.liquidNW > 0).length;
    const sustainabilityScore = (yearsWithMoney / totalYears) * 50;

    // 2. ESTATE BUFFER SCORE (0-20 pts)
    // We consider a "perfect" buffer to be 5x your annual retirement expenses
    const retirementExpenses = finalYear.expenses || 50000; 
    const estateValue = finalYear.afterTaxEstate || 0;
    const bufferRatio = Math.min(estateValue / (retirementExpenses * 5), 1);
    const estateScore = bufferRatio * 20;

    // 3. TAX EFFICIENCY SCORE (0-20 pts)
    // Compares lifetime tax paid to total lifetime gross inflows
    const totalTax = simResults.reduce((sum, y) => sum + y.taxP1 + (y.taxP2 || 0), 0);
    const totalInflow = simResults.reduce((sum, y) => sum + y.grossInflow, 0);
    const taxRate = totalInflow > 0 ? totalTax / totalInflow : 0;
    // A lifetime effective rate of 15% or less is "Excellent" for seniors
    const taxScore = Math.max(0, (1 - (taxRate / 0.40)) * 20); 

    // 4. DEBT HEALTH SCORE (0-10 pts)
    // Debt-to-Asset ratio at the start of retirement vs peak debt
    const initialDebt = firstYear.mortgage || 0;
    const initialAssets = firstYear.liquidNW + firstYear.homeValue;
    const debtRatio = initialAssets > 0 ? initialDebt / initialAssets : 0;
    const debtScore = Math.max(0, (1 - debtRatio) * 10);

    const rawScore = sustainabilityScore + estateScore + taxScore + debtScore;
    return Math.round(rawScore);
};