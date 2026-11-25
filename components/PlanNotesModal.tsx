'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFinanceData, useFinanceActions } from '../lib/FinanceContext';
import { useTranslation } from '../lib/LanguageContext';

interface PlanNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
}

export default function PlanNotesModal({ isOpen, onClose, planName }: PlanNotesModalProps) {
  const data = useFinanceData() as any;
  const { updateNotes } = useFinanceActions();
  const { lang } = useTranslation();
  const isFr = lang === 'fr';

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const notesVal = typeof data?.notes === 'string' ? data.notes : '';

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
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        zIndex: 10050,
        padding: '1rem',
      }}
    >
      <div className="position-fixed top-0 start-0 w-100 h-100" onClick={onClose} />
      <div className="modal-dialog modal-dialog-centered position-relative" style={{ maxWidth: '620px', zIndex: 10060 }}>
        <div className="modal-content surface-card border border-secondary shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-bottom border-secondary px-4 py-3 surface-card">
            <h6 className="modal-title fw-bold d-flex align-items-center mb-0 text-uppercase ls-1">
              <i className="bi bi-journal-text text-info me-2"></i>
              {isFr ? `Notes du plan — ${planName}` : `Plan Notes — ${planName}`}
            </h6>
            <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
          </div>

          <div className="modal-body p-4 d-flex flex-column gap-2">
            <p className="small text-muted mb-1">
              {isFr
                ? 'Consignez vos hypothèses (ex. base de calcul de la pension PD, objectifs de voyage, dons prévus). Ces notes sont sauvegardées avec chaque scénario et incluses dans vos exports.'
                : 'Document your assumptions (e.g., DB pension basis, travel goals, planned gifts). Notes are saved per scenario and included in JSON & AI summary exports.'}
            </p>
            <textarea
              className="form-control bg-input border-secondary text-main small"
              rows={9}
              placeholder={
                isFr
                  ? 'Ex. : Pension PD estimée pour retraite à 60 ans selon le relevé 2026. Objectif de don de 50 000 $ en 2032...'
                  : 'e.g., DB pension quote based on retiring at 60 (2026 statement). Planning $50k down-payment gift in 2032...'
              }
              value={notesVal}
              onChange={(e) => updateNotes(e.target.value)}
              autoFocus
            />
            <div className="d-flex justify-content-between align-items-center text-muted" style={{ fontSize: '0.72rem' }}>
              <span>
                <i className="bi bi-check-circle-fill text-success me-1"></i>
                {isFr ? 'Synchronisé avec le scénario actif' : 'Synced with active scenario'}
              </span>
              <span>{notesVal.length.toLocaleString()} {isFr ? 'caractères' : 'chars'}</span>
            </div>
          </div>

          <div className="modal-footer border-top border-secondary px-4 py-3 bg-input d-flex justify-content-end gap-2">
            <button type="button" className="btn btn-primary btn-sm rounded-pill px-4 fw-bold" onClick={onClose}>
              {isFr ? 'Terminé' : 'Done'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
