import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { CityModel } from '../entities/city.model';

@Injectable({
  providedIn: 'root',
})
export class CityService extends BaseCrudHttp<
  CityModel.Entity,
  CityModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/cities');
  }

  byLike(
    stateId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CityModel.Entity[]>> {
    const params = new HttpParams()
      .set('state_id', stateId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<CityModel.Entity[]>>(`${this.path}/v1/cities/by-like`, {
        params,
      })
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              CityModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
