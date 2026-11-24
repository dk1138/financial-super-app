'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4"
      style={{ backgroundColor: 'var(--bg-body, #0f172a)', color: 'var(--text-main, #f8fafc)' }}
    >
      <div
        className="card border border-secondary rounded-4 shadow-lg p-4 p-md-5 text-center"
        style={{ maxWidth: '480px', width: '100%', backgroundColor: 'var(--bg-card, #1e293b)' }}
      >
        <div className="mb-3">
          <i className="bi bi-exclamation-octagon-fill text-danger" style={{ fontSize: '2.5rem' }}></i>
        </div>
        <h4 className="fw-bold mb-2">Something went wrong</h4>
        <p className="text-muted small mb-4">
          An unexpected error occurred while rendering this view. Your saved local plans are safe in your browser.
        </p>
        <div className="d-flex flex-wrap gap-2 justify-content-center">
          <button
            type="button"
            className="btn btn-primary fw-bold rounded-pill px-4"
            onClick={() => reset()}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
          <Link href="/" className="btn btn-outline-secondary fw-bold rounded-pill px-4 text-decoration-none">
            <i className="bi bi-house-door me-2"></i>Home
          </Link>
        </div>
      </div>
    </div>
  );
}
