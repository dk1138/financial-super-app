export function applyPensionSplitting(ti1: number, ti2: number, inflows: any, regMins: any, age1: number, age2: number, applyFn: Function) {
    // 1. Calculate how much eligible pension income each person already has
    let p1Eligible = inflows.p1.pension + (age1 >= 65 ? regMins.p1 + regMins.lifTaken1 : 0);
    let p2Eligible = inflows.p2.pension + (age2 >= 65 ? regMins.p2 + regMins.lifTaken2 : 0);

    // If P1 makes more (or exactly the same) and has eligible pension to share
    if (ti1 >= ti2 && p1Eligible > 0) {
        let maxTransfer = p1Eligible * 0.50; // CRA limit is 50%
        let diff = ti1 - ti2;
        let transferToEqualize = diff / 2; // Mathematical optimal for marginal rates
        
        // TAX CREDIT OPTIMIZATION: If P2 has less than $2,000 in eligible pension, 
        // force a transfer to max out their Non-Refundable Pension Tax Credit!
        let p2Shortfall = Math.max(0, 2000 - p2Eligible);
        let optimalTransfer = Math.max(transferToEqualize, p2Shortfall);
        
        let transfer = Math.min(maxTransfer, optimalTransfer);
        if (transfer > 0) applyFn(ti1 - transfer, ti2 + transfer, transfer, 'p1_to_p2');
        
    // If P2 makes more (or exactly the same) and has eligible pension to share
    } else if (ti2 >= ti1 && p2Eligible > 0) {
        let maxTransfer = p2Eligible * 0.50; // CRA limit is 50%
        let diff = ti2 - ti1;
        let transferToEqualize = diff / 2; // Mathematical optimal for marginal rates
        
        // TAX CREDIT OPTIMIZATION: If P1 has less than $2,000 in eligible pension, 
        // force a transfer to max out their Non-Refundable Pension Tax Credit!
        let p1Shortfall = Math.max(0, 2000 - p1Eligible);
        let optimalTransfer = Math.max(transferToEqualize, p1Shortfall);

        let transfer = Math.min(maxTransfer, optimalTransfer);
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

    // --- TRACK ANNUAL CUSTOM ACCOUNT CONTRIBUTIONS ---
    let annualContributed = {
        tfsa: 0,
        rrsp: 0,
        fhsa: 0,
        resp: 0,
        nonreg: 0,
        cash: 0,
        crypto: 0
    };

    // Extract self-imposed limits from inputs (0 or undefined means unlimited)
    const maxAnnualTfsa = inputs.max_annual_tfsa || 0;
    const maxAnnualRrsp = inputs.max_annual_rrsp || 0;
    const maxAnnualFhsa = inputs.max_annual_fhsa || 0;
    const maxAnnualNonreg = inputs.max_annual_nonreg || 0;
    const maxAnnualCash = inputs.max_annual_cash || 0;
    const maxAnnualCrypto = inputs.max_annual_crypto || 0;

    for (const acct of accumOrder) {
        if (remaining <= 0) break;

        if (acct === 'tfsa') {
            let allowedTFSA = maxAnnualTfsa === 0 ? Infinity : Math.max(0, maxAnnualTfsa - annualContributed.tfsa);
            if (allowedTFSA > 0) {
                if (alive1 && tfsaRoom1 > 0) { 
                    let take = Math.min(remaining, tfsaRoom1, allowedTFSA); 
                    person1.tfsa += take; 
                    remaining -= take; 
                    tfsaRoom1 -= take; 
                    allowedTFSA -= take;
                    annualContributed.tfsa += take;
                    if (flowLog) flowLog.contributions.p1.tfsa = (flowLog.contributions.p1.tfsa || 0) + take; 
                }
                if (alive2 && tfsaRoom2 > 0 && remaining > 0 && allowedTFSA > 0) { 
                    let take = Math.min(remaining, tfsaRoom2, allowedTFSA); 
                    person2.tfsa += take; 
                    remaining -= take; 
                    tfsaRoom2 -= take; 
                    annualContributed.tfsa += take;
                    if (flowLog) flowLog.contributions.p2.tfsa = (flowLog.contributions.p2.tfsa || 0) + take; 
                }
            }
        }
        else if (acct === 'rrsp') {
            let allowedRRSP = maxAnnualRrsp === 0 ? Infinity : Math.max(0, maxAnnualRrsp - annualContributed.rrsp);
            if (allowedRRSP > 0) {
                if (alive1 && rrspRoom1 > 0) { 
                    let take = Math.min(remaining, rrspRoom1, allowedRRSP); 
                    person1.rrsp += take; 
                    remaining -= take; 
                    rrspRoom1 -= take; 
                    allowedRRSP -= take;
                    actualDeductions.p1 += take; 
                    annualContributed.rrsp += take;
                    if (flowLog) flowLog.contributions.p1.rrsp = (flowLog.contributions.p1.rrsp || 0) + take; 
                }
                if (alive2 && rrspRoom2 > 0 && remaining > 0 && allowedRRSP > 0) { 
                    let take = Math.min(remaining, rrspRoom2, allowedRRSP); 
                    person2.rrsp += take; 
                    remaining -= take; 
                    rrspRoom2 -= take; 
                    actualDeductions.p2 += take; 
                    annualContributed.rrsp += take;
                    if (flowLog) flowLog.contributions.p2.rrsp = (flowLog.contributions.p2.rrsp || 0) + take; 
                }
            }
        }
        else if (acct === 'fhsa') {
            let allowedFHSA = maxAnnualFhsa === 0 ? Infinity : Math.max(0, maxAnnualFhsa - annualContributed.fhsa);
            if (allowedFHSA > 0) {
                if (alive1 && fhsaLim1 > 0 && fhsaRooms.p1 > 0) { 
                    let take = Math.min(remaining, fhsaLim1, fhsaRooms.p1, allowedFHSA); 
                    person1.fhsa += take; 
                    remaining -= take; 
                    fhsaLim1 -= take; 
                    fhsaRooms.p1 -= take; 
                    allowedFHSA -= take;
                    actualDeductions.p1 += take; 
                    annualContributed.fhsa += take;
                    if (flowLog) flowLog.contributions.p1.fhsa = (flowLog.contributions.p1.fhsa || 0) + take; 
                }
                if (alive2 && fhsaLim2 > 0 && fhsaRooms.p2 > 0 && remaining > 0 && allowedFHSA > 0) { 
                    let take = Math.min(remaining, fhsaLim2, fhsaRooms.p2, allowedFHSA); 
                    person2.fhsa += take; 
                    remaining -= take; 
                    fhsaLim2 -= take; 
                    fhsaRooms.p2 -= take; 
                    actualDeductions.p2 += take; 
                    annualContributed.fhsa += take;
                    if (flowLog) flowLog.contributions.p2.fhsa = (flowLog.contributions.p2.fhsa || 0) + take; 
                }
            }
        }
        else if (acct === 'resp') {
            // RESP does not have a separate max_annual view; uses native target config limits
            let target = respLim;
            if (alive1 && target > 0) { let take = Math.min(remaining, target); person1.resp += take; remaining -= take; target -= take; if (flowLog) flowLog.contributions.p1.resp = (flowLog.contributions.p1.resp || 0) + take; }
            if (alive2 && target > 0 && remaining > 0) { let take = Math.min(remaining, target); person2.resp += take; remaining -= take; if (flowLog) flowLog.contributions.p2.resp = (flowLog.contributions.p2.resp || 0) + take; }
        }
        else if (acct === 'crypto') {
            let allowedCrypto = maxAnnualCrypto === 0 ? cryptoLim : Math.min(cryptoLim, Math.max(0, maxAnnualCrypto - annualContributed.crypto));
            if (allowedCrypto > 0) {
                if (alive1 && allowedCrypto > 0) { 
                    let take = Math.min(remaining, allowedCrypto); 
                    person1.crypto += take; 
                    person1.crypto_acb += take; 
                    remaining -= take; 
                    allowedCrypto -= take; 
                    annualContributed.crypto += take;
                    if (flowLog) flowLog.contributions.p1.crypto = (flowLog.contributions.p1.crypto || 0) + take; 
                }
                if (alive2 && allowedCrypto > 0 && remaining > 0) { 
                    let take = Math.min(remaining, allowedCrypto); 
                    person2.crypto += take; 
                    person2.crypto_acb += take; 
                    remaining -= take; 
                    annualContributed.crypto += take;
                    if (flowLog) flowLog.contributions.p2.crypto = (flowLog.contributions.p2.crypto || 0) + take; 
                }
            }
        }
        else if (acct === 'nonreg') {
            let allowedNonReg = maxAnnualNonreg === 0 ? Infinity : Math.max(0, maxAnnualNonreg - annualContributed.nonreg);
            if (allowedNonReg > 0) {
                if (alive1) { 
                    let take = Math.min(remaining / (alive2 ? 2 : 1), allowedNonReg / (alive2 ? 2 : 1)); 
                    person1.nonreg += take; 
                    person1.acb += take; 
                    remaining -= take; 
                    allowedNonReg -= take;
                    annualContributed.nonreg += take;
                    if (flowLog) flowLog.contributions.p1.nonreg = (flowLog.contributions.p1.nonreg || 0) + take; 
                }
                if (alive2 && remaining > 0 && allowedNonReg > 0) { 
                    let take = Math.min(remaining, allowedNonReg); 
                    person2.nonreg += take; 
                    person2.acb += take; 
                    remaining -= take; 
                    annualContributed.nonreg += take;
                    if (flowLog) flowLog.contributions.p2.nonreg = (flowLog.contributions.p2.nonreg || 0) + take; 
                }
            }
        }
        else if (acct === 'cash') {
            let allowedCash = maxAnnualCash === 0 ? Infinity : Math.max(0, maxAnnualCash - annualContributed.cash);
            if (allowedCash > 0) {
                if (alive1) { 
                    let take = Math.min(remaining / (alive2 ? 2 : 1), allowedCash / (alive2 ? 2 : 1)); 
                    person1.cash += take; 
                    remaining -= take; 
                    allowedCash -= take;
                    annualContributed.cash += take;
                    if (flowLog) flowLog.contributions.p1.cash = (flowLog.contributions.p1.cash || 0) + take; 
                }
                if (alive2 && remaining > 0 && allowedCash > 0) { 
                    let take = Math.min(remaining, allowedCash); 
                    person2.cash += take; 
                    remaining -= take; 
                    annualContributed.cash += take;
                    if (flowLog) flowLog.contributions.p2.cash = (flowLog.contributions.p2.cash || 0) + take; 
                }
            }
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
    
    // Ensure we have a valid order to pull from
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
    const executePull = (p: any, prefix: string, acct: string) => {
        if (remainingDeficit <= 0) return;
        
        let accountBalance = p[acct] || 0;
        if (accountBalance <= 0) return;

        let maxAllowed = accountBalance;

        // If pulling from Cash, respect the Emergency Fund boundary
        if (acct === 'cash') {
            maxAllowed = Math.min(accountBalance, availableHouseholdCash);
            if (maxAllowed <= 0) return; // Protected floor reached
        }
        
        let isTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(acct);
        let isCapitalGain = ['nonreg', 'crypto'].includes(acct);
        
        let pullAmount = 0;
        
        if (isTaxable && !isCapitalGain) {
            // Gross up the withdrawal by 20% to account for estimated tax withholding.
            let requiredGross = remainingDeficit / 0.80; 
            pullAmount = Math.min(maxAllowed, requiredGross);
            remainingDeficit -= (pullAmount * 0.80);
        } else {
            pullAmount = Math.min(maxAllowed, remainingDeficit);
            remainingDeficit -= pullAmount;
        }

        // Deduct from account
        p[acct] -= pullAmount;
        if (acct === 'cash') availableHouseholdCash -= pullAmount;

        // Map account names for UI compatibility
        let logKey = acct;
        if (acct === 'nonreg') logKey = 'Non-Reg';
        else if (acct === 'crypto') logKey = 'Crypto';
        else if (acct === 'cash') logKey = 'Cash';
        else if (acct === 'rrif_acct') logKey = 'RRIF';
        else logKey = acct.toUpperCase();

        // Handle Logging and ACB / Tax Math
        if (flowLog) {
            flowLog.withdrawals[`${prefix.toUpperCase()} ${logKey}`] = (flowLog.withdrawals[`${prefix.toUpperCase()} ${logKey}`] || 0) + pullAmount;
        }
        
        if (wdBreakdown) {
            if (!wdBreakdown[prefix]) wdBreakdown[prefix] = {};
            if (!wdBreakdown[prefix][logKey + '_math']) {
                wdBreakdown[prefix][logKey + '_math'] = { wd: 0, tax: 0, acb: 0, gain: 0 };
            }
            
            wdBreakdown[prefix][logKey + '_math'].wd += pullAmount;

            if (isCapitalGain) {
                let acbKey = acct === 'crypto' ? 'crypto_acb' : 'acb';
                let currentAcb = p[acbKey] || 0;
                let balBeforePull = accountBalance; 
                let gainRatio = balBeforePull > 0 ? Math.max(0, balBeforePull - currentAcb) / balBeforePull : 0;
                
                let acbDisposed = pullAmount * (1 - gainRatio);
                let gain = pullAmount * gainRatio;

                p[acbKey] = Math.max(0, currentAcb - acbDisposed);
                wdBreakdown[prefix][logKey + '_math'].acb += acbDisposed;
                wdBreakdown[prefix][logKey + '_math'].gain += gain;
                
                let taxableGain = gain * 0.5;
                wdBreakdown[prefix][logKey + '_math'].tax += taxableGain;
                addTaxFn(prefix, taxableGain, pullAmount); 

            } else if (isTaxable) {
                wdBreakdown[prefix][logKey + '_math'].tax += pullAmount;
                addTaxFn(prefix, pullAmount, pullAmount); 
            } else {
                addTaxFn(prefix, 0, pullAmount); 
            }
        }
    };

    // --- 2. MAIN WITHDRAWAL LOOP ---
    for (const acct of decumOrder) {
        if (remainingDeficit <= 0) break;

        if (alive1) {
            executePull(person1, 'p1', acct);
        }

        if (alive2 && remainingDeficit > 0) {
            executePull(person2, 'p2', acct);
        }
    }

    // --- 3. BREAK THE GLASS PROTOCOL (Failsafe) ---
    if (remainingDeficit > 0 && protectedCash > 0) {
        let p1RemainingCash = alive1 ? person1.cash : 0;
        let p2RemainingCash = alive2 ? person2.cash : 0;

        if (p1RemainingCash > 0) {
            availableHouseholdCash = Infinity;
            executePull(person1, 'p1', 'cash');
        }
        if (p2RemainingCash > 0 && remainingDeficit > 0) {
            availableHouseholdCash = Infinity;
            executePull(person2, 'p2', 'cash');
        }
    }
}