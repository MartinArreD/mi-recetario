import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';

const requiereSesion: CanActivateFn = async () => {
  const servicio = inject(AuthService);
  const router = inject(Router);

  return (await servicio.tieneSesion())
    ? true
    : router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    canActivate: [requiereSesion],
    loadComponent: () =>
      import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];