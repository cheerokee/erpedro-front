import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { v4 as uuidv4 } from 'uuid';

export namespace CountryModel {
  export type JsonProps = Omit<Entity, 'toModel' | 'toEntity'> & {};

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    code: string; // ISO 3166-1 alpha-2, ex.: "BR"

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;
    }

    override toModel(): JsonProps {
      let { ...props } = super.toModel() as any;

      return {
        ...props,
      };
    }

    static toEntity(data: JsonProps) {
      const { ...props } = data;
      return new Entity({
        ...props,
        created_at: props.created_at ? new Date(props.created_at) : new Date(),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
