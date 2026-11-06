'use client';

import React, { useState, useEffect } from 'react';
import FeedbackModal from './FeedbackModal';

export default function FloatingFeedback() {
  const [isOpen, setIsOpen] = useState(false);

  // Listens for triggers from SplashScreen or other links
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('openFeedbackModal', handleOpen);
    return () => window.removeEventListener('openFeedbackModal', handleOpen);
  }, []);

  return (
    <>
      {/* Floating Button on Bottom Right */}
      <button
        type="button"
        className="btn btn-primary rounded-pill shadow-lg position-fixed d-flex align-items-center gap-2 px-3 py-2 transition-all"
        style={{
          bottom: '24px',
          right: '24px',
          zIndex: 1040,
          boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
        }}
        onClick={() => setIsOpen(true)}
        title="Send Feedback or Bug Report"
      >
        <i className="bi bi-chat-heart-fill fs-6"></i>
        <span className="small fw-bold d-none d-sm-inline">Feedback</span>
      </button>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}