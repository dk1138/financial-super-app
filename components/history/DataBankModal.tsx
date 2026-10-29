import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';

interface DataBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenRollForward?: () => void;
    showToast?: (msg: string) => void;
}

export default function DataBankModal({ isOpen, onClose, onOpenRollForward, showToast }: DataBankModalProps) {
    const { data, restoreHistorySnapshot, setData } = useFinance();
    const historyList = (data.history || []) as any[];

    const [expandedYear, setExpandedYear] = useState<number | null>(null);

    if (!isOpen) return null;

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
        if (showToast) showToast('Exported Data Bank to CSV!');
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
        if (showToast) showToast('Exported Data Bank to JSON!');
    };

    const handleRestore = (h: any) => {
        if (confirm(`Restore your active plan to the exact state of ${h.calendarYear}? Your current inputs will be replaced by the ${h.calendarYear} snapshot.`)) {
            restoreHistorySnapshot(h.id);
            if (showToast) showToast(`Restored plan to ${h.calendarYear} snapshot!`);
            onClose();
        }
    };

    const handleDeleteEntry = (hId: string) => {
        if (confirm('Are you sure you want to remove this historical year from your Data Bank?')) {
            setData(prev => ({
                ...prev,
                history: (prev.history || []).filter((h: any) => h.id !== hId)
            }));
            if (showToast) showToast('Historical record removed.');
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 2000, backdropFilter: 'blur(6px)' }}>
            <div className="card surface-card border border-secondary shadow-lg rounded-4 w-100 d-flex flex-column" style={{ maxWidth: '880px', maxHeight: '90vh' }}>
                
                {/* MODAL HEADER */}
                <div className="card-header border-bottom border-secondary p-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-info bg-opacity-25 text-info rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-clock-history fs-5"></i>
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold">Plan Data Bank & Historical Ledger</h5>
                            <span className="small text-muted">Permanent records of completed calendar years, actual statement balances, and investment returns.</span>
                        </div>
                    </div>
                    <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={onClose}>
                        <i className="bi bi-x-lg fs-5"></i>
                    </button>
                </div>

                {/* MODAL BODY */}
                <div className="card-body p-4 overflow-auto flex-grow-1" style={{ maxHeight: 'calc(90vh - 150px)' }}>

                    {historyList.length === 0 ? (
                        <div className="text-center py-5">
                            <div className="bg-secondary bg-opacity-10 text-muted rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '64px', height: '64px' }}>
                                <i className="bi bi-database-exclamation fs-2"></i>
                            </div>
                            <h5 className="fw-bold mb-1">No Historical Years Banked Yet</h5>
                            <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '440px' }}>
                                When you complete an annual rollover, Planfolio archives your actual account balances and annual dollar gains into this Data Bank before advancing to the new year.
                            </p>
                            {onOpenRollForward && (
                                <button type="button" className="btn btn-primary rounded-pill px-4 fw-bold" onClick={() => { onClose(); onOpenRollForward(); }}>
                                    <i className="bi bi-calendar-plus me-1"></i> Perform Annual Roll-Forward
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <span className="small text-muted fw-bold text-uppercase ls-1">Archived Calendar Years ({historyList.length})</span>
                                <div className="d-flex gap-2">
                                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold" onClick={handleExportCsv}>
                                        <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
                                    </button>
                                    <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-bold" onClick={handleExportJson}>
                                        <i className="bi bi-download me-1"></i> Export JSON
                                    </button>
                                </div>
                            </div>

                            <div className="table-responsive">
                                <table className="table table-hover align-middle border border-secondary rounded-3 overflow-hidden">
                                    <thead className="table-dark">
                                        <tr style={{ fontSize: '0.75rem' }}>
                                            <th className="py-2 ps-3">Year</th>
                                            <th className="py-2">Archived Date</th>
                                            <th className="text-end py-2">Opening NW</th>
                                            <th className="text-end py-2">Dollar Gain ($)</th>
                                            <th className="text-end py-2">Annual Return</th>
                                            <th className="text-end py-2 pe-3">Closing NW</th>
                                            <th className="text-center py-2 pe-3" style={{ width: '130px' }}>Actions</th>
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
                                                            <i className="bi bi-calendar2-check-fill me-1"></i> {h.calendarYear}
                                                        </td>
                                                        <td className="small text-muted">{h.archiveDate || 'Unknown'}</td>
                                                        <td className="text-end text-muted small">${(h.openingNetWorth || 0).toLocaleString()}</td>
                                                        <td className="text-end">
                                                            <span className={`badge ${gain >= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} fw-bold`}>
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
                                                                    className="btn btn-outline-secondary p-1 px-2"
                                                                    onClick={() => setExpandedYear(isExpanded ? null : h.calendarYear)}
                                                                    title={isExpanded ? 'Hide Details' : 'Show Account Breakdown'}
                                                                >
                                                                    <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'}`}></i>
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-outline-primary p-1 px-2"
                                                                    onClick={() => handleRestore(h)}
                                                                    title="Restore plan to this year's snapshot"
                                                                >
                                                                    <i className="bi bi-arrow-counterclockwise"></i>
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn btn-outline-danger p-1 px-2"
                                                                    onClick={() => handleDeleteEntry(h.id)}
                                                                    title="Delete historical entry"
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* EXPANDABLE BREAKDOWN */}
                                                    {isExpanded && h.actualBalances && (
                                                        <tr className="bg-secondary bg-opacity-10">
                                                            <td colSpan={7} className="p-3">
                                                                <div className="small">
                                                                    <h6 className="fw-bold mb-2 text-main" style={{ fontSize: '0.8rem' }}>
                                                                        December 31, {h.calendarYear} Statement Balances on Record
                                                                    </h6>
                                                                    <div className="row g-2">
                                                                        {h.actualBalances.p1 && (
                                                                            <div className="col-12 col-md-6">
                                                                                <div className="p-2 bg-input border border-secondary rounded-3">
                                                                                    <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Player 1 Accounts</span>
                                                                                    <div className="d-flex flex-wrap gap-2 mt-1">
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
                                                                                <div className="p-2 bg-input border border-secondary rounded-3">
                                                                                    <span className="fw-bold text-muted small text-uppercase" style={{ fontSize: '0.65rem' }}>Player 2 Accounts</span>
                                                                                    <div className="d-flex flex-wrap gap-2 mt-1">
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
                                                                            Recorded LIF dollar gain for next year limit: <b className="text-info">${(h.priorYearGains.p1_lif_dollar_gain).toLocaleString()}</b>
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

                </div>

                {/* MODAL FOOTER */}
                <div className="card-footer border-top border-secondary p-3 d-flex justify-content-between align-items-center">
                    <span className="small text-muted">
                        <i className="bi bi-shield-check text-success me-1"></i> Stored in local plan file & browser storage
                    </span>
                    <button type="button" className="btn btn-sm btn-secondary rounded-pill px-4" onClick={onClose}>
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
}