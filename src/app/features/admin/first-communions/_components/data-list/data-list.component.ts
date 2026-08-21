import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDropdownModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { AlertService } from '../../../../../@core/services/alert.service';

import { FirstCommunionModel } from '../../../../../@core/modules/parishioner/entities/first-communion.model';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';

import {
  FirstCommunionListItem,
  FirstCommunionListResult,
  FirstCommunionService,
} from '../../../../../@core/modules/parishioner/services/first-communion.service';
import { ModalFirstCommunionsComponent } from '../modal/modal.component';
import { FilterStore } from '../../_services/filter.store';
import { FilterComponent } from '../filter/filter.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-first-communions',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    NgbPagination,
    NgbDropdownModule,
    FilterComponent,
    ModalFirstCommunionsComponent,
  ],
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: FirstCommunionListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;

  @ViewChild('modal') modal: ModalFirstCommunionsComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new FirstCommunionModel.Filter({});

  constructor(
    private readonly firstCommunionService: FirstCommunionService,
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
          return this.firstCommunionService.list(this.filter, this.page, PAGE_SIZE);
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
    this.firstCommunionService
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
      title: 'Remover primeira comunhão?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.firstCommunionService
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

  private applyResult(result: FirstCommunionListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
