import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';

import { AlertService } from '../../../../../@core/services/alert.service';
import { SharedModule } from '../../../../../@shared/shared.module';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { HoldingSelectorComponent } from '../../../../../@shared/components/selectors/holding-selector/holding-selector.component';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { HoldingModel } from '../../../../../@core/modules/company/entities/holding.model';
import { InviteService } from '../../../../../@core/modules/acl/services/invite.service';
import { InviteModel } from '../../../../../@core/modules/acl/entities/invite.model';

// Sem abas/sub-form (diferente de companies/users): Invite tem 4 campos e
// nenhum motivo pra crescer em seções — replicar o vertical-wizard aqui
// seria abstração sem necessidade comprovada.
@Component({
  selector: 'app-form-invites',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [SharedModule, CompanySelectorComponent, HoldingSelectorComponent],
})
export class FormComponent {
  form: FormGroup;
  saving = false;
  roleTypeEnum = InviteModel.RoleTypeEnum;

  @Output() onSave = new EventEmitter<void>();

  @ViewChild('companySelector') companySelector: CompanySelectorComponent;
  @ViewChild('holdingSelector') holdingSelector: HoldingSelectorComponent;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly inviteService: InviteService,
    private readonly alertService: AlertService,
  ) {
    this.define();
  }

  define() {
    this.form = this.formBuilder.group({
      email: [null, [Validators.required, Validators.email]],
      role_type: [InviteModel.RoleTypeEnum.EMPLOYEE, Validators.required],
      company_id: [null],
      holding_id: [null],
    });
  }

  default() {
    this.form.reset({
      email: null,
      role_type: InviteModel.RoleTypeEnum.EMPLOYEE,
      company_id: null,
      holding_id: null,
    });
    this.companySelector?.clear();
    this.holdingSelector?.clear();
  }

  // Convite não pode ter company_id e holding_id ao mesmo tempo (regra do
  // backend, ver InviteService.assertValidScope) — escolher um dos dois
  // seletores limpa o outro, no form e visualmente.
  onCompanySelected(company: CompanyModel.Entity | null) {
    this.form.patchValue({ company_id: company?.id ?? null });
    if (company) {
      this.form.patchValue({ holding_id: null });
      this.holdingSelector?.clear();
    }
  }

  onHoldingSelected(holding: HoldingModel.Entity | null) {
    this.form.patchValue({ holding_id: holding?.id ?? null });
    if (holding) {
      this.form.patchValue({ company_id: null });
      this.companySelector?.clear();
    }
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, role_type, company_id, holding_id } = this.form.value;

    this.saving = true;

    this.inviteService
      .create({
        email,
        role_type,
        company_id: company_id || undefined,
        holding_id: holding_id || undefined,
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Convite enviado',
            text: 'Enviamos um e-mail com o link de convite.',
            icon: 'success',
            timer: 3000,
          });
          this.default();
          this.onSave.emit();
        },
        error: (err) => {
          this.saving = false;
          this.alertService.alertError(err, 'Não foi possível enviar o convite');
        },
      });
  }
}
