import { useState } from 'react';
import { login }     from '../../../services/authService';
import { AUTH_ERRORS } from '../../../utils/constants';
import LizardLogo    from '../../../assets/icons/LizardLogo';
import Button        from '../../../components/common/Button';
import styles from './LoginScreen.module.css';

export default function LoginScreen() {
  const [email,   setEmail]   = useState('');
  const [pass,    setPass]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !pass) { setError('Remplis tous les champs.'); return; }
    setLoading(true); setError('');
    try {
      await login(email, pass);
    } catch (e) {
      setError(AUTH_ERRORS[e.code] || `Erreur: ${e.code}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <LizardLogo size={30} />
          </div>
          <span className={styles.logoText}>Lizard<em>Hub</em></span>
        </div>

        <p className={styles.sub}>Admin Control Panel</p>

        <div className={styles.field}>
          <label>Email</label>
          <input type="email" placeholder="admin@lizardhub.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="email" />
        </div>

        <div className={styles.field}>
          <label>Mot de passe</label>
          <input type="password" placeholder="••••••••"
            value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <Button variant="primary" size="lg" fullWidth disabled={loading} onClick={handleLogin}>
          {loading ? 'Connexion…' : 'Accéder au Dashboard'}
        </Button>

        {error && <p className={styles.error}>{error}</p>}
        <p className={styles.note}>Firebase Authentication — LizardHub v1.0</p>
      </div>
    </div>
  );
}
