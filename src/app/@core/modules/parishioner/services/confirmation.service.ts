import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ConfirmationModel } from '../entities/confirmation.model';

export type ConfirmationListItem = ConfirmationModel.JsonProps;

export interface ConfirmationListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface ConfirmationListResult {
  items: ConfirmationListItem[];
  meta: ConfirmationListMeta;
}

const CONFIRMATION_LIST_QUERY = gql`
  query ConfirmationList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    confirmationList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        createdAt
        updatedAt
        confirmation_place
        confirmation_date
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
export class ConfirmationService extends BaseCrudHttp<
  ConfirmationModel.Entity,
  ConfirmationModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/confirmations');
  }

  list(
    filter: ConfirmationModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<ConfirmationListResult> {
    return this.apollo
      .query<{ confirmationList: ConfirmationListResult }>({
        query: CONFIRMATION_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.confirmationList));
  }

  private buildFilterParams(filter: ConfirmationModel.Filter) {
    // alias "c" é o alias da tabela principal em confirmationList
    // (ParishionerGraphqlService.confirmationList, backend) —
    // confirmation_place, confirmation_date, company_id e parishioner_id
    // são todas colunas da própria entidade, não de uma relação (por isso
    // não precisam de outro alias).
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.confirmation_place) {
      params.push({
        field: 'confirmation_place',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.confirmation_place}%`,
        alias: 'c',
      });
    }

    if (filter?.confirmation_date) {
      params.push({
        field: 'confirmation_date',
        type: 'eq',
        instanceOf: 'date',
        value: filter.confirmation_date,
        alias: 'c',
      });
    }

    if (filter?.parishioner_id) {
      params.push({
        field: 'parishioner_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.parishioner_id,
        alias: 'c',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'c',
      });
    }

    return params;
  }
}
