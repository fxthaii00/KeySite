import { logout }   from '../../../services/authService';
import { useToast } from '../../../context/ToastContext';
import { addLog }   from '../../../services/logService';
import LizardLogo   from '../../../assets/icons/LizardLogo';
import styles from './Sidebar.module.css';

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { id: 'overview',  icon: '📊', label: 'Overview'    },
      { id: 'keys',      icon: '🔑', label: 'Keys'        },
      { id: 'users',     icon: '👥', label: 'Players'     },
    ],
  },
  {
    label: 'Tools',
    items: [
      { id: 'webhooks',      icon: '⚡', label: 'Webhooks'       },
      { id: 'hwids',         icon: '🛡️', label: 'HWIDs'          },
      { id: 'discord-bans',  icon: '🚫', label: 'Discord Bans'   },
      { id: 'discord-logs',  icon: '💬', label: 'Discord Logs'   },
    ],
  },
  {
    label: 'Settings',
    items: [
      { id: 'games',    icon: '🎮', label: 'Games'        },
      { id: 'accounts', icon: '⚙️', label: 'Admin Accounts' },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate, user, adminData, mobileOpen, onClose }) {
  const toast   = useToast();
  const name    = user?.displayName || user?.email?.split('@')[0] || '?';
  const email   = user?.email || '';
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await addLog('ACCOUNT_LOGOUT', { detail: `${email} déconnecté` }, email);
    await logout();
    toast('Déconnecté', 'info');
  };

  return (
    <>
      {mobileOpen && <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <LizardLogo size={24} />
          </div>
          <span className={styles.brand}>LizardHub</span>
        </div>

        {/* Nav sections */}
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            <div className={styles.sect}>{section.label}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                className={`${styles.navItem} ${activePage === item.id ? styles.navItemActive : ''}`}
                onClick={() => { onNavigate(item.id); onClose?.(); }}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initial}</div>
            <div style={{ minWidth: 0 }}>
              <div className={styles.userName}>{name}</div>
              <div className={styles.userEmail}>{email}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Se déconnecter
          </button>
        </div>
      </aside>
    </>
  );
}
