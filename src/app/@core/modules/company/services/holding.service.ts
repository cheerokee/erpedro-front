import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { HoldingModel } from '../entities/holding.model';

@Injectable({
  providedIn: 'root',
})
export class HoldingService extends BaseCrudHttp<
  HoldingModel.Entity,
  HoldingModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/holdings');
  }

  byLike(
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<HoldingModel.Entity[]>> {
    const params = new HttpParams().set('q', q).set('take', take);

    return this.httpClient
      .get<ResultModel<HoldingModel.Entity[]>>(
        `${this.path}/v1/holdings/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map(
              (holding) =>
                new HoldingModel.Entity({ id: holding.id, name: holding.name }),
            );
          }

          return result;
        }),
      );
  }
}
