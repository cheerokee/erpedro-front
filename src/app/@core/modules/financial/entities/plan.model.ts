import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';

export namespace PlanModel {
  export enum TargetEnum {
    HOLDING = 'holding',
    COMPANY = 'company',
  }

  export type JsonProps = Omit<Entity, 'toModel' | 'toEntity'>;

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;
    target: TargetEnum;
    price: number;
    max_companies?: number;
    features?: string[];
    is_public?: boolean;
    stripe_price_id?: string;
    trial_days?: number;

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

  export class ResultList extends defaultResultList<Entity> {}
}
