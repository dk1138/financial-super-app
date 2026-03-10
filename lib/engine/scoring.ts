// lib/engine/scoring.ts

export interface ScoreBreakdown {
    totalScore: number;
    retirementReadiness: number; // out of 50
    debtHealth: number;          // out of 20
    savingsRate: number;         // out of 20
    emergencyFund: number;       // out of 10
}

export function calculatePlanScore(data: any, timeline: any[]): ScoreBreakdown {
    let score = { totalScore: 0, retirementReadiness: 0, debtHealth: 0, savingsRate: 0, emergencyFund: 0 };
    if (!timeline || timeline.length === 0) return score;

    const year0 = timeline[0];
    const inflation = (data.inputs.inflation_rate || 2.1) / 100;
    
    // 1. Emergency Fund (Max 10 points) - Targets 6 months of expenses
    const annualExpenses = (year0.expenses || 0) + (year0.mortgagePay || 0) + (year0.debtRepayment || 0);
    const monthlyExpenses = annualExpenses / 12;
    const liquidCash = (year0.assetsP1?.cash || 0) + (data.mode === 'Couple' ? (year0.assetsP2?.cash || 0) : 0) + 
                       (year0.assetsP1?.tfsa || 0) + (data.mode === 'Couple' ? (year0.assetsP2?.tfsa || 0) : 0);
    const monthsCovered = monthlyExpenses > 0 ? liquidCash / monthlyExpenses : 12;
    score.emergencyFund = Math.min(10, Math.max(0, (monthsCovered / 6) * 10));

    // 2. Savings Rate (Max 20 points) - Targets 20%+ savings rate of gross flow
    let contsRaw = Object.values(year0.flows?.contributions?.p1 || {}).reduce((a: any, b: any) => a + b, 0) as number;
    if (data.mode === 'Couple') contsRaw += Object.values(year0.flows?.contributions?.p2 || {}).reduce((a: any, b: any) => a + b, 0) as number;
    const grossInflow = year0.grossInflow || 1;
    const savingsRateVal = contsRaw / grossInflow;
    score.savingsRate = Math.min(20, Math.max(0, (savingsRateVal / 0.20) * 20));

    // 3. Debt Health (Max 20 points) - Targets < 36% DTI (Debt to Income ratio)
    const debtPayments = (year0.mortgagePay || 0) + (year0.debtRepayment || 0);
    const dti = debtPayments / grossInflow;
    if (dti <= 0.20) score.debtHealth = 20;
    else if (dti <= 0.36) score.debtHealth = 20 - ((dti - 0.20) / 0.16) * 10;
    else score.debtHealth = Math.max(0, 10 - ((dti - 0.36) / 0.14) * 10);

    // 4. Retirement Readiness (Max 50 points) - Using the FI percentage and checking for shortfalls
    const failed = timeline.some(y => y.liquidNW <= 0 && y.p1Age >= data.inputs.p1_retireAge);
    if (failed) {
        score.retirementReadiness = 0;
    } else {
        const firstRetYearObj = timeline.find((y: any) => y.p1Age >= data.inputs.p1_retireAge) || timeline[timeline.length - 1];
        const firstRetNominalSpend = (firstRetYearObj.expenses || 0) + (firstRetYearObj.mortgagePay || 0);
        const yearsToRet = Math.max(0, firstRetYearObj.year - year0.year);
        const firstRetRealSpend = firstRetNominalSpend / Math.pow(1 + inflation, yearsToRet);
        const fiTarget = firstRetRealSpend * 25;
        const fiPercent = fiTarget > 0 ? year0.liquidNW / fiTarget : 1;
        // Base 30 for surviving, up to 20 for FI trajectory
        score.retirementReadiness = 30 + Math.min(20, fiPercent * 20);
    }

    // Final Rounding
    score.totalScore = Math.round(score.emergencyFund + score.savingsRate + score.debtHealth + score.retirementReadiness);
    score.emergencyFund = Math.round(score.emergencyFund);
    score.savingsRate = Math.round(score.savingsRate);
    score.debtHealth = Math.round(score.debtHealth);
    score.retirementReadiness = Math.round(score.retirementReadiness);

    return score;
}