import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Select2Data, Select2Module, Select2UpdateEvent } from 'ng-select2-component';
import { Subject, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import { FinancialServiceService } from '../../../../@core/modules/financial/services/financial-service.service';
import { FinancialServiceModel } from '../../../../@core/modules/financial/entities/financial-service.model';

/** Diferente dos demais seletores (company/customer/employee, ver
 * AI_CONTEXT.md §3.1), o catálogo de serviços financeiros não tem endpoint
 * de busca remota (`by-company` já devolve a lista inteira de ativos da
 * paróquia, sem paginação/termo) — catálogo tende a ser pequeno por
 * natureza. Por isso este seletor não usa `customSearchEnabled`/`(search)`;
 * o próprio `<select2>` filtra localmente sobre `data` conforme o usuário digita. */
@Component({
  selector: 'app-financial-service-selector',
  templateUrl: './financial-service-selector.component.html',
  styleUrls: ['./financial-service-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class FinancialServiceSelectorComponent implements OnChanges, OnDestroy {
  @Input() companyId: string | null = null;
  @Input() placeholder: string = 'Selecione um serviço';
  @Output() selected = new EventEmitter<FinancialServiceModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private services: FinancialServiceModel.Entity[] = [];
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly financialServiceService: FinancialServiceService,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['companyId']) {
      this.value = null;
      this.setServices([]);
      this.selected.emit(null);

      if (this.companyId) this.fetch();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onUpdate(event: Select2UpdateEvent) {
    this.value = (event.value as string) ?? null;

    const service =
      this.services.find((service) => service.id === event.value) ?? null;

    this.selected.emit(service);
  }

  /** Preseleciona um serviço por id (uso em telas de edição — o item já
   * salvo pode referenciar um serviço que não está mais `active`, e por
   * isso não apareceria em `byCompany`). */
  autoset(id: string) {
    if (!id) return;

    const cached = this.services.find((service) => service.id === id);
    if (cached) {
      this.value = id;
      this.selected.emit(cached);
      return;
    }

    this.financialServiceService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          const entity = FinancialServiceModel.Entity.toEntity(result.data);

          this.setServices([
            entity,
            ...this.services.filter((service) => service.id !== entity.id),
          ]);
          this.value = entity.id;
          this.selected.emit(entity);
        },
      });
  }

  clear() {
    this.value = null;
    this.selected.emit(null);
  }

  private fetch() {
    this.isLoading = true;

    this.financialServiceService
      .byCompany(this.companyId as string)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setServices(result.data ?? []);
        },
        error: () => {
          this.isLoading = false;
        },
      });
  }

  private setServices(services: FinancialServiceModel.Entity[]) {
    this.services = services;
    this.data = services.map((service) => ({
      id: service.id,
      value: service.id,
      label: `${service.name} — R$ ${Number(service.price).toFixed(2)}`,
    }));
  }
}
