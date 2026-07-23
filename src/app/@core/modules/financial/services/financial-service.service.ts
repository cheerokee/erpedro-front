import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FinancialServiceModel } from '../entities/financial-service.model';

export interface FinancialServiceListItem extends FinancialServiceModel.JsonProps {
  company?: { id: string; name: string };
}

export interface FinancialServiceListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface FinancialServiceListResult {
  items: FinancialServiceListItem[];
  meta: FinancialServiceListMeta;
}

const FINANCIAL_SERVICE_LIST_QUERY = gql`
  query FinancialServiceList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    financialServiceList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        description
        price
        active
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
export class FinancialServiceService extends BaseCrudHttp<
  FinancialServiceModel.Entity,
  FinancialServiceModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/financial-services');
  }

  list(
    filter: FinancialServiceModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<FinancialServiceListResult> {
    return this.apollo
      .query<{ financialServiceList: FinancialServiceListResult }>({
        query: FINANCIAL_SERVICE_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.financialServiceList));
  }

  private buildFilterParams(filter: FinancialServiceModel.Filter) {
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.name) {
      params.push({
        field: 'name',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.name}%`,
        alias: 's',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 's',
      });
    }

    if (filter?.active !== undefined && filter?.active !== null) {
      params.push({
        field: 'active',
        type: 'eq',
        instanceOf: 'boolean',
        value: filter.active as any,
        alias: 's',
      });
    }

    return params;
  }

  /** Catálogo ativo de uma paróquia — usado no seletor de serviço da aba
   * Itens da Fatura (ver financial-service-selector). */
  byCompany(
    companyId: string,
  ): Observable<ResultModel<FinancialServiceModel.Entity[]>> {
    return this.httpClient
      .get<ResultModel<FinancialServiceModel.Entity[]>>(
        `${this.path}/v1/financial-services/by-company/${companyId}`,
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              FinancialServiceModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
