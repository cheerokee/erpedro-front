import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FinancialTransactionModel } from '../entities/financial-transaction.model';

@Injectable({
  providedIn: 'root',
})
export class FinancialTransactionService extends BaseCrudHttp<
  FinancialTransactionModel.Entity,
  FinancialTransactionModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/financial-transactions');
  }

  byInstallment(
    installmentId: string,
  ): Observable<ResultModel<FinancialTransactionModel.Entity[]>> {
    return this.httpClient
      .get<ResultModel<FinancialTransactionModel.Entity[]>>(
        `${this.path}/v1/financial-transactions/by-installment/${installmentId}`,
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              FinancialTransactionModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
