import { Routes } from '@angular/router';

export const baptismsRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Batismos',
      breadcrumb: 'Batismos',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
