import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { FinancialServiceSelectorComponent } from '../../../../../../@shared/components/selectors/financial-service-selector/financial-service-selector.component';
import { FinancialBillItemModel } from '../../../../../../@core/modules/financial/entities/financial-bill-item.model';
import { FinancialServiceModel } from '../../../../../../@core/modules/financial/entities/financial-service.model';
import { FinancialBillItemService } from '../../../../../../@core/modules/financial/services/financial-bill-item.service';
import { AlertService } from '../../../../../../@core/services/alert.service';

/** Aba "Itens" da Fatura — dual-mode (ver AI_CONTEXT.md, padrão novo desta
 * tela): sem `billId` (fatura ainda não existe) a lista vive só em memória e
 * é sincronizada no controle `items` do form pai, enviada junto no POST de
 * criação (CreateFinancialBillDto.items — ver FinancialBillService.create,
 * backend). Com `billId` (edição), cada ação chama
 * FinancialBillItemService diretamente — a fatura já existe, então não faz
 * sentido acumular em memória e esperar um "Salvar" geral. Diferente do
 * padrão de Address (seção 3.2), que sempre sincroniza no submit do pai. */
@Component({
  selector: 'app-form-items-financial-bill',
  templateUrl: './items.component.html',
  styleUrls: ['./items.component.scss'],
  imports: [SharedModule, FinancialServiceSelectorComponent],
})
export class ItemsComponent implements OnInit {
  form: FormGroup;
  addForm: FormGroup;
  items: FinancialBillItemModel.Entity[] = [];
  selectedService: FinancialServiceModel.Entity | null = null;
  saving = false;

  @Input() billId: string | null = null;
  @Input() companyId: string | null = null;

  constructor(
    private readonly controlContainer: ControlContainer,
    private readonly formBuilder: FormBuilder,
    private readonly financialBillItemService: FinancialBillItemService,
    private readonly alertService: AlertService,
  ) {
    this.defineAddForm();
  }

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    this.reload();
  }

  /** Reaplica a lista quando o ngbNav recria esta aba (destroyOnHide) —
   * chamado pelo componente pai (form.component.ts) no mesmo ciclo em que
   * chama o autoset das demais abas. */
  reload() {
    if (this.billId) {
      this.fetchPersisted();
    } else {
      this.items = (this.form.get('items').value ?? []).map((item: any) =>
        FinancialBillItemModel.Entity.toEntity(item),
      );
    }
  }

  onServiceSelected(entity: FinancialServiceModel.Entity | null) {
    this.selectedService = entity;
    this.addForm.get('service_id').setValue(entity?.id ?? null);
    this.addForm.get('service_id').markAsTouched();

    if (entity && !this.addForm.get('unit_price').value) {
      this.addForm.get('unit_price').setValue(entity.price);
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
      this.financialBillItemService
        .create({
          bill_id: this.billId,
          service_id: value.service_id,
          quantity: value.quantity,
          unit_price: value.unit_price,
          description: value.description,
        } as any)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.saving = false;
            this.fetchPersisted();
            this.clearAddForm();
          },
          error: (err) => {
            this.saving = false;
            this.alertService.alertError(err, 'Não foi possível adicionar o item');
          },
        });
      return;
    }

    const entity = new FinancialBillItemModel.Entity({
      quantity: value.quantity,
      unit_price: value.unit_price,
      description: value.description,
      service_id: value.service_id,
      service: this.selectedService ?? undefined,
    } as any);

    this.items = [...this.items, entity];
    this.emitChange();
    this.clearAddForm();
  }

  async remove(id: string) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover item?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    if (this.billId) {
      this.financialBillItemService
        .delete(id)
        .pipe(take(1))
        .subscribe({
          next: () => this.fetchPersisted(),
          error: (err) => {
            this.alertService.alertError(err, 'Não foi possível remover o item');
          },
        });
      return;
    }

    this.items = this.items.filter((item) => item.id !== id);
    this.emitChange();
  }

  get total(): number {
    return this.items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  }

  private fetchPersisted() {
    this.financialBillItemService
      .byBill(this.billId as string)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.items = result.data ?? [];
        },
      });
  }

  private emitChange() {
    this.form
      .get('items')
      .setValue(this.items.map((item) => item.toModel()));
  }

  private defineAddForm() {
    this.addForm = this.formBuilder.group({
      service_id: [null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unit_price: [null, [Validators.required, Validators.min(0)]],
      description: [null],
    });
  }

  private clearAddForm() {
    this.addForm.reset({
      service_id: null,
      quantity: 1,
      unit_price: null,
      description: null,
    });
    this.selectedService = null;
  }
}
