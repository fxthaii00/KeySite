import PageLayout from '../../components/layout/PageLayout';
import LizardLogo  from '../../assets/icons/LizardLogo';
import styles from './AboutPage.module.css';

const FEATURES = [
  { icon: '⊞', title: 'Key Generation',  desc: 'Generate unique keys for your Roblox scripts in seconds, with per-game support and expiry control.' },
  { icon: '◈', title: 'Multi-Game',      desc: 'Support for multiple games simultaneously. Each game has its own key pool and status management.' },
  { icon: '⊘', title: 'HWID Binding',    desc: 'Keys are automatically bound to the first machine that uses them, preventing sharing.' },
  { icon: '▣', title: 'Admin Dashboard', desc: 'Full admin panel with real-time stats, key management, ban system and detailed logs.' },
  { icon: '≡', title: 'Audit Logs',      desc: 'Every action is logged with full context — who did what, when, and for which game.' },
  { icon: '★', title: 'Team Access',     desc: 'Invite admins and moderators with granular role-based access to your dashboard.' },
];

export default function AboutPage() {
  return (
    <PageLayout>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroIcon}>
            <LizardLogo size={56} />
          </div>
          <h1 className={styles.heroTitle}>About <em>Lizard Hub</em></h1>
          <p className={styles.heroSub}>
            A professional key generation system built for Roblox script developers.
            Fast, secure, and built to scale.
          </p>
        </section>

        <section className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>Features</h2>
          <div className={styles.featuresGrid}>
            {FEATURES.map(f => (
              <div key={f.title} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.stackSection}>
          <h2 className={styles.sectionTitle}>Tech Stack</h2>
          <div className={styles.stackGrid}>
            {['React', 'Firebase', 'Firestore', 'Node.js', 'Express', 'Vite'].map(t => (
              <div key={t} className={styles.stackPill}>{t}</div>
            ))}
          </div>
        </section>
      </main>
    </PageLayout>
  );
}
