import { useState } from 'react';
import Badge      from '../../../components/common/Badge';
import Button     from '../../../components/common/Button';
import StatCard   from '../../../components/ui/StatCard';
import LogEntry   from '../../../components/ui/LogEntry';
import Modal      from '../../../components/common/Modal';
import { keyStatus, keyTypeBadge } from '../../../utils/keyUtils';
import { fmtDate, fmtDateTime }    from '../../../utils/dateUtils';
import { STATUS_LABEL, STATUS_CLASS, KEY_TYPES, STEAM_IMAGES } from '../../../utils/constants';
import { useKeyLaunches, useFailedAttempts, useAnomalies, useGameStats } from '../../../hooks/useTracking';
import {
  addGame, updateGameStatus, deleteGame as deleteGameSvc,
} from '../../../services/gameService';
import {
  createKey, blacklistKey, deleteKey, extendKey,
} from '../../../services/keyService';
import { createBan, removeBan } from '../../../services/banService';
import { addLog }                from '../../../services/logService';
import { createAdminAccount }    from '../../../services/authService';
import { fetchAdmins, toggleAdminRole, deleteAdmin } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';
import styles from './Sections.module.css';

/* ══════════ DASHBOARD ══════════ */
export function DashboardSection({ keys, bans, logs, games, users }) {
  const now    = Date.now();
  const active = keys.filter(k => k.active && !k.blacklisted && (!k.expiresAt || now < k.expiresAt)).length;
  
  // Statistiques par jeu
  const keysByGame = games.map(g => ({
    game: g.name,
    total: keys.filter(k => k.game === g.id).length,
    active: keys.filter(k => k.game === g.id && k.active && !k.blacklisted && (!k.expiresAt || now < k.expiresAt)).length
  }));
  
  // Executeurs les plus utilisés
  const executorStats = users.reduce((acc, u) => {
    if (u.executor) {
      const existing = acc.find(e => e.name === u.executor);
      if (existing) existing.count++;
      else acc.push({ name: u.executor, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 5);
  
  // Utilisateurs actifs
  const activeUsers = users.filter(u => u.lastSeen && Date.now() - u.lastSeen < 86400000).length;

  return (
    <div>
      <div className={styles.statsGrid}>
        <StatCard value={keys.length} label="🔑 Total Keys"   colorVariant="purple" />
        <StatCard value={active}      label="✓ Keys Actives"  colorVariant="green"  />
        <StatCard value={users.length} label="Users" colorVariant="cyan"   />
        <StatCard value={bans.length} label="Bans" colorVariant="red"    />
      </div>

      <div className={styles.twoCol}>
        {/* Keys par jeu */}
        <div className={styles.panel}>
          <div className={styles.panelHdr}><span className={styles.panelTitle}>Keys par Jeu</span></div>
          <div className={styles.panelBody}>
            {keysByGame.length === 0
              ? <div className={styles.empty}>Aucun jeu configuré</div>
              : <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    {keysByGame.map(kg => (
                      <tr key={kg.game} style={{ borderBottom: '1px solid rgba(80,10,160,0.12)', padding: '8px 0' }}>
                        <td style={{ padding: '8px 0' }}><strong>{kg.game}</strong></td>
                        <td style={{ textAlign: 'right', padding: '8px 0' }}><span style={{ color: '#9070c0' }}>{kg.active}/{kg.total}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>

        {/* Executeurs populaires & Actions rapides */}
        <div>
          <div className={styles.panel}>
            <div className={styles.panelHdr}><span className={styles.panelTitle}>Top Exécuteurs</span></div>
            <div className={styles.panelBody}>
              {executorStats.length === 0
                ? <div className={styles.empty}>Aucune donnée</div>
                : <table style={{ width: '100%', fontSize: '13px' }}>
                    <tbody>
                      {executorStats.map((e, i) => (
                        <tr key={e.name} style={{ borderBottom: '1px solid rgba(80,10,160,0.12)', padding: '8px 0' }}>
                          <td style={{ padding: '8px 0' }}>{i + 1}. <strong>{e.name}</strong></td>
                          <td style={{ textAlign: 'right', padding: '8px 0', color: '#c090ff' }}>{e.count}x</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              }
            </div>
          </div>

          {/* Actions rapides */}
          <div className={styles.panel}>
            <div className={styles.panelHdr}><span className={styles.panelTitle}>Actions Rapides</span></div>
            <div className={`${styles.panelBody} ${styles.actionsCol}`}>
              <Button variant="primary" fullWidth onClick={() => window.dashNav?.('games')}>Gérer les Jeux</Button>
              <Button variant="outline" fullWidth onClick={() => window.dashNav?.('keys')}>Voir toutes les Keys</Button>
              <Button variant="outline" fullWidth onClick={() => window.dashNav?.('accounts')}>Gérer les comptes</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent logs */}
      <div className={styles.panel}>
        <div className={styles.panelHdr}><span className={styles.panelTitle}>Activité Récente</span></div>
        <div className={styles.panelBody}>
          {logs.slice(0, 6).length === 0
            ? <div className={styles.empty}>Aucune activité</div>
            : logs.slice(0, 6).map(l => <LogEntry key={l.id} log={l} />)
          }
        </div>
      </div>
    </div>
  );
}

/* ══════════ GAMES ══════════ */
export function GamesSection({ games, user }) {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ id:'', name:'', status:'online', imageUrl:'' });

  const handleAdd = async () => {
    const id = form.id.toLowerCase().replace(/[^a-z0-9_]/g,'');
    if (!id || !form.name) { toast('ID et Nom obligatoires', 'error'); return; }
    if (games.find(g => g.id === id)) { toast(`L'ID "${id}" existe déjà`, 'error'); return; }
    try {
      await addGame({ id, name: form.name, status: form.status, imageUrl: form.imageUrl });
      await addLog('GAME_ADDED', { game: id, gameName: form.name, detail: `Jeu "${form.name}" ajouté` }, user?.email);
      toast(`✅ Jeu "${form.name}" ajouté !`, 'success');
      setModal(false);
      setForm({ id:'', name:'', status:'online', imageUrl:'' });
    } catch(e) { toast(e.message, 'error'); }
  };

  const handleStatus = async (id, status) => {
    const gm = games.find(g => g.id === id);
    await updateGameStatus(id, status);
    await addLog('GAME_STATUS', { game: id, detail: `Jeu passé en ${STATUS_LABEL[status]}` }, user?.email);
    toast(`${gm?.name}: ${STATUS_LABEL[status]}`, 'success');
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await deleteGameSvc(id);
    await addLog('GAME_DELETED', { game: id, gameName: name }, user?.email);
    toast(`Jeu "${name}" supprimé`, 'error');
  };

  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>Jeux</h2>
        <Button variant="primary" onClick={() => setModal(true)}>+ Ajouter un Jeu</Button>
      </div>

      <div className={styles.gamesGrid}>
        {games.length === 0
          ? <div className={styles.empty}>Aucun jeu</div>
          : games.map(gm => {
            const img = gm.imageUrl || STEAM_IMAGES[gm.id] || '';
            return (
              <div key={gm.id} className={styles.gameCard}>
                {img
                  ? <img className={styles.gameCardImg} src={img} alt={gm.name} />
                  : <div className={styles.gameCardNImg}>◈</div>
                }
                <div className={styles.gameCardBody}>
                  <div className={styles.gameCardName}>{gm.name}</div>
                  <div className={styles.gameCardId}>id: {gm.id}</div>
                  <div style={{ marginBottom: 8 }}>
                    <Badge variant={STATUS_CLASS[gm.status] || 'offline'}>{STATUS_LABEL[gm.status] || gm.status}</Badge>
                  </div>
                  <div className={styles.gameCardActions}>
                    <button className={`${styles.stPill} ${styles.stPillOn}`}  onClick={() => handleStatus(gm.id,'online')}>🟢 On</button>
                    <button className={`${styles.stPill} ${styles.stPillMn}`}  onClick={() => handleStatus(gm.id,'maint')}>🟡 Mnt</button>
                    <button className={`${styles.stPill} ${styles.stPillOff}`} onClick={() => handleStatus(gm.id,'offline')}>🔴 Off</button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(gm.id, gm.name)}>✕</Button>
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={<>◈ Ajouter un <span>Jeu</span></>}
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleAdd}>Ajouter le Jeu</Button>
        </>}
      >
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>ID unique *</label>
            <input value={form.id} onChange={e => setForm(p => ({...p, id: e.target.value}))} placeholder="ex: brm5" />
          </div>
          <div className={styles.formGroup}>
            <label>Nom affiché *</label>
            <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="ex: BRM5" />
          </div>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 14 }}>
          <label>Statut initial</label>
          <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
            <option value="online">🟢 Online</option>
            <option value="maint">🟡 Maintenance</option>
            <option value="offline">🔴 Offline</option>
          </select>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 14 }}>
          <label>URL Image (optionnel)</label>
          <input value={form.imageUrl} onChange={e => setForm(p => ({...p, imageUrl: e.target.value}))} placeholder="https://…" />
        </div>
      </Modal>
    </div>
  );
}

/* ══════════ KEYS ══════════ */
export function KeysSection({ keys, games, user }) {
  const toast = useToast();
  const [gameFilter, setGameFilter] = useState('');
  const [search,     setSearch]     = useState('');
  const [genModal,   setGenModal]   = useState(false);
  const [extModal,   setExtModal]   = useState(false);
  const [genForm,    setGenForm]    = useState({ game:'', type:'lifetime', note:'' });
  const [extData,    setExtData]    = useState({ key:'', game:'', days:7 });
  const [genResult,  setGenResult]  = useState(null);
  const [loading,    setLoading]    = useState(false);

  const filtered = keys.filter(k =>
    (!gameFilter || k.game === gameFilter) &&
    (!search || k.key?.toLowerCase().includes(search) || k.gameName?.toLowerCase().includes(search))
  );

  const handleGenerate = async () => {
    if (!genForm.game) { toast('Sélectionne un jeu', 'error'); return; }
    const gm = games.find(g => g.id === genForm.game);
    if (!gm) { toast('Jeu introuvable', 'error'); return; }
    setLoading(true);
    try {
      const { key } = await createKey({ game: genForm.game, gameName: gm.name, type: genForm.type, note: genForm.note, createdBy: user?.email });
      await addLog('KEY_GENERATED', { key, game: genForm.game, gameName: gm.name, keyType: genForm.type, detail: `Key ${key} générée` }, user?.email);
      setGenResult(key);
      toast('✅ Key générée !', 'success');
    } catch(e) { toast(e.message, 'error'); }
    setLoading(false);
  };

  const handleBlacklist = async (key, game) => {
    if (!confirm(`Blacklister "${key}" ?`)) return;
    await blacklistKey(key, game);
    await addLog('KEY_BLACKLISTED', { key, game, detail: `Key ${key} blacklistée` }, user?.email);
    toast('Key blacklistée', 'error');
  };

  const handleDelete = async (key, game) => {
    if (!confirm(`Supprimer "${key}" ?`)) return;
    await deleteKey(key, game);
    await addLog('KEY_DELETED', { key, game, detail: `Key ${key} supprimée` }, user?.email);
    toast('Key supprimée', 'error');
  };

  const openExtend = (key, game) => { setExtData({ key, game, days: 7 }); setExtModal(true); };
  const handleExtend = async () => {
    try {
      const newExp = await extendKey(extData.key, extData.game, extData.days);
      await addLog('KEY_EXTENDED', { key: extData.key, days: extData.days, detail: `Key prolongée de ${extData.days}j` }, user?.email);
      setExtModal(false);
      toast(`✅ +${extData.days} jours ajoutés`, 'success');
    } catch(e) { toast(e.message, 'error'); }
  };

  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>Keys</h2>
        <div className={styles.filters}>
          <select value={gameFilter} onChange={e => setGameFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">Tous les jeux</option>
            {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value.toLowerCase())} placeholder="Rechercher…" className={styles.filterInput} />
          <Button variant="primary" onClick={() => { setGenResult(null); setGenModal(true); }}>+ Générer</Button>
        </div>
      </div>

      <div className={styles.panel}>
        <div className={styles.tblWrap}>
          <table className={styles.tbl}>
            <thead><tr>
              <th>Key</th><th>Jeu</th><th>Type</th><th>Statut</th>
              <th>HWID</th><th>Expiration</th><th>Créée</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} className={styles.empty}>Aucune key</td></tr>
                : filtered.map(k => {
                  const s = keyStatus(k);
                  return (
                    <tr key={k.id}>
                      <td><span className={styles.keyCode}>{k.key}</span></td>
                      <td><span className={styles.gameBadge}>{k.gameName || k.game || '?'}</span></td>
                      <td><Badge variant={keyTypeBadge(k.type)}>{k.type}</Badge></td>
                      <td><Badge variant={s.cls}>{s.label}</Badge></td>
                      <td className={styles.hwidCell}>{k.hwid ? k.hwid.slice(0,14)+'…' : '—'}</td>
                      <td className={styles.dateCell}>{fmtDate(k.expiresAt)}</td>
                      <td className={styles.dateCell}>{k.createdAt ? fmtDate(k.createdAt) : '—'}</td>
                      <td>
                        <div className={styles.actions}>
                          <Button variant="outline" size="sm" onClick={() => openExtend(k.key, k.game || '')}>+j</Button>
                          <Button variant="danger"  size="sm" onClick={() => handleBlacklist(k.key, k.game || '')}>🚫</Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(k.key, k.game || '')}>✕</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Gen modal */}
      <Modal isOpen={genModal} onClose={() => setGenModal(false)}
        title={<>⊞ Générer une <span>Key</span></>}
        footer={<>
          <Button variant="outline" onClick={() => setGenModal(false)}>Fermer</Button>
          <Button variant="primary" disabled={loading} onClick={handleGenerate}>{loading ? 'Génération…' : 'Générer'}</Button>
        </>}
      >
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Jeu *</label>
            <select value={genForm.game} onChange={e => setGenForm(p => ({...p, game: e.target.value}))}>
              <option value="">— Sélectionne —</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Durée</label>
            <select value={genForm.type} onChange={e => setGenForm(p => ({...p, type: e.target.value}))}>
              {KEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.formGroup} style={{ marginBottom: 14 }}>
          <label>Note (optionnel)</label>
          <input value={genForm.note} onChange={e => setGenForm(p => ({...p, note: e.target.value}))} placeholder="ex: Giveaway Discord" />
        </div>
        {genResult && (
          <div className={styles.genResult} onClick={() => { navigator.clipboard.writeText(genResult); toast('📋 Copié !', 'info'); }}>
            <div className={styles.genResultLabel}>✅ Key générée — clique pour copier</div>
            <div className={styles.genResultKey}>{genResult}</div>
          </div>
        )}
      </Modal>

      {/* Extend modal */}
      <Modal isOpen={extModal} onClose={() => setExtModal(false)}
        title={<>+ Prolonger la <span>Key</span></>}
        footer={<>
          <Button variant="outline" onClick={() => setExtModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleExtend}>Prolonger</Button>
        </>}
      >
        <div className={styles.extKeyDisplay}>Key : <span>{extData.key}</span></div>
        <div className={styles.formGroup}>
          <label>Jours à ajouter</label>
          <input type="number" min="1" value={extData.days} onChange={e => setExtData(p => ({...p, days: parseInt(e.target.value)||1}))} />
        </div>
      </Modal>
    </div>
  );
}

/* ══════════ USERS ══════════ */
export function UsersSection({ users, onQuickBan }) {
  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>Joueurs Roblox</h2>
      </div>
      <div className={styles.panel}>
        <div className={styles.tblWrap}>
          <table className={styles.tbl}>
            <thead><tr>
              <th>Username</th><th>User ID</th><th>HWID</th>
              <th>Executor</th><th>Jeu</th><th>Key</th><th>Dernière co.</th><th>Action</th>
            </tr></thead>
            <tbody>
              {users.length === 0
                ? <tr><td colSpan={8} className={styles.empty}>Aucun joueur enregistré</td></tr>
                : users.map(u => (
                  <tr key={u.id}>
                    <td className={styles.bold}>{u.username || '—'}</td>
                    <td className={styles.mono}>{u.userId || '—'}</td>
                    <td className={styles.monoSm}>{u.hwid ? u.hwid.slice(0,14)+'…' : '—'}</td>
                    <td>{u.executor || '—'}</td>
                    <td><span className={styles.gameBadge}>{u.gameName || u.game || '—'}</span></td>
                    <td><span className={styles.keyCode}>{u.key || '—'}</span></td>
                    <td className={styles.dateCell}>{u.lastSeen ? fmtDateTime(u.lastSeen) : '—'}</td>
                    <td><Button variant="danger" size="sm" onClick={() => onQuickBan(u.userId||'', u.hwid||'')}>Ban</Button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ══════════ BANS ══════════ */
export function BansSection({ bans, user, prefillUserId = '', prefillHwid = '' }) {
  const toast  = useToast();
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ userId:'', hwid:'', key:'', reason:'', duration:0 });

  const openBan = (uid='', hwid='') => {
    setForm({ userId: uid, hwid, key:'', reason:'', duration:0 });
    setModal(true);
  };

  const handleBan = async () => {
    if (!form.reason) { toast('Raison obligatoire', 'error'); return; }
    if (!form.userId && !form.hwid && !form.key) { toast('Renseigne au moins un champ', 'error'); return; }
    try {
      await createBan({ ...form, bannedBy: user?.email });
      await addLog('BAN_CREATED', { userId: form.userId, reason: form.reason, detail: `Ban créé — Raison: ${form.reason}` }, user?.email);
      toast('Utilisateur banni', 'error');
      setModal(false);
    } catch(e) { toast(e.message, 'error'); }
  };

  const handleUnban = async (id, userId) => {
    await removeBan(id);
    await addLog('BAN_REMOVED', { banId: id, userId: userId || null, detail: `Ban ${id} levé` }, user?.email);
    toast('✅ Ban levé', 'success');
  };

  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>Bans</h2>
        <Button variant="danger" onClick={() => openBan()}>+ Nouveau Ban</Button>
      </div>

      <div className={styles.panel}>
        <div className={styles.tblWrap}>
          <table className={styles.tbl}>
            <thead><tr>
              <th>User ID</th><th>HWID</th><th>Key</th>
              <th>Raison</th><th>Banni par</th><th>Expiration</th><th>Action</th>
            </tr></thead>
            <tbody>
              {bans.length === 0
                ? <tr><td colSpan={7} className={styles.empty}>Aucun ban actif</td></tr>
                : bans.map(b => (
                  <tr key={b.id}>
                    <td>{b.userId || '—'}</td>
                    <td className={styles.monoSm}>{b.hwid ? b.hwid.slice(0,14)+'…' : '—'}</td>
                    <td>{b.key ? <span className={styles.keyCode}>{b.key}</span> : '—'}</td>
                    <td style={{ color: 'var(--color-red)' }}>{b.reason}</td>
                    <td className={styles.dateCell}>{b.bannedBy || '—'}</td>
                    <td className={styles.dateCell}>{b.expiresAt ? fmtDate(b.expiresAt) : '∞ Permanent'}</td>
                    <td><Button variant="success" size="sm" onClick={() => handleUnban(b.id, b.userId)}>Lever</Button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={<>⊘ Nouveau <span>Ban</span></>}
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleBan}>🔨 Bannir</Button>
        </>}
      >
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>User ID Roblox</label><input value={form.userId} onChange={e => setForm(p=>({...p,userId:e.target.value}))} placeholder="Optionnel"/></div>
          <div className={styles.formGroup}><label>HWID</label><input value={form.hwid} onChange={e => setForm(p=>({...p,hwid:e.target.value}))} placeholder="Optionnel"/></div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Key</label><input value={form.key} onChange={e => setForm(p=>({...p,key:e.target.value}))} placeholder="Optionnel"/></div>
          <div className={styles.formGroup}><label>Durée (jours, 0=permanent)</label><input type="number" min="0" value={form.duration} onChange={e => setForm(p=>({...p,duration:parseInt(e.target.value)||0}))}/></div>
        </div>
        <div className={styles.formGroup} style={{marginBottom:14}}>
          <label>Raison *</label>
          <input value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))} placeholder="ex: Chargeback, Triche…"/>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════ LOGS ══════════ */
export function LogsSection({ logs, user }) {
  const toast = useToast();
  const [actionFilter, setActionFilter] = useState('');
  const [gameFilter,   setGameFilter]   = useState('');

  const filtered = logs.filter(l =>
    (!actionFilter || l.action?.includes(actionFilter)) &&
    (!gameFilter   || l.game === gameFilter || l.gameName?.toLowerCase() === gameFilter.toLowerCase())
  );

  const handleClear = async () => {
    if (!confirm('Vider tous les logs ?')) return;
    const { clearAllLogs } = await import('../../../services/logService');
    await clearAllLogs();
    toast('Logs vidés', 'info');
  };

  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>Logs Détaillés</h2>
        <div className={styles.filters}>
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className={styles.filterSelect}>
            <option value="">Tous</option>
            <option value="VERIFY_SUCCESS">✅ Connexions réussies</option>
            <option value="VERIFY_FAIL">❌ Connexions échouées</option>
            <option value="KEY_GENERATED">🔑 Keys générées</option>
            <option value="KEY_BLACKLISTED">🚫 Keys blacklistées</option>
            <option value="BAN">🔨 Bans</option>
          </select>
          <Button variant="danger" size="sm" onClick={handleClear}>🗑 Vider</Button>
        </div>
      </div>
      <div className={styles.panel}>
        {filtered.length === 0
          ? <div className={styles.empty}>Aucun log correspondant</div>
          : filtered.map(l => <LogEntry key={l.id} log={l} />)
        }
      </div>
    </div>
  );
}

/* ══════════ ACCOUNTS ══════════ */
export function AccountsSection({ user }) {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form,  setForm]  = useState({ name:'', email:'', password:'', role:'admin' });
  const [loading, setLoading] = useState(false);

  const load = () => fetchAdmins().then(setAccounts);

  useState(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast('Tous les champs obligatoires', 'error'); return; }
    if (form.password.length < 6) { toast('Mot de passe min. 6 caractères', 'error'); return; }
    setLoading(true);
    try {
      await createAdminAccount({ email: form.email, password: form.password, displayName: form.name, role: form.role, createdBy: user?.email });
      await addLog('ACCOUNT_CREATED', { detail: `Compte "${form.name}" créé` }, user?.email);
      toast(`✅ Compte "${form.name}" créé !`, 'success');
      setModal(false);
      load();
    } catch(e) {
      const ERRS = { 'auth/email-already-in-use':'Email déjà utilisé', 'auth/weak-password':'Mot de passe trop faible' };
      toast(ERRS[e.code] || e.message, 'error');
    }
    setLoading(false);
  };

  const handleToggle = async (uid, role, name) => {
    const newRole = await toggleAdminRole(uid, role);
    toast(`Rôle changé → ${newRole}`, 'success');
    load();
  };

  const handleDelete = async (uid, name) => {
    if (!confirm(`Supprimer "${name}" ?`)) return;
    await deleteAdmin(uid);
    await addLog('ACCOUNT_DELETED', { detail: `Compte "${name}" supprimé` }, user?.email);
    toast('Compte supprimé', 'error');
    load();
  };

  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>★ <span>Comptes Admin</span></h2>
        <Button variant="primary" onClick={() => setModal(true)}>+ Inviter un Admin</Button>
      </div>

      <div className={styles.infoBox}>
        Les comptes admin ont accès au dashboard.<br/>
        ⚠️ L'utilisateur pourra se connecter avec cet email et mot de passe.
      </div>

      <div className={styles.accountsGrid}>
        {accounts.map(a => {
          const isMe   = a.uid === user?.uid;
          const initials = (a.displayName || a.email || '?').charAt(0).toUpperCase();
          return (
            <div key={a.uid} className={styles.accountCard}>
              <div className={styles.accountAvatar} style={{ background: a.role==='mod' ? '#1060a0' : 'var(--color-purple)' }}>
                {initials}
              </div>
              <div className={styles.accountInfo}>
                <div className={styles.accountName}>{a.displayName || 'Sans nom'} {isMe && <span className={styles.meTxt}>(toi)</span>}</div>
                <div className={styles.accountEmail}>{a.email}</div>
                <div className={styles.accountMeta}>
                  <Badge variant={a.role === 'mod' ? 'mod' : 'admin'}>{a.role === 'mod' ? 'Modérateur' : 'Admin'}</Badge>
                </div>
              </div>
              {!isMe && (
                <div className={styles.accountActions}>
                  <Button variant="danger"  size="sm" onClick={() => handleDelete(a.uid, a.displayName || a.email)}>✕</Button>
                  <Button variant="outline" size="sm" onClick={() => handleToggle(a.uid, a.role, a.displayName)}>⇄</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)}
        title={<>★ Inviter un <span>Admin</span></>}
        footer={<>
          <Button variant="outline" onClick={() => setModal(false)}>Annuler</Button>
          <Button variant="primary" disabled={loading} onClick={handleCreate}>{loading ? 'Création…' : 'Créer le compte'}</Button>
        </>}
      >
        <div className={styles.infoBox} style={{marginBottom:16}}>Crée un compte Firebase Authentication pour cette personne.</div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Nom d'affichage *</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="ex: Moderateur1"/></div>
          <div className={styles.formGroup}><label>Rôle</label>
            <select value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
              <option value="admin">Admin (accès total)</option>
              <option value="mod">Modérateur (lecture seule)</option>
            </select>
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="mod@example.com"/></div>
          <div className={styles.formGroup}><label>Mot de passe *</label><input type="text" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} placeholder="Min. 6 caractères"/></div>
        </div>
      </Modal>
    </div>
  );
}

/* ══════════ TRACKING ══════════ */
export function TrackingSection() {
  const { launches, loading: launchesLoading } = useKeyLaunches();
  const { attempts, loading: attemptsLoading } = useFailedAttempts();
  const { anomalies, loading: anomaliesLoading } = useAnomalies();
  const { gameStats, loading: gameStatsLoading } = useGameStats();

  const last24h = launches.filter(l => Date.now() - l.timestamp < 86400000).length;
  const last7d = launches.filter(l => Date.now() - l.timestamp < 604800000).length;
  const failed24h = attempts.filter(a => Date.now() - a.timestamp < 86400000).length;
  const topIps = launches.reduce((acc, l) => {
    const ip = l.clientIp;
    const existing = acc.find(x => x.ip === ip);
    if (existing) existing.count++;
    else acc.push({ ip, count: 1, country: l.country, city: l.city });
    return acc;
  }, []).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div>
      <div className={styles.pageHdr}>
        <h2 className={styles.pageTitle}>Advanced Tracking</h2>
      </div>

      {/* Stats rapides */}
      <div className={styles.statsGrid}>
        <StatCard value={last24h}        label="Lancements (24h)"   colorVariant="purple" />
        <StatCard value={last7d}         label="Lancements (7j)"    colorVariant="cyan"   />
        <StatCard value={failed24h}      label="Tentatives échouées (24h)" colorVariant="red"    />
        <StatCard value={anomalies.length} label="Anomalies détectées"  colorVariant="red"    />
      </div>

      <div className={styles.twoCol}>
        {/* Top IPs */}
        <div className={styles.panel}>
          <div className={styles.panelHdr}><span className={styles.panelTitle}>Top IPs</span></div>
          <div className={styles.panelBody}>
            {topIps.length === 0
              ? <div className={styles.empty}>Aucune donnée</div>
              : <table style={{ width: '100%', fontSize: '12px' }}>
                  <tbody>
                    {topIps.map((entry, i) => (
                      <tr key={entry.ip} style={{ borderBottom: '1px solid rgba(80,10,160,0.12)', padding: '6px 0' }}>
                        <td style={{ padding: '6px 0' }}>{i + 1}. <span style={{ fontFamily: 'monospace' }}>{entry.ip}</span></td>
                        <td style={{ fontSize: '11px', color: '#888' }}>{entry.city}, {entry.country}</td>
                        <td style={{ textAlign: 'right', color: '#c090ff' }}>{entry.count}x</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>

        {/* Top Games */}
        <div className={styles.panel}>
          <div className={styles.panelHdr}><span className={styles.panelTitle}>Jeux les plus lancés</span></div>
          <div className={styles.panelBody}>
            {gameStats.length === 0
              ? <div className={styles.empty}>Aucune donnée</div>
              : <table style={{ width: '100%', fontSize: '12px' }}>
                  <tbody>
                    {gameStats.slice(0, 8).map((g, i) => (
                      <tr key={g.gameName} style={{ borderBottom: '1px solid rgba(80,10,160,0.12)', padding: '6px 0' }}>
                        <td style={{ padding: '6px 0' }}>{i + 1}. <strong>{g.gameName}</strong></td>
                        <td style={{ textAlign: 'right', color: '#9faa54' }}>{g.launches || 0} lancements</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            }
          </div>
        </div>
      </div>

      {/* Récents lancements */}
      <div className={styles.panel}>
        <div className={styles.panelHdr}><span className={styles.panelTitle}>Lancements Récents (100 derniers)</span></div>
        <div className={styles.panelBody}>
          {launches.length === 0
            ? <div className={styles.empty}>Aucun lancement</div>
            : <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', fontSize: '12px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bg2)' }}>
                    <tr>
                      <th>Key</th><th>Executor</th><th>IP</th><th>Pays</th><th>Heure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {launches.map(l => (
                      <tr key={l.id} style={{ borderBottom: '1px solid rgba(80,10,160,0.12)', padding: '6px 0' }}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{l.key?.slice(0, 8)}</span></td>
                        <td>{l.executor}</td>
                        <td><span style={{ fontFamily: 'monospace' }}>{l.clientIp}</span></td>
                        <td>{l.country}</td>
                        <td className={styles.dateCell}>{l.timestamp ? fmtDateTime(l.timestamp) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      </div>

      {/* Anomalies détectées */}
      {anomalies.length > 0 && (
        <div className={styles.panel}>
          <div className={styles.panelHdr} style={{ borderBottom: '2px solid rgba(255,100,100,0.3)' }}>
            <span className={styles.panelTitle} style={{ color: '#ff6464' }}>Anomalies Détectées ({anomalies.length})</span>
          </div>
          <div className={styles.panelBody}>
            {anomalies.slice(0, 10).map(a => (
              <div key={a.id} style={{ padding: '10px', background: 'rgba(255,100,100,0.05)', borderLeft: '3px solid #ff6464', marginBottom: '8px', borderRadius: '4px' }}>
                <div style={{ fontWeight: 'bold', color: '#ff6464' }}>{a.type}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{a.description}</div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>IP: {a.suspiciousIp} • {a.timestamp ? fmtDateTime(a.timestamp) : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
