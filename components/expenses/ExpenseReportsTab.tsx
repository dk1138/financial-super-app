'use client';

import React from 'react';

export default function ExpenseReportsTab() {
    return (
        <div className="fade-in card border-secondary border-dashed bg-transparent rounded-4 p-5 text-center mt-2">
            <div className="card-body py-5 text-muted">
                <i className="bi bi-bar-chart-steps display-1 opacity-50 mb-3 d-block"></i>
                <h4 className="fw-bold mb-3">Advanced Analytics</h4>
                <p className="mx-auto" style={{ maxWidth: '400px' }}>
                    Deep dive into your historical spending trends, savings rates, and budget variances over time.
                </p>
                <span className="badge bg-secondary">Coming Soon</span>
            </div>
        </div>
    );
}