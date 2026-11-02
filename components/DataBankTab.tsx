'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
    ResponsiveContainer, BarChart, Bar, Cell, XAxis, YAxis, 
    CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine 
} from 'recharts';
import { useFinance } from '../lib/FinanceContext';
import { useTranslation } from '../lib/LanguageContext';
import RollForwardModal from './history/RollForwardModal';
import { CurrencyInput } from './SharedUI';

const EXTENDED_ACCOUNT_TYPES = [
  { id: 'tfsa', label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info' },
  { id: 'rrsp', label: 'RRSP', icon: 'bi-bank2', color: 'text-danger' },
  { id: 'fhsa', label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary' },
  { id: 'nonreg', label: 'Non-Reg', icon: 'bi-graph-up-arrow', color: 'text-secondary' },
  { id: 'crypto', label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-warning' },
  { id: 'cash', label: 'Cash', icon: 'bi-cash-stack', color: 'text-success' },
  { id: 'lirf', label: 'LIRA', icon: 'bi-lock-fill', color: 'text-secondary' },
  { id: 'lif', label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary' },
  { id: 'rrif', label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger' },
  { id: 'resp', label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple' }
];

interface DataBankTabProps {
    onOpenRollForward?: () => void;
}

export default function DataBankTab({ onOpenRollForward }: DataBankTabProps) {
    const { data, restoreHistorySnapshot, setData } = useFinance();
    const { t } = useTranslation();
    const historyList = useMemo(() => {
        return [...(data?.history || [])].sort((a: any, b: any) => a.calendarYear - b.calendarYear);
    }, [data?.history]);

    const [expandedYear, setExpandedYear] = useState<number | null>(null);
    const [showLocalRollForward, setShowLocalRollForward] = useState<boolean>(false);
    const [showAddPastYear, setShowAddPastYear] = useState<boolean>(false);
    const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // State for manual past year entry
    const [pastYearNum, setPastYearNum] = useState<number>(new Date().getFullYear() - 1);
    const [pastOpeningNW, setPastOpeningNW] = useState<number | ''>('');
    const [pastClosingNW, setPastClosingNW] = useState<number | ''>('');
    const [pastSavings, setPastSavings] = useState<number | ''>(0);
    const [pastGain, setPastGain] = useState<number | ''>('');
    const [pastLifGain, setPastLifGain] = useState<number | ''>('');
    const [pastNotes, setPastNotes] = useState<string>('');

    // Detailed account breakdowns for manual past year
    const [showAccountBreakdown, setShowAccountBreakdown] = useState<boolean>(true);
    const [manualBalancesP1, setManualBalancesP1] = useState<Record<string, number | ''>>({
        tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: ''
    });
    const [manualBalancesP2, setManualBalancesP2] = useState<Record<string, number | ''>>({
        tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: ''
    });
    const [manualCustomBalances, setManualCustomBalances] = useState<Record<string, number | ''>>({});
    const [manualCustomAcb, setManualCustomAcb] = useState<Record<string, number | ''>>({});

    const isCouple = data?.mode === 'Couple';
    const p1Name = data?.inputs?.p1_name || 'Player 1';
    const p2Name = data?.inputs?.p2_name || 'Player 2';
    const [modalPlayerTab, setModalPlayerTab] = useState<'p1' | 'p2'>('p1');
    const assumedReturnRate = Number(data?.inputs?.p1_tfsa_ret ?? data?.inputs?.p1_rrsp_ret ?? data?.inputs?.p1_nonreg_ret ?? 6.0);

    // Helpers to resolve net worths even if not explicitly stored (defined first to prevent TDZ ReferenceError)
    const getRecordClosingNW = (h: any) => {
        if (!h) return 0;
        if (Number(h.closingNetWorth) > 0) return Number(h.closingNetWorth);
        let accSum = 0;
        Object.values(h.actualBalances?.p1 || {}).forEach((v: any) => accSum += (Number(v) || 0));
        Object.values(h.actualBalances?.p2 || {}).forEach((v: any) => accSum += (Number(v) || 0));
        (h.actualBalances?.customAssets || []).forEach((c: any) => accSum += (Number(c.balance) || 0));
        return accSum;
    };

    const getPriorYearEndingNW = (year: number) => {
        const prior = (data?.history || []).find((h: any) => Number(h.calendarYear) === year - 1);
        if (!prior) return 0;
        return getRecordClosingNW(prior);
    };

    const priorYearClosingNW = useMemo(() => {
        return getPriorYearEndingNW(pastYearNum);
    }, [data?.history, pastYearNum]);

    const handleYearChange = (newYear: number) => {
        setPastYearNum(newYear);
        const priorClose = getPriorYearEndingNW(newYear);
        if (priorClose > 0) {
            setPastOpeningNW(priorClose);
        }
    };



    // Calculate historical average return with full automatic fallback and chaining
    const historicalStats = useMemo(() => {
        if (!historyList || historyList.length === 0) return null;

        // Sort chronologically by calendar year
        const sorted = [...historyList].sort((a: any, b: any) => a.calendarYear - b.calendarYear);

        const chartData = sorted.map((h: any, idx: number) => {
            let close = getRecordClosingNW(h);
            let open = Number(h.openingNetWorth) || 0;
            const savings = Number(h.netSavingsAdded) || 0;

            // If opening NW is 0 and previous calendar year exists, chain previous year's closing balance!
            if (open === 0 && idx > 0) {
                const prevClose = getRecordClosingNW(sorted[idx - 1]);
                if (prevClose > 0) open = prevClose;
            }

            let returnPct = 0;
            if (h.effectiveAnnualReturnPct !== undefined && Number(h.effectiveAnnualReturnPct) !== 0) {
                returnPct = Number(h.effectiveAnnualReturnPct);
            } else if (open > 0) {
                const gain = h.totalInvestmentGainDollar !== undefined && Number(h.totalInvestmentGainDollar) !== 0
                    ? Number(h.totalInvestmentGainDollar)
                    : (close - open - savings);
                returnPct = (gain / open) * 100;
            }

            return {
                year: String(h.calendarYear),
                calendarYear: h.calendarYear,
                actualReturn: Number(returnPct.toFixed(2)),
                assumedReturn: Number(assumedReturnRate.toFixed(2)),
                openingNetWorth: open,
                closingNetWorth: close
            };
        });

        const validReturns = chartData.map(d => d.actualReturn);
        const avgReturn = validReturns.length > 0 ? (validReturns.reduce((a, b) => a + b, 0) / validReturns.length) : 0;

        return { 
            avgReturn, 
            count: chartData.length, 
            chartData, 
            delta: avgReturn - assumedReturnRate 
        };
    }, [historyList, assumedReturnRate]);

    const yDomainMin = useMemo(() => {
        if (!historicalStats?.chartData?.length) return 0;
        const minVal = Math.min(...historicalStats.chartData.map((d: any) => Number(d.actualReturn) || 0));
        return Math.min(0, Math.floor(minVal - 2));
    }, [historicalStats]);

    const yDomainMax = useMemo(() => {
        if (!historicalStats?.chartData?.length) return Math.ceil(assumedReturnRate + 3);
        const maxVal = Math.max(...historicalStats.chartData.map((d: any) => Number(d.actualReturn) || 0));
        return Math.max(Math.ceil(assumedReturnRate + 3), Math.ceil(maxVal + 2));
    }, [historicalStats, assumedReturnRate]);

    const handleSumAccountsToClosing = () => {
        let total = 0;
        ['tfsa', 'rrsp', 'fhsa', 'resp', 'lirf', 'lif', 'rrif', 'nonreg', 'cash', 'crypto'].forEach(k => {
            total += Number(manualBalancesP1[k]) || 0;
            if (isCouple) total += Number(manualBalancesP2[k]) || 0;
        });
        (data?.customAssets || []).forEach((ca: any, idx: number) => {
            total += Number(manualCustomBalances[`ca_${idx}`]) || 0;
        });
        if (total > 0) setPastClosingNW(total);
    };

    const handleRebaselineAcb = (h: any, player: 'p1' | 'p2' = 'p1') => {
        const pAcb = Number(h.actualBalances?.[player]?.acb);
        const name = player === 'p1' ? p1Name : p2Name;
        if (pAcb > 0) {
            setData(prev => {
                const updatedInputs = { ...prev.inputs };
                updatedInputs[`${player}_nonreg_acb`] = pAcb;
                return { ...prev, inputs: updatedInputs };
            });
            showToast(`Rebaselined active plan ${name} Non-Reg ACB to $${pAcb.toLocaleString()}!`);
        } else {
            alert(`No prescribed Non-Reg ACB recorded for ${name}.`);
        }
    };

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3500);
    };

    const handleOpenRollForward = () => {
        if (onOpenRollForward) {
            onOpenRollForward();
        } else {
            setShowLocalRollForward(true);
        }
    };

    const handleExportCsv = () => {
        if (historyList.length === 0) return;

        let csv = 'Year,Archive Date,Opening Net Worth,Closing Net Worth,Dollar Gain,Return Pct\n';
        historyList.forEach(h => {
            csv += `${h.calendarYear},${h.archiveDate},${h.openingNetWorth},${h.closingNetWorth},${h.totalInvestmentGainDollar},${h.effectiveAnnualReturnPct}%\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Planfolio_DataBank_History_${new Date().getFullYear()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported Data Bank to CSV!');
    };

    const handleExportJson = () => {
        if (historyList.length === 0) return;
        const blob = new Blob([JSON.stringify(historyList, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Planfolio_DataBank_History_${new Date().getFullYear()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported Data Bank to JSON!');
    };

    const handleOpenAddPastYear = () => {
        setEditingRecordId(null);
        // Default to next sequential year if prior years exist, else last year
        const sortedYears = [...(data?.history || [])].map((h: any) => Number(h.calendarYear)).sort((a, b) => a - b);
        let defaultYear = new Date().getFullYear() - 1;
        if (sortedYears.length > 0) {
            const maxYear = sortedYears[sortedYears.length - 1];
            if (maxYear < new Date().getFullYear()) {
                defaultYear = maxYear + 1;
            }
        }
        setPastYearNum(defaultYear);

        // Auto-populate opening NW from prior year's ending NW if available
        const priorClose = getPriorYearEndingNW(defaultYear);
        setPastOpeningNW(priorClose > 0 ? priorClose : '');
        setPastClosingNW('');
        setPastSavings(0);
        setPastGain('');
        setPastLifGain('');
        setPastNotes('');
        setManualBalancesP1({ tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: '' });
        setManualBalancesP2({ tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: '' });
        setManualCustomBalances({});
        setManualCustomAcb({});
        setShowAccountBreakdown(true);
        setShowAddPastYear(true);
    };

    const handleEditRecord = (h: any) => {
        setEditingRecordId(h.id);
        setPastYearNum(h.calendarYear);
        let openVal = h.openingNetWorth ?? '';
        if ((openVal === '' || openVal === 0) && h.calendarYear) {
            const priorClose = getPriorYearEndingNW(h.calendarYear);
            if (priorClose > 0) openVal = priorClose;
        }
        setPastOpeningNW(openVal);
        setPastClosingNW(h.closingNetWorth ?? '');
        setPastSavings(h.netSavingsAdded ?? 0);
        setPastGain(h.totalInvestmentGainDollar ?? '');
        setPastLifGain(h.priorYearGains?.p1_lif_dollar_gain ?? '');
        setPastNotes(h.notes ?? '');

        // Populate P1 balances
        const p1 = h.actualBalances?.p1 || {};
        const newBalP1: Record<string, number | ''> = {
            tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: ''
        };
        Object.keys(newBalP1).forEach(k => {
            if (p1[k] !== undefined && p1[k] !== null) newBalP1[k] = p1[k];
        });
        setManualBalancesP1(newBalP1);

        // Populate P2 balances
        const p2 = h.actualBalances?.p2 || {};
        const newBalP2: Record<string, number | ''> = {
            tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: ''
        };
        Object.keys(newBalP2).forEach(k => {
            if (p2[k] !== undefined && p2[k] !== null) newBalP2[k] = p2[k];
        });
        setManualBalancesP2(newBalP2);

        // Populate Custom Assets
        const newCustomBal: Record<string, number | ''> = {};
        const newCustomAcb: Record<string, number | ''> = {};
        if (h.actualBalances?.customAssets && Array.isArray(h.actualBalances.customAssets)) {
            h.actualBalances.customAssets.forEach((ca: any, cIdx: number) => {
                const matchIdx = (data?.customAssets || []).findIndex((origCa: any) => origCa.name === ca.name);
                const targetKey = matchIdx >= 0 ? `ca_${matchIdx}` : `ca_${cIdx}`;
                newCustomBal[targetKey] = ca.balance ?? '';
                if (ca.acb !== undefined) newCustomAcb[targetKey] = ca.acb;
            });
        }
        setManualCustomBalances(newCustomBal);
        setManualCustomAcb(newCustomAcb);

        setShowAccountBreakdown(true);
        setShowAddPastYear(true);
    };

    const handleRestore = (h: any) => {
        if (confirm(`Restore your active plan to the exact state of ${h.calendarYear}? Your current inputs will be replaced by the ${h.calendarYear} snapshot.`)) {
            restoreHistorySnapshot(h.id);
            showToast(`Restored plan to ${h.calendarYear} snapshot!`);
        }
    };

    const handleSavePastYear = (e: React.FormEvent) => {
        e.preventDefault();
        const year = Number(pastYearNum);
        if (!year || year < 1950 || year > new Date().getFullYear()) {
            alert('Please enter a valid calendar year in the past.');
            return;
        }

        // Auto-calculate Closing NW from accounts if not manually specified
        let closeNW = Number(pastClosingNW) || 0;
        if (closeNW === 0) {
            let accSum = 0;
            ['tfsa', 'rrsp', 'fhsa', 'resp', 'lirf', 'lif', 'rrif', 'nonreg', 'cash', 'crypto'].forEach(k => {
                accSum += Number(manualBalancesP1[k]) || 0;
                if (isCouple) accSum += Number(manualBalancesP2[k]) || 0;
            });
            (data?.customAssets || []).forEach((ca: any, idx: number) => {
                accSum += Number(manualCustomBalances[`ca_${idx}`]) || 0;
            });
            if (accSum > 0) closeNW = accSum;
        }

        // Auto-chain Opening NW from previous calendar year if left blank
        let openNW = Number(pastOpeningNW) || 0;
        if (openNW === 0) {
            const sortedExisting = [...(data?.history || [])].sort((a: any, b: any) => a.calendarYear - b.calendarYear);
            const priorRec = sortedExisting.find((h: any) => h.calendarYear === year - 1);
            if (priorRec) {
                const priorClose = getRecordClosingNW(priorRec);
                if (priorClose > 0) openNW = priorClose;
            }
        }

        const savings = Number(pastSavings) || 0;
        const dollarGain = pastGain !== '' ? Number(pastGain) : (closeNW - openNW - savings);
        const returnPct = openNW > 0 ? (dollarGain / openNW) * 100 : 0;

        // Clean up manual balances
        const p1Clean: Record<string, number> = {};
        Object.entries(manualBalancesP1).forEach(([k, v]) => {
            if (v !== '' && Number(v) > 0) p1Clean[k] = Number(v);
        });
        const p2Clean: Record<string, number> = {};
        if (isCouple) {
            Object.entries(manualBalancesP2).forEach(([k, v]) => {
                if (v !== '' && Number(v) > 0) p2Clean[k] = Number(v);
            });
        }

        const customClean = (data?.customAssets || []).map((ca: any, idx: number) => {
            const bal = Number(manualCustomBalances[`ca_${idx}`]) || 0;
            const acb = (ca.type === 'nonreg' || ca.type === 'crypto') ? (Number(manualCustomAcb[`ca_${idx}`]) || 0) : undefined;
            return {
                name: ca.name || `Account ${idx + 1}`,
                type: ca.type || 'tfsa',
                owner: ca.owner || 'p1',
                balance: bal,
                acb: acb
            };
        }).filter((c: any) => c.balance > 0);

        const recordId = editingRecordId || `hist_${year}_manual`;
        const existingFullSnapshot = editingRecordId 
            ? ((data?.history || []).find((h: any) => h.id === editingRecordId)?.fullSnapshot || null)
            : null;

        const updatedRecord = {
            id: recordId,
            calendarYear: year,
            archiveDate: new Date().toISOString().split('T')[0],
            openingNetWorth: openNW,
            closingNetWorth: closeNW,
            netSavingsAdded: savings,
            totalInvestmentGainDollar: dollarGain,
            effectiveAnnualReturnPct: Number(returnPct.toFixed(2)),
            actualBalances: {
                p1: p1Clean,
                p2: isCouple ? p2Clean : undefined,
                customAssets: customClean.length > 0 ? customClean : undefined
            },
            priorYearGains: {
                p1_lif_dollar_gain: pastLifGain !== '' ? Number(pastLifGain) : undefined
            },
            notes: pastNotes || (editingRecordId ? 'Historical actuals (Edited)' : 'Historical actual entry'),
            fullSnapshot: existingFullSnapshot
        };

        setData(prev => {
            const existing = (prev.history || []).filter((h: any) => h.id !== recordId && h.calendarYear !== year);
            const updated = [...existing, updatedRecord].sort((a, b) => a.calendarYear - b.calendarYear);
            return {
                ...prev,
                history: updated
            };
        });

        showToast(editingRecordId ? `Updated historical actuals for Year ${year}!` : `Saved historical actuals for Year ${year}!`);
        setEditingRecordId(null);
        setShowAddPastYear(false);
        setPastOpeningNW('');
        setPastClosingNW('');
        setPastGain('');
        setPastLifGain('');
        setPastNotes('');
        setShowAccountBreakdown(false);
        setManualBalancesP1({ tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: '' });
        setManualBalancesP2({ tfsa: '', rrsp: '', fhsa: '', resp: '', lirf: '', lif: '', rrif: '', nonreg: '', acb: '', cash: '', crypto: '' });
        setManualCustomBalances({});
        setManualCustomAcb({});
    };

    const handleDeleteEntry = (hId: string) => {
        if (confirm('Are you sure you want to remove this historical year from your Data Bank?')) {
            setData(prev => ({
                ...prev,
                history: (prev.history || []).filter((h: any) => h.id !== hId)
            }));
            showToast('Historical record removed.');
        }
    };

    // Calculate cumulative lifetime metrics
    let cumulativeGain = 0;
    historyList.forEach(h => {
        cumulativeGain += Number(h.totalInvestmentGainDollar) || (Number(h.closingNetWorth) - Number(h.openingNetWorth)) || 0;
    });

    const formatAccountBadgeLabel = (key: string) => {
        switch (key.toLowerCase()) {
            case 'lirf': return 'LIRA';
            case 'lif': return 'LIF';
            case 'rrif':
            case 'rrif_acct': return 'RRIF';
            case 'rrsp': return 'RRSP';
            case 'tfsa': return 'TFSA';
            case 'fhsa': return 'FHSA';
            case 'resp': return 'RESP';
            case 'nonreg': return 'NON-REG';
            case 'crypto': return 'CRYPTO';
            case 'cash': return 'CASH';
            default: return key.toUpperCase();
        }
    };

    return (
        <div className="p-3 p-md-4">
            {/* TOAST NOTIFICATION */}
            {toastMsg && (
                <div className="position-fixed top-0 start-50 translate-middle-x pt-4 transition-all" style={{ zIndex: 2050 }}>
                    <div className="bg-success text-white px-4 py-2.5 rounded-pill shadow-lg d-flex align-items-center fw-bold border border-success small">
                        <i className="bi bi-check-circle-fill me-2 fs-6"></i>
                        {toastMsg}
                    </div>
                </div>
            )}

            {/* TOP HEADER & ACTION BANNER */}
            <div className="rp-card border border-secondary rounded-4 p-4 mb-4 shadow-sm surface-card">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                    <div className="d-flex align-items-center gap-3">
                        <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '48px', height: '48px' }}>
                            <i className="bi bi-clock-history fs-3"></i>
                        </div>
                        <div>
                            <h4 className="mb-0 fw-bold">{t('dataBank.title', 'Plan Data Bank & Historical Ledger')}</h4>
                            <p className="text-muted small mb-0 mt-1">
                                {t('dataBank.subtitle', 'Permanent archive of completed calendar years, December 31 statement actuals, and recorded investment gains.')}
                            </p>
                        </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        {historyList.length > 0 && (
                            <>
                                <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input shadow-sm" onClick={handleExportCsv}>
                                    <i className="bi bi-file-earmark-spreadsheet me-1"></i> {t('actions.exportCsv', 'Export CSV')}
                                </button>
                                <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold bg-input shadow-sm" onClick={handleExportJson}>
                                    <i className="bi bi-download me-1"></i> {t('actions.exportJson', 'Export JSON')}
                                </button>
                            </>
                        )}
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold shadow-sm d-flex align-items-center gap-1.5 bg-input" onClick={handleOpenAddPastYear}>
                            <i className="bi bi-plus-circle"></i> Add Past Year
                        </button>
                        <button type="button" className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-bold shadow-sm d-flex align-items-center gap-1.5" onClick={handleOpenRollForward}>
                            <i className="bi bi-calendar-plus"></i> {t('actions.rollForward', 'Roll Forward 1 Year')}
                        </button>
                    </div>
                </div>

                {/* KPI METRICS BAR IF HISTORY EXISTS */}
                {historyList.length > 0 && (
                    <div className="row g-3 mt-3 pt-3 border-top border-secondary border-opacity-25 text-center">
                        <div className="col-6 col-md-3">
                            <div className="p-2 bg-input border border-secondary rounded-3">
                                <span className="small text-muted text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Years on Record</span>
                                <h5 className="mb-0 fw-bold mt-1 text-info">{historyList.length} {historyList.length === 1 ? 'Year' : 'Years'}</h5>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-2 bg-input border border-secondary rounded-3">
                                <span className="small text-muted text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Earliest Record</span>
                                <h5 className="mb-0 fw-bold mt-1 text-main">{historyList[0]?.calendarYear || '—'}</h5>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-2 bg-input border border-secondary rounded-3">
                                <span className="small text-muted text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Latest Record</span>
                                <h5 className="mb-0 fw-bold mt-1 text-main">{historyList[historyList.length - 1]?.calendarYear || '—'}</h5>
                            </div>
                        </div>
                        <div className="col-6 col-md-3">
                            <div className="p-2 bg-input border border-primary border-opacity-50 rounded-3">
                                <span className="small text-primary text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Cumulative Gains</span>
                                <h5 className={`mb-0 fw-bold mt-1 ${cumulativeGain >= 0 ? 'text-success' : 'text-danger'}`}>
                                    {cumulativeGain >= 0 ? '+' : ''}${Math.round(cumulativeGain).toLocaleString()}
                                </h5>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PERFORMANCE BENCHMARK & CALIBRATION (PAST ACTUALS VS. ASSUMED PLAN RETURN) */}
            {historicalStats && historicalStats.count > 0 && (
                <div className="rp-card border border-secondary rounded-4 p-4 mb-4 shadow-sm surface-card">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3 border-bottom border-secondary pb-3">
                        <div>
                            <h6 className="mb-0 fw-bold text-uppercase ls-1 small d-flex align-items-center">
                                <i className="bi bi-graph-up-arrow text-success me-2"></i> Track Record vs. Plan Assumption Calibration
                            </h6>
                            <span className="text-muted small">Compare your real-world historical returns to your active plan benchmark ({assumedReturnRate.toFixed(1)}%).</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <span className={`badge ${historicalStats.delta >= 0 ? 'bg-success' : 'bg-warning text-dark'} fw-bold px-3 py-1.5 rounded-pill`}>
                                Historical Avg: {historicalStats.avgReturn >= 0 ? '+' : ''}{historicalStats.avgReturn.toFixed(2)}% / yr
                            </span>
                        </div>
                    </div>

                    <div className="row g-3 align-items-center">
                        <div className="col-12 col-lg-8">
                            <div className="w-100 position-relative" style={{ height: '240px', minHeight: '240px' }}>
                                {mounted ? (
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={historicalStats.chartData} margin={{ top: 22, right: 25, left: -5, bottom: 5 }} barGap={8}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#aaa' }} axisLine={{ stroke: '#444' }} />
                                            <YAxis 
                                                domain={[yDomainMin, yDomainMax]}
                                                tick={{ fontSize: 11, fill: '#aaa' }} 
                                                tickFormatter={(v) => `${v}%`} 
                                                axisLine={{ stroke: '#444' }}
                                            />
                                            <RechartsTooltip 
                                                formatter={(value: any) => [`${Number(value || 0).toFixed(2)}%`, 'Actual Return']} 
                                                contentStyle={{ backgroundColor: 'rgba(20, 24, 33, 0.95)', borderColor: '#444', borderRadius: '8px', fontSize: '12px' }} 
                                            />
                                            <ReferenceLine y={assumedReturnRate} stroke="#0dcaf0" strokeDasharray="4 4" label={{ value: `Plan Benchmark ${assumedReturnRate.toFixed(1)}%`, fill: '#0dcaf0', fontSize: 11, position: 'top' }} />
                                            <Bar dataKey="actualReturn" name="Actual Return" fill="#198754" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                                {historicalStats.chartData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.actualReturn >= 0 ? '#198754' : '#dc3545'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-100 h-100 d-flex align-items-center justify-content-center text-muted small">
                                        Loading chart...
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-12 col-lg-4">
                            <div className="p-3 bg-input border border-secondary rounded-3">
                                <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem' }}>Assumptions Guidance</span>
                                <p className="small text-main mt-1.5 mb-2" style={{ lineHeight: '1.5' }}>
                                    {historicalStats.delta >= 0 ? (
                                        <>Your archived actuals (<b>+{historicalStats.avgReturn.toFixed(2)}%</b>) are running <span className="text-success fw-bold">+{historicalStats.delta.toFixed(2)}% ahead</span> of your plan benchmark (<b>{assumedReturnRate.toFixed(1)}%</b>). Your projections are comfortably grounded with a conservative safety margin.</>
                                    ) : (
                                        <>Your archived actuals (<b>+{historicalStats.avgReturn.toFixed(2)}%</b>) are trailing your plan's assumed growth rate (<b>{assumedReturnRate.toFixed(1)}%</b>) by <span className="text-warning fw-bold">{Math.abs(historicalStats.delta).toFixed(2)}%</span>. Consider recalibrating your investment growth rate in Card 3 to test lower return scenarios.</>
                                    )}
                                </p>
                                <div className="d-flex justify-content-between small text-muted pt-2 border-top border-secondary border-opacity-25" style={{ fontSize: '0.72rem' }}>
                                    <span>Plan Benchmark: <b>{assumedReturnRate.toFixed(1)}%</b></span>
                                    <span>Years Measured: <b>{historicalStats.count}</b></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            {historyList.length === 0 ? (
                <div className="rp-card border border-secondary rounded-4 p-5 text-center shadow-sm surface-card">
                    <div className="bg-secondary bg-opacity-10 text-muted rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '72px', height: '72px' }}>
                        <i className="bi bi-database-exclamation fs-1"></i>
                    </div>
                    <h5 className="fw-bold mb-2">{t('dataBank.emptyTitle', 'No Historical Years in Your Data Bank Yet')}</h5>
                    <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '520px', lineHeight: '1.6' }}>
                        When you sit down at year-end or in January to update your financial plan, use <b>Roll Forward 1 Year</b>. Planfolio will snapshot your actual closing statement balances, record your exact investment gains, and advance your household ages into the new year.
                    </p>
                    <div className="d-flex justify-content-center gap-2">
                        <button type="button" className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold shadow-sm bg-input" onClick={handleOpenAddPastYear}>
                            <i className="bi bi-plus-circle me-1.5"></i> Add Past Year Actuals
                        </button>
                        <button type="button" className="btn btn-primary rounded-pill px-4 py-2 fw-bold shadow-sm" onClick={handleOpenRollForward}>
                            <i className="bi bi-calendar-plus me-1.5"></i> Roll Forward 1 Year
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rp-card border border-secondary rounded-4 shadow-sm overflow-hidden surface-card">
                    <div className="p-3 border-bottom border-secondary d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold text-uppercase ls-1 small">
                            <i className="bi bi-table text-primary me-2"></i> {t('dataBank.ledgerTitle', 'Historical Annual Ledger')}
                        </h6>
                        <span className="small text-muted">{historyList.length} archived {historyList.length === 1 ? 'entry' : 'entries'}</span>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-dark">
                                <tr style={{ fontSize: '0.78rem' }}>
                                    <th className="py-2.5 ps-3">Calendar Year</th>
                                    <th className="py-2.5">Date Archived</th>
                                    <th className="text-end py-2.5">Opening Net Worth</th>
                                    <th className="text-end py-2.5">Annual Dollar Gain ($)</th>
                                    <th className="text-end py-2.5">Return Rate (%)</th>
                                    <th className="text-end py-2.5 pe-3">Closing Net Worth</th>
                                    <th className="text-center py-2.5 pe-3" style={{ width: '140px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {historyList.map((h: any, hIdx: number) => {
                                    const isExpanded = expandedYear === h.calendarYear;
                                    const closeDisplay = getRecordClosingNW(h);
                                    let openDisplay = Number(h.openingNetWorth) || 0;
                                    if (openDisplay === 0 && hIdx > 0) {
                                        openDisplay = getRecordClosingNW(historyList[hIdx - 1]);
                                    }
                                    const savingsDisplay = Number(h.netSavingsAdded) || 0;
                                    const gainDisplay = h.totalInvestmentGainDollar !== undefined && Number(h.totalInvestmentGainDollar) !== 0
                                        ? Number(h.totalInvestmentGainDollar)
                                        : (closeDisplay - openDisplay - savingsDisplay);
                                    const returnPctDisplay = h.effectiveAnnualReturnPct !== undefined && Number(h.effectiveAnnualReturnPct) !== 0
                                        ? Number(h.effectiveAnnualReturnPct)
                                        : (openDisplay > 0 ? (gainDisplay / openDisplay) * 100 : 0);

                                    return (
                                        <React.Fragment key={h.id || h.calendarYear}>
                                            <tr>
                                                <td className="ps-3 fw-bold text-primary">
                                                    <i className="bi bi-calendar2-check-fill me-1.5"></i> {h.calendarYear}
                                                </td>
                                                <td className="small text-muted">{h.archiveDate || '—'}</td>
                                                <td className="text-end text-muted small">${(openDisplay).toLocaleString()}</td>
                                                <td className="text-end">
                                                    <span className={`badge ${gainDisplay >= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} fw-bold px-2 py-1`}>
                                                        {gainDisplay >= 0 ? '+' : ''}${Math.round(gainDisplay).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="text-end fw-bold text-main small">
                                                    {returnPctDisplay >= 0 ? '+' : ''}{returnPctDisplay.toFixed(2)}%
                                                </td>
                                                <td className="text-end pe-3 fw-bold text-success">
                                                    ${(closeDisplay).toLocaleString()}
                                                </td>
                                                <td className="text-center pe-3">
                                                    <div className="btn-group btn-group-sm">
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-secondary p-1 px-2.5"
                                                            onClick={() => setExpandedYear(isExpanded ? null : h.calendarYear)}
                                                            title={isExpanded ? 'Hide Account Breakdown' : 'Show Account Breakdown'}
                                                        >
                                                            <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-info p-1 px-2.5"
                                                            onClick={() => handleEditRecord(h)}
                                                            title="Edit this historical year's numbers and account balances"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-primary p-1 px-2.5"
                                                            onClick={() => handleRestore(h)}
                                                            title="Restore active plan to this year's snapshot"
                                                        >
                                                            <i className="bi bi-arrow-counterclockwise"></i>
                                                        </button>
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-outline-danger p-1 px-2.5"
                                                            onClick={() => handleDeleteEntry(h.id)}
                                                            title="Delete this historical entry"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* EXPANDED ROW DETAILS */}
                                            {isExpanded && h.actualBalances && (
                                                <tr className="bg-secondary bg-opacity-10">
                                                    <td colSpan={7} className="p-3">
                                                        <div className="small">
                                                            <h6 className="fw-bold mb-2 text-main" style={{ fontSize: '0.8rem' }}>
                                                                December 31, {h.calendarYear} Actual Statement Breakdown on Record
                                                            </h6>
                                                            <div className="row g-2">
                                                                {h.actualBalances.p1 && (
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="p-2.5 bg-input border border-secondary rounded-3">
                                                                            <div className="d-flex justify-content-between align-items-center">
                                                                                <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>{p1Name} Balances</span>
                                                                                {Number(h.actualBalances.p1.acb) > 0 && (
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-sm btn-outline-info rounded-pill py-0 px-2 fw-bold" 
                                                                                        style={{ fontSize: '0.65rem' }}
                                                                                        onClick={() => handleRebaselineAcb(h)}
                                                                                        title="Set this year's recorded ACB as the active plan baseline"
                                                                                    >
                                                                                        <i className="bi bi-arrow-repeat me-1"></i> Rebaseline Non-Reg ACB
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <div className="d-flex flex-wrap gap-2 mt-1.5">
                                                                                {Object.entries(h.actualBalances.p1).map(([acct, val]: [string, any]) => {
                                                                                    if (acct === 'acb') return null;
                                                                                    if (Number(val) <= 0) return null;
                                                                                    const isNonReg = acct === 'nonreg';
                                                                                    const acbVal = Number(h.actualBalances.p1.acb) || 0;
                                                                                    return (
                                                                                        <span key={acct} className="badge bg-secondary bg-opacity-25 text-main d-inline-flex align-items-center gap-1.5 py-1 px-2">
                                                                                            <span>{formatAccountBadgeLabel(acct)}: ${(Number(val)).toLocaleString()}</span>
                                                                                            {isNonReg && acbVal > 0 && (
                                                                                                <span className="text-info fw-normal" style={{ fontSize: '0.68rem' }}>
                                                                                                    (ACB: ${acbVal.toLocaleString()} | Gain: +${Math.max(0, Number(val) - acbVal).toLocaleString()})
                                                                                                </span>
                                                                                            )}
                                                                                        </span>
                                                                                    );
                                                                                })}
                                                                                {h.actualBalances.p1.acb && !h.actualBalances.p1.nonreg && (
                                                                                    <span className="badge bg-info bg-opacity-10 text-info py-1 px-2">
                                                                                        NON-REG ACB: ${Number(h.actualBalances.p1.acb).toLocaleString()}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {h.actualBalances.p2 && Object.keys(h.actualBalances.p2).length > 0 && (
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="p-2.5 bg-input border border-secondary rounded-3">
                                                                            <div className="d-flex justify-content-between align-items-center">
                                                                                <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>{p2Name} Balances</span>
                                                                                {Number(h.actualBalances.p2.acb) > 0 && (
                                                                                    <button 
                                                                                        type="button" 
                                                                                        className="btn btn-sm btn-outline-info rounded-pill py-0 px-2 fw-bold" 
                                                                                        style={{ fontSize: '0.65rem' }}
                                                                                        onClick={() => handleRebaselineAcb(h, 'p2')}
                                                                                        title="Set this year's recorded ACB as the active plan baseline"
                                                                                    >
                                                                                        <i className="bi bi-arrow-repeat me-1"></i> Rebaseline P2 ACB
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                            <div className="d-flex flex-wrap gap-2 mt-1.5">
                                                                                {Object.entries(h.actualBalances.p2).map(([acct, val]: [string, any]) => {
                                                                                    if (acct === 'acb') return null;
                                                                                    if (Number(val) <= 0) return null;
                                                                                    const isNonReg = acct === 'nonreg';
                                                                                    const acbVal = Number(h.actualBalances.p2.acb) || 0;
                                                                                    return (
                                                                                        <span key={acct} className="badge bg-secondary bg-opacity-25 text-main d-inline-flex align-items-center gap-1.5 py-1 px-2">
                                                                                            <span>{formatAccountBadgeLabel(acct)}: ${(Number(val)).toLocaleString()}</span>
                                                                                            {isNonReg && acbVal > 0 && (
                                                                                                <span className="text-info fw-normal" style={{ fontSize: '0.68rem' }}>
                                                                                                    (ACB: ${acbVal.toLocaleString()})
                                                                                                </span>
                                                                                            )}
                                                                                        </span>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {h.actualBalances.customAssets && h.actualBalances.customAssets.length > 0 && (
                                                                    <div className="col-12 mt-1">
                                                                        <div className="p-2.5 bg-input border border-secondary rounded-3">
                                                                            <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Additional Accounts</span>
                                                                            <div className="d-flex flex-wrap gap-2 mt-1.5">
                                                                                {h.actualBalances.customAssets.map((ca: any, cIdx: number) => (
                                                                                    <span key={cIdx} className="badge bg-secondary bg-opacity-25 text-main d-inline-flex align-items-center gap-1.5 py-1 px-2">
                                                                                        <span className="text-info fw-bold">[{ca.type?.toUpperCase()}]</span>
                                                                                        <span>{ca.name}: ${(Number(ca.balance)).toLocaleString()}</span>
                                                                                        {ca.acb > 0 && <span className="text-muted" style={{ fontSize: '0.65rem' }}>(ACB: ${(Number(ca.acb)).toLocaleString()})</span>}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {h.priorYearGains?.p1_lif_dollar_gain !== undefined && (
                                                                <div className="mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
                                                                    <i className="bi bi-info-circle me-1 text-info"></i>
                                                                    LIF dollar gain recorded for maximum withdrawal calculations: <b className="text-info">${(h.priorYearGains.p1_lif_dollar_gain).toLocaleString()}</b>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

                        {/* ADD PAST YEAR MODAL */}
            {showAddPastYear && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center px-3 py-4" style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.82)', backdropFilter: 'blur(6px)', overflowY: 'auto' }}>
                    <div className="card surface-card border border-secondary shadow-lg rounded-4 w-100 d-flex flex-column my-auto" style={{ maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto' }}>
                        <div className="card-header border-bottom border-secondary p-3 d-flex justify-content-between align-items-center sticky-top surface-card" style={{ zIndex: 10 }}>
                            <div className="d-flex align-items-center gap-2.5">
                                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '38px', height: '38px' }}>
                                    <i className="bi bi-calendar-plus fs-5"></i>
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold">{editingRecordId ? `Edit Historical Year ${pastYearNum}` : 'Add Historical Past Year'}</h5>
                                    <span className="small text-muted">{editingRecordId ? `Update recorded balances, cost bases, or returns for calendar year ${pastYearNum}.` : 'Archive prior year statement actuals, record ACB, and track real-world investment returns.'}</span>
                                </div>
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setShowAddPastYear(false)}>
                                <i className="bi bi-x-lg fs-5"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSavePastYear}>
                            <div className="card-body p-4">
                                
                                {/* MODE SELECTOR: DETAILED (DEFAULT) VS SIMPLE */}
                                <div className="d-flex bg-secondary bg-opacity-10 border border-secondary rounded-pill p-1 gap-1 mb-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAccountBreakdown(true)} 
                                        className={`btn btn-sm rounded-pill fw-bold border-0 transition-all flex-grow-1 py-1.5 ${showAccountBreakdown ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`}
                                        style={{ fontSize: '0.78rem' }}
                                    >
                                        <i className="bi bi-wallet2 me-1.5"></i> Detailed Accounts &amp; ACB (Recommended)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setShowAccountBreakdown(false)} 
                                        className={`btn btn-sm rounded-pill fw-bold border-0 transition-all flex-grow-1 py-1.5 ${!showAccountBreakdown ? 'bg-secondary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`}
                                        style={{ fontSize: '0.78rem' }}
                                    >
                                        <i className="bi bi-cash-stack me-1.5"></i> Simple Totals Only
                                    </button>
                                </div>

                                {/* CORE TIMELINE METRICS */}
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '22px' }}>
                                            <label className="form-label small fw-bold text-muted mb-0 text-uppercase ls-1 text-nowrap">Calendar Year</label>
                                        </div>
                                        <input 
                                            type="number" 
                                            className="form-control fw-bold border-secondary" 
                                            value={pastYearNum} 
                                            max={new Date().getFullYear()} 
                                            onChange={(e) => handleYearChange(parseInt(e.target.value, 10) || (new Date().getFullYear() - 1))} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '22px' }}>
                                            <label className="form-label small fw-bold text-muted mb-0 text-uppercase ls-1 text-nowrap">Net Savings Added</label>
                                        </div>
                                        <CurrencyInput 
                                            className="form-control border-secondary" 
                                            placeholder="0" 
                                            value={pastSavings} 
                                            onChange={(val: any) => setPastSavings(val)} 
                                        />
                                    </div>
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '22px' }}>
                                            <label className="form-label small fw-bold text-muted mb-0 text-uppercase ls-1 text-nowrap">Jan 1 Opening NW</label>
                                            {priorYearClosingNW > 0 && (
                                                Number(pastOpeningNW) === priorYearClosingNW ? (
                                                    <span className="text-success fw-bold d-inline-flex align-items-center text-nowrap" style={{ fontSize: '0.72rem' }}>
                                                        <i className="bi bi-check2-circle me-1 text-success"></i> From {pastYearNum - 1} Ending
                                                    </span>
                                                ) : (
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-link text-info p-0 text-decoration-none fw-bold d-flex align-items-center text-nowrap" 
                                                        style={{ fontSize: '0.72rem' }}
                                                        onClick={() => setPastOpeningNW(priorYearClosingNW)}
                                                        title={`Auto-populate with ${pastYearNum - 1} Dec 31 Ending Net Worth ($${priorYearClosingNW.toLocaleString()})`}
                                                    >
                                                        <i className="bi bi-clock-history me-1"></i> Copy {pastYearNum - 1} Ending
                                                    </button>
                                                )
                                            )}
                                        </div>
                                        <CurrencyInput 
                                            className="form-control border-secondary" 
                                            placeholder="0" 
                                            value={pastOpeningNW} 
                                            onChange={(val: any) => setPastOpeningNW(val)} 
                                        />
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <div className="d-flex justify-content-between align-items-center mb-1" style={{ minHeight: '22px' }}>
                                            <label className="form-label small fw-bold text-muted mb-0 text-uppercase ls-1 text-nowrap">Dec 31 Closing NW</label>
                                            {showAccountBreakdown && (
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-link text-info p-0 text-decoration-none fw-bold d-flex align-items-center text-nowrap" 
                                                    style={{ fontSize: '0.72rem' }}
                                                    onClick={handleSumAccountsToClosing}
                                                    title="Auto-sum all entered accounts below into closing Net Worth"
                                                >
                                                    <i className="bi bi-calculator me-1"></i> Auto-Sum Accounts
                                                </button>
                                            )}
                                        </div>
                                        <CurrencyInput 
                                            className="form-control fw-bold text-success border-secondary" 
                                            placeholder="0" 
                                            value={pastClosingNW} 
                                            onChange={(val: any) => setPastClosingNW(val)} 
                                        />
                                    </div>
                                </div>

                                {/* DETAILED ACCOUNT BREAKDOWN SECTION (OPEN BY DEFAULT) */}
                                {showAccountBreakdown && (
                                    <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-4 mb-3 shadow-inner">
                                        
                                        {/* COUPLE TAB SWITCHER (P1 VS P2) */}
                                        {isCouple ? (
                                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-2 border-bottom border-secondary border-opacity-25">
                                                <div className="d-flex bg-secondary bg-opacity-25 border border-secondary rounded-pill p-1 gap-1">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setModalPlayerTab('p1')} 
                                                        className={`btn btn-sm rounded-pill fw-bold border-0 transition-all px-3 py-1 ${modalPlayerTab === 'p1' ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        <i className="bi bi-person-fill me-1"></i> {p1Name}
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setModalPlayerTab('p2')} 
                                                        className={`btn btn-sm rounded-pill fw-bold border-0 transition-all px-3 py-1 ${modalPlayerTab === 'p2' ? 'bg-primary text-white shadow' : 'text-muted bg-transparent hover-opacity-100'}`}
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        <i className="bi bi-person-fill me-1"></i> {p2Name}
                                                    </button>
                                                </div>
                                                <div className="d-flex align-items-center gap-2">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-sm btn-link text-info p-0 text-decoration-none fw-bold" 
                                                        style={{ fontSize: '0.72rem' }}
                                                        onClick={handleSumAccountsToClosing}
                                                        title="Sum all accounts from both partners and added accounts into Closing Net Worth"
                                                    >
                                                        <i className="bi bi-calculator me-1"></i> Auto-Sum All to Closing NW &rarr;
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="d-flex justify-content-between align-items-center mb-2.5">
                                                <span className="small text-main fw-bold d-flex align-items-center gap-1.5">
                                                    <i className="bi bi-person-fill text-primary"></i>
                                                    <span className="text-uppercase ls-1" style={{ fontSize: '0.75rem' }}>{p1Name} Portfolio Accounts</span>
                                                </span>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-link text-info p-0 text-decoration-none fw-bold" 
                                                    style={{ fontSize: '0.72rem' }}
                                                    onClick={handleSumAccountsToClosing}
                                                    title="Auto-sum all entered accounts into closing Net Worth"
                                                >
                                                    <i className="bi bi-calculator me-1"></i> Auto-Sum to Closing NW &rarr;
                                                </button>
                                            </div>
                                        )}

                                        {/* UNIFIED ACCOUNT CARDS (MATCHES INPUT TAB VISUALLY) */}
                                        {(() => {
                                            const activeOwner = modalPlayerTab === 'p2' ? 'p2' : 'p1';
                                            const activeOwnerName = activeOwner === 'p2' ? p2Name : p1Name;
                                            const activeBalances = activeOwner === 'p2' ? manualBalancesP2 : manualBalancesP1;
                                            const setActiveBalances = activeOwner === 'p2' ? setManualBalancesP2 : setManualBalancesP1;

                                            const standardAccounts = [
                                                { id: 'cash', label: 'Cash / HYSA', icon: 'bi-cash-stack', color: 'text-success' },
                                                { id: 'tfsa', label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-info' },
                                                { id: 'fhsa', label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary' },
                                                { id: 'rrsp', label: 'RRSP', icon: 'bi-bank2', color: 'text-danger' },
                                                { id: 'resp', label: 'RESP', icon: 'bi-mortarboard-fill', color: 'text-purple' },
                                                { id: 'lirf', label: 'LIRA', icon: 'bi-lock-fill', color: 'text-secondary' },
                                                { id: 'lif', label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary' },
                                                { id: 'rrif', label: 'RRIF', icon: 'bi-wallet-fill', color: 'text-danger' }
                                            ];

                                            const customAccountsForPlayer = (data?.customAssets || []).filter((ca: any) => ca.owner === activeOwner);

                                            return (
                                                <div className="d-flex flex-column gap-1.5">
                                                    {/* STANDARD REGISTERED & LIQUID ACCOUNTS */}
                                                    {standardAccounts.map(acct => (
                                                        <div className="d-flex align-items-center gap-2 p-2 bg-input border border-secondary rounded-3 shadow-sm w-100" key={`modal_acct_${activeOwner}_${acct.id}`}>
                                                            <div className="d-flex align-items-center gap-2" style={{ flex: '0 0 145px' }}>
                                                                <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                    <i className={`bi ${acct.icon} fs-6 ${acct.color}`}></i>
                                                                </div>
                                                                <span className="fw-bold text-main" style={{ fontSize: '0.78rem' }}>{acct.label}</span>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <CurrencyInput 
                                                                    className="form-control form-control-sm border-secondary text-end fw-medium" 
                                                                    placeholder="$0" 
                                                                    value={activeBalances[acct.id]} 
                                                                    onChange={(val: any) => setActiveBalances(prev => ({ ...prev, [acct.id]: val }))} 
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* NON-REG WITH PROPERLY ALIGNED ACB (MATCHING INPUT TAB STACKED LAYOUT) */}
                                                    <div className="d-flex flex-column p-2 bg-input border border-secondary rounded-3 shadow-sm w-100 mt-1">
                                                        <div className="d-flex align-items-center gap-2 w-100">
                                                            <div className="d-flex align-items-center gap-2" style={{ flex: '0 0 145px' }}>
                                                                <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                    <i className="bi bi-graph-up-arrow fs-6 text-secondary"></i>
                                                                </div>
                                                                <span className="fw-bold text-main" style={{ fontSize: '0.78rem' }}>Non-Reg Value</span>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <CurrencyInput 
                                                                    className="form-control form-control-sm border-secondary text-end fw-medium" 
                                                                    placeholder="Market Value ($0)" 
                                                                    value={activeBalances.nonreg} 
                                                                    onChange={(val: any) => setActiveBalances(prev => ({ ...prev, nonreg: val }))} 
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25 w-100">
                                                            <div className="d-flex align-items-center gap-2" style={{ flex: '0 0 145px' }}>
                                                                <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                    <i className="bi bi-tag-fill fs-6"></i>
                                                                </div>
                                                                <div>
                                                                    <span className="fw-bold text-info d-block" style={{ fontSize: '0.75rem', lineHeight: 1.1 }}>Non-Reg ACB</span>
                                                                    <span className="text-muted" style={{ fontSize: '0.62rem' }}>Rebaseline Cost Base</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <CurrencyInput 
                                                                    className="form-control form-control-sm border-info text-end fw-medium" 
                                                                    placeholder="Cost Base / ACB ($0)" 
                                                                    value={activeBalances.acb} 
                                                                    onChange={(val: any) => setActiveBalances(prev => ({ ...prev, acb: val }))} 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* CRYPTO */}
                                                    <div className="d-flex align-items-center gap-2 p-2 bg-input border border-secondary rounded-3 shadow-sm w-100">
                                                        <div className="d-flex align-items-center gap-2" style={{ flex: '0 0 145px' }}>
                                                            <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                <i className="bi bi-currency-bitcoin fs-6 text-warning"></i>
                                                            </div>
                                                            <span className="fw-bold text-main" style={{ fontSize: '0.78rem' }}>Crypto Assets</span>
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <CurrencyInput 
                                                                className="form-control form-control-sm border-secondary text-end fw-medium" 
                                                                placeholder="$0" 
                                                                value={activeBalances.crypto} 
                                                                onChange={(val: any) => setActiveBalances(prev => ({ ...prev, crypto: val }))} 
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* ADDITIONAL ACCOUNTS (FROM INPUT TAB) */}
                                                    {customAccountsForPlayer.length > 0 && (
                                                        <div className="mt-3 pt-3 border-top border-secondary border-opacity-50">
                                                            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                                                                <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>
                                                                    <i className="bi bi-plus-square text-info me-1.5"></i> Additional Accounts ({customAccountsForPlayer.length})
                                                                </span>
                                                                <span className="badge bg-secondary bg-opacity-25 text-muted fw-normal" style={{ fontSize: '0.62rem' }}>
                                                                    Synced with {activeOwnerName}
                                                                </span>
                                                            </div>

                                                            {customAccountsForPlayer.map((ca: any) => {
                                                                const globalIdx = (data?.customAssets || []).indexOf(ca);
                                                                const caKey = `ca_${globalIdx}`;
                                                                const isNonRegType = ca.type === 'nonreg' || ca.type === 'crypto';
                                                                const typeInfo = EXTENDED_ACCOUNT_TYPES.find(t => t.id === ca.type) || { label: ca.type?.toUpperCase() || 'ACCOUNT', icon: 'bi-wallet2', color: 'text-info' };

                                                                return (
                                                                    <div className="d-flex flex-column p-2 bg-input border border-secondary rounded-3 shadow-sm w-100 mb-1.5" key={caKey}>
                                                                        <div className="d-flex align-items-center gap-2 w-100">
                                                                            <div className="d-flex align-items-center gap-2" style={{ flex: '0 0 160px' }}>
                                                                                <div className="bg-secondary bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                                    <i className={`bi ${typeInfo.icon} fs-6 ${typeInfo.color}`}></i>
                                                                                </div>
                                                                                <div className="overflow-hidden">
                                                                                    <span className="fw-bold text-main d-block text-truncate" style={{ fontSize: '0.78rem' }} title={ca.name || typeInfo.label}>{ca.name || typeInfo.label}</span>
                                                                                    <span className="badge bg-secondary bg-opacity-25 text-muted py-0 px-1" style={{ fontSize: '0.6rem' }}>{typeInfo.label}</span>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex-grow-1">
                                                                                <CurrencyInput 
                                                                                    className="form-control form-control-sm border-secondary text-end fw-medium" 
                                                                                    placeholder="Closing Balance ($0)" 
                                                                                    value={manualCustomBalances[caKey] ?? ''} 
                                                                                    onChange={(val: any) => setManualCustomBalances(prev => ({ ...prev, [caKey]: val }))} 
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {isNonRegType && (
                                                                            <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top border-secondary border-opacity-25 w-100">
                                                                                <div className="d-flex align-items-center gap-2" style={{ flex: '0 0 160px' }}>
                                                                                    <div className="bg-info bg-opacity-10 text-info rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '28px', height: '28px' }}>
                                                                                        <i className="bi bi-tag-fill fs-6"></i>
                                                                                    </div>
                                                                                    <div>
                                                                                        <span className="fw-bold text-info d-block" style={{ fontSize: '0.75rem', lineHeight: 1.1 }}>Cost Base</span>
                                                                                        <span className="text-muted" style={{ fontSize: '0.62rem' }}>Rebaseline ACB</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex-grow-1">
                                                                                    <CurrencyInput 
                                                                                        className="form-control form-control-sm border-info text-end fw-medium" 
                                                                                        placeholder="Cost Base / ACB ($0)" 
                                                                                        value={manualCustomAcb[caKey] ?? ''} 
                                                                                        onChange={(val: any) => setManualCustomAcb(prev => ({ ...prev, [caKey]: val }))} 
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* INVESTMENT RETURN LIVE MATH DISPLAY */}
                                <div className="row g-3 mb-3">
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Investment Dollar Gain ($)</label>
                                        <CurrencyInput 
                                            className="form-control border-secondary" 
                                            placeholder="Auto-calculated if blank" 
                                            value={pastGain} 
                                            onChange={(val: any) => setPastGain(val)} 
                                        />
                                        <span className="small text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>
                                            {pastClosingNW && pastOpeningNW ? (
                                                <span className="text-info fw-bold">Live Calc: ${(Number(pastClosingNW) - Number(pastOpeningNW) - Number(pastSavings || 0)).toLocaleString()}</span>
                                            ) : 'Defaults to Closing &minus; Opening &minus; Savings'}
                                        </span>
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">LIF Dollar Gain ($)</label>
                                        <CurrencyInput 
                                            className="form-control border-secondary" 
                                            placeholder="Optional" 
                                            value={pastLifGain} 
                                            onChange={(val: any) => setPastLifGain(val)} 
                                        />
                                        <span className="small text-muted d-block mt-1" style={{ fontSize: '0.7rem' }}>Used for calculating prior-year LIF maximum withdrawal room</span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Notes / Milestones</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm border-secondary" 
                                        placeholder="e.g. Rebalanced portfolio, Downsized home, Maxed out TFSA..." 
                                        value={pastNotes} 
                                        onChange={(e) => setPastNotes(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="card-footer border-top border-secondary p-3 d-flex justify-content-between align-items-center sticky-bottom surface-card" style={{ zIndex: 10 }}>
                                <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => setShowAddPastYear(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm">
                                    {editingRecordId ? 'Update Historical Year' : 'Save Historical Actuals'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
{/* LOCAL ROLL FORWARD MODAL TRIGGER IF ACCESSED FROM TAB */}
            <RollForwardModal 
                isOpen={showLocalRollForward} 
                onClose={() => setShowLocalRollForward(false)} 
                showToast={showToast} 
            />
        </div>
    );
}