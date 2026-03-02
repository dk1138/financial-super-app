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