/** Known Steam header images keyed by game ID. */
export const STEAM_IMAGES = {
  cs2:  'https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg',
  gtav: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg',
  val:  'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/header.jpg',
  apex: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg',
  cod:  'https://cdn.cloudflare.steamstatic.com/steam/apps/1938090/header.jpg',
};

/** CSS class suffix per game/api status. */
export const STATUS_CLASS = {
  online:  'online',
  maint:   'maint',
  offline: 'offline',
};

/** Human-readable status labels. */
export const STATUS_LABEL = {
  online:  'Online',
  maint:   'Maintenance',
  offline: 'Offline',
};

/** Status dot colors. */
export const STATUS_COLOR = {
  online:  '#22c55e',
  maint:   '#eab308',
  offline: '#ef4444',
};

/** Firebase Auth error messages in French. */
export const AUTH_ERRORS = {
  'auth/invalid-email':        'Email invalide',
  'auth/user-not-found':       'Compte introuvable',
  'auth/wrong-password':       'Mot de passe incorrect',
  'auth/invalid-credential':   'Email ou mot de passe incorrect',
  'auth/too-many-requests':    'Trop de tentatives, réessaie plus tard',
  'auth/email-already-in-use': 'Email déjà utilisé',
  'auth/weak-password':        'Mot de passe trop faible',
};

/** Key duration options. */
export const KEY_TYPES = [
  { value: 'lifetime', label: 'Lifetime' },
  { value: '30days',   label: '30 Jours' },
  { value: '7days',    label: '7 Jours'  },
  { value: '1day',     label: '1 Jour'   },
  { value: 'beta',     label: 'Beta (30j)' },
];

/** Nav links shared across public pages. */
export const NAV_LINKS = [
  { label: 'Home',    to: '/'        },
  { label: 'About',   to: '/about'   },
  { label: 'Credits', to: '/credits' },
];
