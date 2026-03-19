'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useFinance } from '../lib/FinanceContext';

export default function GlobalHeader() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const { data, updateUseRealDollars } = useFinance();

    const [theme, setTheme] = useState('dark');

    // Smoothly apply dark/light mode
    useEffect(() => {
        document.documentElement.setAttribute('data-bs-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

    // Automatically highlight the correct pill based on the URL
    const activeModule = pathname.includes('/expenses') ? 'expenses' : 'planner';

    return (
        <div 
            className="position-sticky top-0 pt-2 pb-2 mb-3" 
            style={{ backgroundColor: 'var(--bg-body)', zIndex: 1030, borderBottom: '1px solid var(--border-color)' }}
        >
            <div className="d-flex flex-wrap justify-content-between align-items-center shadow-sm mb-2 rounded-4 p-2 border border-secondary rp-card gap-2 m-0">
                
                <div className="d-flex align-items-center gap-2">
                    {/* --- MODERN PILL SELECTOR --- */}
                    <div className="bg-input border border-secondary rounded-pill p-1 d-flex align-items-center shadow-sm me-1" style={{ width: 'fit-content' }}>
                        <button 
                            className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all ${activeModule === 'planner' ? 'bg-primary text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                            onClick={() => router.push('/planner')}
                            style={{ fontSize: '0.85rem' }}
                        >
                            <i className="bi bi-graph-up-arrow me-2"></i>
                            <span className="d-none d-sm-inline">Retirement Planner</span>
                            <span className="d-inline d-sm-none">Planner</span>
                        </button>
                        
                        <button 
                            className={`btn btn-sm rounded-pill border-0 fw-bold px-3 transition-all ${activeModule === 'expenses' ? 'bg-success text-white shadow' : 'text-muted opacity-75 hover-opacity-100'}`} 
                            onClick={() => router.push('/expenses')}
                            style={{ fontSize: '0.85rem' }}
                        >
                            <i className="bi bi-receipt me-2"></i>
                            <span className="d-none d-sm-inline">Expense Tracker</span>
                            <span className="d-inline d-sm-none">Expenses</span>
                        </button>
                    </div>
                </div>
                
                <div className="d-flex align-items-center gap-2">
                    {/* Only show the "Today's $" toggle if they are looking at the Planner */}
                    {activeModule === 'planner' && (
                        <div 
                            className="d-flex align-items-center bg-input border border-secondary rounded-pill px-3 shadow-sm transition-all" 
                            style={{ height: '36px' }} 
                            title="Toggle Real vs Nominal Dollars."
                        >
                            <div className="form-check form-switch mb-0 d-flex align-items-center p-0 m-0">
                                <input 
                                    className="form-check-input m-0 cursor-pointer shadow-none" 
                                    type="checkbox" 
                                    id="useRealDollars" 
                                    checked={data.useRealDollars ?? false} 
                                    onChange={(e) => updateUseRealDollars(e.target.checked)} 
                                />
                                <label className="form-check-label small fw-bold text-info ms-2 cursor-pointer d-none d-md-block" style={{paddingTop: '2px'}} htmlFor="useRealDollars">
                                    Today's $
                                </label>
                            </div>
                        </div>
                    )}

                    <button 
                        type="button"
                        className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0" 
                        style={{ width: '36px', height: '36px' }} 
                        onClick={toggleTheme} 
                    >
                        <i className={`fs-6 ${theme === 'dark' ? 'bi bi-sun-fill text-warning' : 'bi-moon-fill text-primary'}`}></i>
                    </button>

                    <a 
                        href="https://ko-fi.com/P5P11UYZUD" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm transition-all p-0" 
                        style={{ width: '36px', height: '36px' }}
                    >
                        <i className="bi bi-cup-hot-fill fs-6" style={{ color: '#72a4f2' }}></i>
                    </a>

                    {session ? (
                        <div className="position-relative cursor-pointer" onClick={() => signOut()} title="Sign Out">
                            {session.user?.image ? (
                                <img src={session.user.image} alt="User" className="rounded-circle shadow-sm border border-secondary" width="36" height="36" />
                            ) : (
                                <button className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm p-0" style={{ width: '36px', height: '36px' }}>
                                    <i className="bi bi-person-fill fs-6"></i>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button 
                            type="button"
                            className="btn btn-outline-secondary rounded-circle bg-input d-flex align-items-center justify-content-center shadow-sm opacity-50 p-0" 
                            style={{ width: '36px', height: '36px', cursor: 'not-allowed' }} 
                            title="Google Sync coming soon"
                            onClick={(e) => e.preventDefault()}
                        >
                            <i className="bi bi-google fs-6"></i> 
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}