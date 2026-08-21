import { v4 as uuidv4 } from 'uuid';

import { ResultList as defaultResultList } from '../../../base/result-list';
import { EntityBase } from '../../../base/entity.base';
import { MarriageModel } from './marriage.model';
import { CustomerModel } from '../../general/entities/customer.model';

export namespace MarriageWitnessModel {
  export type JsonProps = Omit<
    Entity,
    'marriage' | 'witness' | 'toModel' | 'toEntity'
  > & {
    marriage?: MarriageModel.JsonProps;
    witness?: CustomerModel.JsonProps;
  };

  export class Entity extends EntityBase<Entity> {
    id: string;
    created_at?: Date;
    updated_at?: Date;
    deleted_at?: Date;

    marriage: MarriageModel.Entity;
    marriage_id: string;

    // Modelo híbrido — OU witness/witness_id (Customer já cadastrado) OU
    // witness_name/witness_origin_parish (pessoa externa, texto livre). Sem
    // campos de curso (diferente do padrinho de Batismo/Primeira
    // Comunhão/Crisma) — testemunha de casamento não passa por curso.
    witness?: CustomerModel.Entity;
    witness_id?: string;
    witness_name?: string;
    witness_origin_parish?: string;

    constructor(props: Omit<Entity, 'toModel' | 'toEntity'>) {
      super(props);

      Object.assign(this, props);

      this.id = props.id ?? uuidv4();

      this.created_at = props.created_at
        ? new Date(props.created_at)
        : new Date();
      this.updated_at = props.updated_at ? new Date(props.updated_at) : null;
      this.deleted_at = props.deleted_at ? new Date(props.deleted_at) : null;

      if (!props.marriage_id && props.marriage)
        this.marriage_id =
          typeof props.marriage === 'object' ? props.marriage.id : props.marriage;

      if (!props.witness_id && props.witness)
        this.witness_id =
          typeof props.witness === 'object' ? props.witness.id : props.witness;
    }

    override toModel(): JsonProps {
      const marriageEntity = this.marriage;
      const witnessEntity = this.witness;

      let { marriage, witness, ...props } = super.toModel() as any;

      return {
        ...props,
        ...(marriageEntity && { marriage: marriageEntity.toModel() }),
        ...(witnessEntity && { witness: witnessEntity.toModel() }),
      };
    }

    static toEntity(data: JsonProps) {
      const { marriage, witness, ...props } = data;

      return new Entity({
        ...props,
        created_at: new Date(props.created_at),
        updated_at: props.updated_at ? new Date(props.updated_at) : null,
        deleted_at: props.deleted_at ? new Date(props.deleted_at) : null,
        ...(marriage && { marriage: MarriageModel.Entity.toEntity(marriage) }),
        ...(witness && {
          witness: CustomerModel.Entity.toEntity(witness),
        }),
      });
    }
  }

  export class Filter {
    marriage_id?: string;
    witness_id?: string;

    constructor(props: Partial<Filter>) {
      Object.assign(this, props);
    }
  }

  export class ResultList extends defaultResultList<Entity> {}
}
