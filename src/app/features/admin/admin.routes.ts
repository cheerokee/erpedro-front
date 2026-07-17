import { Routes } from '@angular/router';

import { Content } from '../../@shared/components/layout/content/content';

export const adminRoutes: Routes = [
  {
    path: '',
    component: Content,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        data: {
          title: 'Dashboard',
          breadcrumb: 'Dashboard',
        },
        loadComponent: () =>
          import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
    ],
  },
];
