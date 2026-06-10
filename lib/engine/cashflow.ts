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
    age1: number, age2: number,
    options?: { 
        blockRRSPContributionsP1?: boolean; 
        blockRRSPContributionsP2?: boolean;
        isRet1?: boolean;
        isRet2?: boolean;
        p1MatchRate?: number;
        p1Tier?: number;
        p2MatchRate?: number;
        p2Tier?: number;
        inflowsReference?: any;
        matchTracking?: any;
    }
): number {
    let remaining = netSurplus;
    const accumOrder = strategies?.accum || ['tfsa', 'rrsp', 'fhsa', 'spending_cash', 'resp', 'nonreg', 'cash', 'crypto'];

    let tfsaRoom1 = alive1 ? tfsaLim + (yearIndex === 0 ? (inputs.p1_tfsa_room || 0) : 0) : 0;
    let tfsaRoom2 = alive2 ? tfsaLim + (yearIndex === 0 ? (inputs.p2_tfsa_room || 0) : 0) : 0;
    if (inputs.skip_first_tfsa_p1 && yearIndex === 0) tfsaRoom1 = 0;
    if (inputs.skip_first_tfsa_p2 && yearIndex === 0) tfsaRoom2 = 0;

    // Compounding inflation builder to scale custom flat dollar limits over the timeline
    const baseInflation = Math.pow(1 + (inputs.inflation_rate || 2.1) / 100, yearIndex);

    // --- TRACK INDIVIDUAL & SHARED ANNUAL CONTRIBUTIONS ---
    let annualContributed = {
        p1: { tfsa: 0, rrsp: 0, fhsa: 0, nonreg: 0, cash: 0, crypto: 0 },
        p2: { tfsa: 0, rrsp: 0, fhsa: 0, nonreg: 0, cash: 0, crypto: 0 },
        shared: { tfsa: 0, rrsp: 0, fhsa: 0, nonreg: 0, cash: 0, crypto: 0 }
    };

    const isSplit = inputs.split_annual_limits ?? false;

    // Extract dynamic limits per user or fallback to standard shared settings
    const maxLimits = {
        p1: {
            tfsa: isSplit ? (inputs.max_annual_tfsa_p1 || 0) : (inputs.max_annual_tfsa || 0),
            rrsp: isSplit ? (inputs.max_annual_rrsp_p1 || 0) : (inputs.max_annual_rrsp || 0),
            fhsa: isSplit ? (inputs.max_annual_fhsa_p1 || 0) : (inputs.max_annual_fhsa || 0),
            nonreg: isSplit ? (inputs.max_annual_nonreg_p1 || 0) : (inputs.max_annual_nonreg || 0),
            cash: isSplit ? (inputs.max_annual_cash_p1 || 0) : (inputs.max_annual_cash || 0),
            crypto: isSplit ? (inputs.max_annual_crypto_p1 || 0) : (inputs.max_annual_crypto || 0)
        },
        p2: {
            tfsa: isSplit ? (inputs.max_annual_tfsa_p2 || 0) : (inputs.max_annual_tfsa || 0),
            rrsp: isSplit ? (inputs.max_annual_rrsp_p2 || 0) : (inputs.max_annual_rrsp || 0),
            fhsa: isSplit ? (inputs.max_annual_fhsa_p2 || 0) : (inputs.max_annual_fhsa || 0),
            nonreg: isSplit ? (inputs.max_annual_nonreg_p2 || 0) : (inputs.max_annual_nonreg || 0),
            cash: isSplit ? (inputs.max_annual_cash_p2 || 0) : (inputs.max_annual_cash || 0),
            crypto: isSplit ? (inputs.max_annual_crypto_p2 || 0) : (inputs.max_annual_crypto || 0)
        }
    };

    for (const acct of accumOrder) {
        if (remaining <= 0) break;

        // --- DISCRETIONARY LIFESTYLE SPENDING CASH CONTAINER ---
        if (acct === 'spending_cash') {
            let maxSpendingAllowed = Number(inputs.max_annual_spending_cash || 0);
            
            // Check all potential system location variants for Today's Dollars configuration toggle
            const useRealDollars = Boolean(
                inputs.useRealDollars === true || 
                inputs.todays_dollars === true || 
                inputs.use_real_dollars === true
            );

            if (!useRealDollars) {
                maxSpendingAllowed *= baseInflation;
            }

            if (maxSpendingAllowed > 0) {
                let actualSpent = Math.min(remaining, maxSpendingAllowed);
                remaining -= actualSpent;

                if (flowLog) {
                    if (!flowLog.contributions.shared) flowLog.contributions.shared = {};
                    flowLog.contributions.shared.spending_cash = (flowLog.contributions.shared.spending_cash || 0) + actualSpent;
                }
            }
            continue;
        }

        // --- TAX-FREE SAVINGS ACCOUNT (TFSA) ---
        if (acct === 'tfsa') {
            if (alive1 && tfsaRoom1 > 0) { 
                let allowed = isSplit 
                    ? (maxLimits.p1.tfsa === 0 ? Infinity : Math.max(0, maxLimits.p1.tfsa - annualContributed.p1.tfsa))
                    : (maxLimits.p1.tfsa === 0 ? Infinity : Math.max(0, maxLimits.p1.tfsa - annualContributed.shared.tfsa));
                
                if (allowed > 0) {
                    let take = Math.min(remaining, tfsaRoom1, allowed); 
                    person1.tfsa += take; remaining -= take; tfsaRoom1 -= take; 
                    annualContributed.p1.tfsa += take; annualContributed.shared.tfsa += take;
                    if (flowLog) flowLog.contributions.p1.tfsa = (flowLog.contributions.p1.tfsa || 0) + take;
                }
            }
            if (alive2 && tfsaRoom2 > 0 && remaining > 0) { 
                let allowed = isSplit 
                    ? (maxLimits.p2.tfsa === 0 ? Infinity : Math.max(0, maxLimits.p2.tfsa - annualContributed.p2.tfsa))
                    : (maxLimits.p2.tfsa === 0 ? Infinity : Math.max(0, maxLimits.p2.tfsa - annualContributed.shared.tfsa));

                if (allowed > 0) {
                    let take = Math.min(remaining, tfsaRoom2, allowed); 
                    person2.tfsa += take; remaining -= take; tfsaRoom2 -= take; 
                    annualContributed.p2.tfsa += take; annualContributed.shared.tfsa += take;
                    if (flowLog) flowLog.contributions.p2.tfsa = (flowLog.contributions.p2.tfsa || 0) + take;
                }
            }
            continue;
        }

        // --- REGISTERED RETIREMENT SAVINGS PLAN (RRSP) ---
        if (acct === 'rrsp') {
            // Process Player 1 Matching & Discretionary Contributions
            if (alive1 && rrspRoom1 > 0 && !options?.blockRRSPContributionsP1) {
                let p1MatchRate = options?.p1MatchRate || 0;
                let p1Tier = options?.p1Tier || 0;
                let isRet1 = options?.isRet1 ?? false;

                // Execute employer match calculation inside sequence room context
                let empPortionP1 = (!isRet1) ? (person1.inc * p1MatchRate) : 0;
                let baseEmployeeRequiredP1 = (!isRet1) ? (person1.inc * p1Tier) : 0;

                if (empPortionP1 > 0 && baseEmployeeRequiredP1 > 0) {
                    let correctTargetTotalP1 = empPortionP1 + baseEmployeeRequiredP1;
                    let matchTake = Math.min(remaining, rrspRoom1, correctTargetTotalP1);
                    
                    if (matchTake > 0) {
                        let actEmpPortionP1 = empPortionP1 * (matchTake / correctTargetTotalP1);
                        if (options?.inflowsReference?.p1) {
                            options.inflowsReference.p1.gross += actEmpPortionP1;
                        }
                        if (options?.matchTracking) {
                            options.matchTracking.p1MatchAdded = actEmpPortionP1;
                            options.matchTracking.totalMatch1 = matchTake;
                        }
                        person1.rrsp += matchTake;
                        remaining -= matchTake;
                        rrspRoom1 -= matchTake;
                        if (flowLog) flowLog.contributions.p1.rrsp = (flowLog.contributions.p1.rrsp || 0) + matchTake;
                    }
                }

                // Handle regular discretionary leftovers up to limits
                if (remaining > 0 && rrspRoom1 > 0) {
                    let allowed = isSplit 
                        ? (maxLimits.p1.rrsp === 0 ? Infinity : Math.max(0, maxLimits.p1.rrsp - annualContributed.p1.rrsp))
                        : (maxLimits.p1.rrsp === 0 ? Infinity : Math.max(0, maxLimits.p1.rrsp - annualContributed.shared.rrsp));

                    if (allowed > 0) {
                        let take = Math.min(remaining, rrspRoom1, allowed);
                        person1.rrsp += take; remaining -= take; rrspRoom1 -= take; actualDeductions.p1 += take;
                        annualContributed.p1.rrsp += take; annualContributed.shared.rrsp += take;
                        if (flowLog) flowLog.contributions.p1.rrsp = (flowLog.contributions.p1.rrsp || 0) + take;
                    }
                }
            }

            // Process Process Player 2 Matching & Discretionary Contributions
            if (alive2 && rrspRoom2 > 0 && remaining > 0 && !options?.blockRRSPContributionsP2) {
                let p2MatchRate = options?.p2MatchRate || 0;
                let p2Tier = options?.p2Tier || 0;
                let isRet2 = options?.isRet2 ?? false;

                let empPortionP2 = (!isRet2) ? (person2.inc * p2MatchRate) : 0;
                let baseEmployeeRequiredP2 = (!isRet2) ? (person2.inc * p2Tier) : 0;

                if (empPortionP2 > 0 && baseEmployeeRequiredP2 > 0) {
                    let correctTargetTotalP2 = empPortionP2 + baseEmployeeRequiredP2;
                    let matchTake = Math.min(remaining, rrspRoom2, correctTargetTotalP2);
                    
                    if (matchTake > 0) {
                        let actEmpPortionP2 = empPortionP2 * (matchTake / correctTargetTotalP2);
                        if (options?.inflowsReference?.p2) {
                            options.inflowsReference.p2.gross += actEmpPortionP2;
                        }
                        if (options?.matchTracking) {
                            options.matchTracking.p2MatchAdded = actEmpPortionP2;
                            options.matchTracking.totalMatch2 = matchTake;
                        }
                        person2.rrsp += matchTake;
                        remaining -= matchTake;
                        rrspRoom2 -= matchTake;
                        if (flowLog) flowLog.contributions.p2.rrsp = (flowLog.contributions.p2.rrsp || 0) + matchTake;
                    }
                }

                if (remaining > 0 && rrspRoom2 > 0) {
                    let allowed = isSplit 
                        ? (maxLimits.p2.rrsp === 0 ? Infinity : Math.max(0, maxLimits.p2.rrsp - annualContributed.p2.rrsp))
                        : (maxLimits.p2.rrsp === 0 ? Infinity : Math.max(0, maxLimits.p2.rrsp - annualContributed.shared.rrsp));

                    if (allowed > 0) {
                        let take = Math.min(remaining, rrspRoom2, allowed);
                        person2.rrsp += take; remaining -= take; rrspRoom2 -= take; actualDeductions.p2 += take;
                        annualContributed.p2.rrsp += take; annualContributed.shared.rrsp += take;
                        if (flowLog) flowLog.contributions.p2.rrsp = (flowLog.contributions.p2.rrsp || 0) + take;
                    }
                }
            }
            continue;
        }

        // --- FIRST HOME SAVINGS ACCOUNT (FHSA) ---
        if (acct === 'fhsa') {
            if (alive1 && fhsaLim1 > 0 && fhsaRooms.p1 > 0) { 
                let allowed = isSplit 
                    ? (maxLimits.p1.fhsa === 0 ? Infinity : Math.max(0, maxLimits.p1.fhsa - annualContributed.p1.fhsa))
                    : (maxLimits.p1.fhsa === 0 ? Infinity : Math.max(0, maxLimits.p1.fhsa - annualContributed.shared.fhsa));

                if (allowed > 0) {
                    let take = Math.min(remaining, fhsaLim1, fhsaRooms.p1, allowed); 
                    person1.fhsa += take; remaining -= take; fhsaLim1 -= take; fhsaRooms.p1 -= take; actualDeductions.p1 += take; 
                    annualContributed.p1.fhsa += take; annualContributed.shared.fhsa += take;
                    if (flowLog) flowLog.contributions.p1.fhsa = (flowLog.contributions.p1.fhsa || 0) + take;
                }
            }
            if (alive2 && fhsaLim2 > 0 && fhsaRooms.p2 > 0 && remaining > 0) { 
                let allowed = isSplit 
                    ? (maxLimits.p2.fhsa === 0 ? Infinity : Math.max(0, maxLimits.p2.fhsa - annualContributed.p2.fhsa))
                    : (maxLimits.p2.fhsa === 0 ? Infinity : Math.max(0, maxLimits.p2.fhsa - annualContributed.shared.fhsa));

                if (allowed > 0) {
                    let take = Math.min(remaining, fhsaLim2, fhsaRooms.p2, allowed); 
                    person2.fhsa += take; remaining -= take; fhsaLim2 -= take; fhsaRooms.p2 -= take; actualDeductions.p2 += take; 
                    annualContributed.p2.fhsa += take; annualContributed.shared.fhsa += take;
                    if (flowLog) flowLog.contributions.p2.fhsa = (flowLog.contributions.p2.fhsa || 0) + take;
                }
            }
            continue;
        }

        // --- REGISTERED EDUCATION SAVINGS PLAN (RESP) ---
        if (acct === 'resp') {
            let target = respLim;
            if (alive1 && target > 0) { let take = Math.min(remaining, target); person1.resp += take; remaining -= take; target -= take; if (flowLog) flowLog.contributions.p1.resp = (flowLog.contributions.p1.resp || 0) + take; }
            if (alive2 && target > 0 && remaining > 0) { let take = Math.min(remaining, target); person2.resp += take; remaining -= take; if (flowLog) flowLog.contributions.p2.resp = (flowLog.contributions.p2.resp || 0) + take; }
            continue;
        }

        // --- CRYPTOCURRENCY ---
        if (acct === 'crypto') {
            if (alive1) {
                let allowed = isSplit 
                    ? (maxLimits.p1.crypto === 0 ? cryptoLim : Math.min(cryptoLim, Math.max(0, maxLimits.p1.crypto - annualContributed.p1.crypto)))
                    : (maxLimits.p1.crypto === 0 ? cryptoLim : Math.min(cryptoLim, Math.max(0, maxLimits.p1.crypto - annualContributed.shared.crypto)));

                if (allowed > 0) {
                    let take = Math.min(remaining, allowed);
                    person1.crypto += take; person1.crypto_acb += take; remaining -= take; 
                    annualContributed.p1.crypto += take; annualContributed.shared.crypto += take;
                    if (flowLog) flowLog.contributions.p1.crypto = (flowLog.contributions.p1.crypto || 0) + take;
                }
            }
            if (alive2 && remaining > 0) {
                let allowed = isSplit 
                    ? (maxLimits.p2.crypto === 0 ? cryptoLim : Math.min(cryptoLim, Math.max(0, maxLimits.p2.crypto - annualContributed.p2.crypto)))
                    : (maxLimits.p2.crypto === 0 ? cryptoLim : Math.min(cryptoLim, Math.max(0, maxLimits.p2.crypto - annualContributed.shared.crypto)));

                if (allowed > 0) {
                    let take = Math.min(remaining, allowed);
                    person2.crypto += take; person2.crypto_acb += take; remaining -= take; 
                    annualContributed.p2.crypto += take; annualContributed.shared.crypto += take;
                    if (flowLog) flowLog.contributions.p2.crypto = (flowLog.contributions.p2.crypto || 0) + take;
                }
            }
            continue;
        }

        // --- NON-REGISTERED INVESTMENTS ---
        if (acct === 'nonreg') {
            if (alive1) { 
                let allowed = isSplit 
                    ? (maxLimits.p1.nonreg === 0 ? Infinity : Math.max(0, maxLimits.p1.nonreg - annualContributed.p1.nonreg))
                    : (maxLimits.p1.nonreg === 0 ? Infinity : Math.max(0, maxLimits.p1.nonreg - annualContributed.shared.nonreg));

                if (allowed > 0) {
                    let take = Math.min(remaining / (alive2 ? 2 : 1), allowed); 
                    person1.nonreg += take; person1.acb += take; remaining -= take; 
                    annualContributed.p1.nonreg += take; annualContributed.shared.nonreg += take;
                    if (flowLog) flowLog.contributions.p1.nonreg = (flowLog.contributions.p1.nonreg || 0) + take;
                }
            }
            if (alive2 && remaining > 0) { 
                let allowed = isSplit 
                    ? (maxLimits.p2.nonreg === 0 ? Infinity : Math.max(0, maxLimits.p2.nonreg - annualContributed.p2.nonreg))
                    : (maxLimits.p2.nonreg === 0 ? Infinity : Math.max(0, maxLimits.p2.nonreg - annualContributed.shared.nonreg));

                if (allowed > 0) {
                    let take = Math.min(remaining, allowed); 
                    person2.nonreg += take; person2.acb += take; remaining -= take; 
                    annualContributed.p2.nonreg += take; annualContributed.shared.nonreg += take;
                    if (flowLog) flowLog.contributions.p2.nonreg = (flowLog.contributions.p2.nonreg || 0) + take; 
                }
            }
            continue;
        }

        // --- HIGH-YIELD CASH ACCOUNTS ---
        if (acct === 'cash') {
            if (alive1) { 
                let allowed = isSplit 
                    ? (maxLimits.p1.cash === 0 ? Infinity : Math.max(0, maxLimits.p1.cash - annualContributed.p1.cash))
                    : (maxLimits.p1.cash === 0 ? Infinity : Math.max(0, maxLimits.p1.cash - annualContributed.shared.cash));

                if (allowed > 0) {
                    let take = Math.min(remaining / (alive2 ? 2 : 1), allowed); 
                    person1.cash += take; remaining -= take; 
                    annualContributed.p1.cash += take; annualContributed.shared.cash += take;
                    if (flowLog) flowLog.contributions.p1.cash = (flowLog.contributions.p1.cash || 0) + take;
                }
            }
            if (alive2 && remaining > 0) { 
                let allowed = isSplit 
                    ? (maxLimits.p2.cash === 0 ? Infinity : Math.max(0, maxLimits.p2.cash - annualContributed.p2.cash))
                    : (maxLimits.p2.cash === 0 ? Infinity : Math.max(0, maxLimits.p2.cash - annualContributed.shared.cash));

                if (allowed > 0) {
                    let take = Math.min(remaining, allowed); 
                    person2.cash += take; remaining -= take; 
                    annualContributed.p2.cash += take; annualContributed.shared.cash += take;
                    if (flowLog) flowLog.contributions.p2.cash = (flowLog.contributions.p2.cash || 0) + take;
                }
            }
            continue;
        }
    }

    return remaining;
}

export function handleDeficit(
    deficit: number, person1: any, person2: any, ti1: number, ti2: number,
    alive1: boolean, alive2: boolean, flowLog: any, wdBreakdown: any,
    taxBrackets: any, addTaxFn: Function, age1: number, age2: number,
    oas1: number, oas2: number, oasThresh: number, lifMaxes: any,
    earned1: number, earned2: number, inflation: number, div1: number, div2: number,
    forceOrder: string[] | null, eligPen1: number, eligPen2: number,
    inputs: any, CONSTANTS: any, province: string, rrifStartAge: number,
    totalExpenses: number = 0,
    options?: { blockRRSPWithdrawalsP1?: boolean; blockRRSPWithdrawalsP2?: boolean }
) {
    let remainingDeficit = deficit;
    const decumOrder = forceOrder || inputs.strategies?.decum || ['nonreg', 'cash', 'tfsa', 'fhsa', 'rrsp', 'rrif_acct', 'lif', 'lirf', 'crypto'];

    // --- 1. CALCULATE PROTECTED EMERGENCY FUND ---
    let efMode = inputs.emergency_fund_mode || 'none';
    let efCustomAmt = inputs.emergency_fund_custom_amount || 0;
    let protectedCash = 0;

    if (efMode === 'custom') {
        protectedCash = efCustomAmt * inflation; 
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
        
        if (acct === 'rrsp') {
            if (prefix === 'p1' && options?.blockRRSPWithdrawalsP1) return;
            if (prefix === 'p2' && options?.blockRRSPWithdrawalsP2) return;
        }
        
        let accountBalance = p[acct] || 0;
        if (accountBalance <= 0) return;

        let maxAllowed = accountBalance;

        if (acct === 'cash') {
            maxAllowed = Math.min(accountBalance, availableHouseholdCash);
            if (maxAllowed <= 0) return; 
        }
        
        let isTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(acct);
        let isCapitalGain = ['nonreg', 'crypto'].includes(acct);
        
        let pullAmount = 0;
        
        if (isTaxable && !isCapitalGain) {
            let requiredGross = remainingDeficit / 0.80; 
            pullAmount = Math.min(maxAllowed, requiredGross);
            remainingDeficit -= (pullAmount * 0.80);
        } else {
            pullAmount = Math.min(maxAllowed, remainingDeficit);
            remainingDeficit -= pullAmount;
        }

        p[acct] -= pullAmount;
        if (acct === 'cash') availableHouseholdCash -= pullAmount;

        let logKey = acct;
        if (acct === 'nonreg') logKey = 'Non-Reg';
        else if (acct === 'crypto') logKey = 'Crypto';
        else if (acct === 'cash') logKey = 'Cash';
        else if (acct === 'rrif_acct') logKey = 'RRIF';
        else logKey = acct.toUpperCase();

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