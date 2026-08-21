import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import {
  UserListItem,
  UserListResult,
  UserService,
} from '../../../../../@core/modules/account/services/user.service';
import { UserModel } from '../../../../../@core/modules/account/entities/user.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ModalUsersComponent } from '../modal/modal.component';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { FilterStore } from '../../_services/filter.store';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-users',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [SharedModule, Card, FilterComponent, ModalUsersComponent, NgbPagination],
  // FilterStore precisa ser o mesmo instance para pai (DataListComponent) e
  // filho (FilterComponent) — provido aqui (ancestral comum), nunca isolado
  // no FilterComponent (ver AI_CONTEXT.md §3.3, bug de NG0201 já mapeado em
  // outra tela por esse mesmo motivo).
  providers: [FilterStore],
})
export class DataListComponent implements OnInit, OnDestroy {
  rows: UserListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;

  @ViewChild('modal') modal: ModalUsersComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new UserModel.Filter({});

  constructor(
    private readonly userService: UserService,
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
          return this.userService.list(this.filter, this.page, PAGE_SIZE);
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
    this.userService
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
      title: 'Remover usuário?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.userService
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

  rolesLabel(row: UserListItem): string {
    return row.roles?.length ? row.roles.map((role) => role.name).join(', ') : '-';
  }

  private applyResult(result: UserListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
