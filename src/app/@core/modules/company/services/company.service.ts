import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { CompanyModel } from '../entities/company.model';

@Injectable({
  providedIn: 'root',
})
export class CompanyService extends BaseCrudHttp<
  CompanyModel.Entity,
  CompanyModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/companies');
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
