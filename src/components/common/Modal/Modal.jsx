import { useEffect } from 'react';
import styles from './Modal.module.css';

/**
 * Modal — accessible overlay dialog.
 * Closes on backdrop click or Escape key.
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Fermer">✕</button>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title} id="modal-title">{title}</h2>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
