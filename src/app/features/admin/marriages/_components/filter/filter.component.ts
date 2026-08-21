import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../../../../@shared/shared.module';

import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';
import { MarriageModel } from '../../../../../@core/modules/parishioner/entities/marriage.model';
import { FilterStore } from '../../_services/filter.store';

@Component({
  selector: 'app-filter-marriages',
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
  filter = new MarriageModel.Filter({});
  form: FormGroup;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: MarriageModel.Filter) => {
        this.filter.company_id = value.company_id;
        this.filter.marriage_place = value.marriage_place;
        this.filter.marriage_date = value.marriage_date;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      company_id: [null],
      marriage_place: [null],
      marriage_date: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      company_id: null,
      marriage_place: null,
      marriage_date: null,
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
