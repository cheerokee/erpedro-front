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
import { AddressService } from '../../../../@core/modules/address/services/address.service';
import { AddressModel } from '../../../../@core/modules/address/entities/address.model';

@Component({
  selector: 'app-address-selector',
  templateUrl: './address-selector.component.html',
  styleUrls: ['./address-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class AddressSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cityId: string | null = null;
  @Input() customerId: string | null = null;
  @Input() employeeId: string | null = null;
  @Input() placeholder: string = 'Selecione um endereço';
  @Output() selected = new EventEmitter<AddressModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private addresses: AddressModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly addressService: AddressService) {}

  get hasOwner(): boolean {
    return !!this.customerId || !!this.employeeId;
  }

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) =>
          this.addressService.byLike(
            {
              cityId: this.cityId,
              customerId: this.customerId,
              employeeId: this.employeeId,
            },
            q,
          ),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setAddresses(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });

    if (this.hasOwner) this.fetch('');
  }

  ngOnChanges(changes: SimpleChanges) {
    const dependencyChanged = ['cityId', 'customerId', 'employeeId'].some(
      (key) => changes[key] && !changes[key].firstChange,
    );

    if (dependencyChanged) {
      this.value = null;
      this.setAddresses([]);
      this.selected.emit(null);

      if (this.hasOwner) this.fetch('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Select2SearchEvent) {
    if (!this.hasOwner) return;
    this.fetch((event.search ?? '').toString());
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const address =
      this.addresses.find((address) => address.id === event.value) ?? null;

    this.selected.emit(address);
  }

  /** Preseleciona um endereço por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.addressService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          this.setAddresses([
            result.data,
            ...this.addresses.filter((address) => address.id !== result.data.id),
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

  private setAddresses(addresses: AddressModel.Entity[]) {
    this.addresses = addresses;
    this.data = addresses.map((address) => ({
      id: address.id,
      value: address.id,
      label: this.addressLabel(address),
    }));
  }

  private addressLabel(address: AddressModel.Entity): string {
    const parts = [`${address.street}, ${address.number}`];

    if (address.neighborhood) parts.push(address.neighborhood);

    return parts.join(' - ');
  }
}
