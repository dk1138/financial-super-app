// lib/engine/tax.ts
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

export function calculateTaxDetailed(craTaxableIncome: number, province: string, taxData: any, constants: any, oasReceived = 0, oasThreshold = 0, earnedIncome = 0, baseInflation = 1, actualDividendIncome = 0, age = 0, eligiblePension = 0, spouseIncome = -1, isEligibleDividend = true, credits: any = {}) {
    if (craTaxableIncome <= 0) {
        return { fed: 0, prov: 0, cpp_ei: 0, oas_clawback: 0, totalTax: 0, margRate: 0 };
    }
    
    let oasClawback = 0;
    let oasMarginalRate = 0;
    
    if (oasReceived > 0 && oasThreshold > 0 && craTaxableIncome > oasThreshold) {
        oasClawback = (craTaxableIncome - oasThreshold) * 0.15;
        if (oasClawback < oasReceived) {
            oasMarginalRate = 0.15; 
        } else {
            oasClawback = oasReceived; 
        }
    }

    let cppBasePremium = 0;
    let cppEnhancedPremium = 0;
    
    let yearlyMaxPensionableEarnings = (constants.YMPE || 74600) * baseInflation; 
    let yearlyAdditionalMaxPensionableEarnings = (constants.YAMPE || 85000) * baseInflation; 
    let eiMaxInsurableEarnings = (constants.EI_MAX_INSURABLE || 68900) * baseInflation; 
    
    // BUG FIX: The $3500 CPP exemption is statutory and NEVER indexes with inflation
    let cppExemption = constants.CPP_EXEMPTION || 3500;

    let cppRate = constants.CPP_RATE || 0.0495;
    let cppEnhancedRate = constants.CPP_ENHANCED_RATE || 0.01;
    let cppEnhancedTier2Rate = constants.CPP_ENHANCED_TIER2_RATE || 0.04;
    let eiRate = constants.EI_RATE || 0.0163;

    if (earnedIncome > cppExemption) {
        cppBasePremium += (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppRate; 
        cppEnhancedPremium += (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppEnhancedRate;
    }
    if (earnedIncome > yearlyMaxPensionableEarnings) {
        cppEnhancedPremium += (Math.min(earnedIncome, yearlyAdditionalMaxPensionableEarnings) - yearlyMaxPensionableEarnings) * cppEnhancedTier2Rate;
    }
    
    const eiPremium = Math.min(earnedIncome, eiMaxInsurableEarnings) * eiRate; 

    let taxIncomeForFedProv = Math.max(0, craTaxableIncome - cppEnhancedPremium - oasClawback);
    
    const fedCalc = calculateProgressiveTax(taxIncomeForFedProv, taxData.FED.brackets, taxData.FED.rates);
    const provCalc = calculateProgressiveTax(
        taxIncomeForFedProv, 
        taxData[province]?.brackets || [999999999], 
        taxData[province]?.rates || [0.10]
    );
    
    let fedTax = fedCalc.tax;
    let provTax = provCalc.tax;
    let fedMarginalRate = fedCalc.marginalRate;
    let provMarginalRate = provCalc.marginalRate;

    // --- FED/PROV BPA CREDITS ---
    let bpaMax = (constants.BPA_MAX_FED || 16452) * baseInflation;
    let bpaMin = (constants.BPA_MIN_FED || 14829) * baseInflation;
    let bpaPhaseStart = (constants.BPA_PHASE_START_FED || 181440) * baseInflation;
    let bpaPhaseEnd = (constants.BPA_PHASE_END_FED || 258482) * baseInflation;
    
    let fedBpa = bpaMax;
    if (craTaxableIncome > bpaPhaseStart) {
        let reduction = (craTaxableIncome - bpaPhaseStart) * ((bpaMax - bpaMin) / (bpaPhaseEnd - bpaPhaseStart));
        fedBpa = Math.max(bpaMin, bpaMax - reduction);
    }
    
    let provBpaAmounts = constants.PROV_BPA || { 'ON': 12989 };
    let provBpa = (provBpaAmounts[province] || 15000) * baseInflation;

    let lowestFedRate = taxData.FED?.rates?.[0] || 0.14; 
    let fedBpaCredit = fedBpa * lowestFedRate; 
    
    let provRateLowest = taxData[province]?.rates?.[0] || 0.0505;
    let provBpaCredit = provBpa * provRateLowest;

    let fedSpousalCredit = 0;
    let provSpousalCredit = 0;
    if (spouseIncome >= 0 && spouseIncome < fedBpa) {
        let fedSpousalAmt = Math.max(0, fedBpa - spouseIncome);
        fedSpousalCredit = fedSpousalAmt * lowestFedRate;
    }
    if (spouseIncome >= 0 && spouseIncome < provBpa) {
        let provSpousalAmt = Math.max(0, provBpa - spouseIncome);
        provSpousalCredit = provSpousalAmt * provRateLowest;
    }

    fedTax = Math.max(0, fedTax - fedBpaCredit - fedSpousalCredit);
    provTax = Math.max(0, provTax - provBpaCredit - provSpousalCredit);

    let effectiveFedZeroBracket = fedBpa + (spouseIncome >= 0 && spouseIncome < fedBpa ? (fedBpa - spouseIncome) : 0);
    let effectiveProvZeroBracket = provBpa + (spouseIncome >= 0 && spouseIncome < provBpa ? (provBpa - spouseIncome) : 0);
    if (taxIncomeForFedProv <= effectiveFedZeroBracket) fedMarginalRate = 0;
    if (taxIncomeForFedProv <= effectiveProvZeroBracket) provMarginalRate = 0;

    let fedEmploymentCredit = 0;
    if (earnedIncome > 0) {
        fedEmploymentCredit = Math.min(earnedIncome, (constants.FED_EMPLOYMENT_AMOUNT || 1501) * baseInflation) * lowestFedRate;
    }

    let fedAgeCredit = 0;
    let provAgeCredit = 0;
    if (age >= 65) {
        let fedAgeBase = constants.FED_AGE_AMOUNT || 9212;
        let fedAgePhase = constants.FED_AGE_PHASE_START || 46432;
        let ageAmt = Math.max(0, fedAgeBase * baseInflation - Math.max(0, craTaxableIncome - fedAgePhase * baseInflation) * 0.15);
        fedAgeCredit = ageAmt * lowestFedRate; 
        
        let provAgeBase = constants.PROV_AGE_AMOUNT?.[province] || 6342;
        let provAgePhase = constants.PROV_AGE_PHASE_START?.[province] || 47210;
        let provAgeAmt = Math.max(0, provAgeBase * baseInflation - Math.max(0, craTaxableIncome - provAgePhase * baseInflation) * 0.15);
        provAgeCredit = provAgeAmt * provRateLowest; 
    }
    
    let fedPensionCredit = 0;
    let provPensionCredit = 0;
    if (eligiblePension > 0) {
        fedPensionCredit = Math.min(eligiblePension, constants.FED_PENSION_AMOUNT || 2000) * lowestFedRate;
        provPensionCredit = Math.min(eligiblePension, constants.PROV_PENSION_AMOUNT?.[province] || 1796) * provRateLowest; 
    }

    let fedCppEiCredit = (cppBasePremium + eiPremium) * lowestFedRate;
    let provCppEiCredit = (cppBasePremium + eiPremium) * provRateLowest; 

    // --- ADDITIONAL NON-REFUNDABLE TAX CREDITS ---
    let fedDisabilityCredit = 0;
    let provDisabilityCredit = 0;
    if (credits.disability) {
        fedDisabilityCredit = (constants.FED_DISABILITY_AMOUNT || 10138) * baseInflation * lowestFedRate;
        provDisabilityCredit = (constants.PROV_DISABILITY_AMOUNT?.[province] || 9000) * baseInflation * provRateLowest;
    }

    let fedCaregiverCredit = 0;
    if (credits.caregiver) {
        fedCaregiverCredit = (constants.FED_CAREGIVER_AMOUNT || 8500) * baseInflation * lowestFedRate;
    }

    let fedMedicalCredit = 0;
    if (credits.medicalExpenses > 0) {
        let medThreshold = Math.min((constants.FED_MEDICAL_EXPENSE_THRESHOLD_MAX || 2900) * baseInflation, craTaxableIncome * (constants.FED_MEDICAL_EXPENSE_THRESHOLD_RATE || 0.03));
        let eligibleMed = Math.max(0, credits.medicalExpenses * baseInflation - medThreshold);
        fedMedicalCredit = eligibleMed * lowestFedRate;
    }

    let fedDonationCredit = 0;
    if (credits.donations > 0) {
        let don = credits.donations * baseInflation;
        let thresh = constants.FED_CHARITABLE_DONATION_THRESHOLD || 200;
        if (don <= thresh) {
            fedDonationCredit = don * (constants.FED_CHARITABLE_DONATION_RATE_1 || 0.15);
        } else {
            let topRateInc = Math.max(0, craTaxableIncome - ((constants.BPA_PHASE_END_FED || 258482) * baseInflation)); // Income subject to 33% bracket
            let eligibleFor33 = Math.min(don - thresh, topRateInc);
            let eligibleFor29 = Math.max(0, don - thresh - eligibleFor33);
            fedDonationCredit = (thresh * (constants.FED_CHARITABLE_DONATION_RATE_1 || 0.15)) + 
                                (eligibleFor33 * (constants.FED_CHARITABLE_DONATION_RATE_3 || 0.33)) +
                                (eligibleFor29 * (constants.FED_CHARITABLE_DONATION_RATE_2 || 0.29));
        }
    }

    let fedHomeBuyerCredit = 0;
    if (credits.firstTimeHomeBuyer) {
        fedHomeBuyerCredit = (constants.FED_HOME_BUYERS_AMOUNT || 10000) * lowestFedRate; 
    }
    
    let fedTuitionCredit = 0;
    if (credits.tuition > 0) {
        fedTuitionCredit = credits.tuition * baseInflation * (constants.FED_TUITION_RATE || 0.15);
    }
    
    let fedStudentLoanCredit = 0;
    if (credits.studentLoanInterest > 0) {
        fedStudentLoanCredit = credits.studentLoanInterest * baseInflation * (constants.FED_STUDENT_LOAN_INTEREST_RATE || 0.15);
    }
    
    fedTax = Math.max(0, fedTax - fedAgeCredit - fedPensionCredit - fedCppEiCredit - fedEmploymentCredit - fedDisabilityCredit - fedCaregiverCredit - fedMedicalCredit - fedDonationCredit - fedHomeBuyerCredit - fedTuitionCredit - fedStudentLoanCredit);
    provTax = Math.max(0, provTax - provAgeCredit - provPensionCredit - provCppEiCredit - provDisabilityCredit);
    
    let grossUp = isEligibleDividend ? (constants.DIVIDEND_GROSS_UP_ELIGIBLE || 1.38) : (constants.DIVIDEND_GROSS_UP_NON_ELIGIBLE || 1.15);
    let grossedUpDividend = actualDividendIncome * grossUp;
    
    let fedDivRate = isEligibleDividend ? (constants.FED_DIVIDEND_CREDIT_RATE_ELIGIBLE || 0.150198) : (constants.FED_DIVIDEND_CREDIT_RATE_NON_ELIGIBLE || 0.090301);
    let fedDividendCredit = grossedUpDividend * fedDivRate;
    
    let provDivRates = isEligibleDividend ? (constants.PROV_DIV_CREDIT_ELIGIBLE || {}) : (constants.PROV_DIV_CREDIT_NON_ELIGIBLE || {});
    let provDividendCredit = grossedUpDividend * (provDivRates[province] || 0.10);

    if (province === 'ON') { 
        provTax = Math.max(0, provTax - provDividendCredit);
        
        let surtax = 0; 
        // BUG FIX: Surtax is calculated BEFORE LIFT and OTR are applied. 
        if (taxData.ON.surtax) { 
            if (provTax > taxData.ON.surtax.t1) {
                surtax += (provTax - taxData.ON.surtax.t1) * taxData.ON.surtax.r1; 
            }
            if (provTax > taxData.ON.surtax.t2) {
                surtax += (provTax - taxData.ON.surtax.t2) * taxData.ON.surtax.r2; 
            }
        } 
        
        if (surtax > 0) {
            if (provTax > (taxData.ON.surtax.t2 || 7446)) {
                provMarginalRate *= 1.56; 
            } else {
                provMarginalRate *= 1.20;
            }
        }
        
        // Add surtax to basic Ontario tax first
        provTax += surtax;

        // Apply LIFT (Low-Income Individuals and Families Tax Credit)
        let liftMax = (constants.ON_LIFT_MAX || 875) * baseInflation;
        let liftRate = constants.ON_LIFT_RATE || 0.0505;
        let liftPhaseStart = (constants.ON_LIFT_PHASE_OUT_START || 32500) * baseInflation;
        let liftPhaseRate = constants.ON_LIFT_PHASE_OUT_RATE || 0.05;

        let liftAmt = Math.min(liftMax, earnedIncome * liftRate);
        let liftPhaseOut = Math.max(0, (craTaxableIncome - liftPhaseStart) * liftPhaseRate);
        let liftCredit = Math.max(0, liftAmt - liftPhaseOut);
        
        provTax = Math.max(0, provTax - liftCredit);

        // Apply OTR (Ontario Tax Reduction)
        let otrBase = (constants.ON_OTR_BASE || 284) * baseInflation;
        if (spouseIncome >= 0 && spouseIncome < provBpa) {
            otrBase += ((constants.ON_OTR_BASE || 284) * baseInflation); 
        }
        
        let otrAmount = (otrBase * 2) - provTax;
        if (otrAmount > 0) {
            provTax = Math.max(0, provTax - otrAmount);
        }
        
        // Calculate Ontario Health Premium
        let ohp = 0;
        let ti = craTaxableIncome;
        let ohpTiers = constants.ON_OHP_TIERS || [
            { threshold: 20000, base: 0,   maxAdd: 300, rate: 0.06 },
            { threshold: 36000, base: 300, maxAdd: 150, rate: 0.06 },
            { threshold: 48000, base: 450, maxAdd: 150, rate: 0.25 },
            { threshold: 72000, base: 600, maxAdd: 150, rate: 0.25 },
            { threshold: 200000, base: 750, maxAdd: 150, rate: 0.25 }
        ];

        for (let i = ohpTiers.length - 1; i >= 0; i--) {
            let tier = ohpTiers[i];
            if (ti > tier.threshold) {
                ohp = tier.base + Math.min(tier.maxAdd, (ti - tier.threshold) * tier.rate);
                break;
            }
        }
        provTax += ohp;

    } else {
        provTax = Math.max(0, provTax - provDividendCredit);
        
        // Note: PEI dropped its surtax. Code to handle PEI surtax has been safely removed. 
    }

    fedTax = Math.max(0, fedTax - fedDividendCredit);
    
    if (province === 'QC' && taxData.QC.abatement) {
        fedTax = Math.max(0, fedTax - (fedTax * taxData.QC.abatement));
    }

    let actualMargRate = fedMarginalRate + provMarginalRate;
    if (oasMarginalRate > 0) {
        actualMargRate = 0.15 + 0.85 * (fedMarginalRate + provMarginalRate);
    }
    
    return { 
        fed: fedTax, 
        prov: provTax, 
        cpp_ei: cppBasePremium + cppEnhancedPremium + eiPremium, 
        oas_clawback: oasClawback, 
        totalTax: fedTax + provTax + cppBasePremium + cppEnhancedPremium + eiPremium + oasClawback, 
        margRate: actualMargRate 
    };
}