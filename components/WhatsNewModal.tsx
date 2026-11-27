'use client';

import React, { useEffect } from 'react';
import { WHATS_NEW_RELEASES, ChangeCategory } from '../lib/whatsNew';
import { ENGINE_VERSION } from '../lib/financeEngine';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'fr';
}

const CATEGORY_STYLE: Record<
  ChangeCategory,
  { labelEn: string; labelFr: string; badgeClass: string; icon: string }
> = {
  new: {
    labelEn: 'New',
    labelFr: 'Nouveau',
    badgeClass: 'bg-success bg-opacity-10 text-success border border-success border-opacity-25',
    icon: 'bi-stars',
  },
  improved: {
    labelEn: 'Improved',
    labelFr: 'Amélioré',
    badgeClass: 'bg-info bg-opacity-10 text-info border border-info border-opacity-25',
    icon: 'bi-lightning-charge-fill',
  },
  fixed: {
    labelEn: 'Fixed',
    labelFr: 'Corrigé',
    badgeClass: 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25',
    icon: 'bi-wrench-adjustable',
  },
};

export default function WhatsNewModal({ isOpen, onClose, lang = 'en' }: WhatsNewModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isFr = lang === 'fr';
  const latest = WHATS_NEW_RELEASES[0];

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{ zIndex: 2050, backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      onClick={onClose}
    >
      <div
        className="rp-card border border-secondary rounded-4 shadow-lg w-100 d-flex flex-column overflow-hidden"
        style={{ maxWidth: '640px', maxHeight: '85vh', backgroundColor: 'var(--bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-bottom border-secondary border-opacity-50 d-flex align-items-center justify-content-between bg-primary bg-opacity-10">
          <div className="d-flex align-items-center gap-2.5">
            <div
              className="rounded-3 bg-primary bg-opacity-25 text-primary d-flex align-items-center justify-content-center"
              style={{ width: '36px', height: '36px' }}
            >
              <i className="bi bi-megaphone-fill fs-5"></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="mb-0 fw-bold text-main">
                  {isFr ? 'Nouveautés Planfolio' : "What's New in Planfolio"}
                </h5>
                <span
                  className="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-bold"
                  style={{ fontSize: '0.7rem' }}
                >
                  v{latest?.version || ENGINE_VERSION}
                </span>
              </div>
              {latest && (
                <div className="text-muted small" style={{ fontSize: '0.76rem' }}>
                  {latest.date} · {isFr ? latest.headlineFr : latest.headlineEn}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={onClose}
          ></button>
        </div>

        {/* Release Items */}
        <div className="p-4 overflow-auto d-flex flex-column gap-3">
          {WHATS_NEW_RELEASES.map((release) => (
            <div key={release.version} className="d-flex flex-column gap-2.5">
              {WHATS_NEW_RELEASES.length > 1 && (
                <div className="d-flex align-items-center gap-2 border-bottom border-secondary border-opacity-25 pb-1.5">
                  <span className="badge bg-secondary bg-opacity-25 text-main fw-bold">
                    v{release.version}
                  </span>
                  <span className="small text-muted fw-semibold">{release.date}</span>
                </div>
              )}
              {release.items.map((item, idx) => {
                const cat = CATEGORY_STYLE[item.category];
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-3 border border-secondary border-opacity-25 bg-input bg-opacity-25"
                  >
                    <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`badge rounded-pill px-2 py-0.5 fw-bold d-inline-flex align-items-center gap-1 ${cat.badgeClass}`}
                        style={{ fontSize: '0.67rem' }}
                      >
                        <i className={`bi ${cat.icon}`}></i>
                        {isFr ? cat.labelFr : cat.labelEn}
                      </span>
                      <span className="fw-bold text-main" style={{ fontSize: '0.88rem' }}>
                        {isFr ? item.titleFr : item.titleEn}
                      </span>
                    </div>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.8rem', lineHeight: 1.45 }}>
                      {isFr ? item.descFr : item.descEn}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-top border-secondary border-opacity-50 d-flex align-items-center justify-content-between bg-input bg-opacity-25">
          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
            {isFr
              ? `Cliquez sur v${ENGINE_VERSION} dans l'en-tête pour rouvrir ce journal.`
              : `Click v${ENGINE_VERSION} in the header anytime to revisit this changelog.`}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-primary rounded-pill px-4 fw-bold shadow-sm"
            onClick={onClose}
          >
            {isFr ? 'Compris' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
