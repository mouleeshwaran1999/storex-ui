import React, { useEffect } from 'react';
import styles from './SideDrawer.module.css';

/**
 * SideDrawer — slides in from the right.
 * Keeps the background page visible through a translucent overlay.
 *
 * Props:
 *   isOpen  — boolean
 *   onClose — () => void
 *   title   — string
 *   formId  — string  (links footer Save button to the form via HTML `form` attr)
 *   saving  — boolean (disables save button while submitting)
 *   children — form markup rendered inside the scrollable body
 */
export default function SideDrawer({ isOpen, onClose, title, formId, saving = false, children }) {
  // Lock body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className={styles.body}>
          {children}
        </div>

        {/* Footer with action buttons */}
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className={styles.saveBtn}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </aside>
    </>
  );
}
