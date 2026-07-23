import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { FinancialBillModel } from '../../../../../@core/modules/financial/entities/financial-bill.model';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CustomerSelectorComponent } from '../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterStore } from '../../_services/filter.store';
import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';

@Component({
  selector: 'app-filter-financial-bills',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports: [
    SharedModule,
    NgbAccordionModule,
    FeatherIcon,
    CompanySelectorComponent,
    CustomerSelectorComponent,
  ],
})
export class FilterComponent {
  filter = new FinancialBillModel.Filter({});
  form: FormGroup;
  // <option> estáticos (sem @for) de propósito: um @for dentro de
  // ngbAccordionBody quebrou a change detection da página inteira em
  // runtime (ver AI_CONTEXT.md — NgbAccordionBody força um detectChanges()
  // síncrono na criação do body que corrompe o "$implicit" do @for, mesmo
  // usando um array plano em vez do pipe keyvalue). Só 4 valores fixos, não
  // vale a pena reintroduzir um loop.
  statusEnum = FinancialBillModel.StatusEnum;
  statusEnumStr = FinancialBillModel.StatusEnumStr;

  companyId: string | null = null;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('customerSelector') customerSelectorRef: CustomerSelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: FinancialBillModel.Filter) => {
        this.filter.company_id = value.company_id;
        this.filter.status = value.status;
        this.filter.code = value.code;
        this.filter.debtor_customer_id = value.debtor_customer_id;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      company_id: [null],
      status: [null],
      code: [null],
      debtor_customer_id: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      company_id: null,
      status: null,
      code: null,
      debtor_customer_id: null,
    });
    this.companyId = null;
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.companyId = entity?.id ?? null;
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('debtor_customer_id').setValue(null);
  }

  onCustomerSelected(entity: CustomerModel.Entity | null) {
    this.form.get('debtor_customer_id').setValue(entity?.id ?? null);
  }

  clear() {
    this.default();
    this.companySelectorRef?.clear();
    this.customerSelectorRef?.clear();
  }
}
