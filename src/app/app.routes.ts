import { Routes } from '@angular/router';

import { adminRoutes } from './features/admin/admin.routes';
import { AuthGuard } from './@core/guards/auth.guard';
import { AccessGuard } from './@core/guards/access.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    // canActivateChild se aplica em cascata a toda rota filha (incluindo
    // netas, ex. /admin/dashboard, /admin/parishioners/new) — nova rota
    // registrada em admin.routes.ts já nasce bloqueada por padrão, sem
    // precisar declarar guard nenhum nela (ver AccessGuard/ACCESS_RULES).
    canActivateChild: [AccessGuard],
    children: adminRoutes,
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./features/auth/sign-up/sign-up').then((m) => m.SignUp),
  },
  {
    path: 'sign-up-customer',
    loadComponent: () =>
      import('./features/auth/sign-up-customer/sign-up-customer').then(
        (m) => m.SignUpCustomer,
      ),
  },
  {
    path: 'confirm-email',
    loadComponent: () =>
      import('./features/auth/confirm-email/confirm-email').then(
        (m) => m.ConfirmEmail,
      ),
  },
  {
    path: 'accept-invite',
    loadComponent: () =>
      import('./features/auth/accept-invite/accept-invite').then(
        (m) => m.AcceptInvite,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(
        (m) => m.ForgotPassword,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then(
        (m) => m.ResetPassword,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
