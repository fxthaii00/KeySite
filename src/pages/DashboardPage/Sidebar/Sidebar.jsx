import { logout }    from '../../../services/authService';
import { useToast }  from '../../../context/ToastContext';
import { addLog }    from '../../../services/logService';
import LizardLogo    from '../../../assets/icons/LizardLogo';
import styles from './Sidebar.module.css';

const NAV_SECTIONS = [
  { label: "Vue d'ensemble", items: [{ id:'dashboard', icon:'▣', label:'Dashboard' }] },
  { label: 'Gestion', items: [
    { id:'games',  icon:'◈', label:'Jeux'    },
    { id:'keys',   icon:'⊞', label:'Keys'    },
    { id:'users',  icon:'◎', label:'Joueurs' },
    { id:'bans',   icon:'⊘', label:'Bans'    },
  ]},
  { label: 'Système', items: [
    { id:'logs',     icon:'≡', label:'Logs détaillés' },
    { id:'accounts', icon:'★', label:'Comptes Admin'  },
  ]},
];

export default function Sidebar({ activePage, onNavigate, user, adminData, mobileOpen, onClose }) {
  const toast   = useToast();
  const name    = user?.displayName || user?.email?.split('@')[0] || '?';
  const initial = name.charAt(0).toUpperCase();
  const roleText = adminData?.role === 'mod' ? 'Modérateur' : 'Admin';

  const handleLogout = async () => {
    await addLog('ACCOUNT_LOGOUT', { detail: `${user?.email} s'est déconnecté` }, user?.email);
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
          <div>
            <div className={styles.brand}>Lizard<em>Hub</em></div>
            <div className={styles.ver}>v1.0 — Admin</div>
          </div>
        </div>

        {/* Nav */}
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
            <div>
              <div className={styles.userName}>{name}</div>
              <div className={styles.userRole}>
                <span className={styles.stDot} />
                <span>{roleText}</span>
              </div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>Se déconnecter</button>
        </div>
      </aside>
    </>
  );
}
