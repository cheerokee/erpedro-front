import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { Subject, switchMap, takeUntil } from 'rxjs';

import {
  EmployeeListItem,
  EmployeeListResult,
  EmployeeService,
} from '../../../../../@core/modules/general/services/employee.service';
import { EmployeeModel } from '../../../../../@core/modules/general/entities/employee.model';
import { AlertService } from '../../../../../@core/services/alert.service';
import { ModalEmployeesComponent } from '../modal/modal.component';
import { Card } from '../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../@shared/shared.module';
import { FilterComponent } from '../filter/filter.component';
import { FilterStore } from '../../_services/filter.store';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-data-list-employees',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [
    SharedModule,
    Card,
    FilterComponent,
    ModalEmployeesComponent,
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
  rows: EmployeeListItem[] = [];
  meta = { totalItems: 0, itemCount: 0, itemsPerPage: PAGE_SIZE };
  page = 1;
  loading = false;

  @ViewChild('modal') modal: ModalEmployeesComponent;

  private readonly destroy$ = new Subject<void>();
  private filter = new EmployeeModel.Filter({});

  constructor(
    private readonly employeeService: EmployeeService,
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
          return this.employeeService.list(this.filter, this.page, PAGE_SIZE);
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
    this.employeeService
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
      title: 'Remover funcionário?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    this.employeeService
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

  private applyResult(result: EmployeeListResult) {
    this.loading = false;
    this.rows = result.items;
    this.meta = result.meta;
  }
}
