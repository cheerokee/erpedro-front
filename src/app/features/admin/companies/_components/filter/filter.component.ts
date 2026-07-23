import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterStore } from '../../_services/filter.store';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { UserSelectorComponent } from '../../../../../@shared/components/selectors/user-selector/user-selector.component';
import { UserModel } from '../../../../../@core/modules/account/entities/user.model';

@Component({
  selector: 'app-filter-companies',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports: [
    SharedModule,
    NgbAccordionModule,
    FeatherIcon,
    UserSelectorComponent,
  ],
})
export class FilterComponent {
  filter = new CompanyModel.Filter({});
  form: FormGroup;

  @ViewChild('userSelector') userSelector: UserSelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: CompanyModel.Filter) => {
        this.filter.name = value.name;
        this.filter.owner_id = value.owner_id;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      name: [null],
      owner_id: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      name: null,
      owner_id: null,
    });
  }

  onOwnerSelected(entity: UserModel.Entity | null) {
    this.form.get('owner_id').setValue(entity?.id ?? null);
  }

  clear() {
    this.default();
    this.userSelector?.clear();
  }
}
