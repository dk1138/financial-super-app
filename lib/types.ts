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
}

export interface Debt {
    name: string;
    amount: number;
    start: string;
}

export interface Windfall {
    name: string;
    amount: number;
    start: string;
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

export interface PlanData {
    mode: 'Single' | 'Couple';
    useRealDollars: boolean;
    expenseMode: 'Simple' | 'Advanced';
    inputs: Record<string, any>; // Flexible map for simple inputs
    properties: Property[];
    windfalls: Windfall[];
    additionalIncome: AdditionalIncome[];
    leaves: any[];
    dependents: Dependent[];
    debt: Debt[];
    strategies: {
        accum: string[];
        decum: string[];
    };
    expensesByCategory: Record<string, ExpenseCategory>;
    constants?: any;
}

export interface SimulationDashboard {
    finalNetWorth: number;
    totalTax: number;
}

export interface SimulationResult {
    timeline: any[];
    dashboard: SimulationDashboard;
}