import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC-R7R3OWAQ99oUMj7Z4aVMLFP-EeCD4MA",
  authDomain: "mi-recetario-4d63d.firebaseapp.com",
  projectId: "mi-recetario-4d63d",
  storageBucket: "mi-recetario-4d63d.firebasestorage.app",
  messagingSenderId: "610324542746",
  appId: "1:610324542746:web:35d2a75ea3e8ec192aa8a3"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);