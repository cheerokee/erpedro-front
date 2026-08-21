export namespace InviteModel {
  export enum RoleTypeEnum {
    ADMIN = 'admin',
    EMPLOYEE = 'employee',
  }

  export type StatusEnum = 'pending' | 'accepted' | 'revoked' | 'expired';

  export interface CreateProps {
    email: string;
    role_type: RoleTypeEnum;
    company_id?: string;
    holding_id?: string;
  }

  export interface JsonProps {
    id: string;
    email: string;
    role_type: RoleTypeEnum;
    company_id?: string;
    holding_id?: string;
    expires_at: string;
    accepted_at?: string;
    revoked_at?: string;
    createdAt?: string;
  }

  export interface PreviewProps {
    email: string;
    role_type: RoleTypeEnum;
    hasAccount: boolean;
  }

  // Sem EntityBase/uuid (padrão de CompanyModel/RoleModel) de propósito:
  // Invite nunca passa por GraphQL nem precisa de id gerado no client — é
  // sempre o backend quem cria e devolve o registro completo via REST.
  export class Entity {
    id: string;
    email: string;
    role_type: RoleTypeEnum;
    company_id?: string;
    holding_id?: string;
    expires_at: Date;
    accepted_at?: Date;
    revoked_at?: Date;
    createdAt?: Date;

    constructor(props: JsonProps) {
      Object.assign(this, props);

      this.expires_at = props.expires_at ? new Date(props.expires_at) : null;
      this.accepted_at = props.accepted_at ? new Date(props.accepted_at) : null;
      this.revoked_at = props.revoked_at ? new Date(props.revoked_at) : null;
      this.createdAt = props.createdAt ? new Date(props.createdAt) : null;
    }

    // Backend não computa/expõe status — deriva aqui a partir dos três
    // timestamps (mesma regra de InviteService.accept no backend).
    get status(): StatusEnum {
      if (this.revoked_at) return 'revoked';
      if (this.accepted_at) return 'accepted';
      if (this.expires_at && this.expires_at.getTime() < Date.now()) return 'expired';
      return 'pending';
    }
  }
}
