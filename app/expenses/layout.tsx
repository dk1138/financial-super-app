import type { Metadata } from 'next';
import React from 'react';

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Local-first personal expense and budget tracker.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ExpensesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
