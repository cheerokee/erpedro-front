import { ResultList as defaultResultList } from '../../../base/result-list';
import { ResultModel } from '../../../models/result.model';
import { EntityBase } from '../../../base/entity.base';
import { v4 as uuidv4 } from 'uuid';

export namespace CompanyModel {
  // export type JsonProps = Omit<Entity, 'owner' | 'toModel' | 'toEntity'> & {
  //   owner?: any;
  // };

  export type JsonProps = Omit<Entity, 'toModel' | 'toEntity'> & {};

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;

    // owner?: Entity;
    // owner_id?: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      // if (!props.owner_id && props.owner)
      //   this.owner_id =
      //     typeof props.owner === 'object' ? props.owner.id : props.owner;
    }

    override toModel(): JsonProps {
      const { owner, ...props } = super.toModel() as any;

      // props.created_at = props.created_at.toISOString();
      // props.updated_at = props.updated_at?.toISOString() ?? null;
      // props.deleted_at = props.deleted_at?.toISOString() ?? null;

      return props;
    }

    static toEntity(data: JsonProps) {
      const { ...props } = data;
      // const { owner, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        // ...(owner && { owner: CompanyModel.Entity.toEntity(owner) }),
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}

  export const ResultMapper = (
    result: ResultModel<any>,
  ): ResultModel<Entity[]> => {
    for (let i = 0; i < (result?.data?.length ?? 0); i++) {
      const item = result.data[i];
      result.data[i] = new Entity({
        ...item,
      });
    }

    return result;
  };
}
