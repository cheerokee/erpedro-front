import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { UserModel } from '../../account/entities/user.model';
import { CompanyModel } from '../../company/entities/company.model';
import { AddressModel } from '../../address/entities/address.model';
import { v4 as uuidv4 } from 'uuid';

export namespace CustomerModel {
  export type JsonProps = Omit<
    Entity,
    'user' | 'company' | 'addresses' | 'father' | 'mother' | 'toModel' | 'toEntity'
  > & {
    user?: UserModel.JsonProps;
    company?: CompanyModel.JsonProps;
    addresses?: AddressModel.JsonProps[];
    father?: JsonProps;
    mother?: JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    document?: string;
    country_code?: number;
    phone_number?: number;
    gender?: GenderEnum;
    birthdate?: string;
    place_birth?: string;

    // pai/mãe são o próprio Customer (auto-relacionamento), não um UserModel
    // (login) — ver Customer entity (backend, ManyToOne(() => Customer)).
    father?: Entity;
    father_id?: string;

    mother?: Entity;
    mother_id?: string;

    user?: UserModel.Entity;
    user_id: string;

    company?: CompanyModel.Entity;
    company_id: string;

    addresses?: AddressModel.Entity[];

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

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

      if (!props.father_id && props.father)
        this.father_id =
          typeof props.father === 'object' ? props.father.id : props.father;

      if (!props.mother_id && props.mother)
        this.mother_id =
          typeof props.mother === 'object' ? props.mother.id : props.mother;
    }

    override toModel(): JsonProps {
      const userEntity = this.user;
      const companyEntity = this.company;
      const addressesEntities = this.addresses;
      const fatherEntity = this.father;
      const motherEntity = this.mother;

      let { user, company, addresses, father, mother, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(userEntity && { user: userEntity.toModel() }),
        ...(companyEntity && { company: companyEntity.toModel() }),
        ...(fatherEntity && { father: fatherEntity.toModel() }),
        ...(motherEntity && { mother: motherEntity.toModel() }),
        ...(addressesEntities?.length > 0 && {
          addresses: addressesEntities.map((entity) => entity.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { user, company, addresses, father, mother, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(user && { user: UserModel.Entity.toEntity(user) }),
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
        ...(father && { father: Entity.toEntity(father) }),
        ...(mother && { mother: Entity.toEntity(mother) }),
        ...(addresses?.length > 0 && {
          addresses: addresses.map((model) =>
            AddressModel.Entity.toEntity(model),
          ),
        }),
      });
    }
  }

  export class Filter {
    name?: string;
    document?: string;
    user_id?: string;
    company_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export enum GenderEnum {
    MASCULINE = 'masculine',
    FEMININE = 'feminine',
  }

  export class ResultList extends defaultResultList<Entity> {}
}
