import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { CountryModel } from './country.model';
import { v4 as uuidv4 } from 'uuid';

export namespace StateModel {
  export type JsonProps = Omit<Entity, 'country' | 'toModel' | 'toEntity'> & {
    country?: CountryModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    code: string; // UF, ex.: "SP"

    country?: CountryModel.Entity;
    country_id: string;

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
    }

    override toModel(): JsonProps {
      const countryEntity = this.country;

      let { country, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(countryEntity && { country: countryEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { country, ...props } = data;
      return new Entity({
        ...props,
        created_at: props.created_at ? new Date(props.created_at) : new Date(),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(country && { country: CountryModel.Entity.toEntity(country) }),
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
