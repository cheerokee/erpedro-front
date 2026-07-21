import { Routes } from '@angular/router';

export const addressesRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Endereços',
      breadcrumb: 'Endereços',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
