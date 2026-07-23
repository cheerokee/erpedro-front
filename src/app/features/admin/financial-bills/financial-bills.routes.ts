import { Routes } from '@angular/router';

export const financialBillsRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Faturas',
      breadcrumb: 'Faturas',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
