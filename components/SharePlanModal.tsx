'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { encodePlanToHash } from '../lib/sharePlan';

interface SharePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planData: any;
  onCopied?: (msg: string) => void;
}

export default function SharePlanModal({
  isOpen,
  onClose,
  planData,
  onCopied,
}: SharePlanModalProps) {
  const [anonymize, setAnonymize] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const generate = async () => {
      try {
        const hashPayload = await encodePlanToHash(planData, { anonymize });
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.planfolio.ca';
        if (active) {
          setShareUrl(`${origin}/planner#plan=${hashPayload}`);
          setCopied(false);
        }
      } catch (err) {
        console.error('Failed to build share link:', err);
      }
    };
    generate();
    return () => {
      active = false;
    };
  }, [isOpen, planData, anonymize]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (onCopied) onCopied('Shareable plan link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select text manually
    }
  };

  return createPortal(
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 10050,
        padding: '1rem',
      }}
    >
      <div className="position-fixed top-0 start-0 w-100 h-100" onClick={onClose} />
      <div className="modal-dialog modal-dialog-centered position-relative" style={{ maxWidth: '580px', zIndex: 10060 }}>
        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-bottom border-secondary px-4 py-3 surface-card">
            <h6 className="modal-title fw-bold d-flex align-items-center mb-0 text-uppercase ls-1">
              <i className="bi bi-share-fill text-primary me-2"></i> Share Plan Link
            </h6>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body p-4 d-flex flex-column gap-3">
            <p className="small text-muted mb-0">
              Your plan is compressed directly into the URL hash — <strong>nothing is uploaded to any server</strong>. Ideal for sharing on Reddit (<code>r/PersonalFinanceCanada</code>) or with a partner.
            </p>

            <div className="p-3 bg-input border border-secondary rounded-4">
              <div className="form-check form-switch mb-0 d-flex align-items-center justify-content-between px-0">
                <div>
                  <label className="form-check-label small fw-bold text-main cursor-pointer d-block" htmlFor="shareAnonToggle">
                    Anonymize names &amp; strip DataBank history
                  </label>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Replaces property, dependent, and custom asset names with generic labels.
                  </span>
                </div>
                <input
                  className="form-check-input ms-3 mt-0 cursor-pointer"
                  type="checkbox"
                  id="shareAnonToggle"
                  checked={anonymize}
                  onChange={(e) => setAnonymize(e.target.checked)}
                />
              </div>
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-bold text-muted mb-0">Shareable URL</label>
                {shareUrl && (
                  <span className="badge bg-secondary bg-opacity-25 text-muted rounded-pill" style={{ fontSize: '0.68rem' }}>
                    {shareUrl.length.toLocaleString()} chars
                  </span>
                )}
              </div>
              <textarea
                className="form-control bg-input border-secondary text-main small font-monospace"
                rows={3}
                readOnly
                value={shareUrl}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          <div className="modal-footer border-top border-secondary px-4 py-3 bg-input d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm" onClick={handleCopy} disabled={!shareUrl}>
              <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-2`}></i>
              {copied ? 'Copied!' : 'Copy Share Link'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
