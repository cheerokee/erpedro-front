import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FirstCommunionModel } from '../entities/first-communion.model';

export type FirstCommunionListItem = FirstCommunionModel.JsonProps;

export interface FirstCommunionListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface FirstCommunionListResult {
  items: FirstCommunionListItem[];
  meta: FirstCommunionListMeta;
}

const FIRST_COMMUNION_LIST_QUERY = gql`
  query FirstCommunionList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    firstCommunionList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        createdAt
        updatedAt
        first_communion_place
        first_communion_date
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
export class FirstCommunionService extends BaseCrudHttp<
  FirstCommunionModel.Entity,
  FirstCommunionModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/first-communions');
  }

  list(
    filter: FirstCommunionModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<FirstCommunionListResult> {
    return this.apollo
      .query<{ firstCommunionList: FirstCommunionListResult }>({
        query: FIRST_COMMUNION_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.firstCommunionList));
  }

  private buildFilterParams(filter: FirstCommunionModel.Filter) {
    // alias "fc" é o alias da tabela principal em firstCommunionList
    // (ParishionerGraphqlService.firstCommunionList, backend) —
    // first_communion_place, first_communion_date, company_id e
    // parishioner_id são todas colunas da própria entidade, não de uma
    // relação (por isso não precisam de outro alias).
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.first_communion_place) {
      params.push({
        field: 'first_communion_place',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.first_communion_place}%`,
        alias: 'fc',
      });
    }

    if (filter?.first_communion_date) {
      params.push({
        field: 'first_communion_date',
        type: 'eq',
        instanceOf: 'date',
        value: filter.first_communion_date,
        alias: 'fc',
      });
    }

    if (filter?.parishioner_id) {
      params.push({
        field: 'parishioner_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.parishioner_id,
        alias: 'fc',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'fc',
      });
    }

    return params;
  }
}
