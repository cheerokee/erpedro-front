import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Apollo, gql } from 'apollo-angular';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { CompanyModel } from '../entities/company.model';

export interface CompanyListItem extends CompanyModel.JsonProps {}

export interface CompanyListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface CompanyListResult {
  items: CompanyListItem[];
  meta: CompanyListMeta;
}

const COMPANY_LIST_QUERY = gql`
  query CompanyList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    companyList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        owner {
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
export class CompanyService extends BaseCrudHttp<
  CompanyModel.Entity,
  CompanyModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/companies');
  }

  list(
    filter: CompanyModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<CompanyListResult> {
    return this.apollo
      .query<{ companyList: CompanyListResult }>({
        query: COMPANY_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.companyList));
  }

  private buildFilterParams(filter: CompanyModel.Filter) {
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
        alias: 'c',
      });
    }

    if (filter?.owner_id) {
      params.push({
        field: 'owner',
        type: 'eq',
        instanceOf: 'string',
        value: filter.owner_id,
        alias: 'c',
      });
    }

    return params;
  }

  byLike(
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CompanyModel.Entity[]>> {
    const params = new HttpParams().set('q', q).set('take', take);

    return this.httpClient
      .get<ResultModel<CompanyModel.Entity[]>>(
        `${this.path}/v1/companies/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map(
              (company) =>
                new CompanyModel.Entity({ id: company.id, name: company.name }),
            );
          }

          return result;
        }),
      );
  }

  // GET /v1/companies/my-companies (backend, @SkipTenantContext()) — resolve
  // nome das companies que o usuário logado tem acesso (roles/vínculos/
  // holding), sem cair na checagem de ambiguidade do TenantContextInterceptor
  // (essa chamada existe justamente pra viabilizar escolher um X-Company-Id).
  myCompanies(): Observable<ResultModel<CompanyModel.Entity[]>> {
    return this.httpClient
      .get<ResultModel<CompanyModel.Entity[]>>(
        `${this.path}/v1/companies/my-companies`,
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map(
              (company) =>
                new CompanyModel.Entity({ id: company.id, name: company.name }),
            );
          }

          return result;
        }),
      );
  }

  getPublicInfo(id: string): Observable<ResultModel<CompanyModel.Entity>> {
    return this.httpClient
      .get<ResultModel<CompanyModel.Entity>>(
        `${this.path}/v1/companies/${id}/public-info`,
      )
      .pipe(
        map((result) => {
          if (result.data) {
            const company = result.data;
            result.data = new CompanyModel.Entity({
              id: company.id,
              name: company.name,
            });
          }

          return result;
        }),
      );
  }
}
