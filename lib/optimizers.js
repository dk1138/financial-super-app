/**
 * optimizers.js
 * Pure logic for advanced simulations (Die With Zero, RRSP, Smith Maneuver).
 * Refactored for React: Returns data objects instead of manipulating the DOM.
 */
import { FinanceEngine } from './financeEngine.js';
import { CPPEngine } from './cppEngine.js';

export class Optimizers {
    constructor(appState) {
        // In React, we pass the current state data rather than the whole app instance
        this.state = appState; 
    }

    // ---------------- DIE WITH ZERO ---------------- //
    calculateDieWithZero(baseResult) {
        const baseFinalNW = baseResult[baseResult.length - 1];
        if (baseFinalNW <= 0) {
            return { success: false, message: "Your current plan already projects a shortfall." };
        }

        // --- Path 1: Spend More (Binary Search) ---
        let minMult = 1.0, maxMult = 10.0, bestMult = 1.0;
        for(let i=0; i<15; i++) {
            let mid = (minMult + maxMult) / 2;
            let testEngine = new FinanceEngine(this.state.engineData);
            let res = testEngine.runSimulation(false, { expenseMultiplier: mid });
            let finalNW = res[res.length - 1];
            if (finalNW > 0) {
                minMult = mid;
                bestMult = mid;
            } else {
                maxMult = mid;
            }
        }

        let baseRetSpend = 0;
        if(this.state.expenseMode === 'Simple') {
            Object.values(this.state.expensesByCategory).forEach(c => c.items.forEach(i => baseRetSpend += (i.ret || 0) * (i.freq || 12)));
        } else {
            Object.values(this.state.expensesByCategory).forEach(c => c.items.forEach(i => baseRetSpend += (i.gogo || 0) * (i.freq || 12)));
        }
        let extraSpend = baseRetSpend * (bestMult - 1);
        
        // --- Path 2: Retire Earlier (Linear Search) ---
        let testP1Age = this.state.inputs['p1_retireAge'];
        let testP2Age = this.state.mode === 'Couple' ? this.state.inputs['p2_retireAge'] : testP1Age;
        
        let currentP1Age = Math.abs(new Date(Date.now() - new Date(this.state.inputs['p1_dob']+"-01").getTime()).getUTCFullYear() - 1970);
        let currentP2Age = this.state.mode === 'Couple' ? Math.abs(new Date(Date.now() - new Date(this.state.inputs['p2_dob']+"-01").getTime()).getUTCFullYear() - 1970) : currentP1Age;
        
        let bestP1Age = testP1Age, bestP2Age = testP2Age;
        let possibleToRetireEarlier = false;

        while (testP1Age > currentP1Age || (this.state.mode === 'Couple' && testP2Age > currentP2Age)) {
            if (testP1Age > currentP1Age) testP1Age--;
            if (this.state.mode === 'Couple' && testP2Age > currentP2Age) testP2Age--;
            
            let testData = JSON.parse(JSON.stringify(this.state.engineData)); 
            testData.inputs['p1_retireAge'] = testP1Age;
            if(this.state.mode === 'Couple') testData.inputs['p2_retireAge'] = testP2Age;
            
            let testEngine = new FinanceEngine(testData);
            let res = testEngine.runSimulation(false, null);
            let finalNW = res[res.length - 1];
            
            if (finalNW >= 0) {
                bestP1Age = testP1Age;
                bestP2Age = testP2Age;
                possibleToRetireEarlier = true;
            } else {
                break;
            }
        }

        // --- Path 3: Legacy/Giveaway ---
        let presentValueLegacy = baseFinalNW / Math.pow(1 + this.state.inputs['inflation_rate']/100, baseResult.length - 1);

        return {
            success: true,
            spendMore: { multiplier: bestMult, extraSpend },
            retireEarlier: { possible: possibleToRetireEarlier, p1Age: bestP1Age, p2Age: bestP2Age },
            legacy: { presentValue: presentValueLegacy }
        };
    }

    // ---------------- RRSP OPTIMIZER ---------------- //
    calculateRRSP(pfx, maxRoom) {
        const engine = new FinanceEngine(this.state.engineData);
        const taxBrackets = engine.getInflatedTaxData(1);
        const prov = this.state.inputs['tax_province'];
        const currentYear = new Date().getFullYear();
        const dependents = this.state.dependents || [];

        const getInc = (person) => {
            let base = this.state.inputs[`${person}_income`] || 0;
            let empMatchRate = (this.state.inputs[`${person}_rrsp_match`] || 0) / 100;
            let empTier = (this.state.inputs[`${person}_rrsp_match_tier`] || 100) / 100;
            if(empTier <= 0) empTier = 1;
            let empRrspDeduction = (base * empMatchRate) / empTier; 

            let add = 0;
            this.state.additionalIncome.forEach(s => {
                if(s.owner === person && s.taxable && s.startMode !== 'ret_relative') {
                    let sY = new Date((s.start || "2026-01") + "-01").getFullYear();
                    if(currentYear >= sY) add += s.amount * (s.freq === 'month' ? 12 : 1);
                }
            });
            return { gross: base + add, rrspDeduct: empRrspDeduction };
        };

        const targetData = getInc(pfx);
        const otherData = this.state.mode === 'Couple' ? getInc(pfx === 'p1' ? 'p2' : 'p1') : { gross: 0, rrspDeduct: 0 };

        let startingTaxableInc = Math.max(0, targetData.gross - targetData.rrspDeduct);
        let otherTaxableInc = Math.max(0, otherData.gross - otherData.rrspDeduct);
        let startingFamilyNet = startingTaxableInc + otherTaxableInc;

        if (startingTaxableInc <= 0) return { error: "No taxable income to optimize." };

        let baseTax = engine.calculateTaxDetailed(startingTaxableInc, prov, taxBrackets);
        let baseCCB = engine.calculateCCBForYear(currentYear, dependents, startingFamilyNet, 1);

        let exactSweetSpot = 0;
        let prevMarginalReturn = 0;

        for(let c = 100; c <= Math.min(startingTaxableInc, maxRoom); c += 100) {
            let testTax = engine.calculateTaxDetailed(startingTaxableInc - c, prov, taxBrackets);
            let testCCB = engine.calculateCCBForYear(currentYear, dependents, startingFamilyNet - c, 1);
            
            let taxSavedTotal = baseTax.totalTax - testTax.totalTax;
            let ccbGainedTotal = testCCB - baseCCB;
            let totalSaved = taxSavedTotal + ccbGainedTotal;

            let prevTestTax = engine.calculateTaxDetailed(startingTaxableInc - (c - 100), prov, taxBrackets);
            let prevTestCCB = engine.calculateCCBForYear(currentYear, dependents, startingFamilyNet - (c - 100), 1);
            
            let prevTaxSaved = baseTax.totalTax - prevTestTax.totalTax;
            let prevCcbGained = prevTestCCB - baseCCB;
            let prevTotalSaved = prevTaxSaved + prevCcbGained;

            let marginalSavedOnThis100 = totalSaved - prevTotalSaved;
            let marginalRate = marginalSavedOnThis100 / 100;

            if (c === 100) {
                prevMarginalReturn = marginalRate;
            } else {
                if (marginalRate < prevMarginalReturn - 0.01) {
                    exactSweetSpot = c - 100;
                    break;
                }
                prevMarginalReturn = marginalRate;
            }
        }

        if(exactSweetSpot === 0) exactSweetSpot = Math.min(startingTaxableInc, maxRoom);

        let steps = [1000, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000];
        if (maxRoom > 0 && !steps.includes(maxRoom)) steps.push(maxRoom);
        if (exactSweetSpot > 0 && !steps.includes(exactSweetSpot)) steps.push(exactSweetSpot);
        
        steps = steps.filter(x => x <= maxRoom && x <= startingTaxableInc).sort((a,b) => a - b);

        let stepsData = steps.map(c => {
            let t = engine.calculateTaxDetailed(startingTaxableInc - c, prov, taxBrackets);
            let ccb = engine.calculateCCBForYear(currentYear, dependents, startingFamilyNet - c, 1);
            let taxRefund = baseTax.totalTax - t.totalTax;
            let ccbBoost = ccb - baseCCB;
            return {
                contribution: c,
                taxRefund,
                ccbBoost,
                totalRoi: taxRefund + ccbBoost,
                effRate: (taxRefund + ccbBoost) / c,
                isSweetSpot: c === exactSweetSpot
            };
        });

        return { exactSweetSpot, stepsData, hasCCB: dependents.length > 0, empDeduct: targetData.rrspDeduct };
    }

    // ---------------- SMITH MANEUVER ---------------- //
    calculateSmithManeuver(params) {
        const { homeVal, propGrowth, balMortgage, amortYears, rateMortgage, rateHeloc, rateInvest, taxRate, useAccelerator, useDay1, useCashDam, annualCashDamAmt } = params;
        
        if (balMortgage <= 0 || amortYears <= 0 || homeVal <= 0) return { error: "Invalid parameters" };

        let monthlyMortgageRate = rateMortgage / 12;
        let numPayments = amortYears * 12;
        let payment = monthlyMortgageRate > 0 ? balMortgage * (monthlyMortgageRate * Math.pow(1 + monthlyMortgageRate, numPayments)) / (Math.pow(1 + monthlyMortgageRate, numPayments) - 1) : balMortgage / numPayments;
        let monthlyCashDam = useCashDam ? (annualCashDamAmt / 12) : 0;

        let stdMortgage = balMortgage;
        let stdPortfolio = 0;
        let smMortgage = balMortgage;
        let smHeloc = 0;
        let smPortfolio = 0;
        let currentPropVal = homeVal;
        
        let totalTaxRefunds = 0;
        let totalInterestPaid = 0;
        let currentYearInterest = 0;

        let tableData = [];
        let chartDataStandard = [0];
        let chartDataSM = [0];

        if (useDay1) {
            let initialAvail = Math.max(0, Math.min(currentPropVal * 0.80 - smMortgage, currentPropVal * 0.65));
            smHeloc += initialAvail;
            smPortfolio += initialAvail;
        }

        tableData.push({ year: 0, home: currentPropVal, stdMort: stdMortgage, smMort: smMortgage, smHeloc, smPort: smPortfolio, netBen: 0 });

        let smMortgagePaidOffMonth = 0;
        let stdMortgagePaidOffMonth = 0;

        for (let m = 1; m <= numPayments; m++) {
            currentPropVal += currentPropVal * (propGrowth / 12);

            if (stdMortgage > 0) {
                let stdPrincipal = payment - (stdMortgage * monthlyMortgageRate);
                if (stdPrincipal > stdMortgage) { stdPrincipal = stdMortgage; if(!stdMortgagePaidOffMonth) stdMortgagePaidOffMonth = m; }
                stdMortgage -= stdPrincipal;
            } else {
                if(!stdMortgagePaidOffMonth) stdMortgagePaidOffMonth = m;
                stdPortfolio += payment;
            }
            stdPortfolio += stdPortfolio * (rateInvest / 12);

            let maxTotalDebt = currentPropVal * 0.80;
            let maxHelocLimit = currentPropVal * 0.65;

            if (smMortgage > 0) {
                let smPrincipal = payment - (smMortgage * monthlyMortgageRate);
                if (smPrincipal > smMortgage) { smPrincipal = smMortgage; if(!smMortgagePaidOffMonth) smMortgagePaidOffMonth = m; }
                smMortgage -= smPrincipal;

                let availHeloc = Math.max(0, Math.min(maxTotalDebt - smMortgage, maxHelocLimit) - smHeloc);
                let borrowInvest = Math.min(smPrincipal, availHeloc);
                smHeloc += borrowInvest;
                smPortfolio += borrowInvest;

                if (useCashDam && monthlyCashDam > 0 && smMortgage > 0) {
                    let damRoom = Math.max(0, Math.min(maxTotalDebt - smMortgage, maxHelocLimit) - smHeloc);
                    let actualDam = Math.min(monthlyCashDam, damRoom, smMortgage);
                    smMortgage -= actualDam;
                    smHeloc += actualDam;
                }
            } else {
                if(!smMortgagePaidOffMonth) smMortgagePaidOffMonth = m;
                let helocPaydown = Math.min(payment, smHeloc);
                smHeloc -= helocPaydown;
                if (payment > helocPaydown) smPortfolio += (payment - helocPaydown);
            }

            let helocMonthlyInterest = smHeloc * (rateHeloc / 12);
            currentYearInterest += helocMonthlyInterest;
            totalInterestPaid += helocMonthlyInterest;
            
            let roomForInterest = Math.max(0, Math.min(maxTotalDebt - smMortgage, maxHelocLimit) - smHeloc);
            let interestBorrowed = Math.min(helocMonthlyInterest, roomForInterest);
            smHeloc += interestBorrowed;
            
            let interestOutOfPocket = helocMonthlyInterest - interestBorrowed;
            if (interestOutOfPocket > 0) smPortfolio -= interestOutOfPocket;

            smPortfolio += smPortfolio * (rateInvest / 12);

            if (m % 12 === 0 || m === numPayments) {
                let refund = currentYearInterest * taxRate;
                totalTaxRefunds += refund;
                
                if (useAccelerator && smMortgage > 0) {
                    let lumpSum = Math.min(smMortgage, refund);
                    smMortgage -= lumpSum;
                    let newRoom = Math.max(0, Math.min(maxTotalDebt - smMortgage, maxHelocLimit) - smHeloc);
                    let accelBorrow = Math.min(lumpSum, newRoom);
                    smHeloc += accelBorrow;
                    smPortfolio += accelBorrow;
                    if (refund > lumpSum) smPortfolio += (refund - lumpSum);
                } else if (useAccelerator && smMortgage <= 0) {
                    smHeloc -= Math.min(smHeloc, refund);
                } else {
                    smPortfolio += refund;
                }
                currentYearInterest = 0;

                let year = Math.ceil(m / 12);
                let stdNetEquity = currentPropVal - stdMortgage + stdPortfolio;
                let smNetEquity = currentPropVal - smMortgage - smHeloc + smPortfolio;
                let netBenefit = smNetEquity - stdNetEquity;

                chartDataStandard.push(0); 
                chartDataSM.push(Math.round(netBenefit));

                tableData.push({ year, home: currentPropVal, stdMort: stdMortgage, smMort: smMortgage, smHeloc, smPort: smPortfolio, netBen: netBenefit });
            }
        }

        return {
            tableData, chartDataSM, chartDataStandard,
            finalNetBenefit: chartDataSM[chartDataSM.length - 1],
            smMortgagePaidOffMonth, stdMortgagePaidOffMonth,
            finalPortfolio: smPortfolio, finalHeloc: smHeloc, totalTaxRefunds
        };
    }
}