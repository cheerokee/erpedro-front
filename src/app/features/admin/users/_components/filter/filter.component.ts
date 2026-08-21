import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbAccordionModule } from '@ng-bootstrap/ng-bootstrap';

import { UserModel } from '../../../../../@core/modules/account/entities/user.model';
import { RoleModel } from '../../../../../@core/modules/acl/entities/role.model';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { RoleSelectorComponent } from '../../../../../@shared/components/selectors/role-selector/role-selector.component';
import { CompanySelectorComponent } from '../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterStore } from '../../_services/filter.store';
import { FeatherIcon } from '../../../../../@shared/components/ui/feather-icon/feather-icon';

@Component({
  selector: 'app-filter-users',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  imports: [
    SharedModule,
    NgbAccordionModule,
    FeatherIcon,
    RoleSelectorComponent,
    CompanySelectorComponent,
  ],
})
export class FilterComponent {
  filter = new UserModel.Filter({});
  form: FormGroup;

  @ViewChild('roleSelector') roleSelectorRef: RoleSelectorComponent;
  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;

  constructor(
    private filterStore: FilterStore,
    private formBuilder: FormBuilder,
  ) {
    this.define();
    this.filter = this.filterStore.get();

    this.form.valueChanges.subscribe({
      next: (value: UserModel.Filter) => {
        this.filter.q = value.q;
        this.filter.role_id = value.role_id;
        this.filter.company_id = value.company_id;

        this.filterStore.set(this.filter);
      },
    });
  }

  define() {
    this.form = this.formBuilder.group({
      q: [null],
      role_id: [null],
      company_id: [null],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      q: null,
      role_id: null,
      company_id: null,
    });
  }

  onRoleSelected(entity: RoleModel.Entity | null) {
    this.form.get('role_id').setValue(entity?.id ?? null);
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.form.get('company_id').setValue(entity?.id ?? null);
  }

  clear() {
    this.default();
    this.roleSelectorRef?.clear();
    this.companySelectorRef?.clear();
  }
}
