import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { ConfirmationModel } from './confirmation.model';
import { CustomerModel } from '../../general/entities/customer.model';

export namespace ConfirmationGodparentModel {
  export type JsonProps = Omit<
    Entity,
    'confirmation' | 'godparent' | 'toModel' | 'toEntity'
  > & {
    confirmation?: ConfirmationModel.JsonProps;
    godparent?: CustomerModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    course_date?: string;
    course_hours?: number; // Horas de curso
    course_place?: string;

    confirmation: ConfirmationModel.Entity;
    confirmation_id: string;

    // Modelo híbrido — OU godparent/godparent_id (Customer já cadastrado) OU
    // godparent_name/godparent_origin_parish (pessoa externa, texto livre).
    godparent?: CustomerModel.Entity;
    godparent_id?: string;
    godparent_name?: string;
    godparent_origin_parish?: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.confirmation_id && props.confirmation)
        this.confirmation_id =
          typeof props.confirmation === 'object'
            ? props.confirmation.id
            : props.confirmation;

      if (!props.godparent_id && props.godparent)
        this.godparent_id =
          typeof props.godparent === 'object'
            ? props.godparent.id
            : props.godparent;
    }

    override toModel(): JsonProps {
      const confirmationEntity = this.confirmation;
      const godparentEntity = this.godparent;

      let { confirmation, godparent, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(confirmationEntity && { confirmation: confirmationEntity.toModel() }),
        ...(godparentEntity && { godparent: godparentEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { confirmation, godparent, ...props } = data;

      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(confirmation && {
          confirmation: ConfirmationModel.Entity.toEntity(confirmation),
        }),
        ...(godparent && {
          godparent: CustomerModel.Entity.toEntity(godparent),
        }),
      });
    }
  }

  export class Filter {
    confirmation_id?: string;
    godparent_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
