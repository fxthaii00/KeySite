import { Link } from 'react-router-dom';
import styles from './Footer.module.css';
import LizardLogo  from '../../../assets/icons/LizardLogo';
import DiscordIcon from '../../../assets/icons/DiscordIcon';
import { NAV_LINKS } from '../../../utils/constants';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.accentLine} aria-hidden="true" />
      <div className={styles.main}>
        <div className={styles.left}>
          <LizardLogo size={26} />
          <div className={styles.sep} />
          <span className={styles.tagline}>Simple Key Generation System</span>
        </div>
        <nav className={styles.links} aria-label="Footer navigation">
          {NAV_LINKS.map(l => (
            <Link key={l.to} to={l.to} className={styles.link}>{l.label}</Link>
          ))}
        </nav>
        <a className={styles.discordLink} href="#" target="_blank" rel="noreferrer" aria-label="Discord">
          <DiscordIcon size={20} />
        </a>
      </div>
      <div className={styles.copy}>2026 Lizard Hub | All rights reserved</div>
    </footer>
  );
}
