import React, { useState } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { FINANCIAL_CONSTANTS } from '../../lib/config';

const getYMPE = (year: number) => {
    const ympeMap: Record<number, number> = FINANCIAL_CONSTANTS.HISTORICAL_YMPE;
    const currentYearYMPE = FINANCIAL_CONSTANTS.YMPE;
    
    if (year > 2026) return currentYearYMPE + ((year - 2026) * 1500); 
    if (year < 2006) return 40000;
    return ympeMap[year] || currentYearYMPE;
};

const getYAMPE = (year: number) => {
    const yampeMap: Record<number, number> = FINANCIAL_CONSTANTS.HISTORICAL_YAMPE;
    if (yampeMap[year]) return yampeMap[year];
    if (year >= 2026) return getYMPE(year) * 1.14; 
    return getYMPE(year); 
};

export default function CPPImporter() {
    const { data, updateInput } = useFinance();
    const isCouple = data.mode === 'Couple';
    
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

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);

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
        
        const projectedBase = FINANCIAL_CONSTANTS.CPP_PROJECTED_MAX_BASE * avgRatio;
        
        const recent = augmentedRecords.filter(r => r.year >= 2019);
        let avgRecentRatio = 0;
        if (recent.length > 0) {
            const recentRatios = recent.map(r => Math.min(1, r.earnings / getYAMPE(r.year)));
            avgRecentRatio = recentRatios.reduce((a,b)=>a+b,0) / recent.length;
        }
        const projectedEnhanced = FINANCIAL_CONSTANTS.CPP_PROJECTED_MAX_ENHANCED * avgRecentRatio;
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

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            
            {toastMsg && (
                <div className="position-absolute top-0 start-50 translate-middle-x mt-3 transition-all" style={{zIndex: 1060}}>
                    <div className="bg-success text-white px-3 py-2 rounded-pill shadow-lg d-flex align-items-center fw-bold small border border-success">
                        <i className="bi bi-check-circle-fill me-2"></i> {toastMsg}
                    </div>
                </div>
            )}

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
    );
}