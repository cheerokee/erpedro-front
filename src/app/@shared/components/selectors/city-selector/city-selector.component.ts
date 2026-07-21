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
import { CityService } from '../../../../@core/modules/address/services/city.service';
import { CityModel } from '../../../../@core/modules/address/entities/city.model';

@Component({
  selector: 'app-city-selector',
  templateUrl: './city-selector.component.html',
  styleUrls: ['./city-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class CitySelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() stateId: string | null = null;
  @Input() placeholder: string = 'Selecione uma cidade';
  @Output() selected = new EventEmitter<CityModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private cities: CityModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly cityService: CityService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.cityService.byLike(this.stateId as string, q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setCities(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });

    if (this.stateId) this.fetch('');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['stateId'] && !changes['stateId'].firstChange) {
      this.value = null;
      this.setCities([]);
      this.selected.emit(null);

      if (this.stateId) this.fetch('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Select2SearchEvent) {
    if (!this.stateId) return;
    this.fetch((event.search ?? '').toString());
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const city = this.cities.find((city) => city.id === event.value) ?? null;

    this.selected.emit(city);
  }

  /** Preseleciona uma cidade por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.cityService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          const entity = CityModel.Entity.toEntity(result.data);

          this.setCities([
            entity,
            ...this.cities.filter((city) => city.id !== result.data.id),
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

  private setCities(cities: CityModel.Entity[]) {
    this.cities = cities;
    this.data = cities.map((city) => ({
      id: city.id,
      value: city.id,
      label: city.name,
    }));
  }
}
