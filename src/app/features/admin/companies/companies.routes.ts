import { Routes } from '@angular/router';

export const companiesRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Paróquias',
      breadcrumb: 'Paróquias',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
