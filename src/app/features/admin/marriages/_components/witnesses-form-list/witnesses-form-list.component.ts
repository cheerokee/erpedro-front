import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { SharedModule } from '../../../../../@shared/shared.module';
import { AlertService } from '../../../../../@core/services/alert.service';
import {
  CustomerAnyCompanySelectorComponent,
  CustomerAnyCompanySelection,
} from '../../../../../@shared/components/selectors/customer-any-company-selector/customer-any-company-selector.component';
import {
  ModalBody,
  ModalComponent,
  ModalFooter,
  ModalHeader,
} from '../../../../../@shared/components/modal/modal.component';

// Vive em memória (sem persistir sozinho), mesmo contrato de
// GodparentsFormListComponent dos outros sacramentos — quem usa
// (FormComponent) decide quando sincronizar com o backend, no submit(),
// comparando com as testemunhas originais carregadas no load().
//
// Modelo híbrido (back: MarriageWitnessEntity) — witness_id (Customer já
// cadastrado) OU witness_name/witness_origin_parish (pessoa externa, texto
// livre). Sem campos de curso — diferente de padrinho, testemunha de
// casamento não passa por curso de preparação.
export interface MarriageWitnessRow {
  // presente só quando a linha já existe no backend (carregada na edição);
  // ausente numa linha recém-adicionada — sem endpoint de update, "editar"
  // não existe aqui (só remover + readicionar, e nem isso faz sentido sem
  // campo editável).
  id?: string;
  is_external: boolean;
  witness_id?: string;
  witness_name: string;
  witness_origin_parish?: string;
  company_name?: string;
}

type Mode = 'customer' | 'external';

@Component({
  selector: 'app-witnesses-form-list',
  templateUrl: './witnesses-form-list.component.html',
  styleUrls: ['./witnesses-form-list.component.scss'],
  imports: [
    SharedModule,
    CustomerAnyCompanySelectorComponent,
    ModalComponent,
    ModalHeader,
    ModalBody,
    ModalFooter,
  ],
})
export class WitnessesFormListComponent {
  @Input() data: MarriageWitnessRow[] = [];
  @Output() dataChange = new EventEmitter<MarriageWitnessRow[]>();

  mode: Mode = 'customer';

  external_name: string | null = null;
  external_origin_parish: string | null = null;

  @ViewChild('addModal') addModal: ModalComponent;
  @ViewChild('witnessSelector')
  witnessSelectorRef: CustomerAnyCompanySelectorComponent;

  private selected: CustomerAnyCompanySelection | null = null;

  constructor(private readonly alertService: AlertService) {}

  get canConfirmCustomer(): boolean {
    return !!this.selected;
  }

  get canAddExternal(): boolean {
    return !!this.external_name?.trim();
  }

  openAddModal() {
    this.clear();
    this.mode = 'customer';
    this.addModal.show();
  }

  setMode(mode: Mode) {
    this.mode = mode;
  }

  onWitnessSelected(entity: CustomerAnyCompanySelection | null) {
    this.selected = entity;
  }

  confirmCustomer() {
    if (!this.canConfirmCustomer) return;

    // Mesma regra do backend (MarriageWitnessService.create): o mesmo
    // paroquiano não pode ser testemunha duas vezes do mesmo casamento —
    // checado aqui também só pra dar feedback imediato, sem esperar o
    // submit falhar. Não dá pra checar duplicidade de pessoa externa (sem
    // chave confiável), mesma limitação do backend.
    const alreadyAdded = this.data.some(
      (row) => !row.is_external && row.witness_id === this.selected.id,
    );
    if (alreadyAdded) {
      this.alertService.alert({
        title: 'Testemunha já adicionada',
        text: 'Este paroquiano já está na lista.',
        icon: 'warning',
        timer: 3000,
      });
      return;
    }

    const row: MarriageWitnessRow = {
      is_external: false,
      witness_id: this.selected.id,
      witness_name: this.selected.name,
      company_name: this.selected.company?.name ?? '-',
    };

    this.dataChange.emit([...this.data, row]);
    this.addModal.hide();
    this.clear();
  }

  addExternal() {
    if (!this.canAddExternal) return;

    const row: MarriageWitnessRow = {
      is_external: true,
      witness_name: this.external_name.trim(),
      witness_origin_parish: this.external_origin_parish?.trim() || undefined,
    };

    this.dataChange.emit([...this.data, row]);
    this.addModal.hide();
    this.clear();
  }

  async remove(index: number) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover testemunha?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    const next = [...this.data];
    next.splice(index, 1);
    this.dataChange.emit(next);
  }

  private clear() {
    this.selected = null;
    this.external_name = null;
    this.external_origin_parish = null;
    this.witnessSelectorRef?.clear();
  }
}
