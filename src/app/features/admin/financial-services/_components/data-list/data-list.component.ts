import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import {
  FinancialServiceListItem,
  FinancialServiceListResult,
  FinancialServiceService,
} from '../../../../../@core/modules/financial/services/financial-service.service';
import { FinancialServiceModel } from '../../../../../@core/modules/financial/entities/financial-service.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ModalFinancialServicesComponent } from '../modal/modal.component';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { FilterStore } from '../../_services/filter.store';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-financial-services',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    FilterComponent,
    ModalFinancialServicesComponent,
    NgbPagination,
  ],
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: FinancialServiceListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;

  @ViewChild('modal') modal: ModalFinancialServicesComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new FinancialServiceModel.Filter({});

  constructor(
    private readonly financialServiceService: FinancialServiceService,
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
          return this.financialServiceService.list(this.filter, this.page, PAGE_SIZE);
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
    this.financialServiceService
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
      title: 'Remover serviço financeiro?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.financialServiceService
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

  private applyResult(result: FinancialServiceListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
