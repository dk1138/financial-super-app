/**
 * financeEngine.ts
 * The core orchestrator. 
 * Heavy logic has been extracted to lib/engine/ modules for maintainability.
 */
import { parseFormattedNumber } from './utils';
import { getInflatedTaxData, calculateTaxDetailed } from './engine/tax';
import { calcBenefitAmount, calculateCCBForYear, calcRegMinimums, getLifMaxFactor } from './engine/benefits';
import { handleSurplus, handleDeficit, applyPensionSplitting } from './engine/cashflow';
export { calculatePlanScore } from './engine/scoring'; 

export class FinanceEngine {
    inputs: any;
    properties: any[];
    housingTransitions: any[];
    windfalls: any[];
    additionalIncome: any[];
    customAssets: any[];
    leaves: any[];
    strategies: { accum: string[], decum: string[] };
    dependents: any[];
    debt: any[];
    mode: string;
    expenseMode: string;
    expensesByCategory: any;
    expensePhases: any[];
    CONSTANTS: any;
    strategyLabels: any;

    constructor(data: any) {
        this.inputs = JSON.parse(JSON.stringify(data.inputs || {}));
        
        // CLEANUP: Automatically strip out legacy "Primary Residence" objects or old "Future Purchase" 
        // properties from the previous architecture so they don't process as ghost rental properties!
        this.properties = (data.properties || []).filter((p: any) => 
            p.name !== 'Primary Residence' && p.isFuturePurchase !== true
        );
        
        this.housingTransitions = data.housingTransitions || [];
        this.windfalls = data.windfalls || [];
        this.additionalIncome = data.additionalIncome || [];
        this.customAssets = data.customAssets || [];
        this.leaves = data.leaves || []; 
        this.strategies = data.strategies || { accum: [], decum: [] };
        this.dependents = data.dependents || []; 
        this.debt = data.debt || []; 
        this.mode = data.mode || 'Couple';
        this.expenseMode = data.expenseMode || 'Simple';
        this.expensesByCategory = data.expensesByCategory || {};
        this.expensePhases = data.expensePhases || [];
        this.CONSTANTS = data.constants || {};
        this.strategyLabels = data.strategyLabels || {};

        if (this.customAssets.length > 0) {
            this.customAssets.forEach(ca => {
                let p = ca.owner; 
                let t = ca.type; 
                let bal = Number(ca.balance) || 0;
                
                if (bal > 0) {
                    let rate = Number(ca.rate) || 0;
                    let retRate = ca.retireRate !== undefined ? Number(ca.retireRate) : rate;
                    let acb = Number(ca.acb) || 0;
                    let acctYield = Number(ca.yield) || 0;

                    let baseBalKey = `${p}_${t}`;
                    let baseRateKey = `${p}_${t}_ret`;
                    let baseRetRateKey = `${p}_${t}_retire_ret`;
                    let baseYieldKey = `${p}_${t}_yield`;

                    let currentBaseBal = this.getVal(baseBalKey);
                    let currentBaseRate = this.inputs[baseRateKey] !== undefined ? Number(this.inputs[baseRateKey]) : 6.0;
                    let currentBaseRetRate = this.inputs[baseRetRateKey] !== undefined ? Number(this.inputs[baseRetRateKey]) : currentBaseRate;
                    let currentBaseYield = this.inputs[baseYieldKey] !== undefined ? Number(this.inputs[baseYieldKey]) : 0;

                    let totalBal = currentBaseBal + bal;
                    let blendedRate = ((currentBaseBal * currentBaseRate) + (bal * rate)) / totalBal;
                    let blendedRetRate = ((currentBaseBal * currentBaseRetRate) + (bal * retRate)) / totalBal;

                    this.inputs[baseRateKey] = blendedRate;
                    this.inputs[baseRetRateKey] = blendedRetRate;

                    if (t === 'nonreg' || t === 'crypto') {
                        let blendedYield = ((currentBaseBal * currentBaseYield) + (bal * acctYield)) / totalBal;
                        this.inputs[baseYieldKey] = blendedYield;

                        let baseAcbKey = `${p}_${t}_acb`;
                        let currentAcb = this.inputs[baseAcbKey] !== undefined ? this.getVal(baseAcbKey) : currentBaseBal;
                        this.inputs[baseAcbKey] = currentAcb + acb;
                    }
                    
                    this.inputs[baseBalKey] = totalBal;
                }
            });
        }
    }

    getVal(id: string) {
        let raw = this.inputs[id] !== undefined ? this.inputs[id] : 0;
        return parseFormattedNumber(raw);
    }

    getRaw(id: string) {
        return this.inputs[id];
    }

    randn_bm() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); 
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    applyGrowth(person1: any, person2: any, isRet1: boolean, isRet2: boolean, isAdvancedMode: boolean, inflationRate: number, yearIndex: number, simContext: any, age1: number, age2: number) {
        const isStressTest = this.inputs['stressTestEnabled'] && yearIndex === 0; 
        const useGlide = this.inputs['use_glide_path'] || false;

        const getRates = (personPrefix: string, isRetired: boolean, age: number) => {
            const getRate = (id: string) => {
                let baseKey = `${personPrefix}_${id}_ret`;
                let retireKey = `${personPrefix}_${id}_retire_ret`;
                
                let rawVal;
                if (isAdvancedMode && isRetired) {
                    rawVal = this.inputs[retireKey] !== undefined ? this.inputs[retireKey] : this.inputs[baseKey];
                } else {
                    rawVal = this.inputs[baseKey];
                }
                
                let baseRate = (rawVal !== undefined ? parseFormattedNumber(rawVal) : 0) / 100;
                
                if (useGlide && ['tfsa','rrsp','fhsa','nonreg','crypto','lirf','lif','rrif_acct','resp'].includes(id)) {
                    let ageOffset = Math.max(0, age - 50);
                    baseRate -= (ageOffset * 0.001); 
                    baseRate = Math.max(0.04, baseRate); 
                }
                return baseRate;
            };

            return { 
                tfsa: getRate('tfsa'), rrsp: getRate('rrsp'), cash: getRate('cash'), 
                nonreg: getRate('nonreg'), crypto: getRate('crypto'), lirf: getRate('lirf'), 
                lif: getRate('lif'), rrif_acct: getRate('rrif_acct'), fhsa: getRate('fhsa'), 
                resp: getRate('resp') || 0, inc: this.getVal(`${personPrefix}_income_growth`) / 100 
            };
        };
        
        const ratesP1 = getRates('p1', isRet1, age1);
        const ratesP2 = getRates('p2', isRet2, age2);
        
        if (isStressTest) { 
            const accountsToStress = ['tfsa','rrsp','nonreg','cash','lirf','lif','rrif_acct','crypto', 'fhsa', 'resp'];
            accountsToStress.forEach(account => { 
                if (ratesP1[account as keyof typeof ratesP1] !== undefined) (ratesP1 as any)[account] = -0.15; 
                if (ratesP2[account as keyof typeof ratesP2] !== undefined) (ratesP2 as any)[account] = -0.15; 
            }); 
            ratesP1.crypto = -0.40; ratesP2.crypto = -0.40; 
        }

        if (simContext?.shockSequence?.[yearIndex] !== undefined && simContext.shockSequence[yearIndex] !== 0) {
            let manualShock = simContext.shockSequence[yearIndex];
            const accountsToShock = ['tfsa','rrsp','nonreg','crypto','lirf','lif','rrif_acct', 'fhsa', 'resp'];
            accountsToShock.forEach(acc => { 
                if (ratesP1[acc as keyof typeof ratesP1] !== undefined) (ratesP1 as any)[acc] += manualShock; 
                if (ratesP2[acc as keyof typeof ratesP2] !== undefined) (ratesP2 as any)[acc] += manualShock; 
            });
        } else if (simContext?.volatility) {
            let shock = this.randn_bm() * simContext.volatility;
            if (shock !== 0) {
                const accountsToShock = ['tfsa','rrsp','nonreg','crypto','lirf','lif','rrif_acct', 'fhsa', 'resp'];
                accountsToShock.forEach(acc => { 
                    if (ratesP1[acc as keyof typeof ratesP1] !== undefined) (ratesP1 as any)[acc] += shock; 
                    if (ratesP2[acc as keyof typeof ratesP2] !== undefined) (ratesP2 as any)[acc] += shock; 
                });
            }
        }

        const applyGrowthToPerson = (person: any, rates: any, isRetired: boolean) => {
            person.tfsa *= (1 + rates.tfsa);
            if (person.tfsa_successor !== undefined) person.tfsa_successor *= (1 + rates.tfsa); 
            person.rrsp *= (1 + rates.rrsp); 
            person.cash *= (1 + rates.cash); 
            person.crypto *= (1 + rates.crypto);
            person.lirf *= (1 + rates.lirf); 
            person.lif *= (1 + rates.lif); 
            person.rrif_acct *= (1 + rates.rrif_acct);
            person.nonreg *= (1 + (rates.nonreg - person.nonreg_yield));
            if (person.fhsa !== undefined) person.fhsa *= (1 + rates.fhsa);
            if (person.resp !== undefined) person.resp *= (1 + rates.resp);
            if (!isRetired && yearIndex > 0) person.inc *= (1 + rates.inc); 
        };
        
        applyGrowthToPerson(person1, ratesP1, isRet1); 
        applyGrowthToPerson(person2, ratesP2, isRet2);

        // RETURN RATES FOR TIMING DELTA CALCULATIONS LATER
        return { ratesP1, ratesP2 };
    }

    calcInflows(currentYear: number, yearIndex: number, person1: any, person2: any, age1: number, age2: number, alive1: boolean, alive2: boolean, isRet1: boolean, isRet2: boolean, constants: any, baseInflation: number, trackedEvents: any) {
        let result = { 
            p1: { gross:0, earned:0, cpp:0, oas:0, pension:0, rrspMeltdown:0, windfallTaxable:0, windfallNonTax:0, postRet:0, ccb:0, eiMat:0, topUp:0, rental:0, other:0 }, 
            p2: { gross:0, earned:0, cpp:0, oas:0, pension:0, rrspMeltdown:0, windfallTaxable:0, windfallNonTax:0, postRet:0, ccb:0, eiMat:0, topUp:0, rental:0, other:0 },
            events: [] as string[]
        };
        
        const calculateInflowsForPerson = (person: any, age: number, isRetired: boolean, prefix: string, maxCpp: number, maxOas: number) => {
            let inflows = { gross:0, earned:0, cpp:0, oas:0, pension:0, rrspMeltdown:0, postRet:0, eiMat:0, topUp:0, rental:0, other:0 };
            
            const birthMonth = person.dob.getMonth(); 
            const startProration = (12 - birthMonth) / 12;
            const endProration = birthMonth / 12;

            if (!isRetired) { 
                let baseIncome = person.inc;
                let workFraction = 1.0;
                let eiTotal = 0, topUpTotal = 0;

                this.leaves.forEach(leave => {
                    if (leave.owner === prefix) {
                        let [leaveYear, leaveMonth] = (leave.start || "2026-01").split('-');
                        let leaveStartDate = new Date(parseInt(leaveYear), parseInt(leaveMonth) - 1, 1);
                        let yearStartDate = new Date(currentYear, 0, 1);
                        let yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59);

                        let overlapStart = new Date(Math.max(leaveStartDate.getTime(), yearStartDate.getTime()));
                        
                        let leaveEndDate = new Date(leaveStartDate.getTime() + (leave.durationWeeks || 0) * 7 * 24 * 60 * 60 * 1000);
                        let overlapEnd = new Date(Math.min(leaveEndDate.getTime(), yearEndDate.getTime()));
                        let leaveWeeksInYear = overlapStart < overlapEnd ? (overlapEnd.getTime() - overlapStart.getTime()) / (7 * 24 * 60 * 60 * 1000) : 0;

                        let topUpEndDate = new Date(leaveStartDate.getTime() + (leave.topUpWeeks || 0) * 7 * 24 * 60 * 60 * 1000);
                        let topUpOverlapEnd = new Date(Math.min(topUpEndDate.getTime(), yearEndDate.getTime()));
                        let topUpWeeksInYear = overlapStart < topUpOverlapEnd ? (topUpOverlapEnd.getTime() - overlapStart.getTime()) / (7 * 24 * 60 * 60 * 1000) : 0;

                        if (leaveWeeksInYear > 0) {
                            let weeklySalary = baseIncome / 52;
                            let maxEi = (this.CONSTANTS.MAX_EI_WEEKLY_BENEFIT || 720) * baseInflation;
                            let replacementRate = this.CONSTANTS.EI_REPLACEMENT_RATE || 0.55;
                            let weeklyEI = Math.min(maxEi, weeklySalary * replacementRate);
                            
                            let weeklyTopUpTarget = weeklySalary * ((leave.topUpPercent || 0) / 100);
                            let weeklyTopUpAmt = Math.max(0, weeklyTopUpTarget - weeklyEI);

                            workFraction -= (leaveWeeksInYear / 52);
                            eiTotal += (leaveWeeksInYear * weeklyEI);
                            topUpTotal += (topUpWeeksInYear * weeklyTopUpAmt);
                            
                            if (trackedEvents && !trackedEvents.has(`${prefix.toUpperCase()} Leave`)) {
                                trackedEvents.add(`${prefix.toUpperCase()} Leave`);
                                result.events.push(`${prefix.toUpperCase()} Leave`);
                            }
                        }
                    }
                });

                workFraction = Math.max(0, workFraction);
                let proratedIncome = baseIncome * workFraction;
                
                inflows.gross += proratedIncome + eiTotal + topUpTotal;
                inflows.earned += proratedIncome + topUpTotal; 
                inflows.eiMat += eiTotal;
                inflows.topUp += topUpTotal;
            }
            
            if (this.inputs[`${prefix}_db_enabled`]) {
                const lifetimeStart = parseInt(this.getRaw(`${prefix}_db_lifetime_start`) || 60);
                const bridgeStart = parseInt(this.getRaw(`${prefix}_db_bridge_start`) || 60);
                const dbMultiplier = (this.inputs[`${prefix}_db_indexed`] !== false) ? baseInflation : 1.0;
                
                if (age >= lifetimeStart) {
                    let proration = (age === lifetimeStart) ? startProration : 1.0;
                    inflows.pension += this.getVal(`${prefix}_db_lifetime`) * 12 * dbMultiplier * proration;
                }
                
                if (age >= bridgeStart && age <= 65) {
                    let months = 12;
                    if (age === bridgeStart) months -= birthMonth;
                    if (age === 65) months -= (12 - birthMonth);
                    if (months > 0) inflows.pension += this.getVal(`${prefix}_db_bridge`) * months * dbMultiplier;
                }
            }

            const cppStart = parseInt(this.getRaw(`${prefix}_cpp_start`) || 65);
            if (this.inputs[`${prefix}_cpp_enabled`] && age >= cppStart) {
                let proration = (age === cppStart) ? startProration : 1.0;
                inflows.cpp = calcBenefitAmount(maxCpp, cppStart, 1, person.retAge, 'cpp') * proration;
                if (trackedEvents && age === cppStart) trackedEvents.add(`${prefix.toUpperCase()} CPP`); 
            }
            
            const oasStart = parseInt(this.getRaw(`${prefix}_oas_start`) || 65);
            if (this.inputs[`${prefix}_oas_enabled`] && age >= oasStart) {
                let baseOas = calcBenefitAmount(maxOas, oasStart, 1, 65, 'oas');
                if (age >= 75) baseOas = (age === 75) ? ((baseOas * endProration) + (baseOas * 1.10 * startProration)) : (baseOas * 1.10);

                if (age === oasStart) {
                    if (oasStart === 75) baseOas = calcBenefitAmount(maxOas, oasStart, 1, 65, 'oas') * 1.10;
                    inflows.oas = baseOas * startProration;
                } else {
                    inflows.oas = baseOas;
                }
                if (trackedEvents && age === oasStart) trackedEvents.add(`${prefix.toUpperCase()} OAS`); 
            }
            return inflows;
        };

        if (alive1) result.p1 = {...result.p1, ...calculateInflowsForPerson(person1, age1, isRet1, 'p1', constants.cppMax1, constants.oasMax1)}; 
        if (alive2) result.p2 = {...result.p2, ...calculateInflowsForPerson(person2, age2, isRet2, 'p2', constants.cppMax2, constants.oasMax2)}; 

        if (trackedEvents) {
            if (alive1 && isRet1 && !trackedEvents.has('P1 Retires')) { trackedEvents.add('P1 Retires'); result.events.push('P1 Retires'); }
            if (alive2 && isRet2 && !trackedEvents.has('P2 Retires')) { trackedEvents.add('P2 Retires'); result.events.push('P2 Retires'); }
        }

        this.windfalls.forEach(windfall => {
            let isActive = false, amount = 0;
            let startYear = new Date((windfall.start || "2026-01") + "-01").getFullYear();
            
            if (windfall.freq === 'one') { 
                if (startYear === currentYear) { isActive = true; amount = windfall.amount; } 
            } else { 
                let endYear = (windfall.end ? new Date(windfall.end + "-01") : new Date("2100-01-01")).getFullYear(); 
                if (currentYear >= startYear && currentYear <= endYear) { 
                    isActive = true; 
                    let monthsActive = 12;
                    if (windfall.freq === 'month') {
                        if (currentYear === startYear) monthsActive = 12 - new Date((windfall.start || "2026-01") + "-01").getMonth();
                        else if (currentYear === endYear) monthsActive = new Date(windfall.end + "-01").getMonth() + 1;
                    }
                    amount = windfall.amount * monthsActive; 
                } 
            }
            
            if (isActive && amount > 0) { 
                if (trackedEvents && windfall.freq === 'one') result.events.push('Windfall');
                let targetPerson = (windfall.owner === 'p2' && alive2) ? result.p2 : result.p1;
                if (windfall.taxable) targetPerson.windfallTaxable += amount; 
                else targetPerson.windfallNonTax += amount;
            }
        });

        this.additionalIncome.forEach(stream => {
            let startYear, endYear;
            if (stream.startMode === 'ret_relative') {
                const ownerPerson = stream.owner === 'p2' ? person2 : person1;
                startYear = ownerPerson.dob.getFullYear() + ownerPerson.retAge + (stream.startRel || 0);
            } else {
                startYear = new Date((stream.start || "2026-01") + "-01").getFullYear();
            }

            endYear = stream.endMode === 'duration' ? (startYear + (stream.duration || 0)) : (stream.end ? new Date(stream.end + "-01") : new Date("2100-01-01")).getFullYear();

            if (currentYear >= startYear && currentYear <= endYear) {
                let baseYear = stream.startMode === 'ret_relative' ? startYear : new Date((stream.start || "2026-01") + "-01").getFullYear();
                let amount = stream.amount * Math.pow(1 + (stream.growth / 100), currentYear - baseYear) * (stream.freq === 'month' ? 12 : 1);
                
                if (stream.startMode === 'date' && currentYear === startYear) amount *= (12 - new Date((stream.start || "2026-01") + "-01").getMonth()) / 12;
                if (stream.endMode === 'date' && stream.end && currentYear === endYear) amount *= Math.min(1, (new Date(stream.end + "-01").getMonth() + 1) / 12);

                if (amount > 0) { 
                    let targetPerson = (stream.owner === 'p2' && alive2) ? result.p2 : result.p1;
                    if (targetPerson) {
                        if (stream.taxable) { 
                            targetPerson.gross += amount; 
                            targetPerson.earned += amount;
                            targetPerson.other += amount; 
                            if ((stream.owner === 'p2' ? isRet2 : isRet1)) targetPerson.postRet += amount;
                        } else {
                            targetPerson.windfallNonTax += amount;
                        }
                    }
                }
            }
        });

        return result;
    }

    calcOutflows(currentYear: number, yearIndex: number, age: number, baseInflation: number, isRet1: boolean, isRet2: boolean, simContext: any, haircut: number = 1.0) {
        let expenseTotals = { curr: 0, ret: 0, trans: 0, gogo: 0, slow: 0, nogo: 0 };
        
        if (this.expensesByCategory) {
            Object.values(this.expensesByCategory).forEach((category: any) => {
                if (category?.items) {
                    category.items.forEach((item: any) => { 
                        const freq = item.freq || 12; 
                        expenseTotals.curr += (item.curr || 0) * freq; 
                        expenseTotals.ret += (item.ret || 0) * freq; 
                        expenseTotals.trans += (item.trans || 0) * freq; 
                        expenseTotals.gogo += (item.gogo || 0) * freq; 
                        expenseTotals.slow += (item.slow || 0) * freq; 
                        expenseTotals.nogo += (item.nogo || 0) * freq; 
                    });
                }
            });
        }
        
        let finalExpenses = 0;
        const isFullyRetired = isRet1 && (this.mode === 'Single' || isRet2);
        const gogoLimit = parseInt(this.getRaw('exp_gogo_age')) || 75;
        const slowLimit = parseInt(this.getRaw('exp_slow_age')) || 85;
        const contextMultiplier = simContext?.expenseMultiplier || 1.0;

        if (this.expenseMode === 'Simple') {
            finalExpenses = isFullyRetired ? (expenseTotals.ret * contextMultiplier) : expenseTotals.curr;
        } else {
            if (!isFullyRetired) finalExpenses = expenseTotals.curr;
            else if (age < gogoLimit) finalExpenses = expenseTotals.gogo * contextMultiplier;
            else if (age < slowLimit) finalExpenses = expenseTotals.slow * contextMultiplier;
            else finalExpenses = expenseTotals.nogo * contextMultiplier;
        }

        let activePhasesAmount = 0;
        let activePhases: any[] = [];

        if (this.expensePhases && this.expensePhases.length > 0) {
            this.expensePhases.forEach((phase: any) => {
                const amt = Number(phase.amount) || 0;
                if (!phase.isPhased || (age >= phase.startAge && age <= phase.endAge)) {
                    activePhasesAmount += amt * 12; 
                    activePhases.push({ name: phase.name, amount: (amt * 12) * baseInflation });
                }
            });
        }

        finalExpenses *= haircut;
        finalExpenses += activePhasesAmount;

        return { total: finalExpenses * baseInflation, activePhases: activePhases };
    }

    runSimulation(detailed = false, simContext: any = null): any[] {
        if (this.inputs['fully_optimize_tax'] && !simContext?.isMetaRun) {
            let bestNW = -Infinity, bestData: any = null, bestOrder: string[] = [];
            
            let groupA = this.strategies.decum.filter(x => ['nonreg', 'cash', 'crypto'].includes(x));
            let groupB = this.strategies.decum.filter(x => ['tfsa', 'fhsa'].includes(x));
            let groupC = this.strategies.decum.filter(x => ['rrif_acct', 'lif', 'lirf', 'rrsp'].includes(x));
            let missing = this.strategies.decum.filter(x => !groupA.includes(x) && !groupB.includes(x) && !groupC.includes(x));

            if (groupA.length === 0 && groupB.length === 0 && groupC.length === 0) return this.runSimulation(detailed, { ...simContext, isMetaRun: true });

            let perms = [
                [...groupA, ...groupB, ...groupC, ...missing], [...groupA, ...groupC, ...groupB, ...missing],
                [...groupB, ...groupA, ...groupC, ...missing], [...groupB, ...groupC, ...groupA, ...missing],
                [...groupC, ...groupA, ...groupB, ...missing], [...groupC, ...groupB, ...groupA, ...missing]
            ];

            for (let decumOrder of perms) {
                let tempData = JSON.parse(JSON.stringify({
                    inputs: this.inputs, properties: this.properties, housingTransitions: this.housingTransitions, windfalls: this.windfalls, additionalIncome: this.additionalIncome, customAssets: this.customAssets, leaves: this.leaves, strategies: { accum: this.strategies.accum, decum: decumOrder }, dependents: this.dependents, debt: this.debt, mode: this.mode, expenseMode: this.expenseMode, expensesByCategory: this.expensesByCategory, expensePhases: this.expensePhases, constants: this.CONSTANTS, strategyLabels: this.strategyLabels
                }));
                
                let tempEngine = new FinanceEngine(tempData);
                let tempResult = tempEngine.runSimulation(true, { ...simContext, isMetaRun: true, forceOrder: decumOrder });
                
                if (tempResult?.length > 0 && tempResult[tempResult.length - 1].afterTaxEstate > bestNW) {
                    bestNW = tempResult[tempResult.length - 1].afterTaxEstate;
                    bestData = tempResult;
                    bestOrder = decumOrder;
                }
            }
            
            if (detailed && bestData && bestData.length > 0) {
                bestData[0].optimalStrategy = bestOrder;
            }
            
            return detailed ? bestData : bestData.map((y: any) => y.liquidNW + (y.reIncludedEq || 0));
        }

        const currentYear = new Date().getFullYear();
        let netWorthArray: number[] = [], projectionData: any[] = [];

        let person1 = { 
            tfsa: this.getVal('p1_tfsa'), tfsa_successor: 0, fhsa: this.getVal('p1_fhsa'), resp: this.getVal('p1_resp'), 
            rrsp: this.getVal('p1_rrsp'), cash: this.getVal('p1_cash'), nonreg: this.getVal('p1_nonreg'), 
            crypto: this.getVal('p1_crypto'), lirf: this.getVal('p1_lirf'), lif: this.getVal('p1_lif'), 
            rrif_acct: this.getVal('p1_rrif_acct'), inc: this.getVal('p1_income'), 
            dob: new Date(this.getRaw('p1_dob') || "1990-01"), retAge: this.getVal('p1_retireAge'), 
            lifeExp: this.getVal('p1_lifeExp'), nonreg_yield: this.getVal('p1_nonreg_yield')/100,
            crypto_yield: this.inputs['p1_crypto_yield'] !== undefined ? this.getVal('p1_crypto_yield')/100 : 0, 
            acb: this.inputs['p1_nonreg_acb'] !== undefined ? this.getVal('p1_nonreg_acb') : this.getVal('p1_nonreg'), 
            crypto_acb: this.inputs['p1_crypto_acb'] !== undefined ? this.getVal('p1_crypto_acb') : this.getVal('p1_crypto') 
        };
        
        let person2 = { 
            tfsa: this.getVal('p2_tfsa'), tfsa_successor: 0, fhsa: this.getVal('p2_fhsa'), resp: this.getVal('p2_resp'),
            rrsp: this.getVal('p2_rrsp'), cash: this.getVal('p2_cash'), nonreg: this.getVal('p2_nonreg'), 
            crypto: this.getVal('p2_crypto'), lirf: this.getVal('p2_lirf'), lif: this.getVal('p2_lif'), 
            rrif_acct: this.getVal('p2_rrif_acct'), inc: this.getVal('p2_income'), 
            dob: new Date(this.getRaw('p2_dob') || "1990-01"), retAge: this.getVal('p2_retireAge'), 
            lifeExp: this.getVal('p2_lifeExp'), nonreg_yield: this.getVal('p2_nonreg_yield')/100, 
            crypto_yield: this.inputs['p2_crypto_yield'] !== undefined ? this.getVal('p2_crypto_yield')/100 : 0, 
            acb: this.inputs['p2_nonreg_acb'] !== undefined ? this.getVal('p2_nonreg_acb') : this.getVal('p2_nonreg'), 
            crypto_acb: this.inputs['p2_crypto_acb'] !== undefined ? this.getVal('p2_crypto_acb') : this.getVal('p2_crypto') 
        };

        let simProperties = JSON.parse(JSON.stringify(this.properties));
        let housingTransitions = JSON.parse(JSON.stringify(this.housingTransitions));
        
        let currentHousingMode = this.inputs.housing_mode || 'own';
        let primaryValue = currentHousingMode === 'own' ? (this.inputs.primary_value !== undefined ? this.getVal('primary_value') : 800000) : 0;
        let primaryMortgage = currentHousingMode === 'own' ? (this.inputs.primary_mortgage !== undefined ? this.getVal('primary_mortgage') : 400000) : 0;
        let primaryRate = this.inputs.primary_rate !== undefined ? this.getVal('primary_rate') : 4.0;
        let primaryPayment = currentHousingMode === 'own' ? (this.inputs.primary_payment !== undefined ? this.getVal('primary_payment') : 2000) : 0;
        let primaryGrowth = (this.inputs.primary_growth !== undefined ? this.getVal('primary_growth') : 3.0) / 100;
        let currentRent = currentHousingMode === 'rent' ? (this.inputs.primary_rent !== undefined ? this.getVal('primary_rent') : 2500) : 0;
        
        const p1StartAge = currentYear - person1.dob.getFullYear();
        const p2StartAge = currentYear - person2.dob.getFullYear();
        const endAge = Math.max(person1.lifeExp, this.mode === 'Couple' ? person2.lifeExp : 0);
        const yearsToRun = endAge - Math.min(p1StartAge, this.mode === 'Couple' ? p2StartAge : p1StartAge);
        let trackedEvents = new Set(), finalNetWorth = 0;

        let consts = {
            cppMax1: this.getVal('p1_cpp_est_base'),
            oasMax1: this.CONSTANTS.MAX_OAS * (Math.max(0, Math.min(40, this.getVal('p1_oas_years'))) / 40),
            cppMax2: this.getVal('p2_cpp_est_base'),
            oasMax2: this.CONSTANTS.MAX_OAS * (Math.max(0, Math.min(40, this.getVal('p2_oas_years'))) / 40),
            tfsaLimit: this.inputs['cfg_tfsa_limit'] !== undefined ? this.getVal('cfg_tfsa_limit') : 7000,
            rrspMax: this.inputs['cfg_rrsp_limit'] !== undefined ? this.getVal('cfg_rrsp_limit') : 32960,
            fhsaLimit: this.inputs['cfg_fhsa_limit'] !== undefined ? this.getVal('cfg_fhsa_limit') : 8000,
            respLimit: this.inputs['cfg_resp_limit'] !== undefined ? this.getVal('cfg_resp_limit') : 2500,
            cryptoLimit: this.inputs['cfg_crypto_limit'] !== undefined ? this.getVal('cfg_crypto_limit') : 5000,
            inflation: this.getVal('inflation_rate') / 100
        };

        let previousAFNI = Math.max(0, (person1.inc + (this.mode === 'Couple' ? person2.inc : 0)) - ((this.mode === 'Couple' ? 2 : 1) * 15000));
        let flowLog: any = null, pendingRefund = { p1: 0, p2: 0 };
        
        let fhsaYearsP1 = person1.fhsa > 0 ? 1 : 0, fhsaYearsP2 = person2.fhsa > 0 ? 1 : 0;
        let fhsaClosed1 = false, fhsaClosed2 = false;
        let fhsaLifetimeRooms = { p1: Math.max(0, 40000 - (this.getVal('p1_fhsa') || 0)), p2: Math.max(0, 40000 - (this.getVal('p2_fhsa') || 0)) };

        let initialWithdrawalRate = 0, currentExpenseHaircut = 1.0;

        for (let i = 0; i <= yearsToRun; i++) {
            const yr = currentYear + i, age1 = p1StartAge + i, age2 = p2StartAge + i;
            const alive1 = age1 <= person1.lifeExp, alive2 = this.mode === 'Couple' ? age2 <= person2.lifeExp : false;
            
            if (!alive1 && !alive2) break;

            if (alive1 && age1 >= (this.CONSTANTS?.RRIF_START_AGE || 72) && person1.rrsp > 0) { person1.rrif_acct += person1.rrsp; person1.rrsp = 0; }
            if (this.mode === 'Couple' && alive2 && age2 >= (this.CONSTANTS?.RRIF_START_AGE || 72) && person2.rrsp > 0) { person2.rrif_acct += person2.rrsp; person2.rrsp = 0; }

            if (detailed) {
                flowLog = { contributions: { p1: {tfsa:0, fhsa:0, resp:0, rrsp:0, nonreg:0, cash:0, crypto:0}, p2: {tfsa:0, fhsa:0, rrsp:0, nonreg:0, cash:0, crypto:0} }, withdrawals: {} };
            }

            let deathEvents: string[] = [];
            const handleDeath = (deceased: any, survivor: any, pName: string) => {
                if (!trackedEvents.has(`${pName} Dies`)) {
                    trackedEvents.add(`${pName} Dies`);
                    if (detailed) deathEvents.push(`${pName} Dies`);
                    if (survivor) {
                        survivor.tfsa_successor += (deceased.tfsa + (deceased.tfsa_successor || 0));
                        survivor.rrsp += deceased.rrsp; survivor.rrif_acct += deceased.rrif_acct; survivor.lif += deceased.lif; survivor.lirf += deceased.lirf;
                        survivor.nonreg += deceased.nonreg; survivor.acb += deceased.acb; survivor.cash += deceased.cash; survivor.crypto += deceased.crypto; survivor.crypto_acb += deceased.crypto_acb;
                        if (deceased.fhsa) survivor.fhsa = (survivor.fhsa || 0) + deceased.fhsa;
                        if (deceased.resp) survivor.resp = (survivor.resp || 0) + deceased.resp;
                        deceased.tfsa = 0; deceased.tfsa_successor = 0; deceased.rrsp = 0; deceased.rrif_acct = 0; deceased.lif = 0; deceased.lirf = 0;
                        deceased.nonreg = 0; deceased.acb = 0; deceased.cash = 0; deceased.crypto = 0; deceased.crypto_acb = 0; deceased.fhsa = 0; deceased.resp = 0;
                    }
                }
            };
            if (!alive1) handleDeath(person1, alive2 && this.mode === 'Couple' ? person2 : null, 'P1');
            if (this.mode === 'Couple' && !alive2) handleDeath(person2, alive1 ? person1 : null, 'P2');

            const baseInflation = Math.pow(1 + consts.inflation, i);
            const oasThresholdInf = (this.CONSTANTS.OAS_CLAWBACK_THRESHOLD || 95323) * baseInflation; 
            
            const isRet1 = age1 >= person1.retAge, isRet2 = this.mode === 'Couple' ? age2 >= person2.retAge : true;
            
            const preGrowthRrsp1 = person1.rrsp, preGrowthRrif1 = person1.rrif_acct, preGrowthLirf1 = person1.lirf, preGrowthLif1 = person1.lif;
            const preGrowthRrsp2 = person2.rrsp, preGrowthRrif2 = person2.rrif_acct, preGrowthLirf2 = person2.lirf, preGrowthLif2 = person2.lif;
            const preGrowthNonreg1 = person1.nonreg, preGrowthNonreg2 = person2.nonreg;
            const preGrowthCrypto1 = person1.crypto, preGrowthCrypto2 = person2.crypto;

            // SNAPSHOT PORTFOLIO BEFORE CASHFLOWS FOR TIMING DELTA
            const { ratesP1, ratesP2 } = this.applyGrowth(person1, person2, isRet1, isRet2, this.inputs['asset_mode_advanced'], consts.inflation, i, simContext, age1, age2);
            
            const postGrowthP1 = { tfsa: person1.tfsa, rrsp: person1.rrsp, nonreg: person1.nonreg, cash: person1.cash, crypto: person1.crypto, fhsa: person1.fhsa || 0, lirf: person1.lirf, lif: person1.lif, rrif_acct: person1.rrif_acct, resp: person1.resp || 0 };
            const postGrowthP2 = { tfsa: person2.tfsa, rrsp: person2.rrsp, nonreg: person2.nonreg, cash: person2.cash, crypto: person2.crypto, fhsa: person2.fhsa || 0, lirf: person2.lirf, lif: person2.lif, rrif_acct: person2.rrif_acct, resp: person2.resp || 0 };

            let inflows = this.calcInflows(yr, i, person1, person2, age1, age2, alive1, alive2, isRet1, isRet2, consts, baseInflation, detailed ? trackedEvents : null);
            if (detailed && deathEvents.length > 0) inflows.events.push(...deathEvents);

            // --- ADD RENTAL INCOME ---
            simProperties.forEach((p: any) => {
                if (!(p.sellEnabled && p.sellAge <= age1) && p.rentalIncome > 0) {
                    let annualRent = p.rentalIncome * 12 * baseInflation;
                    inflows.p1.gross += annualRent;
                    inflows.p1.earned += annualRent; 
                    inflows.p1.rental += annualRent;
                    if (isRet1) inflows.p1.postRet += annualRent;
                }
            });

            let isFullyRetired = isRet1 && (this.mode === 'Single' || isRet2);
            let currentLiquidNW = person1.tfsa + person1.tfsa_successor + person1.rrsp + person1.crypto + person1.nonreg + person1.cash + person1.rrif_acct + (person1.fhsa || 0);
            if (this.mode === 'Couple') currentLiquidNW += person2.tfsa + person2.tfsa_successor + person2.rrsp + person2.crypto + person2.nonreg + person2.cash + person2.rrif_acct + (person2.fhsa || 0);

            if (this.inputs['enable_guardrails'] && isFullyRetired) {
                let baseExpObj = this.calcOutflows(yr, i, age1, baseInflation, isRet1, isRet2, simContext, 1.0);
                let currentWR = currentLiquidNW > 0 ? (baseExpObj.total / currentLiquidNW) : 0;

                if (initialWithdrawalRate === 0 && currentLiquidNW > 0) {
                    initialWithdrawalRate = currentWR;
                } else if (initialWithdrawalRate > 0 && currentLiquidNW > 0) {
                    if (currentWR > initialWithdrawalRate * 1.2) {
                        currentExpenseHaircut *= 0.90; initialWithdrawalRate = currentWR; 
                        if (detailed && !trackedEvents.has('Guardrails Activated')) inflows.events.push('Guardrails: Spending Cut (-10%)');
                    } else if (currentWR < initialWithdrawalRate * 0.8) {
                        currentExpenseHaircut = Math.min(1.0, currentExpenseHaircut * 1.10); initialWithdrawalRate = currentWR;
                        if (detailed && currentExpenseHaircut <= 1.0 && !trackedEvents.has('Guardrails Lifted')) inflows.events.push('Guardrails: Spending Raised (+10%)');
                    }
                }
            }

            let appliedRefundP1 = pendingRefund.p1 > 0 && alive1 ? pendingRefund.p1 : 0;
            let appliedRefundP2 = pendingRefund.p2 > 0 && alive2 ? pendingRefund.p2 : 0;
            if (appliedRefundP1 > 0) inflows.p1.windfallNonTax += appliedRefundP1;
            if (appliedRefundP2 > 0) inflows.p2.windfallNonTax += appliedRefundP2;
            pendingRefund = { p1: 0, p2: 0 };

            let rrspRoom1 = Math.min(inflows.p1.earned * 0.18, consts.rrspMax * baseInflation);
            let rrspRoom2 = Math.min(inflows.p2.earned * 0.18, consts.rrspMax * baseInflation);
            
            let p1_match_rate = this.getVal('p1_rrsp_match') / 100, p1_tier = Math.max(0.01, this.getVal('p1_rrsp_match_tier') / 100);
            let p2_match_rate = this.getVal('p2_rrsp_match') / 100, p2_tier = Math.max(0.01, this.getVal('p2_rrsp_match_tier') / 100);

            let empPortionP1 = (!isRet1 && alive1) ? (person1.inc * p1_match_rate) : 0;
            let empPortionP2 = (!isRet2 && alive2) ? (person2.inc * p2_match_rate) : 0;

            let targetTotalP1 = empPortionP1 + (empPortionP1 / p1_tier);
            let targetTotalP2 = empPortionP2 + (empPortionP2 / p2_tier);

            let totalMatch1 = 0, actEmpPortionP1 = 0;
            if (targetTotalP1 > 0) {
                totalMatch1 = Math.min(targetTotalP1, rrspRoom1);
                actEmpPortionP1 = empPortionP1 * (totalMatch1 / targetTotalP1);
                inflows.p1.gross += actEmpPortionP1; person1.rrsp += totalMatch1; rrspRoom1 -= totalMatch1; 
                if (detailed) flowLog.contributions.p1.rrsp += totalMatch1; 
            }

            let totalMatch2 = 0, actEmpPortionP2 = 0;
            if (targetTotalP2 > 0 && alive2) {
                totalMatch2 = Math.min(targetTotalP2, rrspRoom2);
                actEmpPortionP2 = empPortionP2 * (totalMatch2 / targetTotalP2);
                inflows.p2.gross += actEmpPortionP2; person2.rrsp += totalMatch2; rrspRoom2 -= totalMatch2;
                if (detailed) flowLog.contributions.p2.rrsp += totalMatch2; 
            }

            const regMins = calcRegMinimums(person1, person2, age1, age2, alive1, alive2, preGrowthRrsp1, preGrowthRrif1, preGrowthRrsp2, preGrowthRrif2, preGrowthLirf1, preGrowthLif1, preGrowthLirf2, preGrowthLif2, this.CONSTANTS?.RRIF_START_AGE || 72);
            let wdBreakdown = detailed ? { p1: {} as any, p2: {} as any } : null;

            if (this.inputs['fully_optimize_tax'] === true || this.inputs['rrsp_meltdown_enabled'] === true || this.inputs['smart_rrsp_meltdown'] === true) {
                const executeMeltdown = (person: any, currentAge: number, incs: any, isAlive: boolean, prefix: 'p1' | 'p2', rrifMin: number, lifMin: number) => {
                    let rrifStartAge = this.CONSTANTS?.RRIF_START_AGE || 72;
                    if (isAlive && currentAge < rrifStartAge && person.rrsp > 0) {
                        let currentTaxable = incs.gross + incs.cpp + incs.oas + incs.pension + incs.windfallTaxable + (person.nonreg * person.nonreg_yield) + rrifMin + lifMin;
                        
                        let bracketTop = this.CONSTANTS.TAX_DATA?.FED?.brackets?.[0] || 55867;
                        let targetBracketCap = bracketTop * baseInflation; 
                        
                        let room = Math.max(0, targetBracketCap - currentTaxable);
                        if (room > 0) {
                            let pullAmt = Math.min(room, person.rrsp);
                            person.rrsp -= pullAmt; incs.rrspMeltdown += pullAmt; 
                            
                            if (detailed && flowLog) flowLog.withdrawals[`${prefix.toUpperCase()} RRSP`] = (flowLog.withdrawals[`${prefix.toUpperCase()} RRSP`] || 0) + pullAmt;
                            if (detailed && wdBreakdown) {
                                if (!wdBreakdown[prefix].RRSP_math) wdBreakdown[prefix].RRSP_math = { wd: 0, tax: 0, acb: 0, gain: 0, priorBal: 0, factor: 0, min: 0 };
                                wdBreakdown[prefix].RRSP = (wdBreakdown[prefix].RRSP || 0) + pullAmt;
                                wdBreakdown[prefix].RRSP_math.wd += pullAmt; wdBreakdown[prefix].RRSP_math.tax += pullAmt;
                            }
                        }
                    }
                };
                if (alive1) executeMeltdown(person1, age1, inflows.p1, alive1, 'p1', regMins.p1, regMins.lifTaken1);
                if (this.mode === 'Couple' && alive2) executeMeltdown(person2, age2, inflows.p2, alive2, 'p2', regMins.p2, regMins.lifTaken2);
            }

            if (inflows.p1.rrspMeltdown > 0) rrspRoom1 = 0; 
            if (inflows.p2.rrspMeltdown > 0) rrspRoom2 = 0; 

            if (detailed && wdBreakdown) {
                if (regMins.p1 > 0) { flowLog.withdrawals['P1 RRIF'] = (flowLog.withdrawals['P1 RRIF'] || 0) + regMins.p1; wdBreakdown.p1.RRIF = regMins.p1; wdBreakdown.p1.RRIF_math = { wd: regMins.p1, tax: regMins.p1, min: regMins.details.p1.min, priorBal: regMins.details.p1.bal, factor: regMins.details.p1.factor }; }
                if (regMins.lifTaken1 > 0) { flowLog.withdrawals['P1 LIF'] = (flowLog.withdrawals['P1 LIF'] || 0) + regMins.lifTaken1; wdBreakdown.p1.LIF = regMins.lifTaken1; wdBreakdown.p1.LIF_math = { wd: regMins.lifTaken1, tax: regMins.lifTaken1, min: regMins.details.p1.lifMin, priorBal: regMins.details.p1.lifBal, factor: regMins.details.p1.factor }; }
                if (regMins.p2 > 0) { flowLog.withdrawals['P2 RRIF'] = (flowLog.withdrawals['P2 RRIF'] || 0) + regMins.p2; wdBreakdown.p2.RRIF = regMins.p2; wdBreakdown.p2.RRIF_math = { wd: regMins.p2, tax: regMins.p2, min: regMins.details.p2.min, priorBal: regMins.details.p2.bal, factor: regMins.details.p2.factor }; }
                if (regMins.lifTaken2 > 0) { flowLog.withdrawals['P2 LIF'] = (flowLog.withdrawals['P2 LIF'] || 0) + regMins.lifTaken2; wdBreakdown.p2.LIF = regMins.lifTaken2; wdBreakdown.p2.LIF_math = { wd: regMins.lifTaken2, tax: regMins.lifTaken2, min: regMins.details.p2.lifMin, priorBal: regMins.details.p2.lifBal, factor: regMins.details.p2.factor }; }
            }

            const taxBrackets = getInflatedTaxData(this.CONSTANTS.TAX_DATA, baseInflation);

            let under18_count_p1 = Number(this.inputs['p1_caregiver_under_18']) || 0;
            let over18_count_p1 = Number(this.inputs['p1_caregiver_over_18']) || 0;
            let under18_count_p2 = Number(this.inputs['p2_caregiver_under_18']) || 0;
            let over18_count_p2 = Number(this.inputs['p2_caregiver_over_18']) || 0;

            let credits1 = {
                disability: this.inputs['p1_disability'] || false,
                caregiver_under_18_share: under18_count_p1, 
                caregiver_over_18_share: over18_count_p1,   
                medicalExpenses: this.getVal('p1_medical_expenses'),
                donations: this.getVal('p1_donations'),
                firstTimeHomeBuyer: parseInt(this.getRaw('p1_first_time_home_buyer_year')) === yr,
                tuition: this.getVal('p1_tuition'),
                studentLoanInterest: this.getVal('p1_student_loan_interest'),
                transit: this.getVal('p1_transit')
            };

            let credits2 = {
                disability: this.inputs['p2_disability'] || false,
                caregiver_under_18_share: under18_count_p2, 
                caregiver_over_18_share: over18_count_p2,   
                medicalExpenses: this.getVal('p2_medical_expenses'),
                donations: this.getVal('p2_donations'),
                firstTimeHomeBuyer: parseInt(this.getRaw('p2_first_time_home_buyer_year')) === yr,
                tuition: this.getVal('p2_tuition'),
                studentLoanInterest: this.getVal('p2_student_loan_interest'),
                transit: this.getVal('p2_transit')
            };

            let divInc1 = preGrowthNonreg1 * person1.nonreg_yield;
            let divInc2 = alive2 ? (preGrowthNonreg2 * person2.nonreg_yield) : 0;
            let cryptoYield1 = preGrowthCrypto1 * person1.crypto_yield;
            let cryptoYield2 = alive2 ? (preGrowthCrypto2 * person2.crypto_yield) : 0;

            let isEligibleDividend = true; 
            let grossUp = isEligibleDividend ? (this.CONSTANTS.DIVIDEND_GROSS_UP_ELIGIBLE || 1.38) : (this.CONSTANTS.DIVIDEND_GROSS_UP_NON_ELIGIBLE || 1.15);
            let grossedDiv1 = divInc1 * grossUp, grossedDiv2 = divInc2 * grossUp;

            let baseGross1 = inflows.p1.gross + inflows.p1.cpp + inflows.p1.oas + inflows.p1.pension + inflows.p1.rrspMeltdown + regMins.p1 + regMins.lifTaken1 + inflows.p1.windfallTaxable + cryptoYield1;
            let baseGross2 = inflows.p2.gross + inflows.p2.cpp + inflows.p2.oas + inflows.p2.pension + inflows.p2.rrspMeltdown + regMins.p2 + regMins.lifTaken2 + inflows.p2.windfallTaxable + cryptoYield2;

            let craTaxableIncome1 = Math.max(0, baseGross1 + grossedDiv1 - totalMatch1);
            let craTaxableIncome2 = Math.max(0, baseGross2 + grossedDiv2 - totalMatch2);
            let cashIncome1 = Math.max(0, baseGross1 + divInc1 - totalMatch1);
            let cashIncome2 = Math.max(0, baseGross2 + divInc2 - totalMatch2);

            let getEligPension1 = () => inflows.p1.pension + (age1 >= 65 ? (regMins.p1 + regMins.lifTaken1 + (wdBreakdown?.p1?.RRIF || 0) + (wdBreakdown?.p1?.LIF || 0)) : 0);
            let getEligPension2 = () => inflows.p2.pension + (age2 >= 65 ? (regMins.p2 + regMins.lifTaken2 + (wdBreakdown?.p2?.RRIF || 0) + (wdBreakdown?.p2?.LIF || 0)) : 0);

            const provinceStr = this.getRaw('tax_province');

            let taxWithoutMatch1 = alive1 ? calculateTaxDetailed(baseGross1 + grossedDiv1, provinceStr, taxBrackets, this.CONSTANTS, inflows.p1.oas, oasThresholdInf, inflows.p1.earned, baseInflation, divInc1, age1, getEligPension1(), alive2 ? craTaxableIncome2 : -1, isEligibleDividend, credits1) : {totalTax: 0, margRate: 0};
            let taxWithoutMatch2 = alive2 ? calculateTaxDetailed(baseGross2 + grossedDiv2, provinceStr, taxBrackets, this.CONSTANTS, inflows.p2.oas, oasThresholdInf, inflows.p2.earned, baseInflation, divInc2, age2, getEligPension2(), alive1 ? craTaxableIncome1 : -1, isEligibleDividend, credits2) : {totalTax: 0, margRate: 0};

            let taxWithMatchOnly1 = alive1 ? calculateTaxDetailed(craTaxableIncome1, provinceStr, taxBrackets, this.CONSTANTS, inflows.p1.oas, oasThresholdInf, inflows.p1.earned, baseInflation, divInc1, age1, getEligPension1(), alive2 ? craTaxableIncome2 : -1, isEligibleDividend, credits1) : {totalTax: 0, margRate: 0};
            let taxWithMatchOnly2 = alive2 ? calculateTaxDetailed(craTaxableIncome2, provinceStr, taxBrackets, this.CONSTANTS, inflows.p2.oas, oasThresholdInf, inflows.p2.earned, baseInflation, divInc2, age2, getEligPension2(), alive1 ? craTaxableIncome1 : -1, isEligibleDividend, credits2) : {totalTax: 0, margRate: 0};

            let matchTaxSavings1 = taxWithoutMatch1.totalTax - taxWithMatchOnly1.totalTax;
            let matchTaxSavings2 = taxWithoutMatch2.totalTax - taxWithMatchOnly2.totalTax;

            let ccbPayout = calculateCCBForYear(yr, this.dependents, previousAFNI, baseInflation, this.CONSTANTS.CCB_RULES);
            if (ccbPayout > 0 && alive1) inflows.p1.ccb = ccbPayout;

            let lifMax1 = (preGrowthLirf1 + preGrowthLif1) * getLifMaxFactor(age1 - 1, provinceStr);
            let lifMax2 = (preGrowthLirf2 + preGrowthLif2) * getLifMaxFactor(age2 - 1, provinceStr);
            lifMax1 = Math.max(0, lifMax1 - regMins.lifTaken1); lifMax2 = Math.max(0, lifMax2 - regMins.lifTaken2);

            const outflowsObj = this.calcOutflows(yr, i, age1, baseInflation, isRet1, isRet2, simContext, currentExpenseHaircut);
            let expenses = outflowsObj.total; const activeExpensePhases = outflowsObj.activePhases;

            let mortgagePayment = 0, rentPayment = 0, keptProperties: any[] = [];
            
            // --- PRIMARY HOUSING TRANSITIONS ---
            let transition = housingTransitions.find((t: any) => t.age === age1);
            if (transition) {
                if (currentHousingMode === 'own') {
                    if (transition.keepPrevious) {
                        simProperties.push({
                            name: `Retained Home (Age ${age1})`,
                            value: primaryValue,
                            mortgage: primaryMortgage,
                            rate: primaryRate,
                            payment: primaryPayment,
                            growth: primaryGrowth * 100, 
                            rentalIncome: 0,
                            includeInNW: true,
                            sellEnabled: false
                        });
                        primaryValue = 0; primaryMortgage = 0; primaryPayment = 0;
                        if (detailed && !trackedEvents.has('Kept Previous Home')) { trackedEvents.add('Kept Previous Home'); inflows.events.push('Kept Previous Home'); }
                    } else {
                        let proceeds = primaryValue;
                        let transCosts = proceeds * 0.05;
                        let netCash = proceeds - primaryMortgage - transCosts;
                        if (netCash > 0) inflows.p1.windfallNonTax += netCash;
                        primaryValue = 0; primaryMortgage = 0; primaryPayment = 0;
                        if (detailed && !trackedEvents.has('Sold Primary Home')) { trackedEvents.add('Sold Primary Home'); inflows.events.push('Sold Primary Home'); }
                    }
                }
                
                if (transition.action === 'downsize' || transition.action === 'buy') {
                    currentHousingMode = 'own';
                    primaryValue = (transition.price || 0) * baseInflation;
                    primaryMortgage = (transition.mortgage || 0) * baseInflation;
                    let downPayment = primaryValue - primaryMortgage;
                    inflows.p1.windfallNonTax -= downPayment;
                    
                    primaryRate = transition.rate !== undefined ? transition.rate : 4.0;
                    primaryGrowth = (transition.growth !== undefined ? transition.growth : 3.0) / 100;

                    if (primaryMortgage > 0) {
                        let r = primaryRate / 100 / 12;
                        let payment = transition.payment || 0;
                        if (payment === 0) payment = r === 0 ? primaryMortgage / 300 : (primaryMortgage * r) / (1 - Math.pow(1 + r, -300));
                        primaryPayment = payment;
                    } else {
                        primaryPayment = 0; 
                    }
                    currentRent = 0;
                    if (detailed && !trackedEvents.has('Bought New Home')) { trackedEvents.add('Bought New Home'); inflows.events.push('Bought New Home'); }
                } else if (transition.action === 'rent' || transition.action === 'ltc') {
                    currentHousingMode = transition.action;
                    currentRent = (transition.rent || 0); 
                    primaryValue = 0;
                    primaryMortgage = 0;
                    primaryPayment = 0;
                    if (detailed && !trackedEvents.has('Transitioned to ' + transition.action.toUpperCase())) { trackedEvents.add('Transitioned to ' + transition.action.toUpperCase()); inflows.events.push('Transitioned to ' + transition.action.toUpperCase()); }
                }
            }

            let realEstateValue = 0, realEstateDebt = 0, reExcludedValue = 0, reExcludedDebt = 0;

            if (currentHousingMode === 'own') {
                if (primaryMortgage > 0 && primaryPayment > 0) {
                    let annualPayment = primaryPayment * 12;
                    let interest = primaryMortgage * (primaryRate / 100);
                    let principal = annualPayment - interest;
                    if (principal > primaryMortgage) { principal = primaryMortgage; annualPayment = principal + interest; }
                    primaryMortgage = Math.max(0, primaryMortgage - principal);
                    mortgagePayment += annualPayment;
                }
                realEstateValue += primaryValue;
                realEstateDebt += primaryMortgage;
                primaryValue *= (1 + primaryGrowth);
            } else if (currentHousingMode === 'rent' || currentHousingMode === 'ltc') {
                rentPayment = currentRent * 12 * baseInflation;
            }

            // --- RENTAL PROPERTIES ---
            simProperties.forEach((p: any) => {
                if (p.sellEnabled && p.sellAge === age1) {
                    const proceeds = p.value;
                    const transCosts = proceeds * 0.05;
                    const netCash = proceeds - p.mortgage - transCosts;
                    if (netCash > 0) inflows.p1.windfallNonTax += netCash;
                    if (detailed && !trackedEvents.has('Sold: ' + p.name)) { trackedEvents.add('Sold: ' + p.name); inflows.events.push('Sold: ' + p.name); }
                } else {
                    if (p.mortgage > 0 && p.payment > 0) { 
                        let annualPayment = p.payment * 12, interest = p.mortgage * (p.rate / 100);
                        let principal = annualPayment - interest; 
                        if (principal > p.mortgage) { principal = p.mortgage; annualPayment = principal + interest; } 
                        p.mortgage = Math.max(0, p.mortgage - principal); mortgagePayment += annualPayment; 
                    } 
                    p.value *= (1 + (p.growth / 100)); keptProperties.push(p);

                    if (p.includeInNW) { realEstateValue += p.value; realEstateDebt += p.mortgage; } 
                    else { reExcludedValue += p.value; reExcludedDebt += p.mortgage; }
                }
            });
            simProperties = keptProperties;

            let debtRepayment = 0;
            this.debt.forEach(d => {
                let startYear = new Date((d.start || new Date().toISOString().slice(0,7)) + "-01").getFullYear();
                let type = d.type || 'one', amount = Number(d.amount) || 0, rate = Number(d.rate) || 0;
                
                if (type === 'monthly' || type === 'yearly') {
                    let endYear = startYear + (parseInt(d.duration) || 1) - 1;
                    if (yr >= startYear && yr <= endYear) {
                        let annualPayment = type === 'monthly' ? amount * 12 : amount;
                        if (rate > 0) {
                            let r = type === 'monthly' ? (rate / 100 / 12) : (rate / 100);
                            let n = type === 'monthly' ? ((parseInt(d.duration) || 1) * 12) : (parseInt(d.duration) || 1);
                            annualPayment = ((amount * r) / (1 - Math.pow(1 + r, -n))) * (type === 'monthly' ? 12 : 1);
                        }
                        debtRepayment += annualPayment;
                        if (detailed && yr === startYear && !trackedEvents.has(`Started: ${d.name}`)) { trackedEvents.add(`Started: ${d.name}`); inflows.events.push(`Started: ${d.name}`); }
                    }
                } else if (startYear === yr) {
                    debtRepayment += amount;
                    if (detailed) inflows.events.push(`Purchased: ${d.name}`);
                }
            });

            // --- EDUCATION & RESP WITHDRAWALS ---
            let eduExpense = 0;
            this.dependents.forEach(dep => {
                if (dep.hasEdu) {
                    let byear = parseInt(dep.dob.split('-')[0]) || yr;
                    let depAge = yr - byear;
                    let eStart = parseInt(dep.eduStart) || 18;
                    let eDur = parseInt(dep.eduDuration) || 4;
                    if (depAge >= eStart && depAge < eStart + eDur) {
                        eduExpense += (Number(dep.eduCost) || 15000) * baseInflation;
                    }
                }
            });

            let unfundedEdu = eduExpense;

            if (unfundedEdu > 0 && person1.resp > 0) {
                let p1Take = Math.min(person1.resp, unfundedEdu);
                if (p1Take > 0) {
                    person1.resp -= p1Take;
                    unfundedEdu -= p1Take;
                    if (detailed) {
                        flowLog.withdrawals['P1 RESP'] = (flowLog.withdrawals['P1 RESP'] || 0) + p1Take;
                        if (wdBreakdown) {
                            wdBreakdown.p1.RESP = p1Take;
                            wdBreakdown.p1.RESP_math = { wd: p1Take, tax: 0 };
                        }
                    }
                }
            }
            if (this.mode === 'Couple' && unfundedEdu > 0 && person2.resp > 0) {
                let p2Take = Math.min(person2.resp, unfundedEdu);
                if (p2Take > 0) {
                    person2.resp -= p2Take;
                    unfundedEdu -= p2Take;
                    if (detailed) {
                        flowLog.withdrawals['P2 RESP'] = (flowLog.withdrawals['P2 RESP'] || 0) + p2Take;
                        if (wdBreakdown) {
                            wdBreakdown.p2.RESP = p2Take;
                            wdBreakdown.p2.RESP_math = { wd: p2Take, tax: 0 };
                        }
                    }
                }
            }
            
            debtRepayment += unfundedEdu; 
            
            if (detailed && simProperties.reduce((sum: number, p: any) => sum + p.mortgage, 0) <= 0 && !trackedEvents.has('Mortgage Paid') && simProperties.some((p: any) => p.mortgage === 0 && p.value > 0)) {                
                trackedEvents.add('Mortgage Paid'); inflows.events.push('Mortgage Paid'); 
            }

            let pensionSplitTransfer = { p1ToP2: 0, p2ToP1: 0 };
            if (this.mode === 'Couple' && this.inputs['pension_split_enabled']) {
                applyPensionSplitting(craTaxableIncome1, craTaxableIncome2, inflows, regMins, age1, age2, (newInc1: number, newInc2: number, transferAmount: number, direction: string) => { 
                    craTaxableIncome1 = newInc1; craTaxableIncome2 = newInc2; 
                    if (direction === 'p1_to_p2') pensionSplitTransfer.p1ToP2 = transferAmount;
                    if (direction === 'p2_to_p1') pensionSplitTransfer.p2ToP1 = transferAmount;
                });
            }
            
            let tax1 = alive1 ? calculateTaxDetailed(craTaxableIncome1, provinceStr, taxBrackets, this.CONSTANTS, inflows.p1.oas, oasThresholdInf, inflows.p1.earned, baseInflation, divInc1, age1, getEligPension1(), alive2 ? craTaxableIncome2 : -1, isEligibleDividend, credits1) : {totalTax: 0, margRate: 0};
            let tax2 = alive2 ? calculateTaxDetailed(craTaxableIncome2, provinceStr, taxBrackets, this.CONSTANTS, inflows.p2.oas, oasThresholdInf, inflows.p2.earned, baseInflation, divInc2, age2, getEligPension2(), alive1 ? craTaxableIncome1 : -1, isEligibleDividend, credits2) : {totalTax: 0, margRate: 0};

            let netCashIncome1 = cashIncome1 - tax1.totalTax + inflows.p1.windfallNonTax + (inflows.p1.ccb || 0);
            let netCashIncome2 = alive2 ? cashIncome2 - tax2.totalTax + inflows.p2.windfallNonTax : 0;
            
            let netSurplus = (netCashIncome1 + netCashIncome2) - (expenses + mortgagePayment + rentPayment + debtRepayment);
            let actualDeductions = { p1: 0, p2: 0 };
            let actFhsaLim1 = fhsaClosed1 ? 0 : consts.fhsaLimit * baseInflation, actFhsaLim2 = fhsaClosed2 ? 0 : consts.fhsaLimit * baseInflation;

            if (netSurplus > 0) {
                handleSurplus(netSurplus, person1, person2, alive1, alive2, flowLog, i, consts.tfsaLimit * baseInflation, rrspRoom1, rrspRoom2, consts.cryptoLimit * baseInflation, actFhsaLim1, actFhsaLim2, consts.respLimit * baseInflation, actualDeductions, fhsaLifetimeRooms, this.strategies, this.inputs, this.CONSTANTS, age1, age2);
                
                if (actualDeductions.p1 > 0) pendingRefund.p1 = tax1.totalTax - calculateTaxDetailed(craTaxableIncome1 - actualDeductions.p1, provinceStr, taxBrackets, this.CONSTANTS, inflows.p1.oas, oasThresholdInf, inflows.p1.earned, baseInflation, divInc1, age1, getEligPension1(), alive2 ? (craTaxableIncome2 - actualDeductions.p2) : -1, isEligibleDividend, credits1).totalTax;
                if (actualDeductions.p2 > 0) pendingRefund.p2 = tax2.totalTax - calculateTaxDetailed(craTaxableIncome2 - actualDeductions.p2, provinceStr, taxBrackets, this.CONSTANTS, inflows.p2.oas, oasThresholdInf, inflows.p2.earned, baseInflation, divInc2, age2, getEligPension2(), alive1 ? (craTaxableIncome1 - actualDeductions.p1) : -1, isEligibleDividend, credits2).totalTax;
            } else {
                for (let pass = 0; pass < 10; pass++) {
                    let dynTax1 = calculateTaxDetailed(craTaxableIncome1, provinceStr, taxBrackets, this.CONSTANTS, inflows.p1.oas, oasThresholdInf, inflows.p1.earned, baseInflation, divInc1, age1, getEligPension1(), alive2 ? craTaxableIncome2 : -1, isEligibleDividend, credits1);
                    let dynTax2 = calculateTaxDetailed(craTaxableIncome2, provinceStr, taxBrackets, this.CONSTANTS, inflows.p2.oas, oasThresholdInf, inflows.p2.earned, baseInflation, divInc2, age2, getEligPension2(), alive1 ? craTaxableIncome1 : -1, isEligibleDividend, credits2);
                    tax1 = dynTax1; tax2 = dynTax2;

                    let currentDeficit = (expenses + mortgagePayment + rentPayment + debtRepayment) - ((cashIncome1 - dynTax1.totalTax + inflows.p1.windfallNonTax + (inflows.p1.ccb || 0)) + (alive2 ? cashIncome2 - dynTax2.totalTax + inflows.p2.windfallNonTax : 0));
                    if (currentDeficit < 1) break; 
                    
                    handleDeficit(currentDeficit, person1, person2, craTaxableIncome1, craTaxableIncome2, alive1, alive2, flowLog, wdBreakdown, taxBrackets, (prefix: string, taxableAmt: number, cashAmt: number) => {
                        if (prefix === 'p1') { craTaxableIncome1 += taxableAmt; cashIncome1 += cashAmt; }
                        if (prefix === 'p2') { craTaxableIncome2 += taxableAmt; cashIncome2 += cashAmt; }
                    }, age1, age2, inflows.p1.oas, inflows.p2.oas, oasThresholdInf, { lifMax1, lifMax2 }, inflows.p1.earned, inflows.p2.earned, baseInflation, divInc1, divInc2, simContext?.forceOrder || this.strategies.decum, getEligPension1(), getEligPension2(), this.inputs, this.CONSTANTS, provinceStr, this.CONSTANTS?.RRIF_START_AGE || 72, expenses + mortgagePayment + rentPayment + debtRepayment);
                }
                tax1 = calculateTaxDetailed(craTaxableIncome1, provinceStr, taxBrackets, this.CONSTANTS, inflows.p1.oas, oasThresholdInf, inflows.p1.earned, baseInflation, divInc1, age1, getEligPension1(), alive2 ? craTaxableIncome2 : -1, isEligibleDividend, credits1);
                tax2 = calculateTaxDetailed(craTaxableIncome2, provinceStr, taxBrackets, this.CONSTANTS, inflows.p2.oas, oasThresholdInf, inflows.p2.earned, baseInflation, divInc2, age2, getEligPension2(), alive1 ? craTaxableIncome1 : -1, isEligibleDividend, credits2);
            }

            previousAFNI = Math.max(0, (craTaxableIncome1 - actualDeductions.p1) + (craTaxableIncome2 - actualDeductions.p2));

            // --- APPLY GLOBAL TIMING DELTA MATH ---
            // Fix: Isolate Contribution vs Withdrawal timing triggers!
            let contTimingStr = String(this.inputs.contribution_timing || this.inputs.cashflow_timing || 'end').toLowerCase();
            let wdTimingStr = String(this.inputs.withdrawal_timing || this.inputs.cashflow_timing || 'end').toLowerCase();
            
            let contMultiplier = contTimingStr === 'start' ? 1.0 : (contTimingStr === 'mid' ? 0.5 : 0.0);
            let wdMultiplier = wdTimingStr === 'start' ? 1.0 : (wdTimingStr === 'mid' ? 0.5 : 0.0);

            if (contMultiplier > 0 || wdMultiplier > 0) {
                const applyTiming = (person: any, postGrowth: any, rates: any) => {
                    ['tfsa', 'rrsp', 'nonreg', 'cash', 'crypto', 'fhsa', 'lirf', 'lif', 'rrif_acct', 'resp'].forEach(key => {
                        const delta = (person[key] || 0) - (postGrowth[key] || 0);
                        if (delta !== 0 && rates && rates[key] !== undefined) {
                            let r = rates[key];
                            if (key === 'nonreg') r = Math.max(0, rates.nonreg - (person.nonreg_yield || 0));
                            
                            // Apply penalty for withdrawals vs bonus for contributions
                            const multiplier = delta > 0 ? contMultiplier : wdMultiplier;
                            const timingAdjustment = delta * r * multiplier;
                            person[key] += timingAdjustment;
                        }
                    });
                };
                if (alive1) applyTiming(person1, postGrowthP1, ratesP1);
                if (alive2) applyTiming(person2, postGrowthP2, ratesP2);
            }

            // Floor checks
            person1.tfsa = Math.max(0, person1.tfsa); person1.rrsp = Math.max(0, person1.rrsp); person1.cash = Math.max(0, person1.cash); person1.nonreg = Math.max(0, person1.nonreg); person1.crypto = Math.max(0, person1.crypto);
            person2.tfsa = Math.max(0, person2.tfsa); person2.rrsp = Math.max(0, person2.rrsp); person2.cash = Math.max(0, person2.cash); person2.nonreg = Math.max(0, person2.nonreg); person2.crypto = Math.max(0, person2.crypto);

            const liquidAssets1 = person1.tfsa + person1.tfsa_successor + person1.rrsp + person1.crypto + person1.nonreg + person1.cash + person1.lirf + person1.lif + person1.rrif_acct + (person1.fhsa || 0);
            const liquidAssets2 = this.mode === 'Couple' ? (person2.tfsa + person2.tfsa_successor + person2.rrsp + person2.crypto + person2.nonreg + person2.cash + person2.lirf + person2.lif + person2.rrif_acct + (person2.fhsa || 0)) : 0;
            const liquidNetWorth = (liquidAssets1 + liquidAssets2);
            
            finalNetWorth = liquidNetWorth + (realEstateValue - realEstateDebt);

            let termInc1 = person1.rrsp + person1.rrif_acct + person1.lif + person1.lirf + ((Math.max(0, person1.nonreg - person1.acb) + Math.max(0, person1.crypto - person1.crypto_acb)) * 0.5);
            let termInc2 = (this.mode === 'Couple') ? (person2.rrsp + person2.rrif_acct + person2.lif + person2.lirf + ((Math.max(0, person2.nonreg - person2.acb) + Math.max(0, person2.crypto - person2.crypto_acb)) * 0.5)) : 0;
            
            let termTax1 = calculateTaxDetailed(termInc1, provinceStr, taxBrackets, this.CONSTANTS, 0, 0, 0, baseInflation, 0, age1, 0, alive2 ? termInc2 : -1, true, credits1).totalTax;
            let termTax2 = (this.mode === 'Couple') ? calculateTaxDetailed(termInc2, provinceStr, taxBrackets, this.CONSTANTS, 0, 0, 0, baseInflation, 0, age2, 0, alive1 ? termInc1 : -1, true, credits2).totalTax : 0;
            let afterTaxEstateValue = finalNetWorth - termTax1 - termTax2;

            if (!detailed) {
                netWorthArray.push(finalNetWorth);
            } else {
                const formatter = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });

                if (wdBreakdown) {
                    (['p1', 'p2'] as const).forEach(prefix => {
                        Object.keys(wdBreakdown[prefix]).forEach(accountKey => {
                            if (!accountKey.includes('_math') && wdBreakdown[prefix][accountKey + '_math']) {
                                let mathObj = wdBreakdown[prefix][accountKey + '_math'];
                                let finalArith = '';

                                if (accountKey === 'Non-Reg' || accountKey === 'Crypto') {
                                    finalArith = `<div class="d-flex justify-content-between text-muted mb-1"><span>Gross Withdrawal:</span> <span>${formatter.format(mathObj.wd)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>ACB Disposed:</span> <span class="text-danger">-${formatter.format(mathObj.acb)}</span></div><div class="d-flex justify-content-between text-muted mb-1"><span>Capital Gain:</span> <span>${formatter.format(mathObj.gain)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Inclusion Rate:</span> <span>50%</span></div><div class="d-flex justify-content-between fw-bold text-main"><span>Taxable Income:</span> <span>${formatter.format(mathObj.tax)}</span></div>`;
                                } else if (accountKey === 'RRIF' || accountKey === 'LIF') {
                                    let breakdown = '';
                                    if ((mathObj.priorBal || 0) > 0) {
                                        breakdown += `<div class="d-flex justify-content-between text-muted mb-1"><span>Prior Year Balance:</span> <span>${formatter.format(mathObj.priorBal || 0)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Min Factor:</span> <span>${((mathObj.factor || 0) * 100).toFixed(2)}%</span></div><div class="d-flex justify-content-between text-muted mb-1"><span>Required Min:</span> <span>${formatter.format(mathObj.min || 0)}</span></div>`;
                                        if (Math.max(0, mathObj.wd - (mathObj.min || 0)) > 0) breakdown += `<div class="d-flex justify-content-between text-muted mb-1"><span>Extra Discretionary:</span> <span>${formatter.format(Math.max(0, mathObj.wd - (mathObj.min || 0)))}</span></div>`;
                                        breakdown += `<div class="border-bottom border-secondary pb-1 mb-1"></div>`;
                                    }
                                    finalArith = breakdown + `<div class="d-flex justify-content-between text-muted mb-1"><span>Total Withdrawal:</span> <span>${formatter.format(mathObj.wd)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Inclusion Rate:</span> <span>100%</span></div><div class="d-flex justify-content-between fw-bold text-main"><span>Taxable Income:</span> <span>${formatter.format(mathObj.tax)}</span></div>`;
                                } else if (accountKey === 'RRSP' || accountKey === 'LIRF') {
                                    finalArith = `<div class="d-flex justify-content-between text-muted mb-1"><span>Gross Withdrawal:</span> <span>${formatter.format(mathObj.wd)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Inclusion Rate:</span> <span>100%</span></div><div class="d-flex justify-content-between fw-bold text-main"><span>Taxable Income:</span> <span>${formatter.format(mathObj.tax)}</span></div>`;
                                } else {
                                    finalArith = `<div class="d-flex justify-content-between text-muted mb-1"><span>Gross Withdrawal:</span> <span>${formatter.format(mathObj.wd)}</span></div><div class="d-flex justify-content-between text-muted border-bottom border-secondary pb-1 mb-1"><span>Inclusion Rate:</span> <span>0% (Tax-Free)</span></div><div class="d-flex justify-content-between fw-bold text-main"><span>Taxable Income:</span> <span>$0</span></div>`;
                                }
                                mathObj.arith = finalArith;
                            }
                        });
                    });
                }

                const totalWithdrawals = Object.values(flowLog.withdrawals).reduce((sum: any, val: any) => sum + val, 0);
                const grossInflow = inflows.p1.gross + inflows.p1.cpp + inflows.p1.oas + inflows.p1.pension + inflows.p1.windfallTaxable + inflows.p1.windfallNonTax + (inflows.p1.ccb || 0) + inflows.p2.gross + inflows.p2.cpp + inflows.p2.oas + inflows.p2.pension + inflows.p2.windfallTaxable + inflows.p2.windfallNonTax + divInc1 + divInc2 + cryptoYield1 + cryptoYield2 + (totalWithdrawals as number);
                
                projectionData.push({
                    year: yr, p1Age: age1, p2Age: this.mode === 'Couple' ? age2 : null, p1Alive: alive1, p2Alive: alive2,
                    incomeP1: inflows.p1.gross, incomeP2: inflows.p2.gross, eiMatP1: inflows.p1.eiMat, eiMatP2: inflows.p2.eiMat, topUpP1: inflows.p1.topUp, topUpP2: inflows.p2.topUp,
                    rentalP1: inflows.p1.rental, rentalP2: inflows.p2.rental, otherP1: inflows.p1.other, otherP2: inflows.p2.other,
                    cppP1: inflows.p1.cpp, cppP2: inflows.p2.cpp, oasP1: inflows.p1.oas, oasP2: inflows.p2.oas, ccbP1: inflows.p1.ccb || 0,
                    oasClawbackP1: (tax1 as any).oas_clawback || 0, oasClawbackP2: (tax2 as any).oas_clawback || 0, 
                    taxIncP1: Math.max(0, craTaxableIncome1 - actualDeductions.p1), taxIncP2: Math.max(0, craTaxableIncome2 - actualDeductions.p2), oasThreshold: oasThresholdInf,                    
                    actualDeductionsP1: actualDeductions.p1, actualDeductionsP2: actualDeductions.p2,
                    benefitsP1: inflows.p1.cpp + inflows.p1.oas, benefitsP2: inflows.p2.cpp + inflows.p2.oas, dbP1: inflows.p1.pension, dbP2: inflows.p2.pension,
                    taxP1: tax1.totalTax, taxP2: tax2.totalTax, taxDetailsP1: tax1, taxDetailsP2: tax2, p1Net: cashIncome1 - tax1.totalTax + inflows.p1.windfallNonTax + (inflows.p1.ccb || 0), p2Net: alive2 ? cashIncome2 - tax2.totalTax + inflows.p2.windfallNonTax : 0, pensionSplit: pensionSplitTransfer,
                    expenses: expenses, rentPay: rentPayment, activeExpensePhases: activeExpensePhases, mortgagePay: mortgagePayment, debtRepayment, eduExpense, debtRemaining: 0, debugNW: finalNetWorth, liquidNW: liquidNetWorth, assetsP1: {...person1}, assetsP2: {...person2},
                    wdBreakdown: wdBreakdown, flows: flowLog, events: inflows.events, householdNet: grossInflow, grossInflow: grossInflow, 
                    visualExpenses: expenses + mortgagePayment + rentPayment + debtRepayment + tax1.totalTax + tax2.totalTax, mortgage: realEstateDebt + reExcludedDebt, homeValue: realEstateValue + reExcludedValue,
                    reIncludedEq: realEstateValue - realEstateDebt, reExcludedEq: reExcludedValue - reExcludedDebt, reIncludedValue: realEstateValue,
                    windfall: inflows.p1.windfallTaxable + (inflows.p1.windfallNonTax - appliedRefundP1) + inflows.p2.windfallTaxable + (inflows.p2.windfallNonTax - appliedRefundP2),
                    postRetP1: inflows.p1.postRet, postRetP2: inflows.p2.postRet, invIncP1: divInc1 + cryptoYield1, invIncP2: divInc2 + cryptoYield2, invYieldMathP1: { bal: preGrowthNonreg1, rate: person1.nonreg_yield, amt: divInc1 },
                    invYieldMathP2: { bal: preGrowthNonreg2, rate: person2.nonreg_yield, amt: divInc2 }, debugTotalInflow: grossInflow, rrspRoomP1: rrspRoom1, rrspRoomP2: rrspRoom2,
                    rrspMatchP1: actEmpPortionP1, rrspTotalMatch1: totalMatch1, rrspMatchP2: actEmpPortionP2, rrspTotalMatch2: totalMatch2, rrspRefundP1: appliedRefundP1, rrspRefundP2: appliedRefundP2,
                    matchTaxSavingsP1: matchTaxSavings1, matchTaxSavingsP2: matchTaxSavings2, discTaxSavingsP1: pendingRefund.p1, discTaxSavingsP2: pendingRefund.p2,
                    afterTaxEstate: afterTaxEstateValue 
                });
            }

            if (alive1 && !fhsaClosed1) {
                if (person1.fhsa > 0 || (detailed && flowLog && flowLog.contributions.p1.fhsa > 0)) { fhsaYearsP1 = fhsaYearsP1 === 0 ? 1 : fhsaYearsP1 + 1; }
                if (fhsaYearsP1 >= 15 || age1 >= 71) {
                    if (person1.fhsa > 0) {
                        if (age1 >= this.CONSTANTS.RRIF_START_AGE) person1.rrif_acct += person1.fhsa; else person1.rrsp += person1.fhsa;
                        if (detailed && !trackedEvents.has('FHSA Expired')) { trackedEvents.add('FHSA Expired'); projectionData[projectionData.length - 1].events.push('FHSA Expired'); }
                    }
                    person1.fhsa = 0; fhsaClosed1 = true;
                }
            }
            if (alive2 && !fhsaClosed2 && this.mode === 'Couple') {
                if (person2.fhsa > 0 || (detailed && flowLog && flowLog.contributions.p2.fhsa > 0)) { fhsaYearsP2 = fhsaYearsP2 === 0 ? 1 : fhsaYearsP2 + 1; }
                if (fhsaYearsP2 >= 15 || age2 >= 71) {
                    if (person2.fhsa > 0) {
                        if (age2 >= this.CONSTANTS.RRIF_START_AGE) person2.rrif_acct += person2.fhsa; else person2.rrsp += person2.fhsa;
                        if (detailed && !trackedEvents.has('FHSA Expired')) { trackedEvents.add('FHSA Expired'); if (!projectionData[projectionData.length - 1].events.includes('FHSA Expired')) projectionData[projectionData.length - 1].events.push('FHSA Expired'); }
                    }
                    person2.fhsa = 0; fhsaClosed2 = true;
                }
            }

            consts.cppMax1 *= (1 + consts.inflation); consts.oasMax1 *= (1 + consts.inflation);
            consts.cppMax2 *= (1 + consts.inflation); consts.oasMax2 *= (1 + consts.inflation);
        }
        
        return detailed ? projectionData : netWorthArray;
    }
}