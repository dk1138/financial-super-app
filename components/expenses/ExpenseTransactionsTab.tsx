'use client';

import React from 'react';
import { Transaction } from '../../lib/expenseDb';

interface Props {
    transactions: Transaction[];
    formatCurrency: (val: number) => string;
}

export default function ExpenseTransactionsTab({ transactions, formatCurrency }: Props) {
    return (
        <div className="fade-in">
            <div className="card border-secondary shadow-sm rounded-4 surface-card overflow-hidden">
                <div className="card-header border-bottom border-secondary bg-transparent py-3 px-4 d-flex justify-content-between align-items-center">
                    <h6 className="fw-bold mb-0">Ledger</h6>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-input border-secondary text-muted"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control bg-input border-secondary text-main" placeholder="Search merchants..." />
                    </div>
                </div>
                
                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    <table className="table table-hover table-borderless align-middle mb-0">
                        <thead className="border-bottom border-secondary opacity-75 position-sticky top-0 bg-input" style={{ zIndex: 10 }}>
                            <tr>
                                {/* Added width 1% and text-nowrap to squeeze the column to text width */}
                                <th className="ps-4 text-muted small fw-bold py-3 text-nowrap" style={{ width: '1%' }}>Date</th>
                                <th className="text-muted small fw-bold py-3">Merchant</th>
                                <th className="text-muted small fw-bold py-3">Category</th>
                                <th className="text-muted small fw-bold py-3">Account</th>
                                {/* Added width 1% and text-nowrap */}
                                <th className="text-end pe-4 text-muted small fw-bold py-3 text-nowrap" style={{ width: '1%' }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.slice(0, 100).map((tx) => (
                                <tr key={tx.id} style={{ cursor: 'pointer' }}>
                                    
                                    {/* DATE - Shrinks to fit */}
                                    <td className="ps-4 py-3 text-nowrap">
                                        <span className="text-muted small fw-bold">{tx.dateString}</span>
                                    </td>
                                    
                                    {/* MERCHANT - No truncate, shows full name */}
                                    <td className="py-3 fw-bold text-main">
                                        {tx.merchant}
                                    </td>
                                    
                                    {/* CATEGORY */}
                                    <td className="py-3">
                                        <span className={`badge border rounded-pill px-3 py-1 ${tx.category === 'Uncategorized' ? 'bg-secondary bg-opacity-25 text-secondary border-secondary' : 'bg-success bg-opacity-25 text-success border-success'}`}>
                                            {tx.category}
                                        </span>
                                    </td>
                                    
                                    {/* ACCOUNT - No truncate, shows full name */}
                                    <td className="py-3">
                                        <span className="text-muted small">
                                            <i className="bi bi-bank me-1"></i> {tx.account}
                                        </span>
                                    </td>
                                    
                                    {/* AMOUNT - Shrinks to fit */}
                                    <td className={`text-end pe-4 py-3 fw-bold text-nowrap ${tx.amount > 0 ? 'text-success' : 'text-main'}`}>
                                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                    </td>
                                    
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {transactions.length > 100 && (
                        <div className="text-center p-3 text-muted small bg-input border-top border-secondary">
                            Showing latest 100 transactions out of {transactions.length}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}