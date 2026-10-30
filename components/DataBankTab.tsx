import React, { useState } from 'react';
import { useFinance } from '../lib/FinanceContext';
import { useTranslation } from '../lib/LanguageContext';
import RollForwardModal from './history/RollForwardModal';
import { CurrencyInput } from './SharedUI';

interface DataBankTabProps {
    onOpenRollForward?: () => void;
}

export default function DataBankTab({ onOpenRollForward }: DataBankTabProps) {
    const { data, restoreHistorySnapshot, setData } = useFinance();
    const { t } = useTranslation();
    const historyList = (data.history || []) as any[];

    const [expandedYear, setExpandedYear] = useState<number | null>(null);
    const [showLocalRollForward, setShowLocalRollForward] = useState<boolean>(false);
    const [showAddPastYear, setShowAddPastYear] = useState<boolean>(false);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // State for manual past year entry
    const [pastYearNum, setPastYearNum] = useState<number>(new Date().getFullYear() - 1);
    const [pastOpeningNW, setPastOpeningNW] = useState<number | ''>('');
    const [pastClosingNW, setPastClosingNW] = useState<number | ''>('');
    const [pastSavings, setPastSavings] = useState<number | ''>(0);
    const [pastGain, setPastGain] = useState<number | ''>('');
    const [pastLifGain, setPastLifGain] = useState<number | ''>('');
    const [pastNotes, setPastNotes] = useState<string>('');

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

        const openNW = Number(pastOpeningNW) || 0;
        const closeNW = Number(pastClosingNW) || 0;
        const savings = Number(pastSavings) || 0;
        const dollarGain = pastGain !== '' ? Number(pastGain) : (closeNW - openNW - savings);
        const returnPct = openNW > 0 ? (dollarGain / openNW) * 100 : 0;

        const newRecord = {
            id: `hist_${year}_manual`,
            calendarYear: year,
            archiveDate: new Date().toISOString().split('T')[0],
            openingNetWorth: openNW,
            closingNetWorth: closeNW,
            netSavingsAdded: savings,
            totalInvestmentGainDollar: dollarGain,
            effectiveAnnualReturnPct: Number(returnPct.toFixed(2)),
            actualBalances: {
                p1: {},
                p2: {}
            },
            priorYearGains: {
                p1_lif_dollar_gain: pastLifGain !== '' ? Number(pastLifGain) : undefined
            },
            notes: pastNotes || 'Historical actual entry',
            fullSnapshot: null
        };

        setData(prev => {
            const existing = (prev.history || []).filter((h: any) => h.calendarYear !== year);
            const updated = [...existing, newRecord].sort((a, b) => a.calendarYear - b.calendarYear);
            return {
                ...prev,
                history: updated
            };
        });

        showToast(`Saved historical actuals for Year ${year}!`);
        setShowAddPastYear(false);
        setPastOpeningNW('');
        setPastClosingNW('');
        setPastGain('');
        setPastLifGain('');
        setPastNotes('');
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
                        <button type="button" className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-bold shadow-sm d-flex align-items-center gap-1.5 bg-input" onClick={() => setShowAddPastYear(true)}>
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
                        <button type="button" className="btn btn-outline-primary rounded-pill px-4 py-2 fw-bold shadow-sm bg-input" onClick={() => setShowAddPastYear(true)}>
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
                                {historyList.map(h => {
                                    const isExpanded = expandedYear === h.calendarYear;
                                    const gain = h.totalInvestmentGainDollar || (h.closingNetWorth - h.openingNetWorth);
                                    const returnPct = h.effectiveAnnualReturnPct !== undefined 
                                        ? h.effectiveAnnualReturnPct 
                                        : (h.openingNetWorth > 0 ? (gain / h.openingNetWorth) * 100 : 0);

                                    return (
                                        <React.Fragment key={h.id || h.calendarYear}>
                                            <tr>
                                                <td className="ps-3 fw-bold text-primary">
                                                    <i className="bi bi-calendar2-check-fill me-1.5"></i> {h.calendarYear}
                                                </td>
                                                <td className="small text-muted">{h.archiveDate || '—'}</td>
                                                <td className="text-end text-muted small">${(h.openingNetWorth || 0).toLocaleString()}</td>
                                                <td className="text-end">
                                                    <span className={`badge ${gain >= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} fw-bold px-2 py-1`}>
                                                        {gain >= 0 ? '+' : ''}${Math.round(gain).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="text-end fw-bold text-main small">
                                                    {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                                                </td>
                                                <td className="text-end pe-3 fw-bold text-success">
                                                    ${(h.closingNetWorth || 0).toLocaleString()}
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
                                                                            <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Player 1 Balances</span>
                                                                            <div className="d-flex flex-wrap gap-2 mt-1.5">
                                                                                {Object.entries(h.actualBalances.p1).map(([acct, val]: [string, any]) => Number(val) > 0 && (
                                                                                    <span key={acct} className="badge bg-secondary bg-opacity-25 text-main">
                                                                                        {acct.toUpperCase()}: ${(Number(val)).toLocaleString()}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {h.actualBalances.p2 && Object.keys(h.actualBalances.p2).length > 0 && (
                                                                    <div className="col-12 col-md-6">
                                                                        <div className="p-2.5 bg-input border border-secondary rounded-3">
                                                                            <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Player 2 Balances</span>
                                                                            <div className="d-flex flex-wrap gap-2 mt-1.5">
                                                                                {Object.entries(h.actualBalances.p2).map(([acct, val]: [string, any]) => Number(val) > 0 && (
                                                                                    <span key={acct} className="badge bg-secondary bg-opacity-25 text-main">
                                                                                        {acct.toUpperCase()}: ${(Number(val)).toLocaleString()}
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
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center px-3 py-4" style={{ zIndex: 9999, backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(6px)' }}>
                    <div className="card surface-card border border-secondary shadow-lg rounded-4 w-100 d-flex flex-column my-auto" style={{ maxWidth: '580px' }}>
                        <div className="card-header border-bottom border-secondary p-3 d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center gap-2">
                                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                                    <i className="bi bi-calendar-plus fs-5"></i>
                                </div>
                                <div>
                                    <h5 className="mb-0 fw-bold">Add Historical Past Year</h5>
                                    <span className="small text-muted">Input known historical actuals (e.g. from prior years or past retirement years).</span>
                                </div>
                            </div>
                            <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={() => setShowAddPastYear(false)}>
                                <i className="bi bi-x-lg fs-5"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSavePastYear}>
                            <div className="card-body p-4">
                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Calendar Year</label>
                                        <input 
                                            type="number" 
                                            className="form-control fw-bold" 
                                            value={pastYearNum} 
                                            max={new Date().getFullYear()} 
                                            onChange={(e) => setPastYearNum(parseInt(e.target.value, 10) || (new Date().getFullYear() - 1))} 
                                            required 
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Net Savings Added ($)</label>
                                        <CurrencyInput 
                                            className="form-control" 
                                            placeholder="$0" 
                                            value={pastSavings} 
                                            onChange={(val: any) => setPastSavings(val)} 
                                        />
                                    </div>
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Jan 1 Opening NW ($)</label>
                                        <CurrencyInput 
                                            className="form-control" 
                                            placeholder="$0" 
                                            value={pastOpeningNW} 
                                            onChange={(val: any) => setPastOpeningNW(val)} 
                                        />
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Dec 31 Closing NW ($)</label>
                                        <CurrencyInput 
                                            className="form-control fw-bold text-success" 
                                            placeholder="$0" 
                                            value={pastClosingNW} 
                                            onChange={(val: any) => setPastClosingNW(val)} 
                                        />
                                    </div>
                                </div>

                                <div className="row g-3 mb-3">
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Investment Dollar Gain ($)</label>
                                        <CurrencyInput 
                                            className="form-control" 
                                            placeholder="Auto-calculated if blank" 
                                            value={pastGain} 
                                            onChange={(val: any) => setPastGain(val)} 
                                        />
                                        <span className="small text-muted" style={{ fontSize: '0.7rem' }}>Defaults to Closing &minus; Opening &minus; Savings</span>
                                    </div>
                                    <div className="col-6">
                                        <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">LIF Dollar Gain ($)</label>
                                        <CurrencyInput 
                                            className="form-control" 
                                            placeholder="Optional" 
                                            value={pastLifGain} 
                                            onChange={(val: any) => setPastLifGain(val)} 
                                        />
                                        <span className="small text-muted" style={{ fontSize: '0.7rem' }}>For prior year LIF limit calculations</span>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Notes / Milestones</label>
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm" 
                                        placeholder="e.g. Retired in June, Downsized home, Actual tax return..." 
                                        value={pastNotes} 
                                        onChange={(e) => setPastNotes(e.target.value)} 
                                    />
                                </div>
                            </div>

                            <div className="card-footer border-top border-secondary p-3 d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={() => setShowAddPastYear(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold">
                                    Save Historical Year
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