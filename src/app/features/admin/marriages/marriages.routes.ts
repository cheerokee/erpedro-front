import { Routes } from '@angular/router';

export const marriagesRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Casamentos',
      breadcrumb: 'Casamentos',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
