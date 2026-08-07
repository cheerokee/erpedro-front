import { BehaviorSubject } from 'rxjs';

import { IMenu } from '../interface/menu';

export const menuItems: IMenu[] = [
  {
    main_title: 'Geral',
  },
  {
    title: 'Início',
    icon: 'home',
    type: 'link',
    bookmark: true,
    path: '',
    level: 1,
  },
  {
    title: 'Cadastros',
    icon: 'learning',
    type: 'sub',
    active: false,
    level: 1,
    children: [
      { path: '/admin/companies', title: 'Paróquias', type: 'link' },
      { path: '/admin/users', title: 'Usuários', type: 'link' },
      { path: '/admin/employees', title: 'Colaboradores', type: 'link' },
      { path: '/admin/parishioners', title: 'Paroquianos', type: 'link' },
    ],
  },
  {
    title: 'Sacramentos',
    icon: 'learning',
    type: 'sub',
    active: false,
    level: 1,
    children: [{ path: '/admin/baptisms', title: 'Batismos', type: 'link' }],
  },
  {
    title: 'Financeiro',
    icon: 'price',
    type: 'sub',
    active: false,
    level: 1,
    children: [
      {
        path: '/admin/financial-services',
        title: 'Serviços Financeiros',
        type: 'link',
      },
      { path: '/admin/financial-bills', title: 'Faturas', type: 'link' },
    ],
  },
];

// Array
export const items = new BehaviorSubject<IMenu[]>(menuItems);
