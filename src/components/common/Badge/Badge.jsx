import styles from './Badge.module.css';

/**
 * Badge — inline status/label pill.
 * variants: 'active'|'inactive'|'banned'|'expired'|'lifetime'|'beta'|
 *           'online'|'maint'|'offline'|'admin'|'mod'|'default'
 */
export default function Badge({ children, variant = 'default', className = '' }) {
  return (
    <span className={`${styles.badge} ${styles[`badge--${variant}`]} ${className}`}>
      {children}
    </span>
  );
}
