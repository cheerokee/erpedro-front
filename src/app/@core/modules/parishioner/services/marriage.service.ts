import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { MarriageModel } from '../entities/marriage.model';

export type MarriageListItem = MarriageModel.JsonProps;

export interface MarriageListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface MarriageListResult {
  items: MarriageListItem[];
  meta: MarriageListMeta;
}

const MARRIAGE_LIST_QUERY = gql`
  query MarriageList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    marriageList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        createdAt
        updatedAt
        marriage_place
        marriage_date
        observation
        husband {
          id
          name
        }
        wife {
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
export class MarriageService extends BaseCrudHttp<
  MarriageModel.Entity,
  MarriageModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/marriages');
  }

  list(
    filter: MarriageModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<MarriageListResult> {
    return this.apollo
      .query<{ marriageList: MarriageListResult }>({
        query: MARRIAGE_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.marriageList));
  }

  private buildFilterParams(filter: MarriageModel.Filter) {
    // alias "m" é o alias da tabela principal em marriageList
    // (ParishionerGraphqlService.marriageList, backend) — marriage_place,
    // marriage_date e company_id são todas colunas da própria entidade, não
    // de uma relação (por isso não precisam de outro alias). Diferente dos
    // outros sacramentos, não há filtro por "parishioner_id" — o paroquiano
    // pode ser marido OU esposa (ver MarriageService.getByParishionerId no
    // backend, que usa OR em vez de um campo único).
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.marriage_place) {
      params.push({
        field: 'marriage_place',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.marriage_place}%`,
        alias: 'm',
      });
    }

    if (filter?.marriage_date) {
      params.push({
        field: 'marriage_date',
        type: 'eq',
        instanceOf: 'date',
        value: filter.marriage_date,
        alias: 'm',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'm',
      });
    }

    return params;
  }
}
