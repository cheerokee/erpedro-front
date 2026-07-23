import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable, of, switchMap } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FinancialActorModel } from '../entities/financial-actor.model';

// FinancialActorEntity (backend) só expõe @Field() em `customer`/`company`
// (as relações), não nas colunas escalares `customer_id`/`company_id` — só
// dá pra filtrar por elas (FilterParam usa a coluna real via TypeORM), não
// selecioná-las direto no corpo da query GraphQL.
const FINANCIAL_ACTOR_BY_CUSTOMER_QUERY = gql`
  query FinancialActorByCustomer($filter: [FilterParam!]) {
    financialActorList(take: 1, skip: 1, filter: $filter) {
      items {
        id
        type
        customer {
          id
        }
        company {
          id
        }
      }
    }
  }
`;

interface FinancialActorListItem {
  id: string;
  type: FinancialActorModel.TypeEnum;
  customer?: { id: string };
  company?: { id: string };
}

@Injectable({
  providedIn: 'root',
})
export class FinancialActorService extends BaseCrudHttp<
  FinancialActorModel.Entity,
  FinancialActorModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/financial-actors');
  }

  /** Resolve o FinancialActor (arco exclusivo) de um paroquiano — cria um novo
   * se ainda não existir nenhum ator financeiro pra esse customer. Não existe
   * endpoint dedicado no backend pra isso (só CRUD genérico), então a busca é
   * feita via a query GraphQL de listagem já existente (financialActorList),
   * filtrando por customer_id/type — mesmo mecanismo genérico de FilterParam
   * usado pelas telas de listagem (ver AI_CONTEXT.md, seção 3.3). */
  getOrCreateForCustomer(
    customerId: string,
  ): Observable<ResultModel<FinancialActorModel.Entity>> {
    return this.findByCustomer(customerId).pipe(
      switchMap((existing) => {
        if (existing) {
          return of(new ResultModel(null, true, this.toEntity(existing), null));
        }

        return this.create({
          type: FinancialActorModel.TypeEnum.CUSTOMER,
          customer_id: customerId,
        } as FinancialActorModel.JsonProps).pipe(
          map((result) => ({
            ...result,
            data: this.toEntity(result.data as any),
          })),
        );
      }),
    );
  }

  /** Mesma resolução acima, só que pro lado da própria paróquia (credora). */
  getOrCreateForCompany(
    companyId: string,
  ): Observable<ResultModel<FinancialActorModel.Entity>> {
    return this.findByCompany(companyId).pipe(
      switchMap((existing) => {
        if (existing) {
          return of(new ResultModel(null, true, this.toEntity(existing), null));
        }

        return this.create({
          type: FinancialActorModel.TypeEnum.COMPANY,
          company_id: companyId,
        } as FinancialActorModel.JsonProps).pipe(
          map((result) => ({
            ...result,
            data: this.toEntity(result.data as any),
          })),
        );
      }),
    );
  }

  private findByCustomer(
    customerId: string,
  ): Observable<FinancialActorListItem | null> {
    return this.apollo
      .query<{ financialActorList: { items: FinancialActorListItem[] } }>({
        query: FINANCIAL_ACTOR_BY_CUSTOMER_QUERY,
        variables: {
          filter: [
            {
              field: 'customer_id',
              type: 'eq',
              instanceOf: 'string',
              value: customerId,
              alias: 'a',
            },
          ],
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(
        map((result) => result.data.financialActorList.items[0] ?? null),
      );
  }

  private findByCompany(
    companyId: string,
  ): Observable<FinancialActorListItem | null> {
    return this.apollo
      .query<{ financialActorList: { items: FinancialActorListItem[] } }>({
        query: FINANCIAL_ACTOR_BY_CUSTOMER_QUERY,
        variables: {
          filter: [
            {
              field: 'company_id',
              type: 'eq',
              instanceOf: 'string',
              value: companyId,
              alias: 'a',
            },
            {
              field: 'type',
              type: 'eq',
              instanceOf: 'string',
              value: FinancialActorModel.TypeEnum.COMPANY,
              alias: 'a',
            },
          ],
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(
        map((result) => result.data.financialActorList.items[0] ?? null),
      );
  }

  private toEntity(item: FinancialActorListItem): FinancialActorModel.Entity {
    return new FinancialActorModel.Entity({
      id: item.id,
      type: item.type,
      customer_id: item.customer?.id,
      company_id: item.company?.id,
    } as any);
  }
}
