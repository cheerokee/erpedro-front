import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { EmployeeModel } from '../entities/employee.model';

export interface EmployeeListItem extends EmployeeModel.JsonProps {
  company?: { id: string; name: string };
}

export interface EmployeeListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface EmployeeListResult {
  items: EmployeeListItem[];
  meta: EmployeeListMeta;
}

const EMPLOYEE_LIST_QUERY = gql`
  query EmployeeList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    employeeList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        email
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
export class EmployeeService extends BaseCrudHttp<
  EmployeeModel.Entity,
  EmployeeModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/employees');
  }

  list(
    filter: EmployeeModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<EmployeeListResult> {
    return this.apollo
      .query<{ employeeList: EmployeeListResult }>({
        query: EMPLOYEE_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.employeeList));
  }

  private buildFilterParams(filter: EmployeeModel.Filter) {
    // alias "e" é obrigatório aqui: employeeList faz innerJoin com "company",
    // que também tem coluna "name" — sem alias o SQL fica ambíguo (employee.name
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
        alias: 'e',
      });
    }

    if (filter?.email) {
      params.push({
        field: 'email',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.email}%`,
        alias: 'e',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'e',
      });
    }

    if (filter?.user_id) {
      params.push({
        field: 'user_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.user_id,
        alias: 'e',
      });
    }

    return params;
  }

  byLike(
    companyId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<EmployeeModel.Entity[]>> {
    const params = new HttpParams()
      .set('company_id', companyId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<EmployeeModel.Entity[]>>(
        `${this.path}/v1/employees/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              EmployeeModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
