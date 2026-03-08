import React, { useState, useEffect } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { FinanceEngine } from '../lib/financeEngine';
import { FINANCIAL_CONSTANTS } from '../lib/config';
import { InfoBtn, CurrencyInput, PercentInput, MonthYearStepper } from './SharedUI';

// Historical YMPE Data
const getYMPE = (year: number) => {
    const ympeMap: Record<number, number> = {
        2026: 73200, 2025: 71300, 2024: 68500, 2023: 66600, 2022: 64900, 2021: 61600,
        2020: 58700, 2019: 57400, 2018: 55900, 2017: 55300, 2016: 54900, 2015: 53600, 
        2014: 52500, 2013: 51100, 2012: 50100, 2011: 48300, 2010: 47200, 2009: 46300, 
        2008: 44900, 2007: 43700, 2006: 42100
    };
    if (year > 2026) return 73200 + ((year - 2026) * 1500); 
    if (year < 2006) return 40000;
    return ympeMap[year];
};

const getYAMPE = (year: number) => {
    if (year === 2024) return 73200;
    if (year === 2025) return 80500;
    if (year >= 2026) return getYMPE(year) * 1.14; 
    return getYMPE(year); 
};

// Canadian Mortgage Payment Calc
const calcCanadianMortgagePmt = (balance: number, annualRate: number, yearsAmort: number) => {
    if(annualRate === 0 || yearsAmort === 0) return 0;
    const r = Math.pow(1 + (annualRate/100)/2, 2/12) - 1;
    const n = yearsAmort * 12;
    return (balance * r) / (1 - Math.pow(1+r, -n));
}

// Ontario Land Transfer Tax Calc
const calcOntarioLTT = (val: number, isToronto: boolean) => {
    let tax = 0;
    if (val <= 55000) tax += val * 0.005;
    else tax += 55000 * 0.005;
    if (val > 55000 && val <= 250000) tax += (Math.min(val, 250000) - 55000) * 0.01;
    if (val > 250000 && val <= 400000) tax += (Math.min(val, 400000) - 250000) * 0.015;
    if (val > 400000 && val <= 2000000) tax += (Math.min(val, 2000000) - 400000) * 0.02;
    if (val > 2000000) tax += (val - 2000000) * 0.025;
    return isToronto ? tax * 2 : tax;
};

export default function OptimizersTab() {
  const { data, updateInput, results } = useFinance();
  const [activeCategory, setActiveCategory] = useState('Master Simulations'); 
  const [activeTool, setActiveTool] = useState('dwz'); 
  
  // Format Helper
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

  // Engine States
  const [isCalculating, setIsCalculating] = useState(false);
  const [maxSpendResult, setMaxSpendResult] = useState<any>(null);
  const [cppResult, setCppResult] = useState<any>(null);
  const [rrspSweetSpot, setRrspSweetSpot] = useState<any>(null);
  const [tfsaRrspResult, setTfsaRrspResult] = useState<any>(null);

  // Interactive Tools States
  const [sweetSpotTab, setSweetSpotTab] = useState<'p1'|'p2'>('p1');
  const [grossUpTab, setGrossUpTab] = useState<'p1'|'p2'>('p1');
  const [grossUpCash, setGrossUpCash] = useState<number>(5000);
  
  // CPP Importer States
  const [cppStep, setCppStep] = useState<'import'|'edit'|'results'>('import');
  const [cppPasteText, setCppPasteText] = useState<string>('');
  const [cppRecords, setCppRecords] = useState<{id: string, year: number, earnings: number}[]>([]);
  const [cppAnalysis, setCppAnalysis] = useState<any>(null);
  const [cppTargetTab, setCppTargetTab] = useState<'p1'|'p2'>('p1');
  const [cppProjectFuture, setCppProjectFuture] = useState(true);
  
  const [toastMsg, setToastMsg] = useState('');
  const showToast = (msg: string) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 3000);
  };

  const isCouple = data.mode === 'Couple';
  const stringifiedInputs = JSON.stringify(data.inputs);

  // Real Dollars Discounting Helper
  const inflation = (data.inputs.inflation_rate || 2.1) / 100;
  const getRealValue = (nominalValue: number, startYear: number, endYear: number) => {
      if (!data.useRealDollars) return nominalValue;
      const yearsOut = Math.max(0, endYear - startYear);
      return nominalValue / Math.pow(1 + inflation, yearsOut);
  };

  // Safe Sandbox Engine Runner
  const runSandbox = (inputOverrides: any = {}, expenseMultiplier: number = 1.0) => {
      const clonedData = JSON.parse(JSON.stringify(data));
      Object.assign(clonedData.inputs, inputOverrides);
      
      if (expenseMultiplier !== 1.0) {
          Object.keys(clonedData.expensesByCategory).forEach(cat => {
              clonedData.expensesByCategory[cat].items.forEach((item: any) => {
                  if (item.curr) item.curr *= expenseMultiplier;
                  if (item.ret) item.ret *= expenseMultiplier;
                  if (item.trans) item.trans *= expenseMultiplier;
                  if (item.gogo) item.gogo *= expenseMultiplier;
                  if (item.slow) item.slow *= expenseMultiplier;
                  if (item.nogo) item.nogo *= expenseMultiplier;
              });
          });
      }

      const engine = new FinanceEngine(clonedData);
      return engine.runSimulation(true, null);
  };

  // Run Master Engine Optimizers
  const runEngineOptimizers = () => {
      setIsCalculating(true);

      setTimeout(() => {
          
          // 1. MAX SPEND OPTIMIZER (Die With Zero)
          let low = 0.05; 
          let high = 5.0; 
          let bestMultiplier = 0;
          let bestEstate = 0;
          let bestTimeline: any = null;

          for (let i = 0; i < 15; i++) { 
              const mid = (low + high) / 2;
              const timeline = runSandbox({}, mid);
              const isSuccess = timeline.every((y: any) => y.liquidNW > 0);

              if (isSuccess) {
                  bestMultiplier = mid;
                  bestEstate = timeline[timeline.length - 1].afterTaxEstate !== undefined ? timeline[timeline.length - 1].afterTaxEstate : (timeline[timeline.length - 1].liquidNW + (timeline[timeline.length - 1].reIncludedEq || 0));
                  bestTimeline = timeline;
                  low = mid; 
              } else {
                  high = mid; 
              }
          }

          if (bestTimeline && bestMultiplier > 0) {
              const baseTimeline = runSandbox();
              const baseRetYear = baseTimeline.find((y: any) => y.p1Age >= data.inputs.p1_retireAge) || baseTimeline[baseTimeline.length - 1];
              const optRetYear = bestTimeline.find((y: any) => y.p1Age >= data.inputs.p1_retireAge) || bestTimeline[bestTimeline.length - 1];
              
              const startYear = baseTimeline[0].year;
              const baseSpend = getRealValue(baseRetYear.expenses || 0, startYear, baseRetYear.year);
              const optSpend = getRealValue(optRetYear.expenses || 0, startYear, optRetYear.year);
              
              setMaxSpendResult({
                  multiplier: bestMultiplier,
                  baseSpend: baseSpend,
                  optSpend: optSpend,
                  difference: optSpend - baseSpend,
                  finalEstate: getRealValue(bestEstate, startYear, bestTimeline[bestTimeline.length-1].year)
              });
          } else {
              setMaxSpendResult({ difference: -999999, optSpend: 0 });
          }

          // 2. CPP/OAS GRID SEARCH OPTIMIZER
          const cppResultsArr: any[] = [];
          for (let cpp = 60; cpp <= 70; cpp++) {
              for (let oas = 65; oas <= 70; oas++) {
                  const overrides = { 
                      p1_cpp_start: cpp, p2_cpp_start: cpp,
                      p1_oas_start: oas, p2_oas_start: oas 
                  };
                  const timeline = runSandbox(overrides);
                  const startYear = timeline[0].year;
                  const finalEstate = timeline[timeline.length - 1].afterTaxEstate !== undefined ? timeline[timeline.length - 1].afterTaxEstate : (timeline[timeline.length - 1].liquidNW + (timeline[timeline.length - 1].reIncludedEq || 0));
                  
                  cppResultsArr.push({
                      cppAge: cpp,
                      oasAge: oas,
                      finalEstate: getRealValue(finalEstate, startYear, timeline[timeline.length-1].year)
                  });
              }
          }

          const sortedCpp = [...cppResultsArr].sort((a, b) => b.finalEstate - a.finalEstate);
          setCppResult({
              winner: sortedCpp[0],
              scenarios: sortedCpp.slice(0, 5)
          });

          // 3. RRSP TAX BRACKET SWEET SPOT
          const engine = new FinanceEngine(data);
          const prov = data.inputs.tax_province || 'ON';
          const taxDataObj = engine.getInflatedTaxData(1);
          
          const getSweetSpot = (incomeStr: string) => {
              const currentIncome = Number(incomeStr) || 0;
              if (currentIncome <= 15000) return null;
              
              const baseTaxObj = engine.calculateTaxDetailed(currentIncome, prov, taxDataObj, 0, 0, currentIncome, 1, 0);
              const baseMargRate = baseTaxObj.margRate;

              let bracketFloor = currentIncome;
              for(let inc = currentIncome; inc >= 15000; inc -= 500) {
                  let testRate = engine.calculateTaxDetailed(inc, prov, taxDataObj, 0, 0, inc, 1, 0).margRate;
                  if (baseMargRate - testRate >= 0.015) { 
                      bracketFloor = inc + 500;
                      break;
                  }
              }
              
              const optCont = currentIncome - bracketFloor;
              const optRefund = baseTaxObj.totalTax - engine.calculateTaxDetailed(bracketFloor, prov, taxDataObj, 0, 0, bracketFloor, 1, 0).totalTax;
              const nextRate = engine.calculateTaxDetailed(bracketFloor - 500, prov, taxDataObj, 0, 0, bracketFloor - 500, 1, 0).margRate;

              return {
                  income: currentIncome,
                  marginalRate: baseMargRate,
                  contribution: optCont,
                  refund: optRefund,
                  nextRate: nextRate
              };
          };

          setRrspSweetSpot({
              p1: getSweetSpot(data.inputs.p1_income),
              p2: isCouple ? getSweetSpot(data.inputs.p2_income) : null
          });

          // 4. TFSA vs RRSP ANALYZER
          const p1CurrentInc = Number(data.inputs.p1_income) || 0;
          const p1CurrentTax = engine.calculateTaxDetailed(p1CurrentInc, prov, taxDataObj, 0, 0, p1CurrentInc, 1, 0);
          const currMarginal = p1CurrentTax.margRate;

          const baseCheck = runSandbox();
          let totalRetTax = 0;
          let totalRetInc = 0;
          baseCheck.forEach((y: any) => {
              if (y.p1Age >= (Number(data.inputs.p1_retireAge) || 65)) {
                  totalRetTax += y.taxP1;
                  totalRetInc += y.taxIncP1;
              }
          });
          
          const avgRetTaxRate = totalRetInc > 0 ? totalRetTax / totalRetInc : 0;
          
          setTfsaRrspResult({
              currentMarginal: currMarginal,
              avgRetTaxRate: avgRetTaxRate,
              winner: currMarginal >= avgRetTaxRate ? 'RRSP' : 'TFSA'
          });

          setIsCalculating(false);
      }, 50);
  };

  useEffect(() => {
      setIsCalculating(true);
      const timer = setTimeout(() => {
          runEngineOptimizers();
      }, 500);
      return () => clearTimeout(timer);
  }, [stringifiedInputs]);

  const applyCppStrategy = () => {
      if (cppResult && cppResult.winner) {
          const optCpp = cppResult.winner.cppAge;
          const optOas = cppResult.winner.oasAge;
          updateInput('p1_cpp_start', optCpp);
          updateInput('p1_oas_start', optOas);
          if (isCouple) {
              updateInput('p2_cpp_start', optCpp);
              updateInput('p2_oas_start', optOas);
          }
          showToast(`CPP set to ${optCpp}, OAS set to ${optOas}!`);
      }
  };


  // Auto-extracted Context Variables for Micro Tools
  const householdIncome = (Number(data.inputs.p1_income) || 0) + (data.mode === 'Couple' ? (Number(data.inputs.p2_income) || 0) : 0);
  const p1Marginal = results?.timeline?.[0]?.taxDetailsP1?.margRate * 100 || 30;
  const p2Marginal = results?.timeline?.[0]?.taxDetailsP2?.margRate * 100 || 30;
  const kidsCount = data.dependents?.length || 0;
  const firstMortgage = data.properties?.find((p: any) => p.mortgage > 0);
  const primaryProperty = data.properties?.find((p: any) => p.includeInNW);

  // ==========================================
  // MICRO TOOL STATES & MATH
  // ==========================================
  
  // Pension Buyback Analyzer
  const [bbCost, setBbCost] = useState(15000);
  const [bbAddedPension, setBbAddedPension] = useState(1500);
  const [bbYears, setBbYears] = useState(10);
  const [bbReturn, setBbReturn] = useState(6.0);

  const bbFutureValue = bbCost * Math.pow(1 + (bbReturn / 100), bbYears);
  const bbMatchRate = bbFutureValue > 0 ? (bbAddedPension / bbFutureValue) * 100 : 0;

  // CCB Maximizer
  const [ccbIncome, setCcbIncome] = useState(householdIncome || 100000);
  const [ccbKidsUnder6, setCcbKidsUnder6] = useState(kidsCount > 0 ? kidsCount : 1);
  const [ccbKidsOver6, setCcbKidsOver6] = useState(0);
  const [ccbRrspContrib, setCcbRrspContrib] = useState(5000);

  const calcCCB = (netIncome: number, u6: number, o6: number) => {
      const maxU6 = 7437; const maxO6 = 6275;
      const t1 = 34863; const t2 = 75537;
      const totalKids = u6 + o6;
      if (totalKids === 0) return 0;
      let maxBenefit = (u6 * maxU6) + (o6 * maxO6);
      let rateIndex = Math.min(totalKids - 1, 3);
      const rate1 = [0.07, 0.135, 0.19, 0.23];
      const rate2 = [0.032, 0.057, 0.08, 0.095];
      let reduction = 0;
      if (netIncome > t2) {
          reduction = ((t2 - t1) * rate1[rateIndex]) + ((netIncome - t2) * rate2[rateIndex]);
      } else if (netIncome > t1) {
          reduction = (netIncome - t1) * rate1[rateIndex];
      }
      return Math.max(0, maxBenefit - reduction);
  };
  const currentCCB = calcCCB(ccbIncome, ccbKidsUnder6, ccbKidsOver6);
  const newCCB = calcCCB(ccbIncome - ccbRrspContrib, ccbKidsUnder6, ccbKidsOver6);
  const ccbBoost = newCCB - currentCCB;
  const ccbTaxRefund = ccbRrspContrib * (p1Marginal / 100);
  const ccbTotalROI = ((ccbBoost + ccbTaxRefund) / (ccbRrspContrib || 1)) * 100;

  // Medical Expense Window Optimizer
  const initialMedIncome = isCouple ? Math.min(Number(data.inputs.p1_income)||0, Number(data.inputs.p2_income)||0) || 50000 : Number(data.inputs.p1_income) || 50000;
  const [medIncome, setMedIncome] = useState(initialMedIncome);
  const [medBills, setMedBills] = useState<{id: string, date: string, amount: number}[]>([
      { id: '1', date: '2024-03', amount: 1500 },
      { id: '2', date: '2024-08', amount: 800 },
      { id: '3', date: '2025-01', amount: 2200 }
  ]);
  
  const medHurdle = Math.min(2759, medIncome * 0.03); // CRA limit approx 2759 or 3% of net income
  let bestMedWindow = { start: '', end: '', total: 0, eligible: 0 };
  
  if (medBills.length > 0) {
      const sortedBills = [...medBills].sort((a,b) => a.date.localeCompare(b.date));
      sortedBills.forEach(bill => {
          const endD = new Date(bill.date + '-01');
          const startD = new Date(endD);
          startD.setMonth(startD.getMonth() - 11); 
          
          const startStr = startD.toISOString().substring(0,7);
          const endStr = bill.date;
          
          let windowTotal = 0;
          sortedBills.forEach(b => {
              if (b.date >= startStr && b.date <= endStr) {
                  windowTotal += b.amount;
              }
          });
          
          const eligible = Math.max(0, windowTotal - medHurdle);
          if (eligible >= bestMedWindow.eligible && windowTotal > bestMedWindow.total) {
              bestMedWindow = { start: startStr, end: endStr, total: windowTotal, eligible };
          }
      });
  }

  const addMedBill = () => {
      const lastDate = medBills.length > 0 ? medBills[medBills.length - 1].date : `${new Date().getFullYear()}-01`;
      setMedBills([...medBills, { id: Math.random().toString(), date: lastDate, amount: 0 }]);
  };
  const updateMedBill = (id: string, field: string, val: any) => {
      setMedBills(medBills.map(b => b.id === id ? { ...b, [field]: val } : b));
  };
  const removeMedBill = (id: string) => {
      setMedBills(medBills.filter(b => b.id !== id));
  };
  const formatMonthYear = (yyyymm: string) => {
      if (!yyyymm) return '';
      const [y, m] = yyyymm.split('-');
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[parseInt(m, 10)-1]} ${y}`;
  };

  // Side-Hustle ROI
  const [shGross, setShGross] = useState(25000);
  const [shDirectExp, setShDirectExp] = useState(4000);
  const [shHomeExp, setShHomeExp] = useState(3000);
  const [shMarginal, setShMarginal] = useState(p1Marginal);

  const totalShDeductions = shDirectExp + shHomeExp;
  const shNetIncome = Math.max(0, shGross - totalShDeductions);
  const taxSavedByDeductions = totalShDeductions * (shMarginal / 100);
  const extraCppPremium = shNetIncome * 0.0595; 
  const extraCppTaxShield = extraCppPremium * (shMarginal / 100);
  const netExtraCppCost = extraCppPremium - extraCppTaxShield;
  const shNetAdvantage = taxSavedByDeductions - netExtraCppCost;

  // Pay Down Mortgage vs Invest
  const [mviLumpSum, setMviLumpSum] = useState(10000);
  const [mviMortgageRate, setMviMortgageRate] = useState(firstMortgage?.rate || 4.5);
  const [mviInvestReturn, setMviInvestReturn] = useState(7.0);
  const [mviYears, setMviYears] = useState(10);
  const [mviTaxRate, setMviTaxRate] = useState(0); 

  const mviInvestVal = mviLumpSum * Math.pow(1 + ((mviInvestReturn / 100) * (1 - (mviTaxRate / 100))), mviYears);
  const mviMortgageVal = mviLumpSum * Math.pow(1 + (mviMortgageRate / 100), mviYears);
  const mviDiff = mviInvestVal - mviMortgageVal;

  // FHSA vs RRSP HBP
  const [fhsaAmount, setFhsaAmount] = useState(8000);
  const [fhsaTaxRate, setFhsaTaxRate] = useState(p1Marginal);
  const [fhsaYears, setFhsaYears] = useState(5);
  const [fhsaReturn, setFhsaReturn] = useState(6.0);

  const fhsaGrowth = fhsaAmount * Math.pow(1 + (fhsaReturn/100), fhsaYears);
  const fhsaTaxRefund = fhsaAmount * (fhsaTaxRate / 100);
  const hbpRepaymentCost = (fhsaAmount / 15) * (1 / (1 - (fhsaTaxRate/100))) * 15; 

  // RESP Grant Maximizer
  const estChildBirthYear = data.dependents?.[0] ? parseInt(data.dependents[0].dob.split('-')[0]) : (new Date().getFullYear() - 5);
  const estChildAge = Math.max(0, new Date().getFullYear() - estChildBirthYear);
  const [respAge, setRespAge] = useState(estChildAge);
  const [respAnnualCont, setRespAnnualCont] = useState(2500);
  const [respPriorGrants, setRespPriorGrants] = useState(estChildAge > 0 ? estChildAge * 500 : 0);

  const respRemainingYears = Math.max(0, 17 - respAge);
  const respRoomLeft = Math.max(0, 7200 - respPriorGrants);
  const standardGrantPerYear = Math.min(500, respAnnualCont * 0.20);
  const canCatchUp = respAnnualCont > 2500;
  const catchUpGrantPerYear = canCatchUp ? Math.min(500, (respAnnualCont - 2500) * 0.20) : 0;
  const totalGrantPerYear = standardGrantPerYear + catchUpGrantPerYear;
  const projectedFutureGrants = Math.min(respRoomLeft, totalGrantPerYear * respRemainingYears);

  // Home Move-Up Analyzer
  const [muCurrentValue, setMuCurrentValue] = useState(primaryProperty?.value || 1000000);
  const [muMortgage, setMuMortgage] = useState(primaryProperty?.mortgage || 400000);
  const [muNewValue, setMuNewValue] = useState(1400000);
  const [muToronto, setMuToronto] = useState(false);

  const muRealtorFee = muCurrentValue * 0.05;
  const muCurrentLegal = 1500;
  const muNetEquity = Math.max(0, muCurrentValue - muMortgage - muRealtorFee - muCurrentLegal);
  const muLtt = calcOntarioLTT(muNewValue, muToronto);
  const muNewLegal = 2000;
  const muRequiredMortgage = muNewValue + muLtt + muNewLegal - muNetEquity;

  // Mortgage Renewal Shock
  const [rnwBalance, setRnwBalance] = useState(430000);
  const [rnwAmort, setRnwAmort] = useState(20);
  const [rnwOldRate, setRnwOldRate] = useState(3.29);
  const [rnwNewRate, setRnwNewRate] = useState(4.85);
  const [rnwLumpSum, setRnwLumpSum] = useState(0);

  const rnwOldPmt = calcCanadianMortgagePmt(rnwBalance, rnwOldRate, rnwAmort);
  const rnwNewBalance = Math.max(0, rnwBalance - rnwLumpSum);
  const rnwNewPmt = calcCanadianMortgagePmt(rnwNewBalance, rnwNewRate, rnwAmort);
  const rnwDiff = rnwNewPmt - rnwOldPmt;
  
  const rnwTotalInterestNoLump = (calcCanadianMortgagePmt(rnwBalance, rnwNewRate, rnwAmort) * rnwAmort * 12) - rnwBalance;
  const rnwTotalInterestWithLump = (rnwNewPmt * rnwAmort * 12) - rnwNewBalance;
  const rnwInterestSaved = rnwTotalInterestNoLump - rnwTotalInterestWithLump;

  // DB Pension Commuted Value Analyzer
  const [cvAge, setCvAge] = useState(55);
  const [cvMonthly, setCvMonthly] = useState(3000);
  const [cvLumpSum, setCvLumpSum] = useState(600000);
  const [cvReturn, setCvReturn] = useState(6.0);

  const cvAnnualPension = cvMonthly * 12;
  const cvWithdrawalRate = cvLumpSum > 0 ? (cvAnnualPension / cvLumpSum) * 100 : 0;
  
  let cvYearsLeft = 0;
  let tempBal = cvLumpSum;
  const rCv = cvReturn / 100;
  while(tempBal > 0 && cvYearsLeft < 50) {
      tempBal = tempBal * (1 + rCv) - cvAnnualPension;
      if (tempBal > 0) cvYearsLeft++;
  }
  const cvDepletionAge = cvAge + cvYearsLeft;

  // Smith Maneuver
  const [smLoan, setSmLoan] = useState(100000);
  const [smHelocRate, setSmHelocRate] = useState(7.2);
  const [smInvestReturn, setSmInvestReturn] = useState(8.0);
  const [smTaxRate, setSmTaxRate] = useState(p1Marginal);

  const smEffectiveBorrowingRate = smHelocRate * (1 - (smTaxRate / 100));
  const smSpread = smInvestReturn - smEffectiveBorrowingRate;
  const smAnnualProfit = smLoan * (smSpread / 100);

  // Emergency Fund Sizer
  const [emMonthlyExp, setEmMonthlyExp] = useState(5000);
  const [emMonthsToHire, setEmMonthsToHire] = useState(6);
  const [emEiEligible, setEmEiEligible] = useState(true);
  const [emSeverance, setEmSeverance] = useState(1);

  const emEiWeekly = 668; 
  const emEiMonthly = (emEiWeekly * 52) / 12;
  const emTotalNeeded = emMonthlyExp * emMonthsToHire;
  const emSeveranceCash = emMonthlyExp * emSeverance;
  const emEiCash = emEiEligible ? Math.max(0, (emMonthsToHire - emSeverance - 0.5)) * emEiMonthly : 0; 
  const emCashRequired = Math.max(0, emTotalNeeded - emSeveranceCash - emEiCash);

  // Buy vs Lease Car
  const [carLeaseMo, setCarLeaseMo] = useState(550);
  const [carLeaseDown, setCarLeaseDown] = useState(3000);
  const [carLeaseBuyout, setCarLeaseBuyout] = useState(20000);
  const [carFinanceMo, setCarFinanceMo] = useState(700);
  const [carFinanceDown, setCarFinanceDown] = useState(5000);
  const [carTerm, setCarTerm] = useState(48);

  const totalLeaseToOwn = carLeaseDown + (carLeaseMo * carTerm) + carLeaseBuyout;
  const totalFinance = carFinanceDown + (carFinanceMo * carTerm);
  const carDiff = totalLeaseToOwn - totalFinance;

  // Mortgage Affordability Calculator
  const [affordIncome, setAffordIncome] = useState(householdIncome || 120000);
  const [affordDebt, setAffordDebt] = useState(500); 
  const [affordRate, setAffordRate] = useState(6.50); 
  const [affordPropTax, setAffordPropTax] = useState(4000);

  const affordMonthlyIncome = affordIncome / 12;
  const affordMonthlyTax = affordPropTax / 12;
  const affordHeatMonthly = 150; 
  
  const maxGdsPayment = (affordMonthlyIncome * 0.39) - affordMonthlyTax - affordHeatMonthly;
  const maxTdsPayment = (affordMonthlyIncome * 0.44) - affordMonthlyTax - affordHeatMonthly - affordDebt;

  const allowedMortgagePmt = Math.max(0, Math.min(maxGdsPayment, maxTdsPayment));
  const limitingRatio = maxGdsPayment < maxTdsPayment ? 'GDS' : 'TDS';

  const affordAnnualRate = affordRate / 100;
  const affordMonthlyRate = Math.pow(1 + affordAnnualRate / 2, 2 / 12) - 1;
  const affordMonths = 25 * 12; 

  let maxMortgageAmount = 0;
  if (affordMonthlyRate > 0 && allowedMortgagePmt > 0) {
      maxMortgageAmount = allowedMortgagePmt * ((1 - Math.pow(1 + affordMonthlyRate, -affordMonths)) / affordMonthlyRate);
  }
  const estMaxHomeValue = maxMortgageAmount / 0.8;

  // RRSP Gross Up Math
  const activeSweetSpot = rrspSweetSpot?.[grossUpTab];
  const activeMargRate = activeSweetSpot ? activeSweetSpot.marginalRate : (p1Marginal / 100);
  const grossedUpAmount = grossUpCash / (1 - activeMargRate);
  const loanAmount = grossedUpAmount - grossUpCash;
  const expectedRefund = grossedUpAmount * activeMargRate;
  const currentSweetSpot = rrspSweetSpot?.[sweetSpotTab];

  // ==========================================
  // CPP Smart Importer Logic
  // ==========================================
  const handleHTMLUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          const html = evt.target?.result as string;
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const rows = doc.querySelectorAll('table tbody tr');
          let newRecords: any[] = [];
          
          rows.forEach(row => {
              const th = row.querySelector('th');
              if(!th) return;
              const yearText = th.textContent || '';
              const yearMatch = yearText.trim().match(/(\d{4})\s*to\s*(\d{4})|(\d{4})/);
              
              const baseTd = row.querySelector('td[headers*="base-earnings"]');
              const secEnhTd = row.querySelector('td[headers*="second-additional-earnings"]');
              
              let earnings = 0;
              if(baseTd) earnings += parseFloat((baseTd.textContent || '').replace(/[^\d.]/g, '')) || 0;
              if(secEnhTd) earnings += parseFloat((secEnhTd.textContent || '').replace(/[^\d.]/g, '')) || 0; 

              if(yearMatch) {
                  if(yearMatch[1] && yearMatch[2]) {
                      const startY = parseInt(yearMatch[1]);
                      const endY = parseInt(yearMatch[2]);
                      for(let y=startY; y<=endY; y++) {
                          newRecords.push({ id: Math.random().toString(), year: y, earnings });
                      }
                  } else if(yearMatch[3]) {
                      newRecords.push({ id: Math.random().toString(), year: parseInt(yearMatch[3]), earnings });
                  }
              }
          });
          
          if (newRecords.length > 0) {
              const map = new Map();
              newRecords.forEach(r => {
                  if (!map.has(r.year) || map.get(r.year).earnings < r.earnings) {
                      map.set(r.year, r);
                  }
              });
              const deduped = Array.from(map.values()).sort((a,b) => b.year - a.year);
              setCppRecords(deduped);
              setCppStep('edit');
              setCppAnalysis(null);
          } else {
              showToast("Could not extract table data from HTML.");
          }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const parseText = () => {
      const regex = /(19[5-9]\d|20[0-2]\d)[\s\t]+[\$]?([\d,]+(?:\.\d{2})?)/g;
      let match;
      const newRecords = [];
      while ((match = regex.exec(cppPasteText)) !== null) {
          newRecords.push({ id: Math.random().toString(), year: parseInt(match[1]), earnings: parseFloat(match[2].replace(/,/g, '')) });
      }
      if (newRecords.length > 0) {
          const map = new Map();
          newRecords.forEach(r => {
              if (!map.has(r.year) || map.get(r.year).earnings < r.earnings) {
                  map.set(r.year, r);
              }
          });
          const deduped = Array.from(map.values()).sort((a,b) => b.year - a.year);
          setCppRecords(deduped);
          setCppStep('edit');
          setCppAnalysis(null);
      } else {
          showToast("Could not find any matching years/earnings in text.");
      }
  };

  const updateCppRecord = (index: number, field: string, val: string) => {
      const updated = [...cppRecords];
      updated[index] = { ...updated[index], [field]: Number(val) || 0 };
      setCppRecords(updated);
  };

  const removeCppRecord = (index: number) => {
      const updated = [...cppRecords];
      updated.splice(index, 1);
      setCppRecords(updated);
  };

  const addCppRecord = () => {
      const maxYear = cppRecords.length > 0 ? Math.max(...cppRecords.map(r => r.year)) : new Date().getFullYear();
      setCppRecords([{ id: Math.random().toString(), year: maxYear + 1, earnings: 0 }, ...cppRecords]);
  };

  const runCPPAnalysis = () => {
      if(cppRecords.length === 0) return;
      
      const p = cppTargetTab;
      const age = Number(data.inputs[`${p}_age`]) || 35;
      const retireAge = Number(data.inputs[`${p}_retireAge`]) || 60;
      const cppStartAge = Number(data.inputs[`${p}_cpp_start`]) || 65;
      const currentIncome = Number(data.inputs[`${p}_income`]) || 0;
      const incomeGrowth = (Number(data.inputs[`${p}_income_growth`]) || 2.0) / 100;
      
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - age;
      const age18Year = birthYear + 18;
      const retireYear = birthYear + retireAge;
      const cppStartYear = birthYear + cppStartAge;
      
      let augmentedRecords: {year: number, earnings: number, isProjected: boolean}[] = [];
      const recordMap = new Map(cppRecords.map(r => [r.year, r.earnings]));
      
      let projectedCount = 0;
      let zeroCount = 0;

      for (let y = age18Year; y < cppStartYear; y++) {
          if (recordMap.has(y)) {
              augmentedRecords.push({ year: y, earnings: recordMap.get(y) || 0, isProjected: false });
          } else {
              let e = 0;
              let isProj = false;
              if (y >= currentYear && cppProjectFuture) {
                  if (y < retireYear) {
                      e = currentIncome * Math.pow(1 + incomeGrowth, y - currentYear);
                      isProj = true;
                      projectedCount++;
                  } else {
                      zeroCount++;
                  }
              }
              augmentedRecords.push({ year: y, earnings: e, isProjected: isProj });
          }
      }
      
      const ratios = augmentedRecords.map(r => {
          const ympe = getYMPE(r.year);
          const cappedBaseEarnings = Math.min(r.earnings, ympe);
          return cappedBaseEarnings / ympe;
      });
      
      const sortedRatios = [...ratios].sort((a,b) => b - a);
      
      const totalYears = cppStartYear - age18Year;
      const dropYears = Math.floor(totalYears * 0.17);
      const keepYears = Math.max(1, totalYears - dropYears);
      
      const keptRatios = sortedRatios.slice(0, keepYears);
      const avgRatio = keptRatios.reduce((a,b) => a+b, 0) / keepYears;
      
      const projectedBase = 16375 * avgRatio;
      
      const recent = augmentedRecords.filter(r => r.year >= 2019);
      let avgRecentRatio = 0;
      if (recent.length > 0) {
          const recentRatios = recent.map(r => Math.min(1, r.earnings / getYAMPE(r.year)));
          avgRecentRatio = recentRatios.reduce((a,b)=>a+b,0) / recent.length;
      }
      const projectedEnhanced = 2500 * avgRecentRatio;
      const totalProjected = projectedBase + projectedEnhanced;

      const sortedByEarnings = [...augmentedRecords].sort((a,b) => b.earnings - a.earnings);
      const keptEarnings = sortedByEarnings.slice(0, keepYears);
      const avgEarnings = keptEarnings.reduce((s, r) => s + r.earnings, 0) / keepYears;

      setCppAnalysis({ 
          error: false, 
          totalYears,
          keepYears,
          dropYears,
          projectedCount,
          zeroCount,
          average: avgEarnings, 
          projected: totalProjected 
      });
      setCppStep('results');
  };

  // --- Category Grouping ---
  const toolCategories = [
    { title: "Master Simulations", keys: ['dwz', 'cpp', 'pensioncv', 'pensionbb'] },
    { title: "Tax & Registered", keys: ['sweetspot', 'grossup', 'tfsavsrrsp', 'ccb', 'fhsa', 'resp', 'medical'] },
    { title: "Business & Income", keys: ['sidehustle'] },
    { title: "Debt, Real Estate & Cash", keys: ['mvi', 'smith', 'emerg', 'car', 'afford', 'moveup', 'renewal'] },
    { title: "Data Importers", keys: ['cppimport'] }
  ];

  // --- Component Renderer for Grid Layout ---
  const renderToolCard = (id: string) => {
      switch (id) {
          case 'medical': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-hospital fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Medical Exp. Window</h5>
                      </div>
                      <p className="text-muted small mb-3">The CRA allows you to claim medical expenses for <i>any</i> 12-month period. Find the exact rolling window that maximizes your tax credit over the 3% net income hurdle.</p>
                      
                      <div className="mb-3">
                          <label className="form-label small fw-bold text-muted mb-1">Net Income (Lower Earning Spouse)</label>
                          <CurrencyInput className="form-control form-control-sm" value={medIncome} onChange={setMedIncome} />
                      </div>

                      <div className="d-flex align-items-center gap-2 px-1 mb-1">
                          <span className="small fw-bold text-muted" style={{width: '155px', flexShrink: 0}}>Month</span>
                          <span className="small fw-bold text-muted w-50">Bill Amount ($)</span>
                      </div>
                      
                      <div className="flex-grow-1 overflow-auto pe-1 mb-3 custom-scrollbar" style={{minHeight: '120px', maxHeight: '180px'}}>
                          {medBills.map(bill => (
                              <div key={bill.id} className="d-flex gap-2 mb-2 align-items-center">
                                  <div style={{width: '155px', flexShrink: 0}}>
                                      <MonthYearStepper value={bill.date} onChange={(val: string) => updateMedBill(bill.id, 'date', val)} />
                                  </div>
                                  <div className="w-50">
                                      <CurrencyInput className="form-control form-control-sm border-secondary text-main fw-bold w-100" value={bill.amount} onChange={(val: any) => updateMedBill(bill.id, 'amount', val)} />
                                  </div>
                                  <button className="btn btn-sm btn-link text-danger px-2 opacity-75 hover-opacity-100 flex-shrink-0 ms-auto" onClick={() => removeMedBill(bill.id)}><i className="bi bi-x-lg"></i></button>
                              </div>
                          ))}
                      </div>
                      <button className="btn btn-sm btn-outline-secondary w-100 fw-bold mb-3" onClick={addMedBill}>+ Add Expense Event</button>

                      <div className="bg-danger bg-opacity-10 border border-danger border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-danger border-opacity-25">
                              <span className="text-muted fw-bold small">CRA Hurdle (3%)</span>
                              <span className="fw-bold text-main">{formatCurrency(medHurdle)}</span>
                          </div>
                          
                          {bestMedWindow.eligible > 0 ? (
                              <>
                                  <div className="small text-danger fw-bold text-uppercase ls-1 mb-1">Optimal 12-Month Window</div>
                                  <div className="fw-bold text-main mb-2">{formatMonthYear(bestMedWindow.start)} to {formatMonthYear(bestMedWindow.end)}</div>
                                  <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-danger border-opacity-25">
                                      <span className="text-danger fw-bolder small">Eligible to Claim</span>
                                      <span className="fw-bolder fs-4 text-danger">{formatCurrency(bestMedWindow.eligible)}</span>
                                  </div>
                              </>
                          ) : (
                              <span className="small text-muted fst-italic py-2 d-block">No window exceeds the 3% income hurdle.</span>
                          )}
                      </div>
                  </div>
              </div>
          );

          case 'sidehustle': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-shop fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">Side-Hustle ROI</h5>
                      </div>
                      <p className="text-muted small mb-4">Determine if the tax savings from writing off home office and business expenses outpace the extra "double" CPP premium (11.9%) you pay as self-employed.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Gross Revenue</label>
                              <CurrencyInput className="form-control form-control-sm border-success text-success" value={shGross} onChange={setShGross} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Marginal Tax</label>
                              <PercentInput className="form-control form-control-sm" value={shMarginal} onChange={setShMarginal} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Direct Expenses</label>
                              <CurrencyInput className="form-control form-control-sm" value={shDirectExp} onChange={setShDirectExp} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Home Office Exp. <InfoBtn title="Home Office" text="Your prorated portion of rent, mortgage interest, utilities, and internet." /></label>
                              <CurrencyInput className="form-control form-control-sm" value={shHomeExp} onChange={setShHomeExp} />
                          </div>
                      </div>

                      <div className="bg-input border border-secondary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                          <div className="d-flex justify-content-between align-items-center mb-1 text-success small">
                              <span>Tax Saved (Write-offs):</span>
                              <span className="fw-bold">+{formatCurrency(taxSavedByDeductions)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25 text-danger small">
                              <span>Extra CPP Premium (Net): <InfoBtn title="CPP Premium" text="Self-employed individuals pay both the employee and employer portions of CPP (approx 11.9% total), but get a tax deduction for the employer half." /></span>
                              <span className="fw-bold">-{formatCurrency(netExtraCppCost)}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                              <span className={`fw-bolder text-uppercase ls-1 small ${shNetAdvantage >= 0 ? 'text-success' : 'text-danger'}`}>Net Advantage</span>
                              <span className={`fw-bolder fs-4 ${shNetAdvantage >= 0 ? 'text-success' : 'text-danger'}`}>{shNetAdvantage >= 0 ? '+' : ''}{formatCurrency(shNetAdvantage)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'dwz': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-bullseye fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">Die With Zero</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculates the absolute maximum lifestyle you can afford every year without running out of money before your life expectancy.</p>

                      <div className="flex-grow-1 d-flex flex-column justify-content-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4 position-relative overflow-hidden">
                          {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center" style={{zIndex: 10}}><span className="spinner-border text-success"></span></div>}
                          
                          {maxSpendResult ? (
                              maxSpendResult.difference > 0 ? (
                                  <>
                                      <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Max Safe Spend</span>
                                      <span className="fs-2 fw-bolder text-success mb-3">{formatCurrency(maxSpendResult.optSpend)} <span className="fs-6 text-muted fw-normal">/yr</span></span>
                                      <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-3 py-2 mx-auto shadow-sm">
                                          <i className="bi bi-arrow-up-circle-fill me-2"></i>You can spend {formatCurrency(maxSpendResult.difference)} more per year
                                      </span>
                                  </>
                              ) : (
                                  <>
                                      <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Current Plan Status</span>
                                      <span className="fs-3 fw-bolder text-danger mb-3">Overspending</span>
                                      <span className="badge bg-danger bg-opacity-25 text-danger border border-danger rounded-pill px-3 py-2 mx-auto text-wrap shadow-sm" style={{lineHeight: 1.5}}>
                                          <i className="bi bi-exclamation-triangle-fill me-2"></i>Cut expenses by {formatCurrency(Math.abs(maxSpendResult.difference))} /yr
                                      </span>
                                  </>
                              )
                          ) : (
                              <span className="text-muted fst-italic">Awaiting calculation...</span>
                          )}
                      </div>
                  </div>
              </div>
          );

          case 'cpp': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0, color:'var(--bs-purple)', backgroundColor: 'rgba(111, 66, 193, 0.25)'}}>
                              <i className="bi bi-bank fs-4"></i>
                          </div>
                          <h5 className="fw-bold mb-0 text-uppercase ls-1" style={{color:'var(--bs-purple)'}}>CPP / OAS Grid Search</h5>
                      </div>
                      <p className="text-muted small mb-4">Tests all 66 combinations of taking CPP (60-70) and OAS (65-70) to find the absolute highest after-tax final estate.</p>

                      <div className="flex-grow-1 d-flex flex-column p-4 bg-input border border-secondary rounded-4 shadow-inner mb-4 position-relative">
                          {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border" style={{color: 'var(--bs-purple)'}}></span></div>}
                          
                          {cppResult ? (
                              <div className="d-flex flex-column w-100 gap-3">
                                  {cppResult.scenarios.map((sc: any, idx: number) => {
                                      const isWinner = idx === 0;
                                      const pctOfWinner = (sc.finalEstate / cppResult.winner.finalEstate) * 100;
                                      return (
                                          <div key={idx} className="d-flex flex-column w-100">
                                              <div className="d-flex justify-content-between align-items-center mb-1">
                                                  <span className={`fw-bold small ${isWinner ? 'text-purple' : 'text-muted'}`} style={isWinner ? {color:'var(--bs-purple)'} : {}}>
                                                      CPP: {sc.cppAge} <span className="mx-1 opacity-25">|</span> OAS: {sc.oasAge} {isWinner && <i className="bi bi-trophy-fill ms-1"></i>}
                                                  </span>
                                                  <span className={`fw-bold small ${isWinner ? 'text-main' : 'text-muted'}`}>{formatCurrency(sc.finalEstate)}</span>
                                              </div>
                                              <div className="w-100 bg-black bg-opacity-25 rounded-pill overflow-hidden shadow-inner" style={{height: '6px'}}>
                                                  <div className="h-100 rounded-pill transition-all" style={{width: `${Math.max(2, pctOfWinner)}%`, backgroundColor: isWinner ? 'var(--bs-purple)' : '#6c757d'}}></div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          ) : (
                              <div className="d-flex align-items-center justify-content-center h-100">
                                  <span className="text-muted fst-italic text-center">Awaiting calculation...</span>
                              </div>
                          )}
                      </div>

                      <button 
                          className="btn fw-bold w-100 d-flex align-items-center justify-content-center text-white py-2 mt-auto" 
                          style={{backgroundColor: 'var(--bs-purple)', borderColor: 'var(--bs-purple)'}}
                          disabled={!cppResult}
                          onClick={applyCppStrategy}
                      >
                          <i className="bi bi-box-arrow-in-down-right me-2"></i> Apply Winner
                      </button>
                  </div>
              </div>
          );

          case 'pensionbb': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-clock-history fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Pension Buyback</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate if paying a lump sum today to buy back past service is better than investing the cash yourself.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Buyback Cost</label>
                              <CurrencyInput className="form-control form-control-sm" value={bbCost} onChange={setBbCost} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Added Pension /yr</label>
                              <CurrencyInput className="form-control form-control-sm border-primary text-primary" value={bbAddedPension} onChange={setBbAddedPension} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Yrs to Retire</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={bbYears} onChange={e => setBbYears(parseInt(e.target.value)||0)} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Est. Mkt Return</label>
                              <PercentInput className="form-control form-control-sm border-warning" value={bbReturn} onChange={setBbReturn} />
                          </div>
                      </div>

                      <div className="bg-primary bg-opacity-10 border border-primary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted fw-bold small">Future Val. of Cost <InfoBtn direction="up" title="Future Value" text="If you invested the Buyback Cost yourself until retirement at the estimated market return, this is what your lump sum would grow to." /></span>
                              <span className="fw-bold text-main fs-5">{formatCurrency(bbFutureValue)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-top border-primary border-opacity-25 pt-2">
                              <span className="text-muted fw-bold small text-uppercase ls-1">Required Yield</span>
                              <span className={`fw-bolder fs-4 ${bbMatchRate >= 4.0 ? 'text-success' : 'text-danger'}`}>{bbMatchRate.toFixed(2)}%</span>
                          </div>
                          <span className="small text-muted d-block text-center mt-2 fst-italic" style={{fontSize: '0.7rem'}}>
                              {bbMatchRate >= 4.0 ? "Guaranteed yield beats the 4% rule. Buyback recommended." : "You may be better off investing the money yourself."}
                          </span>
                      </div>
                  </div>
              </div>
          );

          case 'sweetspot': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-arrow-down-up fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">RRSP Sweet Spot</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculates the exact RRSP contribution needed to ride your current marginal tax bracket all the way to the floor before it drops.</p>

                      {isCouple && (
                          <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                              <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${sweetSpotTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setSweetSpotTab('p1')}>Player 1</button>
                              <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${sweetSpotTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setSweetSpotTab('p2')}>Player 2</button>
                          </div>
                      )}

                      <div className="flex-grow-1 d-flex flex-column justify-content-center text-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2 position-relative">
                          {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border text-primary"></span></div>}
                          {currentSweetSpot && currentSweetSpot.contribution > 0 ? (
                              <>
                                  <span className="text-muted fw-bold small text-uppercase ls-1 mb-2">Optimal Contribution</span>
                                  <span className="fs-2 fw-bolder text-primary mb-2">{formatCurrency(currentSweetSpot.contribution)}</span>
                                  
                                  <div className="d-flex justify-content-between w-100 px-2 mt-3 pt-3 border-top border-secondary border-opacity-50">
                                      <div className="d-flex flex-column text-start">
                                          <span className="small text-muted fw-bold">Marginal Rate</span>
                                          <span className="fw-bold text-danger">{(currentSweetSpot.marginalRate * 100).toFixed(1)}%</span>
                                      </div>
                                      <div className="d-flex flex-column text-end">
                                          <span className="small text-muted fw-bold">Tax Refund</span>
                                          <span className="fw-bold text-success">+{formatCurrency(currentSweetSpot.refund)}</span>
                                      </div>
                                  </div>
                                  <span className="small text-muted mt-3 fst-italic"><i className="bi bi-info-circle me-1"></i> Contributing more drops your refund rate to {(currentSweetSpot.nextRate * 100).toFixed(1)}%.</span>
                              </>
                          ) : (
                              <span className="text-muted fst-italic">You are already in the lowest tax bracket, or income is $0.</span>
                          )}
                      </div>
                  </div>
              </div>
          );

          case 'grossup': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-piggy-bank-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">RRSP Gross-Up</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate how to maximize your RRSP using a short-term loan that is completely paid off by the resulting tax refund.</p>

                      {isCouple && (
                          <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                              <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${grossUpTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setGrossUpTab('p1')}>Player 1</button>
                              <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${grossUpTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setGrossUpTab('p2')}>Player 2</button>
                          </div>
                      )}

                      <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2">
                          <div className="d-flex justify-content-between align-items-center mb-4">
                              <label className="fw-bold text-muted small">Cash on Hand:</label>
                              <div className="input-group input-group-sm w-50 shadow-sm">
                                  <span className="input-group-text bg-secondary border-secondary text-white">$</span>
                                  <input type="number" className="form-control bg-dark border-secondary text-white text-end fw-bold" value={grossUpCash} onChange={(e) => setGrossUpCash(Number(e.target.value) || 0)} />
                              </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted fw-bold small">1. Borrow Short-Term Loan</span>
                              <span className="fw-bold text-danger">+{formatCurrency(loanAmount)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-50">
                              <span className="text-muted fw-bold small">2. Total RRSP Contribution</span>
                              <span className="fw-bold text-main">{formatCurrency(grossedUpAmount)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 mt-2">
                              <span className="text-muted fw-bold small">3. Resulting Tax Refund</span>
                              <span className="fw-bold text-success">+{formatCurrency(expectedRefund)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted fw-bold small">4. Pay Off Loan</span>
                              <span className="fw-bold text-danger">-{formatCurrency(loanAmount)}</span>
                          </div>
                          
                          <span className="small text-muted text-center fst-italic mt-4"><i className="bi bi-info-circle me-1"></i> Based on your current {(activeMargRate * 100).toFixed(1)}% marginal rate.</span>
                      </div>
                  </div>
              </div>
          );

          case 'tfsavsrrsp': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-scale fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">TFSA vs RRSP</h5>
                      </div>
                      <p className="text-muted small mb-4">Compares your current marginal tax rate against your projected effective tax rate in retirement to tell you where your next dollar should go.</p>

                      <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2 position-relative">
                          {isCalculating && <div className="position-absolute top-0 start-0 w-100 h-100 bg-black bg-opacity-50 d-flex align-items-center justify-content-center rounded-4" style={{zIndex: 10}}><span className="spinner-border text-info"></span></div>}
                          
                          {tfsaRrspResult ? (
                              <>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                      <span className="text-muted fw-bold small">Current Marginal Rate:</span>
                                      <span className="fw-bold text-danger fs-5">{(tfsaRrspResult.currentMarginal * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom border-secondary border-opacity-50">
                                      <span className="text-muted fw-bold small">Est. Retirement Tax Rate:</span>
                                      <span className="fw-bold text-info fs-5">{(tfsaRrspResult.avgRetTaxRate * 100).toFixed(1)}%</span>
                                  </div>
                                  <div className="text-center mt-2">
                                      <span className="text-muted fw-bold small text-uppercase ls-1 mb-1 d-block">Mathematical Winner</span>
                                      <span className={`display-6 fw-bolder ${tfsaRrspResult.winner === 'RRSP' ? 'text-warning' : 'text-primary'}`}>{tfsaRrspResult.winner}</span>
                                  </div>
                              </>
                          ) : (
                              <span className="text-muted fst-italic text-center">Awaiting calculation...</span>
                          )}
                      </div>
                      <span className="small text-muted text-center fst-italic mt-2"><i className="bi bi-info-circle me-1"></i> If current rate &gt; retirement rate, RRSP wins. Otherwise TFSA.</span>
                  </div>
              </div>
          );

          case 'ccb': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-people-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">CCB Maximizer</h5>
                      </div>
                      <p className="text-muted small mb-4">Because CCB payouts are tied to Adjusted Family Net Income (AFNI), RRSP contributions do double-duty: they generate a tax refund AND boost your monthly CCB payments. Find your true ROI.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Adj. Family Net Income</label>
                              <CurrencyInput className="form-control form-control-sm" value={ccbIncome} onChange={setCcbIncome} />
                          </div>
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Hypothetical RRSP Contrib.</label>
                              <CurrencyInput className="form-control form-control-sm border-success text-success" value={ccbRrspContrib} onChange={setCcbRrspContrib} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Kids &lt;6</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ccbKidsUnder6} onChange={e => setCcbKidsUnder6(parseInt(e.target.value)||0)} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Kids 6-17</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={ccbKidsOver6} onChange={e => setCcbKidsOver6(parseInt(e.target.value)||0)} />
                          </div>
                      </div>

                      <div className="bg-success bg-opacity-10 border border-success border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-muted fw-bold small">Tax Refund <span className="fw-normal">(@ {p1Marginal.toFixed(0)}%)</span></span>
                              <span className="fw-bold text-main">+{formatCurrency(ccbTaxRefund)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-success border-opacity-25">
                              <span className="text-muted fw-bold small">CCB Boost <span className="fw-normal">(Annual)</span></span>
                              <span className="fw-bold text-info">+{formatCurrency(ccbBoost)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                              <span className="text-success fw-bolder">Effective ROI</span>
                              <span className="fw-bolder fs-4 text-success">{ccbTotalROI.toFixed(1)}%</span>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'resp': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-mortarboard-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">RESP Grant Maximizer</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate how to efficiently hit the lifetime $7,200 CESG maximum, including CRA's special "catch-up" rules.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Child's Age</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={respAge} onChange={e => setRespAge(parseInt(e.target.value)||0)} max={17} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Annual Contrib.</label>
                              <CurrencyInput className="form-control form-control-sm border-info" value={respAnnualCont} onChange={setRespAnnualCont} />
                          </div>
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Lifetime Grants Received to Date <InfoBtn title="Prior Grants" text="Total CESG already paid into your RESP. The maximum lifetime limit is $7,200." /></label>
                              <CurrencyInput className="form-control form-control-sm" value={respPriorGrants} onChange={setRespPriorGrants} />
                          </div>
                      </div>

                      <div className="bg-info bg-opacity-10 border border-info border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted fw-bold small">Expected Annual Grant</span>
                              <span className="fw-bold text-main">+{formatCurrency(totalGrantPerYear)} <span className="small text-muted fw-normal">/yr</span></span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-info border-opacity-25">
                              <span className="text-muted fw-bold small">Years Left to Contribute</span>
                              <span className="fw-bold text-info">{respRemainingYears} yrs</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                              <span className="text-info fw-bolder text-uppercase ls-1 small">Projected Final Grant</span>
                              <span className={`fw-bolder fs-5 ${(respPriorGrants + projectedFutureGrants) >= 7200 ? 'text-success' : 'text-warning'}`}>{formatCurrency(respPriorGrants + projectedFutureGrants)} <span className="small fw-normal text-muted">/ $7,200</span></span>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'fhsa': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-house-add-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">FHSA vs RRSP HBP</h5>
                      </div>
                      <p className="text-muted small mb-4">The FHSA gives you an RRSP tax deduction without the forced 15-year repayment of the HBP. See the cash flow difference.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Amount Saved</label>
                              <CurrencyInput className="form-control form-control-sm" value={fhsaAmount} onChange={setFhsaAmount} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Marginal Tax</label>
                              <PercentInput className="form-control form-control-sm" value={fhsaTaxRate} onChange={setFhsaTaxRate} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Yrs to Buy</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={fhsaYears} onChange={e => setFhsaYears(parseInt(e.target.value)||0)} />
                          </div>
                      </div>

                      <div className="mt-auto d-flex flex-column gap-3">
                          <div className="p-3 rounded-4 border border-primary bg-primary bg-opacity-10 shadow-inner">
                              <h6 className="fw-bold text-primary text-uppercase ls-1 mb-2 small"><i className="bi bi-house-add-fill me-1"></i>Using FHSA</h6>
                              <div className="d-flex justify-content-between small text-muted">Cash for Home: <span className="fw-bold text-main">{formatCurrency(fhsaGrowth)}</span></div>
                              <div className="text-success fw-bold small mt-1"><i className="bi bi-check-circle-fill me-1"></i> No Repayment Required</div>
                          </div>
                          <div className="p-3 rounded-4 border border-warning bg-warning bg-opacity-10 shadow-inner">
                              <h6 className="fw-bold text-warning text-uppercase ls-1 mb-2 small"><i className="bi bi-bank2 me-1"></i>Using RRSP HBP</h6>
                              <div className="d-flex justify-content-between small text-muted">Cash for Home: <span className="fw-bold text-main">{formatCurrency(fhsaGrowth)}</span></div>
                              <div className="text-danger fw-bold small mt-1"><i className="bi bi-exclamation-triangle-fill me-1"></i> 15yr Pre-Tax Repayment: {formatCurrency(hbpRepaymentCost)}</div>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'mvi': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-house-check fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">Mortgage vs Invest</h5>
                      </div>
                      <p className="text-muted small mb-4">Compare the guaranteed tax-free return of paying down debt versus compounding the money in the market.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Lump Sum Available</label>
                              <CurrencyInput className="form-control form-control-sm" value={mviLumpSum} onChange={setMviLumpSum} />
                          </div>
                          <div className="col-4">
                              <label className="form-label small fw-bold text-muted mb-1">Yrs</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={mviYears} onChange={e => setMviYears(parseInt(e.target.value)||0)} />
                          </div>
                          <div className="col-4">
                              <label className="form-label small fw-bold text-muted mb-1">Mort %</label>
                              <PercentInput className="form-control form-control-sm border-danger" value={mviMortgageRate} onChange={setMviMortgageRate} />
                          </div>
                          <div className="col-4">
                              <label className="form-label small fw-bold text-muted mb-1">Inv %</label>
                              <PercentInput className="form-control form-control-sm border-success" value={mviInvestReturn} onChange={setMviInvestReturn} />
                          </div>
                      </div>

                      <div className="row g-2 mt-auto text-center">
                          <div className="col-6">
                              <div className={`p-2 rounded-3 border h-100 d-flex flex-column justify-content-center ${mviDiff > 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-success bg-opacity-10 border-success'}`}>
                                  <div className="text-muted fw-bold" style={{fontSize: '0.65rem'}}>GUARANTEED SAVED</div>
                                  <div className="fs-5 fw-bold text-main">{formatCurrency(mviMortgageVal - mviLumpSum)}</div>
                              </div>
                          </div>
                          <div className="col-6">
                              <div className={`p-2 rounded-3 border h-100 d-flex flex-column justify-content-center ${mviDiff > 0 ? 'bg-success bg-opacity-10 border-success' : 'bg-black bg-opacity-25 border-secondary'}`}>
                                  <div className="text-muted fw-bold" style={{fontSize: '0.65rem'}}>AFTER-TAX PROFIT</div>
                                  <div className="fs-5 fw-bold text-success">{formatCurrency(mviInvestVal - mviLumpSum)}</div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="text-center mt-3 pt-2 border-top border-secondary">
                          <h6 className="fw-bold mb-1 small">Winner: <span className={mviDiff > 0 ? 'text-success' : 'text-primary'}>{mviDiff > 0 ? 'INVESTING' : 'PAYING MORTGAGE'}</span></h6>
                          <span className="text-muted" style={{fontSize: '0.7rem'}}>Diff: <b>{formatCurrency(Math.abs(mviDiff))}</b></span>
                      </div>
                  </div>
              </div>
          );

          case 'moveup': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-houses-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Home Move-Up Analyzer</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate the friction costs of selling your current home and what your new mortgage will look like.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Curr. Home Value</label>
                              <CurrencyInput className="form-control form-control-sm" value={muCurrentValue} onChange={setMuCurrentValue} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Curr. Mortgage</label>
                              <CurrencyInput className="form-control form-control-sm border-danger" value={muMortgage} onChange={setMuMortgage} />
                          </div>
                          <div className="col-12 mt-3 pt-3 border-top border-secondary">
                              <label className="form-label small fw-bold text-info mb-1">Target New Home Value</label>
                              <CurrencyInput className="form-control form-control-sm border-info text-info" value={muNewValue} onChange={setMuNewValue} />
                          </div>
                          <div className="col-12">
                              <div className="form-check form-switch d-flex align-items-center ps-0">
                                  <input className="form-check-input cursor-pointer ms-0 me-2" type="checkbox" checked={muToronto} onChange={e => setMuToronto(e.target.checked)} />
                                  <label className="form-check-label small fw-bold text-muted mt-1">Property is in City of Toronto (Double LTT)</label>
                              </div>
                          </div>
                      </div>

                      <div className="bg-input border border-secondary border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                          <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                              <span>Net Equity Available:</span>
                              <span className="fw-bold text-main">{formatCurrency(muNetEquity)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary border-opacity-25 text-danger small">
                              <span>Lost to Friction Costs (Fees/LTT):</span>
                              <span className="fw-bold">-{formatCurrency(muRealtorFee + muCurrentLegal + muLtt + muNewLegal)}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                              <span className="text-info fw-bolder text-uppercase ls-1 small">Required Mortgage</span>
                              <span className="fw-bolder fs-4 text-info">{formatCurrency(muRequiredMortgage)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'renewal': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-lightning-charge-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Mortgage Renewal Shock</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate the exact monthly payment change upon renewal, and the lifetime interest saved by dropping a lump sum.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Bal at Renewal</label>
                              <CurrencyInput className="form-control form-control-sm" value={rnwBalance} onChange={setRnwBalance} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Amort. Remaining</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={rnwAmort} onChange={e => setRnwAmort(parseInt(e.target.value)||0)} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Old Rate</label>
                              <PercentInput className="form-control form-control-sm" value={rnwOldRate} onChange={setRnwOldRate} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">New Target Rate</label>
                              <PercentInput className="form-control form-control-sm border-danger text-danger" value={rnwNewRate} onChange={setRnwNewRate} />
                          </div>
                          <div className="col-12 mt-2 pt-2 border-top border-secondary">
                              <label className="form-label small fw-bold text-success mb-1">Planned Lump Sum Deposit</label>
                              <CurrencyInput className="form-control form-control-sm border-success text-success" value={rnwLumpSum} onChange={setRnwLumpSum} />
                          </div>
                      </div>

                      <div className="bg-danger bg-opacity-10 border border-danger border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-danger border-opacity-25">
                              <span className="text-muted fw-bold small">Payment Shock</span>
                              <span className={`fw-bold fs-5 ${rnwDiff > 0 ? 'text-danger' : 'text-success'}`}>{rnwDiff > 0 ? '+' : ''}{formatCurrency(rnwDiff)} <span className="small text-muted fw-normal fs-6">/mo</span></span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                              <span className="text-success fw-bolder text-uppercase ls-1 small">Lump Sum Interest Saved</span>
                              <span className="fw-bolder fs-5 text-success">{formatCurrency(rnwInterestSaved)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'pensioncv': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-warning bg-opacity-25 text-warning rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-briefcase-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-warning mb-0 text-uppercase ls-1">Pension Commuted Value</h5>
                      </div>
                      <p className="text-muted small mb-4">Compare the guaranteed monthly payout of your DB pension against taking the Commuted Value (Lump Sum) to a LIRA.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Your Age</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={cvAge} onChange={e => setCvAge(parseInt(e.target.value)||0)} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Est. Mkt Return</label>
                              <PercentInput className="form-control form-control-sm border-warning" value={cvReturn} onChange={setCvReturn} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Guaranteed /mo</label>
                              <CurrencyInput className="form-control form-control-sm" value={cvMonthly} onChange={setCvMonthly} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Commuted Value</label>
                              <CurrencyInput className="form-control form-control-sm" value={cvLumpSum} onChange={setCvLumpSum} />
                          </div>
                      </div>

                      <div className="bg-warning bg-opacity-10 border border-warning border-opacity-50 rounded-4 p-3 mt-auto shadow-inner">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted fw-bold small">Required Yield to Match</span>
                              <span className="fw-bold text-main fs-5">{cvWithdrawalRate.toFixed(2)}%</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-1 pb-1 border-top border-warning border-opacity-25 pt-2">
                              <span className="text-muted fw-bold small text-uppercase ls-1">CV Depletion Age</span>
                              <span className={`fw-bolder fs-4 ${cvDepletionAge >= 95 ? 'text-success' : 'text-danger'}`}>{cvDepletionAge >= 95 ? '95+' : cvDepletionAge}</span>
                          </div>
                          <span className="small text-muted d-block text-center mt-2 fst-italic" style={{fontSize: '0.7rem'}}>
                              {cvDepletionAge >= 95 ? "Lump sum outlasts life expectancy." : `Lump sum runs out at age ${cvDepletionAge}.`}
                          </span>
                      </div>
                  </div>
              </div>
          );

          case 'smith': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-danger bg-opacity-25 text-danger rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-arrow-repeat fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-danger mb-0 text-uppercase ls-1">Smith Maneuver</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate the arbitrage of converting your non-deductible mortgage into a tax-deductible investment loan.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">HELOC Amount to Invest</label>
                              <CurrencyInput className="form-control form-control-sm" value={smLoan} onChange={setSmLoan} />
                          </div>
                          <div className="col-4">
                              <label className="form-label small fw-bold text-muted mb-1">Tax %</label>
                              <PercentInput className="form-control form-control-sm" value={smTaxRate} onChange={setSmTaxRate} />
                          </div>
                          <div className="col-4">
                              <label className="form-label small fw-bold text-muted mb-1">Loan %</label>
                              <PercentInput className="form-control form-control-sm border-danger" value={smHelocRate} onChange={setSmHelocRate} />
                          </div>
                          <div className="col-4">
                              <label className="form-label small fw-bold text-muted mb-1">Inv %</label>
                              <PercentInput className="form-control form-control-sm border-success" value={smInvestReturn} onChange={setSmInvestReturn} />
                          </div>
                      </div>

                      <div className="bg-input border border-secondary rounded-4 p-3 text-center mt-auto shadow-inner">
                          <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                              <div>
                                  <div className="small text-muted fw-bold mb-1" style={{fontSize: '0.7rem'}}>Effective Loan</div>
                                  <div className="fs-5 fw-bold text-danger">{smEffectiveBorrowingRate.toFixed(2)}%</div>
                              </div>
                              <div className="text-muted opacity-50"><i className="bi bi-arrow-right"></i></div>
                              <div>
                                  <div className="small text-muted fw-bold mb-1" style={{fontSize: '0.7rem'}}>Arb Spread</div>
                                  <div className={`fs-5 fw-bold ${smSpread > 0 ? 'text-success' : 'text-danger'}`}>{smSpread > 0 ? '+' : ''}{smSpread.toFixed(2)}%</div>
                              </div>
                          </div>
                          <div className="pt-2 border-top border-secondary">
                              <div className="fw-bold text-muted text-uppercase ls-1 mb-1" style={{fontSize: '0.65rem'}}>Est. Net Annual Wealth Created</div>
                              <div className={`fs-3 fw-bold ${smAnnualProfit > 0 ? 'text-success' : 'text-danger'}`}>
                                  {smAnnualProfit > 0 ? '+' : ''}{formatCurrency(smAnnualProfit)}
                              </div>
                              {smSpread <= 0 && <span className="badge bg-danger mt-1 px-2 py-1" style={{fontSize:'0.65rem'}}>NOT FEASIBLE - LOAN TOO EXPENSIVE</span>}
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'emerg': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-life-preserver fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-info mb-0 text-uppercase ls-1">Emergency Fund Sizer</h5>
                      </div>
                      <p className="text-muted small mb-4">Factor in Employment Insurance (EI) and Severance to calculate exactly how much cash you actually need to hoard.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Monthly Core Expenses</label>
                              <CurrencyInput className="form-control form-control-sm" value={emMonthlyExp} onChange={setEmMonthlyExp} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Mos to find job</label>
                              <input type="number" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={emMonthsToHire} onChange={e => setEmMonthsToHire(parseInt(e.target.value)||0)} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Est. Severance (Mos)</label>
                              <input type="number" step="0.5" className="form-control form-control-sm bg-input text-main border-secondary shadow-sm fw-bold text-center" value={emSeverance} onChange={e => setEmSeverance(parseFloat(e.target.value)||0)} />
                          </div>
                          <div className="col-12">
                              <div className="form-check form-switch d-flex align-items-center ps-0 mt-1">
                                  <input className="form-check-input cursor-pointer ms-0 me-2" type="checkbox" checked={emEiEligible} onChange={e => setEmEiEligible(e.target.checked)} />
                                  <label className="form-check-label small fw-bold text-muted mt-1">Eligible for Max EI ($668/wk)</label>
                              </div>
                          </div>
                      </div>

                      <div className="bg-info bg-opacity-10 border border-info border-opacity-50 rounded-4 p-3 mt-auto text-center shadow-inner">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="text-muted fw-bold small">Total Cash Needed</span>
                              <span className="fw-bold text-main">{formatCurrency(emTotalNeeded)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-1 text-success small">
                              <span>- Severance Payout</span>
                              <span>-{formatCurrency(emSeveranceCash)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2 text-success small pb-2 border-bottom border-info border-opacity-25">
                              <span>- Est. EI Payouts</span>
                              <span>-{formatCurrency(emEiCash)}</span>
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                              <span className="text-info fw-bolder text-uppercase ls-1 small">Actual Cash Needed</span>
                              <span className="fw-bolder fs-4 text-info">{formatCurrency(emCashRequired)}</span>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'car': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-secondary bg-opacity-25 text-secondary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-car-front-fill fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-secondary mb-0 text-uppercase ls-1">Buy vs Lease Car</h5>
                      </div>
                      <p className="text-muted small mb-3">Calculate the true Total Cost of Ownership (TCO) at the end of the term.</p>
                      
                      <div className="row g-3 mb-3 flex-grow-1">
                          <div className="col-6">
                              <div className="p-3 h-100 border border-info rounded-4 bg-info bg-opacity-10 shadow-sm d-flex flex-column gap-2">
                                  <h6 className="fw-bold text-info small text-uppercase ls-1 mb-2 text-center">Lease to Own</h6>
                                  <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Down Pmt</label><CurrencyInput className="form-control form-control-sm" value={carLeaseDown} onChange={setCarLeaseDown} /></div>
                                  <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Monthly</label><CurrencyInput className="form-control form-control-sm" value={carLeaseMo} onChange={setCarLeaseMo} /></div>
                                  <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Residual</label><CurrencyInput className="form-control form-control-sm" value={carLeaseBuyout} onChange={setCarLeaseBuyout} /></div>
                              </div>
                          </div>
                          <div className="col-6">
                              <div className="p-3 h-100 border border-warning rounded-4 bg-warning bg-opacity-10 shadow-sm d-flex flex-column gap-2">
                                  <h6 className="fw-bold text-warning small text-uppercase ls-1 mb-2 text-center">Finance</h6>
                                  <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Down Pmt</label><CurrencyInput className="form-control form-control-sm" value={carFinanceDown} onChange={setCarFinanceDown} /></div>
                                  <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Monthly</label><CurrencyInput className="form-control form-control-sm" value={carFinanceMo} onChange={setCarFinanceMo} /></div>
                                  <div><label className="small text-muted mb-1 fw-bold" style={{fontSize:'0.65rem'}}>Term (Mos)</label><input type="number" className="form-control form-control-sm text-center fw-bold bg-input border-secondary" value={carTerm} onChange={e => setCarTerm(parseInt(e.target.value)||0)} /></div>
                              </div>
                          </div>
                      </div>

                      <div className="row g-2 text-center mt-auto">
                          <div className="col-6">
                              <div className={`p-2 rounded-4 border shadow-inner ${carDiff > 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-info bg-opacity-25 border-info'}`}>
                                  <div className="text-muted fw-bold text-uppercase ls-1 mb-1" style={{fontSize:'0.65rem'}}>TCO (Lease)</div>
                                  <div className="fs-5 fw-bold text-main">{formatCurrency(totalLeaseToOwn)}</div>
                              </div>
                          </div>
                          <div className="col-6">
                              <div className={`p-2 rounded-4 border shadow-inner ${carDiff < 0 ? 'bg-black bg-opacity-25 border-secondary' : 'bg-warning bg-opacity-25 border-warning'}`}>
                                  <div className="text-muted fw-bold text-uppercase ls-1 mb-1" style={{fontSize:'0.65rem'}}>TCO (Finance)</div>
                                  <div className="fs-5 fw-bold text-main">{formatCurrency(totalFinance)}</div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          );

          case 'afford': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-success bg-opacity-25 text-success rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-house-heart fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-success mb-0 text-uppercase ls-1">Mortgage Affordability</h5>
                      </div>
                      <p className="text-muted small mb-4">Calculate your maximum borrowing power using standard Canadian GDS (39%) and TDS (44%) stress test limits.</p>
                      
                      <div className="row g-3 mb-4">
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Annual Gross Income</label>
                              <CurrencyInput className="form-control form-control-sm border-success text-success" value={affordIncome} onChange={setAffordIncome} />
                          </div>
                          <div className="col-12">
                              <label className="form-label small fw-bold text-muted mb-1">Monthly Debt <InfoBtn title="Monthly Debt" text="Car loans, minimum credit card payments, student loans, etc." /></label>
                              <CurrencyInput className="form-control form-control-sm border-danger text-danger" value={affordDebt} onChange={setAffordDebt} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Qualifying Rate <InfoBtn title="Qualifying Rate" text="In Canada, you must qualify at the contract rate + 2%, or 5.25%, whichever is higher." /></label>
                              <PercentInput className="form-control form-control-sm" value={affordRate} onChange={setAffordRate} />
                          </div>
                          <div className="col-6">
                              <label className="form-label small fw-bold text-muted mb-1">Est. Prop Tax/yr</label>
                              <CurrencyInput className="form-control form-control-sm" value={affordPropTax} onChange={setAffordPropTax} />
                          </div>
                      </div>

                      <div className="bg-success bg-opacity-10 border border-success border-opacity-50 rounded-4 p-3 mt-auto shadow-inner text-center">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-success border-opacity-25">
                              <span className="text-muted fw-bold small">Max Mortgage</span>
                              <span className="fw-bold text-main">{formatCurrency(maxMortgageAmount)}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="text-success fw-bolder text-uppercase ls-1 small">Est. Home Price</span>
                              <span className="fw-bolder fs-4 text-success">{formatCurrency(estMaxHomeValue)}</span>
                          </div>
                          <span className="text-muted fst-italic mt-2 d-block" style={{fontSize: '0.65rem'}}>
                              Assuming 20% down payment. Limited by the {limitingRatio} ratio.
                          </span>
                      </div>
                  </div>
              </div>
          );

          case 'cppimport': return (
              <div key={id} className="col-12 col-md-6 col-xl-4">
                  <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
                      <div className="d-flex align-items-center mb-3">
                          <div className="bg-secondary bg-opacity-25 text-white rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                              <i className="bi bi-file-earmark-spreadsheet fs-4"></i>
                          </div>
                          <h5 className="fw-bold text-white mb-0 text-uppercase ls-1">CPP Smart Importer</h5>
                      </div>
                      <p className="text-muted small mb-3">Import your Service Canada earnings to project your base benefit using the exact 17% drop-out rules and YMPE ratios.</p>

                      <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-3">
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${cppStep === 'import' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setCppStep('import')}>Import</button>
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${cppStep === 'edit' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setCppStep('edit')} disabled={cppRecords.length === 0}>Review</button>
                          <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${cppStep === 'results' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setCppStep('results')} disabled={!cppAnalysis}>Results</button>
                      </div>

                      <div className="flex-grow-1 d-flex flex-column min-h-0">
                          {cppStep === 'import' && (
                              <div className="d-flex flex-column h-100 gap-3 mt-2">
                                  <div className="border border-secondary rounded-3 p-3 bg-input text-center">
                                      <label className="fw-bold text-muted small mb-2 d-block">Upload HTML File</label>
                                      <input type="file" accept=".html" className="form-control form-control-sm bg-dark text-muted border-secondary" onChange={handleHTMLUpload} />
                                  </div>
                                  <div className="text-center text-muted small fw-bold">OR</div>
                                  <textarea 
                                      className="form-control bg-input border-secondary text-muted small flex-grow-1 shadow-inner" 
                                      placeholder="Paste earnings text here..."
                                      style={{resize: 'none'}}
                                      value={cppPasteText}
                                      onChange={(e) => setCppPasteText(e.target.value)}
                                  ></textarea>
                                  <button className="btn py-2 btn-outline-secondary fw-bold" onClick={parseText} disabled={!cppPasteText}>
                                      <i className="bi bi-cpu-fill me-2"></i> Parse Text
                                  </button>
                              </div>
                          )}

                          {cppStep === 'edit' && (
                              <div className="d-flex flex-column h-100">
                                  <div className="d-flex bg-black bg-opacity-25 rounded-pill p-1 mb-2">
                                      <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${cppTargetTab === 'p1' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setCppTargetTab('p1')}>Target P1</button>
                                      {isCouple && <button className={`btn btn-sm rounded-pill flex-grow-1 fw-bold ${cppTargetTab === 'p2' ? 'btn-primary' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setCppTargetTab('p2')}>Target P2</button>}
                                  </div>
                                  
                                  <div className="form-check form-switch mb-3 d-flex align-items-center">
                                      <input className="form-check-input cursor-pointer m-0 me-2 fs-5" type="checkbox" checked={cppProjectFuture} onChange={e => setCppProjectFuture(e.target.checked)} />
                                      <label className="form-check-label small fw-bold text-muted mt-1" style={{lineHeight: 1.2}}>Auto-fill future years from Inputs tab until Target Retirement Age</label>
                                  </div>

                                  <div className="d-flex justify-content-between px-2 mb-1 pe-4">
                                      <span className="small fw-bold text-muted" style={{width: '70px'}}>Year</span>
                                      <span className="small fw-bold text-muted flex-grow-1 ps-1">Earnings ($)</span>
                                  </div>
                                  
                                  <div className="flex-grow-1 overflow-auto pe-1 mb-3 custom-scrollbar" style={{minHeight: 0}}>
                                      {cppRecords.map((rec, i) => (
                                          <div key={rec.id} className="d-flex gap-1 mb-2 align-items-center">
                                              <input type="number" className="form-control form-control-sm bg-input border-secondary text-main fw-bold" style={{width: '70px'}} value={rec.year} onChange={e => updateCppRecord(i, 'year', e.target.value)} />
                                              <input type="number" className="form-control form-control-sm bg-input border-secondary text-main flex-grow-1" value={rec.earnings} onChange={e => updateCppRecord(i, 'earnings', e.target.value)} />
                                              <button className="btn btn-sm btn-outline-warning fw-bold px-2 flex-shrink-0" style={{fontSize:'0.65rem'}} title="Auto-fill Max Earning limit for this year" onClick={() => updateCppRecord(i, 'earnings', getYAMPE(rec.year).toString())}>MAX</button>
                                              <button className="btn btn-sm btn-link text-danger px-2 opacity-75 hover-opacity-100 flex-shrink-0" onClick={() => removeCppRecord(i)}><i className="bi bi-x-lg"></i></button>
                                          </div>
                                      ))}
                                  </div>
                                  <div className="d-flex gap-2 mt-auto">
                                      <button className="btn btn-sm btn-outline-secondary w-50 fw-bold" onClick={addCppRecord}>+ Add Row</button>
                                      <button className="btn btn-sm btn-primary w-50 fw-bold" onClick={runCPPAnalysis}>Analyze</button>
                                  </div>
                              </div>
                          )}

                          {cppStep === 'results' && cppAnalysis && (
                              <div className="bg-input border border-secondary rounded-4 p-4 h-100 d-flex flex-column shadow-inner">
                                  <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold">Contributory Period:</span><span className="text-main fw-bold">{cppAnalysis.totalYears} years</span></div>
                                  {cppAnalysis.projectedCount > 0 && <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold text-success">Proj. Working Years:</span><span className="text-success fw-bold">+{cppAnalysis.projectedCount}</span></div>}
                                  {cppAnalysis.zeroCount > 0 && <div className="d-flex justify-content-between small mb-1"><span className="text-muted fw-bold text-warning">Proj. Early Ret. (Zeros):</span><span className="text-warning fw-bold">+{cppAnalysis.zeroCount}</span></div>}
                                  
                                  <div className="d-flex justify-content-between small mb-1 mt-2 pt-2 border-top border-secondary border-opacity-50"><span className="text-muted fw-bold">Dropped (17%):</span><span className="text-danger fw-bold">-{cppAnalysis.dropYears} years</span></div>
                                  <div className="d-flex justify-content-between small mb-3 pb-3 border-bottom border-secondary border-opacity-50"><span className="text-muted fw-bold">Average Earnings (Kept):</span><span className="text-main fw-bold">{formatCurrency(cppAnalysis.average)}</span></div>
                                  
                                  <div className="d-flex justify-content-between align-items-center mb-4">
                                      <span className="text-muted fw-bold small text-uppercase ls-1">Projected Max</span>
                                      <span className="fs-4 fw-bold text-success">~{formatCurrency(cppAnalysis.projected)} <span className="fs-6 text-muted fw-normal">/yr</span></span>
                                  </div>
                                  
                                  <div className="d-flex gap-2 mt-auto">
                                      <button className="btn btn-outline-success fw-bold w-100" onClick={() => {
                                          updateInput('p1_cpp_est_base', cppAnalysis.projected);
                                          showToast('Applied to P1 Base CPP!');
                                      }}>
                                          <i className="bi bi-box-arrow-in-down-right me-2"></i> P1
                                      </button>
                                      {isCouple && (
                                          <button className="btn btn-outline-purple fw-bold w-100" style={{color: 'var(--bs-purple)', borderColor: 'var(--bs-purple)'}} onClick={() => {
                                              updateInput('p2_cpp_est_base', cppAnalysis.projected);
                                              showToast('Applied to P2 Base CPP!');
                                          }}>
                                              <i className="bi bi-box-arrow-in-down-right me-2"></i> P2
                                          </button>
                                      )}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          );

          default: return null;
      }
  };

  return (
    <div className="p-3 p-md-4 h-100 d-flex flex-column">
      
      {/* Toast Notification */}
      {toastMsg && (
          <div className="position-fixed bottom-0 start-50 translate-middle-x pb-4 transition-all" style={{zIndex: 1060}}>
              <div className="bg-success text-white px-4 py-3 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success">
                  <i className="bi bi-check-circle-fill me-3 fs-5"></i>
                  {toastMsg}
              </div>
          </div>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary">
          <h5 className="fw-bold text-uppercase ls-1 text-primary mb-0 d-flex align-items-center">
              <i className="bi bi-magic me-3"></i> Smart Optimizers
          </h5>
          {isCalculating && <span className="badge bg-primary bg-opacity-25 text-primary border border-primary rounded-pill px-3 py-2"><span className="spinner-border spinner-border-sm me-2"></span> Analyzing...</span>}
      </div>

      {/* Category Pills Header */}
      <div className="d-flex flex-wrap justify-content-center gap-2 gap-md-3 mb-4 pb-2">
          {toolCategories.map(cat => (
              <button 
                  key={cat.title}
                  onClick={() => setActiveCategory(cat.title)}
                  className={`btn rounded-pill fw-bold px-3 px-md-4 py-2 transition-all border-0 shadow-sm ${activeCategory === cat.title ? 'bg-primary text-white' : 'bg-input text-muted border border-secondary hover-opacity-100'}`}
              >
                  {cat.title}
              </button>
          ))}
      </div>

      {/* Tools Grid for Active Category */}
      <div className="row g-4 mb-5">
          {toolCategories.find(c => c.title === activeCategory)?.keys.map(toolId => renderToolCard(toolId))}
      </div>

    </div>
  );
}