import React, { useState, useMemo } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { CurrencyInput, InfoBtn } from '../SharedUI';

interface RollForwardModalProps {
    isOpen: boolean;
    onClose: () => void;
    showToast?: (msg: string) => void;
}

export default function RollForwardModal({ isOpen, onClose, showToast }: RollForwardModalProps) {
    const { data, results, rollForwardPlan } = useFinance();

    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    // Current simulation base year
    const baseYear = results?.timeline?.[0]?.year || new Date().getFullYear();
    const [outgoingYear, setOutgoingYear] = useState<number>(baseYear);
    const [step, setStep] = useState<number>(1);

    // Track user statement closing inputs (pre-filled with projected values)
    const [closingBalances, setClosingBalances] = useState<Record<string, number>>({});
    const [propertyValues, setPropertyValues] = useState<Record<string, { value: number; mortgage: number }>>({});
    const [customAssetBalances, setCustomAssetBalances] = useState<Record<string, number>>({});

    // Account list definitions
    const accountTypes = [
        { id: 'tfsa', label: 'TFSA', icon: 'bi-piggy-bank-fill', color: 'text-success' },
        { id: 'rrsp', label: 'RRSP', icon: 'bi-briefcase-fill', color: 'text-info' },
        { id: 'nonreg', label: 'Non-Reg', icon: 'bi-cash-coin', color: 'text-primary' },
        { id: 'lif', label: 'LIF', icon: 'bi-safe2-fill', color: 'text-secondary', isLif: true },
        { id: 'lirf', label: 'LIRA / LIRF', icon: 'bi-lock-fill', color: 'text-muted' },
        { id: 'fhsa', label: 'FHSA', icon: 'bi-house-add-fill', color: 'text-primary' },
        { id: 'crypto', label: 'Crypto', icon: 'bi-currency-bitcoin', color: 'text-warning' },
        { id: 'cash', label: 'Cash / High Interest', icon: 'bi-wallet2', color: 'text-success' }
    ];

    // Initialize defaults when modal opens or step changes
    const initialProjectionYear = results?.timeline?.[0] || null;

    // Build editable items map
    const items = useMemo(() => {
        const list: Array<{
            key: string;
            owner: string;
            type: string;
            label: string;
            icon: string;
            color: string;
            startBal: number;
            projBal: number;
            isLif?: boolean;
        }> = [];

        ['p1', 'p2'].forEach(p => {
            if (!isCouple && p === 'p2') return;
            const ownerName = p === 'p1' ? p1Name : p2Name;

            accountTypes.forEach(acct => {
                const bal = Number(data.inputs[`${p}_${acct.id}`]) || 0;
                // If account has balance or was used
                if (bal > 0 || acct.id === 'tfsa' || acct.id === 'rrsp' || acct.id === 'nonreg') {
                    // Projected balance from first year of timeline if available
                    let projectedEnd = bal;
                    if (initialProjectionYear?.balances) {
                        const balKey = `${p}_${acct.id}`;
                        if (initialProjectionYear.balances[balKey] !== undefined) {
                            projectedEnd = initialProjectionYear.balances[balKey];
                        }
                    }

                    list.push({
                        key: `${p}_${acct.id}`,
                        owner: ownerName,
                        type: acct.id,
                        label: `${ownerName} ${acct.label}`,
                        icon: acct.icon,
                        color: acct.color,
                        startBal: bal,
                        projBal: Math.round(projectedEnd),
                        isLif: acct.isLif
                    });
                }
            });
        });

        return list;
    }, [data, isCouple, p1Name, p2Name, initialProjectionYear]);

    // Populate initial state if not yet modified
    React.useEffect(() => {
        if (isOpen) {
            const defaults: Record<string, number> = {};
            items.forEach(it => {
                defaults[it.key] = it.projBal;
            });
            setClosingBalances(defaults);

            const propDefaults: Record<string, { value: number; mortgage: number }> = {};
            (data.properties || []).forEach((prop, idx) => {
                // Approximate 1 year mortgage principal amortization
                const currentMortgage = Number(prop.mortgage) || 0;
                const annualPmt = (Number(prop.payment) || 0) * 12;
                const approxInterest = currentMortgage * ((Number(prop.rate) || 4.5) / 100);
                const amortizedMortgage = Math.max(0, currentMortgage - Math.max(0, annualPmt - approxInterest));
                const growthRate = (Number(prop.growth) || 3.0) / 100;
                const estValue = Math.round((Number(prop.value) || 0) * (1 + growthRate));

                propDefaults[`prop_${idx}`] = {
                    value: estValue,
                    mortgage: Math.round(amortizedMortgage)
                };
            });
            setPropertyValues(propDefaults);

            const caDefaults: Record<string, number> = {};
            (data.customAssets || []).forEach((ca, idx) => {
                const growthRate = (Number(ca.rate) || 6.0) / 100;
                caDefaults[`ca_${idx}`] = Math.round((Number(ca.balance) || 0) * (1 + growthRate));
            });
            setCustomAssetBalances(caDefaults);
            setStep(1);
        }
    }, [isOpen, items, data.properties, data.customAssets]);

    if (!isOpen) return null;

    // Net worth and gain math
    let openingTotal = 0;
    let closingTotal = 0;

    items.forEach(it => {
        openingTotal += it.startBal;
        closingTotal += closingBalances[it.key] !== undefined ? closingBalances[it.key] : it.projBal;
    });

    (data.properties || []).forEach((p, idx) => {
        openingTotal += (Number(p.value) || 0) - (Number(p.mortgage) || 0);
        const pv = propertyValues[`prop_${idx}`];
        if (pv) {
            closingTotal += (pv.value - pv.mortgage);
        }
    });

    (data.customAssets || []).forEach((ca, idx) => {
        openingTotal += Number(ca.balance) || 0;
        const cab = customAssetBalances[`ca_${idx}`];
        closingTotal += cab !== undefined ? cab : Number(ca.balance) || 0;
    });

    const netGrowth = closingTotal - openingTotal;
    const growthPct = openingTotal > 0 ? (netGrowth / openingTotal) * 100 : 0;

    // Calculate actual dollar gain for LIF accounts
    const p1LifStart = Number(data.inputs['p1_lif']) || 0;
    const p1LifEnd = closingBalances['p1_lif'] !== undefined ? closingBalances['p1_lif'] : p1LifStart;
    const p1LifGain = Math.max(0, p1LifEnd - p1LifStart);

    const p2LifStart = Number(data.inputs['p2_lif']) || 0;
    const p2LifEnd = closingBalances['p2_lif'] !== undefined ? closingBalances['p2_lif'] : p2LifStart;
    const p2LifGain = Math.max(0, p2LifEnd - p2LifStart);

    const handleCommitRollForward = () => {
        const nextYear = outgoingYear + 1;

        // 1. Build updated inputs
        const newInputs: Record<string, any> = {};

        // Advance ages
        newInputs['p1_age'] = (Number(data.inputs['p1_age']) || 35) + 1;
        if (isCouple) {
            newInputs['p2_age'] = (Number(data.inputs['p2_age']) || 35) + 1;
        }

        // Apply updated closing balances as new starting balances
        items.forEach(it => {
            newInputs[it.key] = closingBalances[it.key] !== undefined ? closingBalances[it.key] : it.projBal;
        });

        // Set LIF prior year dollar return
        if (p1LifStart > 0) {
            newInputs['p1_lif_prior_return'] = p1LifGain;
        }
        if (isCouple && p2LifStart > 0) {
            newInputs['p2_lif_prior_return'] = p2LifGain;
        }

        // 2. Updated properties
        const updatedProps = (data.properties || []).map((prop, idx) => {
            const pv = propertyValues[`prop_${idx}`];
            if (!pv) return prop;
            return {
                ...prop,
                value: pv.value,
                mortgage: pv.mortgage
            };
        });

        // 3. Updated custom assets
        const updatedCustom = (data.customAssets || []).map((ca, idx) => {
            const cab = customAssetBalances[`ca_${idx}`];
            return {
                ...ca,
                balance: cab !== undefined ? cab : ca.balance
            };
        });

        // 4. Build historical record
        const historyRecord = {
            id: `hist_${outgoingYear}`,
            calendarYear: outgoingYear,
            archiveDate: new Date().toISOString().split('T')[0],
            openingNetWorth: Math.round(openingTotal),
            closingNetWorth: Math.round(closingTotal),
            netSavingsAdded: 0,
            totalInvestmentGainDollar: Math.round(netGrowth),
            effectiveAnnualReturnPct: Number(growthPct.toFixed(2)),
            actualBalances: {
                p1: items.filter(it => it.key.startsWith('p1_')).reduce((acc, it) => {
                    acc[it.type] = closingBalances[it.key] || it.projBal;
                    return acc;
                }, {} as Record<string, number>),
                p2: isCouple ? items.filter(it => it.key.startsWith('p2_')).reduce((acc, it) => {
                    acc[it.type] = closingBalances[it.key] || it.projBal;
                    return acc;
                }, {} as Record<string, number>) : undefined,
                properties: updatedProps.map(p => ({ name: p.name, value: p.value, mortgage: p.mortgage })),
                customAssets: updatedCustom.map(c => ({ name: c.name, balance: c.balance, owner: c.owner, type: c.type }))
            },
            priorYearGains: {
                p1_lif_dollar_gain: p1LifStart > 0 ? p1LifGain : undefined,
                p2_lif_dollar_gain: isCouple && p2LifStart > 0 ? p2LifGain : undefined
            },
            fullSnapshot: JSON.parse(JSON.stringify(data))
        };

        // 5. Execute roll forward
        rollForwardPlan(historyRecord, newInputs, updatedCustom, updatedProps);

        if (showToast) {
            showToast(`Rolled forward to ${nextYear}! Prior year saved to Data Bank.`);
        }
        onClose();
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex align-items-center justify-content-center p-3" style={{ zIndex: 2000, backdropFilter: 'blur(6px)' }}>
            <div className="card surface-card border border-secondary shadow-lg rounded-4 w-100 d-flex flex-column" style={{ maxWidth: '780px', maxHeight: '90vh' }}>
                
                {/* MODAL HEADER */}
                <div className="card-header border-bottom border-secondary p-3 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                            <i className="bi bi-calendar-check-fill fs-5"></i>
                        </div>
                        <div>
                            <h5 className="mb-0 fw-bold">Annual Roll-Forward Wizard</h5>
                            <span className="small text-muted">Archive completed year, update December 31 actuals, and advance by +1 year.</span>
                        </div>
                    </div>
                    <button type="button" className="btn btn-sm btn-link text-muted p-0" onClick={onClose}>
                        <i className="bi bi-x-lg fs-5"></i>
                    </button>
                </div>

                {/* STEP WIZARD PILLS */}
                <div className="px-4 pt-3 pb-2 border-bottom border-secondary border-opacity-50 bg-input d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${step === 1 ? 'bg-primary text-white shadow' : 'bg-secondary bg-opacity-25 text-muted'}`}>
                            1. Select Year ({outgoingYear})
                        </span>
                        <i className="bi bi-chevron-right text-muted small"></i>
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${step === 2 ? 'bg-primary text-white shadow' : 'bg-secondary bg-opacity-25 text-muted'}`}>
                            2. Dec 31 Statement Balances
                        </span>
                        <i className="bi bi-chevron-right text-muted small"></i>
                        <span className={`badge rounded-pill px-3 py-2 fw-bold ${step === 3 ? 'bg-primary text-white shadow' : 'bg-secondary bg-opacity-25 text-muted'}`}>
                            3. Review & Rollover
                        </span>
                    </div>
                    <span className="small text-muted fw-bold">Next Year: <b className="text-info">{outgoingYear + 1}</b></span>
                </div>

                {/* MODAL BODY */}
                <div className="card-body p-4 overflow-auto flex-grow-1" style={{ maxHeight: 'calc(90vh - 190px)' }}>

                    {/* --- STEP 1: YEAR & HOUSEHOLD VERIFICATION --- */}
                    {step === 1 && (
                        <div>
                            <div className="alert border-info bg-info bg-opacity-10 rounded-3 p-3 mb-4 d-flex align-items-start gap-3">
                                <i className="bi bi-info-circle-fill text-info fs-4 flex-shrink-0 mt-1"></i>
                                <div className="small">
                                    <h6 className="fw-bold text-info mb-1">How Annual Roll-Forward Works</h6>
                                    When you finish a calendar year in real life, your actual balances won't exactly match the simulator's 6% growth rate. 
                                    This wizard preserves your <b className="text-main">{outgoingYear}</b> baseline into your <b>Data Bank</b>, updates your starting accounts with real December 31 statement balances, advances household ages by <b>+1 year</b>, and rolls your plan into <b className="text-main">{outgoingYear + 1}</b>.
                                </div>
                            </div>

                            <div className="row g-3 mb-4">
                                <div className="col-12 col-sm-6">
                                    <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Completed Calendar Year</label>
                                    <input 
                                        type="number" 
                                        className="form-control fw-bold fs-5" 
                                        value={outgoingYear} 
                                        onChange={(e) => setOutgoingYear(parseInt(e.target.value, 10) || baseYear)} 
                                    />
                                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>The calendar year that just concluded.</span>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <label className="form-label small fw-bold text-muted mb-1 text-uppercase ls-1">Rollover Destination Year</label>
                                    <div className="form-control bg-secondary bg-opacity-10 fw-bold fs-5 text-info d-flex align-items-center justify-content-between">
                                        <span>{outgoingYear + 1}</span>
                                        <i className="bi bi-arrow-right-circle-fill"></i>
                                    </div>
                                    <span className="small text-muted" style={{ fontSize: '0.75rem' }}>Your new active plan timeline will begin here.</span>
                                </div>
                            </div>

                            {/* Household Aging Preview */}
                            <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-2">Household Age Roll-Forward</h6>
                            <div className="p-3 bg-input border border-secondary rounded-3 mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="fw-bold text-main">{p1Name}</span>
                                    <span className="badge bg-secondary bg-opacity-25 text-main px-3 py-1 fs-6">
                                        Age {data.inputs.p1_age || 35} <i className="bi bi-arrow-right mx-1 text-muted"></i> <b className="text-success">Age {(Number(data.inputs.p1_age) || 35) + 1}</b>
                                    </span>
                                </div>
                                {isCouple && (
                                    <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-25">
                                        <span className="fw-bold" style={{ color: 'var(--bs-purple)' }}>{p2Name}</span>
                                        <span className="badge bg-secondary bg-opacity-25 text-main px-3 py-1 fs-6">
                                            Age {data.inputs.p2_age || 35} <i className="bi bi-arrow-right mx-1 text-muted"></i> <b className="text-success">Age {(Number(data.inputs.p2_age) || 35) + 1}</b>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Baseline Net Worth Preview */}
                            <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-2">Starting Net Worth on Record</h6>
                            <div className="p-3 bg-primary bg-opacity-10 border border-primary border-opacity-50 rounded-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <span className="small text-muted text-uppercase fw-bold ls-1">Opening Total Portfolio + Equity</span>
                                    <h4 className="mb-0 fw-bold text-primary">${Math.round(openingTotal).toLocaleString()}</h4>
                                </div>
                                <i className="bi bi-shield-lock-fill text-primary fs-2 opacity-50"></i>
                            </div>
                        </div>
                    )}

                    {/* --- STEP 2: ENTER ACTUAL DEC 31 STATEMENTS --- */}
                    {step === 2 && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div>
                                    <h6 className="fw-bold mb-0">Enter Closing Statement Balances</h6>
                                    <span className="small text-muted">Pre-filled with your simulator's expectation. Edit any line to match your December 31 statement.</span>
                                </div>
                                <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1">
                                    {items.length + (data.properties?.length || 0) + (data.customAssets?.length || 0)} Accounts
                                </span>
                            </div>

                            {/* Account Table */}
                            <div className="table-responsive">
                                <table className="table table-sm align-middle table-hover border border-secondary rounded-3 overflow-hidden">
                                    <thead className="table-dark">
                                        <tr style={{ fontSize: '0.75rem' }}>
                                            <th className="py-2 ps-3">Account</th>
                                            <th className="text-end py-2">Jan 1 Start</th>
                                            <th className="text-end py-2">Expected End</th>
                                            <th className="text-end py-2 pe-3" style={{ minWidth: '170px' }}>Actual Dec 31 Balance</th>
                                            <th className="text-end py-2 pe-3">Gain / Variance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map(it => {
                                            const currentVal = closingBalances[it.key] !== undefined ? closingBalances[it.key] : it.projBal;
                                            const diff = currentVal - it.startBal;
                                            const isLif = it.isLif;

                                            return (
                                                <tr key={it.key}>
                                                    <td className="ps-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className={`bi ${it.icon} ${it.color}`}></i>
                                                            <span className="fw-semibold small">{it.label}</span>
                                                            {isLif && (
                                                                <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25" style={{ fontSize: '0.65rem' }}>
                                                                    Sets LIF Return ($)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="text-end text-muted small">${it.startBal.toLocaleString()}</td>
                                                    <td className="text-end text-muted small">${it.projBal.toLocaleString()}</td>
                                                    <td className="text-end pe-3">
                                                        <CurrencyInput 
                                                            className="form-control form-control-sm text-end fw-bold"
                                                            value={currentVal}
                                                            onChange={(val: any) => setClosingBalances(prev => ({ ...prev, [it.key]: Number(val) || 0 }))}
                                                        />
                                                    </td>
                                                    <td className="text-end pe-3">
                                                        <span className={`badge ${diff >= 0 ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'} fw-bold`}>
                                                            {diff >= 0 ? '+' : ''}${Math.round(diff).toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Real Estate Properties */}
                                        {(data.properties || []).map((prop, idx) => {
                                            const pv = propertyValues[`prop_${idx}`] || { value: prop.value, mortgage: prop.mortgage };
                                            return (
                                                <tr key={`prop_row_${idx}`} className="bg-secondary bg-opacity-10">
                                                    <td className="ps-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <i className="bi bi-house-door-fill text-danger"></i>
                                                            <span className="fw-bold small">{prop.name} (Val / Mort)</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-end text-muted small">${(Number(prop.value) || 0).toLocaleString()}</td>
                                                    <td className="text-end text-muted small">Mort: ${(Number(prop.mortgage) || 0).toLocaleString()}</td>
                                                    <td className="text-end pe-3">
                                                        <div className="d-flex gap-1">
                                                            <CurrencyInput 
                                                                className="form-control form-control-sm text-end"
                                                                placeholder="Value"
                                                                value={pv.value}
                                                                onChange={(val: any) => setPropertyValues(prev => ({ ...prev, [`prop_${idx}`]: { ...pv, value: Number(val) || 0 } }))}
                                                            />
                                                            <CurrencyInput 
                                                                className="form-control form-control-sm text-end"
                                                                placeholder="Mortgage"
                                                                value={pv.mortgage}
                                                                onChange={(val: any) => setPropertyValues(prev => ({ ...prev, [`prop_${idx}`]: { ...pv, mortgage: Number(val) || 0 } }))}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="text-end pe-3">
                                                        <span className="small text-muted fw-bold">Equity: ${(pv.value - pv.mortgage).toLocaleString()}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* LIF Highlight Box if applicable */}
                            {(p1LifStart > 0 || (isCouple && p2LifStart > 0)) && (
                                <div className="p-3 bg-secondary bg-opacity-10 border border-secondary rounded-3 mt-3 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-2">
                                        <i className="bi bi-safe2-fill text-secondary fs-4"></i>
                                        <div>
                                            <span className="small fw-bold text-main d-block">Automatic LIF Prior Year Return Integration</span>
                                            <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
                                                Based on your statement entries, the annual LIF dollar return for Year {outgoingYear + 1} will automatically set to:
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        {p1LifStart > 0 && <span className="badge bg-primary fs-6 px-3 py-1 me-1">{p1Name}: +${p1LifGain.toLocaleString()}</span>}
                                        {isCouple && p2LifStart > 0 && <span className="badge bg-purple fs-6 px-3 py-1">{p2Name}: +${p2LifGain.toLocaleString()}</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- STEP 3: REVIEW & ROLLOVER CONFIRMATION --- */}
                    {step === 3 && (
                        <div>
                            <div className="alert border-success bg-success bg-opacity-10 rounded-3 p-3 mb-4 d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                    <i className="bi bi-check-circle-fill text-success fs-3"></i>
                                    <div>
                                        <h6 className="fw-bold text-success mb-0">Year {outgoingYear} Reconciliation Complete</h6>
                                        <span className="small text-muted">Review the final ledger summary below before archiving.</span>
                                    </div>
                                </div>
                                <span className="badge bg-success text-white px-3 py-1 fs-6">
                                    {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(2)}% Total Gain
                                </span>
                            </div>

                            {/* Wealth Scorecard */}
                            <div className="row g-3 mb-4 text-center">
                                <div className="col-4">
                                    <div className="p-3 bg-input border border-secondary rounded-3">
                                        <span className="small text-muted text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Jan 1, {outgoingYear} Opening</span>
                                        <h5 className="mb-0 fw-bold mt-1">${Math.round(openingTotal).toLocaleString()}</h5>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-3 bg-input border border-secondary rounded-3">
                                        <span className="small text-muted text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Actual Dollar Gain</span>
                                        <h5 className={`mb-0 fw-bold mt-1 ${netGrowth >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {netGrowth >= 0 ? '+' : ''}${Math.round(netGrowth).toLocaleString()}
                                        </h5>
                                    </div>
                                </div>
                                <div className="col-4">
                                    <div className="p-3 bg-input border border-primary border-opacity-50 rounded-3">
                                        <span className="small text-primary text-uppercase fw-bold ls-1" style={{ fontSize: '0.65rem' }}>Dec 31, {outgoingYear} Closing</span>
                                        <h5 className="mb-0 fw-bold text-primary mt-1">${Math.round(closingTotal).toLocaleString()}</h5>
                                    </div>
                                </div>
                            </div>

                            {/* Roll Forward Commit Checklist */}
                            <h6 className="fw-bold text-muted small text-uppercase ls-1 mb-2">Automated Actions on Rollover</h6>
                            <div className="p-3 bg-input border border-secondary rounded-3 d-flex flex-column gap-2 mb-3">
                                <div className="d-flex align-items-center gap-2 small text-main">
                                    <i className="bi bi-check-lg text-success fw-bold fs-5"></i>
                                    <span><b>Archive Year {outgoingYear}</b> into the immutable Data Bank ledger.</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 small text-main">
                                    <i className="bi bi-check-lg text-success fw-bold fs-5"></i>
                                    <span><b>Save Safety Restore Point</b> in local storage (<code>rp_saved_plan_Pre_Rollforward_{outgoingYear}</code>).</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 small text-main">
                                    <i className="bi bi-check-lg text-success fw-bold fs-5"></i>
                                    <span><b>Advance Ages by +1 year</b> ({p1Name}: {data.inputs.p1_age} &rarr; {(Number(data.inputs.p1_age) || 35) + 1}{isCouple ? `, ${p2Name}: ${data.inputs.p2_age} → ${(Number(data.inputs.p2_age) || 35) + 1}` : ''}).</span>
                                </div>
                                <div className="d-flex align-items-center gap-2 small text-main">
                                    <i className="bi bi-check-lg text-success fw-bold fs-5"></i>
                                    <span><b>Set New Starting Portfolios</b> to your exact December 31 statement balances.</span>
                                </div>
                                {p1LifStart > 0 && (
                                    <div className="d-flex align-items-center gap-2 small text-main">
                                        <i className="bi bi-check-lg text-success fw-bold fs-5"></i>
                                        <span><b>Update LIF Prior Year Return</b> to <b>+${p1LifGain.toLocaleString()}</b> for {outgoingYear + 1} maximum limits.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div className="card-footer border-top border-secondary p-3 d-flex justify-content-between align-items-center">
                    <div>
                        {step > 1 && (
                            <button type="button" className="btn btn-sm btn-outline-secondary rounded-pill px-4 fw-bold" onClick={() => setStep(step - 1)}>
                                <i className="bi bi-arrow-left me-1"></i> Back
                            </button>
                        )}
                    </div>
                    <div className="d-flex gap-2">
                        <button type="button" className="btn btn-sm btn-secondary rounded-pill px-3" onClick={onClose}>
                            Cancel
                        </button>
                        {step < 3 ? (
                            <button type="button" className="btn btn-sm btn-primary rounded-pill px-4 fw-bold" onClick={() => setStep(step + 1)}>
                                Next Step <i className="bi bi-arrow-right ms-1"></i>
                            </button>
                        ) : (
                            <button type="button" className="btn btn-sm btn-success rounded-pill px-4 fw-bold shadow-sm" onClick={handleCommitRollForward}>
                                <i className="bi bi-check2-circle me-1"></i> Confirm & Rollover to {outgoingYear + 1}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}