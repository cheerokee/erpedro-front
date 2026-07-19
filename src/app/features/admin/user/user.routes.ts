import { Routes } from '@angular/router';

export const userRoutes: Routes = [
  {
    path: 'user-profile/:id',
    loadComponent: () =>
      import('./user-profile/user-profile').then((m) => m.UserProfile),
    data: {
      title: 'Perfil do Usuário',
      breadcrumb: 'Perfil do Usuário',
    },
  },
];
