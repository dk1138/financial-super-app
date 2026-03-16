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
        
        // Handle the scalable surtaxes array
        if (data.surtaxes && Array.isArray(data.surtaxes)) { 
            data.surtaxes = data.surtaxes.map((s: any) => ({
                ...s,
                threshold: s.threshold * baseInflation
            }));
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
        return { fed: 0, prov: 0, cpp_ei: 0, cpp: 0, cpp2: 0, ei: 0, oas_clawback: 0, totalTax: 0, margRate: 0, nrtc: { donations: 0, caregiver: 0, medical: 0, homeBuyer: 0, disability: 0 }, rtc: { transit: 0 }, surtax: 0, ohp: 0 };
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
    let cppTier1Enhanced = 0;
    let cppTier2 = 0;
    
    // CRA 2024 Exact Fallbacks
    let yearlyMaxPensionableEarnings = (constants.YMPE || 68500) * baseInflation; 
    let yearlyAdditionalMaxPensionableEarnings = (constants.YAMPE || 73200) * baseInflation; 
    let eiMaxInsurableEarnings = (constants.EI_MAX_INSURABLE || 63200) * baseInflation; 
    
    let cppExemption = constants.CPP_EXEMPTION || 3500; // Never inflates

    let cppRate = constants.CPP_RATE || 0.0495;
    let cppEnhancedRate = constants.CPP_ENHANCED_RATE || 0.01;
    let cppEnhancedTier2Rate = constants.CPP_ENHANCED_TIER2_RATE || 0.04;
    let eiRate = constants.EI_RATE || 0.0166;

    if (earnedIncome > cppExemption) {
        cppBasePremium = (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppRate; 
        cppTier1Enhanced = (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppEnhancedRate;
    }
    if (earnedIncome > yearlyMaxPensionableEarnings) {
        cppTier2 = (Math.min(earnedIncome, yearlyAdditionalMaxPensionableEarnings) - yearlyMaxPensionableEarnings) * cppEnhancedTier2Rate;
    }
    
    let cppEnhancedPremium = cppTier1Enhanced + cppTier2;
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

    // --- FED/PROV BPA CREDITS (2024 Exact Fallbacks) ---
    let bpaMax = (constants.BPA_MAX_FED || 15705) * baseInflation;
    let bpaMin = (constants.BPA_MIN_FED || 14156) * baseInflation;
    let bpaPhaseStart = (constants.BPA_PHASE_START_FED || 173205) * baseInflation;
    let bpaPhaseEnd = (constants.BPA_PHASE_END_FED || 246752) * baseInflation;
    
    let fedBpa = bpaMax;
    if (craTaxableIncome > bpaPhaseStart) {
        let reduction = (craTaxableIncome - bpaPhaseStart) * ((bpaMax - bpaMin) / (bpaPhaseEnd - bpaPhaseStart));
        fedBpa = Math.max(bpaMin, bpaMax - reduction);
    }
    
    let provBpaAmounts = constants.PROV_BPA || { 'ON': 12399 }; 
    let provBpa = (provBpaAmounts[province] || 15000) * baseInflation;

    let lowestFedRate = taxData.FED?.rates?.[0] || 0.15; 
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
        fedEmploymentCredit = Math.min(earnedIncome, (constants.FED_EMPLOYMENT_AMOUNT || 1433) * baseInflation) * lowestFedRate;
    }

    let fedAgeCredit = 0;
    let provAgeCredit = 0;
    if (age >= 65) {
        let fedAgeBase = constants.FED_AGE_AMOUNT || 8790;
        let fedAgePhase = constants.FED_AGE_PHASE_START || 44325;
        let ageAmt = Math.max(0, fedAgeBase * baseInflation - Math.max(0, craTaxableIncome - fedAgePhase * baseInflation) * 0.15);
        fedAgeCredit = ageAmt * lowestFedRate; 
        
        let provAgeBase = constants.PROV_AGE_AMOUNT?.[province] || 6054;
        let provAgePhase = constants.PROV_AGE_PHASE_START?.[province] || 45068;
        let provAgeAmt = Math.max(0, provAgeBase * baseInflation - Math.max(0, craTaxableIncome - provAgePhase * baseInflation) * 0.15);
        provAgeCredit = provAgeAmt * provRateLowest; 
    }
    
    let fedPensionCredit = 0;
    let provPensionCredit = 0;
    if (eligiblePension > 0) {
        fedPensionCredit = Math.min(eligiblePension, constants.FED_PENSION_AMOUNT || 2000) * lowestFedRate;
        provPensionCredit = Math.min(eligiblePension, constants.PROV_PENSION_AMOUNT?.[province] || 1681) * provRateLowest; 
    }

    let fedCppEiCredit = (cppBasePremium + eiPremium) * lowestFedRate;
    let provCppEiCredit = (cppBasePremium + eiPremium) * provRateLowest; 

    // --- ADDITIONAL NON-REFUNDABLE TAX CREDITS ---
    let fedDisabilityCredit = 0;
    let provDisabilityCredit = 0;
    if (credits.disability) {
        fedDisabilityCredit = (constants.FED_DISABILITY_AMOUNT || 9872) * baseInflation * lowestFedRate;
        provDisabilityCredit = (constants.PROV_DISABILITY_AMOUNT?.[province] || 9800) * baseInflation * provRateLowest;
    }

    let fedCaregiverCredit = 0;
    let provCaregiverCredit = 0;
    
    let under18Share = credits.caregiver_under_18_share || 0;
    let over18Share = credits.caregiver_over_18_share || 0;

    if (under18Share > 0) {
        fedCaregiverCredit += (constants.FED_CAREGIVER_AMOUNT_UNDER_18 || 2616) * baseInflation * lowestFedRate * under18Share;
        provCaregiverCredit += (constants.PROV_CAREGIVER_AMOUNT_UNDER_18?.[province] || 0) * baseInflation * provRateLowest * under18Share;
    }
    
    if (over18Share > 0) {
        fedCaregiverCredit += (constants.FED_CAREGIVER_AMOUNT_OVER_18 || 8375) * baseInflation * lowestFedRate * over18Share;
        provCaregiverCredit += (constants.PROV_CAREGIVER_AMOUNT_OVER_18?.[province] || 5700) * baseInflation * provRateLowest * over18Share;
    }

    let fedMedicalCredit = 0;
    let provMedicalCredit = 0;
    if (credits.medicalExpenses > 0) {
        let medExp = credits.medicalExpenses * baseInflation;
        let medRate = constants.FED_MEDICAL_EXPENSE_THRESHOLD_RATE || 0.03;
        
        let fedMedMax = (constants.FED_MEDICAL_EXPENSE_THRESHOLD_MAX || 2759) * baseInflation;
        let fedMedThreshold = Math.min(fedMedMax, craTaxableIncome * medRate);
        let fedEligibleMed = Math.max(0, medExp - fedMedThreshold);
        fedMedicalCredit = fedEligibleMed * lowestFedRate;

        let provMedMaxBase = constants.PROV_MEDICAL_EXPENSE_THRESHOLD_MAX?.[province];
        let provMedMax = (provMedMaxBase !== undefined && provMedMaxBase > 0) ? (provMedMaxBase * baseInflation) : Infinity; 
        let provMedThreshold = Math.min(provMedMax, craTaxableIncome * medRate);
        let provEligibleMed = Math.max(0, medExp - provMedThreshold);
        provMedicalCredit = provEligibleMed * provRateLowest;
    }

    let fedHomeBuyerCredit = 0;
    let provHomeBuyerCredit = 0;
    if (credits.firstTimeHomeBuyer) {
        fedHomeBuyerCredit = (constants.FED_HOME_BUYERS_AMOUNT || 10000) * lowestFedRate; 
        if (province === 'QC' || province === 'SK') {
            provHomeBuyerCredit = (constants.PROV_HOME_BUYERS_AMOUNT?.[province] || 10000) * provRateLowest;
        }
    }

    let fedDonationCredit = 0;
    let provDonationCredit = 0;
    if (credits.donations > 0) {
        let don = credits.donations * baseInflation;
        let thresh = constants.CHARITABLE_DONATION_THRESHOLD || 200;
        
        let fedRate1 = constants.FED_CHARITABLE_DONATION_RATE_1 || 0.15;
        let fedRate2 = constants.FED_CHARITABLE_DONATION_RATE_2 || 0.29;
        let fedRate3 = constants.FED_CHARITABLE_DONATION_RATE_3 || 0.33;
        
        if (don <= thresh) {
            fedDonationCredit = don * fedRate1;
        } else {
            let topRateInc = Math.max(0, craTaxableIncome - ((constants.BPA_PHASE_END_FED || 246752) * baseInflation)); 
            let eligibleFor33 = Math.min(don - thresh, topRateInc);
            let eligibleFor29 = Math.max(0, don - thresh - eligibleFor33);
            fedDonationCredit = (thresh * fedRate1) + (eligibleFor33 * fedRate3) + (eligibleFor29 * fedRate2);
        }

        let provRate1 = constants.PROV_DONATION_RATE_1?.[province] || provRateLowest;
        let provRate2 = constants.PROV_DONATION_RATE_2?.[province] || (taxData[province]?.rates?.[taxData[province]?.rates?.length - 1] || 0.1316);

        if (don <= thresh) {
            provDonationCredit = don * provRate1;
        } else {
            provDonationCredit = (thresh * provRate1) + ((don - thresh) * provRate2);
        }
    }
    
    let fedTuitionCredit = 0;
    if (credits.tuition > 0) {
        fedTuitionCredit = credits.tuition * baseInflation * (constants.FED_TUITION_RATE || 0.15);
    }
    
    let fedStudentLoanCredit = 0;
    if (credits.studentLoanInterest > 0) {
        fedStudentLoanCredit = credits.studentLoanInterest * baseInflation * (constants.FED_STUDENT_LOAN_INTEREST_RATE || 0.15);
    }
    
    fedTax = Math.max(0, fedTax - fedAgeCredit - fedPensionCredit - fedCppEiCredit - fedEmploymentCredit - fedDisabilityCredit - fedCaregiverCredit - fedMedicalCredit - fedHomeBuyerCredit - fedDonationCredit - fedTuitionCredit - fedStudentLoanCredit);
    provTax = Math.max(0, provTax - provAgeCredit - provPensionCredit - provCppEiCredit - provDisabilityCredit - provCaregiverCredit - provMedicalCredit - provHomeBuyerCredit - provDonationCredit);
    
    let grossUp = isEligibleDividend ? (constants.DIVIDEND_GROSS_UP_ELIGIBLE || 1.38) : (constants.DIVIDEND_GROSS_UP_NON_ELIGIBLE || 1.15);
    let grossedUpDividend = actualDividendIncome * grossUp;
    
    let fedDivRate = isEligibleDividend ? (constants.FED_DIVIDEND_CREDIT_RATE_ELIGIBLE || 0.150198) : (constants.FED_DIVIDEND_CREDIT_RATE_NON_ELIGIBLE || 0.090301);
    let fedDividendCredit = grossedUpDividend * fedDivRate;
    
    let provDivRates = isEligibleDividend ? (constants.PROV_DIV_CREDIT_ELIGIBLE || {}) : (constants.PROV_DIV_CREDIT_NON_ELIGIBLE || {});
    let provDivCreditFallback = isEligibleDividend ? 0.10 : 0.029863; 
    let provDividendCredit = grossedUpDividend * (provDivRates[province] || provDivCreditFallback);

    let ontarioSurtaxAmt = 0;
    let ontarioHealthPremium = 0;

    if (province === 'ON') { 
        provTax = Math.max(0, provTax - provDividendCredit);
        
        // 1. ONTARIO SURTAX 
        let s1 = 5554 * baseInflation;
        let s2 = 7108 * baseInflation;
        let surtaxMultiplier = 1;
        
        if (provTax > s1) {
            ontarioSurtaxAmt += (provTax - s1) * 0.20;
            surtaxMultiplier += 0.20;
        }
        if (provTax > s2) {
            ontarioSurtaxAmt += (provTax - s2) * 0.36; 
            surtaxMultiplier += 0.36;
        }
        
        if (ontarioSurtaxAmt > 0) provMarginalRate *= surtaxMultiplier;
        provTax += ontarioSurtaxAmt;

        // 2. LIFT CREDIT
        let liftMax = (constants.ON_LIFT_MAX || 875) * baseInflation;
        let liftRate = constants.ON_LIFT_RATE || 0.0505;
        let liftPhaseStart = (constants.ON_LIFT_PHASE_OUT_START || 32500) * baseInflation;
        let liftPhaseRate = constants.ON_LIFT_PHASE_OUT_RATE || 0.05;

        let liftAmt = Math.min(liftMax, earnedIncome * liftRate);
        let liftPhaseOut = Math.max(0, (craTaxableIncome - liftPhaseStart) * liftPhaseRate);
        let liftCredit = Math.max(0, liftAmt - liftPhaseOut);
        
        provTax = Math.max(0, provTax - liftCredit);

        // 3. ONTARIO TAX REDUCTION
        let otrBase = (constants.ON_OTR_BASE || 284) * baseInflation;
        if (spouseIncome >= 0 && spouseIncome < provBpa) {
            otrBase += ((constants.ON_OTR_BASE || 284) * baseInflation); 
        }
        
        let line80 = otrBase * 2;
        let line81 = provTax;
        let line82 = Math.max(0, line80 - line81);
        let otrAmount = Math.max(0, otrBase - line82);
        
        provTax = Math.max(0, provTax - otrAmount);
        
        // 4. ONTARIO HEALTH PREMIUM (OHP)
        let ti = craTaxableIncome;
        let ohp = 0;
        
        if (ti <= 20000) {
            ohp = 0;
        } else if (ti <= 25000) {
            ohp = (ti - 20000) * 0.06;
        } else if (ti <= 36000) {
            ohp = 300;
        } else if (ti <= 38500) {
            ohp = 300 + (ti - 36000) * 0.06;
        } else if (ti <= 48000) {
            ohp = 450;
        } else if (ti <= 48600) {
            ohp = 450 + (ti - 48000) * 0.25;
        } else if (ti <= 72000) {
            ohp = 600;
        } else if (ti <= 72600) {
            ohp = 600 + (ti - 72000) * 0.25;
        } else if (ti <= 200000) {
            ohp = 750;
        } else if (ti <= 200600) {
            ohp = 750 + (ti - 200000) * 0.25;
        } else {
            ohp = 900;
        }
        
        ontarioHealthPremium = ohp;
        provTax += ontarioHealthPremium;

    } else {
        provTax = Math.max(0, provTax - provDividendCredit);
    }

    fedTax = Math.max(0, fedTax - fedDividendCredit);
    
    if (province === 'QC' && taxData.QC.abatement) {
        fedTax = Math.max(0, fedTax - (fedTax * taxData.QC.abatement));
    }

    // --- REFUNDABLE TAX CREDITS ---
    let provTransitCredit = 0;
    if (province === 'ON' && age >= (constants.ON_SENIORS_TRANSIT_ELIGIBLE_AGE || 65) && credits.transit > 0) {
        let maxTransitExpense = (constants.ON_SENIORS_TRANSIT_MAX_EXPENSE || 3000) * baseInflation;
        let eligibleTransit = Math.min(credits.transit * baseInflation, maxTransitExpense);
        provTransitCredit = eligibleTransit * (constants.ON_SENIORS_TRANSIT_RATE || 0.15);
        provTax -= provTransitCredit; 
    }

    let actualMargRate = fedMarginalRate + provMarginalRate;
    if (oasMarginalRate > 0) {
        actualMargRate = 0.15 + 0.85 * (fedMarginalRate + provMarginalRate);
    }
    
    return { 
            fed: fedTax, 
            prov: provTax, 
            cppPremium: cppBasePremium + cppEnhancedPremium, // <-- ADD THIS
            eiPremium: eiPremium,                            // <-- ADD THIS
            cpp_ei: cppBasePremium + cppEnhancedPremium + eiPremium, 
            oas_clawback: oasClawback, 
            surtax: ontarioSurtaxAmt, 
            ohp: ontarioHealthPremium, 
            totalTax: fedTax + provTax + cppBasePremium + cppEnhancedPremium + eiPremium + oasClawback, 
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