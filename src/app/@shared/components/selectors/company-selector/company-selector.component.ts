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
import { CompanyService } from '../../../../@core/modules/company/services/company.service';
import { CompanyModel } from '../../../../@core/modules/company/entities/company.model';

@Component({
  selector: 'app-company-selector',
  templateUrl: './company-selector.component.html',
  styleUrls: ['./company-selector.component.scss'],
  imports: [SharedModule, Select2Module],
})
export class CompanySelectorComponent implements OnInit, OnDestroy {
  @Input() placeholder: string = 'Selecione uma empresa';
  @Output() selected = new EventEmitter<CompanyModel.Entity | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  private companies: CompanyModel.Entity[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly companyService: CompanyService) {}

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.companyService.byLike(q)),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.setCompanies(result.data ?? []);
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
    const company =
      this.companies.find((company) => company.id === event.value) ?? null;

    this.selected.emit(company);
  }

  /** Preseleciona uma empresa por id (uso em telas de edição). */
  autoset(id: string) {
    if (!id) return;

    this.companyService
      .get(id)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          if (!result.data) return;

          this.setCompanies([
            result.data,
            ...this.companies.filter(
              (company) => company.id !== result.data.id,
            ),
          ]);
          this.value = result.data.id;
          this.selected.emit(result.data);
        },
      });
  }

  private fetch(q: string) {
    this.isLoading = true;
    this.searchTerm$.next(q);
  }

  private setCompanies(companies: CompanyModel.Entity[]) {
    this.companies = companies;
    this.data = companies.map((company) => ({
      id: company.id,
      value: company.id,
      label: company.name,
    }));
  }

  clear() {
    this.value = null;
    this.selected.emit(null);
  }
}
