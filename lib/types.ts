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
    type: 'tfsa' | 'rrsp' | 'fhsa' | 'nonreg' | 'cash' | 'crypto' | 'lirf' | 'lif' | 'rrif_acct' | 'resp';
    balance: number;
    acb?: number; // Only relevant for nonreg and crypto
    yield?: number; // Only relevant for nonreg and crypto
    rate: number;
    retireRate: number;
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
    strategies: {
        accum: string[];
        decum: string[];
    };
    expensesByCategory: Record<string, ExpenseCategory>;
    constants?: any;
    taxCredits?: any; // Used to provide explicit inputs for specific tax credits dynamically applied
}

export interface SimulationDashboard {
    finalNetWorth: number;
    totalTax: number;
}

export interface SimulationResult {
    timeline: any[];
    dashboard: SimulationDashboard;
}