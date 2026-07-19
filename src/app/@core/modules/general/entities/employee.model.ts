import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { UserModel } from '../../account/entities/user.model';
import { CompanyModel } from '../../company/entities/company.model';
import { AddressModel } from '../../address/entities/address.model';

export namespace EmployeeModel {
  export type JsonProps = Omit<
    Entity,
    'user' | 'company' | 'addresses' | 'toModel' | 'toEntity'
  > & {
    user?: UserModel.JsonProps;
    company?: CompanyModel.JsonProps;
    addresses?: AddressModel.JsonProps[];
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    country_code?: number;
    phone_number?: number;

    user?: UserModel.Entity;
    user_id: string;

    company?: CompanyModel.Entity;
    company_id: string;

    addresses?: AddressModel.Entity[];

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.user_id && props.user)
        this.user_id =
          typeof props.user === 'object' ? props.user.id : props.user;

      if (!props.company_id && props.company)
        this.company_id =
          typeof props.company === 'object' ? props.company.id : props.company;
    }

    override toModel(): JsonProps {
      const userEntity = this.user;
      const companyEntity = this.company;
      const addressesEntities = this.addresses;

      let { user, company, addresses, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(userEntity && { user: userEntity.toModel() }),
        ...(companyEntity && { company: companyEntity.toModel() }),
        ...(addressesEntities?.length > 0 && {
          addresses: addressesEntities.map((entity) => entity.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { user, company, addresses, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(user && { user: UserModel.Entity.toEntity(user) }),
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
        ...(addresses?.length > 0 && {
          addresses: addresses.map((model) =>
            AddressModel.Entity.toEntity(model),
          ),
        }),
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
