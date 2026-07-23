import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { CompanySelectorComponent } from '../../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CompanyModel } from '../../../../../../@core/modules/company/entities/company.model';

@Component({
  selector: 'app-form-basic-financial-service',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  imports: [SharedModule, CompanySelectorComponent],
})
export class BasicFormFinancialServiceComponent implements OnInit, AfterViewInit {
  form: FormGroup;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;

  constructor(private readonly controlContainer: ControlContainer) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
  }

  ngAfterViewInit() {
    this.autoset(this.form.get('company_id').value);
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('company_id').markAsTouched();
  }

  /** Preseleciona a paróquia em telas de edição — chamado pelo componente pai. */
  autoset(companyId: string | null) {
    if (companyId) this.companySelectorRef?.autoset(companyId);
  }
}
