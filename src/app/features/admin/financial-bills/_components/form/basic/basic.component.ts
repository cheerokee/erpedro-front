import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { CompanySelectorComponent } from '../../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CustomerSelectorComponent } from '../../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CompanyModel } from '../../../../../../@core/modules/company/entities/company.model';
import { CustomerModel } from '../../../../../../@core/modules/general/entities/customer.model';
import { FinancialBillModel } from '../../../../../../@core/modules/financial/entities/financial-bill.model';

@Component({
  selector: 'app-form-basic-financial-bill',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  imports: [SharedModule, CompanySelectorComponent, CustomerSelectorComponent],
})
export class BasicFormFinancialBillComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  // <option> estáticos (sem @for) — ver comentário em
  // financial-bills/_components/filter/filter.component.ts.
  statusEnum = FinancialBillModel.StatusEnum;
  statusEnumStr = FinancialBillModel.StatusEnumStr;
  companyId: string | null = null;

  /** true quando a fatura já existe — devedor/paróquia deixam de ser
   * selecionáveis (mudar quem deve numa fatura já emitida é um caso de
   * borda fora de escopo por ora, ver AI_CONTEXT.md). */
  @Input() editMode = false;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('customerSelector') customerSelectorRef: CustomerSelectorComponent;

  constructor(
    private readonly controlContainer: ControlContainer,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    this.companyId = this.form.get('company_id').value;
  }

  ngAfterViewInit() {
    this.autoset();
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.companyId = entity?.id ?? null;
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('company_id').markAsTouched();
    this.form.get('customer_id').setValue(null);
  }

  onCustomerSelected(entity: CustomerModel.Entity | null) {
    this.form.get('customer_id').setValue(entity?.id ?? null);
    this.form.get('customer_id').markAsTouched();
  }

  /** Reaplica a pré-seleção quando o ngbNav recria esta aba (destroyOnHide) —
   * mesma técnica de encadeamento país->estado->cidade (AI_CONTEXT.md §3.2):
   * o reset automático do customer-selector ao mudar [companyId] só some
   * depois de um detectChanges(), então o autoset da paróquia precisa
   * "assentar" antes do autoset do paroquiano. */
  autoset() {
    const companyId = this.form.get('company_id').value;
    const customerId = this.form.get('customer_id').value;

    this.companyId = companyId;
    if (companyId) this.companySelectorRef?.autoset(companyId);
    this.cdr.detectChanges();

    if (customerId) this.customerSelectorRef?.autoset(customerId);
  }
}
