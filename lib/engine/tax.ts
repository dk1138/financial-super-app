export function getInflatedTaxData(baseTaxData: any, baseInflation: number, yearOffset: number = 0) {
    let taxData = JSON.parse(JSON.stringify(baseTaxData || {}));
    
    Object.entries(taxData).forEach(([jur, data]: [string, any]) => { 
        if (data.brackets) {
            data.brackets = data.brackets.map((bracket: number) => {
                // ON top brackets ($150k / $220k), MB brackets ($47k / $100k), and YT SBD bracket ($500k) are statutorily unindexed
                if (jur === 'ON' && (bracket === 150000 || bracket === 220000)) return bracket;
                if (jur === 'MB' && (bracket === 47000 || bracket === 100000)) return bracket;
                if (jur === 'YT' && bracket === 500000) return bracket;
                // BC Budget 2026 paused bracket indexation for tax years 2027–2030 (yearOffset 1..4)
                if (jur === 'BC' && yearOffset > 0) {
                    if (yearOffset <= 4) return bracket;
                    const postFreezeFactor = Math.pow(baseInflation, (yearOffset - 4) / yearOffset);
                    return bracket * postFreezeFactor;
                }
                return bracket * baseInflation;
            });
        }
        
        // Surtaxes are indexed where applicable
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

/**
 * Estimates Alternative Minimum Tax (AMT) under Federal rules (2026):
 * - Basic exemption indexed to start of 4th federal tax bracket ($181,440 for 2026)
 * - 20.5% AMT flat tax rate
 * - 100% capital gains inclusion
 */
export function estimateFederalAMT(
    craTaxableIncome: number,
    standardFedTax: number,
    baseInflation: number = 1,
    totalRealizedCapitalGains: number = 0,
    amtExemptionOverride?: number
): number {
    const amtExemption = amtExemptionOverride !== undefined ? amtExemptionOverride : (181440 * baseInflation);
    // Regular taxable income already includes 50% of capital gains; AMT includes 100%
    const additionalGainUnderAMT = totalRealizedCapitalGains * 0.50; 
    const amtBase = Math.max(0, (craTaxableIncome + additionalGainUnderAMT) - amtExemption);
    const tentativeAMT = amtBase * 0.205;
    return Math.max(0, tentativeAMT - standardFedTax);
}

export function calculateTaxDetailed(
    craTaxableIncome: number, province: string, taxData: any, constants: any, 
    oasReceived = 0, oasThreshold = 0, earnedIncome = 0, baseInflation = 1, 
    actualDividendIncome = 0, age = 0, eligiblePension = 0, spouseIncome = -1, 
    isEligibleDividend = true, credits: any = {}, totalRealizedCapitalGains = 0
) {
    if (craTaxableIncome <= 0) {
        return { 
            fed: 0, prov: 0, cppPremium: 0, cpp2Premium: 0, eiPremium: 0, qpipPremium: 0, cpp_ei: 0, oas_clawback: 0, totalTax: 0, margRate: 0, 
            nrtc: { donations: 0, caregiver: 0, medical: 0, homeBuyer: 0, disability: 0, age: 0, pension: 0 }, 
            rtc: { transit: 0 }, surtax: 0, ohp: 0, amt: 0,
            nrtcDetails: {}, rtcDetails: {},
            utilizedFedNrtc: 0, utilizedProvNrtc: 0, utilizedNrtcTotal: 0
        };
    }
    
    // Strict 2026 CRA Base Rates & Brackets
    let fedRates = taxData.FED?.rates || [0.14, 0.205, 0.26, 0.29, 0.33];
    let fedBrackets = taxData.FED?.brackets || [58523, 117045, 181440, 258482];
    
    let provRates = taxData[province]?.rates || (province === 'ON' ? [0.0505, 0.0915, 0.1116, 0.1216, 0.1316] : [0.10]);
    let provBrackets = taxData[province]?.brackets || (province === 'ON' ? [53891, 107785, 150000, 220000] : [999999999]);

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
    let cppTier2Premium = 0;
    
    const isQC = province === 'QC';
    const isCppEligibleAge = age === 0 || (age >= 18 && age < 70);

    let yearlyMaxPensionableEarnings = (constants.YMPE || 74600) * baseInflation; 
    let yearlyAdditionalMaxPensionableEarnings = (constants.YAMPE || 85000) * baseInflation; 
    let eiMaxInsurableEarnings = (constants.EI_MAX_INSURABLE || 68900) * baseInflation; 
    let qpipMaxInsurableEarnings = (constants.QPIP_MAX_INSURABLE || 103000) * baseInflation;
    
    let cppExemption = constants.CPP_EXEMPTION || 3500;

    let cppRate = isQC ? (constants.QPP_RATE || 0.053) : (constants.CPP_RATE || 0.0495); 
    let cppEnhancedRate = constants.CPP_ENHANCED_RATE || 0.01; 
    let cppEnhancedTier2Rate = constants.CPP_ENHANCED_TIER2_RATE || 0.04; 
    let eiRate = isQC ? (constants.QC_EI_RATE || 0.0130) : (constants.EI_RATE || 0.0163); 

    if (isCppEligibleAge && earnedIncome > cppExemption) {
        cppBasePremium += (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppRate; 
        cppEnhancedPremium += (Math.min(earnedIncome, yearlyMaxPensionableEarnings) - cppExemption) * cppEnhancedRate;
    }
    if (isCppEligibleAge && earnedIncome > yearlyMaxPensionableEarnings) {
        cppTier2Premium += (Math.min(earnedIncome, yearlyAdditionalMaxPensionableEarnings) - yearlyMaxPensionableEarnings) * cppEnhancedTier2Rate;
    }
    
    const eiPremium = earnedIncome > 0 ? Math.min(earnedIncome, eiMaxInsurableEarnings) * eiRate : 0; 
    const qpipPremium = (isQC && (age === 0 || age >= 18) && earnedIncome > 0)
        ? Math.min(earnedIncome, qpipMaxInsurableEarnings) * (constants.QPIP_RATE || 0.0043)
        : 0;

    // Line 23600 Net Income = Line 23400 less enhanced CPP/QPP (Line 22215) and OAS Social Benefits Repayment (Line 23500)
    let taxIncomeForFedProv = Math.max(0, craTaxableIncome - cppEnhancedPremium - cppTier2Premium - oasClawback);
    
    const fedCalc = calculateProgressiveTax(taxIncomeForFedProv, fedBrackets, fedRates);
    const provCalc = calculateProgressiveTax(taxIncomeForFedProv, provBrackets, provRates);
    
    let fedTax = fedCalc.tax;
    let provTax = provCalc.tax;
    let fedMarginalRate = fedCalc.marginalRate;
    let provMarginalRate = provCalc.marginalRate;

    // --- FED/PROV BPA CREDITS (Tested against Line 23600 Net Income) ---
    let bpaMax = (constants.BPA_MAX_FED || 16452) * baseInflation;
    let bpaMin = (constants.BPA_MIN_FED || 14829) * baseInflation;
    let bpaPhaseStart = (constants.BPA_PHASE_START_FED || 181440) * baseInflation;
    let bpaPhaseEnd = (constants.BPA_PHASE_END_FED || 258482) * baseInflation;
    
    let fedBpa = bpaMax;
    if (taxIncomeForFedProv > bpaPhaseStart) {
        let reduction = (taxIncomeForFedProv - bpaPhaseStart) * ((bpaMax - bpaMin) / (bpaPhaseEnd - bpaPhaseStart));
        fedBpa = Math.max(bpaMin, bpaMax - reduction);
    }
    
    let provBpaAmounts = constants.PROV_BPA || { 'ON': 12989, 'BC': 13216, 'AB': 22769 }; 
    let provBpa = (provBpaAmounts[province] || 15000) * baseInflation;
    if (province === 'YT') {
        provBpa = fedBpa; // Yukon mirrors the federal BPA clawback formula
    } else if (province === 'MB') {
        const mbStart = 200000 * baseInflation;
        const mbEnd = 400000 * baseInflation;
        if (taxIncomeForFedProv > mbStart) {
            const mbReduction = (taxIncomeForFedProv - mbStart) * (provBpa / (mbEnd - mbStart));
            provBpa = Math.max(0, provBpa - mbReduction);
        }
    }

    let lowestFedRate = fedRates[0]; 
    let fedBpaCredit = fedBpa * lowestFedRate; 
    
    let provRateLowest = provRates[0]; 
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

    let fedCppEiCredit = (cppBasePremium + eiPremium + qpipPremium) * lowestFedRate;
    // Revenu Québec Line 350 Basic Personal Amount ($18,952) already bundles QPP, EI, and QPIP employee credits
    let provCppEiCredit = isQC ? 0 : (cppBasePremium + eiPremium) * provRateLowest; 

    // --- SNAPSHOT PRE-EXTRA TAXES (Matches Payroll Deductions) ---
    let preExtraFedTax = Math.max(0, fedTax - fedEmploymentCredit - fedCppEiCredit);
    let preExtraProvTax = Math.max(0, provTax - provCppEiCredit);

    // --- ADDITIONAL NON-REFUNDABLE TAX CREDITS ---
    let ageAmt = 0; let provAgeAmt = 0;
    let fedAgeCredit = 0; let provAgeCredit = 0;
    if (age >= 65) {
        let fedAgeBase = constants.FED_AGE_AMOUNT || 9208;
        let fedAgePhase = constants.FED_AGE_PHASE_START || 46432;
        ageAmt = Math.max(0, fedAgeBase * baseInflation - Math.max(0, taxIncomeForFedProv - fedAgePhase * baseInflation) * 0.15);
        fedAgeCredit = ageAmt * lowestFedRate; 
        
        let provAgeBase = constants.PROV_AGE_AMOUNT?.[province] || 6342;
        let provAgePhase = constants.PROV_AGE_PHASE_START?.[province] || 47210;
        provAgeAmt = Math.max(0, provAgeBase * baseInflation - Math.max(0, taxIncomeForFedProv - provAgePhase * baseInflation) * 0.15);
        provAgeCredit = provAgeAmt * provRateLowest; 
    }
    
    // Pension Income Amount Credit (Line 31400): Up to $2,000 eligible pension
    let fedPensionCredit = 0; let provPensionCredit = 0;
    if (eligiblePension > 0) {
        fedPensionCredit = Math.min(eligiblePension, constants.FED_PENSION_AMOUNT || 2000) * lowestFedRate;
        provPensionCredit = Math.min(eligiblePension, constants.PROV_PENSION_AMOUNT?.[province] || 1681) * provRateLowest; 
    }

    let fedDisabilityCredit = 0; let provDisabilityCredit = 0;
    if (credits.disability) {
        fedDisabilityCredit = (constants.FED_DISABILITY_AMOUNT || 10138) * baseInflation * lowestFedRate;
        provDisabilityCredit = (constants.PROV_DISABILITY_AMOUNT?.[province] || 9800) * baseInflation * provRateLowest;
    }

    let fedCaregiverBase = 0; let provCaregiverBase = 0;
    let fedCaregiverCredit = 0; let provCaregiverCredit = 0;
    let under18Share = credits.caregiver_under_18_share || 0;
    let over18Share = credits.caregiver_over_18_share || 0;

    if (under18Share > 0) {
        fedCaregiverBase += (constants.FED_CAREGIVER_AMOUNT_UNDER_18 || 2687) * baseInflation * under18Share;
        provCaregiverBase += (constants.PROV_CAREGIVER_AMOUNT_UNDER_18?.[province] || 0) * baseInflation * under18Share;
    }
    if (over18Share > 0) {
        fedCaregiverBase += (constants.FED_CAREGIVER_AMOUNT_OVER_18 || 8601) * baseInflation * over18Share;
        provCaregiverBase += (constants.PROV_CAREGIVER_AMOUNT_OVER_18?.[province] || 5700) * baseInflation * over18Share;
    }
    fedCaregiverCredit = fedCaregiverBase * lowestFedRate;
    provCaregiverCredit = provCaregiverBase * provRateLowest;

    let fedEligibleMed = 0; let provEligibleMed = 0;
    let fedMedicalCredit = 0; let provMedicalCredit = 0;
    if (credits.medicalExpenses > 0) {
        let medExp = credits.medicalExpenses * baseInflation;
        let medRate = constants.FED_MEDICAL_EXPENSE_THRESHOLD_RATE || 0.03;
        
        let fedMedMax = (constants.FED_MEDICAL_EXPENSE_THRESHOLD_MAX || 2890) * baseInflation;
        let fedMedThreshold = Math.min(fedMedMax, taxIncomeForFedProv * medRate);
        fedEligibleMed = Math.max(0, medExp - fedMedThreshold);
        fedMedicalCredit = fedEligibleMed * lowestFedRate;

        let provMedMaxBase = constants.PROV_MEDICAL_EXPENSE_THRESHOLD_MAX?.[province];
        let provMedMax = (provMedMaxBase !== undefined && provMedMaxBase > 0) ? (provMedMaxBase * baseInflation) : Infinity; 
        let provMedThreshold = Math.min(provMedMax, taxIncomeForFedProv * medRate);
        provEligibleMed = Math.max(0, medExp - provMedThreshold);
        provMedicalCredit = provEligibleMed * provRateLowest;
    }

    let fedHomeBuyerCredit = 0; let provHomeBuyerCredit = 0;
    if (credits.firstTimeHomeBuyer) {
        fedHomeBuyerCredit = (constants.FED_HOME_BUYERS_AMOUNT || 10000) * lowestFedRate; 
        if (province === 'QC' || province === 'SK') {
            provHomeBuyerCredit = (constants.PROV_HOME_BUYERS_AMOUNT?.[province] || 10000) * provRateLowest;
        }
    }

    let fedDonationCredit = 0; let provDonationCredit = 0;
    if (credits.donations > 0) {
        let don = credits.donations * baseInflation;
        let thresh = constants.CHARITABLE_DONATION_THRESHOLD || 200;
        
        let fedRate1 = constants.FED_CHARITABLE_DONATION_RATE_1 || 0.14;
        let fedRate2 = constants.FED_CHARITABLE_DONATION_RATE_2 || 0.29;
        let fedRate3 = constants.FED_CHARITABLE_DONATION_RATE_3 || 0.33;
        
        if (don <= thresh) {
            fedDonationCredit = don * fedRate1;
        } else {
            let topRateInc = Math.max(0, taxIncomeForFedProv - ((constants.BPA_PHASE_END_FED || 258482) * baseInflation)); 
            let eligibleFor33 = Math.min(don - thresh, topRateInc);
            let eligibleFor29 = Math.max(0, don - thresh - eligibleFor33);
            fedDonationCredit = (thresh * fedRate1) + (eligibleFor33 * fedRate3) + (eligibleFor29 * fedRate2);
        }

        let provRate1 = constants.PROV_DONATION_RATE_1?.[province] || provRateLowest;
        let provRate2 = constants.PROV_DONATION_RATE_2?.[province] || (provRates[provRates.length - 1] || 0.1316);

        if (don <= thresh) {
            provDonationCredit = don * provRate1;
        } else {
            provDonationCredit = (thresh * provRate1) + ((don - thresh) * provRate2);
        }
    }
    
    let fedTuitionCredit = 0;
    if (credits.tuition > 0) {
        fedTuitionCredit = credits.tuition * baseInflation * (constants.FED_TUITION_RATE || 0.14);
    }
    
    let fedStudentLoanCredit = 0;
    if (credits.studentLoanInterest > 0) {
        fedStudentLoanCredit = credits.studentLoanInterest * baseInflation * (constants.FED_STUDENT_LOAN_INTEREST_RATE || 0.14);
    }
    
    // --- APPLY EXTRA CREDITS TO FIND FINAL TAX & ACTUAL UTILIZED AMOUNT ---
    let extraFedCredits = fedAgeCredit + fedPensionCredit + fedDisabilityCredit + fedCaregiverCredit + fedMedicalCredit + fedHomeBuyerCredit + fedDonationCredit + fedTuitionCredit + fedStudentLoanCredit;
    let extraProvCredits = provAgeCredit + provPensionCredit + provDisabilityCredit + provCaregiverCredit + provMedicalCredit + provHomeBuyerCredit + provDonationCredit;

    let postExtraFedTax = Math.max(0, preExtraFedTax - extraFedCredits);
    let postExtraProvTax = Math.max(0, preExtraProvTax - extraProvCredits);

    let utilizedFedNrtc = preExtraFedTax - postExtraFedTax;
    let utilizedProvNrtc = preExtraProvTax - postExtraProvTax;
    let utilizedNrtcTotal = utilizedFedNrtc + utilizedProvNrtc;

    fedTax = postExtraFedTax;
    provTax = postExtraProvTax;
    
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
        // CRA ON428: Ontario Dividend Tax Credit reduces Basic Ontario Tax BEFORE Surtax
        provTax = Math.max(0, provTax - provDividendCredit);

        const onSurtaxes = Array.isArray(taxData.ON?.surtaxes) && taxData.ON.surtaxes.length > 0
            ? taxData.ON.surtaxes
            : [
                { threshold: (constants.ON_SURTAX_1 || 5818) * baseInflation, rate: 0.20 },
                { threshold: (constants.ON_SURTAX_2 || 7446) * baseInflation, rate: 0.36 }
            ];

        let surtaxMultiplier = 1;
        for (const tier of onSurtaxes) {
            if (provTax > tier.threshold) {
                ontarioSurtaxAmt += (provTax - tier.threshold) * tier.rate;
                surtaxMultiplier += tier.rate;
            }
        }
        
        if (ontarioSurtaxAmt > 0) provMarginalRate *= surtaxMultiplier;

        provTax += ontarioSurtaxAmt;

        let liftMax = (constants.ON_LIFT_MAX || 875) * baseInflation;
        let liftRate = constants.ON_LIFT_RATE || 0.0505;
        let liftPhaseStart = (constants.ON_LIFT_PHASE_OUT_START || 32500) * baseInflation;
        let liftPhaseRate = constants.ON_LIFT_PHASE_OUT_RATE || 0.05;

        let liftAmt = Math.min(liftMax, earnedIncome * liftRate);
        let liftPhaseOut = Math.max(0, (taxIncomeForFedProv - liftPhaseStart) * liftPhaseRate);
        let liftCredit = Math.max(0, liftAmt - liftPhaseOut);
        
        provTax = Math.max(0, provTax - liftCredit);

        let otrBase = (constants.ON_OTR_BASE || 300) * baseInflation;
        if (spouseIncome >= 0 && spouseIncome < provBpa) {
            otrBase += ((constants.ON_OTR_BASE || 300) * baseInflation); 
        }
        
        // CRA Form ON428: Ontario Tax Reduction = max(0, (2 * otrBase) - OntarioTaxBeforeReduction)
        let otrAmount = Math.min(provTax, Math.max(0, (otrBase * 2) - provTax));
        provTax = Math.max(0, provTax - otrAmount);
        
        const ohpTiers = Array.isArray(constants.ON_OHP_TIERS) && constants.ON_OHP_TIERS.length > 0
            ? constants.ON_OHP_TIERS
            : [
                { threshold: 20000, base: 0, maxAdd: 300, rate: 0.06 },
                { threshold: 36000, base: 300, maxAdd: 150, rate: 0.06 },
                { threshold: 48000, base: 450, maxAdd: 150, rate: 0.25 },
                { threshold: 72000, base: 600, maxAdd: 150, rate: 0.25 },
                { threshold: 200000, base: 750, maxAdd: 150, rate: 0.25 }
            ];
        let ohp = 0;
        for (let i = ohpTiers.length - 1; i >= 0; i--) {
            const tier = ohpTiers[i];
            if (craTaxableIncome > tier.threshold) {
                ohp = tier.base + Math.min(tier.maxAdd, (craTaxableIncome - tier.threshold) * tier.rate);
                break;
            }
        }
        
        ontarioHealthPremium = ohp;
        provTax += ontarioHealthPremium;
    } else {
        provTax = Math.max(0, provTax - provDividendCredit);
    }

    fedTax = Math.max(0, fedTax - fedDividendCredit);

    // --- ALTERNATIVE MINIMUM TAX (AMT) ESTIMATION (Evaluated BEFORE Quebec 16.5% Abatement) ---
    const amtExemptionAmt = taxData.FED?.brackets?.[2] || ((constants.FED_AMT_EXEMPTION || 181440) * baseInflation);
    const amtPayable = estimateFederalAMT(taxIncomeForFedProv, fedTax, baseInflation, totalRealizedCapitalGains, amtExemptionAmt);
    if (amtPayable > 0) {
        fedTax += amtPayable;
    }
    
    if (province === 'QC' && taxData.QC?.abatement) {
        fedTax = Math.max(0, fedTax - (fedTax * taxData.QC.abatement));
        fedMarginalRate *= (1 - taxData.QC.abatement);
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
    
    const totalPayroll = cppBasePremium + cppEnhancedPremium + cppTier2Premium + eiPremium + qpipPremium;

    return { 
        fed: fedTax, 
        prov: provTax, 
        cppPremium: cppBasePremium + cppEnhancedPremium,
        cpp2Premium: cppTier2Premium,
        eiPremium: eiPremium,
        qpipPremium: qpipPremium,
        cpp_ei: totalPayroll, 
        oas_clawback: oasClawback, 
        surtax: ontarioSurtaxAmt, 
        ohp: ontarioHealthPremium, 
        amt: amtPayable,
        totalTax: fedTax + provTax + totalPayroll + oasClawback, 
        margRate: actualMargRate,
        utilizedFedNrtc,
        utilizedProvNrtc,
        utilizedNrtcTotal,
        nrtc: {
            donations: fedDonationCredit + provDonationCredit,
            caregiver: fedCaregiverCredit + provCaregiverCredit,
            medical: fedMedicalCredit + provMedicalCredit,
            homeBuyer: fedHomeBuyerCredit + provHomeBuyerCredit,
            disability: fedDisabilityCredit + provDisabilityCredit,
            age: fedAgeCredit + provAgeCredit,
            pension: fedPensionCredit + provPensionCredit
        },
        nrtcDetails: {
            donations: { fedAmt: fedDonationCredit, provAmt: provDonationCredit, amount: credits.donations || 0 },
            caregiver: { fedAmt: fedCaregiverCredit, provAmt: provCaregiverCredit, fedBase: fedCaregiverBase, provBase: provCaregiverBase, fedRate: lowestFedRate, provRate: provRateLowest },
            medical: { fedAmt: fedMedicalCredit, provAmt: provMedicalCredit, fedBase: (credits.medicalExpenses > 0 ? fedEligibleMed : 0), provBase: (credits.medicalExpenses > 0 ? provEligibleMed : 0), fedRate: lowestFedRate, provRate: provRateLowest },
            homeBuyer: { fedAmt: fedHomeBuyerCredit, provAmt: provHomeBuyerCredit, fedBase: (credits.firstTimeHomeBuyer ? (constants.FED_HOME_BUYERS_AMOUNT || 10000) : 0), provBase: (credits.firstTimeHomeBuyer && (province === 'QC' || province === 'SK') ? (constants.PROV_HOME_BUYERS_AMOUNT?.[province] || 10000) : 0), fedRate: lowestFedRate, provRate: provRateLowest },
            disability: { fedAmt: fedDisabilityCredit, provAmt: provDisabilityCredit, fedBase: (credits.disability ? (constants.FED_DISABILITY_AMOUNT || 10138) * baseInflation : 0), provBase: (credits.disability ? (constants.PROV_DISABILITY_AMOUNT?.[province] || 9800) * baseInflation : 0), fedRate: lowestFedRate, provRate: provRateLowest },
            age: { fedAmt: fedAgeCredit, provAmt: provAgeCredit, fedBase: ageAmt, provBase: provAgeAmt, fedRate: lowestFedRate, provRate: provRateLowest },
            pension: { fedAmt: fedPensionCredit, provAmt: provPensionCredit, fedBase: (eligiblePension > 0 ? Math.min(eligiblePension, constants.FED_PENSION_AMOUNT || 2000) : 0), provBase: (eligiblePension > 0 ? Math.min(eligiblePension, constants.PROV_PENSION_AMOUNT?.[province] || 1681) : 0), fedRate: lowestFedRate, provRate: provRateLowest }
        },
        rtc: {
            transit: provTransitCredit
        },
        rtcDetails: {
            transit: { amt: provTransitCredit, base: (province === 'ON' && age >= (constants.ON_SENIORS_TRANSIT_ELIGIBLE_AGE || 65) && credits.transit > 0 ? Math.min(credits.transit * baseInflation, (constants.ON_SENIORS_TRANSIT_MAX_EXPENSE || 3000) * baseInflation) : 0), rate: constants.ON_SENIORS_TRANSIT_RATE || 0.15 }
        }
    };
}