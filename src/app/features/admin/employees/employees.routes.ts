import { Routes } from '@angular/router';

export const employeesRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Colaboradores',
      breadcrumb: 'Colaboradores',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
