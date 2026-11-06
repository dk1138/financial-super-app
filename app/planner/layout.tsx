import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Retirement Planner - Planfolio',
  description: 'Free local-first Canadian retirement and financial planning simulator with CRA tax, CPP, OAS, and portfolio projection engines.',
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" />
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
      {children}
    </>
  );
}