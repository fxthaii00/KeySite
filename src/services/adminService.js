import { collection, doc, getDocs, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

export async function fetchAdmins() {
  const snap = await getDocs(collection(db, 'admins'));
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

export async function toggleAdminRole(uid, currentRole) {
  const newRole = currentRole === 'mod' ? 'admin' : 'mod';
  await updateDoc(doc(db, 'admins', uid), { role: newRole });
  return newRole;
}

export async function deleteAdmin(uid) {
  await deleteDoc(doc(db, 'admins', uid));
}
