/** Format timestamp as DD/MM/YYYY. Returns '∞ Lifetime' for null. */
export function fmtDate(ts) {
  if (!ts) return '∞ Lifetime';
  return new Date(ts).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/** Format timestamp as DD/MM HH:MM:SS. */
export function fmtDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Relative time: "3min ago", "2h ago", etc. */
export function relTime(ts) {
  const d = Date.now() - ts;
  if (d < 60_000)     return `${Math.floor(d / 1000)}s ago`;
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)}min ago`;
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`;
  return `${Math.floor(d / 86_400_000)}j ago`;
}
