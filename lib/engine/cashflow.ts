import { calculateTaxDetailed } from './tax';

// Helper to determine the specific growth rate of an account for the given year
const getAccountRate = (prefix: string, accountType: string, inputs: any, age: number, retAge: number) => {
    let baseRateKey = `${prefix}_${accountType}_ret`;
    let retRateKey = `${prefix}_${accountType}_retire_ret`;
    let isRet = age >= retAge;
    
    let rawVal = (inputs.asset_mode_advanced && isRet && inputs[retRateKey] !== undefined) 
                 ? inputs[retRateKey] 
                 : inputs[baseRateKey];
                 
    let r = rawVal !== undefined ? (Number(rawVal) || 0) / 100 : 0;
    
    if (inputs.use_glide_path && ['tfsa','rrsp','fhsa','nonreg','crypto','lirf','lif','rrif_acct','resp'].includes(accountType)) {
        let ageOffset = Math.max(0, age - 50);
        r -= (ageOffset * 0.001);
        r = Math.max(0.04, r);
    }
    return r;
};

// Calculates the clawback/boost multiplier based on timing preference
const getMultiplier = (timing: string, prefix: string, accountType: string, inputs: any, age: number, retAge: number) => {
    if (timing === 'end') return 1.0;
    const mappedType = accountType === 'tfsa_successor' ? 'tfsa' : accountType;
    let r = getAccountRate(prefix, mappedType, inputs, age, retAge);
    
    if (timing === 'start') return 1 + r;
    if (timing === 'mid') return 1 + (r / 2);
    return 1.0;
};

export function applyPensionSplitting(craTaxableIncome1: number, craTaxableIncome2: number, inflows: any, regMinimums: any, age1: number, age2: number, setTaxesCallback: any) {
    let eligiblePensionP1 = inflows.p1.pension + (age1 >= 65 ? regMinimums.p1 + regMinimums.lifTaken1 : 0);
    let eligiblePensionP2 = inflows.p2.pension + (age2 >= 65 ? regMinimums.p2 + regMinimums.lifTaken2 : 0);

    if (craTaxableIncome1 > craTaxableIncome2 && eligiblePensionP1 > 0) {
        let maxTransfer = eligiblePensionP1 * 0.5;
        let incomeDifference = craTaxableIncome1 - craTaxableIncome2;
        let transferAmount = Math.min(maxTransfer, incomeDifference / 2);
        if (transferAmount > 0) setTaxesCallback(craTaxableIncome1 - transferAmount, craTaxableIncome2 + transferAmount, transferAmount, 'p1_to_p2');
    } else if (craTaxableIncome2 > craTaxableIncome1 && eligiblePensionP2 > 0) {
        let maxTransfer = eligiblePensionP2 * 0.5;
        let incomeDifference = craTaxableIncome2 - craTaxableIncome1;
        let transferAmount = Math.min(maxTransfer, incomeDifference / 2);
        if (transferAmount > 0) setTaxesCallback(craTaxableIncome1 + transferAmount, craTaxableIncome2 - transferAmount, transferAmount, 'p2_to_p1');
    }
}

export function handleSurplus(surplusAmount: number, person1: any, person2: any, alive1: boolean, alive2: boolean, flowLog: any, yearIndex: number, tfsaLimit: number, rrspLimit1: number, rrspLimit2: number, cryptoLimit: number, fhsaLimit1: number, fhsaLimit2: number, respLimit: number, deductionsObj: any, fhsaLifetimeRooms: any, strategies: any, inputs: any, constants: any, age1: number, age2: number) {
    let remainingSurplus = surplusAmount;
    // UPDATED: Look for specific contribution timing
    const timing = inputs.contribution_timing || inputs.cashflow_timing || 'end';
    
    strategies.accum.forEach((accountType: string) => { 
        if (remainingSurplus <= 0) return;
        
        let m1 = getMultiplier(timing, 'p1', accountType, inputs, age1, person1.retAge);
        let m2 = getMultiplier(timing, 'p2', accountType, inputs, age2, person2.retAge);
        
        if (accountType === 'tfsa' && tfsaLimit > 0) { 
            if (alive1 && (!inputs['skip_first_tfsa_p1'] || yearIndex > 0)) {
                let takeAmount = Math.min(remainingSurplus, tfsaLimit); 
                person1.tfsa += (takeAmount * m1); 
                if (flowLog) flowLog.contributions.p1.tfsa += takeAmount; 
                remainingSurplus -= takeAmount;
            } 
            if (alive2 && remainingSurplus > 0 && (!inputs['skip_first_tfsa_p2'] || yearIndex > 0)) {
                let takeAmount = Math.min(remainingSurplus, tfsaLimit); 
                person2.tfsa += (takeAmount * m2); 
                if (flowLog) flowLog.contributions.p2.tfsa += takeAmount; 
                remainingSurplus -= takeAmount;
            } 
        }
        else if (accountType === 'rrsp') { 
            let priorityList: any[] = [];
            const p1HasRoom = (!inputs['skip_first_rrsp_p1'] || yearIndex > 0) && alive1 && rrspLimit1 > 0;
            const p2HasRoom = (!inputs['skip_first_rrsp_p2'] || yearIndex > 0) && alive2 && rrspLimit2 > 0;
            
            if (p1HasRoom && p2HasRoom) {
                if (person1.rrsp < person2.rrsp) priorityList = [{ person: person1, room: rrspLimit1, key: 'p1', m: m1 }];
                else priorityList = [{ person: person2, room: rrspLimit2, key: 'p2', m: m2 }];
            } else if (p1HasRoom) { priorityList = [{ person: person1, room: rrspLimit1, key: 'p1', m: m1 }]; }
            else if (p2HasRoom) { priorityList = [{ person: person2, room: rrspLimit2, key: 'p2', m: m2 }]; }

            priorityList.forEach(obj => {
                if (remainingSurplus > 0) {
                    let takeAmount = Math.min(remainingSurplus, obj.room);
                    obj.person.rrsp += (takeAmount * obj.m); 
                    if (flowLog) flowLog.contributions[obj.key].rrsp += takeAmount; 
                    if (deductionsObj) deductionsObj[obj.key] += takeAmount;
                    remainingSurplus -= takeAmount;
                }
            });
        }
        else if (accountType === 'fhsa') {
            if (alive1 && remainingSurplus > 0 && person1.fhsa !== undefined && fhsaLimit1 > 0 && fhsaLifetimeRooms?.p1 > 0) {
                let takeAmount = Math.min(remainingSurplus, fhsaLimit1, fhsaLifetimeRooms.p1);
                person1.fhsa += (takeAmount * m1);
                if (flowLog) flowLog.contributions.p1.fhsa += takeAmount;
                if (deductionsObj) deductionsObj.p1 += takeAmount;
                remainingSurplus -= takeAmount;
                fhsaLifetimeRooms.p1 -= takeAmount;
            }
            if (alive2 && remainingSurplus > 0 && person2.fhsa !== undefined && fhsaLimit2 > 0 && fhsaLifetimeRooms?.p2 > 0) {
                let takeAmount = Math.min(remainingSurplus, fhsaLimit2, fhsaLifetimeRooms.p2);
                person2.fhsa += (takeAmount * m2);
                if (flowLog) flowLog.contributions.p2.fhsa += takeAmount;
                if (deductionsObj) deductionsObj.p2 += takeAmount;
                remainingSurplus -= takeAmount;
                fhsaLifetimeRooms.p2 -= takeAmount;
            }
        }
        else if (accountType === 'resp' && respLimit > 0) {
            if (alive1 && remainingSurplus > 0 && person1.resp !== undefined) {
                let takeAmount = Math.min(remainingSurplus, respLimit); 
                person1.resp += (takeAmount * m1);
                if (flowLog) flowLog.contributions.p1.resp += takeAmount;
                person1.resp += ((takeAmount * (constants.RESP_CESG_MATCH_RATE || 0.20)) * m1);
                remainingSurplus -= takeAmount;
            }
        }
        else if (accountType === 'crypto' && cryptoLimit > 0) {
            if (alive1 && remainingSurplus > 0) {
                let takeAmount = Math.min(remainingSurplus, cryptoLimit);
                person1.crypto += (takeAmount * m1); person1.crypto_acb += takeAmount; // ACB is nominal cash
                if (flowLog) flowLog.contributions.p1.crypto += takeAmount;
                remainingSurplus -= takeAmount;
            }
            if (alive2 && remainingSurplus > 0) {
                let takeAmount = Math.min(remainingSurplus, cryptoLimit);
                person2.crypto += (takeAmount * m2); person2.crypto_acb += takeAmount;
                if (flowLog) flowLog.contributions.p2.crypto += takeAmount;
                remainingSurplus -= takeAmount;
            }
        }
        else if (accountType === 'nonreg' || accountType === 'cash') {
            if (alive1 && alive2) {
                let halfAmount = remainingSurplus / 2;
                person1[accountType] += (halfAmount * m1); 
                person2[accountType] += (halfAmount * m2); 
                if (accountType === 'nonreg') { person1.acb += halfAmount; person2.acb += halfAmount; }
                if (flowLog) { flowLog.contributions.p1[accountType] += halfAmount; flowLog.contributions.p2[accountType] += halfAmount; }
            } else if (alive1) { 
                person1[accountType] += (remainingSurplus * m1); 
                if (accountType === 'nonreg') person1.acb += remainingSurplus;
                if (flowLog) flowLog.contributions.p1[accountType] += remainingSurplus; 
            } else if (alive2) { 
                person2[accountType] += (remainingSurplus * m2); 
                if (accountType === 'nonreg') person2.acb += remainingSurplus;
                if (flowLog) flowLog.contributions.p2[accountType] += remainingSurplus; 
            }
            remainingSurplus = 0;
        }
    });
}

export function handleDeficit(deficitAmount: number, person1: any, person2: any, craTaxableIncome1: number, craTaxableIncome2: number, alive1: boolean, alive2: boolean, flowLog: any, withdrawalBreakdown: any, taxBrackets: any, onWithdrawalCallback: any, age1: number, age2: number, oasReceived1: number, oasReceived2: number, oasThresholdInflation: number, lifLimits: any, earnedIncome1: number, earnedIncome2: number, baseInflation: number, dividendIncome1: number, dividendIncome2: number, overrideStrategies: string[] | null, eligPension1: number, eligPension2: number, inputs: any, constants: any, province: string, rrifStartAge: number) {
    let remainingDeficit = deficitAmount;
    let runningTaxInc1 = craTaxableIncome1;
    let runningTaxInc2 = craTaxableIncome2;
    
    const MARGINAL_TOLERANCE = 50; 
    const withdrawalStrategies = overrideStrategies || inputs.strategies?.decum || ['nonreg', 'tfsa', 'rrsp'];
    const timing = inputs.withdrawal_timing || inputs.cashflow_timing || 'end';

    const getNum = (val: any) => { 
        if (typeof val === 'number') return val; 
        if (!val) return 0; 
        return Number(String(val).replace(/[^0-9.-]+/g,"")) || 0; 
    };
    
    // Dynamic Caregiver Share Processing
    let p1_under = inputs['p1_caregiver_under_18'] || false;
    let p2_under = inputs['p2_caregiver_under_18'] || false;
    let p1_over = inputs['p1_caregiver_over_18'] || false;
    let p2_over = inputs['p2_caregiver_over_18'] || false;
    
    let under18_share_p1 = p1_under ? (p2_under ? 0.5 : 1) : 0;
    let under18_share_p2 = p2_under ? (p1_under ? 0.5 : 1) : 0;
    let over18_share_p1 = p1_over ? (p2_over ? 0.5 : 1) : 0;
    let over18_share_p2 = p2_over ? (p1_over ? 0.5 : 1) : 0;
    
    let credits1 = { 
        donations: getNum(inputs['p1_donations']),
        tuition: getNum(inputs['p1_tuition']),
        studentLoanInterest: getNum(inputs['p1_student_loan_interest']),
        medicalExpenses: getNum(inputs['p1_medical_expenses']),
        disability: inputs['p1_disability'] || false,
        caregiver_under_18_share: under18_share_p1,
        caregiver_over_18_share: over18_share_p1,
    };
    
    let credits2 = { 
        donations: getNum(inputs['p2_donations']),
        tuition: getNum(inputs['p2_tuition']),
        studentLoanInterest: getNum(inputs['p2_student_loan_interest']),
        medicalExpenses: getNum(inputs['p2_medical_expenses']),
        disability: inputs['p2_disability'] || false,
        caregiver_under_18_share: under18_share_p2,
        caregiver_over_18_share: over18_share_p2,
    };

    let hasBalance = (person: any, accountType: string, prefix: string) => {
        if (accountType === 'tfsa') return (person.tfsa + (person.tfsa_successor || 0)) > 0;
        if (person[accountType] === undefined || person[accountType] <= 0) return false;
        if (accountType === 'lif' || accountType === 'lirf') {
            let maxLimit = prefix === 'p1' ? lifLimits.lifMax1 : lifLimits.lifMax2;
            if (maxLimit <= 0.01) return false;
        }
        return true;
    };

    const withdrawFromAccount = (person: any, accountType: string, requiredNetCash: number, prefix: string, marginalRate: number) => { 
        if (requiredNetCash <= 0) return { net: 0, tax: 0 };
        
        let accountsToPullFrom = accountType === 'tfsa' ? ['tfsa', 'tfsa_successor'] : [accountType];
        let totalNetReceived = 0, totalTaxGenerated = 0, remainingNeed = requiredNetCash;

        for (let account of accountsToPullFrom) {
            if (remainingNeed <= 0.01) break;
            if (!person[account] || person[account] <= 0) continue;

            let isFullyTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf'].includes(account);
            let isCapitalGain = ['nonreg', 'crypto'].includes(account);
            let grossWithdrawalNeeded = remainingNeed, effectiveTaxRate = 0;
            let acbKey = account === 'crypto' ? 'crypto_acb' : 'acb';
            
            let currentAge = (prefix === 'p1') ? age1 : age2;
            let retAge = (prefix === 'p1') ? person1.retAge : person2.retAge;
            let m = getMultiplier(timing, prefix, account, inputs, currentAge, retAge);

            if (isFullyTaxable) {
                effectiveTaxRate = Math.min(marginalRate || 0, 0.54); 
                grossWithdrawalNeeded = remainingNeed / (1 - effectiveTaxRate);
            } else if (isCapitalGain) {
                let preWithdrawalBalance = person[account] / m;
                let gainRatio = preWithdrawalBalance > 0 ? Math.max(0, 1 - (person[acbKey] / preWithdrawalBalance)) : 0;
                effectiveTaxRate = Math.min(marginalRate || 0, 0.54) * 0.5 * gainRatio;
                grossWithdrawalNeeded = remainingNeed / (1 - effectiveTaxRate);
            }
            
            let availableAccountBalance = person[account] / m; 
            
            if (account === 'lif' || account === 'lirf') {
                let maxLimit = prefix === 'p1' ? lifLimits.lifMax1 : lifLimits.lifMax2;
                availableAccountBalance = Math.min(availableAccountBalance, maxLimit);
                if (availableAccountBalance <= 0.01) continue; 
            }
            
            let takenAmount = Math.min(availableAccountBalance, grossWithdrawalNeeded);
            let actualReduction = takenAmount * m; 

            if (account === 'lif' || account === 'lirf') {
                if (prefix === 'p1') lifLimits.lifMax1 -= takenAmount;
                else lifLimits.lifMax2 -= takenAmount;
            }
            
            let logKey = account;
            if (account === 'rrsp' && currentAge >= rrifStartAge) logKey = 'RRIF';
            else if (account === 'rrsp') logKey = 'RRSP';
            else if (account === 'rrif_acct') logKey = 'RRIF';
            else if (account === 'tfsa_successor') logKey = 'TFSA (Successor)';
            else logKey = account.toUpperCase();

            person[account] -= actualReduction;
            
            let taxableAmountForCallback = 0, acbSold = 0, capitalGain = 0;
            
            if (isCapitalGain) {
                let proportionSold = actualReduction / (person[account] + actualReduction); 
                acbSold = person[acbKey] * proportionSold;
                person[acbKey] = Math.max(0, person[acbKey] - acbSold);
                capitalGain = takenAmount - acbSold;
                taxableAmountForCallback = Math.max(0, capitalGain * 0.5); 
            } else if (isFullyTaxable) {
                taxableAmountForCallback = takenAmount;
            }

            if (flowLog) {
                let key = `${prefix.toUpperCase()} ${logKey}`;
                flowLog.withdrawals[key] = (flowLog.withdrawals[key] || 0) + takenAmount;
                
                if (withdrawalBreakdown) {
                    withdrawalBreakdown[prefix][logKey] = (withdrawalBreakdown[prefix][logKey] || 0) + takenAmount;
                    if (!withdrawalBreakdown[prefix][logKey + '_math']) {
                        withdrawalBreakdown[prefix][logKey + '_math'] = { wd: 0, tax: 0, acb: 0, gain: 0, priorBal: 0, factor: 0, min: 0 };
                    }
                    let mathObj = withdrawalBreakdown[prefix][logKey + '_math'];
                    mathObj.wd += takenAmount; mathObj.tax += taxableAmountForCallback;
                    if (isCapitalGain) { mathObj.acb += acbSold; mathObj.gain += capitalGain; }
                }
            }
            
            if (onWithdrawalCallback) onWithdrawalCallback(prefix, taxableAmountForCallback, takenAmount); 

            let netReceived = takenAmount * (1 - effectiveTaxRate);
            totalNetReceived += netReceived; totalTaxGenerated += taxableAmountForCallback; remainingNeed -= netReceived;
        }

        return { net: totalNetReceived, tax: totalTaxGenerated };
    };

    const executeWithdrawalStrategy = (ceiling1: number, ceiling2: number, currentStrategies: string[], onlyTaxableAccounts: boolean) => {
        let indexP1 = 0, indexP2 = 0, sanityLimit = 200; 

        while (remainingDeficit > 1 && (indexP1 < currentStrategies.length || indexP2 < currentStrategies.length) && sanityLimit-- > 0) {
            while (indexP1 < currentStrategies.length) {
                let type = currentStrategies[indexP1];
                if (!alive1 || !hasBalance(person1, type, 'p1')) { indexP1++; continue; }
                let isTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(type);
                if (onlyTaxableAccounts && !isTaxable) { indexP1++; continue; }
                if (ceiling1 !== Infinity && isTaxable && ceiling1 - runningTaxInc1 <= 1) { indexP1++; continue; }
                break;
            }
            while (indexP2 < currentStrategies.length) {
                let type = currentStrategies[indexP2];
                if (!alive2 || !hasBalance(person2, type, 'p2')) { indexP2++; continue; }
                let isTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(type);
                if (onlyTaxableAccounts && !isTaxable) { indexP2++; continue; }
                if (ceiling2 !== Infinity && isTaxable && ceiling2 - runningTaxInc2 <= 1) { indexP2++; continue; }
                break;
            }

            const typeP1 = indexP1 < currentStrategies.length ? currentStrategies[indexP1] : null;
            const typeP2 = indexP2 < currentStrategies.length ? currentStrategies[indexP2] : null;
            if (!typeP1 && !typeP2) break;

            const marginalRate1 = calculateTaxDetailed(runningTaxInc1, province, taxBrackets, constants, oasReceived1, oasThresholdInflation, earnedIncome1, baseInflation, dividendIncome1, age1, eligPension1, alive2 ? runningTaxInc2 : -1, true, credits1).margRate;
            const marginalRate2 = calculateTaxDetailed(runningTaxInc2, province, taxBrackets, constants, oasReceived2, oasThresholdInflation, earnedIncome2, baseInflation, dividendIncome2, age2, eligPension2, alive1 ? runningTaxInc1 : -1, true, credits2).margRate;

            let withdrawTarget: any = null;
            if (!typeP1) withdrawTarget = 'p2';
            else if (!typeP2) withdrawTarget = 'p1';
            else if (indexP1 < indexP2) withdrawTarget = 'p1'; 
            else if (indexP2 < indexP1) withdrawTarget = 'p2'; 
            else {
                let isTaxFree = !['rrsp', 'rrif_acct', 'lif', 'lirf', 'nonreg', 'crypto'].includes(typeP1);
                if (isTaxFree || Math.abs(runningTaxInc1 - runningTaxInc2) < MARGINAL_TOLERANCE) withdrawTarget = 'split';
                else withdrawTarget = runningTaxInc1 < runningTaxInc2 ? 'p1' : 'p2';
            }

            let getNetRoomAvailable = (accountType: string, income: number, marginalRate: number, personObj: any, ceiling: number) => {
                if (ceiling === Infinity) return Infinity;
                let isFullyTaxable = ['rrsp', 'rrif_acct', 'lif', 'lirf'].includes(accountType); 
                let isCapitalGain = ['nonreg', 'crypto'].includes(accountType);
                
                let prefix = personObj === person1 ? 'p1' : 'p2';
                let currentAge = personObj === person1 ? age1 : age2;
                let m = getMultiplier(timing, prefix, accountType, inputs, currentAge, personObj.retAge);

                if (isFullyTaxable) return Math.max(0, ceiling - income) * (1 - Math.min(marginalRate || 0, 0.54));
                else if (isCapitalGain) {
                    let grossRoom = Math.max(0, ceiling - income);
                    let acbKey = accountType === 'crypto' ? 'crypto_acb' : 'acb';
                    let balance = personObj[accountType];
                    let preGrowthBalance = balance / m;
                    let gainRatio = preGrowthBalance > 0 ? Math.max(0, 1 - (personObj[acbKey] / preGrowthBalance)) : 0;
                    if (gainRatio > 0) return (grossRoom / (0.5 * gainRatio)) * (1 - (Math.min(marginalRate || 0, 0.54) * 0.5 * gainRatio));
                }
                return Infinity;
            };

            if (withdrawTarget === 'split') {
                let netRoom1 = getNetRoomAvailable(typeP1 as string, runningTaxInc1, marginalRate1, person1, ceiling1);
                let netRoom2 = getNetRoomAvailable(typeP2 as string, runningTaxInc2, marginalRate2, person2, ceiling2);
                
                let halfDeficit = remainingDeficit / 2;
                let require1 = Math.min(halfDeficit, netRoom1), require2 = Math.min(halfDeficit, netRoom2);
                if (require1 < halfDeficit) require2 = Math.min(remainingDeficit - require1, netRoom2);
                if (require2 < halfDeficit) require1 = Math.min(remainingDeficit - require2, netRoom1);
                if (require1 > 0 && require1 < 10) require1 = Math.min(remainingDeficit, netRoom1);
                if (require2 > 0 && require2 < 10) require2 = Math.min(remainingDeficit, netRoom2);

                let gotP1 = require1 > 0 ? withdrawFromAccount(person1, typeP1 as string, require1, 'p1', marginalRate1) : { net: 0, tax: 0 };
                let gotP2 = require2 > 0 ? withdrawFromAccount(person2, typeP2 as string, require2, 'p2', marginalRate2) : { net: 0, tax: 0 };

                if (gotP1.net <= 0.01 && gotP1.tax <= 0.01 && require1 > 0.01 && !['lif', 'lirf'].includes(typeP1 as string)) person1[typeP1 as string] = 0;
                if (gotP2.net <= 0.01 && gotP2.tax <= 0.01 && require2 > 0.01 && !['lif', 'lirf'].includes(typeP2 as string)) person2[typeP2 as string] = 0;

                remainingDeficit -= (gotP1.net + gotP2.net);
                runningTaxInc1 += gotP1.tax; runningTaxInc2 += gotP2.tax;
            } else {
                let amountToTake = remainingDeficit;
                let targetPersonObj = withdrawTarget === 'p1' ? person1 : person2;
                let targetAccountType = withdrawTarget === 'p1' ? typeP1 : typeP2;
                let targetMarginalRate = withdrawTarget === 'p1' ? marginalRate1 : marginalRate2;
                let targetIncome = withdrawTarget === 'p1' ? runningTaxInc1 : runningTaxInc2;
                let targetCeiling = withdrawTarget === 'p1' ? ceiling1 : ceiling2;
                
                let netRoom = getNetRoomAvailable(targetAccountType as string, targetIncome, targetMarginalRate, targetPersonObj, targetCeiling);

                if (typeP1 && typeP2 && indexP1 === indexP2 && !['tfsa','cash','fhsa'].includes(targetAccountType as string)) {
                    let incomeGap = Math.abs(runningTaxInc1 - runningTaxInc2);
                    let effectiveRate = Math.min(targetMarginalRate || 0, 0.54);
                    if (['nonreg', 'crypto'].includes(targetAccountType as string)) {
                        let acbKey = targetAccountType === 'crypto' ? 'crypto_acb' : 'acb';
                        let m = getMultiplier(timing, withdrawTarget, targetAccountType as string, inputs, withdrawTarget === 'p1' ? age1 : age2, targetPersonObj.retAge);
                        let preGrowthBalance = targetPersonObj[targetAccountType as string] / m;
                        effectiveRate *= 0.5 * (preGrowthBalance > 0 ? Math.max(0, 1 - (targetPersonObj[acbKey] / preGrowthBalance)) : 0);
                    }
                    if (incomeGap * (1 - effectiveRate) > 0) amountToTake = Math.min(amountToTake, incomeGap * (1 - effectiveRate));
                }

                amountToTake = Math.min(amountToTake, netRoom);
                if (amountToTake <= 0.01) {
                    if (withdrawTarget === 'p1') runningTaxInc1 = ceiling1;
                    if (withdrawTarget === 'p2') runningTaxInc2 = ceiling2;
                    continue;
                }

                let gotCash = withdrawFromAccount(targetPersonObj, targetAccountType as string, amountToTake, withdrawTarget, targetMarginalRate);
                if (gotCash.net <= 0.01 && gotCash.tax <= 0.01 && amountToTake > 0.01 && !['lif', 'lirf'].includes(targetAccountType as string)) {
                    targetPersonObj[targetAccountType as string] = 0;
                }
                remainingDeficit -= gotCash.net;
                if (withdrawTarget === 'p1') runningTaxInc1 += gotCash.tax; else runningTaxInc2 += gotCash.tax;
            }
        }
    };

    const optimizeOasFlag = inputs['oas_clawback_optimize'];
    let p1OasCeiling = (optimizeOasFlag && age1 >= 65) ? oasThresholdInflation : Infinity;
    let p2OasCeiling = (optimizeOasFlag && age2 >= 65) ? oasThresholdInflation : Infinity;
    
    if (optimizeOasFlag && (p1OasCeiling < Infinity || p2OasCeiling < Infinity)) {
        if (remainingDeficit > 1) executeWithdrawalStrategy(p1OasCeiling, p2OasCeiling, withdrawalStrategies, true); 
        if (remainingDeficit > 1) executeWithdrawalStrategy(Infinity, Infinity, ['tfsa', 'fhsa', 'cash'], false);
    }
    if (remainingDeficit > 1) executeWithdrawalStrategy(Infinity, Infinity, withdrawalStrategies, false);
}