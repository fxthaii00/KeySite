/**
 * keyService — Firestore CRUD for keys collection.
 */

import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  getDoc, query, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db }           from './firebase';
import { generateKeyString, getExpiry } from '../utils/keyUtils';

const KEYS_COL = 'keys';

/**
 * Subscribe to real-time keys updates (ordered by createdAt desc).
 * @param {function} callback - called with array of key objects
 * @returns {function} unsubscribe
 */
export function subscribeKeys(callback) {
  const q = query(collection(db, KEYS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

/**
 * Generate and save a new key to both global and game-specific collections.
 */
export async function createKey({ game, gameName, type = 'lifetime', note = '', createdBy = 'public' }) {
  const key = generateKeyString();
  const data = {
    key,
    type,
    game,
    gameName,
    expiresAt:   getExpiry(type),
    hwid:        '',
    active:      false,
    blacklisted: false,
    createdAt:   Date.now(),
    note,
    createdBy,
  };

  await Promise.all([
    setDoc(doc(db, KEYS_COL, key), data),
    setDoc(doc(db, `keys_${game}`, key), data),
  ]);

  return { key, data };
}

/**
 * Blacklist a key.
 */
export async function blacklistKey(key, game) {
  const updates = { blacklisted: true };
  await updateDoc(doc(db, KEYS_COL, key), updates);
  if (game) await updateDoc(doc(db, `keys_${game}`, key), updates).catch(() => {});
}

/**
 * Delete a key permanently.
 */
export async function deleteKey(key, game) {
  await deleteDoc(doc(db, KEYS_COL, key));
  if (game) await deleteDoc(doc(db, `keys_${game}`, key)).catch(() => {});
}

/**
 * Extend key expiry by N days.
 */
export async function extendKey(key, game, days) {
  const snap = await getDoc(doc(db, KEYS_COL, key));
  if (!snap.exists()) throw new Error('Key not found');

  const base   = snap.data().expiresAt
    ? Math.max(snap.data().expiresAt, Date.now())
    : Date.now();
  const newExp = base + days * 86_400_000;

  await updateDoc(doc(db, KEYS_COL, key), { expiresAt: newExp });
  if (game) await updateDoc(doc(db, `keys_${game}`, key), { expiresAt: newExp }).catch(() => {});

  return newExp;
}
