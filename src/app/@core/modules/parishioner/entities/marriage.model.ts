import { v4 as uuidv4 } from 'uuid';

import { FinancialBillModel } from '../../financial/entities/financial-bill.model';
import { ResultList as defaultResultList } from '../../../base/result-list';
import { CustomerModel } from '../../general/entities/customer.model';
import { CompanyModel } from '../../company/entities/company.model';
import { EmployeeModel } from '../../general/entities/employee.model';
import { MarriageWitnessModel } from './marriage-witness.model';
import { EntityBase } from '../../../base/entity.base';

export namespace MarriageModel {
  export type JsonProps = Omit<
    Entity,
    'company' | 'husband' | 'wife' | 'bill' | 'witnesses' | 'celebrant' | 'toEntity'
  > & {
    company?: CompanyModel.JsonProps;
    husband?: CustomerModel.JsonProps;
    wife?: CustomerModel.JsonProps;
    bill?: FinancialBillModel.JsonProps;
    witnesses?: MarriageWitnessModel.JsonProps[];
    celebrant?: EmployeeModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    marriage_place: string;
    marriage_date: string;
    observation?: string;

    registry_book?: string;
    registry_page?: string;
    registry_term?: string;

    company: CompanyModel.Entity;
    company_id: string;

    // Diferente de Batismo/Primeira Comunhão/Crisma: não há "um paroquiano",
    // são dois (marido e esposa) — sem invariante de "só um registro por
    // paroquiano" (viuvez/anulação canônica permitem mais de um casamento).
    husband: CustomerModel.Entity;
    husband_id: string;

    wife: CustomerModel.Entity;
    wife_id: string;

    bill?: FinancialBillModel.Entity;
    bill_id?: string;

    celebrant?: EmployeeModel.Entity;
    celebrant_id?: string;

    witnesses?: MarriageWitnessModel.Entity[];

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

      if (!props.husband_id && props.husband)
        this.husband_id =
          typeof props.husband === 'object' ? props.husband.id : props.husband;

      if (!props.wife_id && props.wife)
        this.wife_id =
          typeof props.wife === 'object' ? props.wife.id : props.wife;

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
      const husbandEntity = this.husband;
      const wifeEntity = this.wife;
      const billEntity = this.bill;
      const celebrantEntity = this.celebrant;
      const witnessEntities = this.witnesses;

      let { company, husband, wife, bill, celebrant, witnesses, ...props } =
        super.toModel() as any;

      return {
        ...props,
        ...(companyEntity && { company: companyEntity.toModel() }),
        ...(husbandEntity && { husband: husbandEntity.toModel() }),
        ...(wifeEntity && { wife: wifeEntity.toModel() }),
        ...(billEntity && { bill: billEntity.toModel() }),
        ...(celebrantEntity && { celebrant: celebrantEntity.toModel() }),
        ...(witnessEntities?.length > 0 && {
          witnesses: witnessEntities.map((entity) => entity.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { bill, husband, wife, company, celebrant, witnesses, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
        ...(bill && { bill: FinancialBillModel.Entity.toEntity(bill) }),
        ...(husband && { husband: CustomerModel.Entity.toEntity(husband) }),
        ...(wife && { wife: CustomerModel.Entity.toEntity(wife) }),
        ...(celebrant && {
          celebrant: EmployeeModel.Entity.toEntity(celebrant),
        }),
        ...(witnesses?.length > 0 && {
          witnesses: witnesses.map((item) => {
            return MarriageWitnessModel.Entity.toEntity(item);
          }),
        }),
      });
    }
  }

  export class Filter {
    company_id?: string;
    parishioner_id?: string;
    bill_id?: string;
    marriage_place?: string;
    marriage_date?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
