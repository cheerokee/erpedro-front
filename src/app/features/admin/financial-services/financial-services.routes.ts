import { Routes } from '@angular/router';

export const financialServicesRoutes: Routes = [
  {
    path: '',
    data: {
      title: 'Serviços Financeiros',
      breadcrumb: 'Serviços Financeiros',
    },
    loadComponent: () =>
      import('./list/list.component').then((m) => m.ListComponent),
  },
];
