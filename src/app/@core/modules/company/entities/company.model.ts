import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { UserModel } from '../../account/entities/user.model';
import { PlanModel } from '../../financial/entities/plan.model';
import { ResultModel } from '../../../models/result.model';
import { EntityBase } from '../../../base/entity.base';

export namespace CompanyModel {
  // Mesmo ciclo de vida de assinatura usado em Holding — ver BillingStatusEnum (backend).
  export enum BillingStatusEnum {
    ACTIVE = 'active',
    TRIAL = 'trial',
    PAST_DUE = 'past_due',
    INACTIVE = 'inactive',
  }

  export type JsonProps = Omit<Entity, 'owner' | 'plan' | 'toModel' | 'toEntity'> & {
    owner?: UserModel.JsonProps;
    plan?: PlanModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;

    owner?: UserModel.Entity;
    owner_id?: string;

    holding_id?: string;

    plan?: PlanModel.Entity;
    plan_id?: string;

    status?: BillingStatusEnum;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.owner_id && props.owner)
        this.owner_id =
          typeof props.owner === 'object' ? props.owner.id : props.owner;

      if (!props.plan_id && props.plan)
        this.plan_id =
          typeof props.plan === 'object' ? props.plan.id : props.plan;
    }

    override toModel(): JsonProps {
      const { owner, plan, ...props } = super.toModel() as any;

      return props;
    }

    static toEntity(data: JsonProps) {
      const { owner, plan, ...props } = data;

      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(owner && { owner: CompanyModel.Entity.toEntity(owner) }),
        ...(plan && { plan: PlanModel.Entity.toEntity(plan) }),
      });
    }
  }

  export class Filter {
    name?: string;
    owner_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}

  export const ResultMapper = (
    result: ResultModel<any>,
  ): ResultModel<Entity[]> => {
    for (let i = 0; i < (result?.data?.length ?? 0); i++) {
      const item = result.data[i];
      result.data[i] = new Entity({
        ...item,
      });
    }

    return result;
  };
}
