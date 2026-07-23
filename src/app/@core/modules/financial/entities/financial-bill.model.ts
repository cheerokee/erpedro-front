import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { CompanyModel } from '../../company/entities/company.model';
import { FinancialActorModel } from './financial-actor.model';
import { FinancialInstallmentModel } from './financial-installment.model';
import { FinancialBillItemModel } from './financial-bill-item.model';

export namespace FinancialBillModel {
  export enum StatusEnum {
    OPEN = 'OPEN',
    PARTIALLY_PAID = 'PARTIALLY_PAID',
    PAID = 'PAID',
    CANCELED = 'CANCELED',
  }

  export const StatusEnumStr: Record<StatusEnum, string> = {
    [StatusEnum.OPEN]: 'Aberta',
    [StatusEnum.PARTIALLY_PAID]: 'Parcialmente paga',
    [StatusEnum.PAID]: 'Quitada',
    [StatusEnum.CANCELED]: 'Cancelada',
  };

  export type JsonProps = Omit<
    Entity,
    'debtor' | 'creditor' | 'company' | 'installments' | 'items' | 'toModel' | 'toEntity'
  > & {
    debtor?: FinancialActorModel.JsonProps;
    creditor?: FinancialActorModel.JsonProps;
    company?: CompanyModel.JsonProps;
    installments?: FinancialInstallmentModel.JsonProps[];
    items?: FinancialBillItemModel.JsonProps[];
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    code?: number;
    release_date: string;
    total: number;
    status: StatusEnum;

    debtor?: FinancialActorModel.Entity;
    debtor_id: string;

    creditor?: FinancialActorModel.Entity;
    creditor_id: string;

    company?: CompanyModel.Entity;
    company_id: string;

    installments?: FinancialInstallmentModel.Entity[];
    items?: FinancialBillItemModel.Entity[];

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.debtor_id && props.debtor)
        this.debtor_id =
          typeof props.debtor === 'object' ? props.debtor.id : props.debtor;

      if (!props.creditor_id && props.creditor)
        this.creditor_id =
          typeof props.creditor === 'object' ? props.creditor.id : props.creditor;

      if (!props.company_id && props.company)
        this.company_id =
          typeof props.company === 'object' ? props.company.id : props.company;
    }

    override toModel(): JsonProps {
      const debtorEntity = this.debtor;
      const creditorEntity = this.creditor;
      const companyEntity = this.company;
      const installmentsEntities = this.installments;
      const itemsEntities = this.items;

      let { debtor, creditor, company, installments, items, ...props } =
        super.toModel() as any;

      return {
        ...props,
        ...(debtorEntity && { debtor: debtorEntity.toModel() }),
        ...(creditorEntity && { creditor: creditorEntity.toModel() }),
        ...(companyEntity && { company: companyEntity.toModel() }),
        ...(installmentsEntities?.length > 0 && {
          installments: installmentsEntities.map((entity) => entity.toModel()),
        }),
        ...(itemsEntities?.length > 0 && {
          items: itemsEntities.map((entity) => entity.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { debtor, creditor, company, installments, items, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(debtor && { debtor: FinancialActorModel.Entity.toEntity(debtor) }),
        ...(creditor && {
          creditor: FinancialActorModel.Entity.toEntity(creditor),
        }),
        ...(company && { company: CompanyModel.Entity.toEntity(company) }),
        ...(installments?.length > 0 && {
          installments: installments.map((model) =>
            FinancialInstallmentModel.Entity.toEntity(model),
          ),
        }),
        ...(items?.length > 0 && {
          items: items.map((model) =>
            FinancialBillItemModel.Entity.toEntity(model),
          ),
        }),
      });
    }
  }

  export class Filter {
    company_id?: string;
    status?: StatusEnum;
    code?: number;
    debtor_customer_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
