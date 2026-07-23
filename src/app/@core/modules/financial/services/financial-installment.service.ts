import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FinancialInstallmentModel } from '../entities/financial-installment.model';

@Injectable({
  providedIn: 'root',
})
export class FinancialInstallmentService extends BaseCrudHttp<
  FinancialInstallmentModel.Entity,
  FinancialInstallmentModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/financial-installments');
  }

  byBill(
    billId: string,
  ): Observable<ResultModel<FinancialInstallmentModel.Entity[]>> {
    return this.httpClient
      .get<ResultModel<FinancialInstallmentModel.Entity[]>>(
        `${this.path}/v1/financial-installments/by-bill/${billId}`,
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              FinancialInstallmentModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
