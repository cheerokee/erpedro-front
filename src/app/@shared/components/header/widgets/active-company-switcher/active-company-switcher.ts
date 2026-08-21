import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs';

import { ActiveCompanyService } from '../../../../../@core/services/active-company.service';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';

// Só renderiza algo quando o usuário logado tem acesso a mais de uma company
// (role em company diferente do vínculo de Employee/Customer, ou holding com
// mais de uma company vinculada) — caso comum (0 ou 1 company) o backend já
// resolve sozinho (TenantContextInterceptor), sem precisar de nenhum X-Company-Id
// explícito, então esse widget fica invisível.
@Component({
  selector: 'app-active-company-switcher',
  imports: [FormsModule],
  templateUrl: './active-company-switcher.html',
  styleUrl: './active-company-switcher.scss',
})
export class ActiveCompanySwitcher implements OnInit {
  private readonly activeCompanyService = inject(ActiveCompanyService);

  visible = false;
  companies: CompanyModel.Entity[] = [];
  activeCompanyId: string | null = null;

  ngOnInit() {
    this.visible = this.activeCompanyService.hasMultipleCompanies();
    if (!this.visible) return;

    this.activeCompanyId = this.activeCompanyService.getActiveCompanyId();

    this.activeCompanyService
      .loadCompanies()
      .pipe(take(1))
      .subscribe((result) => {
        this.companies = result.data ?? [];
      });
  }

  // Recarrega a página inteira de propósito (decisão do usuário) — mais
  // simples e garante que toda tela em tela releia os dados já filtrados
  // pela nova company, sem precisar de um mecanismo de refresh reativo
  // espalhado por cada tela/service que hoje consome dado tenant-scoped.
  onChange(id: string) {
    this.activeCompanyService.setActiveCompanyId(id);
    window.location.reload();
  }
}
