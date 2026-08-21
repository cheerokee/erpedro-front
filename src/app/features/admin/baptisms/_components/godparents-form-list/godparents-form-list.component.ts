import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';

import { SharedModule } from '../../../../../@shared/shared.module';
import { AlertService } from '../../../../../@core/services/alert.service';
import { createTypeaheadSearch } from '../../../../../@core/utils/create-typeahead-search.helper';
import { BaptismGodparentService } from '../../../../../@core/modules/parishioner/services/baptism-godparent.service';
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
// RepresentationsFormUserComponent (front/AI_CONTEXT.md §3.7) — quem usa
// (FormComponent de Batismo) decide quando sincronizar com o backend, no
// submit(), comparando com os padrinhos originais carregados no load().
//
// Modelo híbrido (back: BaptismGodparentEntity) — godparent_id (Customer já
// cadastrado) OU godparent_name/godparent_origin_parish (pessoa externa,
// texto livre). is_external decide qual dos dois preencher no payload de
// criação (ver FormComponent.syncGodparents).
export interface BaptismGodparentRow {
  // presente só quando a linha já existe no backend (carregada na edição);
  // ausente numa linha recém-adicionada, OU quando "editada" (ver saveEdit) —
  // sem endpoint de update, editar vira remover + readicionar.
  id?: string;
  is_external: boolean;
  godparent_id?: string;
  godparent_name: string;
  godparent_origin_parish?: string;
  company_name?: string;
  course_date?: string;
  course_hours?: number;
  course_place?: string;
}

type Mode = 'customer' | 'external';

@Component({
  selector: 'app-godparents-form-list',
  templateUrl: './godparents-form-list.component.html',
  styleUrls: ['./godparents-form-list.component.scss'],
  imports: [
    SharedModule,
    NgbTypeahead,
    CustomerAnyCompanySelectorComponent,
    ModalComponent,
    ModalHeader,
    ModalBody,
    ModalFooter,
  ],
})
export class GodparentsFormListComponent implements OnChanges {
  @Input() data: BaptismGodparentRow[] = [];
  @Input() companyId: string | null = null;
  @Output() dataChange = new EventEmitter<BaptismGodparentRow[]>();

  mode: Mode = 'customer';

  course_date: string | null = null;
  course_hours: number | null = null;
  course_place: string | null = null;

  external_name: string | null = null;
  external_origin_parish: string | null = null;

  editingIndex: number | null = null;
  edit_course_date: string | null = null;
  edit_course_hours: number | null = null;
  edit_course_place: string | null = null;

  // Sugestão de autocomplete pro local do curso (ver BaseCrudHttp.suggestions)
  // — carregada assim que o companyId do form pai é conhecido.
  coursePlaceSuggestions: string[] = [];
  searchCoursePlace = createTypeaheadSearch(() => this.coursePlaceSuggestions);

  @ViewChild('addModal') addModal: ModalComponent;
  @ViewChild('godparentSelector')
  godparentSelectorRef: CustomerAnyCompanySelectorComponent;

  private selected: CustomerAnyCompanySelection | null = null;

  constructor(
    private readonly alertService: AlertService,
    private readonly baptismGodparentService: BaptismGodparentService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['companyId'] && this.companyId) {
      this.baptismGodparentService.suggestions('course_place', this.companyId).subscribe({
        next: (result) => (this.coursePlaceSuggestions = result.data ?? []),
      });
    }
  }

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

  onGodparentSelected(entity: CustomerAnyCompanySelection | null) {
    this.selected = entity;
  }

  confirmCustomer() {
    if (!this.canConfirmCustomer) return;

    // Mesma regra do backend (BaptismGodparentService.create): o mesmo
    // paroquiano não pode ser padrinho duas vezes do mesmo batismo — checado
    // aqui também só pra dar feedback imediato, sem esperar o submit falhar.
    // Não dá pra checar duplicidade de pessoa externa (sem chave confiável),
    // mesma limitação do backend.
    const alreadyAdded = this.data.some(
      (row) => !row.is_external && row.godparent_id === this.selected.id,
    );
    if (alreadyAdded) {
      this.alertService.alert({
        title: 'Padrinho/madrinha já adicionado',
        text: 'Este paroquiano já está na lista.',
        icon: 'warning',
        timer: 3000,
      });
      return;
    }

    const row: BaptismGodparentRow = {
      is_external: false,
      godparent_id: this.selected.id,
      godparent_name: this.selected.name,
      company_name: this.selected.company?.name ?? '-',
      course_date: this.course_date ?? undefined,
      course_hours: this.course_hours ?? undefined,
      course_place: this.course_place ?? undefined,
    };

    this.dataChange.emit([...this.data, row]);
    this.addModal.hide();
    this.clear();
  }

  addExternal() {
    if (!this.canAddExternal) return;

    const row: BaptismGodparentRow = {
      is_external: true,
      godparent_name: this.external_name.trim(),
      godparent_origin_parish: this.external_origin_parish?.trim() || undefined,
      course_date: this.course_date ?? undefined,
      course_hours: this.course_hours ?? undefined,
      course_place: this.course_place ?? undefined,
    };

    this.dataChange.emit([...this.data, row]);
    this.addModal.hide();
    this.clear();
  }

  async remove(index: number) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover padrinho/madrinha?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    const next = [...this.data];
    next.splice(index, 1);
    this.dataChange.emit(next);
  }

  startEdit(index: number) {
    const row = this.data[index];
    this.editingIndex = index;
    this.edit_course_date = row.course_date ?? null;
    this.edit_course_hours = row.course_hours ?? null;
    this.edit_course_place = row.course_place ?? null;
  }

  cancelEdit() {
    this.editingIndex = null;
  }

  // Sem endpoint de update no backend — "editar" troca a linha por uma nova
  // sem id, o que faz FormComponent.syncGodparents tratar como remover a
  // antiga + criar outra no submit (mesma simplificação documentada lá).
  saveEdit(index: number) {
    const original = this.data[index];
    const updated: BaptismGodparentRow = {
      ...original,
      id: undefined,
      course_date: this.edit_course_date ?? undefined,
      course_hours: this.edit_course_hours ?? undefined,
      course_place: this.edit_course_place ?? undefined,
    };

    const next = [...this.data];
    next[index] = updated;
    this.dataChange.emit(next);
    this.editingIndex = null;
  }

  private clear() {
    this.selected = null;
    this.external_name = null;
    this.external_origin_parish = null;
    this.course_date = null;
    this.course_hours = null;
    this.course_place = null;
    this.godparentSelectorRef?.clear();
  }
}
