import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { StateModel } from './state.model';
import { v4 as uuidv4 } from 'uuid';

export namespace CityModel {
  export type JsonProps = Omit<Entity, 'state' | 'toModel' | 'toEntity'> & {
    state?: StateModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    name: string;

    state?: StateModel.Entity;
    state_id: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.state_id && props.state)
        this.state_id =
          typeof props.state === 'object' ? props.state.id : props.state;
    }

    override toModel(): JsonProps {
      const stateEntity = this.state;

      let { ...props } = super.toModel() as any;

      return {
        ...props,
        ...(stateEntity && { state: stateEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { state, ...props } = data;
      return new Entity({
        ...props,
        created_at: props.created_at ? new Date(props.created_at) : new Date(),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(state && { state: StateModel.Entity.toEntity(state) }),
      });
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
