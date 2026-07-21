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
import { StateService } from '../../../../@core/modules/address/services/state.service';
import { StateModel } from '../../../../@core/modules/address/entities/state.model';

@Component({
  selector: 'app-state-selector',
  templateUrl: './state-selector.component.html',
  styleUrls: ['./state-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class StateSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() countryId: string | null = null;
  @Input() placeholder: string = 'Selecione um estado';
  @Output() selected = new EventEmitter<StateModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private states: StateModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly stateService: StateService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.stateService.byLike(this.countryId as string, q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setStates(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });

    if (this.countryId) this.fetch('');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['countryId'] && !changes['countryId'].firstChange) {
      this.value = null;
      this.setStates([]);
      this.selected.emit(null);

      if (this.countryId) this.fetch('');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(event: Select2SearchEvent) {
    if (!this.countryId) return;
    this.fetch((event.search ?? '').toString());
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const state = this.states.find((state) => state.id === event.value) ?? null;

    this.selected.emit(state);
  }

  /** Preseleciona um estado por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.stateService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          const entity = StateModel.Entity.toEntity(result.data);

          this.setStates([
            entity,
            ...this.states.filter((state) => state.id !== result.data.id),
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

  private setStates(states: StateModel.Entity[]) {
    this.states = states;
    this.data = states.map((state) => ({
      id: state.id,
      value: state.id,
      label: state.name,
    }));
  }
}
