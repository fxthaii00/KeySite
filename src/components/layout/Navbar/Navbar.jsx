import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import styles from './Navbar.module.css';
import LizardLogo  from '../../../assets/icons/LizardLogo';
import DiscordIcon from '../../../assets/icons/DiscordIcon';
import { NAV_LINKS } from '../../../utils/constants';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav}>
        {/* Brand */}
        <Link to="/" className={styles.logo} onClick={() => setMenuOpen(false)}>
          <LizardLogo size={30} />
          <span className={styles.brand}>Lizard <em>Hub</em></span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          {NAV_LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive ? `${styles.link} ${styles.linkActive}` : styles.link
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side */}
        <div className={styles.right}>
          <a className={styles.discord} href="#" target="_blank" rel="noreferrer">
            <DiscordIcon size={14} />
            Join Discord
          </a>
          <Link to="/dashboard" className={styles.admin}>
            <span className={styles.adminDot} />
          </Link>
        </div>

        {/* Burger (mobile) */}
        <button
          className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={styles.accentLine} aria-hidden="true" />

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive ? `${styles.mobileLink} ${styles.mobileLinkActive}` : styles.mobileLink
              }
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <a className={styles.mobileDiscord} href="#" target="_blank" rel="noreferrer">
            <DiscordIcon size={14} /> Join Discord
          </a>
          <Link to="/dashboard" className={styles.mobileAdminLink} onClick={() => setMenuOpen(false)}>
            Admin Panel
          </Link>
        </div>
      )}
    </>
  );
}
