import styles from './StatCard.module.css';

/**
 * StatCard — dashboard stats tile.
 * colorVariant: 'purple' | 'green' | 'red' | 'cyan'
 */
export default function StatCard({ value, label, colorVariant = 'purple' }) {
  return (
    <div className={`${styles.card} ${styles[`card--${colorVariant}`]}`}>
      <div className={styles.value}>{value ?? '—'}</div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}
