import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase.config';

@Injectable({ providedIn: 'root' })
export class AuthService {
  registrar(correo: string, password: string) {
    return createUserWithEmailAndPassword(auth, correo, password);
  }

  iniciarSesion(correo: string, password: string) {
    return signInWithEmailAndPassword(auth, correo, password);
  }

  cerrarSesion() {
    return signOut(auth);
  }

  async tieneSesion(): Promise<boolean> {
    await auth.authStateReady();
    return auth.currentUser !== null;
  }
}