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

import { FinancialServiceService } from '../../../../../@core/modules/financial/services/financial-service.service';
import { FinancialServiceModel } from '../../../../../@core/modules/financial/entities/financial-service.model';
import { IVerticalValidation } from '../../../../../@shared/interface/form-layout';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { BasicFormFinancialServiceComponent } from './basic/basic.component';
import { SharedModule } from '../../../../../@shared/shared.module';

export enum FinancialServiceTabEnum {
  BASIC = 'BASIC',
}

export enum FinancialServiceTabEnumTitle {
  BASIC = 'Dados Básicos',
}

export enum FinancialServiceTabEnumText {
  BASIC = 'Nome, preço, etc.',
}

export type FormDataFinancialService = FinancialServiceModel.JsonProps;

@Component({
  selector: 'app-form-financial-services',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
    BasicFormFinancialServiceComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  financialServiceTabEnum = FinancialServiceTabEnum;
  verticalValidation: IVerticalValidation[] = [
    {
      id: 1,
      title: FinancialServiceTabEnumTitle.BASIC,
      value: FinancialServiceTabEnum.BASIC,
      text: FinancialServiceTabEnumText.BASIC,
      class: 'dollar-sign',
    },
  ];
  active = 1;
  saving = false;

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();
  @ViewChild('formBasic') formBasic: BasicFormFinancialServiceComponent;

  constructor(
    private formBuilder: FormBuilder,
    private financialServiceService: FinancialServiceService,
    private alertService: AlertService,
  ) {
    this.define();
  }

  ngOnInit() {}

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
      description: [null],
      price: [null, [Validators.required, Validators.min(0)]],
      active: [true],
      company_id: [null, Validators.required],
    });

    this.default();
  }

  default() {
    this.active = 1;

    this.form.setValue({
      id: null,
      name: null,
      description: null,
      price: null,
      active: true,
      company_id: null,
    });

    // O companySelector mantém rótulo exibido em estado próprio — setValue()
    // acima não limpa a exibição sozinho (ver AI_CONTEXT.md).
    this.formBasic?.autoset(null);
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  load() {
    const obs$: Observable<ResultModel<FinancialServiceModel.JsonProps>> =
      this.financialServiceService.get(this.id);

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { company, ...otherData } = result.data;

          this.form.setValue({
            id: otherData.id,
            name: otherData.name ?? null,
            description: otherData.description ?? null,
            price: otherData.price ?? null,
            active: otherData.active ?? true,
            company_id: otherData.company_id ?? company?.id ?? null,
          });

          this.formBasic?.autoset(this.form.get('company_id').value);
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

    const data: FormDataFinancialService = { ...this.form.value };

    let obs$: Observable<ResultModel<any>>;

    this.saving = true;

    if (data.id) {
      const id = data.id;
      delete data.id;
      obs$ = this.financialServiceService.update(id, data);
    } else {
      delete data.id;
      obs$ = this.financialServiceService.create(data);
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
