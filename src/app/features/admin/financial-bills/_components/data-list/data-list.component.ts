import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import {
  FinancialBillListItem,
  FinancialBillListResult,
  FinancialBillService,
} from '../../../../../@core/modules/financial/services/financial-bill.service';
import { FinancialBillModel } from '../../../../../@core/modules/financial/entities/financial-bill.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ModalFinancialBillsComponent } from '../modal/modal.component';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { FilterStore } from '../../_services/filter.store';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-financial-bills',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    FilterComponent,
    ModalFinancialBillsComponent,
    NgbPagination,
  ],
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: FinancialBillListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;
  statusEnumStr = FinancialBillModel.StatusEnumStr;

  @ViewChild('modal') modal: ModalFinancialBillsComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new FinancialBillModel.Filter({});

  constructor(
    private readonly financialBillService: FinancialBillService,
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
          return this.financialBillService.list(this.filter, this.page, PAGE_SIZE);
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
    this.financialBillService
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

  debtorLabel(row: FinancialBillListItem): string {
    return row.debtor?.customer?.name ?? row.debtor?.company?.name ?? '-';
  }

  statusBadgeClass(status: FinancialBillModel.StatusEnum): string {
    switch (status) {
      case FinancialBillModel.StatusEnum.PAID:
        return 'bg-light-success txt-success';
      case FinancialBillModel.StatusEnum.PARTIALLY_PAID:
        return 'bg-light-warning txt-warning';
      case FinancialBillModel.StatusEnum.CANCELED:
        return 'bg-light-secondary txt-secondary';
      default:
        return 'bg-light-primary txt-primary';
    }
  }

  onSaved() {
    this.fetch();
  }

  private applyResult(result: FinancialBillListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
