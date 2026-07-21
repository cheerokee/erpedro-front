import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterStore } from '../../_services/filter.store';

import { AddressModel } from '../../../../../@core/modules/address/entities/address.model';

@Component({
  selector: 'app-filter-addresses',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports: [SharedModule, NgbAccordionModule, FeatherIcon],
  providers: [FilterStore],
})
export class FilterComponent {
  filter = new AddressModel.Filter({});
  form: FormGroup;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: AddressModel.Filter) => {
        this.filter.customer_id = value.customer_id;
        this.filter.employee_id = value.employee_id;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      customer_id: [null],
      employee_id: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      customer_id: null,
      employee_id: null,
    });
  }

  clear() {
    this.default();
  }
}
