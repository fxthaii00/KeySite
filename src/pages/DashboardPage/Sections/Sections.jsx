import { useState, useCallback } from 'react';
import { keyStatus, keyTypeBadge, generateKeyString, getExpiry } from '../../../utils/keyUtils';
import { fmtDate, fmtDateTime, relTime } from '../../../utils/dateUtils';
import { logType } from '../../../utils/logUtils';
import { STATUS_LABEL, STATUS_CLASS, KEY_TYPES, STEAM_IMAGES } from '../../../utils/constants';
import { addGame, updateGameStatus, deleteGame as deleteGameSvc } from '../../../services/gameService';
import { createKey, blacklistKey, deleteKey, extendKey } from '../../../services/keyService';
import { createBan, removeBan } from '../../../services/banService';
import { addLog, clearAllLogs } from '../../../services/logService';
import { createAdminAccount } from '../../../services/authService';
import { fetchAdmins, toggleAdminRole, deleteAdmin } from '../../../services/adminService';
import { useToast } from '../../../context/ToastContext';
import styles from './Sections.module.css';

/* ─────────────────────────────────────
   CONFIRM DIALOG (replaces window.confirm)
───────────────────────────────────── */
function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className={styles.confirmOverlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmBox}>
        <div className={styles.confirmTitle}>{title}</div>
        <div className={styles.confirmMsg}>{message}</div>
        <div className={styles.confirmActions}>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={onCancel}>Annuler</button>
          <button className={`${styles.btn} ${danger ? styles.btnDanger : styles.btnPrimary}`} onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MODAL wrapper
───────────────────────────────────── */
function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.modalClose} onClick={onClose}>✕</button>
        <div className={styles.modalTitle}>{title}</div>
        {children}
        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────
   MINI CHART (sparkline bars)
───────────────────────────────────── */
function MiniChart({ data = [], color = '#6366f1', height = 160 }) {
  const max = Math.max(...data.map(d => d.val), 1);
  return (
    <div>
      <div className={styles.chartArea} style={{ height }}>
        {data.map((d, i) => (
          <div
            key={i}
            className={styles.chartBar}
            style={{
              height: `${(d.val / max) * 100}%`,
              background: color,
              opacity: 0.7 + (i / data.length) * 0.3,
            }}
            title={`${d.label}: ${d.val}`}
          />
        ))}
      </div>
      <div className={styles.chartLabels}>
        {data.map((d, i) => (
          <div key={i} className={styles.chartLabel}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

/* helper: build last N days mock data from logs */
function buildChartData(logs, days = 14) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const dayStart = new Date(d.toDateString()).getTime();
    const val = logs.filter(l => l.timestamp >= dayStart && l.timestamp < dayStart + 86400000).length;
    result.push({ label, val });
  }
  return result;
}

/* badge helper */
function StatusBadge({ status }) {
  const map = {
    active:   styles.badgeActive,
    inactive: styles.badgeInactive,
    banned:   styles.badgeBanned,
    expired:  styles.badgeExpired,
    lifetime: styles.badgeLifetime,
    beta:     styles.badgeBeta,
    online:   styles.badgeOnline,
    maint:    styles.badgeMaint,
    offline:  styles.badgeOffline,
    admin:    styles.badgeAdmin,
    mod:      styles.badgeMod,
  };
  const labels = {
    active:'Active', inactive:'Inactive', banned:'Blacklistée',
    expired:'Expirée', lifetime:'Lifetime', beta:'Beta',
    online:'Online', maint:'Maintenance', offline:'Offline',
    admin:'Admin', mod:'Modérateur',
  };
  return <span className={`${styles.badge} ${map[status] || styles.badgeInactive}`}>{labels[status] || status}</span>;
}

/* ══════════════════════════════════════
   1. OVERVIEW
══════════════════════════════════════ */
export function OverviewSection({ keys, bans, logs, users, onNavigate }) {
  const [period, setPeriod] = useState(30);
  const now = Date.now();
  const active = keys.filter(k => k.active && !k.blacklisted && (!k.expiresAt || now < k.expiresAt)).length;
  const used   = keys.filter(k => k.active).length;
  const usageRate = keys.length ? Math.round((used / keys.length) * 100) : 0;
  const chartData = buildChartData(logs, period === 7 ? 7 : period === 14 ? 14 : 30);

  return (
    <div>
      <div className={styles.pageHdr}>
        <div className={styles.pageHdrLeft}>
          <h1>Overview</h1>
          <p>Your key system analytics at a glance</p>
        </div>
        <div className={styles.periodTabs}>
          {[7, 14, 30].map(d => (
            <button key={d} className={`${styles.periodTab} ${period===d?styles.periodTabActive:''}`} onClick={() => setPeriod(d)}>
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.blue}`}>
          <div className={styles.statLabel}>Clicks</div>
          <div className={styles.statVal}>{logs.filter(l=>l.action==='VERIFY_SUCCESS').length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.green}`}>
          <div className={styles.statLabel}>Keys</div>
          <div className={styles.statVal}>{keys.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.yellow}`}>
          <div className={styles.statLabel}>Keys generated</div>
          <div className={styles.statVal}>{keys.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.red}`}>
          <div className={styles.statLabel}>Keys used</div>
          <div className={styles.statVal}>{used}</div>
          <div className={styles.statSub}>Usage rate <strong>{usageRate}%</strong></div>
        </div>
        <div className={`${styles.statCard} ${styles.purple}`}>
          <div className={styles.statLabel}>Active Bans</div>
          <div className={styles.statVal}>{bans.length}</div>
        </div>
        <div className={`${styles.statCard} ${styles.pink}`}>
          <div className={styles.statLabel}>Script executions</div>
          <div className={styles.statVal}>{logs.filter(l=>l.action==='VERIFY_SUCCESS').length}</div>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartCard}>
        <div className={styles.chartTitle}>Combined Metrics</div>
        <div className={styles.chartSub}>Showing activity over the last {period} days</div>
        <MiniChart data={chartData} color="#6366f1" height={160} />
      </div>

      {/* Recent activity */}
      <div className={styles.twoCol}>
        <div className={styles.panel}>
          <div className={styles.panelHdr}>
            <span className={styles.panelTitle}>Recent activity</span>
          </div>
          {logs.slice(0, 8).length === 0
            ? <div style={{padding:'20px',textAlign:'center',color:'#374151',fontSize:13}}>No activity yet</div>
            : logs.slice(0, 8).map(l => {
              const t = logType(l.action);
              const badgeCls = { ok: styles.logBadgeOk, fail: styles.logBadgeFail, warn: styles.logBadgeWarn, info: styles.logBadgeInfo }[t];
              return (
                <div key={l.id} className={styles.activityItem}>
                  <span className={`${styles.logBadge} ${badgeCls}`}>{l.action}</span>
                  <span style={{fontSize:11,color:'#4b5563',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.detail || ''}</span>
                  <span className={styles.logTime}>{l.timestamp ? relTime(l.timestamp) : ''}</span>
                </div>
              );
            })
          }
        </div>
        <div className={styles.panel}>
          <div className={styles.panelHdr}><span className={styles.panelTitle}>Quick actions</span></div>
          <div style={{padding:16}} className={styles.actionsCol}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{width:'100%',justifyContent:'center'}} onClick={() => onNavigate('keys')}>🔑 Manage Keys</button>
            <button className={`${styles.btn} ${styles.btnOutline}`} style={{width:'100%',justifyContent:'center'}} onClick={() => onNavigate('games')}>🎮 Manage Games</button>
            <button className={`${styles.btn} ${styles.btnOutline}`} style={{width:'100%',justifyContent:'center'}} onClick={() => onNavigate('hwids')}>🛡️ HWID Blacklist</button>
            <button className={`${styles.btn} ${styles.btnOutline}`} style={{width:'100%',justifyContent:'center'}} onClick={() => onNavigate('accounts')}>⚙️ Admin Accounts</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   2. KEYS
══════════════════════════════════════ */
export function KeysSection({ keys, games, user }) {
  const toast = useToast();
  const [search,     setSearch]     = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genModal,   setGenModal]   = useState(false);
  const [extModal,   setExtModal]   = useState(false);
  const [genForm,    setGenForm]    = useState({ game:'', type:'lifetime', note:'' });
  const [extData,    setExtData]    = useState({ key:'', game:'', days:7 });
  const [genResult,  setGenResult]  = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [confirm,    setConfirm]    = useState(null);

  const now = Date.now();

  const filtered = keys.filter(k => {
    if (gameFilter && k.game !== gameFilter) return false;
    if (search && !k.key?.toLowerCase().includes(search.toLowerCase()) &&
        !k.gameName?.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter === 'active')   return k.active && !k.blacklisted && (!k.expiresAt || now < k.expiresAt);
    if (typeFilter === 'used')     return k.active;
    if (typeFilter === 'expired')  return k.expiresAt && now > k.expiresAt;
    if (typeFilter === 'disabled') return k.blacklisted;
    return true;
  });

  const handleGen = async () => {
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

  const askBlacklist = (key, game) => setConfirm({ title:'Blacklister cette key ?', message:`La key ${key} sera désactivée définitivement.`, onConfirm: async () => { setConfirm(null); await blacklistKey(key, game); await addLog('KEY_BLACKLISTED',{key,detail:`Key ${key} blacklistée`},user?.email); toast('Key blacklistée','error'); }});
  const askDelete    = (key, game) => setConfirm({ title:'Supprimer cette key ?', message:`Cette action est irréversible.`, onConfirm: async () => { setConfirm(null); await deleteKey(key, game); await addLog('KEY_DELETED',{key,detail:`Key ${key} supprimée`},user?.email); toast('Key supprimée','error'); }});

  const handleExtend = async () => {
    try {
      await extendKey(extData.key, extData.game, extData.days);
      await addLog('KEY_EXTENDED',{key:extData.key,days:extData.days,detail:`Key prolongée de ${extData.days}j`},user?.email);
      setExtModal(false);
      toast(`✅ +${extData.days} jours ajoutés`,'success');
    } catch(e) { toast(e.message,'error'); }
  };

  return (
    <div>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.purple}`}>🔑</div>
        <div>
          <div className={styles.sectionHeaderTitle}>Keys</div>
          <div className={styles.sectionHeaderSub}>{keys.length} Keys total</div>
        </div>
        <div className={styles.sectionHeaderRight}>
          <button className={`${styles.btn} ${styles.btnOutline}`}>⬇ Export</button>
          <button className={`${styles.btn} ${styles.btnDanger}`}>🗑 Delete expired</button>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => { setGenResult(null); setGenModal(true); }}>⊞ Batch create</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setGenResult(null); setGenModal(true); }}>+ Create key</button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <span className={styles.searchIcon}>🔍</span>
        <input className={styles.searchInput} placeholder="Search Key, HWID, Provider, Roblox..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter tabs */}
      <div className={styles.filterTabs}>
        <button className={`${styles.filterTab} ${styles.filterTabStd}`}>🔑 Standard</button>
        <button className={`${styles.filterTab} ${styles.filterTabPrem}`}>⭐ Premium</button>
        {['all','active','used','expired','disabled'].map(f => (
          <button key={f} className={`${styles.filterTab} ${typeFilter===f?styles.filterTabActive:''}`} onClick={() => setTypeFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
        <select className={styles.select} value={gameFilter} onChange={e => setGameFilter(e.target.value)}>
          <option value="">All games</option>
          {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className={styles.panel}>
        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔑</div>
            <div className={styles.emptyTitle}>No keys for current search/filter.</div>
            <div className={styles.emptySub}>No keys available yet.</div>
            <div className={styles.emptyActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => { setGenResult(null); setGenModal(true); }}>+ Create key</button>
              <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => { setSearch(''); setTypeFilter('all'); setGameFilter(''); }}>Show all keys</button>
            </div>
          </div>
        ) : (
          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead><tr><th>Key</th><th>Game</th><th>Type</th><th>Status</th><th>HWID</th><th>Expires</th><th>Created</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(k => {
                  const s = keyStatus(k);
                  return (
                    <tr key={k.id}>
                      <td><span className={styles.keyCode}>{k.key}</span></td>
                      <td><span className={styles.gameBadge}>{k.gameName||k.game||'?'}</span></td>
                      <td><StatusBadge status={keyTypeBadge(k.type)} /></td>
                      <td><StatusBadge status={s.cls} /></td>
                      <td style={{fontFamily:'monospace',fontSize:10}}>{k.hwid ? k.hwid.slice(0,14)+'…' : '—'}</td>
                      <td style={{fontSize:12}}>{fmtDate(k.expiresAt)}</td>
                      <td style={{fontSize:12}}>{k.createdAt ? fmtDate(k.createdAt) : '—'}</td>
                      <td>
                        <div style={{display:'flex',gap:4}}>
                          <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => { setExtData({key:k.key,game:k.game||'',days:7}); setExtModal(true); }}>+j</button>
                          <button className={`${styles.btn} ${styles.btnWarning} ${styles.btnSm}`} onClick={() => askBlacklist(k.key, k.game||'')}>🚫</button>
                          <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`}  onClick={() => askDelete(k.key, k.game||'')}>✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gen modal */}
      <Modal isOpen={genModal} onClose={() => setGenModal(false)} title="Create Key"
        footer={<>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setGenModal(false)}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading} onClick={handleGen}>{loading?'Generating…':'Generate'}</button>
        </>}
      >
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Game *</label>
            <select value={genForm.game} onChange={e => setGenForm(p=>({...p,game:e.target.value}))}>
              <option value="">— Select game —</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}><label>Duration</label>
            <select value={genForm.type} onChange={e => setGenForm(p=>({...p,type:e.target.value}))}>
              {KEY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.formGroup} style={{marginBottom:14}}>
          <label>Note (optional)</label>
          <input value={genForm.note} onChange={e => setGenForm(p=>({...p,note:e.target.value}))} placeholder="e.g. Discord giveaway" />
        </div>
        {genResult && (
          <div className={styles.genResult} onClick={() => { navigator.clipboard.writeText(genResult); toast('📋 Copied!','info'); }}>
            <div className={styles.genResultLabel}>✅ Key generated — click to copy</div>
            <div className={styles.genResultKey}>{genResult}</div>
          </div>
        )}
      </Modal>

      {/* Extend modal */}
      <Modal isOpen={extModal} onClose={() => setExtModal(false)} title="Extend Key"
        footer={<>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setExtModal(false)}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleExtend}>Extend</button>
        </>}
      >
        <div style={{fontSize:12,color:'#4b5563',marginBottom:12}}>Key: <span style={{fontFamily:'monospace',color:'#818cf8'}}>{extData.key}</span></div>
        <div className={styles.formGroup}>
          <label>Days to add</label>
          <input type="number" min="1" value={extData.days} onChange={e => setExtData(p=>({...p,days:parseInt(e.target.value)||1}))} />
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   3. PLAYERS
══════════════════════════════════════ */
export function UsersSection({ users, onNavigate }) {
  return (
    <div>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.blue}`}>👥</div>
        <div>
          <div className={styles.sectionHeaderTitle}>Players</div>
          <div className={styles.sectionHeaderSub}>{users.length} registered players</div>
        </div>
      </div>
      <div className={styles.panel}>
        {users.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👥</div>
            <div className={styles.emptyTitle}>No players yet</div>
            <div className={styles.emptySub}>Players appear here after their first key verification.</div>
          </div>
        ) : (
          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead><tr><th>Username</th><th>User ID</th><th>HWID</th><th>Executor</th><th>Game</th><th>Key</th><th>Last seen</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={{fontWeight:600,color:'#f1f5f9'}}>{u.username||'—'}</td>
                    <td style={{fontFamily:'monospace',fontSize:11}}>{u.userId||'—'}</td>
                    <td style={{fontFamily:'monospace',fontSize:10}}>{u.hwid?u.hwid.slice(0,14)+'…':'—'}</td>
                    <td>{u.executor||'—'}</td>
                    <td><span className={styles.gameBadge}>{u.gameName||u.game||'—'}</span></td>
                    <td><span className={styles.keyCode}>{(u.key||'—').slice(0,20)}</span></td>
                    <td style={{fontSize:11}}>{u.lastSeen?fmtDateTime(u.lastSeen):'—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   4. WEBHOOKS
══════════════════════════════════════ */
export function WebhooksSection() {
  const [tab, setTab] = useState('shop');
  return (
    <div>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.yellow}`}>⚡</div>
        <div>
          <div className={styles.sectionHeaderTitle}>Webhooks</div>
          <div className={styles.sectionHeaderSub}>Manage webhook integrations</div>
        </div>
        <div className={styles.sectionHeaderRight}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>+ Create Webhook</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',gap:0,marginBottom:20,background:'#0d0f14',borderRadius:10,border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden'}}>
        {[{id:'shop',label:'🛒 Shop Webhooks'},{id:'relay',label:'🔄 Relay Webhooks',count:2}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{flex:1,padding:'11px',border:'none',background: tab===t.id ? '#141720':'transparent',color: tab===t.id ?'#f1f5f9':'#4b5563',fontWeight:600,fontSize:13,cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',borderBottom: tab===t.id?'2px solid #6366f1':'2px solid transparent'}}>
            {t.label} {t.count && <span style={{background:'rgba(99,102,241,0.2)',color:'#818cf8',borderRadius:4,padding:'1px 6px',fontSize:10,marginLeft:4}}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'shop' && (
        <>
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,fontSize:15,color:'#f1f5f9',marginBottom:4}}>Shop Webhooks</div>
            <div style={{fontSize:12,color:'#4b5563'}}>Automatically generate keys when customers make purchases through SellAuth, SellSn, or custom stores</div>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔗</div>
            <div className={styles.emptyTitle}>No webhooks yet</div>
            <div className={styles.emptySub}>Create your first webhook to automate key generation</div>
            <div className={styles.emptyActions}>
              <button className={`${styles.btn} ${styles.btnPrimary}`}>+ Create Webhook</button>
            </div>
          </div>
        </>
      )}

      {tab === 'relay' && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔄</div>
          <div className={styles.emptyTitle}>No relay webhooks</div>
          <div className={styles.emptySub}>Relay webhooks forward events to external services.</div>
          <div className={styles.emptyActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`}>+ Create Relay Webhook</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   5. HWID BLACKLIST
══════════════════════════════════════ */
export function HwidsSection({ bans, user }) {
  const toast = useToast();
  const [modal,   setModal]   = useState(false);
  const [search,  setSearch]  = useState('');
  const [confirm, setConfirm] = useState(null);
  const [hwid,    setHwid]    = useState('');
  const [reason,  setReason]  = useState('');

  const hwidBans = bans.filter(b => b.hwid && (!search || b.hwid.toLowerCase().includes(search.toLowerCase())));

  const handleBan = async () => {
    if (!hwid.trim()) { toast('HWID obligatoire', 'error'); return; }
    try {
      await createBan({ hwid: hwid.trim(), reason: reason || 'HWID Ban', bannedBy: user?.email });
      await addLog('BAN_CREATED', { hwid, detail: `HWID ${hwid} banni` }, user?.email);
      toast('HWID banni', 'error');
      setModal(false); setHwid(''); setReason('');
    } catch(e) { toast(e.message, 'error'); }
  };

  const askUnban = (id) => setConfirm({ title:'Lever ce ban HWID ?', message:'Cet utilisateur pourra à nouveau utiliser ses keys.', danger:false, onConfirm: async () => { setConfirm(null); await removeBan(id); toast('Ban levé','success'); }});

  return (
    <div>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.red}`}>🛡️</div>
        <div>
          <div className={styles.sectionHeaderTitle}>HWID blacklist</div>
          <div className={styles.sectionHeaderSub}>{hwidBans.length} HWIDs</div>
        </div>
        <div className={styles.sectionHeaderRight}>
          <div className={styles.banSearchRow}>
            <input className={styles.banSearchInput} placeholder="Search HWID" value={search} onChange={e => setSearch(e.target.value)} />
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Ban</button>
          </div>
        </div>
      </div>

      {hwidBans.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🛡️</div>
          <div className={styles.emptyTitle}>No HWIDs banned yet</div>
          <div className={styles.emptySub}>Banned hardware IDs will appear here</div>
          <div className={styles.emptyActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Ban HWID</button>
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead><tr><th>HWID</th><th>Reason</th><th>Banned by</th><th>Expires</th><th>Action</th></tr></thead>
              <tbody>
                {hwidBans.map(b => (
                  <tr key={b.id}>
                    <td style={{fontFamily:'monospace',fontSize:11}}>{b.hwid}</td>
                    <td style={{color:'#ef4444'}}>{b.reason}</td>
                    <td style={{fontSize:11}}>{b.bannedBy||'—'}</td>
                    <td style={{fontSize:11}}>{b.expiresAt?fmtDate(b.expiresAt):'∞ Permanent'}</td>
                    <td><button className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`} onClick={() => askUnban(b.id)}>Unban</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Ban HWID"
        footer={<>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(false)}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleBan}>Ban</button>
        </>}
      >
        <div className={styles.formGroup} style={{marginBottom:14}}>
          <label>HWID *</label>
          <input value={hwid} onChange={e => setHwid(e.target.value)} placeholder="HWID of the executor..." />
        </div>
        <div className={styles.formGroup} style={{marginBottom:4}}>
          <label>Reason</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional" />
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   6. DISCORD BANS
══════════════════════════════════════ */
export function DiscordBansSection({ bans, user }) {
  const toast = useToast();
  const [modal,   setModal]   = useState(false);
  const [search,  setSearch]  = useState('');
  const [confirm, setConfirm] = useState(null);
  const [form,    setForm]    = useState({ userId:'', reason:'' });

  const discordBans = bans.filter(b => b.userId && (!search || (b.userId+'').toLowerCase().includes(search.toLowerCase())));

  const handleBan = async () => {
    if (!form.userId.trim()) { toast('User ID obligatoire', 'error'); return; }
    try {
      await createBan({ userId: form.userId.trim(), reason: form.reason || 'Discord Ban', bannedBy: user?.email });
      await addLog('BAN_CREATED', { userId: form.userId, detail: `Discord user ${form.userId} banni` }, user?.email);
      toast('Discord user banni', 'error');
      setModal(false); setForm({ userId:'', reason:'' });
    } catch(e) { toast(e.message, 'error'); }
  };

  const askUnban = (id) => setConfirm({ title:'Lever ce ban Discord ?', message:'Cet utilisateur Discord pourra à nouveau accéder.', danger:false, onConfirm: async () => { setConfirm(null); await removeBan(id); toast('Ban levé','success'); }});

  return (
    <div>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.blue}`}>🚫</div>
        <div>
          <div className={styles.sectionHeaderTitle}>Discord blacklist</div>
          <div className={styles.sectionHeaderSub}>{discordBans.length} Discord users</div>
        </div>
        <div className={styles.sectionHeaderRight}>
          <div className={styles.banSearchRow}>
            <input className={styles.banSearchInput} placeholder="Search Discord user" value={search} onChange={e => setSearch(e.target.value)} />
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Ban</button>
          </div>
        </div>
      </div>

      {discordBans.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🚫</div>
          <div className={styles.emptyTitle}>No Discord users banned yet</div>
          <div className={styles.emptySub}>Banned Discord users will appear here</div>
          <div className={styles.emptyActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Ban Discord user</button>
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <div className={styles.tblWrap}>
            <table className={styles.tbl}>
              <thead><tr><th>Discord User ID</th><th>Reason</th><th>Banned by</th><th>Expires</th><th>Action</th></tr></thead>
              <tbody>
                {discordBans.map(b => (
                  <tr key={b.id}>
                    <td style={{fontFamily:'monospace'}}>{b.userId}</td>
                    <td style={{color:'#ef4444'}}>{b.reason}</td>
                    <td style={{fontSize:11}}>{b.bannedBy||'—'}</td>
                    <td style={{fontSize:11}}>{b.expiresAt?fmtDate(b.expiresAt):'∞ Permanent'}</td>
                    <td><button className={`${styles.btn} ${styles.btnSuccess} ${styles.btnSm}`} onClick={() => askUnban(b.id)}>Unban</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Ban Discord User"
        footer={<>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(false)}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnDanger}`} onClick={handleBan}>Ban</button>
        </>}
      >
        <div className={styles.formGroup} style={{marginBottom:14}}>
          <label>Discord User ID *</label>
          <input value={form.userId} onChange={e => setForm(p=>({...p,userId:e.target.value}))} placeholder="123456789012345678" />
        </div>
        <div className={styles.formGroup} style={{marginBottom:4}}>
          <label>Reason</label>
          <input value={form.reason} onChange={e => setForm(p=>({...p,reason:e.target.value}))} placeholder="Optional" />
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   7. DISCORD LOGS
══════════════════════════════════════ */
export function DiscordLogsSection({ logs }) {
  const toast = useToast();
  const [search,      setSearch]      = useState('');
  const [quickFilter, setQuickFilter] = useState('all');
  const [actionFilter,setActionFilter]= useState('');

  const filtered = logs.filter(l => {
    if (quickFilter === 'security' && !l.action?.includes('BAN') && !l.action?.includes('BLACKLIST')) return false;
    if (quickFilter === 'failed'   && !l.action?.includes('FAIL')) return false;
    if (quickFilter === 'keygen'   && !l.action?.includes('KEY_GENERATED')) return false;
    if (search && !JSON.stringify(l).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleClear = async () => {
    await clearAllLogs();
    toast('Logs vidés', 'info');
  };

  const badgeCls = t => ({ ok: styles.logBadgeOk, fail: styles.logBadgeFail, warn: styles.logBadgeWarn, info: styles.logBadgeInfo })[t] || styles.logBadgeInfo;

  return (
    <div>
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.blue}`}>💬</div>
        <div>
          <div className={styles.sectionHeaderTitle}>Discord Logs</div>
          <div className={styles.sectionHeaderSub}>{logs.length} Logs • <span style={{color:'#22c55e',fontSize:11}}>● Just now</span></div>
        </div>
        <div className={styles.sectionHeaderRight}>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => window.location.reload()}>↺ Refresh</button>
          <button className={`${styles.btn} ${styles.btnOutline}`}>⬇ Export</button>
        </div>
      </div>

      {/* Discord panel keys summary */}
      <div style={{background:'#141720',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:20,marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontSize:12,color:'#4b5563',marginBottom:4}}>Discord Panel Keys</div>
          <div style={{fontSize:32,fontWeight:700,color:'#f1f5f9'}}>{logs.filter(l=>l.action==='KEY_GENERATED').length}</div>
        </div>
        <div style={{width:36,height:36,background:'rgba(99,102,241,0.15)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🔑</div>
      </div>

      {/* Quick filters */}
      <div style={{marginBottom:16}}>
        <div style={{fontSize:12,color:'#4b5563',marginBottom:8,fontWeight:600}}>Quick Filters:</div>
        <div className={styles.filterTabs}>
          {[{id:'all',label:'All Events'},{id:'security',label:'🛡 Security Events'},{id:'failed',label:'⚠ Failed Only'},{id:'keygen',label:'🔑 Key Generation'}].map(f => (
            <button key={f.id} className={`${styles.filterTab} ${quickFilter===f.id?styles.filterTabActive:''}`} onClick={() => setQuickFilter(f.id)}>{f.label}</button>
          ))}
        </div>
      </div>

      {/* Filters panel */}
      <div style={{background:'#141720',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:16,fontWeight:600,fontSize:13,color:'#9ca3af'}}>
          🔽 Filters
        </div>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:'#4b5563',marginBottom:6,textTransform:'uppercase',letterSpacing:1}}>Search</div>
          <div className={styles.searchBar} style={{marginBottom:0}}>
            <span className={styles.searchIcon}>🔍</span>
            <input className={styles.searchInput} placeholder="Search keys, users..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Action Type</label>
            <select className={styles.select} value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
              <option value="">All</option>
              <option value="VERIFY_SUCCESS">VERIFY_SUCCESS</option>
              <option value="VERIFY_FAIL">VERIFY_FAIL</option>
              <option value="KEY_GENERATED">KEY_GENERATED</option>
              <option value="BAN_CREATED">BAN_CREATED</option>
            </select>
          </div>
          <div className={styles.formGroup}><label>Status</label><select className={styles.select}><option>All</option></select></div>
          <div className={styles.formGroup}><label>Date From</label><input type="date" /></div>
          <div className={styles.formGroup}><label>Date To</label><input type="date" /></div>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={handleClear}>🗑 Clear logs</button>
        </div>
      </div>

      {/* Logs list */}
      <div style={{marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontWeight:700,fontSize:14,color:'#f1f5f9'}}>Logs</div>
          <div style={{fontSize:12,color:'#4b5563'}}>Showing {filtered.length} of {logs.length} Logs</div>
        </div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <select className={styles.select} style={{fontSize:11}}>
            <option>50 per page</option><option>100 per page</option>
          </select>
          <select className={styles.select} style={{fontSize:11}}>
            <option>Newest</option><option>Oldest</option>
          </select>
        </div>
      </div>

      <div className={styles.panel}>
        {filtered.length === 0 ? (
          <div style={{padding:'40px',textAlign:'center',color:'#374151',fontSize:13}}>No logs found</div>
        ) : (
          filtered.map(l => {
            const t = logType(l.action);
            const chips = [
              l.key      && { label:'key',    value: l.key },
              l.gameName && { label:'game',   value: l.gameName||l.game },
              l.userId   && { label:'userId', value: l.userId },
              l.hwid     && { label:'hwid',   value: l.hwid.slice(0,12)+'…' },
            ].filter(Boolean);
            return (
              <div key={l.id} className={styles.logEntry}>
                <div className={styles.logRow1}>
                  <span className={`${styles.logBadge} ${badgeCls(t)}`}>{l.action||'?'}</span>
                  <span className={styles.logTime}>{l.timestamp?fmtDateTime(l.timestamp):'—'}</span>
                  {l.timestamp && <span style={{fontSize:10,color:'#374151'}}>({relTime(l.timestamp)})</span>}
                </div>
                {l.detail && <div className={styles.logDetail}>{l.detail}</div>}
                {chips.length > 0 && (
                  <div className={styles.logChips}>
                    {chips.map(c => (
                      <span key={c.label} className={styles.logChip}>
                        <span className={styles.logChipLabel}>{c.label}</span>
                        {c.value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   8. GAMES
══════════════════════════════════════ */
export function GamesSection({ games, user }) {
  const toast = useToast();
  const [modal,   setModal]   = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form,    setForm]    = useState({ id:'', name:'', status:'online', imageUrl:'' });

  const handleAdd = async () => {
    const id = form.id.toLowerCase().replace(/[^a-z0-9_]/g,'');
    if (!id||!form.name) { toast('ID et Nom obligatoires','error'); return; }
    if (games.find(g=>g.id===id)) { toast(`ID "${id}" existe déjà`,'error'); return; }
    try {
      await addGame({ id, name:form.name, status:form.status, imageUrl:form.imageUrl });
      await addLog('GAME_ADDED',{game:id,gameName:form.name},user?.email);
      toast(`✅ Jeu "${form.name}" ajouté !`,'success');
      setModal(false);
      setForm({ id:'',name:'',status:'online',imageUrl:'' });
    } catch(e) { toast(e.message,'error'); }
  };

  const askDelete = (id, name) => setConfirm({ title:`Supprimer "${name}" ?`, message:'Les keys ne seront pas supprimées.', onConfirm: async () => { setConfirm(null); await deleteGameSvc(id); await addLog('GAME_DELETED',{game:id,gameName:name},user?.email); toast(`Jeu supprimé`,'error'); }});

  return (
    <div>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.green}`}>🎮</div>
        <div><div className={styles.sectionHeaderTitle}>Games</div><div className={styles.sectionHeaderSub}>{games.length} games</div></div>
        <div className={styles.sectionHeaderRight}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Add Game</button>
        </div>
      </div>

      {games.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎮</div>
          <div className={styles.emptyTitle}>No games yet</div>
          <div className={styles.emptySub}>Add your first game to start generating keys.</div>
          <div className={styles.emptyActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Add Game</button>
          </div>
        </div>
      ) : (
        <div className={styles.gamesGrid}>
          {games.map(gm => {
            const img = gm.imageUrl||STEAM_IMAGES[gm.id]||'';
            return (
              <div key={gm.id} className={styles.gameCard}>
                {img ? <img className={styles.gameCardImg} src={img} alt={gm.name} /> : <div className={styles.gameCardNImg}>🎮</div>}
                <div className={styles.gameCardBody}>
                  <div className={styles.gameCardName}>{gm.name}</div>
                  <div className={styles.gameCardId}>id: {gm.id}</div>
                  <div style={{marginBottom:8}}><StatusBadge status={STATUS_CLASS[gm.status]||'offline'} /></div>
                  <div className={styles.gameCardActions}>
                    <button className={`${styles.stPill} ${styles.stPillOn}`}  onClick={() => updateGameStatus(gm.id,'online')}>🟢</button>
                    <button className={`${styles.stPill} ${styles.stPillMn}`}  onClick={() => updateGameStatus(gm.id,'maint')}>🟡</button>
                    <button className={`${styles.stPill} ${styles.stPillOff}`} onClick={() => updateGameStatus(gm.id,'offline')}>🔴</button>
                    <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => askDelete(gm.id,gm.name)}>✕</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Game"
        footer={<>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(false)}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAdd}>Add Game</button>
        </>}
      >
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Unique ID *</label><input value={form.id} onChange={e => setForm(p=>({...p,id:e.target.value}))} placeholder="ex: brm5" /></div>
          <div className={styles.formGroup}><label>Display Name *</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="ex: BRM5" /></div>
        </div>
        <div className={styles.formGroup} style={{marginBottom:14}}>
          <label>Initial Status</label>
          <select value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}>
            <option value="online">🟢 Online</option><option value="maint">🟡 Maintenance</option><option value="offline">🔴 Offline</option>
          </select>
        </div>
        <div className={styles.formGroup} style={{marginBottom:4}}>
          <label>Image URL (optional)</label>
          <input value={form.imageUrl} onChange={e => setForm(p=>({...p,imageUrl:e.target.value}))} placeholder="https://…" />
        </div>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════
   9. ADMIN ACCOUNTS
══════════════════════════════════════ */
export function AccountsSection({ user }) {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [modal,    setModal]    = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [form,     setForm]     = useState({ name:'', email:'', password:'', role:'admin' });

  const load = () => fetchAdmins().then(setAccounts);
  useState(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name||!form.email||!form.password) { toast('Tous les champs obligatoires','error'); return; }
    if (form.password.length<6) { toast('Mot de passe min. 6 chars','error'); return; }
    setLoading(true);
    try {
      await createAdminAccount({ email:form.email, password:form.password, displayName:form.name, role:form.role, createdBy:user?.email });
      await addLog('ACCOUNT_CREATED',{detail:`Compte "${form.name}" créé`},user?.email);
      toast(`✅ Compte "${form.name}" créé !`,'success');
      setModal(false); load();
    } catch(e) {
      const ERRS = {'auth/email-already-in-use':'Email déjà utilisé','auth/weak-password':'Mot de passe trop faible'};
      toast(ERRS[e.code]||e.message,'error');
    }
    setLoading(false);
  };

  const askDelete = (uid, name) => setConfirm({ title:`Supprimer "${name}" ?`, message:'Ce compte ne pourra plus accéder au dashboard.', onConfirm: async () => { setConfirm(null); await deleteAdmin(uid); await addLog('ACCOUNT_DELETED',{detail:`"${name}" supprimé`},user?.email); toast('Compte supprimé','error'); load(); }});

  return (
    <div>
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      <div className={styles.sectionHeader}>
        <div className={`${styles.sectionIconBox} ${styles.purple}`}>⚙️</div>
        <div><div className={styles.sectionHeaderTitle}>Admin Accounts</div><div className={styles.sectionHeaderSub}>{accounts.length} accounts</div></div>
        <div className={styles.sectionHeaderRight}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Invite Admin</button>
        </div>
      </div>

      <div className={styles.infoBox}>Accounts can access this dashboard. Moderators have read-only access.</div>

      {accounts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⚙️</div>
          <div className={styles.emptyTitle}>No admin accounts</div>
          <div className={styles.emptySub}>Invite your first admin or moderator.</div>
          <div className={styles.emptyActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setModal(true)}>+ Invite Admin</button>
          </div>
        </div>
      ) : (
        <div className={styles.accountsGrid}>
          {accounts.map(a => {
            const isMe    = a.uid === user?.uid;
            const initial = (a.displayName||a.email||'?').charAt(0).toUpperCase();
            return (
              <div key={a.uid} className={styles.accountCard}>
                <div className={styles.accountAvatar} style={{background:a.role==='mod'?'#1d4ed8':'#4f46e5'}}>{initial}</div>
                <div className={styles.accountInfo}>
                  <div className={styles.accountName}>{a.displayName||'—'} {isMe&&<span className={styles.meTxt}>(you)</span>}</div>
                  <div className={styles.accountEmail}>{a.email}</div>
                  <div className={styles.accountMeta}>
                    <StatusBadge status={a.role==='mod'?'mod':'admin'} />
                  </div>
                </div>
                {!isMe && (
                  <div className={styles.accountActions}>
                    <button className={`${styles.btn} ${styles.btnDanger} ${styles.btnSm}`} onClick={() => askDelete(a.uid, a.displayName||a.email)}>✕</button>
                    <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={async () => { await toggleAdminRole(a.uid, a.role); toast('Rôle changé','success'); load(); }}>⇄</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Invite Admin"
        footer={<>
          <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setModal(false)}>Cancel</button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={loading} onClick={handleCreate}>{loading?'Creating…':'Create Account'}</button>
        </>}
      >
        <div className={styles.infoBox} style={{marginBottom:16}}>Create a Firebase account for this person.</div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Display Name *</label><input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Moderator1" /></div>
          <div className={styles.formGroup}><label>Role</label>
            <select value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
              <option value="admin">Admin (full access)</option>
              <option value="mod">Moderator (read-only)</option>
            </select>
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="mod@example.com" /></div>
          <div className={styles.formGroup}><label>Password *</label><input type="text" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} placeholder="Min. 6 chars" /></div>
        </div>
      </Modal>
    </div>
  );
}
