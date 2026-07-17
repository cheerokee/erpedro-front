import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { RoleModel } from '../../acl/entities/role.model';

export namespace UserModel {
  export type JsonProps = Omit<Entity, 'roles' | 'toModel' | 'toEntity'> & {
    roles?: RoleModel.JsonProps[];
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    email: string;

    roles?: RoleModel.Entity[];

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;
    }

    override toModel(): JsonProps {
      const roles = this.roles;

      let { country, state, city, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(roles?.length > 0 && {
          roles: roles.map((role) => role.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { roles, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(roles?.length > 0 && {
          roles: roles.map((role) => RoleModel.Entity.toEntity(role)),
        }),
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
