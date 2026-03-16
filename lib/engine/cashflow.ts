// lib/engine/cashflow.ts

export function applyPensionSplitting(ti1: number, ti2: number, inflows: any, regMins: any, age1: number, age2: number, applyFn: Function) {
    let p1Eligible = inflows.p1.pension + (age1 >= 65 ? regMins.p1 + regMins.lifTaken1 : 0);
    let p2Eligible = inflows.p2.pension + (age2 >= 65 ? regMins.p2 + regMins.lifTaken2 : 0);

    if (ti1 > ti2 && p1Eligible > 0) {
        let maxTransfer = p1Eligible * 0.50;
        let diff = ti1 - ti2;
        let transfer = Math.min(maxTransfer, diff / 2);
        if (transfer > 0) applyFn(ti1 - transfer, ti2 + transfer, transfer, 'p1_to_p2');
    } else if (ti2 > ti1 && p2Eligible > 0) {
        let maxTransfer = p2Eligible * 0.50;
        let diff = ti2 - ti1;
        let transfer = Math.min(maxTransfer, diff / 2);
        if (transfer > 0) applyFn(ti1 + transfer, ti2 - transfer, transfer, 'p2_to_p1');
    }
}

export function handleSurplus(
    netSurplus: number, person1: any, person2: any, alive1: boolean, alive2: boolean,
    flowLog: any, yearIndex: number, tfsaLim: number, rrspRoom1: number, rrspRoom2: number,
    cryptoLim: number, fhsaLim1: number, fhsaLim2: number, respLim: number,
    actualDeductions: any, fhsaRooms: any, strategies: any, inputs: any, CONSTANTS: any,
    age1: number, age2: number
) {
    let remaining = netSurplus;
    const accumOrder = strategies?.accum || ['tfsa', 'rrsp', 'fhsa', 'resp', 'nonreg', 'cash', 'crypto'];

    let tfsaRoom1 = alive1 ? tfsaLim + (yearIndex === 0 ? (inputs.p1_tfsa_room || 0) : 0) : 0;
    let tfsaRoom2 = alive2 ? tfsaLim + (yearIndex === 0 ? (inputs.p2_tfsa_room || 0) : 0) : 0;
    if (inputs.skip_first_tfsa_p1 && yearIndex === 0) tfsaRoom1 = 0;
    if (inputs.skip_first_tfsa_p2 && yearIndex === 0) tfsaRoom2 = 0;

    for (const acct of accumOrder) {
        if (remaining <= 0) break;

        if (acct === 'tfsa') {
            if (alive1 && tfsaRoom1 > 0) { let take = Math.min(remaining, tfsaRoom1); person1.tfsa += take; remaining -= take; tfsaRoom1 -= take; if (flowLog) flowLog.contributions.p1.tfsa += take; }
            if (alive2 && tfsaRoom2 > 0 && remaining > 0) { let take = Math.min(remaining, tfsaRoom2); person2.tfsa += take; remaining -= take; tfsaRoom2 -= take; if (flowLog) flowLog.contributions.p2.tfsa += take; }
        }
        else if (acct === 'rrsp') {
            if (alive1 && rrspRoom1 > 0) { let take = Math.min(remaining, rrspRoom1); person1.rrsp += take; remaining -= take; rrspRoom1 -= take; actualDeductions.p1 += take; if (flowLog) flowLog.contributions.p1.rrsp += take; }
            if (alive2 && rrspRoom2 > 0 && remaining > 0) { let take = Math.min(remaining, rrspRoom2); person2.rrsp += take; remaining -= take; rrspRoom2 -= take; actualDeductions.p2 += take; if (flowLog) flowLog.contributions.p2.rrsp += take; }
        }
        else if (acct === 'fhsa') {
            if (alive1 && fhsaLim1 > 0 && fhsaRooms.p1 > 0) { let take = Math.min(remaining, fhsaLim1, fhsaRooms.p1); person1.fhsa += take; remaining -= take; fhsaLim1 -= take; fhsaRooms.p1 -= take; actualDeductions.p1 += take; if (flowLog) flowLog.contributions.p1.fhsa += take; }
            if (alive2 && fhsaLim2 > 0 && fhsaRooms.p2 > 0 && remaining > 0) { let take = Math.min(remaining, fhsaLim2, fhsaRooms.p2); person2.fhsa += take; remaining -= take; fhsaLim2 -= take; fhsaRooms.p2 -= take; actualDeductions.p2 += take; if (flowLog) flowLog.contributions.p2.fhsa += take; }
        }
        else if (acct === 'resp') {
            let target = respLim;
            if (alive1 && target > 0) { let take = Math.min(remaining, target); person1.resp += take; remaining -= take; target -= take; if (flowLog) flowLog.contributions.p1.resp += take; }
            if (alive2 && target > 0 && remaining > 0) { let take = Math.min(remaining, target); person2.resp += take; remaining -= take; if (flowLog) flowLog.contributions.p2.resp += take; }
        }
        else if (acct === 'crypto') {
            let target = cryptoLim;
            if (alive1 && target > 0) { let take = Math.min(remaining, target); person1.crypto += take; person1.crypto_acb += take; remaining -= take; target -= take; if (flowLog) flowLog.contributions.p1.crypto += take; }
            if (alive2 && target > 0 && remaining > 0) { let take = Math.min(remaining, target); person2.crypto += take; person2.crypto_acb += take; remaining -= take; if (flowLog) flowLog.contributions.p2.crypto += take; }
        }
        else if (acct === 'nonreg') {
            if (alive1) { let take = remaining / (alive2 ? 2 : 1); person1.nonreg += take; person1.acb += take; remaining -= take; if (flowLog) flowLog.contributions.p1.nonreg += take; }
            if (alive2 && remaining > 0) { let take = remaining; person2.nonreg += take; person2.acb += take; remaining -= take; if (flowLog) flowLog.contributions.p2.nonreg += take; }
        }
        else if (acct === 'cash') {
            if (alive1) { let take = remaining / (alive2 ? 2 : 1); person1.cash += take; remaining -= take; if (flowLog) flowLog.contributions.p1.cash += take; }
            if (alive2 && remaining > 0) { let take = remaining; person2.cash += take; remaining -= take; if (flowLog) flowLog.contributions.p2.cash += take; }
        }
    }
}

export function handleDeficit(
    deficit: number, person1: any, person2: any, ti1: number, ti2: number,
    alive1: boolean, alive2: boolean, flowLog: any, wdBreakdown: any,
    taxBrackets: any, addTaxFn: Function, age1: number, age2: number,
    oas1: number, oas2: number, oasThresh: number, lifMaxes: any,
    earned1: number, earned2: number, inflation: number, div1: number, div2: number,
    forceOrder: string[] | null, eligPen1: number, eligPen2: number,
    inputs: any, CONSTANTS: any, province: string, rrifStartAge: number,
    totalExpenses: number = 0
) {
    let remainingDeficit = deficit;
    const decumOrder = forceOrder || inputs.strategies?.decum || ['nonreg', 'cash', 'tfsa', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto'];

    // --- 1. CALCULATE PROTECTED EMERGENCY FUND ---
    let efMode = inputs.emergency_fund_mode || 'none';
    let efCustomAmt = inputs.emergency_fund_custom_amount || 0;
    let protectedCash = 0;

    if (efMode === 'custom') {
        protectedCash = efCustomAmt * inflation; // Inflate custom target to preserve purchasing power
    } else if (efMode === '3_months') {
        protectedCash = (totalExpenses / 12) * 3;
    } else if (efMode === '6_months') {
        protectedCash = (totalExpenses / 12) * 6;
    }

    let householdCash = (alive1 ? person1.cash : 0) + (alive2 ? person2.cash : 0);
    let availableHouseholdCash = Math.max(0, householdCash - protectedCash);

    // --- HELPER FUNCTION: EXECUTE WITHDRAWAL ---
    const executePull = (p: any, prefix: string, acct: string, available: number, isTaxable: boolean, inclusion: number = 1.0, isCash: boolean = false) => {
        if (remainingDeficit <= 0 || available <= 0) return;

        let maxAllowed = available;

        // If pulling from Cash, respect the Emergency Fund boundary
        if (isCash) {
            maxAllowed = Math.min(available, availableHouseholdCash);
            if (maxAllowed <= 0) return; // Protected floor reached
        }

        let pullAmount = 0;
        if (isTaxable) {
            // Rough marginal rate estimation for gross-up (Assuming ~30% for loop math)
            // The engine dynamically recalculates exact tax after the loop completes
            let estMarginal = 0.30;
            let requiredGross = remainingDeficit / (1 - (estMarginal * inclusion));
            pullAmount = Math.min(maxAllowed, requiredGross);
        } else {
            pullAmount = Math.min(maxAllowed, remainingDeficit);
        }

        // Deduct from account
        p[acct] -= pullAmount;
        if (isCash) availableHouseholdCash -= pullAmount;

        // Resolve Deficit
        if (isTaxable) {
            let netReceived = pullAmount * (1 - (0.30 * inclusion)); 
            remainingDeficit -= netReceived;
        } else {
            remainingDeficit -= pullAmount;
        }

        // Handle Capital Gains / ACB Math
        if (wdBreakdown) {
            if (!wdBreakdown[prefix][acct.toUpperCase() + '_math']) wdBreakdown[prefix][acct.toUpperCase() + '_math'] = { wd: 0, tax: 0, acb: 0, gain: 0 };
            wdBreakdown[prefix][acct.toUpperCase() + '_math'].wd += pullAmount;

            if (acct === 'nonreg' || acct === 'crypto') {
                let acbKey = acct === 'crypto' ? 'crypto_acb' : 'acb';
                let currentAcb = p[acbKey] || 0;
                let balBeforePull = available; 
                let gainRatio = balBeforePull > 0 ? Math.max(0, balBeforePull - currentAcb) / balBeforePull : 0;
                
                let acbDisposed = pullAmount * (1 - gainRatio);
                let gain = pullAmount * gainRatio;

                p[acbKey] = Math.max(0, currentAcb - acbDisposed);
                wdBreakdown[prefix][acct.toUpperCase() + '_math'].acb += acbDisposed;
                wdBreakdown[prefix][acct.toUpperCase() + '_math'].gain += gain;
                
                // Actual Taxable Gain (50% Inclusion)
                let taxableGain = gain * 0.5;
                wdBreakdown[prefix][acct.toUpperCase() + '_math'].tax += taxableGain;
                addTaxFn(prefix, taxableGain, 0);

            } else if (isTaxable) {
                wdBreakdown[prefix][acct.toUpperCase() + '_math'].tax += (pullAmount * inclusion);
                addTaxFn(prefix, pullAmount * inclusion, 0);
            } else if (isCash) {
                addTaxFn(prefix, 0, pullAmount);
            }
        }

        // Logging
        if (flowLog) {
            flowLog.withdrawals[`${prefix.toUpperCase()} ${acct.toUpperCase()}`] = (flowLog.withdrawals[`${prefix.toUpperCase()} ${acct.toUpperCase()}`] || 0) + pullAmount;
        }
    };

    // --- 2. MAIN WITHDRAWAL LOOP ---
    for (const acct of decumOrder) {
        if (remainingDeficit <= 0) break;

        if (alive1) {
            let isTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(acct);
            let inclusion = ['nonreg', 'crypto'].includes(acct) ? 0.5 : 1.0;
            let isCash = acct === 'cash';
            let bal = person1[acct] || 0;
            executePull(person1, 'p1', acct, bal, isTaxable, inclusion, isCash);
        }

        if (alive2 && remainingDeficit > 0) {
            let isTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(acct);
            let inclusion = ['nonreg', 'crypto'].includes(acct) ? 0.5 : 1.0;
            let isCash = acct === 'cash';
            let bal = person2[acct] || 0;
            executePull(person2, 'p2', acct, bal, isTaxable, inclusion, isCash);
        }
    }

    // --- 3. BREAK THE GLASS PROTOCOL (Failsafe) ---
    // If we still have a deficit, and there is protected cash sitting in the Emergency Fund, 
    // we must spend it to survive and prevent the simulation from prematurely failing.
    if (remainingDeficit > 0 && protectedCash > 0) {
        let p1RemainingCash = alive1 ? person1.cash : 0;
        let p2RemainingCash = alive2 ? person2.cash : 0;

        if (p1RemainingCash > 0) {
            // Bypass the lock by setting available Household cash to Infinity
            availableHouseholdCash = Infinity;
            executePull(person1, 'p1', 'cash', p1RemainingCash, false, 1.0, true);
        }
        if (p2RemainingCash > 0 && remainingDeficit > 0) {
            availableHouseholdCash = Infinity;
            executePull(person2, 'p2', 'cash', p2RemainingCash, false, 1.0, true);
        }
    }
}