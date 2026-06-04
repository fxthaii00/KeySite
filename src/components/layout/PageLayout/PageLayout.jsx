import Navbar from '../Navbar';
import Footer from '../Footer';
import ParticleCanvas from '../../ui/ParticleCanvas';
import styles from './PageLayout.module.css';

export default function PageLayout({ children }) {
  return (
    <>
      <ParticleCanvas />
      <Navbar />
      <div className={styles.content}>
        {children}
      </div>
      <Footer />
    </>
  );
}
