import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  AddressFormListComponent,
  AddressOriginType,
} from './address-form-list.component';
import { AddressModel } from '../../../../@core/modules/address/entities/address.model';
import { CountryModel } from '../../../../@core/modules/address/entities/country.model';
import { StateModel } from '../../../../@core/modules/address/entities/state.model';
import { CityModel } from '../../../../@core/modules/address/entities/city.model';
import { AlertService } from '../../../../@core/services/alert.service';
import { CountrySelectorComponent } from '../../selectors/country-selector/country-selector.component';
import { StateSelectorComponent } from '../../selectors/state-selector/state-selector.component';
import { CitySelectorComponent } from '../../selectors/city-selector/city-selector.component';

@Component({
  selector: 'app-country-selector',
  template: '',
})
class StubCountrySelector {
  @Output() selected = new EventEmitter<CountryModel.Entity | null>();
  autoset = jasmine.createSpy('autoset');
  clear = jasmine.createSpy('clear');
}

@Component({
  selector: 'app-state-selector',
  template: '',
})
class StubStateSelector {
  @Input() countryId: string | null = null;
  @Output() selected = new EventEmitter<StateModel.Entity | null>();
  autoset = jasmine.createSpy('autoset');
  clear = jasmine.createSpy('clear');
}

@Component({
  selector: 'app-city-selector',
  template: '',
})
class StubCitySelector {
  @Input() stateId: string | null = null;
  @Output() selected = new EventEmitter<CityModel.Entity | null>();
  autoset = jasmine.createSpy('autoset');
  clear = jasmine.createSpy('clear');
}

function buildAddress(overrides: Partial<AddressModel.Entity> = {}) {
  return new AddressModel.Entity({
    street: 'Av. Paulista',
    number: '1000',
    zip_code: '01310-100',
    type: AddressModel.AddressTypeEnum.NORMAL,
    is_main: false,
    country_id: null,
    state_id: null,
    city_id: null,
    ...overrides,
  } as any);
}

describe('AddressFormListComponent', () => {
  let fixture: ComponentFixture<AddressFormListComponent>;
  let component: AddressFormListComponent;
  let alertServiceSpy: jasmine.SpyObj<AlertService>;

  beforeEach(async () => {
    alertServiceSpy = jasmine.createSpyObj('AlertService', ['confirm']);

    await TestBed.configureTestingModule({
      imports: [AddressFormListComponent],
      providers: [{ provide: AlertService, useValue: alertServiceSpy }],
    })
      .overrideComponent(AddressFormListComponent, {
        remove: {
          imports: [
            CountrySelectorComponent,
            StateSelectorComponent,
            CitySelectorComponent,
          ],
        },
        add: {
          imports: [StubCountrySelector, StubStateSelector, StubCitySelector],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AddressFormListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillRequiredFields(overrides: Record<string, any> = {}) {
    component.form.patchValue({
      street: 'Av. Paulista',
      number: '1000',
      zip_code: '01310-100',
      ...overrides,
    });
  }

  it('should create with an empty, valid-once-filled form', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('type').value).toBe(
      AddressModel.AddressTypeEnum.NORMAL,
    );
    expect(component.form.get('is_main').value).toBe(true);
  });

  it('should not add when required fields are missing', () => {
    component.add();

    expect(component.data.length).toBe(0);
    expect(component.form.get('street').touched).toBe(true);
  });

  it('should add a valid address, forcing the first one to be main', () => {
    fillRequiredFields();
    component.form.patchValue({ is_main: false });

    component.add();

    expect(component.data.length).toBe(1);
    expect(component.data[0].is_main).toBe(true);
    expect(component.data[0].street).toBe('Av. Paulista');
  });

  it('should reset the form back to defaults after adding', () => {
    fillRequiredFields();
    component.add();

    expect(component.form.get('street').value).toBeNull();
    expect(component.form.get('is_main').value).toBe(true);
  });

  it('should emit the updated list via dataChange on add', () => {
    const emitted: AddressModel.Entity[][] = [];
    component.dataChange.subscribe((list) => emitted.push(list));

    fillRequiredFields();
    component.add();

    expect(emitted.length).toBe(1);
    expect(emitted[0].length).toBe(1);
    expect(emitted[0]).not.toBe(component.data);
  });

  it('should keep only one address marked as main when a second is added as main', () => {
    component.data = [buildAddress({ is_main: true })];

    fillRequiredFields({ street: 'Rua das Flores', is_main: true });
    component.add();

    expect(component.data.length).toBe(2);
    const mains = component.data.filter((item) => item.is_main);
    expect(mains.length).toBe(1);
    expect(mains[0].street).toBe('Rua das Flores');
  });

  it('should populate the form when editing an existing address', () => {
    const address = buildAddress({ street: 'Rua Augusta', is_main: true });
    component.data = [address];

    component.edit(address.id);

    expect(component.form.get('id').value).toBe(address.id);
    expect(component.form.get('street').value).toBe('Rua Augusta');
  });

  it('should update the edited address in place on save', () => {
    const address = buildAddress({ street: 'Rua Augusta', is_main: true });
    component.data = [address];

    component.edit(address.id);
    component.form.patchValue({ street: 'Rua Augusta, 500' });
    component.save();

    expect(component.data.length).toBe(1);
    expect(component.data[0].street).toBe('Rua Augusta, 500');
    expect(component.data[0].is_main).toBe(true);
  });

  it('should promote another address to main when the main one is unchecked on save', () => {
    const main = buildAddress({ street: 'Principal', is_main: true });
    const other = buildAddress({ street: 'Secundário', is_main: false });
    component.data = [main, other];

    component.edit(main.id);
    component.form.patchValue({ is_main: false });
    component.save();

    expect(component.data.find((item) => item.id === main.id).is_main).toBe(
      false,
    );
    expect(
      component.data.find((item) => item.id === other.id).is_main,
    ).toBe(true);
  });

  it('should remove an address after confirmation', async () => {
    const address = buildAddress();
    component.data = [address];
    alertServiceSpy.confirm.and.resolveTo({ isConfirmed: true } as any);

    await component.remove(address.id);

    expect(component.data.length).toBe(0);
  });

  it('should not remove an address when the confirmation is dismissed', async () => {
    const address = buildAddress();
    component.data = [address];
    alertServiceSpy.confirm.and.resolveTo({ isConfirmed: false } as any);

    await component.remove(address.id);

    expect(component.data.length).toBe(1);
  });

  it('should promote another address to main after removing the main one', async () => {
    const main = buildAddress({ street: 'Principal', is_main: true });
    const other = buildAddress({ street: 'Secundário', is_main: false });
    component.data = [main, other];
    alertServiceSpy.confirm.and.resolveTo({ isConfirmed: true } as any);

    await component.remove(main.id);

    expect(component.data.length).toBe(1);
    expect(component.data[0].is_main).toBe(true);
  });

  it('should clear the form when removing the address currently being edited', async () => {
    const address = buildAddress({ street: 'Rua Augusta' });
    component.data = [address];
    alertServiceSpy.confirm.and.resolveTo({ isConfirmed: true } as any);

    component.edit(address.id);
    await component.remove(address.id);

    expect(component.form.get('id').value).toBeNull();
    expect(component.form.get('street').value).toBeNull();
  });

  it('should pre-fill customer_id from owner when origin is Customer', () => {
    component.origin = AddressOriginType.Customer;
    component.owner = 'customer-123';

    component.clear();

    expect(component.form.get('customer_id').value).toBe('customer-123');
    expect(component.form.get('employee_id').value).toBeNull();
  });

  it('should render one table row per address in data', () => {
    component.data = [
      buildAddress({ street: 'Rua A' }),
      buildAddress({ street: 'Rua B' }),
    ];
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });
});
