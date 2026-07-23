import { v4 as uuidv4 } from 'uuid';

import { EntityBase } from '../../../base/entity.base';
import { EmployeeModel } from '../../general/entities/employee.model';
import { FinancialTransactionModel } from './financial-transaction.model';

export namespace FinancialInstallmentModel {
  export type JsonProps = Omit<
    Entity,
    'paid_by' | 'transactions' | 'toModel' | 'toEntity'
  > & {
    paid_by?: EmployeeModel.JsonProps;
    transactions?: FinancialTransactionModel.JsonProps[];
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    number_installment: number;
    due_date: string;
    amount: number;
    paid_out?: boolean;
    paid_at?: Date;

    paid_by?: EmployeeModel.Entity;
    paid_by_id?: string;

    bill_id: string;

    transactions?: FinancialTransactionModel.Entity[];

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;
      this.paid_at = props.paid_at ? new Date(props.paid_at) : null;

      if (!props.paid_by_id && props.paid_by)
        this.paid_by_id =
          typeof props.paid_by === 'object' ? props.paid_by.id : props.paid_by;
    }

    override toModel(): JsonProps {
      const paidByEntity = this.paid_by;
      const transactionsEntities = this.transactions;

      let { paid_by, transactions, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(paidByEntity && { paid_by: paidByEntity.toModel() }),
        ...(transactionsEntities?.length > 0 && {
          transactions: transactionsEntities.map((entity) => entity.toModel()),
        }),
      };
    }

    static toEntity(data: JsonProps) {
      const { paid_by, transactions, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        paid_at: props.paid_at ? new Date(props.paid_at) : null,
        ...(paid_by && { paid_by: EmployeeModel.Entity.toEntity(paid_by) }),
        ...(transactions?.length > 0 && {
          transactions: transactions.map((model) =>
            FinancialTransactionModel.Entity.toEntity(model),
          ),
        }),
      });
    }
  }
}
