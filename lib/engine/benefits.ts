/**
 * benefits.ts
 * Calculates government benefits (CPP, OAS, CCB) and registered account minimums (RRIF, LIF).
 */

export function calcBenefitAmount(maxAmount: number, startAge: number, inflationFactor: number, retireAge: number, type: 'cpp'|'oas') {
    let amount = maxAmount * inflationFactor;
    
    if (type === 'cpp') {
        if (startAge < 65) {
            amount *= (1 - (65 - startAge) * 12 * 0.006); // 0.6% penalty per month before 65
        } else if (startAge > 65) {
            amount *= (1 + (startAge - 65) * 12 * 0.0084); // 0.84% bonus per month after 65
        }
    } else if (type === 'oas') {
        if (startAge > 65) {
            amount *= (1 + (startAge - 65) * 12 * 0.006); // 0.6% bonus per month after 65
        }
    }
    return Math.max(0, amount);
}

export function calculateCCBForYear(year: number, dependents: any[], previousAFNI: number, baseInflation: number, CCB_RULES: any) {
    if (!dependents || dependents.length === 0) return 0;
    
    let u6 = 0;
    let o6 = 0;
    
    dependents.forEach(dep => {
        let byear = parseInt(dep.dob.split('-')[0]) || year;
        let age = year - byear;
        if (age < 6) u6++;
        else if (age < 18) o6++;
    });

    const totalKids = u6 + o6;
    if (totalKids === 0) return 0;

    // Fallback in case config is missing
    const rules = CCB_RULES || {
        MAX_UNDER_6: 7787, MAX_6_TO_17: 6570,
        THRESHOLD_1: 37160, THRESHOLD_2: 79087,
        RATE_1: [0.07, 0.135, 0.19, 0.23], 
        RATE_2: [0.032, 0.057, 0.08, 0.095]
    };

    let maxBenefit = (u6 * rules.MAX_UNDER_6 * baseInflation) + (o6 * rules.MAX_6_TO_17 * baseInflation);
    let rateIndex = Math.min(totalKids - 1, 3);
    let reduction = 0;

    let t1 = rules.THRESHOLD_1 * baseInflation;
    let t2 = rules.THRESHOLD_2 * baseInflation;

    if (previousAFNI > t2) {
        reduction = ((t2 - t1) * rules.RATE_1[rateIndex]) + ((previousAFNI - t2) * rules.RATE_2[rateIndex]);
    } else if (previousAFNI > t1) {
        reduction = (previousAFNI - t1) * rules.RATE_1[rateIndex];
    }

    return Math.max(0, maxBenefit - reduction);
}

export function getRrifFactor(age: number) {
    if (age < 71) return 1 / (90 - age);
    const f: Record<number, number> = {
        71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567, 75: 0.0582,
        76: 0.0598, 77: 0.0617, 78: 0.0636, 79: 0.0658, 80: 0.0682,
        81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 85: 0.0851,
        86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192,
        91: 0.1306, 92: 0.1449, 93: 0.1634, 94: 0.1879
    };
    return f[age] || 0.20;
}

export function getLifMaxFactor(age: number, province: string = 'ON') {
    // Ontario standard LIF Maximums
    const factorsON: Record<number, number> = {
        55: 0.064, 56: 0.065, 57: 0.065, 58: 0.066, 59: 0.067,
        60: 0.068, 61: 0.069, 62: 0.070, 63: 0.071, 64: 0.073,
        65: 0.074, 66: 0.076, 67: 0.077, 68: 0.079, 69: 0.081,
        70: 0.083, 71: 0.086, 72: 0.088, 73: 0.090, 74: 0.093,
        75: 0.097, 76: 0.101, 77: 0.105, 78: 0.109, 79: 0.115,
        80: 0.121, 81: 0.127, 82: 0.135, 83: 0.143, 84: 0.153,
        85: 0.164, 86: 0.177, 87: 0.193, 88: 0.212, 89: 0.236,
        90: 1.0 
    };
    
    if (age < 55) return 0.06;
    if (age >= 90) return 1.0; 
    
    return factorsON[age] || 0.064;
}

export function calcRegMinimums(person1: any, person2: any, age1: number, age2: number, alive1: boolean, alive2: boolean, rrsp1: number, rrif1: number, rrsp2: number, rrif2: number, lirf1: number, lif1: number, lirf2: number, lif2: number, rrifStartAge: number) {
    let p1RrifMin = 0, p2RrifMin = 0;
    let p1LifMin = 0, p2LifMin = 0;
    let details = { p1: { min: 0, bal: 0, factor: 0, lifMin: 0, lifBal: 0 }, p2: { min: 0, bal: 0, factor: 0, lifMin: 0, lifBal: 0 } };

    if (alive1 && (rrif1 > 0 || (age1 >= rrifStartAge && rrsp1 > 0))) {
        let bal = rrif1 + (age1 >= rrifStartAge ? rrsp1 : 0);
        let factor = getRrifFactor(age1 - 1);
        p1RrifMin = bal * factor;
        details.p1.bal = bal; details.p1.factor = factor; details.p1.min = p1RrifMin;
    }

    if (alive2 && (rrif2 > 0 || (age2 >= rrifStartAge && rrsp2 > 0))) {
        let bal = rrif2 + (age2 >= rrifStartAge ? rrsp2 : 0);
        let factor = getRrifFactor(age2 - 1);
        p2RrifMin = bal * factor;
        details.p2.bal = bal; details.p2.factor = factor; details.p2.min = p2RrifMin;
    }
    
    if (alive1 && lif1 > 0) {
        let factor = getRrifFactor(age1 - 1);
        p1LifMin = lif1 * factor;
        details.p1.lifBal = lif1; details.p1.lifMin = p1LifMin;
    }
    
    if (alive2 && lif2 > 0) {
        let factor = getRrifFactor(age2 - 1);
        p2LifMin = lif2 * factor;
        details.p2.lifBal = lif2; details.p2.lifMin = p2LifMin;
    }

    return { p1: p1RrifMin, p2: p2RrifMin, lifTaken1: p1LifMin, lifTaken2: p2LifMin, details };
}