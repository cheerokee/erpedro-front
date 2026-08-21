import {
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
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLink,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';

import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';
import { IVerticalValidation } from '../../../../../@shared/interface/form-layout';
import { AuthenticatedUser } from '../../../../../@core/services/auth.service';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { SharedModule } from '../../../../../@shared/shared.module';

import { CompanyService } from '../../../../../@core/modules/company/services/company.service';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { BasicFormCompanyComponent } from './basic/basic.component';

export enum CompanyTabEnum {
  BASIC = 'BASIC',
}

export enum CompanyTabEnumTitle {
  BASIC = 'Dados Básicos',
}

export enum CompanyTabEnumText {
  BASIC = 'Nome, etc.',
}

export type FormDataCompany = CompanyModel.JsonProps;

@Component({
  selector: 'app-form-companies',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
    BasicFormCompanyComponent,
    BasicFormCompanyComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  companyTabEnum = CompanyTabEnum;
  verticalValidation: IVerticalValidation[] = [
    {
      id: 1,
      title: CompanyTabEnumTitle.BASIC,
      value: CompanyTabEnum.BASIC,
      text: CompanyTabEnumText.BASIC,
      class: 'user',
    },
  ];
  active = 1;
  authenticatedUser: AuthenticatedUser;
  saving = false;

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();
  @ViewChild('formBasic') formBasic: BasicFormCompanyComponent;

  constructor(
    private formBuilder: FormBuilder,
    private companyService: CompanyService,
    private alertService: AlertService,
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
      this.active = 1;

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
      name: [null, Validators.required],
      owner_id: [null],
    });

    this.default();
  }

  default() {
    this.active = 1;

    this.form.setValue({
      id: null,
      name: null,
      owner_id: null,
    });

    // O userSelector mantém rótulo exibido em estado próprio — setValue()
    // acima não limpa a exibição sozinho (ver AI_CONTEXT.md).
    this.formBasic?.autoset(null);
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  load() {
    const obs$: Observable<ResultModel<CompanyModel.JsonProps>> = this.companyService.get(this.id);

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { owner, ...otherData } = result.data;

          this.form.setValue({
            id: otherData.id,
            name: otherData.name ?? null,
            owner_id: otherData.owner_id ?? owner?.id ?? null,
          });

          this.formBasic?.autoset(this.form.get('owner_id').value);
        }
      },
      error: (err) => {
        this.alertService.alertError(err, 'Não foi possível carregar o registro');
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data: FormDataCompany = { ...this.form.value };

    let obs$: Observable<ResultModel<any>>;

    this.saving = true;

    if (data.id) {
      const id = data.id;
      delete data.id;
      obs$ = this.companyService.update(id, data);
    } else {
      delete data.id;
      obs$ = this.companyService.create(data);
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
      error: (err) => {
        this.saving = false;
        this.alertService.alertError(err, 'Não foi possível cadastrar ou atualizar o registro');
      },
    });
  }
}
