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

import { CustomerService } from '../../../../../@core/modules/general/services/customer.service';
import { CustomerModel } from '../../../../../@core/modules/general/entities/customer.model';
import { AddressService } from '../../../../../@core/modules/address/services/address.service';
import { AddressModel } from '../../../../../@core/modules/address/entities/address.model';
import { IVerticalValidation } from '../../../../../@shared/interface/form-layout';
import { AlertService } from '../../../../../@core/services/alert.service';
import { BasicFormParishionerComponent } from './basic/basic.component';
import { ResultModel } from '../../../../../@core/models/result.model';
import { AddressesComponent } from './addresses/addresses.component';
import { SharedModule } from '../../../../../@shared/shared.module';
import { AuthenticatedUser } from '../../../../../@core/services/auth.service';
import { getAuthenticatedUser } from '../../../../../@core/utils/get-authenticated-user.helper';

export enum ParishionerTabEnum {
  BASIC = 'BASIC',
  ADDRESSES = 'ADDRESSES',
}

export enum ParishionerTabEnumTitle {
  BASIC = 'Dados Básicos',
  ADDRESSES = 'Endereços',
}

export enum ParishionerTabEnumText {
  BASIC = 'Nome, documento, etc.',
  ADDRESSES = 'Residencia, locais, etc.',
}

export type FormDataParishioner = CustomerModel.JsonProps;

@Component({
  selector: 'app-form-parishioners',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  imports: [
    SharedModule,
    NgbNav,
    NgbNavItem,
    NgbNavLink,
    NgbNavOutlet,
    NgbNavContent,
    BasicFormParishionerComponent,
    AddressesComponent,
  ],
})
export class FormComponent implements OnChanges, OnInit {
  form: FormGroup;
  parishionerTabEnum = ParishionerTabEnum;
  verticalValidation: IVerticalValidation[] = [
    {
      id: 1,
      title: ParishionerTabEnumTitle.BASIC,
      value: ParishionerTabEnum.BASIC,
      text: ParishionerTabEnumText.BASIC,
      class: 'user',
    },
    {
      id: 2,
      title: ParishionerTabEnumTitle.ADDRESSES,
      value: ParishionerTabEnum.ADDRESSES,
      text: ParishionerTabEnumText.ADDRESSES,
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
  @ViewChild('formBasic') formBasic: BasicFormParishionerComponent;
  @ViewChild('formAddress') formAddress: AddressesComponent;

  /** Ids dos endereços já persistidos no carregamento — usado para diferenciar
   * criação/atualização/remoção ao sincronizar endereços (ver submit()). */
  private originalAddressIds: string[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerService,
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
      document: [null],
      country_code: [null],
      phone_number: [null],
      user_id: [null],
      company_id: [null, Validators.required],
      addresses: [[]],
    });

    this.default();
  }

  default() {
    this.form.setValue({
      id: null,
      name: null,
      document: null,
      country_code: null,
      phone_number: null,
      user_id: null,
      company_id: null,
      addresses: [],
    });
    this.originalAddressIds = [];
  }

  load() {
    const obs$: Observable<ResultModel<CustomerModel.JsonProps>> =
      this.customerService.get(this.id);
    obs$.pipe(take(1)).subscribe({
      next: (result) => {
        if (result.success && result.data) {
          const { company, user, addresses, ...otherData } = result.data;

          this.form.setValue({
            id: otherData.id,
            name: otherData.name ?? null,
            document: otherData.document ?? null,
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

    const data: FormDataParishioner = { ...this.form.value };
    const addresses = data.addresses ?? [];
    delete data.addresses;

    let obs$: Observable<ResultModel<any>>;

    this.saving = true;

    if (data.id) {
      const id = data.id;
      delete data.id;
      obs$ = this.customerService.update(id, data);
    } else {
      delete data.id;
      obs$ = this.customerService.create(data);
    }

    obs$
      .pipe(
        take(1),
        switchMap((result) => {
          const customerId = this.form.get('id').value ?? result.data?.id;
          return this.syncAddresses(customerId, addresses);
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

  /** Endereços não são aninhados no payload do customer (o backend não aceita
   * isso — CreateCustomerDto/UpdateCustomerDto não têm campo `addresses`).
   * Sincroniza via o endpoint próprio de endereços (mesmo usado pelo
   * address-selector), comparando com `originalAddressIds`: id novo (gerado
   * no client pelo address-form-list) -> create; id já existente -> update;
   * id que existia e não está mais na lista -> delete. */
  private syncAddresses(
    customerId: string,
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
          customer_id: customerId,
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
