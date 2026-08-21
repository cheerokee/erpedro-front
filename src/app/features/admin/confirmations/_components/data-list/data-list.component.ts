import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbDropdownModule, NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { AlertService } from '../../../../../@core/services/alert.service';

import { ConfirmationModel } from '../../../../../@core/modules/parishioner/entities/confirmation.model';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';

import {
  ConfirmationListItem,
  ConfirmationListResult,
  ConfirmationService,
} from '../../../../../@core/modules/parishioner/services/confirmation.service';
import { ModalConfirmationsComponent } from '../modal/modal.component';
import { FilterStore } from '../../_services/filter.store';
import { FilterComponent } from '../filter/filter.component';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-confirmations',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    NgbPagination,
    NgbDropdownModule,
    FilterComponent,
    ModalConfirmationsComponent,
  ],
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: ConfirmationListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;

  @ViewChild('modal') modal: ModalConfirmationsComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new ConfirmationModel.Filter({});

  constructor(
    private readonly confirmationService: ConfirmationService,
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
          return this.confirmationService.list(this.filter, this.page, PAGE_SIZE);
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
    this.confirmationService
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
      title: 'Remover crisma?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.confirmationService
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

  private applyResult(result: ConfirmationListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
