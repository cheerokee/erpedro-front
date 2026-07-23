import { v4 as uuidv4 } from 'uuid';

import { EntityBase } from '../../../base/entity.base';

export namespace FinancialTransactionModel {
  export enum PaymentMethodEnum {
    CASH = 'CASH',
    CREDIT_CARD = 'CREDIT_CARD',
    DEBIT_CARD = 'DEBIT_CARD',
    BILLET = 'BILLET',
    PIX = 'PIX',
  }

  export const PaymentMethodEnumStr: Record<PaymentMethodEnum, string> = {
    [PaymentMethodEnum.CASH]: 'Dinheiro',
    [PaymentMethodEnum.CREDIT_CARD]: 'Cartão de crédito',
    [PaymentMethodEnum.DEBIT_CARD]: 'Cartão de débito',
    [PaymentMethodEnum.BILLET]: 'Boleto',
    [PaymentMethodEnum.PIX]: 'PIX',
  };

  export enum StatusEnum {
    PENDING = 'PENDING',
    WAITING_FOR_VALIDATION = 'WAITING_FOR_VALIDATION',
    CONCLUDED = 'CONCLUDED',
    CANCELED = 'CANCELED',
  }

  export const StatusEnumStr: Record<StatusEnum, string> = {
    [StatusEnum.PENDING]: 'Pendente',
    [StatusEnum.WAITING_FOR_VALIDATION]: 'Aguardando validação',
    [StatusEnum.CONCLUDED]: 'Concluída',
    [StatusEnum.CANCELED]: 'Cancelada',
  };

  export type JsonProps = Omit<Entity, 'toModel' | 'toEntity'>;

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    amount: number;
    payment_method: PaymentMethodEnum;
    status: StatusEnum;

    installment_id: string;

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

    static toEntity(data: JsonProps) {
      return new Entity({
        ...data,
        created_at: new Date(data.created_at),
        updated_at: data.updated_at ? new Date(data.updated_at) : null,
        deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
      });
    }
  }
}
