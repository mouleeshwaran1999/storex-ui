import React, { useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

/**
 * ConfirmDialog — themed modal confirmation dialog.
 *
 * Props:
 *   isOpen        — boolean
 *   title         — string (default: "Are you sure?")
 *   message       — string | ReactNode
 *   confirmLabel  — string (default: "Confirm")
 *   cancelLabel   — string (default: "Cancel")
 *   tone          — "danger" | "primary" (default: "danger")
 *   busy          — boolean (disables buttons while confirming)
 *   onConfirm()   — called when user confirms
 *   onCancel()    — called when user cancels / clicks backdrop / Esc
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.();
      if (e.key === 'Enter' && !busy) onConfirm?.();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, busy, onConfirm, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === overlayRef.current && !busy) onCancel?.();
  };

  const confirmClass = tone === 'danger' ? styles.confirmDanger : styles.confirmPrimary;
  const iconClass = tone === 'danger' ? styles.iconDanger : styles.iconPrimary;

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleBackdropClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="cd-title">
        <div className={styles.body}>
          <div className={`${styles.iconWrap} ${iconClass}`}>
            {tone === 'danger' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>
          <div className={styles.text}>
            <h3 id="cd-title" className={styles.title}>{title}</h3>
            {message && <div className={styles.message}>{message}</div>}
          </div>
        </div>
        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
