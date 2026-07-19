import { Routes } from '@angular/router';

export const parishionersRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Paroquianos',
      breadcrumb: 'Paroquianos',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
