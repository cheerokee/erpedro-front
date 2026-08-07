import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { SharedModule } from '../../../../../@shared/shared.module';
import { AlertService } from '../../../../../@core/services/alert.service';
import {
  CustomerAnyCompanySelectorComponent,
  CustomerAnyCompanySelection,
} from '../../../../../@shared/components/selectors/customer-any-company-selector/customer-any-company-selector.component';

// Vive em memória (sem persistir sozinho), mesmo contrato de
// RepresentationsFormUserComponent (front/AI_CONTEXT.md §3.7) — quem usa
// (FormComponent de Batismo) decide quando sincronizar com o backend, no
// submit(), comparando com os padrinhos originais carregados no load().
export interface BaptismGodparentRow {
  // presente só quando a linha já existe no backend (carregada na edição);
  // ausente numa linha recém-adicionada nesta sessão de edição/criação.
  id?: string;
  godparent_id: string;
  godparent_name: string;
  company_name: string;
  course_date?: string;
  course_hours?: number;
  course_place?: string;
}

@Component({
  selector: 'app-godparents-form-list',
  templateUrl: './godparents-form-list.component.html',
  styleUrls: ['./godparents-form-list.component.scss'],
  imports: [SharedModule, CustomerAnyCompanySelectorComponent],
})
export class GodparentsFormListComponent {
  @Input() data: BaptismGodparentRow[] = [];
  @Output() dataChange = new EventEmitter<BaptismGodparentRow[]>();

  course_date: string | null = null;
  course_hours: number | null = null;
  course_place: string | null = null;

  @ViewChild('godparentSelector')
  godparentSelectorRef: CustomerAnyCompanySelectorComponent;

  private selected: CustomerAnyCompanySelection | null = null;

  constructor(private readonly alertService: AlertService) {}

  onGodparentSelected(entity: CustomerAnyCompanySelection | null) {
    this.selected = entity;
  }

  get canAdd(): boolean {
    return !!this.selected;
  }

  add() {
    if (!this.canAdd) return;

    // Mesma regra do backend (BaptismGodparentService.create): o mesmo
    // paroquiano não pode ser padrinho duas vezes do mesmo batismo — checado
    // aqui também só pra dar feedback imediato, sem esperar o submit falhar.
    const alreadyAdded = this.data.some(
      (row) => row.godparent_id === this.selected.id,
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
      godparent_id: this.selected.id,
      godparent_name: this.selected.name,
      company_name: this.selected.company?.name ?? '-',
      course_date: this.course_date ?? undefined,
      course_hours: this.course_hours ?? undefined,
      course_place: this.course_place ?? undefined,
    };

    this.dataChange.emit([...this.data, row]);
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

  private clear() {
    this.selected = null;
    this.course_date = null;
    this.course_hours = null;
    this.course_place = null;
    this.godparentSelectorRef?.clear();
  }
}
