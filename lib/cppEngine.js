/**
 * cppEngine.js
 * Exact-math Canada Pension Plan calculator engine.
 * Calculates Base CPP (17% Drop-out) + Enhanced Phase 1 (2019+) + Enhanced Phase 2 (2024+).
 */
import { FINANCIAL_CONSTANTS } from './config';

export class CPPEngine {
    constructor() {
        // Pull historical data directly from the centralized config
        this.YMPE = FINANCIAL_CONSTANTS.HISTORICAL_YMPE;
        this.YAMPE = FINANCIAL_CONSTANTS.HISTORICAL_YAMPE;
        this.currentYMPE = FINANCIAL_CONSTANTS.YMPE; // Used as fallback
    }

    parseServiceCanadaHTML(htmlString) {
        let records = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');

        // Find the main data table
        const tables = doc.querySelectorAll('table');
        let targetTable = null;
        for (let table of tables) {
            if (table.textContent.includes('Your pensionable earnings') || table.textContent.includes('contributions')) {
                targetTable = table;
                break;
            }
        }

        if (!targetTable) return []; 

        const rows = targetTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('th, td');
            if (cells.length < 2) return;

            const yearText = cells[0].textContent.trim();
            // Match single year or ranges (e.g. "2006 to 2007")
            const yearMatch = yearText.match(/(\d{4})(?:\s+to\s+(\d{4}))?/);
            if (!yearMatch) return;

            const startYear = parseInt(yearMatch[1]);
            const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : startYear;

            let earnings = 0;

            // Service Canada HTML tables have 14 columns:
            // [0]: Year
            // [1], [2]: Base Contrib
            // [3], [4]: 1st Add Contrib
            // [5], [6]: 2nd Add Contrib
            // [7]: Total Contrib
            // [8], [9]: Base Earnings
            // [10], [11]: 1st Add Earnings
            // [12], [13]: 2nd Add Earnings
            if (cells.length >= 13) {
                // Safely clean formatting (commas, spaces, $ signs)
                let baseE = parseFloat((cells[8].textContent || '').replace(/[$,\sA-Za-z]/g, '')) || 0;
                let secondE = parseFloat((cells[12].textContent || '').replace(/[$,\sA-Za-z]/g, '')) || 0;
                earnings = baseE + secondE;
            } else {
                // Fallback for unexpected structural changes
                let amounts = [];
                for(let i = 1; i < cells.length; i++) {
                    let val = parseFloat((cells[i].textContent || '').replace(/[$,\sA-Za-z]/g, ''));
                    if(!isNaN(val)) amounts.push(val);
                }
                if(amounts.length > 0) earnings = Math.max(...amounts);
            }

            for (let year = startYear; year <= endYear; year++) {
                if (year >= 1966 && year <= new Date().getFullYear() + 1) {
                    records.push({ year: year, earnings: earnings });
                }
            }
        });
        
        // Deduplicate
        records = Array.from(new Map(records.map(item => [item.year, item])).values());
        return records.sort((a, b) => a.year - b.year);
    }

    parseServiceCanadaText(rawText) {
        let records = [];
        
        // Clean text: Unify all white space and newlines into single spaces to handle mashed data
        const cleanText = rawText.replace(/\r/g, '').replace(/\n/g, ' ').trim();
        
        // Find all single years or ranges (e.g. "2008" or "2006 to 2007")
        const yearPattern = /(19[6-9]\d|20[0-9]\d)(?:\s+to\s+(19[6-9]\d|20[0-9]\d))?(?=\$|\s)/g;
        
        let matches = [];
        let match;
        while ((match = yearPattern.exec(cleanText)) !== null) {
            matches.push({
                startYear: parseInt(match[1]),
                endYear: match[2] ? parseInt(match[2]) : parseInt(match[1]),
                index: match.index,
                text: match[0]
            });
        }
        
        for (let i = 0; i < matches.length; i++) {
            const current = matches[i];
            const nextIndex = matches[i + 1] ? matches[i + 1].index : cleanText.length;
            const segment = cleanText.substring(current.index + current.text.length, nextIndex);
            
            const amountMatches = segment.match(/\$?\b\d{1,3}(?:,\d{3})*\.\d{2}\b/g) || [];
            const amounts = amountMatches.map(a => parseFloat(a.replace(/[$,]/g, '')));
            
            if (amounts.length === 0) continue;
            
            for (let year = current.startYear; year <= current.endYear; year++) {
                let earnings = 0;
                
                if (year < 2019) {
                    earnings = amounts[amounts.length - 1];
                } else if (year >= 2019 && year <= 2023) {
                    earnings = amounts.length >= 4 ? amounts[3] : amounts[amounts.length - 1];
                } else if (year >= 2024) {
                    let baseE = amounts.length >= 5 ? amounts[4] : amounts[amounts.length - 1];
                    let secondE = amounts.length >= 7 ? amounts[6] : 0;
                    earnings = baseE + secondE;
                }
                
                if (earnings < 1000 && Math.max(...amounts) > 1000) {
                    earnings = Math.max(...amounts);
                }

                if (!isNaN(earnings) && year >= 1966 && year <= new Date().getFullYear() + 1) {
                    records.push({ year: year, earnings: earnings });
                }
            }
        }

        records = Array.from(new Map(records.map(item => [item.year, item])).values());
        return records.sort((a, b) => a.year - b.year);
    }

    /**
     * Calculates the Base CPP amount using the 17% general drop-out
     */
    calculateBaseCPP(lifetimeRecords, birthYear, startPensionYear, childRearingYears = []) {
        const yearTurn18 = birthYear + 18;
        let monthsContributory = (startPensionYear - yearTurn18) * 12;
        
        if (monthsContributory <= 0) return { monthlyBase: 0, monthsContributoryTotal: 0, droppedCRDOYears: 0, droppedGeneralYears: 0, averageRatio: 0 };

        let pensionableRatios = lifetimeRecords.map(r => {
            const ympe = this.YMPE[r.year];
            if (!ympe) return null;
            const cappedEarnings = Math.min(r.earnings, ympe);
            return {
                year: r.year,
                ratio: cappedEarnings / ympe,
                ympe: ympe,
                earnings: r.earnings,
                isChildRearing: childRearingYears.includes(r.year)
            };
        }).filter(r => r !== null && r.year >= yearTurn18 && r.year < startPensionYear);

        let crdoDropped = 0;
        pensionableRatios = pensionableRatios.filter(r => {
            if (r.isChildRearing && r.ratio < 0.8) { 
                crdoDropped++;
                monthsContributory -= 12;
                return false;
            }
            return true;
        });

        const minMonths = 120;
        let generalDropoutMonths = Math.floor(monthsContributory * 0.17);
        if (monthsContributory - generalDropoutMonths < minMonths) {
            generalDropoutMonths = Math.max(0, monthsContributory - minMonths);
        }
        
        const generalDropoutYears = Math.floor(generalDropoutMonths / 12);
        
        pensionableRatios.sort((a, b) => a.ratio - b.ratio);
        const finalRatios = pensionableRatios.slice(generalDropoutYears);
        
        const totalRatio = finalRatios.reduce((sum, r) => sum + r.ratio, 0);
        const averageRatio = finalRatios.length > 0 ? (totalRatio / finalRatios.length) : 0;

        let last5YMPE = 0;
        let countedYears = 0;
        for(let i = 1; i <= 5; i++) {
            let y = startPensionYear - i;
            if (this.YMPE[y]) {
                last5YMPE += this.YMPE[y];
                countedYears++;
            }
        }
        // Dynamically pull current year YMPE if historical average fails
        const avgYMPE = countedYears > 0 ? (last5YMPE / countedYears) : this.currentYMPE;

        const monthlyBaseCPP = (avgYMPE * 0.25 * averageRatio) / 12;

        return {
            monthlyBase: monthlyBaseCPP,
            monthsContributoryTotal: monthsContributory,
            droppedCRDOYears: crdoDropped,
            droppedGeneralYears: generalDropoutYears,
            averageRatio: averageRatio,
            avgYMPEUsed: avgYMPE
        };
    }

    /**
     * Calculates the Enhanced CPP (Phase 1 and Phase 2)
     */
    calculateEnhancedCPP(lifetimeRecords, startPensionYear, avgYMPE) {
        let phase1Sum = 0;
        let phase2Sum = 0;

        const targetYMPE = avgYMPE; 
        const targetYAMPE = targetYMPE * 1.14; 

        lifetimeRecords.forEach(r => {
            if (r.year >= 2019 && r.year < startPensionYear) {
                let curYMPE = this.YMPE[r.year];
                if (curYMPE) {
                    let cappedEarnings = Math.min(r.earnings, curYMPE);
                    let inflatedFAPE = cappedEarnings * (targetYMPE / curYMPE);
                    phase1Sum += inflatedFAPE;
                }
            }

            if (r.year >= 2024 && r.year < startPensionYear) {
                let curYMPE = this.YMPE[r.year];
                let curYAMPE = this.YAMPE[r.year] || (curYMPE * 1.14);
                if (curYMPE && curYAMPE) {
                    let tier2Earnings = Math.max(0, Math.min(r.earnings, curYAMPE) - curYMPE);
                    let inflatedSAPE = tier2Earnings * (targetYAMPE / curYMPE);
                    phase2Sum += inflatedSAPE;
                }
            }
        });

        const monthlyPhase1 = (0.08333 * phase1Sum) / 480;
        const monthlyPhase2 = (0.33333 * phase2Sum) / 480;

        return {
            monthlyPhase1: monthlyPhase1,
            monthlyPhase2: monthlyPhase2,
            totalMonthlyEnhancement: monthlyPhase1 + monthlyPhase2
        };
    }
}