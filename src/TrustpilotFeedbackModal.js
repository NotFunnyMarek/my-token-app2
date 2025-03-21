import React, { useEffect } from 'react';
import './TrustpilotFeedbackModal.css';

const TrustpilotFeedbackModal = ({ isOpen, onClose }) => {
  useEffect(() => {
    // Když se modal otevře, zakážeme scroll
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    // Při unmountu nebo změně isOpen vrátíme původní hodnotu
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="tp-modal-overlay">
      <div className="tp-modal">
        <h2>Rate your experience</h2>
        <p>Share your experience with token creation:</p>

        {/* TrustBox widget - Review Collector */}
        <div
          className="trustpilot-widget"
          data-locale="en-US"
          data-template-id="56278e9abfbbba0bdcd568bc"
          data-businessunit-id="67d4125d2aa368cdff2358b0"
          data-style-height="52px"
          data-style-width="100%"
        >
          <a
            href="https://www.trustpilot.com/review/coincreate.org"
            target="_blank"
            rel="noopener noreferrer"
            className="trustpilot-button"
          >
            Review us on <span className="star">★</span> Trustpilot
          </a>
        </div>
        {/* End TrustBox widget */}

        <button className="tp-modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default TrustpilotFeedbackModal;
