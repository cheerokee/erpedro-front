import { Routes } from '@angular/router';

export const billingRoutes: Routes = [
  {
    path: 'plan',
    data: {
      title: 'Assinatura',
      breadcrumb: 'Assinatura',
    },
    loadComponent: () =>
      import('./plan-selection/plan-selection.page').then((m) => m.PlanSelectionPage),
  },
  {
    path: 'invoices',
    data: {
      title: 'Faturas',
      breadcrumb: 'Faturas',
    },
    loadComponent: () =>
      import('./invoices/list/list.component').then((m) => m.ListComponent),
  },
];
