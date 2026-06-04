/**
 * gameService — Firestore CRUD for games collection.
 */

import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';

const GAMES_COL = 'games';

export function subscribeGames(callback) {
  const q = query(collection(db, GAMES_COL), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap =>
    callback(snap.docs.map(d => d.data()))
  );
}

export async function addGame({ id, name, status = 'online', imageUrl = '' }) {
  await setDoc(doc(db, GAMES_COL, id), {
    id, name, status, imageUrl, createdAt: Date.now(),
  });
}

export async function updateGameStatus(id, status) {
  await updateDoc(doc(db, GAMES_COL, id), { status });
}

export async function deleteGame(id) {
  await deleteDoc(doc(db, GAMES_COL, id));
}
