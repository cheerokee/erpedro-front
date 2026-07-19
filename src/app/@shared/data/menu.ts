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
    active: true,
    level: 1,
    children: [
      { path: '/admin/employees', title: 'Colaboradores', type: 'link' },
      { path: '/admin/parishioners', title: 'Paroquianos', type: 'link' },
    ],
  },
];

// Array
export const items = new BehaviorSubject<IMenu[]>(menuItems);
