import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
} from '@angular/core';

import { AccessControlService } from '../../@core/access/access-control.service';

// Bloqueio de componente/trecho de tela via template, mesmo mecanismo de
// AccessGuard/Sidebar (AccessControlService.can(), regras em ACCESS_RULES).
// Uso: <button *appCanAccess="'financial-bills.export'">Exportar</button>
// Pra bloqueio imperativo em código (não-template), injetar
// AccessControlService diretamente e chamar .can(key).
@Directive({
  selector: '[appCanAccess]',
  standalone: true,
})
export class CanAccessDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly accessControlService = inject(AccessControlService);
  private hasView = false;

  @Input() set appCanAccess(key: string) {
    const allowed = this.accessControlService.can(key);

    if (allowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!allowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
