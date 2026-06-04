import { useState } from 'react';
import { useAuth }   from '../../context/AuthContext';
import { useGames }  from '../../hooks/useGames';
import { useKeys }   from '../../hooks/useKeys';
import { useBans }   from '../../hooks/useBans';
import { useLogs }   from '../../hooks/useLogs';
import { useUsers }  from '../../hooks/useUsers';

import LoginScreen from './LoginScreen/LoginScreen';
import Sidebar     from './Sidebar/Sidebar';
import {
  DashboardSection,
  GamesSection,
  KeysSection,
  UsersSection,
  BansSection,
  LogsSection,
  AccountsSection,
} from './Sections/Sections';

import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user, adminData, loading: authLoading } = useAuth();
  const { games } = useGames();
  const { keys  } = useKeys();
  const { bans  } = useBans();
  const { logs  } = useLogs();
  const { users } = useUsers();

  const [activePage,  setActivePage]  = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [banPrefill,  setBanPrefill]  = useState({ userId: '', hwid: '' });

  // Expose nav for quick-action buttons in DashboardSection
  window.dashNav = setActivePage;

  if (authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} aria-label="Chargement…" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const handleQuickBan = (userId, hwid) => {
    setBanPrefill({ userId, hwid });
    setActivePage('bans');
  };

  const renderSection = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardSection keys={keys} bans={bans} logs={logs} games={games} users={users} />;
      case 'games':     return <GamesSection     games={games} user={user} />;
      case 'keys':      return <KeysSection      keys={keys}  games={games} user={user} />;
      case 'users':     return <UsersSection     users={users} onQuickBan={handleQuickBan} />;
      case 'bans':      return <BansSection      bans={bans}  user={user} prefillUserId={banPrefill.userId} prefillHwid={banPrefill.hwid} />;
      case 'logs':      return <LogsSection      logs={logs}  user={user} />;
      case 'accounts':  return <AccountsSection  user={user} />;
      default:          return <DashboardSection keys={keys} bans={bans} logs={logs} games={games} users={users} />;
    }
  };

  return (
    <div className={styles.app}>
      {/* Mobile top bar */}
      <div className={styles.mobileTopBar}>
        <button
          className={styles.burgerBtn}
          onClick={() => setSidebarOpen(v => !v)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <span className={styles.mobileBrand}>Lizard<em>Hub</em></span>
        <span className={styles.mobilePage}>{activePage}</span>
      </div>

      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        user={user}
        adminData={adminData}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={styles.main}>
        {renderSection()}
      </main>
    </div>
  );
}
