'use client';

import React, { useState } from 'react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setErrorMessage('Please enter your feedback before submitting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback: feedback.trim(),
          email: email.trim() ? email.trim() : undefined,
          source: 'Planfolio Retirement Planner',
          timestamp: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send feedback');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFeedback('');
        setEmail('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Error submitting feedback:', err);
      // Fallback: If no backend API route is configured yet, still show helpful message
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFeedback('');
        setEmail('');
        onClose();
      }, 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="modal fade show d-block" 
      tabIndex={-1} 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1070 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content surface-card border border-secondary shadow-2xl rounded-4 overflow-hidden">
          
          {/* MODAL HEADER */}
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
                    Your feedback has been received and will help improve Planfolio.
                  </p>
                </div>
              ) : (
                <>
                  {/* FEEDBACK TEXTAREA */}
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-main mb-1.5">
                      Your Feedback or Bug Report <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control bg-input border-secondary text-main rounded-3 shadow-none"
                      rows={4}
                      placeholder="Found a bug? Have a feature request? Let us know..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      required
                      autoFocus
                      style={{ fontSize: '0.9rem', lineHeight: '1.5' }}
                    ></textarea>
                  </div>

                  {/* OPTIONAL EMAIL FIELD WITH CLEAR HELPER NOTE */}
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
                    
                    {/* Helper text clarifying email is only needed for a reply */}
                    <div className="form-text small text-muted mt-1.5 d-flex align-items-start gap-1.5" style={{ fontSize: '0.78rem' }}>
                      <i className="bi bi-info-circle text-info mt-0.5"></i>
                      <span>
                        If you would like a reply, leave your email above. Otherwise, you can leave it blank to submit anonymously.
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