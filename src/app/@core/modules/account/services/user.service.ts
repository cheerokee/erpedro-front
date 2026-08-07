import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { RoleModel } from '../../acl/entities/role.model';
import { UserModel } from '../entities/user.model';

export interface UserListItem {
  id: string;
  name?: string;
  email: string;
  roles?: { id: string; name: string; company?: { id: string; name: string } }[];
}

export interface UserListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface UserListResult {
  items: UserListItem[];
  meta: UserListMeta;
}

const USER_LIST_QUERY = gql`
  query UserList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    userList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        email
        roles {
          id
          name
          company {
            id
            name
          }
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

export interface CreateUserAdminData {
  name?: string;
  email: string;
  password: string;
  roleIds?: string[];
}

export interface UpdateUserAdminData {
  name?: string;
  email?: string;
  password?: string;
  roleIds?: string[];
}

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseCrudHttp<
  UserModel.Entity,
  UserModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/users');
  }

  list(
    filter: UserModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<UserListResult> {
    return this.apollo
      .query<{ userList: UserListResult }>({
        query: USER_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.userList));
  }

  createByAdmin(
    data: CreateUserAdminData,
  ): Observable<ResultModel<UserModel.Entity>> {
    return this.httpClient.post<ResultModel<UserModel.Entity>>(
      `${this.path}/v1/users/admin`,
      data,
    );
  }

  updateByAdmin(
    id: string,
    data: UpdateUserAdminData,
  ): Observable<ResultModel<UserModel.Entity>> {
    return this.httpClient.put<ResultModel<UserModel.Entity>>(
      `${this.path}/v1/users/${id}/admin`,
      data,
    );
  }

  private buildFilterParams(filter: UserModel.Filter) {
    // alias "u": userList já faz leftJoin com "roles" (alias "r") pra
    // permitir filtro/order por role sem duplicar linha (groupBy por u.id) —
    // ver user-graphql.service.ts (backend).
    const params: Record<string, any>[] = [];

    if (filter?.q) {
      params.push({
        type: 'orx',
        conditions: [
          {
            field: 'name',
            type: 'like',
            instanceOf: 'string',
            value: `%${filter.q}%`,
            alias: 'u',
          },
          {
            field: 'email',
            type: 'like',
            instanceOf: 'string',
            value: `%${filter.q}%`,
            alias: 'u',
          },
        ],
      });
    }

    if (filter?.role_id) {
      params.push({
        field: 'id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.role_id,
        alias: 'r',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'r',
      });
    }

    return params;
  }

  byLike(
    q: string = '',
    take: number = 20,
    roleTypes: RoleModel.RoleTypeEnum[] = [],
    roleIds: string[] = [],
  ): Observable<ResultModel<UserModel.Entity[]>> {
    let params = new HttpParams().set('q', q).set('take', take);

    for (const roleType of roleTypes) {
      params = params.append('roleTypes', roleType);
    }

    for (const roleId of roleIds) {
      params = params.append('roleIds', roleId);
    }

    return this.httpClient
      .get<ResultModel<UserModel.Entity[]>>(`${this.path}/v1/users/by-like`, {
        params,
      })
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map(
              (user) =>
                new UserModel.Entity({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                }),
            );
          }

          return result;
        }),
      );
  }

  signUp(data: {
    name?: string;
    email: string;
    password: string;
  }): Observable<ResultModel<UserModel.Entity>> {
    return this.httpClient.post<ResultModel<UserModel.Entity>>(
      `${this.path}/v1/users`,
      data,
    );
  }
}
