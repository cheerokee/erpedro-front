import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  Select2Data,
  Select2Module,
  Select2SearchEvent,
  Select2UpdateEvent,
} from 'ng-select2-component';
import { Subject, switchMap, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import { HoldingService } from '../../../../@core/modules/company/services/holding.service';
import { HoldingModel } from '../../../../@core/modules/company/entities/holding.model';

@Component({
  selector: 'app-holding-selector',
  templateUrl: './holding-selector.component.html',
  styleUrls: ['./holding-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class HoldingSelectorComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Selecione uma diocese';
  @Input() disabled: boolean = false;
  @Output() selected = new EventEmitter<HoldingModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private holdings: HoldingModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly holdingService: HoldingService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.holdingService.byLike(q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setHoldings(result.data ?? []);
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

    const holding =
      this.holdings.find((holding) => holding.id === event.value) ?? null;

    this.selected.emit(holding);
  }

  /** Preseleciona uma diocese por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.holdingService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          const holding = new HoldingModel.Entity({
            id: result.data.id,
            name: result.data.name,
          });

          this.setHoldings([
            holding,
            ...this.holdings.filter((h) => h.id !== holding.id),
          ]);
          this.value = holding.id;
          this.selected.emit(holding);
        },
      });
  }

  private fetch(q: string) {
    this.isLoading = true;
    this.searchTerm$.next(q);
  }

  private setHoldings(holdings: HoldingModel.Entity[]) {
    this.holdings = holdings;
    this.data = holdings.map((holding) => ({
      id: holding.id,
      value: holding.id,
      label: holding.name,
    }));
  }

  clear() {
    this.value = null;
    this.selected.emit(null);
  }
}
