import { v4 as uuidv4 } from 'uuid';

import { EntityBase } from '../../../base/entity.base';
import { FinancialServiceModel } from './financial-service.model';

export namespace FinancialBillItemModel {
  export type JsonProps = Omit<Entity, 'service' | 'toModel' | 'toEntity'> & {
    service?: FinancialServiceModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    quantity: number;
    unit_price: number;
    description?: string;

    bill_id: string;

    service?: FinancialServiceModel.Entity;
    service_id: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.service_id && props.service)
        this.service_id =
          typeof props.service === 'object' ? props.service.id : props.service;
    }

    override toModel(): JsonProps {
      const serviceEntity = this.service;

      let { service, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(serviceEntity && { service: serviceEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { service, ...props } = data;
      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(service && {
          service: FinancialServiceModel.Entity.toEntity(service),
        }),
      });
    }
  }
}
