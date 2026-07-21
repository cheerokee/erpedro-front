import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { CountryModel } from '../entities/country.model';

@Injectable({
  providedIn: 'root',
})
export class CountryService extends BaseCrudHttp<
  CountryModel.Entity,
  CountryModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/countries');
  }

  byLike(
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CountryModel.Entity[]>> {
    const params = new HttpParams().set('q', q).set('take', take);

    return this.httpClient
      .get<ResultModel<CountryModel.Entity[]>>(
        `${this.path}/v1/countries/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              CountryModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
