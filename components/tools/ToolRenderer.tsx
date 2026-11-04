'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Pre-sized matching skeleton placeholder to eliminate loading flicker and layout shift
const ToolSkeleton = () => (
    <div 
        className="rounded-2xl p-6 sm:p-8 animate-pulse shadow-xl"
        style={{
            backgroundColor: '#141c2b',
            border: '1px solid #2c3b52',
            minHeight: '480px',
        }}
    >
        <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-slate-800 rounded-lg w-48"></div>
            <div className="h-5 bg-blue-500/20 rounded-full w-24"></div>
        </div>
        <div className="space-y-4 mb-8">
            <div className="h-4 bg-slate-800/60 rounded w-full"></div>
            <div className="h-4 bg-slate-800/40 rounded w-3/4"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="h-14 bg-slate-800/50 rounded-xl"></div>
            <div className="h-14 bg-slate-800/50 rounded-xl"></div>
        </div>
        <div className="h-28 bg-slate-800/30 rounded-2xl"></div>
    </div>
);

const MedicalExpenseOptimizer = dynamic(() => import('../optimizers/MedicalExpenseOptimizer'), { ssr: false, loading: () => <ToolSkeleton /> });
const SideHustleROI = dynamic(() => import('../optimizers/SideHustleROI'), { ssr: false, loading: () => <ToolSkeleton /> });
const DieWithZero = dynamic(() => import('../optimizers/DieWithZero'), { ssr: false, loading: () => <ToolSkeleton /> });
const ConsumptionSmoother = dynamic(() => import('../optimizers/ConsumptionSmoother'), { ssr: false, loading: () => <ToolSkeleton /> });
const CPPGridSearch = dynamic(() => import('../optimizers/CPPGridSearch'), { ssr: false, loading: () => <ToolSkeleton /> });
const PensionBuyback = dynamic(() => import('../optimizers/PensionBuyback'), { ssr: false, loading: () => <ToolSkeleton /> });
const RRSPSweetSpot = dynamic(() => import('../optimizers/RRSPSweetSpot'), { ssr: false, loading: () => <ToolSkeleton /> });
const RRSPGrossUp = dynamic(() => import('../optimizers/RRSPGrossUp'), { ssr: false, loading: () => <ToolSkeleton /> });
const TFSAvsRRSP = dynamic(() => import('../optimizers/TFSAvsRRSP'), { ssr: false, loading: () => <ToolSkeleton /> });
const TFSARoomCalculator = dynamic(() => import('../optimizers/TFSARoomCalculator'), { ssr: false, loading: () => <ToolSkeleton /> });
const CCBMaximizer = dynamic(() => import('../optimizers/CCBMaximizer'), { ssr: false, loading: () => <ToolSkeleton /> });
const RESPMaximizer = dynamic(() => import('../optimizers/RESPMaximizer'), { ssr: false, loading: () => <ToolSkeleton /> });
const FHSAvsRRSP = dynamic(() => import('../optimizers/FHSAvsRRSP'), { ssr: false, loading: () => <ToolSkeleton /> });
const MortgageVsInvest = dynamic(() => import('../optimizers/MortgageVsInvest'), { ssr: false, loading: () => <ToolSkeleton /> });
const HomeMoveUp = dynamic(() => import('../optimizers/HomeMoveUp'), { ssr: false, loading: () => <ToolSkeleton /> });
const MortgageRenewal = dynamic(() => import('../optimizers/MortgageRenewal'), { ssr: false, loading: () => <ToolSkeleton /> });
const PensionCV = dynamic(() => import('../optimizers/PensionCV'), { ssr: false, loading: () => <ToolSkeleton /> });
const SmithManeuver = dynamic(() => import('../optimizers/SmithManeuver'), { ssr: false, loading: () => <ToolSkeleton /> });
const EmergencyFund = dynamic(() => import('../optimizers/EmergencyFund'), { ssr: false, loading: () => <ToolSkeleton /> });
const CarLease = dynamic(() => import('../optimizers/CarLease'), { ssr: false, loading: () => <ToolSkeleton /> });
const MortgageAffordability = dynamic(() => import('../optimizers/MortgageAffordability'), { ssr: false, loading: () => <ToolSkeleton /> });
const CPPImporter = dynamic(() => import('../optimizers/CPPImporter'), { ssr: false, loading: () => <ToolSkeleton /> });
const BuyVsRentAnalyzer = dynamic(() => import('../optimizers/BuyVsRentAnalyzer'), { ssr: false, loading: () => <ToolSkeleton /> });
const ReverseMortgage = dynamic(() => import('../optimizers/ReverseMortgage'), { ssr: false, loading: () => <ToolSkeleton /> });
const LIFtoRRIFOptimizer = dynamic(() => import('../optimizers/LIFtoRRIFOptimizer'), { ssr: false, loading: () => <ToolSkeleton /> });
const GISMaximizer = dynamic(() => import('../optimizers/GISMaximizer'), { ssr: false, loading: () => <ToolSkeleton /> });
const EstateTaxCalculator = dynamic(() => import('../optimizers/EstateTaxCalculator'), { ssr: false, loading: () => <ToolSkeleton /> });
const MarginalTaxCurve = dynamic(() => import('../optimizers/MarginalTaxCurve'), { ssr: false, loading: () => <ToolSkeleton /> });

export default function ToolRenderer({ toolKey }: { toolKey: string }) {
    switch (toolKey) {
        case 'pensionbb': return <PensionBuyback />;
        case 'lif-unlock': return <LIFtoRRIFOptimizer />;
        case 'tfsavsrrsp': return <TFSAvsRRSP />;
        case 'cpp': return <CPPGridSearch />;
        case 'tax-curve': return <MarginalTaxCurve />;
        case 'sweetspot': return <RRSPSweetSpot />;
        case 'grossup': return <RRSPGrossUp />;
        case 'tfsa-room': return <TFSARoomCalculator />;
        case 'gis-maximizer': return <GISMaximizer />;
        case 'estate-tax': return <EstateTaxCalculator />;
        case 'ccb': return <CCBMaximizer />;
        case 'fhsa': return <FHSAvsRRSP />;
        case 'resp': return <RESPMaximizer />;
        case 'pensioncv': return <PensionCV />;
        case 'buyvsrent': return <BuyVsRentAnalyzer isExpanded={true} />;
        case 'mvi': return <MortgageVsInvest />;
        case 'smith': return <SmithManeuver />;
        case 'afford': return <MortgageAffordability />;
        case 'renewal': return <MortgageRenewal />;
        case 'moveup': return <HomeMoveUp />;
        case 'reversemortgage': return <ReverseMortgage />;
        case 'emerg': return <EmergencyFund />;
        case 'car': return <CarLease />;
        case 'medical': return <MedicalExpenseOptimizer />;
        case 'sidehustle': return <SideHustleROI />;
        case 'dwz': return <DieWithZero />;
        case 'smoother': return <ConsumptionSmoother />;
        case 'cppimport': return <CPPImporter />;
        default: return <div className="p-4 text-muted">Tool coming soon.</div>;
    }
}