import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDropdownModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import {
  CustomerExportItem,
  CustomerListItem,
  CustomerListResult,
  CustomerService,
} from '../../../../../@core/modules/general/services/customer.service';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import {
  ExcelColumn,
  ExcelExportService,
} from '../../../../../@shared/services/excel-export.service';
import { ModalParishionersComponent } from '../modal/modal.component';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { FilterStore } from '../../_services/filter.store';

const PAGE_SIZE = 10;

type ExportScope = 'all' | 'filtered';

const EXPORT_COLUMNS: ExcelColumn[] = [
  { header: 'Nome', key: 'name', width: 30 },
  { header: 'Documento', key: 'document', width: 20 },
  { header: 'Telefone', key: 'phone', width: 20 },
  { header: 'Gênero', key: 'gender', width: 15 },
  { header: 'Data de Nascimento', key: 'birthdate', width: 18 },
  { header: 'Local de Nascimento', key: 'place_birth', width: 25 },
  { header: 'Pai', key: 'father', width: 30 },
  { header: 'Mãe', key: 'mother', width: 30 },
  { header: 'Paróquia', key: 'company', width: 25 },
  { header: 'Endereço', key: 'address', width: 35 },
  { header: 'Bairro', key: 'neighborhood', width: 20 },
  { header: 'Cidade', key: 'city', width: 20 },
  { header: 'Estado', key: 'state', width: 15 },
  { header: 'País', key: 'country', width: 15 },
  { header: 'CEP', key: 'zip_code', width: 15 },
];

// Chaves em minúsculo: o valor do enum no banco é "masculine"/"feminine",
// mas o GraphQL (registerEnumType) devolve o nome da chave do enum
// ("MASCULINE"/"FEMININE") em vez do valor — normaliza com toLowerCase()
// antes do lookup (ver downloadExcel).
const GENDER_LABELS: Record<string, string> = {
  masculine: 'Masculino',
  feminine: 'Feminino',
};

@Component({
  selector: 'app-data-list-parishioners',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    FilterComponent,
    ModalParishionersComponent,
    NgbPagination,
    NgbDropdownModule,
  ],
  // FilterStore precisa ser o mesmo instance para pai (DataListComponent) e
  // filho (FilterComponent) — provido aqui (ancestral comum) em vez de no
  // FilterComponent, já que a injeção de dependência do Angular só resolve
  // provider de um componente para ele mesmo e seus descendentes, nunca para
  // um ancestral.
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: CustomerListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;
  exporting = false;

  @ViewChild('modal') modal: ModalParishionersComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new CustomerModel.Filter({});

  constructor(
    private readonly customerService: CustomerService,
    private readonly filterStore: FilterStore,
    private readonly alertService: AlertService,
    private readonly excelExportService: ExcelExportService,
  ) {}

  ngOnInit() {
    this.filterStore.store$
      .pipe(
        switchMap((filter) => {
          this.filter = filter;
          this.page = 1;
          this.loading = true;
          return this.customerService.list(this.filter, this.page, PAGE_SIZE);
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => this.applyResult(result),
        error: () => (this.loading = false),
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  changePage(page: number) {
    this.page = page;
    this.fetch();
  }

  fetch() {
    this.loading = true;
    this.customerService
      .list(this.filter, this.page, PAGE_SIZE)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => this.applyResult(result),
        error: () => (this.loading = false),
      });
  }

  new() {
    this.modal.show();
  }

  edit(id: string) {
    this.modal.show(id);
  }

  async remove(id: string) {
    const confirmation = await this.alertService.confirm({
      title: 'Remover paroquiano?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.customerService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.fetch(),
        error: () => {
          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível remover o registro',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  onSaved() {
    this.fetch();
  }

  export(scope: ExportScope) {
    if (this.exporting) return;

    this.exporting = true;
    const filter = scope === 'all' ? new CustomerModel.Filter({}) : this.filter;

    this.customerService
      .listForExport(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (items) => this.downloadExcel(items, scope),
        error: () => {
          this.exporting = false;
          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível gerar o arquivo Excel',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  private async downloadExcel(items: CustomerExportItem[], scope: ExportScope) {
    // Cada paroquiano pode ter N endereços, mas o backend (customerList,
    // GraphQL) já filtra o join por is_main = true, então addresses aqui
    // nunca tem mais de um item.
    const rows = items.map((item) => {
      const mainAddress = item.addresses?.[0];

      return {
        name: item.name,
        document: item.document ?? '-',
        phone: item.phone_number
          ? `${item.country_code ? '+' + item.country_code + ' ' : ''}${item.phone_number}`
          : '-',
        gender: item.gender
          ? (GENDER_LABELS[item.gender.toLowerCase()] ?? item.gender)
          : '-',
        birthdate: this.formatBirthdate(item.birthdate),
        place_birth: item.place_birth ?? '-',
        father: item.father?.name ?? '-',
        mother: item.mother?.name ?? '-',
        company: item.company?.name ?? '-',
        address: mainAddress
          ? `${mainAddress.street}, ${mainAddress.number}`
          : '-',
        neighborhood: mainAddress?.neighborhood ?? '-',
        city: mainAddress?.city?.name ?? '-',
        state: mainAddress?.state?.name ?? '-',
        country: mainAddress?.country?.name ?? '-',
        zip_code: mainAddress?.zip_code ?? '-',
      };
    });

    const filename = `paroquianos-${scope === 'all' ? 'lista-completa' : 'lista-filtrada'}.xlsx`;

    try {
      await this.excelExportService.export(
        filename,
        'Paroquianos',
        EXPORT_COLUMNS,
        rows,
      );
    } catch {
      this.alertService.alert({
        title: 'Ops, houve um erro!',
        text: 'Não foi possível gerar o arquivo Excel',
        icon: 'error',
        timer: 3000,
      });
    } finally {
      this.exporting = false;
    }
  }

  // 'YYYY-MM-DD' -> 'DD/MM/YYYY' via split de string, sem passar por Date
  // (evita o deslocamento de fuso horário que new Date('YYYY-MM-DD') causa,
  // já que essa forma é interpretada como UTC meia-noite).
  private formatBirthdate(value?: string): string {
    if (!value) return '-';

    const [year, month, day] = value.split('-');
    return year && month && day ? `${day}/${month}/${year}` : '-';
  }

  private applyResult(result: CustomerListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
