import { Routes } from '@angular/router';

import { Content } from '../../@shared/components/layout/content/content';
import { projectRoutes } from './projects/project.routes';
import { userRoutes } from './user/user.routes';
import { parishionersRoutes } from './parishioners/parishioners.routes';
import { addressesRoutes } from './addresses/addresses.routes';
import { employeesRoutes } from './employees/employees.routes';
import { companiesRoutes } from './companies/companies.routes';
import { financialServicesRoutes } from './financial-services/financial-services.routes';
import { financialBillsRoutes } from './financial-bills/financial-bills.routes';

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
      {
        path: 'user',
        children: userRoutes,
      },
      {
        path: 'project',
        children: projectRoutes,
      },
      {
        path: 'parishioners',
        children: parishionersRoutes,
      },
      {
        path: 'employees',
        children: employeesRoutes,
      },
      {
        path: 'addresses',
        children: addressesRoutes,
      },
      {
        path: 'companies',
        children: companiesRoutes,
      },
      {
        path: 'financial-services',
        children: financialServicesRoutes,
      },
      {
        path: 'financial-bills',
        children: financialBillsRoutes,
      },
    ],
  },
];
