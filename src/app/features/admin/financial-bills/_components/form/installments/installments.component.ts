import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { ControlContainer, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { switchMap, take } from 'rxjs';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { FinancialInstallmentModel } from '../../../../../../@core/modules/financial/entities/financial-installment.model';
import { FinancialTransactionModel } from '../../../../../../@core/modules/financial/entities/financial-transaction.model';
import { FinancialBillModel } from '../../../../../../@core/modules/financial/entities/financial-bill.model';
import { FinancialInstallmentService } from '../../../../../../@core/modules/financial/services/financial-installment.service';
import { FinancialTransactionService } from '../../../../../../@core/modules/financial/services/financial-transaction.service';
import { FinancialBillService } from '../../../../../../@core/modules/financial/services/financial-bill.service';
import { AlertService } from '../../../../../../@core/services/alert.service';

/** Aba "Parcelas" da Fatura — mesmo dual-mode da aba Itens (ver
 * items.component.ts). A parte de "Pagamentos" (registrar um
 * FinancialTransaction contra uma parcela) só existe em modo edição
 * (`billId` já existe): ao concluir um pagamento, este componente
 * orquestra no client a baixa da parcela (`paid_out`/`paid_at`, via
 * FinancialInstallmentService.update) e a situação da fatura
 * (`FinancialBillService.update({status})`) — o backend não faz isso
 * sozinho (FinancialTransactionService.create é um create genérico, sem
 * regra de negócio — ver AI_CONTEXT.md, débito técnico/padrão novo desta
 * tela). Isso é client-orchestrated (não atômico entre os 2-3 requests),
 * mesmo trade-off já aceito em outros fluxos do projeto (sync de endereços,
 * self-register). */
@Component({
  selector: 'app-form-installments-financial-bill',
  templateUrl: './installments.component.html',
  styleUrls: ['./installments.component.scss'],
  imports: [SharedModule],
})
export class InstallmentsComponent implements OnInit {
  form: FormGroup;
  addForm: FormGroup;
  paymentForm: FormGroup;
  installments: FinancialInstallmentModel.Entity[] = [];
  transactionsByInstallmentId: Record<string, FinancialTransactionModel.Entity[]> = {};
  expandedInstallmentId: string | null = null;
  saving = false;
  registeringPayment = false;

  // <option> estáticos (sem @for) — ver comentário em
  // financial-bills/_components/filter/filter.component.ts.
  paymentMethodEnum = FinancialTransactionModel.PaymentMethodEnum;
  paymentMethodEnumStr = FinancialTransactionModel.PaymentMethodEnumStr;
  transactionStatusEnum = FinancialTransactionModel.StatusEnum;
  transactionStatusEnumStr = FinancialTransactionModel.StatusEnumStr;

  @Input() billId: string | null = null;
  @Input() billStatus: FinancialBillModel.StatusEnum | null = null;
  @Output() billStatusChange = new EventEmitter<FinancialBillModel.StatusEnum>();

  constructor(
    private readonly controlContainer: ControlContainer,
    private readonly formBuilder: FormBuilder,
    private readonly installmentService: FinancialInstallmentService,
    private readonly transactionService: FinancialTransactionService,
    private readonly billService: FinancialBillService,
    private readonly alertService: AlertService,
  ) {
    this.defineAddForm();
    this.definePaymentForm();
  }

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    this.reload();
  }

  /** Chamado pelo componente pai sempre que a aba é (re)criada pelo ngbNav. */
  reload() {
    this.expandedInstallmentId = null;
    this.transactionsByInstallmentId = {};

    if (this.billId) {
      this.fetchPersisted();
    } else {
      this.installments = (this.form.get('installments').value ?? []).map(
        (item: any) => FinancialInstallmentModel.Entity.toEntity(item),
      );
    }
  }

  add() {
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    const value = this.addForm.value;

    if (this.billId) {
      this.saving = true;
      this.installmentService
        .create({
          bill_id: this.billId,
          due_date: value.due_date,
          amount: value.amount,
        } as any)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.saving = false;
            this.fetchPersisted();
            this.clearAddForm();
          },
          error: () => {
            this.saving = false;
            this.alertFail('Não foi possível adicionar a parcela');
          },
        });
      return;
    }

    const entity = new FinancialInstallmentModel.Entity({
      number_installment: this.installments.length + 1,
      due_date: value.due_date,
      amount: value.amount,
    } as any);

    this.installments = [...this.installments, entity];
    this.emitChange();
    this.clearAddForm();
  }

  async remove(id: string) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover parcela?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    if (this.billId) {
      this.installmentService
        .delete(id)
        .pipe(take(1))
        .subscribe({
          next: () => this.fetchPersisted(),
          error: () => {
            this.alertFail(
              'Não foi possível remover a parcela (ela pode já ter pagamentos registrados)',
            );
          },
        });
      return;
    }

    this.installments = this.installments
      .filter((installment) => installment.id !== id)
      .map((installment, index) => {
        installment.number_installment = index + 1;
        return installment;
      });
    this.emitChange();
  }

  get total(): number {
    return this.installments.reduce(
      (sum, installment) => sum + Number(installment.amount),
      0,
    );
  }

  toggleExpand(installment: FinancialInstallmentModel.Entity) {
    if (!this.billId) return; // pagamentos só existem depois que a fatura existe

    if (this.expandedInstallmentId === installment.id) {
      this.expandedInstallmentId = null;
      return;
    }

    this.expandedInstallmentId = installment.id;
    this.definePaymentForm(this.remainingBalance(installment));
    this.fetchTransactions(installment.id);
  }

  remainingBalance(installment: FinancialInstallmentModel.Entity): number {
    const concluded = (this.transactionsByInstallmentId[installment.id] ?? [])
      .filter((transaction) => transaction.status === this.transactionStatusEnum.CONCLUDED)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    return Math.max(0, Number(installment.amount) - concluded);
  }

  registerPayment(installment: FinancialInstallmentModel.Entity) {
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const value = this.paymentForm.value;
    this.registeringPayment = true;

    this.transactionService
      .create({
        installment_id: installment.id,
        amount: value.amount,
        payment_method: value.payment_method,
        status: value.status,
      } as any)
      .pipe(
        take(1),
        switchMap(() => this.transactionService.byInstallment(installment.id)),
      )
      .subscribe({
        next: (result) => {
          this.registeringPayment = false;
          const transactions = result.data ?? [];
          this.transactionsByInstallmentId[installment.id] = transactions;
          this.definePaymentForm(this.remainingBalance(installment));
          this.recomputeInstallmentPaidOut(installment, transactions);
        },
        error: () => {
          this.registeringPayment = false;
          this.alertFail('Não foi possível registrar o pagamento');
        },
      });
  }

  private recomputeInstallmentPaidOut(
    installment: FinancialInstallmentModel.Entity,
    transactions: FinancialTransactionModel.Entity[],
  ) {
    const concluded = transactions
      .filter((transaction) => transaction.status === this.transactionStatusEnum.CONCLUDED)
      .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

    // tolerância de 1 centavo, mesmo critério do backend pra bater parcelas x total (FinancialBillService).
    const isPaid = concluded + 0.01 >= Number(installment.amount);

    if (isPaid === !!installment.paid_out) return;

    this.installmentService
      .update(installment.id, {
        paid_out: isPaid,
        paid_at: isPaid ? (new Date().toISOString() as any) : null,
      } as any)
      .pipe(take(1))
      .subscribe({
        next: () => {
          installment.paid_out = isPaid;
          installment.paid_at = isPaid ? new Date() : null;
          this.recomputeBillStatus();
        },
        error: () => {
          this.alertFail(
            'Pagamento registrado, mas não foi possível atualizar a situação da parcela',
          );
        },
      });
  }

  private recomputeBillStatus() {
    if (!this.billId) return;
    if (this.billStatus === FinancialBillModel.StatusEnum.CANCELED) return;

    const allPaid =
      this.installments.length > 0 && this.installments.every((installment) => installment.paid_out);
    const anyPaid = this.installments.some((installment) => installment.paid_out);

    const newStatus = allPaid
      ? FinancialBillModel.StatusEnum.PAID
      : anyPaid
        ? FinancialBillModel.StatusEnum.PARTIALLY_PAID
        : FinancialBillModel.StatusEnum.OPEN;

    if (newStatus === this.billStatus) return;

    this.billService
      .update(this.billId, { status: newStatus })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.billStatus = newStatus;
          this.billStatusChange.emit(newStatus);
        },
      });
  }

  private fetchPersisted() {
    this.installmentService
      .byBill(this.billId as string)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.installments = result.data ?? [];
        },
      });
  }

  private fetchTransactions(installmentId: string) {
    this.transactionService
      .byInstallment(installmentId)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.transactionsByInstallmentId[installmentId] = result.data ?? [];
        },
      });
  }

  private emitChange() {
    this.form
      .get('installments')
      .setValue(this.installments.map((installment) => installment.toModel()));
  }

  private defineAddForm() {
    this.addForm = this.formBuilder.group({
      due_date: [null, Validators.required],
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });
  }

  private clearAddForm() {
    this.addForm.reset({ due_date: null, amount: null });
  }

  private definePaymentForm(defaultAmount: number | null = null) {
    this.paymentForm = this.formBuilder.group({
      amount: [defaultAmount, [Validators.required, Validators.min(0.01)]],
      payment_method: [
        FinancialTransactionModel.PaymentMethodEnum.CASH,
        Validators.required,
      ],
      status: [
        FinancialTransactionModel.StatusEnum.CONCLUDED,
        Validators.required,
      ],
    });
  }

  private alertFail(text: string) {
    this.alertService.alert({
      title: 'Ops, houve um erro!',
      text,
      icon: 'error',
      timer: 3000,
    });
  }
}
