'use client';

import React from 'react';

export default function ExpenseCategoriesTab() {
    return (
        <div className="fade-in card border-secondary border-dashed bg-transparent rounded-4 p-5 text-center mt-2">
            <div className="card-body py-5 text-muted">
                <i className="bi bi-tags display-1 opacity-50 mb-3 d-block"></i>
                <h4 className="fw-bold mb-3">Category Rules</h4>
                <p className="mx-auto" style={{ maxWidth: '400px' }}>
                    Set up rules to automatically assign merchants to your retirement planner categories (Housing, Transport, Essentials, Lifestyle).
                </p>
                <span className="badge bg-secondary">Coming Soon</span>
            </div>
        </div>
    );
}