import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, take } from 'rxjs';

import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';
import { AuthenticatedUser } from '../../../../../@core/services/auth.service';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { SharedModule } from '../../../../../@shared/shared.module';

import { BaptismService } from '../../../../../@core/modules/parishioner/services/baptism.service';
import { BaptismModel } from '../../../../../@core/modules/parishioner/entities/baptism.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CustomerSelectorComponent } from '../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';

export type FormDataBaptism = BaptismModel.JsonProps;

@Component({
  selector: 'app-form-baptisms',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [SharedModule, CustomerSelectorComponent, CompanySelectorComponent],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  authenticatedUser: AuthenticatedUser;
  saving = false;

  companyId: string | null = null;

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('parishionerSelector')
  parishionerSelectorRef: CustomerSelectorComponent;

  constructor(
    private formBuilder: FormBuilder,
    private baptismService: BaptismService,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
  ) {
    this.define();
  }

  ngOnInit() {
    this.authenticatedUser = getAuthenticatedUser();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['id'] &&
      changes['id'].previousValue !== changes['id'].currentValue
    ) {
      if (this.id) {
        this.load();
      } else {
        this.default();
      }
    }
  }

  define() {
    this.form = this.formBuilder.group({
      id: [null],
      baptism_place: [null, Validators.required],
      baptism_date: [null, Validators.required],
      observation: [null],
      parishioner_id: [null, Validators.required],
      company_id: [null, Validators.required],
    });

    this.default();
  }

  default() {
    this.companyId = null;

    this.form.setValue({
      id: null,
      baptism_place: null,
      baptism_date: null,
      observation: null,
      parishioner_id: null,
      company_id: null,
    });
  }

  load() {
    const obs$: Observable<ResultModel<BaptismModel.JsonProps>> =
      this.baptismService.get(this.id);

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { company, parishioner, ...otherData } = result.data;

          this.companyId = otherData.company_id ?? company?.id ?? null;
          // Capturado antes do detectChanges() abaixo — o reset do
          // parishioner-selector (disparado por ele) zera parishioner_id no
          // próprio form via onParishionerSelected(null), então reler
          // form.get('parishioner_id').value depois do detectChanges() já
          // pegaria null em vez do valor carregado.
          const parishionerId =
            otherData.parishioner_id ?? parishioner?.id ?? null;

          this.form.setValue({
            id: otherData.id,
            baptism_place: otherData.baptism_place ?? null,
            baptism_date: otherData.baptism_date ?? null,
            observation: otherData.observation ?? null,
            parishioner_id: parishionerId,
            company_id: this.companyId,
          });

          // Força o reset automático do parishioner-selector (dispara via
          // ngOnChanges quando o [companyId] muda, ver AI_CONTEXT §3.2) a
          // acontecer antes dos autoset explícitos abaixo, senão ele pode
          // sobrescrever a pré-seleção correta com null.
          this.cdr.detectChanges();

          if (this.companyId) this.companySelectorRef?.autoset(this.companyId);
          if (parishionerId)
            this.parishionerSelectorRef?.autoset(parishionerId);
        }
      },
      error: () => {
        this.alertService.alert({
          title: 'Ops, houve um erro!',
          text: 'Não foi possível carregar o registro',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data: FormDataBaptism = { ...this.form.value };
    // company_id é enviado normalmente (CreateBaptismDto/UpdateBaptismDto
    // aceitam, igual Customer/Employee) — pra usuário comum (tenant
    // resolvido) o backend ignora e sempre stampa a partir do próprio
    // contexto (BaseCrudService.tenantStamp); pra superadmin (sem tenant
    // resolvido) é o único jeito de informar em qual paróquia o batismo está
    // sendo registrado, já que tenantStamp não faz nada nesse caso.

    let obs$: Observable<ResultModel<any>>;

    this.saving = true;

    if (data.id) {
      const id = data.id;
      delete data.id;
      obs$ = this.baptismService.update(id, data);
    } else {
      delete data.id;
      obs$ = this.baptismService.create(data);
    }

    obs$.pipe(take(1)).subscribe({
      next: () => {
        this.saving = false;
        this.alertService.alert({
          title: 'Sucesso',
          text: 'Registro salvo com sucesso',
          icon: 'success',
          timer: 3000,
        });
        this.default();
        this.onSave.emit();
      },
      error: () => {
        this.saving = false;
        this.alertService.alert({
          title: 'Ops, houve um erro!',
          text: 'Não foi possível cadastrar ou atualizar o registro',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.companyId = entity?.id ?? null;
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('company_id').markAsTouched();
    this.form.get('parishioner_id').setValue(null);
  }

  onParishionerSelected(entity: CustomerModel.Entity | null) {
    this.form.get('parishioner_id').setValue(entity?.id ?? null);
    this.form.get('parishioner_id').markAsTouched();
  }
}
