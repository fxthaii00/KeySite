import { useState } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import GameTile   from '../../components/ui/GameTile';
import KeyBox     from '../../components/ui/KeyBox';
import Button     from '../../components/common/Button';
import { useGames }   from '../../hooks/useGames';
import { useKeygen }  from '../../hooks/useKeygen';
import { useToast }   from '../../context/ToastContext';
import { STATUS_COLOR } from '../../utils/constants';
import styles from './KeygenPage.module.css';

export default function KeygenPage() {
  const { games, loading } = useGames();
  const { generatedKey, cooldown, isGenerating, generate, copyKey } = useKeygen();
  const toast = useToast();

  const [selectedGame, setSelectedGame] = useState(null);

  const handleSelectGame = game => {
    setSelectedGame(game);
  };

  const handleGenerate = async () => {
    if (!selectedGame) { toast('Sélectionne un jeu.', 'error'); return; }
    if (selectedGame.status === 'offline')  { toast('Ce jeu est hors ligne.',    'error'); return; }
    if (selectedGame.status === 'maint')    { toast('Ce jeu est en maintenance.','warning'); return; }
    await generate(selectedGame);
    toast('Key générée ! Clique pour copier.', 'success');
  };

  const handleCopy = () => {
    copyKey();
    toast('Copié dans le presse-papiers !', 'info');
  };

  const selectedColor = selectedGame
    ? STATUS_COLOR[selectedGame.status] || '#ef4444'
    : 'var(--color-muted)';

  return (
    <PageLayout>
      <main className={styles.main}>
        <div className={styles.card}>

          {/* Title */}
          <h1 className={styles.title}>Lizard &nbsp;<em>Gen Key</em></h1>

          {/* Status bar */}
          <div className={styles.statusBar}>
            <div className={`${styles.statusItem} ${styles.on}`}>
              <span className={`${styles.dot} ${styles.dotOn}`} />
              Online
            </div>
            <div className={`${styles.statusItem} ${styles.mn}`}>
              <span className={`${styles.dot} ${styles.dotMn}`} />
              Maintenance
            </div>
            <div className={`${styles.statusItem} ${styles.off}`}>
              <span className={`${styles.dot} ${styles.dotOff}`} />
              Offline
            </div>
          </div>

          {/* Games container */}
          <div className={styles.gamesContainer}>
            <div className={styles.gamesGrid}>
              {loading ? (
                <p className={styles.loading}>Chargement des jeux…</p>
              ) : games.length === 0 ? (
                <p className={styles.loading}>Aucun jeu disponible</p>
              ) : (
                games.map(g => (
                  <GameTile
                    key={g.id}
                    game={g}
                    isSelected={selectedGame?.id === g.id}
                    onSelect={handleSelectGame}
                  />
                ))
              )}
            </div>

            {/* Animated divider */}
            <div className={styles.divider} aria-hidden="true" />

            {/* Selected game bar */}
            <div className={styles.selBar}>
              <span
                className={styles.selDot}
                style={{ background: selectedColor }}
              />
              {selectedGame?.imageUrl || selectedGame?.id ? (
                <div className={styles.selThumb}>
                  <img
                    src={
                      selectedGame.imageUrl ||
                      `https://cdn.cloudflare.steamstatic.com/steam/apps/${
                        { cs2:'730', gtav:'271590', val:'2357570', apex:'1172470', cod:'1938090' }[selectedGame.id] || '0'
                      }/header.jpg`
                    }
                    alt={selectedGame.name}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              ) : (
                <div className={styles.selThumb}><span>◈</span></div>
              )}
              <span className={styles.selName}>
                {selectedGame ? selectedGame.name.toUpperCase() : 'Sélectionne un jeu'}
              </span>
            </div>
          </div>

          {/* Key type row */}
          <div className={styles.inputWrap}>
            <div className={styles.inputRow}>
              <span className={styles.inputLabel}>Unique Key</span>
            </div>
            <div className={styles.badge1h}>1 HEURE</div>
          </div>

          {/* Generate button */}
          <Button
            variant="genkey"
            fullWidth
            disabled={cooldown > 0 || isGenerating}
            onClick={handleGenerate}
            className={styles.genBtn}
          >
            {isGenerating ? 'Génération…' : cooldown > 0 ? `Wait ${cooldown}s` : 'Gen Key'}
          </Button>

          {/* Key display */}
          <KeyBox value={generatedKey} onCopy={handleCopy} />
        </div>
      </main>
    </PageLayout>
  );
}
