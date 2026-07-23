import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { FinancialServiceModel } from '../../../../../@core/modules/financial/entities/financial-service.model';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterStore } from '../../_services/filter.store';
import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';

@Component({
  selector: 'app-filter-financial-services',
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
  filter = new FinancialServiceModel.Filter({});
  form: FormGroup;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: FinancialServiceModel.Filter) => {
        this.filter.name = value.name;
        this.filter.company_id = value.company_id;
        this.filter.active = value.active ?? undefined;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      name: [null],
      company_id: [null],
      active: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      name: null,
      company_id: null,
      active: null,
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
