import { Routes } from '@angular/router';

export const usersRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Usuários',
      breadcrumb: 'Usuários',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
