import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../../../../@shared/shared.module';

import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';
import { FirstCommunionModel } from '../../../../../@core/modules/parishioner/entities/first-communion.model';
import { FilterStore } from '../../_services/filter.store';
import { CustomerSelectorComponent } from '../../../../../@shared/components/selectors/customer-selector/customer-selector.component';

@Component({
  selector: 'app-filter-first-communions',
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
  filter = new FirstCommunionModel.Filter({});
  form: FormGroup;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('parishionerSelector')
  parishionerSelectorRef: CustomerSelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: FirstCommunionModel.Filter) => {
        this.filter.company_id = value.company_id;
        this.filter.parishioner_id = value.parishioner_id;
        this.filter.first_communion_place = value.first_communion_place;
        this.filter.first_communion_date = value.first_communion_date;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      company_id: [null],
      parishioner_id: [null],
      first_communion_place: [null],
      first_communion_date: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      company_id: null,
      parishioner_id: null,
      first_communion_place: null,
      first_communion_date: null,
    });
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('parishioner_id').setValue(null);
    this.parishionerSelectorRef?.clear();
  }

  onParishionerSelected(entity: CustomerModel.Entity | null) {
    this.form.get('parishioner_id').setValue(entity?.id ?? null);
  }

  clear() {
    this.default();
    this.companySelectorRef?.clear();
    this.parishionerSelectorRef?.clear();
  }
}
