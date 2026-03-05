'use client';

import React, { useEffect, ReactNode, useRef } from 'react';
import { create } from 'zustand';
import { FINANCIAL_CONSTANTS } from './config';

// --- STRICT SANITIZATION ENGINE ---
const sanitizeValue = (val: any): any => {
  if (typeof val === 'string') {
    let cleanStr = val.replace(/<\/?[^>]+(>|$)/g, "");
    if (cleanStr.length > 100) cleanStr = cleanStr.substring(0, 100);
    return cleanStr;
  }
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return 0;
    if (val > 1000000000) return 1000000000; 
    if (val < -1000000000) return -1000000000;
    return val;
  }
  return val; 
};

export const defaultData = {
  mode: 'Couple',
  useRealDollars: false, 
  expenseMode: 'Simple',
  inputs: {
    // Player 1 Defaults
    p1_dob: '1996-01', p1_age: 30, p1_retireAge: 65, p1_lifeExp: 90,
    p1_income: 85000, p1_income_growth: 2.0, p1_rrsp_match: 3.0, p1_rrsp_match_tier: 100.0,
    p1_cash: 10000, p1_cash_ret: 2.0,
    p1_tfsa: 25000, p1_tfsa_ret: 6.0,
    p1_fhsa: 0, p1_fhsa_ret: 6.0,
    p1_rrsp: 35000, p1_rrsp_ret: 6.0,
    p1_resp: 0, p1_resp_ret: 6.0,
    p1_lirf: 0, p1_lirf_ret: 6.0,
    p1_lif: 0, p1_lif_ret: 5.0,
    p1_rrif_acct: 0, p1_rrif_acct_ret: 5.0,
    p1_nonreg: 0, p1_nonreg_acb: 0, p1_nonreg_ret: 5.0, p1_nonreg_yield: 2.0,
    p1_crypto: 0, p1_crypto_acb: 0, p1_crypto_ret: 8.0,
    p1_cpp_enabled: true, p1_cpp_est_base: 12000, p1_cpp_start: 65,
    p1_oas_enabled: true, p1_oas_years: 40, p1_oas_start: 65,

    // Player 2 Defaults
    p2_dob: '1996-01', p2_age: 30, p2_retireAge: 65, p2_lifeExp: 90,
    p2_income: 75000, p2_income_growth: 2.0, p2_rrsp_match: 0.0, p2_rrsp_match_tier: 100.0,
    p2_cash: 5000, p2_cash_ret: 2.0,
    p2_tfsa: 15000, p2_tfsa_ret: 6.0,
    p2_fhsa: 0, p2_fhsa_ret: 6.0,
    p2_rrsp: 25000, p2_rrsp_ret: 6.0,
    p2_resp: 0, p2_resp_ret: 6.0,
    p2_lirf: 0, p2_lirf_ret: 6.0,
    p2_lif: 0, p2_lif_ret: 5.0,
    p2_rrif_acct: 0, p2_rrif_acct_ret: 5.0,
    p2_nonreg: 0, p2_nonreg_acb: 0, p2_nonreg_ret: 5.0, p2_nonreg_yield: 2.0,
    p2_crypto: 0, p2_crypto_acb: 0, p2_crypto_ret: 8.0,
    p2_cpp_enabled: true, p2_cpp_est_base: 10000, p2_cpp_start: 65,
    p2_oas_enabled: true, p2_oas_years: 40, p2_oas_start: 65,

    // Global Defaults
    inflation_rate: 2.1, tax_province: 'ON',
    cfg_tfsa_limit: 7000, cfg_rrsp_limit: 32960, cfg_fhsa_limit: 8000, 
    cfg_resp_limit: 2500, cfg_crypto_limit: 5000,
    
    // Engine Features
    portfolio_allocation: 'custom', 
    use_glide_path: false,
    fully_optimize_tax: false, 
    oas_clawback_optimize: false, 
    rrsp_meltdown_enabled: false,
    enable_guardrails: false,
    
    skip_first_tfsa_p1: false, skip_first_rrsp_p1: false,
    skip_first_tfsa_p2: false, skip_first_rrsp_p2: false,
    exp_gogo_age: 75, exp_slow_age: 85,
    pension_split_enabled: false
  },
  properties: [
    {
        name: 'Primary Residence',
        value: 700000,
        mortgage: 350000,
        rate: 4.5,
        payment: 1945, // roughly 25-yr ammortization
        growth: 3.0,
        includeInNW: true,
        sellEnabled: false
    }
  ], 
  windfalls: [], additionalIncome: [], leaves: [], dependents: [], debt: [],
  strategies: { 
    accum: ['tfsa', 'rrsp', 'fhsa', 'resp', 'nonreg', 'cash', 'crypto'], 
    decum: ['nonreg', 'cash', 'tfsa', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto'] 
  },
  expensesByCategory: {
    housing: { items: [{ name: 'Property Tax, Insurance & Utilities', curr: 800, ret: 800, trans: 800, gogo: 800, slow: 800, nogo: 800, freq: 12 }] },
    transport: { items: [{ name: 'Vehicle / Insurance / Gas', curr: 800, ret: 600, trans: 700, gogo: 600, slow: 400, nogo: 150, freq: 12 }] },
    lifestyle: { items: [{ name: 'Dining, Travel & Hobbies', curr: 1200, ret: 1800, trans: 1500, gogo: 1800, slow: 800, nogo: 300, freq: 12 }] },
    essentials: { items: [{ name: 'Groceries / Health', curr: 1000, ret: 1000, trans: 1000, gogo: 1000, slow: 1200, nogo: 1500, freq: 12 }] },
    other: { items: [{ name: 'Miscellaneous', curr: 500, ret: 300, trans: 400, gogo: 300, slow: 300, nogo: 300, freq: 12 }] }
  },
  constants: FINANCIAL_CONSTANTS 
};

export const emptyData = {
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
    exp_gogo_age: 75, exp_slow_age: 85, pension_split_enabled: false
  },
  properties: [], windfalls: [], additionalIncome: [], leaves: [], dependents: [], debt: [],
  strategies: { 
    accum: ['tfsa', 'rrsp', 'fhsa', 'resp', 'nonreg', 'cash', 'crypto'], 
    decum: ['nonreg', 'cash', 'tfsa', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto'] 
  },
  expensesByCategory: {
    housing: { items: [] }, transport: { items: [] }, lifestyle: { items: [] }, essentials: { items: [] }, other: { items: [] }
  },
  constants: FINANCIAL_CONSTANTS 
};

// --- LEGACY JSON ADAPTER ---
export const migrateLegacyData = (parsedData: any, baseData: any) => {
    const merged = JSON.parse(JSON.stringify(baseData));
    if (!parsedData) return merged;

    merged.mode = parsedData.mode || (parsedData.inputs?.modeCouple ? 'Couple' : 'Single');
    merged.useRealDollars = parsedData.useRealDollars ?? parsedData.inputs?.useRealDollars ?? false;
    merged.expenseMode = parsedData.expenseMode || (parsedData.inputs?.expense_mode_advanced ? 'Advanced' : 'Simple');

    ['properties', 'windfalls', 'additionalIncome', 'leaves', 'dependents', 'debt'].forEach(arr => {
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

    merged.constants = FINANCIAL_CONSTANTS;
    return merged;
};

// --- ZUSTAND STATE STORE ---
export const useFinanceStore = create<any>((set) => ({
  data: defaultData,
  results: null,
  isCalculating: true,
  setData: (updater: any) => set((state: any) => ({ data: typeof updater === 'function' ? updater(state.data) : updater })),
  setResults: (results: any) => set({ results, isCalculating: false }),
  setIsCalculating: (isCalculating: boolean) => set({ isCalculating })
}));

export function FinanceProvider({ children }: { children: ReactNode }) {
  const data = useFinanceStore(state => state.data);
  const setResults = useFinanceStore(state => state.setResults);
  const setIsCalculating = useFinanceStore(state => state.setIsCalculating);
  const setData = useFinanceStore(state => state.setData);
  const workerRef = useRef<Worker | null>(null);

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

    workerRef.current = new Worker(new URL('./financeWorker.ts', import.meta.url));
    
    workerRef.current.onmessage = (e) => {
      if (e.data.status === 'success') {
        setResults(e.data.results);
      } else {
        console.error("Worker Error:", e.data.error);
        setIsCalculating(false);
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    setIsCalculating(true);
    const timeoutId = setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage({
          data: JSON.parse(JSON.stringify(data)),
          detailed: true
        });
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [data]);

  return <>{children}</>;
}

export function useFinance() {
  const store = useFinanceStore();

  return {
    data: store.data,
    results: store.results,
    isCalculating: store.isCalculating,
    updateInput: (key: string, value: any) => store.setData((prev: any) => ({ ...prev, inputs: { ...prev.inputs, [key]: sanitizeValue(value) } })),
    updateMultipleInputs: (updates: Record<string, any>) => {
       const cleanUpdates: Record<string, any> = {};
       Object.keys(updates).forEach(k => cleanUpdates[k] = sanitizeValue(updates[k]));
       store.setData((prev: any) => ({ ...prev, inputs: { ...prev.inputs, ...cleanUpdates } }));
    },
    updateMode: (newMode: 'Single' | 'Couple') => store.setData((prev: any) => ({ ...prev, mode: newMode })),
    updateUseRealDollars: (val: boolean) => store.setData((prev: any) => ({ ...prev, useRealDollars: val })),
    addArrayItem: (listName: string, defaultObj: any) => store.setData((prev: any) => ({ ...prev, [listName]: [...(prev[listName] || []), defaultObj] })),
    updateArrayItem: (listName: string, index: number, field: string, value: any) => store.setData((prev: any) => {
      const newList = [...(prev[listName] || [])];
      newList[index] = { ...newList[index], [field]: sanitizeValue(value) };
      return { ...prev, [listName]: newList };
    }),
    removeArrayItem: (listName: string, index: number) => store.setData((prev: any) => {
      const newList = [...(prev[listName] || [])];
      newList.splice(index, 1);
      return { ...prev, [listName]: newList };
    }),
    updateStrategy: (type: 'accum' | 'decum', newList: string[]) => store.setData((prev: any) => ({ ...prev, strategies: { ...prev.strategies, [type]: newList } })),
    updateExpenseCategory: (catKey: string, items: any[]) => store.setData((prev: any) => ({
      ...prev,
      expensesByCategory: {
        ...prev.expensesByCategory,
        [catKey]: { items: items.map((item: any) => {
            const cleanItem: any = {};
            Object.keys(item).forEach(k => cleanItem[k] = sanitizeValue(item[k]));
            return cleanItem;
        })}
      }
    })),
    loadData: (newPlanData: any) => store.setData(migrateLegacyData(newPlanData, emptyData)),
    resetData: () => {
      store.setData(emptyData);
      localStorage.removeItem('retirement_plan_data');
    }
  };
}
