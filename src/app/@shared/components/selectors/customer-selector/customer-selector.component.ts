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
import { CustomerService } from '../../../../@core/modules/general/services/customer.service';
import { CustomerModel } from '../../../../@core/modules/general/entities/customer.model';

@Component({
  selector: 'app-customer-selector',
  templateUrl: './customer-selector.component.html',
  styleUrls: ['./customer-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class CustomerSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() companyId: string | null = null;
  @Input() placeholder: string = 'Selecione um paroquiano';
  @Output() selected = new EventEmitter<CustomerModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private customers: CustomerModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly customerService: CustomerService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.customerService.byLike(this.companyId as string, q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setCustomers(result.data ?? []);
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
      this.setCustomers([]);
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
    this.value = (event.value as string) ?? null;

    const customer =
      this.customers.find((customer) => customer.id === event.value) ?? null;

    this.selected.emit(customer);
  }

  /** Preseleciona um paroquiano por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.customerService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          this.setCustomers([
            result.data,
            ...this.customers.filter((customer) => customer.id !== result.data.id),
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

  private setCustomers(customers: CustomerModel.Entity[]) {
    this.customers = customers;
    this.data = customers.map((customer) => ({
      id: customer.id,
      value: customer.id,
      label: customer.name,
    }));
  }
}
