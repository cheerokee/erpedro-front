import { Routes } from '@angular/router';

export const projectRoutes: Routes = [
  {
    path: 'project-details',
    loadComponent: () =>
      import('./project-details/project-details').then((m) => m.ProjectDetails),
    data: {
      title: 'Project Details',
      breadcrumb: 'Project Details',
    },
  },
  {
    path: 'project-list',
    loadComponent: () =>
      import('./project-list/project-list').then((m) => m.ProjectList),
    data: {
      title: 'Project List',
      breadcrumb: 'Project List',
    },
  },
  {
    path: 'create-project',
    loadComponent: () =>
      import('./create-project/create-project').then((m) => m.CreateProject),
    data: {
      title: 'Project Create',
      breadcrumb: 'Project Create',
    },
  },
];
