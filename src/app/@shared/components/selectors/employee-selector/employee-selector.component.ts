import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  Select2Data,
  Select2Module,
  Select2SearchEvent,
  Select2UpdateEvent,
} from 'ng-select2-component';
import { Subject, switchMap, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import { EmployeeService } from '../../../../@core/modules/general/services/employee.service';
import { EmployeeModel } from '../../../../@core/modules/general/entities/employee.model';

@Component({
  selector: 'app-employee-selector',
  templateUrl: './employee-selector.component.html',
  styleUrls: ['./employee-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class EmployeeSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() companyId: string | null = null;
  @Input() placeholder: string = 'Selecione um funcionário';
  @Output() selected = new EventEmitter<EmployeeModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private employees: EmployeeModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly employeeService: EmployeeService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.employeeService.byLike(this.companyId as string, q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setEmployees(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });

    if (this.companyId) this.fetch('');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['companyId'] && !changes['companyId'].firstChange) {
      this.value = null;
      this.setEmployees([]);
      this.selected.emit(null);

      if (this.companyId) this.fetch('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Select2SearchEvent) {
    if (!this.companyId) return;
    this.fetch((event.search ?? '').toString());
  }

  onUpdate(event: Select2UpdateEvent) {
    const employee =
      this.employees.find((employee) => employee.id === event.value) ?? null;

    this.selected.emit(employee);
  }

  /** Preseleciona um funcionário por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.employeeService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          this.setEmployees([
            result.data,
            ...this.employees.filter((employee) => employee.id !== result.data.id),
          ]);
          this.value = result.data.id;
          this.selected.emit(result.data);
        },
      });
  }

  clear() {
    this.value = null;
    this.selected.emit(null);
  }

  private fetch(q: string) {
    this.isLoading = true;
    this.searchTerm$.next(q);
  }

  private setEmployees(employees: EmployeeModel.Entity[]) {
    this.employees = employees;
    this.data = employees.map((employee) => ({
      id: employee.id,
      value: employee.id,
      label: employee.name,
    }));
  }
}
