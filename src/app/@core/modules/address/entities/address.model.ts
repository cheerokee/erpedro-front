import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { CountryModel } from './country.model';
import { StateModel } from './state.model';
import { CityModel } from './city.model';
import { CustomerModel } from '../../general/entities/customer.model';
import { EmployeeModel } from '../../general/entities/employee.model';

export namespace AddressModel {
  export type JsonProps = Omit<
    Entity,
    'country' | 'state' | 'city' | 'toModel' | 'toEntity'
  > & {
    country?: CountryModel.JsonProps;
    state?: StateModel.JsonProps;
    city?: CityModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    street: string;
    number: string;
    complement?: string;
    neighborhood?: string;
    zip_code: string;
    type: AddressTypeEnum;
    is_main?: boolean;

    customer?: CustomerModel.Entity;
    customer_id?: string;

    employee?: EmployeeModel.Entity;
    employee_id?: string;

    country?: CountryModel.Entity;
    country_id: string;

    state?: StateModel.Entity;
    state_id: string;

    city?: CityModel.Entity;
    city_id: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.country_id && props.country)
        this.country_id =
          typeof props.country === 'object' ? props.country.id : props.country;

      if (!props.state_id && props.state)
        this.state_id =
          typeof props.state === 'object' ? props.state.id : props.state;

      if (!props.city_id && props.city)
        this.city_id =
          typeof props.city === 'object' ? props.city.id : props.city;

      if (!props.customer_id && props.customer)
        this.customer_id =
          typeof props.customer === 'object'
            ? props.customer.id
            : props.customer;

      if (!props.employee_id && props.employee)
        this.employee_id =
          typeof props.employee === 'object'
            ? props.employee.id
            : props.employee;
    }

    override toModel(): JsonProps {
      const countryEntity = this.country;
      const stateEntity = this.state;
      const cityEntity = this.city;
      const customerEntity = this.customer;
      const employeeEntity = this.employee;

      let { country, state, city, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(countryEntity && { country: countryEntity.toModel() }),
        ...(stateEntity && { state: stateEntity.toModel() }),
        ...(cityEntity && { city: cityEntity.toModel() }),
        ...(customerEntity && { customer: customerEntity.toModel() }),
        ...(employeeEntity && { employee: employeeEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { country, state, city, customer, employee, ...props } = data;
      return new Entity({
        ...props,
        created_at: props.created_at ? new Date(props.created_at) : new Date(),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(country && { country: CountryModel.Entity.toEntity(country) }),
        ...(state && { state: StateModel.Entity.toEntity(state) }),
        ...(city && { city: CityModel.Entity.toEntity(city) }),
        ...(customer && { customer: CustomerModel.Entity.toEntity(customer) }),
        ...(employee && { employee: EmployeeModel.Entity.toEntity(employee) }),
      });
    }
  }

  export enum AddressTypeEnum {
    NORMAL = 'normal',
  }

  export const AddressTypeEnumStr = {
    normal: 'Normal',
  };

  export class Filter {
    address_search?: string; // Pesquisa por rua, bairro, cep
    country_id?: string;
    state_id?: string;
    city_id?: string;
    customer_id?: string;
    employee_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
