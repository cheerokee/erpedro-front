import { Routes } from '@angular/router';

export const firstCommunionsRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Primeira Comunhão',
      breadcrumb: 'Primeira Comunhão',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
