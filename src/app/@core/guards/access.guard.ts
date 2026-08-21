import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

import { AccessControlService } from '../access/access-control.service';

// Roda pra toda rota filha de /admin (ver canActivateChild em app.routes.ts)
// — bloqueio por padrão: só passa quem estiver liberado (ACCESS_RULES) ou
// for superadmin. Rota nova não precisa registrar guard nenhum, só entra nas
// regras quando estiver pronta pra liberação geral.
@Injectable({
  providedIn: 'root',
})
export class AccessGuard implements CanActivateChild {
  constructor(
    private router: Router,
    private accessControlService: AccessControlService,
  ) {}

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    // state.url pode trazer query string (ex. "/admin/parishioners?page=2"),
    // que não deve interferir na comparação com ACCESS_RULES.
    const path = state.url.split('?')[0].split('#')[0];

    if (this.accessControlService.can(path)) return true;

    this.router.navigate(['/admin/dashboard']);
    return false;
  }
}
