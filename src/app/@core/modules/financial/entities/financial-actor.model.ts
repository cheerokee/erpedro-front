import { v4 as uuidv4 } from 'uuid';

import { EntityBase } from '../../../base/entity.base';
import { CompanyModel } from '../../company/entities/company.model';
import { CustomerModel } from '../../general/entities/customer.model';

export namespace FinancialActorModel {
  export enum TypeEnum {
    COMPANY = 'COMPANY',
    CUSTOMER = 'CUSTOMER',
  }

  export type JsonProps = Omit<
    Entity,
    'company' | 'customer' | 'toModel' | 'toEntity'
  > & {
    company?: CompanyModel.JsonProps;
    customer?: CustomerModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    type: TypeEnum;

    company?: CompanyModel.Entity;
    company_id?: string;

    customer?: CustomerModel.Entity;
    customer_id?: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.company_id && props.company)
        this.company_id =
          typeof props.company === 'object' ? props.company.id : props.company;

      if (!props.customer_id && props.customer)
        this.customer_id =
          typeof props.customer === 'object'
            ? props.customer.id
            : props.customer;
    }

    override toModel(): JsonProps {
      const companyEntity = this.company;
      const customerEntity = this.customer;

      let { company, customer, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(companyEntity && { company: companyEntity.toModel() }),
        ...(customerEntity && { customer: customerEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { company, customer, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
        ...(customer && { customer: CustomerModel.Entity.toEntity(customer) }),
      });
    }
  }
}
