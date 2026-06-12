'use client';

import React, { useState, useEffect } from 'react';
import { useFinance } from '../../lib/FinanceContext';
import { SegmentedControl, CurrencyInput } from '../SharedUI';

// CRA Official Historical TFSA Limits Table (2009-2026)
const TFSA_LIMITS_HISTORY = [
    { year: 2009, limit: 5000 },
    { year: 2010, limit: 5000 },
    { year: 2011, limit: 5000 },
    { year: 2012, limit: 5000 },
    { year: 2013, limit: 5500 },
    { year: 2014, limit: 5500 },
    { year: 2015, limit: 10000 },
    { year: 2016, limit: 5500 },
    { year: 2017, limit: 5500 },
    { year: 2018, limit: 5500 },
    { year: 2019, limit: 6000 },
    { year: 2020, limit: 6000 },
    { year: 2021, limit: 6000 },
    { year: 2022, limit: 6000 },
    { year: 2023, limit: 6500 },
    { year: 2024, limit: 7000 },
    { year: 2025, limit: 7000 },
    { year: 2026, limit: 7000 },
];

export default function TFSARoomCalculator() {
    const { data } = useFinance();
    const isCouple = data.mode === 'Couple';
    const p1Name = data.inputs.p1_name || 'Player 1';
    const p2Name = data.inputs.p2_name || 'Player 2';

    const currentYear = new Date().getFullYear();

    // --- CARD LOCAL STATES ---
    const [activeTarget, setActiveTarget] = useState<'p1' | 'p2'>('p1');
    const [arrivalYear, setArrivalYear] = useState<number>(2009);
    const [ageAtArrival, setAgeAtArrival] = useState<number>(18);
    const [pastContributions, setPastContributions] = useState<number>(0);

    // Sync input initializations whenever active player context shifts
    useEffect(() => {
        const playerBirthYear = data.inputs[`${activeTarget}_dob`] 
            ? parseInt(data.inputs[`${activeTarget}_dob`].split('-')[0]) 
            : currentYear - (data.inputs[`${activeTarget}_age`] || 30);
            
        // Default to arriving in 2009 or turning 18, whichever comes later
        const defaultArrival = Math.max(2009, playerBirthYear + 18);
        setArrivalYear(Math.min(currentYear, defaultArrival));
        setAgeAtArrival(Math.max(18, currentYear - playerBirthYear - (currentYear - defaultArrival)));
        
        // Pull existing TFSA asset balance as a reference point for prior deposits if available
        const currentTfsaBalance = Number(data.inputs[`${activeTarget}_tfsa`]) || 0;
        setPastContributions(currentTfsaBalance);
    }, [activeTarget, data.inputs]);

    // --- CRA ROOM ACCUMULATION ENGINE MATH ---
    const calculateAccumulatedRoom = () => {
        let totalRoom = 0;
        const birthYear = arrivalYear - ageAtArrival;

        TFSA_LIMITS_HISTORY.forEach(item => {
            // Rule: Must be a resident of Canada AND 18+ on or before Dec 31 of that room allocation year
            const wasResident = item.year >= arrivalYear;
            const ageInYear = item.year - birthYear;
            const wasOfAge = ageInYear >= 18;

            if (wasResident && wasOfAge) {
                totalRoom += item.limit;
            }
        });
        return totalRoom;
    };

    const totalAllocatedRoom = calculateAccumulatedRoom();
    const netAvailableRoom = Math.max(0, totalAllocatedRoom - pastContributions);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(val || 0);
    };

    return (
        <div className="rp-card border-secondary rounded-4 p-4 h-100 position-relative overflow-hidden d-flex flex-column shadow-sm">
            {/* Header Area */}
            <div className="d-flex align-items-center mb-3">
                <div className="bg-primary bg-opacity-25 text-primary rounded-circle d-flex align-items-center justify-content-center shadow-inner me-3" style={{width: '45px', height: '45px', flexShrink: 0}}>
                    <i className="bi bi-calculator-fill fs-4"></i>
                </div>
                <div>
                    <h5 className="fw-bold text-primary mb-0 text-uppercase ls-1">TFSA Contribution Room</h5>
                </div>
            </div>

            {/* Selection Pill Row */}
            {isCouple && (
                <div className="border-bottom border-secondary border-opacity-25 pb-3 mb-3">
                    <SegmentedControl 
                        value={activeTarget} 
                        onChange={(val: any) => setActiveTarget(val)} 
                        options={[
                            { value: 'p1', label: p1Name },
                            { value: 'p2', label: p2Name }
                        ]} 
                    />
                </div>
            )}
            
            <p className="text-muted small mb-4">Calculates cumulative lifetime Tax-Free Savings Account (TFSA) room from 2009 onwards, accounting for age barriers and Canadian residency arrival boundaries.</p>

            {/* Form Input Options Section */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-4">
                    <label className="form-label small text-muted fw-bold mb-1">Year Arrived in Canada</label>
                    <input 
                        type="number" 
                        className="form-control bg-input border-secondary fw-bold text-main" 
                        min={2009} 
                        max={currentYear} 
                        value={arrivalYear} 
                        onChange={e => setArrivalYear(Math.max(2009, Math.min(currentYear, parseInt(e.target.value) || currentYear)))} 
                    />
                </div>
                <div className="col-12 col-sm-6 col-md-4">
                    <label className="form-label small text-muted fw-bold mb-1">Age in Year of Arrival</label>
                    <input 
                        type="number" 
                        className="form-control bg-input border-secondary fw-bold text-main" 
                        min={0} 
                        max={100} 
                        value={ageAtArrival} 
                        onChange={e => setAgeAtArrival(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))} 
                    />
                </div>
                <div className="col-12 col-md-4">
                    <label className="form-label small text-muted fw-bold mb-1">Total Past Deposits (Net)</label>
                    <CurrencyInput 
                        className="form-control" 
                        value={pastContributions} 
                        onChange={(val: any) => setPastContributions(Number(val) || 0)} 
                    />
                </div>
            </div>

            {/* Result Ledger Box Output */}
            <div className="flex-grow-1 d-flex flex-column justify-content-center p-4 bg-input border border-secondary rounded-4 shadow-inner mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-muted fw-bold small">Gross Accumulated Lifetime Room:</span>
                    <span className="fw-bold text-main fs-6">{formatCurrency(totalAllocatedRoom)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-secondary border-opacity-50">
                    <span className="text-muted fw-bold small">Minus Portfolio Principal Placed:</span>
                    <span className="fw-bold text-danger">-{formatCurrency(pastContributions)}</span>
                </div>
                
                <div className="text-center mt-2">
                    <span className="text-muted fw-bold small text-uppercase ls-1 mb-1 d-block">Estimated Remaining Safe Room</span>
                    <span className="display-6 fw-bolder text-success">{formatCurrency(netAvailableRoom)}</span>
                </div>
            </div>
            
            <span className="small text-muted text-center fst-italic mt-2">
                <i className="bi bi-info-circle me-1"></i> Contribution allotments never prorate during your arrival year. Unused room carries forward indefinitely.
            </span>
        </div>
    );
}