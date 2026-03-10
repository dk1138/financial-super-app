/**
 * tax.ts
 * Core engine for Canadian federal and provincial tax calculations.
 * Applies progressive tax brackets, non-refundable credits, phase-outs, and surtaxes.
 */

export function getInflatedTaxData(baseTaxData: any, baseInflation: number) {
    let taxData = JSON.parse(JSON.stringify(baseTaxData || {}));
    
    Object.values(taxData).forEach((data: any) => { 
        if (data.brackets) {
            data.brackets = data.brackets.map((bracket: number) => {
                // ON top brackets are fixed
                if (bracket === 150000 || bracket === 220000) return bracket; 
                return bracket * baseInflation;
            });
        }
        if (data.surtax) { 
            if (data.surtax.t1) data.surtax.t1 *= baseInflation; 
            if (data.surtax.t2) data.surtax.t2 *= baseInflation; 
        } 
    });
    return taxData;
}

export function calculateProgressiveTax(income: number, brackets: number[], rates: number[]) {
    let accumulatedTax = 0;
    let previousBracketLimit = 0;

    for (let j = 0; j < brackets.length; j++) { 
        if (income > brackets[j]) { 
            accumulatedTax += (brackets[j] - previousBracketLimit) * rates[j]; 
            previousBracketLimit = brackets[j]; 
        } else { 
            return { 
                tax: accumulatedTax + (income - previousBracketLimit) * rates[j], 
                marginalRate: rates[j] 
            }; 
        } 
    }

    return { 
        tax: accumulatedTax + (income - previousBracketLimit) * rates[rates.length - 1], 
        marginalRate: rates[rates.length - 1] 
    };
}

export function calculateTaxDetailed(
    craTaxableIncome: number, 
    province: string, 
    taxData: any, 
    constants: any, 
    oasReceived = 0, 
    oasThreshold = 0, 
    earnedIncome = 0, 
    baseInflation = 1, 
    actualDividendIncome = 0, 
    age = 0, 
    eligiblePension = 0, 
    spouseIncome = -1, 
    isEligibleDividend = true,
    isMarginalRun = false
): any {
    
    if (craTaxableIncome <= 0) {
        return { fed: 0, prov: 0, cpp_ei: 0, oas_clawback: 0, totalTax: 0, margRate: 0 };
    }
    
    // 1. OAS Clawback
    let oasClawback = 0;
    if (oasReceived > 0 && oasThreshold > 0 && craTaxableIncome > oasThreshold) {
        oasClawback = (craTaxableIncome - oasThreshold) * 0.15;
        if (oasClawback > oasReceived) {
            oasClawback = oasReceived; 
        }
    }

    // 2. CPP/EI Premiums
    let cppBasePremium = 0;
    let cppEnhancedPremium = 0;
    
    let ympe = (constants.YMPE || 74600) * baseInflation; 
    let yampe = (constants.YAMPE || 85000) * baseInflation; 
    let eiMaxInsurable = (constants.EI_MAX_INSURABLE || 68900) * baseInflation; 
    let cppExemption = (constants.CPP_EXEMPTION || 3500) * baseInflation;

    if (earnedIncome > cppExemption) {
        cppBasePremium += (Math.min(earnedIncome, ympe) - cppExemption) * (constants.CPP_RATE || 0.0495); 
        cppEnhancedPremium += (Math.min(earnedIncome, ympe) - cppExemption) * (constants.CPP_ENHANCED_RATE || 0.01);
    }
    if (earnedIncome > ympe) {
        cppEnhancedPremium += (Math.min(earnedIncome, yampe) - ympe) * (constants.CPP_ENHANCED_TIER2_RATE || 0.04);
    }
    
    const eiPremium = Math.min(earnedIncome, eiMaxInsurable) * (constants.EI_RATE || 0.0163); 

    // Enhanced CPP and OAS Clawback reduce taxable income for Fed/Prov brackets
    let taxIncomeForFedProv = Math.max(0, craTaxableIncome - cppEnhancedPremium - oasClawback);
    
    const fedCalc = calculateProgressiveTax(taxIncomeForFedProv, taxData.FED.brackets, taxData.FED.rates);
    const provCalc = calculateProgressiveTax(
        taxIncomeForFedProv, 
        taxData[province]?.brackets || [999999999], 
        taxData[province]?.rates || [0.10]
    );
    
    let fedTax = fedCalc.tax;
    let provTax = provCalc.tax;

    // ---------------------------------------------------------
    // 3. NON-REFUNDABLE TAX CREDITS (Mapped to Taxtips configs)
    // ---------------------------------------------------------
    const fc = constants.FED_CREDITS || {
        BPA_MAX: 16452, BPA_MIN: 14829, BPA_PHASE_START: 181440, BPA_PHASE_END: 258482,
        AGE_AMOUNT: 9212, AGE_PHASE_START: 46432, EMPLOYMENT_AMOUNT: 1501, PENSION_AMOUNT: 2000, LOWEST_RATE: 0.15
    };
    const pc = constants.PROV_CREDITS?.[province] || { BPA: 12989, LOWEST_RATE: 0.0505 };

    let lowestFedRate = fc.LOWEST_RATE; 
    let lowestProvRate = pc.LOWEST_RATE || taxData[province]?.rates?.[0] || 0.0505;

    // A. Basic Personal Amount Phase-outs
    let bpaMax = fc.BPA_MAX * baseInflation;
    let bpaMin = fc.BPA_MIN * baseInflation;
    let bpaPhaseStart = fc.BPA_PHASE_START * baseInflation;
    let bpaPhaseEnd = fc.BPA_PHASE_END * baseInflation;
    
    let fedBpa = bpaMax;
    if (craTaxableIncome > bpaPhaseStart) {
        let reduction = (craTaxableIncome - bpaPhaseStart) * ((bpaMax - bpaMin) / (bpaPhaseEnd - bpaPhaseStart));
        fedBpa = Math.max(bpaMin, bpaMax - reduction);
    }
    let provBpa = pc.BPA * baseInflation;

    let fedCreditsBase = fedBpa;
    let provCreditsBase = provBpa;

    // B. Spousal Amounts
    if (spouseIncome >= 0 && spouseIncome < fedBpa) fedCreditsBase += (fedBpa - spouseIncome);
    if (spouseIncome >= 0 && spouseIncome < provBpa) provCreditsBase += (provBpa - spouseIncome);

    // C. Employment Amount
    if (earnedIncome > 0) {
        fedCreditsBase += Math.min(earnedIncome, fc.EMPLOYMENT_AMOUNT * baseInflation);
    }

    // D. Age Amount Phase-outs
    if (age >= 65) {
        let fAgeBase = fc.AGE_AMOUNT * baseInflation;
        let fAgePhase = fc.AGE_PHASE_START * baseInflation;
        fedCreditsBase += Math.max(0, fAgeBase - Math.max(0, craTaxableIncome - fAgePhase) * 0.15);
        
        if (pc.AGE_AMOUNT) {
            let pAgeBase = pc.AGE_AMOUNT * baseInflation;
            let pAgePhase = pc.AGE_PHASE_START * baseInflation;
            provCreditsBase += Math.max(0, pAgeBase - Math.max(0, craTaxableIncome - pAgePhase) * 0.15);
        }
    }
    
    // E. Pension Amount
    if (eligiblePension > 0) {
        fedCreditsBase += Math.min(eligiblePension, fc.PENSION_AMOUNT * baseInflation);
        if (pc.PENSION_AMOUNT) provCreditsBase += Math.min(eligiblePension, pc.PENSION_AMOUNT * baseInflation);
    }

    // F. CPP/EI Premiums (Base Only)
    fedCreditsBase += (cppBasePremium + eiPremium);
    provCreditsBase += (cppBasePremium + eiPremium);

    // Apply Credit Rates
    fedTax = Math.max(0, fedTax - (fedCreditsBase * lowestFedRate));
    provTax = Math.max(0, provTax - (provCreditsBase * lowestProvRate));

    // ---------------------------------------------------------
    // 4. DIVIDEND TAX CREDITS
    // ---------------------------------------------------------
    let grossUp = isEligibleDividend ? (constants.DIVIDEND_GROSS_UP_ELIGIBLE || 1.38) : (constants.DIVIDEND_GROSS_UP_NON_ELIGIBLE || 1.15);
    let grossedUpDividend = actualDividendIncome * grossUp;
    
    let fedDivRate = isEligibleDividend ? (constants.FED_DIVIDEND_CREDIT_RATE_ELIGIBLE || 0.150198) : (constants.FED_DIVIDEND_CREDIT_RATE_NON_ELIGIBLE || 0.090301);
    let fedDividendCredit = grossedUpDividend * fedDivRate;
    
    let provDivRates = isEligibleDividend ? (constants.PROV_DIV_CREDIT_ELIGIBLE || {}) : (constants.PROV_DIV_CREDIT_NON_ELIGIBLE || {});
    let provDividendCredit = grossedUpDividend * (provDivRates[province] || 0.10);

    fedTax = Math.max(0, fedTax - fedDividendCredit);

    // ---------------------------------------------------------
    // 5. PROVINCIAL SPECIFICS (Ontario)
    // ---------------------------------------------------------
    if (province === 'ON') { 
        provTax = Math.max(0, provTax - provDividendCredit);
        
        let liftMax = (constants.ON_LIFT_MAX || 875) * baseInflation;
        let liftRate = constants.ON_LIFT_RATE || 0.0505;
        let liftPhaseStart = (constants.ON_LIFT_PHASE_OUT_START || 32500) * baseInflation;
        let liftPhaseRate = constants.ON_LIFT_PHASE_OUT_RATE || 0.05;

        let liftAmt = Math.min(liftMax, earnedIncome * liftRate);
        let liftPhaseOut = Math.max(0, (craTaxableIncome - liftPhaseStart) * liftPhaseRate);
        let liftCredit = Math.max(0, liftAmt - liftPhaseOut);
        provTax = Math.max(0, provTax - liftCredit);

        let surtax = 0; 
        if (taxData.ON.surtax) { 
            if (provTax > taxData.ON.surtax.t1) surtax += (provTax - taxData.ON.surtax.t1) * taxData.ON.surtax.r1; 
            if (provTax > taxData.ON.surtax.t2) surtax += (provTax - taxData.ON.surtax.t2) * taxData.ON.surtax.r2; 
        } 
        provTax += surtax;

        let otrBase = (constants.ON_OTR_BASE || 284) * baseInflation;
        if (spouseIncome >= 0 && spouseIncome < provBpa) otrBase += ((constants.ON_OTR_BASE || 284) * baseInflation); 
        let otrAmount = (otrBase * 2) - provTax;
        if (otrAmount > 0) provTax = Math.max(0, provTax - otrAmount);
        
        let ohp = 0;
        let ohpTiers = constants.ON_OHP_TIERS || [
            { threshold: 20000, base: 0,   maxAdd: 300, rate: 0.06 },
            { threshold: 36000, base: 300, maxAdd: 150, rate: 0.06 },
            { threshold: 48000, base: 450, maxAdd: 150, rate: 0.25 },
            { threshold: 72000, base: 600, maxAdd: 150, rate: 0.25 },
            { threshold: 200000, base: 750, maxAdd: 150, rate: 0.25 }
        ];
        for (let i = ohpTiers.length - 1; i >= 0; i--) {
            let tier = ohpTiers[i];
            if (craTaxableIncome > tier.threshold * baseInflation) {
                ohp = tier.base + Math.min(tier.maxAdd, (craTaxableIncome - tier.threshold * baseInflation) * tier.rate);
                break;
            }
        }
        provTax += ohp;

    } else {
        provTax = Math.max(0, provTax - provDividendCredit);
        if (province === 'PE' && taxData.PE.surtax && provTax > taxData.PE.surtax.t1) {
            provTax += (provTax - taxData.PE.surtax.t1) * taxData.PE.surtax.r1;
        }
    }

    if (province === 'QC' && taxData.QC.abatement) {
        fedTax = Math.max(0, fedTax - (fedTax * taxData.QC.abatement));
    }

    let cpp_ei_total = cppBasePremium + cppEnhancedPremium + eiPremium;
    let finalTotalTax = fedTax + provTax + cpp_ei_total + oasClawback;

    // ---------------------------------------------------------
    // 6. TRUE MARGINAL RATE SIMULATION
    // ---------------------------------------------------------
    let trueMargRate = 0;
    if (!isMarginalRun) {
        let margRun = calculateTaxDetailed(
            craTaxableIncome + 100, province, taxData, constants, oasReceived, oasThreshold, 
            earnedIncome + 100, baseInflation, actualDividendIncome, age, eligiblePension, spouseIncome, isEligibleDividend, true
        );
        trueMargRate = Math.max(0, (margRun.totalTax - finalTotalTax) / 100);
    }

    return { 
        fed: fedTax, 
        prov: provTax, 
        cpp_ei: cpp_ei_total, 
        oas_clawback: oasClawback, 
        totalTax: finalTotalTax, 
        margRate: trueMargRate 
    };
}