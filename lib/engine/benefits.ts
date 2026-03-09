// lib/engine/benefits.ts

export function getRrifFactor(age: number) {
    if (age < 71) {
        return 1 / (90 - age); 
    }
    if (age >= 95) {
        return 0.20;
    }
    const factors: Record<number, number> = {
        71: 0.0528, 72: 0.0540, 73: 0.0553, 74: 0.0567, 75: 0.0582, 76: 0.0598, 77: 0.0617, 
        78: 0.0636, 79: 0.0658, 80: 0.0682, 81: 0.0708, 82: 0.0738, 83: 0.0771, 84: 0.0808, 
        85: 0.0851, 86: 0.0899, 87: 0.0955, 88: 0.1021, 89: 0.1099, 90: 0.1192, 91: 0.1306, 
        92: 0.1449, 93: 0.1634, 94: 0.1879
    };
    return factors[age] || 0.0528;
}

export function getLifMaxFactor(age: number, province: string) {
    const group1 = ['BC', 'AB', 'SK', 'ON', 'NB', 'NL'];
    const group2 = ['MB', 'QC', 'NS'];
    
    let type = 'fed'; 
    if (group1.includes(province)) type = 'g1';
    else if (group2.includes(province)) type = 'g2';

    const maxRates: any = {
        'g1': {
            55: 0.0651, 56: 0.0657, 57: 0.0663, 58: 0.0670, 59: 0.0677, 60: 0.0685, 61: 0.0694, 62: 0.0704, 63: 0.0714, 64: 0.0726, 
            65: 0.0738, 66: 0.0752, 67: 0.0767, 68: 0.0783, 69: 0.0802, 70: 0.0822, 71: 0.0845, 72: 0.0871, 73: 0.0900, 74: 0.0934, 
            75: 0.0971, 76: 0.1015, 77: 0.1066, 78: 0.1125, 79: 0.1196, 80: 0.1282, 81: 0.1387, 82: 0.1519, 83: 0.1690, 84: 0.1919, 
            85: 0.2240, 86: 0.2723, 87: 0.3529, 88: 0.5146
        },
        'g2': {
            55: 0.0640, 56: 0.0650, 57: 0.0650, 58: 0.0660, 59: 0.0670, 60: 0.0670, 61: 0.0680, 62: 0.0690, 63: 0.0700, 64: 0.0710, 
            65: 0.0720, 66: 0.0730, 67: 0.0740, 68: 0.0760, 69: 0.0770, 70: 0.0790, 71: 0.0810, 72: 0.0830, 73: 0.0850, 74: 0.0880, 
            75: 0.0910, 76: 0.0940, 77: 0.0980, 78: 0.1030, 79: 0.1080, 80: 0.1150, 81: 0.1210, 82: 0.1290, 83: 0.1380, 84: 0.1480, 
            85: 0.1600, 86: 0.1730, 87: 0.1890, 88: 0.2000
        },
        'fed': {
            55: 0.0516, 56: 0.0522, 57: 0.0527, 58: 0.0534, 59: 0.0541, 60: 0.0548, 61: 0.0556, 62: 0.0565, 63: 0.0575, 64: 0.0586, 
            65: 0.0598, 66: 0.0611, 67: 0.0625, 68: 0.0641, 69: 0.0660, 70: 0.0680, 71: 0.0703, 72: 0.0729, 73: 0.0759, 74: 0.0793, 
            75: 0.0833, 76: 0.0879, 77: 0.0932, 78: 0.0994, 79: 0.1068, 80: 0.1157, 81: 0.1265, 82: 0.1401, 83: 0.1575, 84: 0.1809, 
            85: 0.2136, 86: 0.2626, 87: 0.3445, 88: 0.5083
        }
    };

    if (age >= 89) return type === 'g2' ? 0.2000 : 1.0000;
    if (age < 55) return maxRates[type][55]; 
    return maxRates[type][age] || (type === 'g2' ? 0.2000 : 1.0000);
}

export function calcBenefitAmount(maxAmount: number, startAge: number, proportion: number, retireAge: number, type: string) { 
    let benefitValue = maxAmount * proportion;
    let monthsDifference = (startAge - 65) * 12; 
    
    if (type === 'cpp') {
        if (monthsDifference < 0) {
            benefitValue *= (1 - (Math.abs(monthsDifference) * 0.006));
        } else {
            benefitValue *= (1 + (monthsDifference * 0.007)); 
        }
        if (retireAge < 60) {
            benefitValue *= Math.max(0, (39 - Math.max(0, (65 - retireAge) - 8)) / 39); 
        }
    } else if (type === 'oas') {
        if (monthsDifference > 0) {
            benefitValue *= (1 + (monthsDifference * 0.006));
        }
    }
    return benefitValue; 
}

export function calculateCCBForYear(currentYear: number, dependents: any[], familyNetIncome: number, baseInflation: number, CCB_RULES: any) {
    if (!dependents || dependents.length === 0 || !CCB_RULES) return 0;

    let countUnder6 = 0, count6to17 = 0, activeKids = 0;

    dependents.forEach(dep => {
        let parts = dep.dob.split('-');
        let birthYear = parseInt(parts[0]);
        let birthMonth = parseInt(parts[1]) || 1; 
        let turns6Year = birthYear + 6;
        let turns18Year = birthYear + 18;

        if (currentYear < turns18Year) activeKids++;
        else if (currentYear === turns18Year) activeKids++;

        if (currentYear < turns6Year) {
            countUnder6 += 1;
        } else if (currentYear === turns6Year) {
            countUnder6 += birthMonth / 12;
            count6to17 += (12 - birthMonth) / 12;
        } else if (currentYear < turns18Year) {
            count6to17 += 1;
        } else if (currentYear === turns18Year) {
            count6to17 += birthMonth / 12;
        }
    });

    if (activeKids === 0) return 0;

    let maxUnder6 = CCB_RULES.MAX_UNDER_6 * baseInflation;
    let max6to17 = CCB_RULES.MAX_6_TO_17 * baseInflation;
    let thresh1 = CCB_RULES.THRESHOLD_1 * baseInflation;
    let thresh2 = CCB_RULES.THRESHOLD_2 * baseInflation;

    let maxBenefit = (countUnder6 * maxUnder6) + (count6to17 * max6to17);
    let rateIndex = Math.max(0, Math.min(activeKids - 1, 3));
    let reduction = 0;

    if (familyNetIncome > thresh2) {
        let bracket1MaxReduction = (thresh2 - thresh1) * CCB_RULES.RATE_1[rateIndex];
        reduction = bracket1MaxReduction + ((familyNetIncome - thresh2) * CCB_RULES.RATE_2[rateIndex]);
    } else if (familyNetIncome > thresh1) {
        reduction = (familyNetIncome - thresh1) * CCB_RULES.RATE_1[rateIndex];
    }

    return Math.max(0, maxBenefit - reduction);
}

export function calcRegMinimums(person1: any, person2: any, age1: number, age2: number, alive1: boolean, alive2: boolean, preRrsp1: number, preRrif1: number, preRrsp2: number, preRrif2: number, preLirf1: number, preLif1: number, preLirf2: number, preLif2: number, rrifStartAge: number) {
    let result = { p1: 0, p2: 0, lifTaken1: 0, lifTaken2: 0, details: { p1: null as any, p2: null as any } };
    const formatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
    
    const calculateMinimumForPerson = (person: any, age: number, preRrsp: number, preRrif: number, preLirf: number, preLif: number) => {
        let factor = getRrifFactor(age - 1);
        let baseRrifBalance = age >= rrifStartAge ? (preRrsp + preRrif) : preRrif;
        let baseLifBalance = age >= rrifStartAge ? (preLirf + preLif) : preLif;
        
        let requiredRrifMin = baseRrifBalance * factor;
        let requiredLifMin = age >= 55 ? (baseLifBalance * factor) : 0;
        
        let actualRrifTaken = 0, actualLifTaken = 0;

        let rrifArith = '';
        if (baseRrifBalance > 0) {
            rrifArith = `<div class="d-flex justify-content-between text-muted mb-1"><span>Prior Year Balance:</span> <span>${formatter.format(baseRrifBalance)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Min Factor:</span> <span>${(factor * 100).toFixed(2)}%</span></div><div class="d-flex justify-content-between fw-bold text-main"><span>Required Min:</span> <span>${formatter.format(requiredRrifMin)}</span></div>`;
        }

        let lifArith = '';
        if (baseLifBalance > 0 && age >= 55) {
            lifArith = `<div class="d-flex justify-content-between text-muted mb-1"><span>Prior Year Balance:</span> <span>${formatter.format(baseLifBalance)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Min Factor:</span> <span>${(factor * 100).toFixed(2)}%</span></div><div class="d-flex justify-content-between fw-bold text-main"><span>Required Min:</span> <span>${formatter.format(requiredLifMin)}</span></div>`;
        }
        
        if (baseRrifBalance > 0) {
            let minNeeded = requiredRrifMin;
            let takeFromRrif = Math.min(person.rrif_acct, minNeeded);
            person.rrif_acct -= takeFromRrif;
            actualRrifTaken += takeFromRrif;
            minNeeded -= takeFromRrif;
            
            if (minNeeded > 0 && age >= rrifStartAge) {
                let takeFromRrsp = Math.min(person.rrsp, minNeeded);
                person.rrsp -= takeFromRrsp;
                actualRrifTaken += takeFromRrsp;
            }
        }

        if (baseLifBalance > 0) {
            let minNeeded = requiredLifMin;
            let takeFromLif = Math.min(person.lif, minNeeded);
            person.lif -= takeFromLif;
            actualLifTaken += takeFromLif;
            minNeeded -= takeFromLif;

            if (minNeeded > 0 && age >= rrifStartAge) {
                let takeFromLirf = Math.min(person.lirf, minNeeded);
                person.lirf -= takeFromLirf;
                actualLifTaken += takeFromLirf;
            }
        }
        
        return { 
            rrifTaken: actualRrifTaken, lifTaken: actualLifTaken, 
            details: { factor, bal: baseRrifBalance, min: requiredRrifMin, lifBal: baseLifBalance, lifMin: requiredLifMin, rrifArith, lifArith } 
        };
    };
    
    if (alive1) { 
        let p1Min = calculateMinimumForPerson(person1, age1, preRrsp1, preRrif1, preLirf1, preLif1); 
        result.p1 = p1Min.rrifTaken; result.lifTaken1 = p1Min.lifTaken; result.details.p1 = p1Min.details; 
    }
    if (alive2) { 
        let p2Min = calculateMinimumForPerson(person2, age2, preRrsp2, preRrif2, preLirf2, preLif2); 
        result.p2 = p2Min.rrifTaken; result.lifTaken2 = p2Min.lifTaken; result.details.p2 = p2Min.details; 
    }
    return result;
}