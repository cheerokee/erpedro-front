import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';

import { SharedModule } from '../../../../../../@shared/shared.module';
import { CompanySelectorComponent } from '../../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { CompanyModel } from '../../../../../../@core/modules/company/entities/company.model';
import { CustomerSelectorComponent } from '../../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CustomerModel } from '../../../../../../@core/modules/general/entities/customer.model';

@Component({
  selector: 'app-form-basic-parishioner',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.scss'],
  imports: [SharedModule, CompanySelectorComponent, CustomerSelectorComponent],
})
export class BasicFormParishionerComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  genderEnum = CustomerModel.GenderEnum;

  // Fonte para o [companyId] dos seletores de pai/mãe — setada já no ngOnInit
  // (antes da view existir) para que o customer-selector já nasça com o
  // companyId certo na primeira detecção de mudança (ver AI_CONTEXT 3.1:
  // customer-selector só busca/habilita quando @Input companyId existe).
  companyId: string | null = null;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;
  @ViewChild('fatherSelector') fatherSelectorRef: CustomerSelectorComponent;
  @ViewChild('motherSelector') motherSelectorRef: CustomerSelectorComponent;

  constructor(private readonly controlContainer: ControlContainer) {}

  ngOnInit() {
    this.form = this.controlContainer.control as FormGroup;
    this.companyId = this.form.get('company_id').value ?? null;
  }

  ngAfterViewInit() {
    // Reaplica a pré-seleção quando o ngbNav recria essa aba (destroyOnHide),
    // já que o form (fonte da verdade) sobrevive à troca de aba mas os
    // seletores (estado visual do select2) são recriados do zero. Só
    // funciona a partir de ngAfterViewInit — o @ViewChild ainda não está
    // resolvido em ngOnInit.
    this.autoset();
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.form.get('company_id').setValue(entity?.id ?? null);
    this.form.get('company_id').markAsTouched();
    // Muda o companyId dos seletores de pai/mãe — eles próprios se resetam
    // (ngOnChanges) quando isso muda, já que pai/mãe precisam pertencer à
    // mesma paróquia.
    this.companyId = entity?.id ?? null;
  }

  onFatherSelected(entity: CustomerModel.Entity | null) {
    this.form.get('father_id').setValue(entity?.id ?? null);
  }

  onMotherSelected(entity: CustomerModel.Entity | null) {
    this.form.get('mother_id').setValue(entity?.id ?? null);
  }

  /** Preseleciona paróquia/pai/mãe em telas de edição, ou limpa a exibição
   * quando o form pai é resetado (criação cancelada) — chamado pelo
   * componente pai. */
  autoset() {
    const companyId = this.form.get('company_id').value;
    if (companyId) this.companySelectorRef?.autoset(companyId);
    else this.companySelectorRef?.clear();

    const fatherId = this.form.get('father_id').value;
    if (fatherId) this.fatherSelectorRef?.autoset(fatherId);
    else this.fatherSelectorRef?.clear();

    const motherId = this.form.get('mother_id').value;
    if (motherId) this.motherSelectorRef?.autoset(motherId);
    else this.motherSelectorRef?.clear();
  }
}
