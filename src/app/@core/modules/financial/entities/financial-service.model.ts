import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { CompanyModel } from '../../company/entities/company.model';

export namespace FinancialServiceModel {
  export type JsonProps = Omit<Entity, 'company' | 'toModel' | 'toEntity'> & {
    company?: CompanyModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    description?: string;
    price: number;
    active?: boolean;

    company?: CompanyModel.Entity;
    company_id: string;

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
    }

    override toModel(): JsonProps {
      const companyEntity = this.company;

      let { company, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(companyEntity && { company: companyEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { company, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
      });
    }
  }

  export class Filter {
    name?: string;
    company_id?: string;
    active?: boolean;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
