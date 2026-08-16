import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { UserModel } from '../../account/entities/user.model';
import { PlanModel } from '../../financial/entities/plan.model';
import { EntityBase } from '../../../base/entity.base';
import { CompanyModel } from './company.model';

export namespace HoldingModel {
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

    plan?: PlanModel.Entity;
    plan_id?: string;

    status: CompanyModel.BillingStatusEnum;
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
        ...(owner && { owner: UserModel.Entity.toEntity(owner) }),
        ...(plan && { plan: PlanModel.Entity.toEntity(plan) }),
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
