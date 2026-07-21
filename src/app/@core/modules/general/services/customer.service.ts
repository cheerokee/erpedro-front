import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { CustomerModel } from '../entities/customer.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';

export interface CustomerListItem extends CustomerModel.JsonProps {
  company?: { id: string; name: string };
}

export interface CustomerListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface CustomerListResult {
  items: CustomerListItem[];
  meta: CustomerListMeta;
}

const CUSTOMER_LIST_QUERY = gql`
  query CustomerList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    customerList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        document
        country_code
        phone_number
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
export class CustomerService extends BaseCrudHttp<
  CustomerModel.Entity,
  CustomerModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/customers');
  }

  list(
    filter: CustomerModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<CustomerListResult> {
    return this.apollo
      .query<{ customerList: CustomerListResult }>({
        query: CUSTOMER_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.customerList));
  }

  private buildFilterParams(filter: CustomerModel.Filter) {
    // alias "c" é obrigatório aqui: customerList faz innerJoin com "company",
    // que também tem coluna "name" — sem alias o SQL fica ambíguo (customer.name
    // vs company.name).
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

    if (filter?.document) {
      params.push({
        field: 'document',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.document}%`,
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

    if (filter?.user_id) {
      params.push({
        field: 'user_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.user_id,
        alias: 'c',
      });
    }

    return params;
  }

  byLike(
    companyId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CustomerModel.Entity[]>> {
    const params = new HttpParams()
      .set('company_id', companyId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<CustomerModel.Entity[]>>(
        `${this.path}/v1/customers/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              CustomerModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }

  selfRegister(data: {
    name: string;
    email: string;
    password: string;
    document?: string;
    phone_number?: string;
    company_id: string;
  }): Observable<ResultModel<CustomerModel.Entity>> {
    return this.httpClient.post<ResultModel<CustomerModel.Entity>>(
      `${this.path}/v1/customers/self-register`,
      data,
    );
  }
}
