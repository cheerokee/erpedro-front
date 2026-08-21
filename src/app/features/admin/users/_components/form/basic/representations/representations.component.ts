import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';

import { SharedModule } from '../../../../../../../@shared/shared.module';
import { CompanySelectorComponent } from '../../../../../../../@shared/components/selectors/company-selector/company-selector.component';
import { EmployeeSelectorComponent } from '../../../../../../../@shared/components/selectors/employee-selector/employee-selector.component';
import { CustomerSelectorComponent } from '../../../../../../../@shared/components/selectors/customer-selector/customer-selector.component';
import { CompanyModel } from '../../../../../../../@core/modules/company/entities/company.model';
import { EmployeeModel } from '../../../../../../../@core/modules/general/entities/employee.model';
import { CustomerModel } from '../../../../../../../@core/modules/general/entities/customer.model';
import { AlertService } from '../../../../../../../@core/services/alert.service';
import { Card } from '../../../../../../../@shared/components/ui/card/card';

export type UserRepresentationType = 'employee' | 'customer';

// Um mesmo usuário pode ser colaborador de uma paróquia e paroquiano de
// outra ao mesmo tempo (decisão explícita do usuário) — por isso essa lista
// aceita N vínculos, cada um com sua própria paróquia, em vez de um único
// par (tipo, registro) na aba Dados Gerais.
export interface UserRepresentationRow {
  type: UserRepresentationType;
  company_id: string;
  company_name: string;
  entity_id: string;
  entity_name: string;
}

// Vive em memória (sem persistir sozinho) e devolve a lista pronta via
// dataChange, mesmo contrato de @shared/components/form-lists/address-form-list
// (AI_CONTEXT §3.2) — quem usa (FormComponent, via basic.component.ts)
// decide quando sincronizar (aqui, no submit() do form pai, comparando com
// os vínculos originais carregados no load()).
@Component({
  selector: 'app-form-representations-user',
  templateUrl: './representations.component.html',
  styleUrls: ['./representations.component.scss'],
  imports: [
    SharedModule,
    CompanySelectorComponent,
    EmployeeSelectorComponent,
    CustomerSelectorComponent,
  ],
})
export class RepresentationsFormUserComponent {
  @Input() data: UserRepresentationRow[] = [];
  @Output() dataChange = new EventEmitter<UserRepresentationRow[]>();

  type: UserRepresentationType = 'employee';
  companyId: string | null = null;

  @ViewChild('companySelector') companySelectorRef: CompanySelectorComponent;

  private companyName: string | null = null;
  private selectedEntity: EmployeeModel.Entity | CustomerModel.Entity | null =
    null;

  constructor(private readonly alertService: AlertService) {}

  onTypeChange(type: UserRepresentationType) {
    this.type = type;
    this.selectedEntity = null;
  }

  onCompanySelected(entity: CompanyModel.Entity | null) {
    this.companyId = entity?.id ?? null;
    this.companyName = entity?.name ?? null;
    this.selectedEntity = null;
  }

  onEntitySelected(entity: EmployeeModel.Entity | CustomerModel.Entity | null) {
    this.selectedEntity = entity;
  }

  get canAdd(): boolean {
    return !!this.companyId && !!this.selectedEntity;
  }

  add() {
    if (!this.canAdd) return;

    const row: UserRepresentationRow = {
      type: this.type,
      company_id: this.companyId as string,
      company_name: this.companyName ?? '-',
      entity_id: this.selectedEntity.id,
      entity_name: this.selectedEntity.name,
    };

    const alreadyAdded = this.data.some(
      (item) => item.type === row.type && item.entity_id === row.entity_id,
    );
    if (alreadyAdded) return;

    this.dataChange.emit([...this.data, row]);
    this.clear();
  }

  async remove(index: number) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover vínculo?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    const next = [...this.data];
    next.splice(index, 1);
    this.dataChange.emit(next);
  }

  private clear() {
    this.companyId = null;
    this.companyName = null;
    this.selectedEntity = null;
    this.companySelectorRef?.clear();
  }
}
