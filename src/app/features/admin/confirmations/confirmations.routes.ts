import { Routes } from '@angular/router';

export const confirmationsRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Crisma',
      breadcrumb: 'Crisma',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
