'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { encodePlanToHash } from '../lib/sharePlan';
import { buildAiReviewPrompt } from '../lib/aiSummary';
import { useFinanceResults, useFinancePlanScore } from '../lib/FinanceContext';
import { useTranslation } from '../lib/LanguageContext';

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
  const results = useFinanceResults();
  const planScore = useFinancePlanScore();
  const { lang } = useTranslation();
  const isFr = lang === 'fr';

  const [mode, setMode] = useState<'link' | 'ai'>('link');
  const [anonymize, setAnonymize] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || mode !== 'link') return;
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
  }, [isOpen, planData, anonymize, mode]);

  const aiSummaryText = useMemo(() => {
    if (!isOpen || mode !== 'ai') return '';
    return buildAiReviewPrompt(planData, results, planScore, { anonymize, lang });
  }, [isOpen, mode, planData, results, planScore, anonymize, lang]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const activeText = mode === 'link' ? shareUrl : aiSummaryText;

  const handleCopy = async () => {
    if (!activeText) return;
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      if (onCopied) {
        onCopied(
          mode === 'link'
            ? (isFr ? 'Lien de partage copié !' : 'Shareable plan link copied to clipboard!')
            : (isFr ? 'Résumé IA copié ! Collez-le dans ChatGPT, Claude ou Gemini.' : 'AI Review Prompt copied! Paste into ChatGPT, Claude, or Gemini.')
        );
      }
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
        zIndex: 10050,
        padding: '1rem',
      }}
    >
      <div className="position-fixed top-0 start-0 w-100 h-100" onClick={onClose} />
      <div className="modal-dialog modal-dialog-centered position-relative" style={{ maxWidth: '620px', zIndex: 10060 }}>
        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-bottom border-secondary px-4 py-3 surface-card">
            <h6 className="modal-title fw-bold d-flex align-items-center mb-0 text-uppercase ls-1">
              <i className="bi bi-share-fill text-primary me-2"></i>
              {isFr ? 'Partager ou exporter pour IA' : 'Share Plan & AI Review Export'}
            </h6>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body p-4 d-flex flex-column gap-3">
            {/* Mode Switcher */}
            <div className="d-flex gap-2 p-1 rounded-pill bg-input border border-secondary">
              <button
                type="button"
                className={`btn btn-sm rounded-pill flex-grow-1 fw-bold border-0 ${mode === 'link' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
                onClick={() => { setMode('link'); setCopied(false); }}
              >
                <i className="bi bi-link-45deg me-1"></i>
                {isFr ? 'Lien de partage (URL)' : 'Shareable URL'}
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-pill flex-grow-1 fw-bold border-0 ${mode === 'ai' ? 'bg-primary text-white shadow-sm' : 'text-muted bg-transparent'}`}
                onClick={() => { setMode('ai'); setCopied(false); }}
              >
                <i className="bi bi-stars me-1"></i>
                {isFr ? 'Résumé pour IA (Markdown)' : 'Copy Summary for AI'}
              </button>
            </div>

            <p className="small text-muted mb-0">
              {mode === 'link'
                ? (isFr
                    ? 'Votre plan est compressé directement dans le lien — rien n’est envoyé à un serveur. Idéal pour Reddit ou un conjoint.'
                    : 'Your plan is compressed directly into the URL hash — nothing is uploaded to any server. Ideal for sharing on Reddit (r/PersonalFinanceCanada) or with a partner.')
                : (isFr
                    ? 'Copiez un résumé Markdown propre et anonymisé de votre plan pour obtenir un deuxième avis dans ChatGPT, Claude ou Gemini.'
                    : 'Copy a clean, anonymized Markdown summary of your numbers & projections to get a second-opinion critique from ChatGPT, Claude, or Gemini.')}
            </p>

            <div className="p-3 bg-input border border-secondary rounded-4">
              <div className="form-check form-switch mb-0 d-flex align-items-center justify-content-between px-0">
                <div>
                  <label className="form-check-label small fw-bold text-main cursor-pointer d-block" htmlFor="shareAnonToggle">
                    {isFr ? 'Anonymiser les noms et l’historique' : 'Anonymize names & strip Data Bank history'}
                  </label>
                  <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {isFr
                      ? 'Remplace les prénoms par des libellés génériques.'
                      : 'Replaces personal, property, and custom asset names with generic labels.'}
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
                <label className="form-label small fw-bold text-muted mb-0">
                  {mode === 'link' ? (isFr ? 'Lien généré' : 'Shareable URL') : (isFr ? 'Invite Markdown prête à coller' : 'Ready-to-Paste AI Prompt')}
                </label>
                {activeText && (
                  <span className="badge bg-secondary bg-opacity-25 text-muted rounded-pill" style={{ fontSize: '0.68rem' }}>
                    {activeText.length.toLocaleString()} chars
                  </span>
                )}
              </div>
              <textarea
                className="form-control bg-input border-secondary text-main small font-monospace"
                rows={mode === 'link' ? 3 : 8}
                readOnly
                value={activeText}
                onFocus={(e) => e.target.select()}
              />
            </div>
          </div>

          <div className="modal-footer border-top border-secondary px-4 py-3 bg-input d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold" onClick={onClose}>
              {isFr ? 'Fermer' : 'Close'}
            </button>
            <button type="button" className="btn btn-primary btn-sm rounded-pill px-4 fw-bold shadow-sm" onClick={handleCopy} disabled={!activeText}>
              <i className={`bi ${copied ? 'bi-check-lg' : 'bi-clipboard'} me-2`}></i>
              {copied
                ? (isFr ? 'Copié !' : 'Copied!')
                : mode === 'link'
                ? (isFr ? 'Copier le lien' : 'Copy Share Link')
                : (isFr ? 'Copier le résumé IA' : 'Copy AI Summary')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
