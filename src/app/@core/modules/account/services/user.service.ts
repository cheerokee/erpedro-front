import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { RoleModel } from '../../acl/entities/role.model';
import { UserModel } from '../entities/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseCrudHttp<
  UserModel.Entity,
  UserModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/users');
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
