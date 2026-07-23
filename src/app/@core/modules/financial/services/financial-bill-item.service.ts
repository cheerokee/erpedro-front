import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FinancialBillItemModel } from '../entities/financial-bill-item.model';

@Injectable({
  providedIn: 'root',
})
export class FinancialBillItemService extends BaseCrudHttp<
  FinancialBillItemModel.Entity,
  FinancialBillItemModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/financial-bill-items');
  }

  byBill(
    billId: string,
  ): Observable<ResultModel<FinancialBillItemModel.Entity[]>> {
    return this.httpClient
      .get<ResultModel<FinancialBillItemModel.Entity[]>>(
        `${this.path}/v1/financial-bill-items/by-bill/${billId}`,
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              FinancialBillItemModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
