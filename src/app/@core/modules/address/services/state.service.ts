import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { StateModel } from '../entities/state.model';

@Injectable({
  providedIn: 'root',
})
export class StateService extends BaseCrudHttp<
  StateModel.Entity,
  StateModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/states');
  }

  byLike(
    countryId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<StateModel.Entity[]>> {
    const params = new HttpParams()
      .set('country_id', countryId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<StateModel.Entity[]>>(`${this.path}/v1/states/by-like`, {
        params,
      })
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              StateModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
