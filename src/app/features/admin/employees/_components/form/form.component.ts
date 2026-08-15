import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin, Observable, of, switchMap, take } from 'rxjs';
import {
  NgbNav,
  NgbNavContent,
  NgbNavItem,
  NgbNavLink,
  NgbNavOutlet,
} from '@ng-bootstrap/ng-bootstrap';

import { EmployeeService } from '../../../../../@core/modules/general/services/employee.service';
import { EmployeeModel } from '../../../../../@core/modules/general/entities/employee.model';
import { AddressService } from '../../../../../@core/modules/address/services/address.service';
import { AddressModel } from '../../../../../@core/modules/address/entities/address.model';
import { IVerticalValidation } from '../../../../../@shared/interface/form-layout';
import { AlertService } from '../../../../../@core/services/alert.service';
import { BasicFormEmployeeComponent } from './basic/basic.component';
import { ResultModel } from '../../../../../@core/models/result.model';
import { AddressesComponent } from './addresses/addresses.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { AuthenticatedUser } from '../../../../../@core/services/auth.service';
import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';

export enum EmployeeTabEnum {
  BASIC = 'BASIC',
  ADDRESSES = 'ADDRESSES',
}

export enum EmployeeTabEnumTitle {
  BASIC = 'Dados Básicos',
  ADDRESSES = 'Endereços',
}

export enum EmployeeTabEnumText {
  BASIC = 'Nome, email, etc.',
  ADDRESSES = 'Residencia, locais, etc.',
}

export type FormDataEmployee = EmployeeModel.JsonProps;

@Component({
  selector: 'app-form-employees',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
    BasicFormEmployeeComponent,
    AddressesComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  employeeTabEnum = EmployeeTabEnum;
  verticalValidation: IVerticalValidation[] = [
    {
      id: 1,
      title: EmployeeTabEnumTitle.BASIC,
      value: EmployeeTabEnum.BASIC,
      text: EmployeeTabEnumText.BASIC,
      class: 'user',
    },
    {
      id: 2,
      title: EmployeeTabEnumTitle.ADDRESSES,
      value: EmployeeTabEnum.ADDRESSES,
      text: EmployeeTabEnumText.ADDRESSES,
      class: 'map-pin',
    },
  ];
  active = 1;
  authenticatedUser: AuthenticatedUser;
  saving = false;

  changeTab(value: number) {
    this.active = value;
  }

  @Input() id: string;
  @Output() onSave = new EventEmitter<void>();
  @ViewChild('formBasic') formBasic: BasicFormEmployeeComponent;
  @ViewChild('formAddress') formAddress: AddressesComponent;

  /** Ids dos endereços já persistidos no carregamento — usado para diferenciar
   * criação/atualização/remoção ao sincronizar endereços (ver submit()). */
  private originalAddressIds: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private employeeService: EmployeeService,
    private addressService: AddressService,
    private alertService: AlertService,
  ) {
    this.define();
  }

  ngOnInit() {
    this.authenticatedUser = getAuthenticatedUser();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['id'] &&
      changes['id'].previousValue !== changes['id'].currentValue
    ) {
      this.active = 1;

      if (this.id) {
        this.load();
      } else {
        this.default();
      }
    }
  }

  define() {
    this.form = this.formBuilder.group({
      id: [null],
      name: [null, Validators.required],
      email: [null, [Validators.required, Validators.email]],
      country_code: [null],
      phone_number: [null],
      user_id: [null],
      company_id: [null, Validators.required],
      addresses: [[]],
    });

    this.default();
  }

  default() {
    this.active = 1;

    this.form.setValue({
      id: null,
      name: null,
      email: null,
      country_code: null,
      phone_number: null,
      user_id: null,
      company_id: null,
      addresses: [],
    });
    this.originalAddressIds = [];

    // Seletores das abas filhas mantêm rótulo exibido em estado próprio —
    // setValue() acima não limpa a exibição sozinho (ver AI_CONTEXT.md).
    this.formBasic?.autoset(null);
    this.formAddress?.autoset();
    this.form.markAsUntouched();
    this.form.markAsPristine();
  }

  load() {
    const obs$: Observable<ResultModel<EmployeeModel.JsonProps>> =
      this.employeeService.get(this.id);
    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { company, user, addresses, ...otherData } = result.data;

          this.form.setValue({
            id: otherData.id,
            name: otherData.name ?? null,
            email: otherData.email ?? null,
            country_code: otherData.country_code ?? null,
            phone_number: otherData.phone_number ?? null,
            user_id: otherData.user_id ?? user?.id ?? null,
            company_id: otherData.company_id ?? company?.id ?? null,
            addresses: addresses ?? [],
          });
          this.originalAddressIds = (addresses ?? []).map((address) => address.id);

          this.formBasic?.autoset(this.form.get('company_id').value);
          this.formAddress?.autoset();
        }
      },
      error: () => {
        this.alertService.alert({
          title: 'Ops, houve um erro!',
          text: 'Não foi possível carregar o registro',
          icon: 'error',
          timer: 3000,
        });
      },
    });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const data: FormDataEmployee = { ...this.form.value };
    const addresses = data.addresses ?? [];
    delete data.addresses;

    let obs$: Observable<ResultModel<any>>;

    this.saving = true;

    if (data.id) {
      const id = data.id;
      delete data.id;
      obs$ = this.employeeService.update(id, data);
    } else {
      delete data.id;
      obs$ = this.employeeService.create(data);
    }

    obs$
      .pipe(
        take(1),
        switchMap((result) => {
          const employeeId = this.form.get('id').value ?? result.data?.id;
          return this.syncAddresses(employeeId, addresses);
        }),
      )
      .subscribe({
        next: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Sucesso',
            text: 'Registro salvo com sucesso',
            icon: 'success',
            timer: 3000,
          });
          this.default();
          this.onSave.emit();
        },
        error: () => {
          this.saving = false;
          this.alertService.alert({
            title: 'Ops, houve um erro!',
            text: 'Não foi possível cadastrar ou atualizar o registro',
            icon: 'error',
            timer: 3000,
          });
        },
      });
  }

  /** Endereços não são aninhados no payload do employee (o backend não aceita
   * isso — CreateEmployeeDto/UpdateEmployeeDto não têm campo `addresses`).
   * Sincroniza via o endpoint próprio de endereços (mesmo usado pelo
   * address-selector), comparando com `originalAddressIds`: id novo (gerado
   * no client pelo address-form-list) -> create; id já existente -> update;
   * id que existia e não está mais na lista -> delete. */
  private syncAddresses(
    employeeId: string,
    addresses: AddressModel.JsonProps[],
  ): Observable<any> {
    const currentIds = addresses.map((address) => address.id);
    const removedIds = this.originalAddressIds.filter(
      (id) => !currentIds.includes(id),
    );

    const requests: Observable<any>[] = [
      ...addresses.map((address) => {
        const payload = {
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          zip_code: address.zip_code,
          type: address.type,
          is_main: address.is_main,
          country_id: address.country_id,
          state_id: address.state_id,
          city_id: address.city_id,
          employee_id: employeeId,
        };

        return this.originalAddressIds.includes(address.id)
          ? this.addressService.update(address.id, payload)
          : this.addressService.create(payload as AddressModel.JsonProps);
      }),
      ...removedIds.map((id) => this.addressService.delete(id)),
    ];

    return requests.length > 0 ? forkJoin(requests) : of(null);
  }
}
