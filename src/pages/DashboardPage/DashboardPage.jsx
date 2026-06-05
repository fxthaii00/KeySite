import { useState } from 'react';
import { useAuth }  from '../../context/AuthContext';
import { useGames } from '../../hooks/useGames';
import { useKeys }  from '../../hooks/useKeys';
import { useBans }  from '../../hooks/useBans';
import { useLogs }  from '../../hooks/useLogs';
import { useUsers } from '../../hooks/useUsers';

import LoginScreen from './LoginScreen/LoginScreen';
import Sidebar     from './Sidebar/Sidebar';
import {
  OverviewSection,
  KeysSection,
  UsersSection,
  WebhooksSection,
  HwidsSection,
  DiscordBansSection,
  DiscordLogsSection,
  GamesSection,
  AccountsSection,
} from './Sections/Sections';

import styles from './DashboardPage.module.css';

const PAGE_LABELS = {
  overview:      'Overview',
  keys:          'Keys',
  users:         'Players',
  webhooks:      'Webhooks',
  hwids:         'HWID Blacklist',
  'discord-bans':'Discord Bans',
  'discord-logs':'Discord Logs',
  games:         'Games',
  accounts:      'Admin Accounts',
};

export default function DashboardPage() {
  const { user, adminData, loading: authLoading } = useAuth();
  const { games } = useGames();
  const { keys  } = useKeys();
  const { bans  } = useBans();
  const { logs  } = useLogs();
  const { users } = useUsers();

  const [activePage,  setActivePage]  = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  window.dashNav = setActivePage;

  if (authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  const renderSection = () => {
    switch (activePage) {
      case 'overview':      return <OverviewSection     keys={keys} bans={bans} logs={logs} users={users} onNavigate={setActivePage} />;
      case 'keys':          return <KeysSection         keys={keys} games={games} user={user} />;
      case 'users':         return <UsersSection        users={users} onNavigate={setActivePage} />;
      case 'webhooks':      return <WebhooksSection     />;
      case 'hwids':         return <HwidsSection        bans={bans} user={user} />;
      case 'discord-bans':  return <DiscordBansSection  bans={bans} user={user} />;
      case 'discord-logs':  return <DiscordLogsSection  logs={logs} />;
      case 'games':         return <GamesSection        games={games} user={user} />;
      case 'accounts':      return <AccountsSection     user={user} />;
      default:              return <OverviewSection     keys={keys} bans={bans} logs={logs} users={users} onNavigate={setActivePage} />;
    }
  };

  return (
    <div className={styles.app}>
      {/* Mobile top bar */}
      <div className={styles.mobileTopBar}>
        <button className={styles.burgerBtn} onClick={() => setSidebarOpen(v => !v)}>☰</button>
        <span className={styles.mobileBrand}>LizardHub</span>
        <span className={styles.mobilePage}>{PAGE_LABELS[activePage]}</span>
      </div>

      {/* Desktop top bar */}
      <div className={styles.topBar}>
        <span className={styles.breadcrumb}>
          Dashboard
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>{PAGE_LABELS[activePage]}</span>
        </span>
        <div className={styles.topBarRight}>
          <a className={styles.topBarDiscord} href="#" target="_blank" rel="noreferrer">Discord</a>
        </div>
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
