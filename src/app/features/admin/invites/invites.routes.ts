import { Routes } from '@angular/router';

export const invitesRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Convites',
      breadcrumb: 'Convites',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
