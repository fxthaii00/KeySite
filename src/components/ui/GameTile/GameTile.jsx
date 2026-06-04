import styles from './GameTile.module.css';
import { STEAM_IMAGES, STATUS_CLASS } from '../../../utils/constants';

export default function GameTile({ game, isSelected, onSelect }) {
  const img = game.imageUrl || STEAM_IMAGES[game.id] || '';
  const sc  = STATUS_CLASS[game.status] || 'offline';
  const lbl = game.name.length > 6
    ? game.name.slice(0, 4).toUpperCase()
    : game.name.toUpperCase();

  return (
    <button
      className={`${styles.tile} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(game)}
      aria-pressed={isSelected}
      aria-label={`${game.name} — ${game.status}`}
    >
      <div className={styles.thumb}>
        {img ? (
          <img
            src={img}
            alt={game.name}
            loading="lazy"
            onError={e => { e.target.style.display = 'none'; }}
          />
        ) : (
          <span className={styles.noImg}>◈</span>
        )}
      </div>
      <div className={`${styles.foot} ${styles[sc]}`}>
        <div className={styles.dot} />
        {lbl}
      </div>
    </button>
  );
}
