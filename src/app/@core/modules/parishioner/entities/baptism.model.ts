import { v4 as uuidv4 } from 'uuid';

import { FinancialBillModel } from '../../financial/entities/financial-bill.model';
import { ResultList as defaultResultList } from '../../../base/result-list';
import { CustomerModel } from '../../general/entities/customer.model';
import { CompanyModel } from '../../company/entities/company.model';
import { EmployeeModel } from '../../general/entities/employee.model';
import { BaptismGodparentModel } from './baptism-godparent.model';
import { EntityBase } from '../../../base/entity.base';

export namespace BaptismModel {
  export type JsonProps = Omit<
    Entity,
    'company' | 'parishioner' | 'bill' | 'godparents' | 'celebrant' | 'toEntity'
  > & {
    company?: CompanyModel.JsonProps;
    parishioner?: CustomerModel.JsonProps;
    bill?: FinancialBillModel.JsonProps;
    godparents?: BaptismGodparentModel.JsonProps[];
    celebrant?: EmployeeModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    baptism_place: string;
    baptism_date: string;
    observation?: string;

    registry_book?: string;
    registry_page?: string;
    registry_term?: string;

    company: CompanyModel.Entity;
    company_id: string;

    parishioner: CustomerModel.Entity;
    parishioner_id: string;

    bill?: FinancialBillModel.Entity;
    bill_id?: string;

    celebrant?: EmployeeModel.Entity;
    celebrant_id?: string;

    godparents?: BaptismGodparentModel.Entity[];

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

      if (!props.parishioner_id && props.parishioner)
        this.parishioner_id =
          typeof props.parishioner === 'object'
            ? props.parishioner.id
            : props.parishioner;

      if (!props.bill_id && props.bill)
        this.bill_id =
          typeof props.bill === 'object' ? props.bill.id : props.bill;

      if (!props.celebrant_id && props.celebrant)
        this.celebrant_id =
          typeof props.celebrant === 'object'
            ? props.celebrant.id
            : props.celebrant;
    }

    override toModel(): JsonProps {
      const companyEntity = this.company;
      const parishionerEntity = this.parishioner;
      const billEntity = this.bill;
      const celebrantEntity = this.celebrant;
      const godParentEntities = this.godparents;

      let { company, parishioner, bill, celebrant, godparents, ...props } =
        super.toModel() as any;

      return {
        ...props,
        ...(companyEntity && { company: companyEntity.toModel() }),
        ...(parishionerEntity && { parishioner: parishionerEntity.toModel() }),
        ...(billEntity && { bill: billEntity.toModel() }),
        ...(celebrantEntity && { celebrant: celebrantEntity.toModel() }),
        ...(godParentEntities?.length > 0 && {
          godparents: godParentEntities.map((entity) => entity.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { bill, parishioner, company, celebrant, godparents, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
        ...(bill && { bill: FinancialBillModel.Entity.toEntity(bill) }),
        ...(parishioner && {
          parishioner: CustomerModel.Entity.toEntity(parishioner),
        }),
        ...(celebrant && {
          celebrant: EmployeeModel.Entity.toEntity(celebrant),
        }),
        ...(godparents?.length > 0 && {
          godparents: godparents.map((item) => {
            return BaptismGodparentModel.Entity.toEntity(item);
          }),
        }),
      });
    }
  }

  export class Filter {
    company_id?: string;
    parishioner_id?: string;
    bill_id?: string;
    baptism_place?: string;
    baptism_date?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
