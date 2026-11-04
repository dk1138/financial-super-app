'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const MedicalExpenseOptimizer = dynamic(() => import('../optimizers/MedicalExpenseOptimizer'), { ssr: false });
const SideHustleROI = dynamic(() => import('../optimizers/SideHustleROI'), { ssr: false });
const DieWithZero = dynamic(() => import('../optimizers/DieWithZero'), { ssr: false });
const ConsumptionSmoother = dynamic(() => import('../optimizers/ConsumptionSmoother'), { ssr: false });
const CPPGridSearch = dynamic(() => import('../optimizers/CPPGridSearch'), { ssr: false });
const PensionBuyback = dynamic(() => import('../optimizers/PensionBuyback'), { ssr: false });
const RRSPSweetSpot = dynamic(() => import('../optimizers/RRSPSweetSpot'), { ssr: false });
const RRSPGrossUp = dynamic(() => import('../optimizers/RRSPGrossUp'), { ssr: false });
const TFSAvsRRSP = dynamic(() => import('../optimizers/TFSAvsRRSP'), { ssr: false });
const TFSARoomCalculator = dynamic(() => import('../optimizers/TFSARoomCalculator'), { ssr: false });
const CCBMaximizer = dynamic(() => import('../optimizers/CCBMaximizer'), { ssr: false });
const RESPMaximizer = dynamic(() => import('../optimizers/RESPMaximizer'), { ssr: false });
const FHSAvsRRSP = dynamic(() => import('../optimizers/FHSAvsRRSP'), { ssr: false });
const MortgageVsInvest = dynamic(() => import('../optimizers/MortgageVsInvest'), { ssr: false });
const HomeMoveUp = dynamic(() => import('../optimizers/HomeMoveUp'), { ssr: false });
const MortgageRenewal = dynamic(() => import('../optimizers/MortgageRenewal'), { ssr: false });
const PensionCV = dynamic(() => import('../optimizers/PensionCV'), { ssr: false });
const SmithManeuver = dynamic(() => import('../optimizers/SmithManeuver'), { ssr: false });
const EmergencyFund = dynamic(() => import('../optimizers/EmergencyFund'), { ssr: false });
const CarLease = dynamic(() => import('../optimizers/CarLease'), { ssr: false });
const MortgageAffordability = dynamic(() => import('../optimizers/MortgageAffordability'), { ssr: false });
const CPPImporter = dynamic(() => import('../optimizers/CPPImporter'), { ssr: false });
const BuyVsRentAnalyzer = dynamic(() => import('../optimizers/BuyVsRentAnalyzer'), { ssr: false });
const ReverseMortgage = dynamic(() => import('../optimizers/ReverseMortgage'), { ssr: false });
const LIFtoRRIFOptimizer = dynamic(() => import('../optimizers/LIFtoRRIFOptimizer'), { ssr: false });
const GISMaximizer = dynamic(() => import('../optimizers/GISMaximizer'), { ssr: false });
const EstateTaxCalculator = dynamic(() => import('../optimizers/EstateTaxCalculator'), { ssr: false });
const MarginalTaxCurve = dynamic(() => import('../optimizers/MarginalTaxCurve'), { ssr: false });

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