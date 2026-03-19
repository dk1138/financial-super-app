'use client';

import React, { useState } from 'react';

export default function ExpenseTrackerPage() {
    const [hasData, setHasData] = useState(false); // Toggle to true later to see the populated state

    return (
        <div className="container-fluid pb-5 fade-in">
            {/* --- HEADER --- */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                    <h3 className="fw-bold mb-1">Expense Tracker</h3>
                    <p className="text-muted small mb-0">Categorize your spending to sync with your retirement plan.</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary bg-input rounded-pill fw-bold shadow-sm d-flex align-items-center px-3" disabled={!hasData}>
                        <i className="bi bi-calendar3 me-2"></i> This Month
                    </button>
                    <button className="btn btn-success rounded-pill fw-bold shadow-sm d-flex align-items-center px-4" onClick={() => setHasData(!hasData)}>
                        <i className="bi bi-cloud-arrow-up-fill me-2"></i> Upload CSV
                    </button>
                </div>
            </div>

            {/* --- EMPTY STATE --- */}
            {!hasData && (
                <div className="card border-secondary border-dashed bg-transparent rounded-4 p-5 text-center mt-4">
                    <div className="card-body py-5">
                        <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '80px', height: '80px' }}>
                            <i className="bi bi-file-earmark-spreadsheet fs-1 text-success"></i>
                        </div>
                        <h4 className="fw-bold mb-3">No transactions found</h4>
                        <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                            Upload a CSV from your bank or credit card to instantly categorize your spending and generate average monthly costs for your retirement plan.
                        </p>
                        <button className="btn btn-success rounded-pill fw-bold px-4 shadow-sm" onClick={() => setHasData(true)}>
                            <i className="bi bi-upload me-2"></i> Select CSV File
                        </button>
                    </div>
                </div>
            )}

            {/* --- DASHBOARD (Visible when data exists) --- */}
            {hasData && (
                <>
                    {/* KPI ROW */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                                <div className="card-body p-3 p-xl-4">
                                    <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                        Total Spend (30d) <i className="bi bi-wallet2 text-danger"></i>
                                    </div>
                                    <h3 className="fw-bold mb-0 text-main">$4,250.00</h3>
                                    <div className="text-muted small mt-2"><span className="text-danger"><i className="bi bi-arrow-up-right"></i> 5.2%</span> vs last month</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                                <div className="card-body p-3 p-xl-4">
                                    <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                        Monthly Average <i className="bi bi-calculator text-primary"></i>
                                    </div>
                                    <h3 className="fw-bold mb-0 text-main">$3,840.50</h3>
                                    <div className="text-muted small mt-2">Syncs to Retirement Plan</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                                <div className="card-body p-3 p-xl-4">
                                    <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                        Top Category <i className="bi bi-house-door text-warning"></i>
                                    </div>
                                    <h3 className="fw-bold mb-0 text-main">Housing</h3>
                                    <div className="text-muted small mt-2">$2,100.00 (45% of total)</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-12 col-md-6 col-xl-3">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 bg-input">
                                <div className="card-body p-3 p-xl-4">
                                    <div className="text-muted fw-bold small text-uppercase mb-2 ls-1 d-flex justify-content-between">
                                        Transactions <i className="bi bi-receipt-cutoff text-success"></i>
                                    </div>
                                    <h3 className="fw-bold mb-0 text-main">142</h3>
                                    <div className="text-muted small mt-2"><span className="badge bg-warning text-dark">12 Uncategorized</span></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CHARTS ROW */}
                    <div className="row g-4 mb-4">
                        {/* Spend Over Time (Bar/Line Chart Placeholder) */}
                        <div className="col-12 col-lg-8">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card">
                                <div className="card-header border-0 bg-transparent pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold mb-0">Cash Flow Trend</h6>
                                    <button className="btn btn-sm btn-link text-muted"><i className="bi bi-three-dots"></i></button>
                                </div>
                                <div className="card-body p-4 d-flex align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                                    {/* Placeholder for Recharts / Chart.js */}
                                    <div className="text-center text-muted opacity-50">
                                        <i className="bi bi-bar-chart-line display-1 d-block mb-3"></i>
                                        <span className="fw-bold text-uppercase ls-1 small">Interactive Bar Chart Goes Here</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Spend By Category (Donut Chart Placeholder) */}
                        <div className="col-12 col-lg-4">
                            <div className="card h-100 border-secondary shadow-sm rounded-4 surface-card">
                                <div className="card-header border-0 bg-transparent pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
                                    <h6 className="fw-bold mb-0">Spending by Category</h6>
                                    <button className="btn btn-sm btn-link text-muted"><i className="bi bi-three-dots"></i></button>
                                </div>
                                <div className="card-body p-4 d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}>
                                     {/* Placeholder for Recharts / Chart.js */}
                                     <div className="text-center text-muted opacity-50 mb-4">
                                        <i className="bi bi-pie-chart display-1 d-block mb-3"></i>
                                        <span className="fw-bold text-uppercase ls-1 small">Donut Chart</span>
                                    </div>
                                    {/* Quick Legend Stub */}
                                    <div className="w-100 mt-auto">
                                        <div className="d-flex justify-content-between small mb-2"><span className="text-muted"><i className="bi bi-circle-fill text-primary me-2" style={{fontSize: '0.5rem'}}></i>Housing</span> <strong>45%</strong></div>
                                        <div className="d-flex justify-content-between small mb-2"><span className="text-muted"><i className="bi bi-circle-fill text-warning me-2" style={{fontSize: '0.5rem'}}></i>Food</span> <strong>25%</strong></div>
                                        <div className="d-flex justify-content-between small"><span className="text-muted"><i className="bi bi-circle-fill text-success me-2" style={{fontSize: '0.5rem'}}></i>Transport</span> <strong>15%</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TRANSACTIONS TABLE */}
                    <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                        <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                            <h6 className="fw-bold mb-0">Recent Transactions</h6>
                            <div className="input-group input-group-sm" style={{ width: '250px' }}>
                                <span className="input-group-text bg-input border-secondary text-muted"><i className="bi bi-search"></i></span>
                                <input type="text" className="form-control bg-input border-secondary text-main" placeholder="Search merchants..." />
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-hover table-borderless align-middle mb-0">
                                <thead className="border-bottom border-secondary opacity-75">
                                    <tr>
                                        <th className="ps-4 text-muted small fw-bold py-3">Date</th>
                                        <th className="text-muted small fw-bold py-3">Merchant</th>
                                        <th className="text-muted small fw-bold py-3">Category</th>
                                        <th className="text-muted small fw-bold py-3">Account</th>
                                        <th className="text-end pe-4 text-muted small fw-bold py-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Dummy Row 1 */}
                                    <tr style={{ cursor: 'pointer' }}>
                                        <td className="ps-4 py-3"><span className="text-muted small fw-bold">Oct 24, 2024</span></td>
                                        <td className="py-3 fw-bold">Whole Foods Market</td>
                                        <td className="py-3">
                                            <span className="badge bg-warning bg-opacity-25 text-warning border border-warning rounded-pill px-3 py-1">
                                                <i className="bi bi-cart2 me-1"></i> Essentials
                                            </span>
                                        </td>
                                        <td className="py-3"><span className="text-muted small"><i className="bi bi-credit-card me-1"></i> Visa *4092</span></td>
                                        <td className="text-end pe-4 py-3 fw-bold text-main">-$142.50</td>
                                    </tr>
                                    {/* Dummy Row 2 */}
                                    <tr style={{ cursor: 'pointer' }}>
                                        <td className="ps-4 py-3"><span className="text-muted small fw-bold">Oct 23, 2024</span></td>
                                        <td className="py-3 fw-bold">Shell Station</td>
                                        <td className="py-3">
                                            <span className="badge bg-info bg-opacity-25 text-info border border-info rounded-pill px-3 py-1">
                                                <i className="bi bi-car-front me-1"></i> Transport
                                            </span>
                                        </td>
                                        <td className="py-3"><span className="text-muted small"><i className="bi bi-credit-card me-1"></i> Visa *4092</span></td>
                                        <td className="text-end pe-4 py-3 fw-bold text-main">-$45.00</td>
                                    </tr>
                                    {/* Dummy Row 3 */}
                                    <tr style={{ cursor: 'pointer' }}>
                                        <td className="ps-4 py-3"><span className="text-muted small fw-bold">Oct 21, 2024</span></td>
                                        <td className="py-3 fw-bold">Acme Corp Payroll</td>
                                        <td className="py-3">
                                            <span className="badge bg-success bg-opacity-25 text-success border border-success rounded-pill px-3 py-1">
                                                <i className="bi bi-cash-stack me-1"></i> Income
                                            </span>
                                        </td>
                                        <td className="py-3"><span className="text-muted small"><i className="bi bi-bank me-1"></i> Checking *9921</span></td>
                                        <td className="text-end pe-4 py-3 fw-bold text-success">+$3,200.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="card-footer bg-transparent border-top border-secondary text-center py-3">
                            <button className="btn btn-sm btn-link text-muted text-decoration-none fw-bold">View All Transactions <i className="bi bi-arrow-right ms-1"></i></button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}