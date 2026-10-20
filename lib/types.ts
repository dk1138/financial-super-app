// lib/types.ts

export type RegisteredAccountType = 'tfsa' | 'rrsp' | 'fhsa' | 'resp' | 'lirf' | 'lif' | 'rrif_acct';
export type AccountType = RegisteredAccountType | 'nonreg' | 'cash' | 'crypto';

export interface ExpenseItem {
    name: string;
    curr: number;
    ret: number;
    trans: number;
    gogo: number;
    slow: number;
    nogo: number;
    freq: number;
}

export interface ExpenseCategory {
    items: ExpenseItem[];
}

export interface Property {
    name: string;
    value: number;
    mortgage: number;
    rate: number;
    payment: number;
    growth: number;
    includeInNW: boolean;
    sellEnabled?: boolean;
    sellAge?: number;
    replacementValue?: number;
}

export interface Debt {
    name: string;
    amount: number;
    start: string;
    type?: 'one' | 'monthly' | 'yearly';
    duration?: number;
    rate?: number;
}

export interface Windfall {
    name: string;
    amount: number;
    start: string;
    freq?: 'one' | 'month' | 'year';
    end?: string;
    taxable?: boolean;
}

export interface Dependent {
    name: string;
    dob: string;
}

export interface AdditionalIncome {
    owner: 'p1' | 'p2';
    name: string;
    amount: number;
    freq: 'year' | 'month';
    growth: number;
    startMode: 'date' | 'ret_relative';
    start: string;
    startRelative?: number;
    endMode: 'never' | 'date' | 'ret_relative';
    end?: string;
    endRelative?: number;
    taxable: boolean;
}

export interface CustomAsset {
    owner: 'p1' | 'p2';
    name: string;
    type: AccountType;
    balance: number;
    acb?: number;    // Relevant for nonreg and crypto
    yield?: number;  // Relevant for nonreg and crypto
    rate: number;
    retireRate: number;
}

export interface PlanStrategies {
    accum: string[];
    shortfall: string[];
    decum: string[];
}

export interface PensionSplitTransfer {
    p1ToP2: number;
    p2ToP1: number;
}

export interface PlanData {
    mode: 'Single' | 'Couple';
    useRealDollars: boolean;
    expenseMode: 'Simple' | 'Advanced';
    inputs: Record<string, any>; 
    properties: Property[];
    windfalls: Windfall[];
    additionalIncome: AdditionalIncome[];
    customAssets: CustomAsset[];
    leaves: any[];
    dependents: Dependent[];
    debt: Debt[];
    strategies: PlanStrategies;
    expensesByCategory: Record<string, ExpenseCategory>;
    constants?: any;
    taxCredits?: any; 
}

export interface SimulationDashboard {
    finalNetWorth: number;
    totalTax: number;
    totalInflows?: number;
    totalOutflows?: number;
}

export interface SimulationResult {
    timeline: any[];
    dashboard: SimulationDashboard;
}