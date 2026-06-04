import { useState } from 'react';
import styles from './KeyBox.module.css';

export default function KeyBox({ value, onCopy }) {
  const [flash, setFlash] = useState(false);
  const filled = Boolean(value && value !== 'LSRD - XXXX - XXXX - XXXX');

  const handleClick = () => {
    if (!filled) return;
    onCopy?.();
    setFlash(true);
    setTimeout(() => setFlash(false), 280);
  };

  return (
    <button
      className={`${styles.box} ${filled ? styles.filled : ''} ${flash ? styles.flash : ''}`}
      onClick={handleClick}
      aria-label={filled ? 'Copier la key' : 'Aucune key générée'}
      disabled={!filled}
    >
      <span className={styles.text}>
        {value || 'LSRD - XXXX - XXXX - XXXX'}
      </span>
      <div className={styles.flashOverlay} aria-hidden="true" />
    </button>
  );
}
