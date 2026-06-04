/**
 * Firebase service — initializes app & exports db/auth singletons.
 * All Firestore / Auth interactions go through dedicated service modules.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore }  from 'firebase/firestore';
import { getAuth }       from 'firebase/auth';

const firebaseConfig = {
  apiKey:            'AIzaSyBEyeZcDz3tWqGIir3mStSrtfkjzceRxpM',
  authDomain:        'keydb-231f4.firebaseapp.com',
  projectId:         'keydb-231f4',
  storageBucket:     'keydb-231f4.firebasestorage.app',
  messagingSenderId: '788903370664',
  appId:             '1:788903370664:web:088688d3057d584ce7479d',
  measurementId:     'G-G7M84FSJV2',
};

const app = initializeApp(firebaseConfig);

export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;
