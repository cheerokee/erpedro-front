import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

import { AuthService } from './auth.service';
import { CompanyService } from '../modules/company/services/company.service';
import { CompanyModel } from '../modules/company/entities/company.model';

const STORAGE_SUFFIX = '_active_company_id';

// Resolve/persiste a "empresa ativa" pra usuário com acesso a mais de uma
// company (via role, vínculo de Employee/Customer ou holding — mesma união
// que TenantContextInterceptor calcula no backend, ver
// resolveAuthorizedCompanyIds em tenant-context.interceptor.ts). Consumido
// pelo companyHeaderInterceptor (anexa X-Company-Id em toda request) e pelo
// seletor do topbar (ActiveCompanySwitcher).
@Injectable({ providedIn: 'root' })
export class ActiveCompanyService {
  private readonly authService = inject(AuthService);
  private readonly companyService = inject(CompanyService);

  // Nomes resolvidos via GET /v1/companies/my-companies — só populado quando
  // hasMultipleCompanies() é true (o widget do topbar decide quando chamar
  // loadCompanies()); caso comum (0 ou 1 company) não faz nenhuma chamada extra.
  companies$ = new BehaviorSubject<CompanyModel.Entity[]>([]);

  getAuthorizedCompanyIds(): string[] {
    const user = this.authService.getAuthenticateUser();
    if (!user) return [];

    return Array.from(
      new Set(
        [
          ...(user.companies ?? []).map((c) => c.id),
          ...(user.roles ?? [])
            .filter((role) => !!role.company_id)
            .map((role) => role.company_id),
          ...(user.employeeCompanyIds ?? []),
          ...(user.holdingCompanyIds ?? []),
        ].filter(Boolean),
      ),
    );
  }

  hasMultipleCompanies(): boolean {
    return this.getAuthorizedCompanyIds().length > 1;
  }

  // Com 0 ou 1 company não precisa persistir nada — resolve sozinho a cada
  // chamada (evita ficar preso a uma escolha antiga se o vínculo do usuário
  // mudar). Com 2+, usa o que estiver salvo (se ainda for uma opção válida)
  // ou cai pro primeiro da lista como default, até o usuário trocar
  // explicitamente no seletor do topbar.
  getActiveCompanyId(): string | null {
    const ids = this.getAuthorizedCompanyIds();
    if (ids.length === 0) return null;
    if (ids.length === 1) return ids[0];

    const key = this.storageKey();
    const stored = key ? localStorage.getItem(key) : null;
    if (stored && ids.includes(stored)) return stored;

    return ids[0];
  }

  setActiveCompanyId(id: string): void {
    const key = this.storageKey();
    if (key) localStorage.setItem(key, id);
  }

  loadCompanies() {
    return this.companyService.myCompanies().pipe(
      tap((result) => {
        if (result.success && result.data) {
          this.companies$.next(result.data);
        }
      }),
    );
  }

  private storageKey(): string | null {
    // getBaseStorageKey() desestrutura o AuthenticatedUser sem guard —
    // quebra se chamado deslogado (getAuthenticateUser() === null).
    if (!this.authService.getAuthenticateUser()) return null;

    return `${this.authService.getBaseStorageKey()}${STORAGE_SUFFIX}`;
  }
}
