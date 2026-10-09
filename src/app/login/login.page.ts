import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FirebaseError } from 'firebase/app';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonButton
} from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonButton
  ]
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  correo = '';
  password = '';
  mensaje = '';
  cargando = false;

  async acceder(registrar: boolean): Promise<void> {
    if (this.cargando) return;

    const correo = this.correo.trim();
    this.mensaje = '';

    if (!correo || !this.password) {
      this.mensaje = 'Escribe tu correo y contraseña.';
      return;
    }

    if (registrar && this.password.length < 6) {
      this.mensaje = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;

    try {
      if (registrar) {
        await this.authService.registrar(correo, this.password);
      } else {
        await this.authService.iniciarSesion(correo, this.password);
      }

      this.password = '';
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (error) {
      const codigo = error instanceof FirebaseError ? error.code : '';

      switch (codigo) {
        case 'auth/invalid-email':
          this.mensaje = 'El correo no tiene un formato válido.';
          break;
        case 'auth/weak-password':
        case 'auth/password-does-not-meet-requirements':
          this.mensaje = 'La contraseña no cumple los requisitos de seguridad.';
          break;
        case 'auth/network-request-failed':
          this.mensaje = 'Revisa tu conexión a internet e intenta de nuevo.';
          break;
        case 'auth/too-many-requests':
          this.mensaje = 'Demasiados intentos. Espera y vuelve a intentar.';
          break;
        default:
          this.mensaje = registrar
            ? 'No se pudo crear la cuenta. Revisa los datos o intenta iniciar sesión.'
            : 'No se pudo iniciar sesión. Revisa tu correo y contraseña.';
      }
    } finally {
      this.cargando = false;
    }
  }
}