import { Component, OnInit } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { take } from 'rxjs';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { RoleService } from '../../../../../../@core/modules/acl/services/role.service';
import { RoleModel } from '../../../../../../@core/modules/acl/entities/role.model';

// Checkbox list (não select2) — essa aba vive dentro do ngbNav (não de um
// ngbAccordionBody), então @for aqui não corre o risco do bug documentado no
// AI_CONTEXT §3.6 (Cannot read properties of undefined (reading 'value'),
// específico de accordion). Também é melhor UX que multi-select pra "0 a N".
@Component({
  selector: 'app-form-roles-user',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  imports: [SharedModule],
})
export class RolesFormUserComponent implements OnInit {
  form: FormGroup;
  roles: RoleModel.Entity[] = [];
  loading = false;
  filterText = '';

  constructor(
    private readonly controlContainer: ControlContainer,
    private readonly roleService: RoleService,
  ) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    this.fetch();
  }

  get filteredRoles(): RoleModel.Entity[] {
    const q = this.filterText.trim().toLowerCase();
    if (!q) return this.roles;

    return this.roles.filter(
      (role) =>
        role.name.toLowerCase().includes(q) ||
        (role.company?.name ?? '').toLowerCase().includes(q),
    );
  }

  label(role: RoleModel.Entity): string {
    return role.company ? `${role.name} — ${role.company.name}` : `${role.name} (Global)`;
  }

  isSelected(id: string): boolean {
    return ((this.form.get('role_ids').value as string[]) ?? []).includes(id);
  }

  toggle(id: string, checked: boolean) {
    const current: string[] = this.form.get('role_ids').value ?? [];
    const next = checked ? [...current, id] : current.filter((x) => x !== id);
    this.form.get('role_ids').setValue(next);
  }

  private fetch() {
    this.loading = true;

    this.roleService
      .list()
      .pipe(take(1))
      .subscribe({
        next: (roles) => {
          this.loading = false;
          this.roles = roles;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
