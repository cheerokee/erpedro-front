import { AuthenticatedUser } from '../services/auth.service';
import { BillableEntityType } from '../modules/billing/services/billing.service';

export interface MyBillableEntity {
  type: BillableEntityType;
  id: string;
}

// Prioriza holding (diocese) sobre company (paróquia) — quem administra uma
// holding é responsável pelo plano dela, mesmo que também apareça em
// user.companies por outro motivo. Sem holding_id em nenhuma role, cai pra
// primeira company que o usuário é dono (user.companies só lista as que ele
// possui, ver AuthService.buildTokens no backend).
export const getMyBillableEntity = (
  user: AuthenticatedUser,
): MyBillableEntity | null => {
  const holdingId = user?.roles?.find((role) => !!role.holding_id)?.holding_id;
  if (holdingId) {
    return { type: 'holdings', id: holdingId };
  }

  const companyId = user?.companies?.[0]?.id;
  if (companyId) {
    return { type: 'companies', id: companyId };
  }

  return null;
};
