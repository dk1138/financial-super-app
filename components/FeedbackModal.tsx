'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackCategory = 'bug' | 'idea' | 'calculation' | 'general';

interface CategoryOption {
  id: FeedbackCategory;
  label: string;
  icon: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'bug', label: 'Bug', icon: 'bi-bug-fill' },
  { id: 'idea', label: 'Feature', icon: 'bi-lightbulb-fill' },
  { id: 'calculation', label: 'Calculation', icon: 'bi-calculator-fill' },
  { id: 'general', label: 'General', icon: 'bi-chat-dots-fill' },
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('bug');
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [screenshot, setScreenshot] = useState<{ name: string; base64: string; preview: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Clipboard Paste (Ctrl+V / Cmd+V)
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processImageFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const base64Data = result.split(',')[1] || result;
        setScreenshot({
          name: file.name || 'clipboard-screenshot.png',
          base64: base64Data,
          preview: result,
        });
        setErrorMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setErrorMessage('Please enter your feedback before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const metadata = {
      category,
      url: typeof window !== 'undefined' ? window.location.href : '',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} (${window.devicePixelRatio}x)` : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      language: typeof navigator !== 'undefined' ? navigator.language : 'en',
      timestamp: new Date().toLocaleString('en-CA', { timeZoneName: 'short' }),
    };

    try {
      const res = await fetch('/api/auth/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: feedback.trim(),
          email: email.trim() ? email.trim() : undefined,
          metadata,
          screenshot: screenshot ? {
            filename: screenshot.name,
            content: screenshot.base64,
          } : undefined,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok || resData.error) {
        throw new Error(resData.error || 'Failed to send feedback. Please try again.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFeedback('');
        setEmail('');
        setScreenshot(null);
        setCategory('bug');
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Error submitting feedback via Resend:', err);
      setErrorMessage(err.message || 'Failed to send feedback. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex={-1} 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.65)', 
        backdropFilter: 'blur(4px)', 
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div 
        className="modal-dialog modal-dialog-centered modal-md"
        style={{
          width: '100%',
          maxWidth: '560px',
          margin: 'auto',
          position: 'relative',
          zIndex: 10001,
        }}
      >
        <div className="modal-content surface-card border border-secondary shadow-2xl rounded-4 overflow-hidden">
          
          {/* HEADER */}
          <div className="modal-header border-bottom border-secondary px-4 py-3 d-flex align-items-center justify-content-between">
            <h6 className="modal-title fw-bold text-main d-flex align-items-center m-0" style={{ letterSpacing: '0.5px' }}>
              <i className="bi bi-chat-heart-fill text-primary me-2 fs-5"></i>
              SEND FEEDBACK
            </h6>
            <button 
              type="button" 
              className="btn-close shadow-none" 
              onClick={onClose}
              disabled={isSubmitting}
            ></button>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              
              {submitSuccess ? (
                <div className="text-center py-4 fade-in">
                  <div 
                    className="d-inline-flex align-items-center justify-content-center text-success mb-3 rounded-circle shadow-sm"
                    style={{ width: '56px', height: '56px', backgroundColor: 'rgba(25, 135, 84, 0.15)' }}
                  >
                    <i className="bi bi-check-circle-fill fs-2"></i>
                  </div>
                  <h5 className="fw-bold text-main mb-1">Thank You!</h5>
                  <p className="text-muted small mb-0">
                    Your feedback and diagnostic details were sent directly to Donald.
                  </p>
                </div>
              ) : (
                <>
                  {/* 1. CATEGORY PILL SELECTOR (Strictly 1 Row) */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-main mb-1.5 d-block">
                      Category
                    </label>
                    <div className="d-flex align-items-center gap-2 w-100" style={{ flexWrap: 'nowrap' }}>
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`btn btn-sm rounded-pill px-2 py-1.5 fw-semibold d-flex align-items-center justify-content-center gap-1.5 flex-fill transition-all text-nowrap ${
                              isSelected 
                                ? 'btn-primary text-white shadow-sm' 
                                : 'btn-outline-secondary border-secondary bg-input text-muted hover-opacity-100'
                            }`}
                            style={{ 
                              fontSize: '0.78rem',
                              whiteSpace: 'nowrap',
                              flex: '1 1 0',
                              minWidth: 0,
                            }}
                          >
                            <i className={`bi ${cat.icon} ${isSelected ? 'text-white' : 'opacity-75'}`}></i>
                            <span>{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. FEEDBACK TEXTAREA */}
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <label className="form-label small fw-bold text-main m-0">
                        {category === 'bug' && 'What went wrong?'}
                        {category === 'idea' && 'What feature would you love to see?'}
                        {category === 'calculation' && 'What numbers or tax calculation look off?'}
                        {category === 'general' && 'Your Thoughts or Feedback'}
                        <span className="text-danger ms-1">*</span>
                      </label>
                      <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                        Paste screenshot (Ctrl+V)
                      </span>
                    </div>

                    <textarea
                      className="form-control bg-input border-secondary text-main rounded-3 shadow-none"
                      rows={4}
                      placeholder={
                        category === 'bug'
                          ? 'Describe what happened, or steps to reproduce...'
                          : category === 'idea'
                          ? 'Describe the feature, tool, or option you want added...'
                          : category === 'calculation'
                          ? 'Explain the expected vs actual result, province, or accounts...'
                          : 'Found a bug? Have a feature request? Let us know...'
                      }
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                      autoFocus
                      style={{ fontSize: '0.9rem', lineHeight: '1.5' }}
                    ></textarea>
                  </div>

                  {/* 3. CLIPBOARD SCREENSHOT PREVIEW / ATTACH BUTTON */}
                  <div className="mb-3">
                    {screenshot ? (
                      <div className="p-2 rounded-3 border border-secondary bg-input d-flex align-items-center justify-content-between gap-2 fade-in">
                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                          <img 
                            src={screenshot.preview} 
                            alt="Screenshot Preview" 
                            className="rounded border border-secondary"
                            style={{ width: '48px', height: '36px', objectFit: 'cover' }}
                          />
                          <div className="text-truncate">
                            <div className="small fw-semibold text-main text-truncate" style={{ fontSize: '0.8rem' }}>
                              {screenshot.name}
                            </div>
                            <div className="text-success small" style={{ fontSize: '0.72rem' }}>
                              <i className="bi bi-check2 me-1"></i>Attached via clipboard / file
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-danger p-1 text-decoration-none"
                          onClick={() => setScreenshot(null)}
                          title="Remove screenshot"
                        >
                          <i className="bi bi-trash3 fs-6"></i>
                        </button>
                      </div>
                    ) : (
                      <div className="d-flex align-items-center justify-content-between">
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-primary p-0 text-decoration-none d-inline-flex align-items-center gap-1.5"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <i className="bi bi-paperclip fs-6"></i> Attach screenshot or image
                        </button>
                        <span className="text-muted small" style={{ fontSize: '0.72rem' }}>
                          or press <kbd style={{ fontSize: '0.7rem' }}>Ctrl+V</kbd> to paste
                        </span>
                      </div>
                    )}

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="d-none" 
                    />
                  </div>

                  {/* 4. OPTIONAL EMAIL FIELD */}
                  <div className="mb-2">
                    <div className="d-flex align-items-center justify-content-between mb-1.5">
                      <label className="form-label small fw-bold text-main m-0">
                        Email Address
                      </label>
                      <span className="badge bg-secondary bg-opacity-10 text-muted border border-secondary border-opacity-25 rounded-pill px-2 py-0.5" style={{ fontSize: '0.72rem' }}>
                        Optional
                      </span>
                    </div>

                    <input
                      type="email"
                      className="form-control form-control-sm bg-input border-secondary text-main rounded-3 shadow-none px-3 py-2"
                      placeholder="name@example.com (optional)"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ fontSize: '0.88rem' }}
                    />
                    
                    <div className="form-text small text-muted mt-1.5 d-flex align-items-start gap-1.5" style={{ fontSize: '0.78rem' }}>
                      <i className="bi bi-info-circle text-info mt-0.5"></i>
                      <span>
                        If you would like a reply, leave your email above. Otherwise, feel free to submit anonymously.
                      </span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="alert alert-danger py-2 px-3 small rounded-3 mt-3 mb-0">
                      <i className="bi bi-exclamation-triangle-fill me-1.5"></i> {errorMessage}
                    </div>
                  )}
                </>
              )}

            </div>

            {!submitSuccess && (
              <div className="modal-footer border-top border-secondary px-4 py-3 bg-input d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1.5 fw-semibold"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm rounded-pill px-4 py-1.5 fw-bold d-flex align-items-center shadow-sm"
                  disabled={isSubmitting || !feedback.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill me-2"></i> Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}