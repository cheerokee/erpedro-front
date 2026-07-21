import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterStore } from '../../_services/filter.store';
import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';

@Component({
  selector: 'app-filter-parishioners',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports: [
    SharedModule,
    NgbAccordionModule,
    FeatherIcon,
    CompanySelectorComponent,
  ],
})
export class FilterComponent {
  filter = new CustomerModel.Filter({});
  form: FormGroup;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: CustomerModel.Filter) => {
        this.filter.name = value.name;
        this.filter.document = value.document;
        this.filter.user_id = value.user_id;
        this.filter.company_id = value.company_id;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      name: [null],
      document: [null],
      user_id: [null],
      company_id: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      name: null,
      document: null,
      user_id: null,
      company_id: null,
    });
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.form.get('company_id').setValue(entity?.id ?? null);
  }

  clear() {
    this.default();
    this.companySelectorRef?.clear();
  }
}
