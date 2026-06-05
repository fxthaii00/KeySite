import styles from './Panel.module.css';
import LizardLogo from '../../../assets/icons/LizardLogo';

export default function Panel({ title, action, children, className = '' }) {
  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.inner}>
        {title && (
          <div className={styles.head}>
            <div className={styles.headLeft}>
              <LizardLogo size={22} variant="purple" />
              <span className={styles.title}>{title}</span>
            </div>
            {action && <div className={styles.headAction}>{action}</div>}
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
