import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { RoleModel } from '../../acl/entities/role.model';
import { v4 as uuidv4 } from 'uuid';

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
    password?: string;

    avatar?: string;

    roles?: RoleModel.Entity[];

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

  // q: busca por nome OU email (OR, via FilterParam type:'orx' — ver
  // UserService.buildFilterParams). company_id: filtra usuários que têm
  // alguma role vinculada a essa company (não existe company_id no próprio
  // User — ver AI_CONTEXT.md, decisão de não modelar "a empresa do usuário",
  // já que um usuário pode ser colaborador/paroquiano em várias paróquias).
  export class Filter {
    q?: string;
    role_id?: string;
    company_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
