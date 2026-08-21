import { Injectable, inject } from '@angular/core';

import { AuthService } from '../services/auth.service';
import { RoleModel } from '../modules/acl/entities/role.model';
import { ACCESS_RULES } from './access.config';

// Ponto único de checagem de acesso: rotas (AccessGuard), menu (Sidebar) e
// blocos de UI (CanAccessDirective / chamada direta em código) reusam este
// serviço, todos contra as mesmas regras (ACCESS_RULES). Superadmin sempre
// passa, sem precisar constar nas regras.
@Injectable({ providedIn: 'root' })
export class AccessControlService {
  private readonly authService = inject(AuthService);

  isSuperAdmin(): boolean {
    return this.hasAnyRole([RoleModel.RoleTypeEnum.SUPERADMIN]);
  }

  hasAnyRole(roles: RoleModel.RoleTypeEnum[]): boolean {
    const user = this.authService.getAuthenticateUser();
    return !!user?.roles?.some((role) => roles.includes(role.type));
  }

  can(key: string): boolean {
    if (this.isSuperAdmin()) return true;

    return ACCESS_RULES.some((rule) => {
      const matches = key === rule.key || key.startsWith(`${rule.key}/`);
      if (!matches) return false;

      return !rule.roles || this.hasAnyRole(rule.roles);
    });
  }
}
