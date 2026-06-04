import { Link }     from 'react-router-dom';
import PageLayout   from '../../components/layout/PageLayout';
import LizardLogo   from '../../assets/icons/LizardLogo';
import Button       from '../../components/common/Button';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <PageLayout>
      <main className={styles.main}>
        <LizardLogo size={60} variant="muted" />
        <h1 className={styles.code}>404</h1>
        <p className={styles.msg}>Page introuvable</p>
        <p className={styles.sub}>La page que tu cherches n'existe pas ou a été déplacée.</p>
        <Link to="/"><Button variant="primary" size="lg">← Retour à l'accueil</Button></Link>
      </main>
    </PageLayout>
  );
}
