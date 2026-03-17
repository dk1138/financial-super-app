export function getInflatedTaxData(baseTaxData: any, baseInflation: number) {
    let taxData = JSON.parse(JSON.stringify(baseTaxData || {}));
    
    Object.values(taxData).forEach((data: any) => { 
        if (data.brackets) {
            data.brackets = data.brackets.map((bracket: number) => {
                // ON top brackets are fixed by the provincial government
                if (bracket === 150000 || bracket === 220000) return bracket; 
                return bracket * baseInflation;
            });
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
        return { fed: 0, prov: 0, cppPremium: 0, cpp2Premium: 0, eiPremium: 0, cpp_ei: 0, oas_clawback: 0, totalTax: 0, margRate: 0, nrtc: { donations: 0, caregiver: 0, medical: 0, homeBuyer: 0, disability: 0 }, rtc: { transit: 0 }, surtax: 0, ohp: 0 };
    }
    
    // --- 1. DIVIDEND GROSS UP ---
    // The phantom gross-up is added to Net Income to properly trigger phase-outs (like BPA and Age Amount)
    let grossUpRate = isEligibleDividend ? 1.38 : 1.15;
    let dividendGrossUpDiff = actualDividendIncome > 0 ? (actualDividendIncome * grossUpRate) - actualDividendIncome : 0;
    let netIncome = craTaxableIncome + dividendGrossUpDiff;

    // --- 2. OAS CLAWBACK ---
    let oasClawback = 0;
    let oasMarginalRate = 0;
    if (oasReceived > 0 && oasThreshold > 0 && netIncome > oasThreshold) {
        oasClawback = (netIncome - oasThreshold) * 0.15;
        if (oasClawback < oasReceived) {
            oasMarginalRate = 0.15; 
        } else {
            oasClawback = oasReceived; 
        }
    }

    // --- 3. CPP & EI PREMIUMS ---
    let cppBasePremium = 0;
    let cppEnhancedPremium = 0;
    let cppTier2Premium = 0;
    
    // 2024 Exact CRA Fallbacks
    let yearlyMaxPensionableEarnings = (constants.YMPE || 68500) * baseInflation; 
    let yearlyAdditionalMaxPensionableEarnings = (constants.YAMPE || 73200) * baseInflation; 
    let eiMaxInsurableEarnings = (constants.EI_MAX_INSURABLE || 63200) * baseInflation; 
    
    let cppExemption = constants.CPP_EXEMPTION || 3500; // Fixed stat exemption

    let cppRate = constants.CPP_RATE || 0.0495; // Base 4.95%
    let cppEnhancedRate = constants.CPP_ENHANCED_RATE || 0.01; // Tier 1 Enhanced 1%
    let cppEnhancedTier2Rate = constants.CPP_ENHANCED_TIER2_RATE || 0.04; // Tier 2 CPP2 4%
    let eiRate = constants.EI_RATE || 0.0166;

    if (earnedIncome > cppExemption) {
        cppBasePremium += (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppRate; 
        cppEnhancedPremium += (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppEnhancedRate;
    }
    if (earnedIncome > yearlyMaxPensionableEarnings) {
        cppTier2Premium += (Math.min(earnedIncome, yearlyAdditionalMaxPensionableEarnings) - yearlyMaxPensionableEarnings) * cppEnhancedTier2Rate;
    }
    
    const eiPremium = Math.min(earnedIncome, eiMaxInsurableEarnings) * eiRate; 

    // --- 4. TAXABLE INCOME (Line 26000 deductions) ---
    // Enhanced CPP (Tier 1) and CPP2 (Tier 2) are Tax Deductions. Base CPP is a Tax Credit.
    let finalTaxableIncome = Math.max(0, netIncome - cppEnhancedPremium - cppTier2Premium - oasClawback);
    
    // Exact 2024 Bracket Fallbacks to prevent JSON drift
    let fedBrackets = (taxData?.FED?.brackets && taxData.FED.brackets.length > 0) ? taxData.FED.brackets : [55867, 111733, 173205, 246752, 999999999].map(b => b * baseInflation);
    let fedRates = (taxData?.FED?.rates && taxData.FED.rates.length > 0) ? taxData.FED.rates : [0.15, 0.205, 0.26, 0.29, 0.33];
    
    let provBrackets = (taxData?.[province]?.brackets && taxData[province].brackets.length > 0) ? taxData[province].brackets : [51446, 102894, 150000, 220000, 999999999].map(b => {
        if (province === 'ON' && (b === 150000 || b === 220000)) return b; // ON top 2 fixed
        return b * baseInflation;
    });
    let provRates = (taxData?.[province]?.rates && taxData[province].rates.length > 0) ? taxData[province].rates : [0.0505, 0.0915, 0.1116, 0.1216, 0.1316];

    const fedCalc = calculateProgressiveTax(finalTaxableIncome, fedBrackets, fedRates);
    const provCalc = calculateProgressiveTax(finalTaxableIncome, provBrackets, provRates);
    
    let fedTax = fedCalc.tax;
    let provTax = provCalc.tax;
    let fedMarginalRate = fedCalc.marginalRate;
    let provMarginalRate = provCalc.marginalRate;

    // --- 5. BASE NON-REFUNDABLE TAX CREDITS (NRTCs) ---
    // Federal BPA Phase-out (2024: $15,705 down to $14,156)
    let bpaMax = (constants.BPA_MAX_FED || 15705) * baseInflation;
    let bpaMin = (constants.BPA_MIN_FED || 14156) * baseInflation;
    let bpaPhaseStart = (constants.BPA_PHASE_START_FED || 173205) * baseInflation;
    let bpaPhaseEnd = (constants.BPA_PHASE_END_FED || 246752) * baseInflation;
    
    let fedBpa = bpaMax;
    if (finalTaxableIncome > bpaPhaseStart) {
        let reduction = (finalTaxableIncome - bpaPhaseStart) * ((bpaMax - bpaMin) / (bpaPhaseEnd - bpaPhaseStart));
        fedBpa = Math.max(bpaMin, bpaMax - reduction);
    }
    
    let provBpaAmounts = constants.PROV_BPA || { 'ON': 12399 }; 
    let provBpa = (provBpaAmounts[province] || 15000) * baseInflation;

    let lowestFedRate = fedRates[0]; 
    let provRateLowest = provRates[0]; 
    
    let fedSpousalCredit = 0;
    let provSpousalCredit = 0;
    if (spouseIncome >= 0 && spouseIncome < fedBpa) {
        fedSpousalCredit = Math.max(0, fedBpa - spouseIncome) * lowestFedRate;
        provSpousalCredit = Math.max(0, provBpa - spouseIncome) * provRateLowest;
    }

    let fedEmploymentCredit = earnedIncome > 0 ? Math.min(earnedIncome, (constants.FED_EMPLOYMENT_AMOUNT || 1433) * baseInflation) * lowestFedRate : 0;
    
    // Base CPP (4.95%) and EI generate NRTCs
    let fedCppEiCredit = (cppBasePremium + eiPremium) * lowestFedRate;
    let provCppEiCredit = (cppBasePremium + eiPremium) * provRateLowest; 

    // Age Amount Phase-out
    let fedAgeCredit = 0, provAgeCredit = 0;
    if (age >= 65) {
        let fedAgeAmt = Math.max(0, (constants.FED_AGE_AMOUNT || 8790) * baseInflation - Math.max(0, finalTaxableIncome - (constants.FED_AGE_PHASE_START || 44325) * baseInflation) * 0.15);
        fedAgeCredit = fedAgeAmt * lowestFedRate; 
        
        let provAgeAmt = Math.max(0, (constants.PROV_AGE_AMOUNT?.[province] || 6054) * baseInflation - Math.max(0, finalTaxableIncome - (constants.PROV_AGE_PHASE_START?.[province] || 45068) * baseInflation) * 0.15);
        provAgeCredit = provAgeAmt * provRateLowest; 
    }
    
    let fedPensionCredit = 0, provPensionCredit = 0;
    if (eligiblePension > 0) {
        fedPensionCredit = Math.min(eligiblePension, constants.FED_PENSION_AMOUNT || 2000) * lowestFedRate;
        provPensionCredit = Math.min(eligiblePension, constants.PROV_PENSION_AMOUNT?.[province] || 1681) * provRateLowest; 
    }

    // Apply Base Credits to Progressive Tax
    fedTax = Math.max(0, fedTax - (fedBpa * lowestFedRate) - fedSpousalCredit - fedEmploymentCredit - fedCppEiCredit - fedAgeCredit - fedPensionCredit);
    provTax = Math.max(0, provTax - (provBpa * provRateLowest) - provSpousalCredit - provCppEiCredit - provAgeCredit - provPensionCredit);

    let effectiveFedZeroBracket = fedBpa + (spouseIncome >= 0 && spouseIncome < fedBpa ? (fedBpa - spouseIncome) : 0);
    let effectiveProvZeroBracket = provBpa + (spouseIncome >= 0 && spouseIncome < provBpa ? (provBpa - spouseIncome) : 0);
    if (finalTaxableIncome <= effectiveFedZeroBracket) fedMarginalRate = 0;
    if (finalTaxableIncome <= effectiveProvZeroBracket) provMarginalRate = 0;

    // --- 6. USER-SPECIFIED NRTCs ---
    let fedDisabilityCredit = credits.disability ? (constants.FED_DISABILITY_AMOUNT || 9872) * baseInflation * lowestFedRate : 0;
    let provDisabilityCredit = credits.disability ? (constants.PROV_DISABILITY_AMOUNT?.[province] || 9800) * baseInflation * provRateLowest : 0;

    let fedCaregiverCredit = 0, provCaregiverCredit = 0;
    if ((credits.caregiver_under_18_share || 0) > 0) {
        fedCaregiverCredit += (constants.FED_CAREGIVER_AMOUNT_UNDER_18 || 2616) * baseInflation * lowestFedRate * credits.caregiver_under_18_share;
        provCaregiverCredit += (constants.PROV_CAREGIVER_AMOUNT_UNDER_18?.[province] || 0) * baseInflation * provRateLowest * credits.caregiver_under_18_share;
    }
    if ((credits.caregiver_over_18_share || 0) > 0) {
        fedCaregiverCredit += (constants.FED_CAREGIVER_AMOUNT_OVER_18 || 8375) * baseInflation * lowestFedRate * credits.caregiver_over_18_share;
        provCaregiverCredit += (constants.PROV_CAREGIVER_AMOUNT_OVER_18?.[province] || 5700) * baseInflation * provRateLowest * credits.caregiver_over_18_share;
    }

    let fedMedicalCredit = 0, provMedicalCredit = 0;
    if (credits.medicalExpenses > 0) {
        let medExp = credits.medicalExpenses * baseInflation;
        let fedMedThreshold = Math.min((constants.FED_MEDICAL_EXPENSE_THRESHOLD_MAX || 2759) * baseInflation, netIncome * 0.03);
        fedMedicalCredit = Math.max(0, medExp - fedMedThreshold) * lowestFedRate;

        let provMedMax = constants.PROV_MEDICAL_EXPENSE_THRESHOLD_MAX?.[province] ? constants.PROV_MEDICAL_EXPENSE_THRESHOLD_MAX[province] * baseInflation : Infinity; 
        let provMedThreshold = Math.min(provMedMax, netIncome * 0.03);
        provMedicalCredit = Math.max(0, medExp - provMedThreshold) * provRateLowest;
    }

    let fedHomeBuyerCredit = credits.firstTimeHomeBuyer ? (constants.FED_HOME_BUYERS_AMOUNT || 10000) * lowestFedRate : 0;
    let provHomeBuyerCredit = credits.firstTimeHomeBuyer && (province === 'QC' || province === 'SK') ? (constants.PROV_HOME_BUYERS_AMOUNT?.[province] || 10000) * provRateLowest : 0;

    let fedDonationCredit = 0, provDonationCredit = 0;
    if (credits.donations > 0) {
        let don = credits.donations * baseInflation;
        let thresh = constants.CHARITABLE_DONATION_THRESHOLD || 200;
        
        if (don <= thresh) {
            fedDonationCredit = don * 0.15;
            provDonationCredit = don * provRateLowest;
        } else {
            let topRateInc = Math.max(0, finalTaxableIncome - ((constants.BPA_PHASE_END_FED || 246752) * baseInflation)); 
            let eligibleFor33 = Math.min(don - thresh, topRateInc);
            let eligibleFor29 = Math.max(0, don - thresh - eligibleFor33);
            fedDonationCredit = (thresh * 0.15) + (eligibleFor33 * 0.33) + (eligibleFor29 * 0.29);
            provDonationCredit = (thresh * provRateLowest) + ((don - thresh) * (provRates[provRates.length - 1] || 0.1316));
        }
    }
    
    // Apply User NRTCs
    fedTax = Math.max(0, fedTax - fedDisabilityCredit - fedCaregiverCredit - fedMedicalCredit - fedHomeBuyerCredit - fedDonationCredit);
    provTax = Math.max(0, provTax - provDisabilityCredit - provCaregiverCredit - provMedicalCredit - provHomeBuyerCredit - provDonationCredit);
    
    // --- 7. DIVIDEND TAX CREDITS ---
    let grossedUpDividend = actualDividendIncome * grossUpRate;
    let fedDividendCredit = grossedUpDividend * (isEligibleDividend ? 0.150198 : 0.090301);
    let provDividendCredit = grossedUpDividend * (isEligibleDividend ? 0.10 : 0.029863); // ON 2024 Exact
    
    fedTax = Math.max(0, fedTax - fedDividendCredit);
    
    // --- 8. PROVINCIAL SPECIFIC MECHANICS (ONTARIO) ---
    let ontarioSurtaxAmt = 0;
    let ontarioHealthPremium = 0;

    if (province === 'ON') { 
        // DTC is applied BEFORE Surtax
        provTax = Math.max(0, provTax - provDividendCredit);
        
        // A. ONTARIO SURTAX (Strict Additive Formula)
        let s1 = 5554 * baseInflation;
        let s2 = 7108 * baseInflation;
        let surtaxMultiplier = 1;
        
        if (provTax > s1) {
            ontarioSurtaxAmt += (provTax - s1) * 0.20;
            surtaxMultiplier += 0.20;
        }
        if (provTax > s2) {
            ontarioSurtaxAmt += (provTax - s2) * 0.36; // 36% stacks additively on top of the 20%
            surtaxMultiplier += 0.36;
        }
        
        if (ontarioSurtaxAmt > 0) provMarginalRate *= surtaxMultiplier;
        provTax += ontarioSurtaxAmt; // Surtax added to Provincial Tax

        // B. ONTARIO LIFT CREDIT
        let liftAmt = Math.min(875 * baseInflation, earnedIncome * 0.0505);
        let liftPhaseOut = Math.max(0, (netIncome - 32500 * baseInflation) * 0.05);
        provTax = Math.max(0, provTax - Math.max(0, liftAmt - liftPhaseOut));

        // C. ONTARIO TAX REDUCTION (OTR)
        // Formula: (Base Credits * 2) - Ontario Tax
        let otrBase = 284 * baseInflation;
        let otrTotalClaims = otrBase + (spouseIncome >= 0 ? otrBase : 0); // Excludes dependents for now
        let otrReduction = Math.max(0, (otrTotalClaims * 2) - provTax);
        provTax = Math.max(0, provTax - otrReduction);
        
        // D. ONTARIO HEALTH PREMIUM (Strict Taxtips Plateaus, NOT INFLATED)
        let ti = finalTaxableIncome;
        if (ti > 20000 && ti <= 25000) ontarioHealthPremium = (ti - 20000) * 0.06;
        else if (ti > 25000 && ti <= 36000) ontarioHealthPremium = 300;
        else if (ti > 36000 && ti <= 38500) ontarioHealthPremium = 300 + (ti - 36000) * 0.06;
        else if (ti > 38500 && ti <= 48000) ontarioHealthPremium = 450;
        else if (ti > 48000 && ti <= 48600) ontarioHealthPremium = 450 + (ti - 48000) * 0.25;
        else if (ti > 48600 && ti <= 72000) ontarioHealthPremium = 600;
        else if (ti > 72000 && ti <= 72600) ontarioHealthPremium = 600 + (ti - 72000) * 0.25;
        else if (ti > 72600 && ti <= 200000) ontarioHealthPremium = 750;
        else if (ti > 200000 && ti <= 200600) ontarioHealthPremium = 750 + (ti - 200000) * 0.25;
        else if (ti > 200600) ontarioHealthPremium = 900;
        
        provTax += ontarioHealthPremium;

    } else {
        provTax = Math.max(0, provTax - provDividendCredit);
    }
    
    if (province === 'QC' && taxData.QC.abatement) {
        fedTax = Math.max(0, fedTax - (fedTax * taxData.QC.abatement));
    }

    // --- 9. REFUNDABLE TAX CREDITS ---
    let provTransitCredit = 0;
    if (province === 'ON' && age >= (constants.ON_SENIORS_TRANSIT_ELIGIBLE_AGE || 65) && credits.transit > 0) {
        let maxTransitExpense = (constants.ON_SENIORS_TRANSIT_MAX_EXPENSE || 3000) * baseInflation;
        provTransitCredit = Math.min(credits.transit * baseInflation, maxTransitExpense) * 0.15;
        provTax -= provTransitCredit; // Refundable: Allowed to push provTax negative
    }

    let actualMargRate = fedMarginalRate + provMarginalRate;
    if (oasMarginalRate > 0) {
        actualMargRate = 0.15 + 0.85 * (fedMarginalRate + provMarginalRate);
    }
    
    return { 
        fed: fedTax, 
        prov: provTax, 
        cppPremium: cppBasePremium + cppEnhancedPremium,
        cpp2Premium: cppTier2Premium,
        eiPremium: eiPremium,
        cpp_ei: cppBasePremium + cppEnhancedPremium + cppTier2Premium + eiPremium, 
        oas_clawback: oasClawback, 
        surtax: ontarioSurtaxAmt, 
        ohp: ontarioHealthPremium, 
        totalTax: fedTax + provTax + cppBasePremium + cppEnhancedPremium + cppTier2Premium + eiPremium + oasClawback, 
        margRate: actualMargRate,
        nrtc: {
            donations: fedDonationCredit + provDonationCredit,
            caregiver: fedCaregiverCredit + provCaregiverCredit,
            medical: fedMedicalCredit + provMedicalCredit,
            homeBuyer: fedHomeBuyerCredit + provHomeBuyerCredit,
            disability: fedDisabilityCredit + provDisabilityCredit
        },
        rtc: {
            transit: provTransitCredit
        }
    };
}