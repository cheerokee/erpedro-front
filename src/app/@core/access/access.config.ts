import { RoleModel } from '../modules/acl/entities/role.model';

// Cada regra libera a própria chave e tudo que começa com "chave/" — uma
// rota (ex. "/admin/parishioners") libera automaticamente suas subrotas
// (ex. "/admin/parishioners/new"). Chaves fora do contexto de rota (blocos
// de UI via CanAccessDirective/AccessControlService.can()) seguem a mesma
// regra de prefixo, então também podem ser namespaced em árvore
// (ex. "financial-bills.export").
//
// `roles` opcional: ausente = liberado pra qualquer usuário autenticado
// não-superadmin; presente = só libera pra quem tiver pelo menos um dos
// tipos de role listados (em qualquer company/holding — não checa qual).
// Superadmin sempre passa, independente de constar aqui (ver
// AccessControlService.isSuperAdmin()).
export interface AccessRule {
  key: string;
  roles?: RoleModel.RoleTypeEnum[];
}

// Começa só com o dashboard — ir adicionando aqui conforme cada tela for
// revisada e liberada (ver AI_CONTEXT.md).
export const ACCESS_RULES: readonly AccessRule[] = [
  { key: '/admin/dashboard' },
  { key: '/admin/employees', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/parishioners', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/invites', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/baptisms', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/first-communions', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/confirmations', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/marriages', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/financial-services', roles: [RoleModel.RoleTypeEnum.ADMIN] },
  { key: '/admin/financial-bills', roles: [RoleModel.RoleTypeEnum.ADMIN] },
];
