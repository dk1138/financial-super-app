'use client';

import React, { useEffect, ReactNode, useRef, useState } from 'react';
import { create } from 'zustand';
import { FINANCIAL_CONSTANTS } from './config';
import { calculatePlanScore } from './financeEngine';

// --- TYPES & INTERFACES ---
export interface FinanceData {
    mode: 'Single' | 'Couple';
    useRealDollars: boolean;
    expenseMode: 'Simple' | 'Advanced';
    inputs: Record<string, any>;
    properties: any[];
    windfalls: any[];
    additionalIncome: any[];
    customAssets: any[];
    leaves: any[];
    dependents: any[];
    debt: any[];
    strategies: {
        accum: string[];
        decum: string[];
    };
    expensesByCategory: Record<string, any>;
    constants: any;
}

interface FinanceState {
    data: FinanceData;
    results: any;
    planScore: any;
    isCalculating: boolean;
    mcResults: any;
    setData: (updater: FinanceData | ((prev: FinanceData) => FinanceData)) => void;
    setResults: (results: any) => void;
    setIsCalculating: (isCalculating: boolean) => void;
    setMcResults: (mcResults: any) => void;
}

// --- HELPER FUNCTIONS ---
const calculateExactAge = (dobString: string): number => {
    if (!dobString || typeof dobString !== 'string') return 0;
    const parts = dobString.split(/[-/T ]/);
    if (parts.length < 2) {
        const year = parseInt(dobString, 10);
        return isNaN(year) ? 0 : Math.max(0, new Date().getFullYear() - year);
    }
    const dobYear = parseInt(parts[0], 10);
    const dobMonth = parseInt(parts[1], 10);
    const dobDay = parts.length >= 3 ? parseInt(parts[2], 10) : 1;
    if (isNaN(dobYear) || isNaN(dobMonth)) return 0;

    const today = new Date();
    let age = today.getFullYear() - dobYear;
    if (today.getMonth() + 1 < dobMonth || (today.getMonth() + 1 === dobMonth && today.getDate() < dobDay)) {
        age--;
    }
    return Math.max(0, age);
};

const shiftDobYear = (dobString: string, targetAge: number): string => {
    if (!dobString || typeof dobString !== 'string') return `${new Date().getFullYear() - targetAge}-01`;
    const parts = dobString.split('-');
    const month = parseInt(parts[1] || '01', 10);
    const day = parts[2] ? parseInt(parts[2], 10) : 1;
    const today = new Date();
    
    let newYear = today.getFullYear() - targetAge;
    if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
        newYear--;
    }
    return parts[2] ? `${newYear}-${parts[1] || '01'}-${parts[2]}` : `${newYear}-${parts[1] || '01'}`;
};

const boundAge = (age: number): number => Math.max(1, Math.min(99, isNaN(age) ? 30 : age));

const boundDob = (dobString: string): string => {
    if (!dobString || typeof dobString !== 'string') return `${new Date().getFullYear()}-01`;
    const parts = dobString.split('-');
    let year = parseInt(parts[0], 10);
    const currentYear = new Date().getFullYear();
    year = Math.max(1900, Math.min(currentYear, isNaN(year) ? currentYear : year));
    return `${year}-${parts[1] || '01'}${parts[2] ? '-' + parts[2] : ''}`;
};

const syncAgeAndDob = (player: string, prevInputs: any, finalInputs: any) => {
    const oldAge = prevInputs[`${player}_age`];
    let newAge = finalInputs[`${player}_age`];
    const oldDob = prevInputs[`${player}_dob`] || "1990-01";
    let newDob = finalInputs[`${player}_dob`] || oldDob;

    const ageChanged = oldAge !== newAge;
    const dobChanged = oldDob !== newDob;

    if (ageChanged && !dobChanged) {
        newAge = boundAge(newAge);
        finalInputs[`${player}_age`] = newAge;
        finalInputs[`${player}_dob`] = boundDob(shiftDobYear(oldDob, newAge));
    } else if (dobChanged && !ageChanged) {
        newDob = boundDob(newDob);
        finalInputs[`${player}_dob`] = newDob;
        finalInputs[`${player}_age`] = boundAge(calculateExactAge(newDob));
    } else if (ageChanged && dobChanged) {
        if (oldDob.split('-')[1] !== newDob.split('-')[1]) {
            newDob = boundDob(newDob);
            finalInputs[`${player}_dob`] = newDob;
            finalInputs[`${player}_age`] = boundAge(calculateExactAge(newDob));
        } else {
            newAge = boundAge(newAge);
            finalInputs[`${player}_age`] = newAge;
            finalInputs[`${player}_dob`] = boundDob(shiftDobYear(oldDob, newAge));
        }
    }
};

const sanitizeValue = (val: any): any => {
    if (typeof val === 'string') return val.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 100);
    if (typeof val === 'number') return isNaN(val) || !isFinite(val) ? 0 : Math.max(-1000000000, Math.min(1000000000, val));
    return val;
};

// --- DATA SCHEMAS ---
export const emptyData: FinanceData = {
    mode: 'Single',
    useRealDollars: false,
    expenseMode: 'Simple',
    inputs: {
        p1_dob: '1990-01', p1_age: 35, p1_retireAge: 60, p1_lifeExp: 90,
        p1_income: 0, p1_income_growth: 2.0, p1_rrsp_match: 0.0, p1_rrsp_match_tier: 0.0,
        p1_cash: 0, p1_cash_ret: 2.0, p1_tfsa: 0, p1_tfsa_ret: 6.0, p1_fhsa: 0, p1_fhsa_ret: 6.0,
        p1_rrsp: 0, p1_rrsp_ret: 6.0, p1_resp: 0, p1_resp_ret: 6.0, p1_lirf: 0, p1_lirf_ret: 6.0,
        p1_lif: 0, p1_lif_ret: 5.0, p1_rrif_acct: 0, p1_rrif_acct_ret: 5.0,
        p1_nonreg: 0, p1_nonreg_acb: 0, p1_nonreg_ret: 5.0, p1_nonreg_yield: 2.0,
        p1_crypto: 0, p1_crypto_acb: 0, p1_crypto_ret: 8.0,
        p1_cpp_enabled: true, p1_cpp_est_base: 0, p1_cpp_start: 65,
        p1_oas_enabled: true, p1_oas_years: 0, p1_oas_start: 65,

        p2_dob: '1990-01', p2_age: 35, p2_retireAge: 60, p2_lifeExp: 90,
        p2_income: 0, p2_income_growth: 2.0, p2_rrsp_match: 0.0, p2_rrsp_match_tier: 0.0,
        p2_cash: 0, p2_cash_ret: 2.0, p2_tfsa: 0, p2_tfsa_ret: 6.0, p2_fhsa: 0, p2_fhsa_ret: 6.0,
        p2_rrsp: 0, p2_rrsp_ret: 6.0, p2_resp: 0, p2_resp_ret: 6.0, p2_lirf: 0, p2_lirf_ret: 6.0,
        p2_lif: 0, p2_lif_ret: 5.0, p2_rrif_acct: 0, p2_rrif_acct_ret: 5.0,
        p2_nonreg: 0, p2_nonreg_acb: 0, p2_nonreg_ret: 5.0, p2_nonreg_yield: 2.0,
        p2_crypto: 0, p2_crypto_acb: 0, p2_crypto_ret: 8.0,
        p2_cpp_enabled: true, p2_cpp_est_base: 0, p2_cpp_start: 65,
        p2_oas_enabled: true, p2_oas_years: 0, p2_oas_start: 65,

        inflation_rate: 2.1, tax_province: 'ON',
        cfg_tfsa_limit: 7000, cfg_rrsp_limit: 32960, cfg_fhsa_limit: 8000,
        cfg_resp_limit: 2500, cfg_crypto_limit: 5000,
        
        portfolio_allocation: 'custom', use_glide_path: false,
        fully_optimize_tax: false, oas_clawback_optimize: false, rrsp_meltdown_enabled: false, enable_guardrails: false,
        skip_first_tfsa_p1: false, skip_first_rrsp_p1: false,
        skip_first_tfsa_p2: false, skip_first_rrsp_p2: false,
        exp_gogo_age: 75, exp_slow_age: 85, pension_split_enabled: false,
        emergency_fund_mode: 'none', emergency_fund_custom_amount: 0
    },
    properties: [], windfalls: [], additionalIncome: [], customAssets: [], leaves: [], dependents: [], debt: [],
    strategies: {
        accum: ['tfsa', 'rrsp', 'fhsa', 'resp', 'nonreg', 'cash', 'crypto'],
        decum: ['nonreg', 'cash', 'tfsa', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto']
    },
    expensesByCategory: { housing: { items: [] }, transport: { items: [] }, lifestyle: { items: [] }, essentials: { items: [] }, other: { items: [] } },
    constants: FINANCIAL_CONSTANTS
};

export const defaultData: FinanceData = { ...emptyData, mode: 'Couple' };

export const migrateLegacyData = (parsedData: any, baseData: FinanceData): FinanceData => {
    const merged = JSON.parse(JSON.stringify(baseData));
    if (!parsedData) return merged;

    merged.mode = parsedData.mode || (parsedData.inputs?.modeCouple ? 'Couple' : 'Single');
    merged.useRealDollars = parsedData.useRealDollars ?? parsedData.inputs?.useRealDollars ?? false;
    merged.expenseMode = parsedData.expenseMode || (parsedData.inputs?.expense_mode_advanced ? 'Advanced' : 'Simple');

    ['properties', 'windfalls', 'additionalIncome', 'customAssets', 'leaves', 'dependents', 'debt'].forEach(arr => {
        if (parsedData[arr]) merged[arr] = parsedData[arr];
    });

    if (parsedData.strategies) {
        if (parsedData.strategies.accum) merged.strategies.accum = parsedData.strategies.accum.map((s: string) => s === 'nreg' ? 'nonreg' : s);
        if (parsedData.strategies.decum) merged.strategies.decum = parsedData.strategies.decum.map((s: string) => s === 'nreg' ? 'nonreg' : s);
    }

    if (parsedData.expensesData) {
        Object.keys(parsedData.expensesData).forEach(k => {
            const lowerK = k.toLowerCase();
            const items = parsedData.expensesData[k].items || [];
            items.forEach((item: any) => {
                ['curr', 'ret', 'trans', 'gogo', 'slow', 'nogo'].forEach(f => {
                    if (typeof item[f] === 'string') item[f] = parseFloat(item[f].replace(/,/g, '')) || 0;
                });
            });
            if (lowerK === 'housing') merged.expensesByCategory.housing.items.push(...items);
            else if (lowerK === 'living' || lowerK === 'kids') merged.expensesByCategory.essentials.items.push(...items);
            else if (lowerK === 'lifestyle') merged.expensesByCategory.lifestyle.items.push(...items);
            else merged.expensesByCategory.other.items.push(...items);
        });
    } else if (parsedData.expensesByCategory) {
        merged.expensesByCategory = parsedData.expensesByCategory;
    }

    if (parsedData.inputs) {
        Object.keys(parsedData.inputs).forEach(k => {
            let val = parsedData.inputs[k];
            if (typeof val === 'string' && /^-?[0-9,]+(\.[0-9]+)?$/.test(val)) {
                const parsedNum = parseFloat(val.replace(/,/g, ''));
                if (!isNaN(parsedNum)) val = parsedNum;
            }

            let newKey = k;
            if (k === 'p1_db_pension') newKey = 'p1_db_lifetime';
            if (k === 'p1_db_start_age') newKey = 'p1_db_lifetime_start';
            if (k === 'p2_db_pension') newKey = 'p2_db_lifetime';
            if (k === 'p2_db_start_age') newKey = 'p2_db_lifetime_start';
            if (k.endsWith('_ret_retire')) newKey = k.replace('_ret_retire', '_retire_ret');

            merged.inputs[newKey] = val;
        });
    }

    ['p1', 'p2'].forEach(player => {
        let dob = merged.inputs[`${player}_dob`];
        if (dob) {
            dob = boundDob(dob);
            merged.inputs[`${player}_dob`] = dob;
            merged.inputs[`${player}_age`] = boundAge(calculateExactAge(dob));
        }
    });

    merged.constants = FINANCIAL_CONSTANTS;
    return merged;
};

// --- ZUSTAND STORE ---
export const useFinanceStore = create<FinanceState>((set) => ({
    data: defaultData,
    results: null,
    planScore: null,
    isCalculating: true,
    mcResults: null,
    setMcResults: (mcResults) => set({ mcResults }),
    setData: (updater) => set((state) => ({ 
        data: typeof updater === 'function' ? updater(state.data) : updater 
    })),
    setResults: (results) => set((state) => ({
        results,
        planScore: calculatePlanScore(state.data, results?.timeline),
        isCalculating: false
    })),
    setIsCalculating: (isCalculating) => set({ isCalculating })
}));

// --- GLOBAL HOOK FOR COMPONENTS ---
export function useFinance() {
    const store = useFinanceStore();

    return {
        ...store,
        updateInput: (key: string, value: any) => store.setData((prev) => {
            const finalInputs = { ...prev.inputs, [key]: sanitizeValue(value) };
            syncAgeAndDob('p1', prev.inputs, finalInputs);
            syncAgeAndDob('p2', prev.inputs, finalInputs);
            return { ...prev, inputs: finalInputs };
        }),
        updateMultipleInputs: (updates: Record<string, any>) => {
            const cleanUpdates: Record<string, any> = {};
            Object.keys(updates).forEach(k => cleanUpdates[k] = sanitizeValue(updates[k]));
            store.setData((prev) => {
                const finalInputs = { ...prev.inputs, ...cleanUpdates };
                syncAgeAndDob('p1', prev.inputs, finalInputs);
                syncAgeAndDob('p2', prev.inputs, finalInputs);
                return { ...prev, inputs: finalInputs };
            });
        },
        updateMode: (newMode: 'Single' | 'Couple') => store.setData((prev) => ({ ...prev, mode: newMode })),
        updateUseRealDollars: (val: boolean) => store.setData((prev) => ({ ...prev, useRealDollars: val })),
        addArrayItem: (listName: keyof FinanceData, defaultObj: any) => store.setData((prev) => ({ 
            ...prev, [listName]: [...((prev[listName] as any[]) || []), defaultObj] 
        })),
        updateArrayItem: (listName: keyof FinanceData, index: number, field: string, value: any) => store.setData((prev) => {
            const newList = [...((prev[listName] as any[]) || [])];
            newList[index] = { ...newList[index], [field]: sanitizeValue(value) };
            return { ...prev, [listName]: newList };
        }),
        removeArrayItem: (listName: keyof FinanceData, index: number) => store.setData((prev) => {
            const newList = [...((prev[listName] as any[]) || [])];
            newList.splice(index, 1);
            return { ...prev, [listName]: newList };
        }),
        updateStrategy: (type: 'accum' | 'decum', newList: string[]) => store.setData((prev) => ({ 
            ...prev, strategies: { ...prev.strategies, [type]: newList } 
        })),
        loadData: (newPlanData: any) => store.setData(migrateLegacyData(newPlanData, emptyData)),
        resetData: () => {
            store.setData(emptyData);
            localStorage.removeItem('retirement_plan_data');
        }
    };
}

// --- SIDE-EFFECT MANAGER (Replaces pure React Context) ---
export function FinanceProvider({ children }: { children: ReactNode }) {
    const data = useFinanceStore(state => state.data);
    const setResults = useFinanceStore(state => state.setResults);
    const setIsCalculating = useFinanceStore(state => state.setIsCalculating);
    const setData = useFinanceStore(state => state.setData);
    
    const workerRef = useRef<Worker | null>(null);
    const [hasHydrated, setHasHydrated] = useState(false);
    const dataRef = useRef(data);

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    // 1. Initialization
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('retirement_plan_data');
            if (savedData) {
                const parsedData = JSON.parse(savedData);
                if (parsedData && parsedData.inputs) {
                    setData(migrateLegacyData(parsedData, emptyData));
                }
            }
        } catch (e) {
            console.error("Failed to parse local storage data:", e);
        }

        setHasHydrated(true);

        workerRef.current = new Worker(new URL('./financeWorker.ts', import.meta.url));
        workerRef.current.onmessage = (e) => {
            if (e.data.status === 'success') {
                setResults(e.data.results);
            } else {
                console.error("Worker Error:", e.data.error);
                setIsCalculating(false);
            }
        };

        return () => workerRef.current?.terminate();
    }, []);

    // 2. Calculation Engine Trigger
    useEffect(() => {
        if (!hasHydrated) return;
        setIsCalculating(true);
        useFinanceStore.setState({ mcResults: null });

        const calcTimeoutId = setTimeout(() => {
            if (workerRef.current) {
                workerRef.current.postMessage({ data: JSON.parse(JSON.stringify(data)), detailed: true });
            }
        }, 300);

        return () => clearTimeout(calcTimeoutId);
    }, [data, hasHydrated]);

    // 3. Local Storage Saver
    useEffect(() => {
        if (!hasHydrated) return;
        const saveTimeoutId = setTimeout(() => {
            try {
                localStorage.setItem('retirement_plan_data', JSON.stringify(data));
            } catch (err) {
                console.error("Auto-save failed:", err);
            }
        }, 1500);

        return () => clearTimeout(saveTimeoutId);
    }, [data, hasHydrated]);

    // 4. Rotating Backup
    useEffect(() => {
        if (!hasHydrated) return;
        const backupIntervalId = setInterval(() => {
            try {
                const backupName = "Latest Auto-Backup";
                localStorage.setItem(`rp_saved_plan_${backupName}`, JSON.stringify(dataRef.current));

                let plans = JSON.parse(localStorage.getItem('rp_plan_list') || '[]');
                if (!plans.includes(backupName)) {
                    plans.unshift(backupName);
                    localStorage.setItem('rp_plan_list', JSON.stringify(plans));
                }
            } catch (err) {
                console.error("Auto-Backup failed:", err);
            }
        }, 60 * 1000);

        return () => clearInterval(backupIntervalId);
    }, [hasHydrated]);

    return <>{children}</>;
}