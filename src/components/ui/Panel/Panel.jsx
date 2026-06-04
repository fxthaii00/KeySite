import styles from './Panel.module.css';
import LizardLogo from '../../../assets/icons/LizardLogo';
import RobuxLogo from '../../../assets/icons/RobuxLogo.png';
import DonLogo from '../../../assets/icons/DonLogo.png';

const PANEL_ICONS = {
  robux: <img src={RobuxLogo} alt="Robux" className={styles.panelIcon} />,
  donation: <img src={DonLogo} alt="Donation" className={styles.panelIcon} />,
  donator: <img src={DonLogo} alt="Donation" className={styles.panelIcon} />,
};

export default function Panel({ title, icon, variant, action, children, className = '' }) {
  const resolvedIcon = icon || PANEL_ICONS[variant] ||
    (title?.toLowerCase().includes('robux') ? PANEL_ICONS.robux :
     title?.toLowerCase().includes('donator') ? PANEL_ICONS.donator :
     undefined);

  return (
    <div className={`${styles.panel} ${className}`}>
      <div className={styles.inner}>
        {title && (
          <div className={styles.head}>
            <div className={styles.headLeft}>
              {resolvedIcon || <LizardLogo size={22} variant="purple" />}
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
