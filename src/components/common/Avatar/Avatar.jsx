import styles from './Avatar.module.css';

export default function Avatar({ src, name = '?', size = 36 }) {
  const initial = (name || '?').charAt(0).toUpperCase();

  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.4 }}>
      {src
        ? <img src={src} alt={name} onError={e => { e.target.style.display = 'none'; }} />
        : <span>{initial}</span>
      }
    </div>
  );
}
