import React from 'react';
import FloatingFeedback from '@/components/FloatingFeedback';

export const metadata = {
  title: 'Retirement Planner - Planfolio',
  description: 'Free local-first Canadian retirement and financial planning simulator with CRA tax, CPP, OAS, and portfolio projection engines.',
};

export default function PlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Floating feedback button and modal accessible across all planner tabs */}
      <FloatingFeedback />
    </>
  );
}