import { Routes } from '@angular/router';

import { adminRoutes } from './features/admin/admin.routes';
import { AuthGuard } from './@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full',
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
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
