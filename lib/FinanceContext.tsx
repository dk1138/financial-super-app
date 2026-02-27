'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FinanceEngine } from './financeEngine';
import { FINANCIAL_CONSTANTS } from './config';

interface FinanceContextType {
  data: any;             
  results: any;          
  updateInput: (key: string, value: any) => void;
  addArrayItem: (listName: string, defaultObj: any) => void;
  updateArrayItem: (listName: string, index: number, field: string, value: any) => void;
  removeArrayItem: (listName: string, index: number) => void;
  updateStrategy: (type: 'accum' | 'decum', newList: string[]) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const defaultData = {
  mode: 'Couple',
  expenseMode: 'Simple',
  inputs: {
    // Player 1 Defaults
    p1_age: 38, p1_retireAge: 60, p1_lifeExp: 90,
    p1_income: 95000, p1_income_growth: 2.0, p1_rrsp_match: 0.0, p1_rrsp_match_tier: 100,
    p1_cash: 20000, p1_cash_ret: 2.0,
    p1_tfsa: 52000, p1_tfsa_ret: 6.0,
    p1_fhsa: 0, p1_fhsa_ret: 6.0,
    p1_rrsp: 85000, p1_rrsp_ret: 6.0,
    p1_resp: 0, p1_resp_ret: 6.0,
    p1_lirf: 0, p1_lirf_ret: 6.0,
    p1_lif: 0, p1_lif_ret: 5.0,
    p1_rrif_acct: 0, p1_rrif_acct_ret: 5.0,
    p1_nonreg: 10000, p1_nonreg_acb: 10000, p1_nonreg_ret: 5.0, p1_nonreg_yield: 2.0,
    p1_crypto: 5000, p1_crypto_acb: 5000, p1_crypto_ret: 8.0,
    p1_cpp_est_base: 10000, p1_cpp_start: 65,
    p1_oas_years: 40, p1_oas_start: 65,

    // Player 2 Defaults
    p2_age: 34, p2_retireAge: 60, p2_lifeExp: 95,
    p2_income: 70000, p2_income_growth: 2.0, p2_rrsp_match: 0.0, p2_rrsp_match_tier: 100,
    p2_cash: 15000, p2_cash_ret: 2.0,
    p2_tfsa: 35000, p2_tfsa_ret: 6.0,
    p2_fhsa: 0, p2_fhsa_ret: 6.0,
    p2_rrsp: 42000, p2_rrsp_ret: 6.0,
    p2_resp: 0, p2_resp_ret: 6.0,
    p2_lirf: 0, p2_lirf_ret: 6.0,
    p2_lif: 0, p2_lif_ret: 5.0,
    p2_rrif_acct: 0, p2_rrif_acct_ret: 5.0,
    p2_nonreg: 5000, p2_nonreg_acb: 5000, p2_nonreg_ret: 5.0, p2_nonreg_yield: 2.0,
    p2_crypto: 2000, p2_crypto_acb: 2000, p2_crypto_ret: 8.0,
    p2_cpp_est_base: 10000, p2_cpp_start: 65,
    p2_oas_years: 40, p2_oas_start: 65,

    // Global Defaults
    inflation_rate: 2.1, tax_province: 'ON',
    cfg_tfsa_limit: 7000, cfg_rrsp_limit: 32960, cfg_fhsa_limit: 8000, 
    cfg_resp_limit: 2500, cfg_crypto_limit: 5000,
    fully_optimize_tax: false, oas_clawback_optimize: false,
    skip_first_tfsa_p1: false, skip_first_rrsp_p1: false,
    skip_first_tfsa_p2: false, skip_first_rrsp_p2: false,
    exp_gogo_age: 75, exp_slow_age: 85
  },
  properties: [],
  windfalls: [],
  additionalIncome: [],
  leaves: [],
  dependents: [],
  debt: [],
  strategies: { 
    accum: ['tfsa', 'rrsp', 'fhsa', 'resp', 'nreg', 'cash', 'crypto'], 
    decum: ['nreg', 'cash', 'tfsa', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto'] 
  },
  
  // THE FULL RESTORED CATEGORY OBJECT
  expensesByCategory: {
    housing: { items: [{ name: 'Rent / Mortgage', curr: 2500, ret: 1500, freq: 12 }] },
    transport: { items: [{ name: 'Vehicle / Insurance', curr: 500, ret: 250, freq: 12 }] },
    lifestyle: { items: [{ name: 'Travel & Hobbies', curr: 400, ret: 1000, freq: 12 }] },
    essentials: { items: [{ name: 'Groceries / Health', curr: 800, ret: 800, freq: 12 }] },
    other: { items: [{ name: 'Miscellaneous', curr: 200, ret: 200, freq: 12 }] }
  },
  
  constants: FINANCIAL_CONSTANTS 
};

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(defaultData);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    try {
      const engine = new FinanceEngine(data);
      const simulation = engine.runSimulation(true, null);
      const finalYear = simulation[simulation.length - 1];
      
      setResults({
        timeline: simulation,
        dashboard: {
          finalNetWorth: finalYear ? finalYear.liquidNW + finalYear.reIncludedEq : 0,
          totalTax: simulation.reduce((sum: number, year: any) => sum + year.taxP1 + (year.taxP2 || 0), 0)
        }
      });
    } catch (err) { 
      console.error("Simulation failed:", err); 
    }
  }, [data]); 

  const updateInput = (key: string, value: any) => setData(prev => ({ ...prev, inputs: { ...prev.inputs, [key]: value } }));
  const addArrayItem = (listName: string, defaultObj: any) => setData(prev => ({ ...prev, [listName]: [...prev[listName as keyof typeof prev], defaultObj] }));
  const updateArrayItem = (listName: string, index: number, field: string, value: any) => setData(prev => { 
    const newList = [...prev[listName as keyof typeof prev]];
    newList[index] = { ...newList[index], [field]: value };
    return { ...prev, [listName]: newList };
  });
  const removeArrayItem = (listName: string, index: number) => setData(prev => { 
    const newList = [...prev[listName as keyof typeof prev]];
    newList.splice(index, 1);
    return { ...prev, [listName]: newList };
  });
  const updateStrategy = (type: 'accum' | 'decum', newList: string[]) => setData(prev => ({ ...prev, strategies: { ...prev.strategies, [type]: newList } }));

  return (
    <FinanceContext.Provider value={{ data, results, updateInput, addArrayItem, updateArrayItem, removeArrayItem, updateStrategy }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}