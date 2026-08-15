import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  Select2Data,
  Select2Module,
  Select2SearchEvent,
  Select2UpdateEvent,
} from 'ng-select2-component';
import { Subject, switchMap, take, takeUntil } from 'rxjs';

import { SharedModule } from '../../../shared.module';
import {
  CustomerAnyCompanyItem,
  CustomerService,
} from '../../../../@core/modules/general/services/customer.service';
import { AlertService } from '../../../../@core/services/alert.service';
import { CompanySelectorComponent } from '../company-selector/company-selector.component';
import { CompanyModel } from '../../../../@core/modules/company/entities/company.model';
import {
  ModalBody,
  ModalComponent,
  ModalFooter,
  ModalHeader,
} from '../../modal/modal.component';

// Item selecionado sempre traz `company` (mesmo quando recém-criado no modal
// de cadastro rápido abaixo) — quem consome este seletor (godparents-form-list,
// e futuramente Crisma/Casamento) precisa exibir de qual paróquia a pessoa é.
export type CustomerAnyCompanySelection = CustomerAnyCompanyItem;

@Component({
  selector: 'app-customer-any-company-selector',
  templateUrl: './customer-any-company-selector.component.html',
  styleUrls: ['./customer-any-company-selector.component.scss'],
  imports: [
    SharedModule,
    Select2Module,
    CompanySelectorComponent,
    ModalComponent,
    ModalHeader,
    ModalBody,
    ModalFooter,
  ],
})
export class CustomerAnyCompanySelectorComponent
  implements OnInit, OnDestroy
{
  @Input() placeholder: string = 'Selecione um paroquiano (de qualquer paróquia)';
  @Input() disabled: boolean = false;
  @Output() selected = new EventEmitter<CustomerAnyCompanySelection | null>();

  data: Select2Data = [];
  value: string | null = null;
  isLoading: boolean = false;

  quickCreateForm: FormGroup;
  quickCreateSaving = false;

  @ViewChild('quickCreateModal') quickCreateModal: ModalComponent;
  @ViewChild('quickCreateCompanySelector')
  quickCreateCompanySelectorRef: CompanySelectorComponent;

  // Guardado direto do evento (selected) do company-selector do modal de
  // cadastro rápido — evita reabrir o componente filho pra descobrir o nome
  // da paróquia escolhida (ver submitQuickCreate()).
  private quickCreateCompanyName: string | null = null;

  private customers: CustomerAnyCompanyItem[] = [];
  private readonly searchTerm$ = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly customerService: CustomerService,
    private readonly alertService: AlertService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.quickCreateForm = this.formBuilder.group({
      name: [null, Validators.required],
      document: [null],
      company_id: [null, Validators.required],
    });
  }

  ngOnInit() {
    this.searchTerm$
      .pipe(
        switchMap((q) => this.customerService.searchAnyCompany(q)),
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

    const customer =
      this.customers.find((customer) => customer.id === event.value) ?? null;

    this.selected.emit(customer);
  }

  // Sem autoset(id) por id — diferente de customer-selector/company-selector,
  // este componente só é usado no modo "adicionar novo padrinho/madrinha"
  // dentro de godparents-form-list; as linhas já adicionadas são exibidas
  // como texto simples na tabela (mesmo padrão de RepresentationsFormUserComponent),
  // nunca reabertas dentro do próprio seletor.

  clear() {
    this.value = null;
    this.selected.emit(null);
  }

  openQuickCreate() {
    this.quickCreateForm.reset();
    this.quickCreateCompanySelectorRef?.clear();
    this.quickCreateCompanyName = null;
    this.quickCreateModal.show();
  }

  onQuickCreateCompanySelected(entity: CompanyModel.Entity | null) {
    this.quickCreateForm.get('company_id').setValue(entity?.id ?? null);
    this.quickCreateForm.get('company_id').markAsTouched();
    this.quickCreateCompanyName = entity?.name ?? null;
  }

  submitQuickCreate() {
    if (this.quickCreateForm.invalid) {
      this.quickCreateForm.markAllAsTouched();
      return;
    }

    this.quickCreateSaving = true;

    const { name, document, company_id } = this.quickCreateForm.value;
    const companyName = this.quickCreateCompanyName;

    this.customerService
      .create({ name, document, company_id } as any)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.quickCreateSaving = false;

          if (!result.data) return;

          const created: CustomerAnyCompanyItem = {
            id: (result.data as any).id,
            name: (result.data as any).name ?? name,
            company: { id: company_id, name: companyName ?? '-' },
          };

          this.setCustomers([
            created,
            ...this.customers.filter((c) => c.id !== created.id),
          ]);
          this.value = created.id;
          this.selected.emit(created);

          this.quickCreateModal.hide();
        },
        error: (err) => {
          this.quickCreateSaving = false;
          this.alertService.alertError(err, 'Não foi possível cadastrar o paroquiano');
        },
      });
  }

  private fetch(q: string) {
    this.isLoading = true;
    this.searchTerm$.next(q);
  }

  private setCustomers(customers: CustomerAnyCompanyItem[]) {
    this.customers = customers;
    this.data = customers.map((customer) => ({
      id: customer.id,
      value: customer.id,
      label: customer.company?.name
        ? `${customer.name} — ${customer.company.name}`
        : customer.name,
    }));
  }
}
