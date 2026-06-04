import styles from './LogEntry.module.css';
import { logType } from '../../../utils/logUtils';
import { fmtDateTime, relTime } from '../../../utils/dateUtils';

export default function LogEntry({ log }) {
  const type = logType(log.action);

  const chips = [
    log.adminEmail && log.adminEmail !== 'system' && { label: 'admin', value: log.adminEmail },
    log.key        && { label: 'key',    value: log.key },
    log.gameName   && { label: 'jeu',    value: log.gameName || log.game },
    log.userId     && { label: 'userId', value: log.userId },
    log.username   && { label: 'user',   value: log.username },
    log.hwid       && { label: 'hwid',   value: log.hwid.slice(0, 12) + '…' },
    log.executor   && { label: 'exec',   value: log.executor },
    log.keyType    && { label: 'type',   value: log.keyType },
    log.reason     && { label: 'raison', value: log.reason, danger: true },
  ].filter(Boolean);

  return (
    <div className={styles.entry}>
      <div className={styles.row1}>
        <span className={`${styles.actionBadge} ${styles[`actionBadge--${type}`]}`}>
          {log.action || '?'}
        </span>
        <span className={styles.time}>{log.timestamp ? fmtDateTime(log.timestamp) : '—'}</span>
        {log.timestamp && (
          <span className={styles.rel}>({relTime(log.timestamp)})</span>
        )}
      </div>

      {log.detail && (
        <div className={styles.detail}>{log.detail}</div>
      )}

      {chips.length > 0 && (
        <div className={styles.chips}>
          {chips.map(c => (
            <span key={c.label} className={`${styles.chip} ${c.danger ? styles.chipDanger : ''}`}>
              <span className={styles.chipLabel}>{c.label}</span>
              {c.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
