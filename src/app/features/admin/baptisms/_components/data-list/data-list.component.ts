import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDropdownModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { AlertService } from '../../../../../@core/services/alert.service';

import { BaptismModel } from '../../../../../@core/modules/parishioner/entities/baptism.model';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';

import {
  BaptismListItem,
  BaptismListResult,
  BaptismService,
} from '../../../../../@core/modules/parishioner/services/baptism.service';
import { ModalBaptismsComponent } from '../modal/modal.component';
import { FilterStore } from '../../_services/filter.store';
import { FilterComponent } from '../filter/filter.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-baptisms',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    NgbPagination,
    NgbDropdownModule,
    FilterComponent,
    ModalBaptismsComponent,
  ],
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: BaptismListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;
  exporting = false;

  @ViewChild('modal') modal: ModalBaptismsComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new BaptismModel.Filter({});

  constructor(
    private readonly baptismService: BaptismService,
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
          return this.baptismService.list(this.filter, this.page, PAGE_SIZE);
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
    this.baptismService
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
      title: 'Remover batismo?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.baptismService
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

  private applyResult(result: BaptismListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
