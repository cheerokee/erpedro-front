import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { RoleModel } from '../entities/role.model';
import { CompanyModel } from '../../company/entities/company.model';

// Sem paginação real aqui de propósito: o catálogo de roles (globais + de
// todas as paróquias somadas) tende a ser pequeno, e os dois únicos
// consumidores (role-selector do filtro, checklist da aba Perfis do
// cadastro de usuário) precisam da lista inteira de uma vez pra
// filtrar/marcar localmente — não faz sentido paginar.
const ROLE_LIST_TAKE = 500;

const ROLE_LIST_QUERY = gql`
  query RoleList($take: Float, $skip: Float) {
    roleList(take: $take, skip: $skip) {
      items {
        id
        name
        company {
          id
          name
        }
      }
    }
  }
`;

interface RoleListItem {
  id: string;
  name: string;
  company?: { id: string; name: string };
}

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  constructor(private readonly apollo: Apollo) {}

  list(): Observable<RoleModel.Entity[]> {
    return this.apollo
      .query<{ roleList: { items: RoleListItem[] } }>({
        query: ROLE_LIST_QUERY,
        variables: { take: ROLE_LIST_TAKE, skip: 1 },
        fetchPolicy: 'no-cache',
      })
      .pipe(
        map((result) =>
          // Construído direto (não RoleModel.Entity.toEntity()) igual ao
          // company-selector: o GraphQL não devolve `created_at` (o backend
          // serializa `createdAt`), então toEntity() geraria um Invalid Date
          // (AI_CONTEXT.md §7). Como só usamos id/name/company aqui, montar
          // a entidade na mão evita o bug sem precisar corrigir RoleModel.
          result.data.roleList.items.map(
            (item) =>
              new RoleModel.Entity({
                id: item.id,
                name: item.name,
                type: null,
                company: item.company
                  ? new CompanyModel.Entity({
                      id: item.company.id,
                      name: item.company.name,
                    })
                  : undefined,
              } as any),
          ),
        ),
      );
  }
}
