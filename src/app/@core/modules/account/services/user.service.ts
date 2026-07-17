import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { UserModel } from '../entities/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService extends HttpService {
  constructor(
    public readonly httpClient: HttpClient,
    private apollo: Apollo,
  ) {
    super(httpClient);
  }

  get(id: string): Observable<ResultModel<UserModel.Entity>> {
    return this.httpClient
      .get<ResultModel<UserModel.Entity>>(`${this.path}/v1/users/${id}`)
      .pipe(
        map((result) => {
          if (result.data) {
            const user = result.data;
            result.data = new UserModel.Entity({
              id: user.id,
              name: user.name,
              email: user.email,
            });
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

  // list(skip: number = 1, take: number = 100) {
  //   const fnName: string = 'userList';
  //   return this.apollo
  //     .watchQuery({
  //       query: gql`
  //     query {
  //       ${fnName}(skip: ${skip}, take: ${take}) {
  //         data {
  //           id
  //         }
  //       }
  //     }
  //   `,
  //     })
  //     .valueChanges.pipe(
  //       map((result) => {
  //         const data: any = result?.data;
  //         return data?.[fnName];
  //       }),
  //     );
  // }
}
