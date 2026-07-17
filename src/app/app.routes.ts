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
  // {
  //   path: "",
  //   loadComponent: () =>
  //     import("./@shared/components/layout/content/content").then(
  //       (m) => m.Content,
  //     ),
  //   children: content,
  // },
  {
    path: '**',
    redirectTo: '',
  },
];
