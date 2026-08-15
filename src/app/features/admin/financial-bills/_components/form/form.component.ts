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
import { forkJoin, Observable, switchMap, take } from 'rxjs';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLink,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';

import { FinancialBillService } from '../../../../../@core/modules/financial/services/financial-bill.service';
import { FinancialActorService } from '../../../../../@core/modules/financial/services/financial-actor.service';
import { FinancialBillModel } from '../../../../../@core/modules/financial/entities/financial-bill.model';
import { IVerticalValidation } from '../../../../../@shared/interface/form-layout';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ResultModel } from '../../../../../@core/models/result.model';
import { BasicFormFinancialBillComponent } from './basic/basic.component';
import { ItemsComponent } from './items/items.component';
import { InstallmentsComponent } from './installments/installments.component';
import { SharedModule } from '../../../../../@shared/shared.module';

export enum FinancialBillTabEnum {
  BASIC = 'BASIC',
  ITEMS = 'ITEMS',
  INSTALLMENTS = 'INSTALLMENTS',
}

export enum FinancialBillTabEnumTitle {
  BASIC = 'Dados Gerais',
  ITEMS = 'Itens',
  INSTALLMENTS = 'Parcelas / Pagamentos',
}

export enum FinancialBillTabEnumText {
  BASIC = 'Devedor, emissão, total',
  ITEMS = 'Serviços cobrados (opcional)',
  INSTALLMENTS = 'Parcelas e registro de pagamentos',
}

@Component({
  selector: 'app-form-financial-bills',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
    BasicFormFinancialBillComponent,
    ItemsComponent,
    InstallmentsComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  billTabEnum = FinancialBillTabEnum;
  verticalValidation: IVerticalValidation[] = [
    {
      id: 1,
      title: FinancialBillTabEnumTitle.BASIC,
      value: FinancialBillTabEnum.BASIC,
      text: FinancialBillTabEnumText.BASIC,
      class: 'file-text',
    },
    {
      id: 2,
      title: FinancialBillTabEnumTitle.ITEMS,
      value: FinancialBillTabEnum.ITEMS,
      text: FinancialBillTabEnumText.ITEMS,
      class: 'list',
    },
    {
      id: 3,
      title: FinancialBillTabEnumTitle.INSTALLMENTS,
      value: FinancialBillTabEnum.INSTALLMENTS,
      text: FinancialBillTabEnumText.INSTALLMENTS,
      class: 'dollar-sign',
    },
  ];
  active = 1;
  saving = false;

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();

  @ViewChild('formBasic') formBasic: BasicFormFinancialBillComponent;
  @ViewChild('formItems') formItems: ItemsComponent;
  @ViewChild('formInstallments') formInstallments: InstallmentsComponent;

  constructor(
    private formBuilder: FormBuilder,
    private financialBillService: FinancialBillService,
    private financialActorService: FinancialActorService,
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
      release_date: [null, Validators.required],
      total: [0],
      status: [FinancialBillModel.StatusEnum.OPEN],
      company_id: [null, Validators.required],
      customer_id: [null, Validators.required],
      items: [[]],
      installments: [[]],
    });

    this.default();

    // Enquanto a fatura ainda não existe, total é sempre derivado das
    // parcelas em memória (não editável — ver basic.component.html). Depois
    // de criada, total vira um campo livre (mesmo trade-off do backend —
    // FinancialBillService não recalcula total a partir de installments/items
    // depois da criação, ver AI_CONTEXT.md do backend §10).
    this.form.get('installments').valueChanges.subscribe((installments) => {
      if (this.form.get('id').value) return;

      const total = (installments ?? []).reduce(
        (sum: number, installment: any) => sum + Number(installment.amount ?? 0),
        0,
      );
      this.form.get('total').setValue(total, { emitEvent: false });
    });
  }

  default() {
    this.active = 1;

    this.form.setValue({
      id: null,
      release_date: null,
      total: 0,
      status: FinancialBillModel.StatusEnum.OPEN,
      company_id: null,
      customer_id: null,
      items: [],
      installments: [],
    });

    // Seletores/listas das abas filhas mantêm estado próprio — setValue()
    // acima não limpa a exibição sozinho (ver AI_CONTEXT.md).
    this.formBasic?.autoset();
    this.formItems?.reload();
    this.formInstallments?.reload();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  load() {
    const obs$: Observable<ResultModel<FinancialBillModel.JsonProps>> =
      this.financialBillService.get(this.id);

    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const data = result.data;

          this.form.setValue({
            id: data.id,
            release_date: data.release_date,
            total: data.total,
            status: data.status,
            company_id: data.company_id ?? data.company?.id ?? null,
            customer_id:
              data.debtor?.customer?.id ?? data.debtor?.customer_id ?? null,
            items: data.items ?? [],
            installments: data.installments ?? [],
          });

          this.formBasic?.autoset();
          this.formItems?.reload();
          this.formInstallments?.reload();
        }
      },
      error: (err) => {
        this.alertService.alertError(err, 'Não foi possível carregar o registro');
      },
    });
  }

  onBillStatusChange(status: FinancialBillModel.StatusEnum) {
    this.form.get('status').setValue(status, { emitEvent: false });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.value;

    if (value.id) {
      this.saving = true;
      this.financialBillService
        .updateBill(value.id, {
          release_date: value.release_date,
          total: value.total,
          status: value.status,
        })
        .pipe(take(1))
        .subscribe({
          next: () => this.saveSuccess(),
          error: (err) => this.saveFail(err),
        });
      return;
    }

    const installments = value.installments ?? [];

    if (installments.length === 0) {
      this.alertService.alert({
        title: 'Parcelas obrigatórias',
        text: 'Adicione ao menos uma parcela antes de salvar (aba Parcelas).',
        icon: 'warning',
        timer: 3000,
      });
      return;
    }

    this.saving = true;

    forkJoin({
      debtor: this.financialActorService.getOrCreateForCustomer(value.customer_id),
      creditor: this.financialActorService.getOrCreateForCompany(value.company_id),
    })
      .pipe(
        take(1),
        switchMap(({ debtor, creditor }) => {
          const total = installments.reduce(
            (sum: number, installment: any) => sum + Number(installment.amount ?? 0),
            0,
          );
          const items = (value.items ?? []).map((item: any) => ({
            service_id: item.service_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            description: item.description,
          }));

          return this.financialBillService.createBill({
            release_date: value.release_date,
            total,
            debtor_id: debtor.data.id,
            creditor_id: creditor.data.id,
            company_id: value.company_id,
            installments: installments.map((installment: any) => ({
              due_date: installment.due_date,
              amount: installment.amount,
            })),
            ...(items.length > 0 && { items }),
          });
        }),
      )
      .subscribe({
        next: () => this.saveSuccess(),
        error: () => this.saveFail(),
      });
  }

  private saveSuccess() {
    this.saving = false;
    this.alertService.alert({
      title: 'Sucesso',
      text: 'Registro salvo com sucesso',
      icon: 'success',
      timer: 3000,
    });
    this.default();
    this.onSave.emit();
  }

  private saveFail(err?: any) {
    this.saving = false;
    this.alertService.alertError(err, 'Não foi possível cadastrar ou atualizar o registro');
  }
}
