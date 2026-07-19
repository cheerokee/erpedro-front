import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { CountryModel } from './country.model';
import { StateModel } from './state.model';
import { CityModel } from './city.model';

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

    country?: CountryModel.Entity;
    country_id: string;

    state?: StateModel.Entity;
    state_id: string;

    city?: CityModel.Entity;
    city_id: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

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
    }

    override toModel(): JsonProps {
      const countryEntity = this.country;
      const stateEntity = this.state;
      const cityEntity = this.city;

      let { country, state, city, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(countryEntity && { country: countryEntity.toModel() }),
        ...(stateEntity && { state: stateEntity.toModel() }),
        ...(cityEntity && { city: cityEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { country, state, city, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(country && { country: CountryModel.Entity.toEntity(country) }),
        ...(state && { state: StateModel.Entity.toEntity(state) }),
        ...(city && { city: CityModel.Entity.toEntity(city) }),
      });
    }
  }

  export enum AddressTypeEnum {
    NORMAL = 'normal',
  }

  export class ResultList extends defaultResultList<Entity> {}
}
