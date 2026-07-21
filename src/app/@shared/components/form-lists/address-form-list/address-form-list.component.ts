import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs';

import { AddressModel } from '../../../../@core/modules/address/entities/address.model';
import { CountryModel } from '../../../../@core/modules/address/entities/country.model';
import { StateModel } from '../../../../@core/modules/address/entities/state.model';
import { CityModel } from '../../../../@core/modules/address/entities/city.model';
import {
  AddressService,
  AddressZipCodeLookup,
} from '../../../../@core/modules/address/services/address.service';
import { AlertService } from '../../../../@core/services/alert.service';
import { SharedModule } from '../../../shared.module';
import { CountrySelectorComponent } from '../../selectors/country-selector/country-selector.component';
import { StateSelectorComponent } from '../../selectors/state-selector/state-selector.component';
import { CitySelectorComponent } from '../../selectors/city-selector/city-selector.component';
import AddressTypeEnum = AddressModel.AddressTypeEnum;
import AddressTypeEnumStr = AddressModel.AddressTypeEnumStr;
import { Card } from '../../ui/card/card';
import {
  NgbAccordionBody,
  NgbAccordionButton,
  NgbAccordionCollapse,
  NgbAccordionDirective,
  NgbAccordionHeader,
  NgbAccordionItem,
  NgbAccordionToggle,
} from '@ng-bootstrap/ng-bootstrap';

export enum AddressOriginType {
  Customer = 'customer',
  Employee = 'employee',
}

@Component({
  selector: 'app-form-list-address',
  templateUrl: './address-form-list.component.html',
  styleUrls: ['./address-form-list.component.scss'],
  imports: [
    SharedModule,
    CountrySelectorComponent,
    StateSelectorComponent,
    CitySelectorComponent,
    NgbAccordionDirective,
    NgbAccordionItem,
    NgbAccordionHeader,
    NgbAccordionCollapse,
    NgbAccordionBody,
  ],
})
export class AddressFormListComponent implements OnInit, AfterViewInit {
  form: FormGroup;
  addressTypeOptions: { label: string; value: AddressTypeEnum }[] =
    Object.values(AddressTypeEnum)
      .filter((option) => typeof option === 'string')
      .map((option) => {
        console.log({
          value: option,
          label: AddressTypeEnumStr[option],
        });
        return {
          value: option,
          label: AddressTypeEnumStr[option],
        };
      });
  showForm: boolean = false;

  @Input() origin: AddressOriginType;
  @Input() owner: string;
  @Input() data: AddressModel.Entity[] = [];
  @Output() dataChange = new EventEmitter<AddressModel.Entity[]>();

  @ViewChild('countrySelector') countrySelectorRef: CountrySelectorComponent;
  @ViewChild('stateSelector') stateSelectorRef: StateSelectorComponent;
  @ViewChild('citySelector') citySelectorRef: CitySelectorComponent;
  @ViewChild('accordion') accordion: NgbAccordionDirective;
  private countryEntity: CountryModel.Entity | null = null;
  private stateEntity: StateModel.Entity | null = null;
  private cityEntity: CityModel.Entity | null = null;

  // campos que só fazem sentido depois que um país é escolhido (ex.: máscara/busca de CEP dependem do país)
  private readonly blockedUntilCountryControlNames = [
    'street',
    'number',
    'neighborhood',
    'complement',
    'zip_code',
    'type',
    'is_main',
  ];
  private zipCodeLookupInFlight = false;

  constructor(
    private formBuilder: FormBuilder,
    private alertService: AlertService,
    private cdr: ChangeDetectorRef,
    private addressService: AddressService,
  ) {
    this.define();
  }

  ngOnInit() {
    this.default();
  }

  ngAfterViewInit() {
    this.accordion.collapseAll();
  }

  define() {
    this.form = this.formBuilder.group({
      id: [null],
      street: [null, [Validators.required]],
      number: [null, [Validators.required]],
      neighborhood: [null],
      complement: [null],
      zip_code: [null, [Validators.required]],
      type: [null],
      country_id: [null],
      city_id: [null],
      state_id: [null],
      is_main: [null],
      customer_id: [null],
      employee_id: [null],
    });
  }

  default() {
    this.form.setValue({
      id: null,
      street: null,
      number: null,
      neighborhood: null,
      complement: null,
      zip_code: null,
      type: AddressTypeEnum.NORMAL,
      country_id: null,
      city_id: null,
      state_id: null,
      is_main: true,
      customer_id: null,
      employee_id: null,
    });

    this.countryEntity = null;
    this.stateEntity = null;
    this.cityEntity = null;
    this.setFieldsBlockedUntilCountry(true);

    switch (this.origin) {
      case AddressOriginType.Customer:
        if (this.owner) this.form.get('customer_id').setValue(this.owner);
        break;
      case AddressOriginType.Employee:
        if (this.owner) this.form.get('employee_id').setValue(this.owner);
        break;
    }
  }

  onCountrySelected(entity: CountryModel.Entity | null) {
    this.countryEntity = entity;
    this.form.get('country_id').setValue(entity?.id ?? null);
    this.setFieldsBlockedUntilCountry(!entity);
  }

  get isBrazilSelected(): boolean {
    return this.countryEntity?.code === 'BR';
  }

  /** Aplica a máscara 00000-000 (só para o Brasil) e dispara a busca do endereço ao completar os 8 dígitos. */
  onZipCodeInput(event: Event) {
    if (!this.isBrazilSelected) return;

    const input = event.target as HTMLInputElement;
    const formatted = this.formatBrazilianZipCode(input.value);
    const digits = formatted.replace(/\D/g, '');

    this.form.get('zip_code').setValue(formatted, { emitEvent: false });

    if (digits.length === 8) this.lookupZipCode(digits);
  }

  onStateSelected(entity: StateModel.Entity | null) {
    this.stateEntity = entity;
    this.form.get('state_id').setValue(entity?.id ?? null);
  }

  onCitySelected(entity: CityModel.Entity | null) {
    this.cityEntity = entity;
    this.form.get('city_id').setValue(entity?.id ?? null);
  }

  add() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const entity = this.buildEntity();

    if (!this.data || this.data.length === 0) entity.is_main = true;
    if (entity.is_main) this.demoteOtherAddresses(entity.id);

    this.data.push(entity);

    this.emitChange();
    this.clear();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const entity = this.buildEntity();
    const index = this.data.findIndex((item) => item.id === entity.id);

    if (index === -1) return;

    const wasMain = this.data[index].is_main;
    this.data[index] = entity;

    if (entity.is_main) {
      this.demoteOtherAddresses(entity.id);
    } else if (wasMain) {
      this.promoteAnotherAddress(entity.id);
    }

    this.emitChange();
    this.clear();
  }

  edit(id: string) {
    this.openForm();
    const address = this.data.find((item) => item.id === id);

    if (address) {
      this.autoset(address);
    }
  }

  async remove(id: string) {
    const index = this.data.findIndex((item) => item.id === id);

    if (index === -1) return;

    const confirmation = await this.alertService.confirm({
      title: 'Remover endereço?',
      text: 'Essa ação não poderá ser desfeita.',
    });

    if (!confirmation.isConfirmed) return;

    const removed = this.data[index];
    this.data.splice(index, 1);

    if (
      removed.is_main &&
      this.data.length > 0 &&
      !this.data.some((item) => item.is_main)
    ) {
      this.data[0].is_main = true;
    }

    if (this.form.get('id').value === id) this.clear();

    this.emitChange();
  }

  clear() {
    this.default();
    this.countrySelectorRef?.clear();
    this.closeForm();
  }

  /** Pré-seleciona os três seletores geográficos encadeados (país -> estado -> cidade).
   * A ordem importa: cada `[countryId]`/`[stateId]` do seletor filho reseta o próprio valor
   * (e emite `selected(null)`) sempre que o input muda depois da primeira vez (ver seletores
   * em @shared/components/selectors). Por isso o próximo nível só é preenchido (form + autoset)
   * depois de um `detectChanges()` que já deixou esse reset acontecer — do contrário o reset
   * do filho sobrescreveria o valor correto que acabamos de setar. */
  private autoset(entity: AddressModel.Entity) {
    this.form.setValue({
      id: entity.id,
      street: entity.street,
      number: entity.number,
      neighborhood: entity.neighborhood ?? null,
      complement: entity.complement ?? null,
      zip_code: entity.zip_code,
      type: entity.type,
      is_main: entity.is_main,
      country_id: null,
      state_id: null,
      city_id: null,
      customer_id: entity.customer_id ?? null,
      employee_id: entity.employee_id ?? null,
    });
    this.countryEntity = null;
    this.stateEntity = null;
    this.cityEntity = null;

    const countryId = entity.country?.id ?? entity.country_id ?? null;
    const stateId = entity.state?.id ?? entity.state_id ?? null;
    const cityId = entity.city?.id ?? entity.city_id ?? null;

    this.form.get('country_id').setValue(countryId);
    this.countryEntity = entity.country ?? null;
    this.setFieldsBlockedUntilCountry(!countryId);
    if (countryId) this.countrySelectorRef?.autoset(countryId);
    this.cdr.detectChanges();

    this.form.get('state_id').setValue(stateId);
    this.stateEntity = entity.state ?? null;
    if (stateId) this.stateSelectorRef?.autoset(stateId);
    this.cdr.detectChanges();

    this.form.get('city_id').setValue(cityId);
    this.cityEntity = entity.city ?? null;
    if (cityId) this.citySelectorRef?.autoset(cityId);
  }

  private buildEntity(): AddressModel.Entity {
    const formValue = this.form.value;
    const original = formValue.id
      ? this.data.find((item) => item.id === formValue.id)
      : null;

    return new AddressModel.Entity({
      ...(original ?? {}),
      ...formValue,
      id: formValue.id ?? undefined,
      updated_at: original ? new Date() : null,
      country: this.countryEntity ?? undefined,
      state: this.stateEntity ?? undefined,
      city: this.cityEntity ?? undefined,
    } as any);
  }

  private setFieldsBlockedUntilCountry(blocked: boolean) {
    this.blockedUntilCountryControlNames.forEach((name) => {
      const control = this.form.get(name);
      if (blocked) control.disable({ emitEvent: false });
      else control.enable({ emitEvent: false });
    });
  }

  private formatBrazilianZipCode(value: string | null): string {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 8);
    return digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits;
  }

  private lookupZipCode(digits: string) {
    if (this.zipCodeLookupInFlight) return;
    this.zipCodeLookupInFlight = true;

    this.addressService
      .lookupZipCode(digits)
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          this.zipCodeLookupInFlight = false;
          if (result.data) this.applyZipCodeLookup(result.data);
        },
        error: (err) => {
          this.zipCodeLookupInFlight = false;
          this.alertService.alert({
            icon: 'warning',
            title:
              err?.error?.message ??
              'Não foi possível localizar o endereço para esse CEP.',
            timer: 3000,
            showConfirmButton: false,
          });
        },
      });
  }

  /** Preenche rua/bairro/complemento e encadeia estado -> cidade (mesma técnica do autoset de edição, seção 3.2 do AI_CONTEXT). */
  private applyZipCodeLookup(data: AddressZipCodeLookup) {
    if (data.street) this.form.get('street').setValue(data.street);
    if (data.neighborhood)
      this.form.get('neighborhood').setValue(data.neighborhood);
    if (data.complement) this.form.get('complement').setValue(data.complement);

    if (!data.state) return;

    const stateEntity = StateModel.Entity.toEntity(data.state);
    this.form.get('state_id').setValue(stateEntity.id);
    this.stateEntity = stateEntity;
    this.stateSelectorRef?.autoset(stateEntity.id);
    this.cdr.detectChanges();

    if (!data.city) return;

    const cityEntity = CityModel.Entity.toEntity(data.city);
    this.form.get('city_id').setValue(cityEntity.id);
    this.cityEntity = cityEntity;
    this.citySelectorRef?.autoset(cityEntity.id);
  }

  private demoteOtherAddresses(keepId: string) {
    this.data.forEach((item) => {
      if (item.id !== keepId) item.is_main = false;
    });
  }

  private promoteAnotherAddress(excludeId: string) {
    const another = this.data.find((item) => item.id !== excludeId);
    if (another) another.is_main = true;
  }

  private emitChange() {
    this.dataChange.emit([...this.data]);
  }

  openForm() {
    this.accordion.expandAll();
    this.showForm = true;
  }

  closeForm() {
    this.accordion.collapseAll();
    this.showForm = false;
  }
}
