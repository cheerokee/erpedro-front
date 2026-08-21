import { Routes } from '@angular/router';

import { Content } from '../../@shared/components/layout/content/content';
import { projectRoutes } from './projects/project.routes';
import { userRoutes } from './user/user.routes';
import { usersRoutes } from './users/users.routes';
import { parishionersRoutes } from './parishioners/parishioners.routes';
import { addressesRoutes } from './addresses/addresses.routes';
import { employeesRoutes } from './employees/employees.routes';
import { companiesRoutes } from './companies/companies.routes';
import { invitesRoutes } from './invites/invites.routes';
import { financialServicesRoutes } from './financial-services/financial-services.routes';
import { financialBillsRoutes } from './financial-bills/financial-bills.routes';
import { baptismsRoutes } from './baptisms/baptisms.routes';
import { firstCommunionsRoutes } from './first-communions/first-communions.routes';
import { confirmationsRoutes } from './confirmations/confirmations.routes';
import { marriagesRoutes } from './marriages/marriages.routes';
import { billingRoutes } from './billing/billing.routes';

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
        path: 'users',
        children: usersRoutes,
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
        path: 'invites',
        children: invitesRoutes,
      },
      {
        path: 'financial-services',
        children: financialServicesRoutes,
      },
      {
        path: 'financial-bills',
        children: financialBillsRoutes,
      },
      {
        path: 'baptisms',
        children: baptismsRoutes,
      },
      {
        path: 'first-communions',
        children: firstCommunionsRoutes,
      },
      {
        path: 'confirmations',
        children: confirmationsRoutes,
      },
      {
        path: 'marriages',
        children: marriagesRoutes,
      },
      {
        path: 'billing',
        children: billingRoutes,
      },
    ],
  },
];
