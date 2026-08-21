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
      { path: '/admin/invites', title: 'Convites', type: 'link' },
    ],
  },
  {
    title: 'Sacramentos',
    icon: 'learning',
    type: 'sub',
    active: false,
    level: 1,
    children: [
      { path: '/admin/baptisms', title: 'Batismos', type: 'link' },
      { path: '/admin/first-communions', title: 'Primeira Comunhão', type: 'link' },
      { path: '/admin/confirmations', title: 'Crisma', type: 'link' },
      { path: '/admin/marriages', title: 'Casamentos', type: 'link' },
    ],
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
  {
    title: 'Assinatura',
    icon: 'price',
    type: 'sub',
    active: false,
    level: 1,
    children: [
      { path: '/admin/billing/plan', title: 'Plano', type: 'link' },
      { path: '/admin/billing/invoices', title: 'Faturas da Assinatura', type: 'link' },
    ],
  },
];

// Array
export const items = new BehaviorSubject<IMenu[]>(menuItems);

// Reusado por Sidebar/Search/HeaderBookmark pra esconder do menu/busca
// qualquer item cuja rota ainda não esteja liberada (ver AccessControlService,
// mesma whitelist usada pelo AccessGuard) — item com `children` só aparece se
// sobrar pelo menos um filho liberado; item de cabeçalho (`main_title`, sem
// `path` próprio) sempre passa. Não muta os itens originais: item com filhos
// filtrados vira um objeto novo (`{...item, children}`), item sem filhos é
// reaproveitado por referência (identidade preservada pro match usado em
// Sidebar.setNavActive).
export function filterAccessibleMenu(
  menuItems: IMenu[],
  can: (key: string) => boolean,
): IMenu[] {
  return menuItems.reduce<IMenu[]>((acc, item) => {
    if (item.children?.length) {
      const children = filterAccessibleMenu(item.children, can);
      if (children.length) acc.push({ ...item, children });
      return acc;
    }

    if (item.path === undefined) {
      acc.push(item);
      return acc;
    }

    const routeKey = item.path === '' ? '/admin/dashboard' : item.path;
    if (can(routeKey)) acc.push(item);

    return acc;
  }, []);
}
