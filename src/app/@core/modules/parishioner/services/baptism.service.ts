import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { BaptismModel } from '../entities/baptism.model';

export type BaptismListItem = BaptismModel.JsonProps;

export interface BaptismListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface BaptismListResult {
  items: BaptismListItem[];
  meta: BaptismListMeta;
}

const BAPTISM_LIST_QUERY = gql`
  query BaptismList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    baptismList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        createdAt
        updatedAt
        baptism_place
        baptism_date
        observation
        parishioner {
          id
          name
        }
        bill {
          id
          code
          status
          release_date
          total
        }
        company {
          id
          name
        }
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;

@Injectable({
  providedIn: 'root',
})
export class BaptismService extends BaseCrudHttp<
  BaptismModel.Entity,
  BaptismModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/baptisms');
  }

  list(
    filter: BaptismModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<BaptismListResult> {
    return this.apollo
      .query<{ baptismList: BaptismListResult }>({
        query: BAPTISM_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.baptismList));
  }

  // Endpoint REST (não GraphQL) que devolve o PDF direto no corpo da
  // resposta, gerado na hora pelo backend a cada chamada — sem cache/histórico
  // de emissão. responseType: 'blob' faz o Angular devolver o binário puro em
  // vez de tentar fazer JSON.parse; o AuthInterceptor injeta o Bearer token
  // normalmente, independente do responseType.
  certificate(id: string): Observable<Blob> {
    return this.httpClient.get(`${this.path}/${this.apiRoute}/${id}/certificate`, {
      responseType: 'blob',
    });
  }

  private buildFilterParams(filter: BaptismModel.Filter) {
    // alias "b" é o alias da tabela principal em baptismList
    // (ParishionerGraphqlService.baptismList, backend) — baptism_place,
    // baptism_date, company_id e parishioner_id são todas colunas da própria
    // entidade Baptism, não de uma relação (por isso não precisam de outro alias).
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.baptism_place) {
      params.push({
        field: 'baptism_place',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.baptism_place}%`,
        alias: 'b',
      });
    }

    if (filter?.baptism_date) {
      params.push({
        field: 'baptism_date',
        type: 'eq',
        instanceOf: 'date',
        value: filter.baptism_date,
        alias: 'b',
      });
    }

    if (filter?.parishioner_id) {
      params.push({
        field: 'parishioner_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.parishioner_id,
        alias: 'b',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'b',
      });
    }

    return params;
  }
}
