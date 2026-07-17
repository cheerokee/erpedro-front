import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { HttpService } from '../../../services/http-service';
import { CompanyModel } from '../entities/company.model';

@Injectable({
  providedIn: 'root',
})
export class CompanyService extends HttpService {
  constructor(public readonly httpClient: HttpClient) {
    super(httpClient);
  }

  get(id: string): Observable<ResultModel<CompanyModel.Entity>> {
    return this.httpClient
      .get<ResultModel<CompanyModel.Entity>>(`${this.path}/v1/companies/${id}`)
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

  // list(skip: number = 1, take: number = 100) {
  //   const fnName: string = 'companyList';
  //   return this.apollo.watchQuery({ query: gql`
  //     query {
  //       ${ fnName }(skip: ${ skip }, take: ${ take }) {
  //         data {
  //           id
  //         }
  //       }
  //     }
  //   `,})
  //     .valueChanges
  //     .pipe(map(result => {
  //       const data: any = result?.data;
  //       return data?.[fnName];
  //     }));
  // }
}
