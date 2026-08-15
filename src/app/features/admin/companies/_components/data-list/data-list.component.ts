import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { AlertService } from '../../../../../@core/services/alert.service';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { FilterStore } from '../../_services/filter.store';
import {
  CompanyListItem,
  CompanyListResult,
  CompanyService,
} from '../../../../../@core/modules/company/services/company.service';
import { CompanyModel } from '../../../../../@core/modules/company/entities/company.model';
import { ModalCompaniesComponent } from '../modal/modal.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-companies',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    FilterComponent,
    ModalCompaniesComponent,
    NgbPagination,
  ],
  // FilterStore precisa ser o mesmo instance para pai (DataListComponent) e
  // filho (FilterComponent) — provido aqui (ancestral comum) em vez de no
  // FilterComponent, já que a injeção de dependência do Angular só resolve
  // provider de um componente para ele mesmo e seus descendentes, nunca para
  // um ancestral.
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: CompanyListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;

  @ViewChild('modal') modal: ModalCompaniesComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new CompanyModel.Filter({});

  constructor(
    private readonly companyService: CompanyService,
    private readonly filterStore: FilterStore,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit() {
    this.filterStore.store$
      .pipe(
        switchMap((filter) => {
          this.filter = filter;
          this.page = 1;
          this.loading = true;
          return this.companyService.list(this.filter, this.page, PAGE_SIZE);
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
    this.companyService
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
      title: 'Remover paróquia?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.companyService
      .delete(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.fetch(),
        error: (err) => {
          this.alertService.alertError(err, 'Não foi possível remover o registro');
        },
      });
  }

  onSaved() {
    this.fetch();
  }

  private applyResult(result: CompanyListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
