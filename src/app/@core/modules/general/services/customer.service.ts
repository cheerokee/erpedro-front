import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { CustomerModel } from '../entities/customer.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends HttpService {
  constructor(public readonly httpClient: HttpClient) {
    super(httpClient);
  }

  get(id: string): Observable<ResultModel<CustomerModel.Entity>> {
    return this.httpClient
      .get<ResultModel<CustomerModel.Entity>>(`${this.path}/v1/customers/${id}`)
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = CustomerModel.Entity.toEntity(result.data as any);
          }

          return result;
        }),
      );
  }

  byLike(
    companyId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CustomerModel.Entity[]>> {
    const params = new HttpParams()
      .set('company_id', companyId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<CustomerModel.Entity[]>>(`${this.path}/v1/customers/by-like`, {
        params,
      })
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              CustomerModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }

  selfRegister(data: {
    name: string;
    email: string;
    password: string;
    document?: string;
    phone_number?: string;
    company_id: string;
  }): Observable<ResultModel<CustomerModel.Entity>> {
    return this.httpClient.post<ResultModel<CustomerModel.Entity>>(
      `${this.path}/v1/customers/self-register`,
      data,
    );
  }
}
