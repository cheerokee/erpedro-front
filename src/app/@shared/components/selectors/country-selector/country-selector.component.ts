import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  Select2,
  Select2Data,
  Select2Module,
  Select2SearchEvent,
  Select2UpdateEvent,
} from 'ng-select2-component';
import { Subject, switchMap, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import { CountryService } from '../../../../@core/modules/address/services/country.service';
import { CountryModel } from '../../../../@core/modules/address/entities/country.model';

@Component({
  selector: 'app-country-selector',
  templateUrl: './country-selector.component.html',
  styleUrls: ['./country-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class CountrySelectorComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Selecione um país';
  @Output() selected = new EventEmitter<CountryModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private countries: CountryModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  @ViewChild('select2') select2: Select2;
  constructor(private readonly countryService: CountryService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.countryService.byLike(q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setCountries(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });

    this.fetch('');
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Select2SearchEvent) {
    this.fetch((event.search ?? '').toString());
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const country =
      this.countries.find((country) => country.id === event.value) ?? null;

    this.selected.emit(country);
  }

  /** Preseleciona um país por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.countryService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          const entity = CountryModel.Entity.toEntity(result.data);

          this.setCountries([
            entity,
            ...this.countries.filter(
              (country) => country.id !== result.data.id,
            ),
          ]);
          this.value = result.data.id;
          this.selected.emit(entity);
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

  private setCountries(countries: CountryModel.Entity[]) {
    this.countries = countries;
    this.data = countries.map((country) => ({
      id: country.id,
      value: country.id,
      label: country.name,
    }));
  }
}
