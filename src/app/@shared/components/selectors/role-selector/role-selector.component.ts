import { Component, EventEmitter, OnDestroy, OnInit, Output, Input } from '@angular/core';
import { Select2Data, Select2Module, Select2UpdateEvent } from 'ng-select2-component';
import { Subject, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import { RoleService } from '../../../../@core/modules/acl/services/role.service';
import { RoleModel } from '../../../../@core/modules/acl/entities/role.model';

// Diferente dos demais seletores (seção 3.1 do AI_CONTEXT), não depende de
// `companyId`: um usuário pode ter roles de várias paróquias ao mesmo tempo,
// então o catálogo de roles é buscado inteiro de uma vez (RoleService.list,
// sem paginação — mesmo espírito do financial-service-selector) e filtrado
// localmente pelo próprio <select2> conforme o usuário digita.
@Component({
  selector: 'app-role-selector',
  templateUrl: './role-selector.component.html',
  styleUrls: ['./role-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class RoleSelectorComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Selecione um perfil';
  @Output() selected = new EventEmitter<RoleModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private roles: RoleModel.Entity[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly roleService: RoleService) {}

  ngOnInit() {
    this.isLoading = true;

    this.roleService
      .list()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (roles) => {
          this.isLoading = false;
          this.setRoles(roles);
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const role = this.roles.find((role) => role.id === event.value) ?? null;

    this.selected.emit(role);
  }

  /** Preseleciona um perfil por id (uso em telas de edição/filtro persistido). */
  autoset(id: string) {
    if (!id) return;

    const cached = this.roles.find((role) => role.id === id);
    if (cached) {
      this.value = id;
      this.selected.emit(cached);
    }
  }

  clear() {
    this.value = null;
    this.selected.emit(null);
  }

  private setRoles(roles: RoleModel.Entity[]) {
    this.roles = roles;
    this.data = roles.map((role) => ({
      id: role.id,
      value: role.id,
      label: role.company ? `${role.name} — ${role.company.name}` : `${role.name} (Global)`,
    }));
  }
}
