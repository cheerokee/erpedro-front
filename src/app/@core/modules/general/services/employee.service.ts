import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { EmployeeModel } from '../entities/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends HttpService {
  constructor(public readonly httpClient: HttpClient) {
    super(httpClient);
  }

  get(id: string): Observable<ResultModel<EmployeeModel.Entity>> {
    return this.httpClient
      .get<ResultModel<EmployeeModel.Entity>>(`${this.path}/v1/employees/${id}`)
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = EmployeeModel.Entity.toEntity(result.data as any);
          }

          return result;
        }),
      );
  }

  byLike(
    companyId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<EmployeeModel.Entity[]>> {
    const params = new HttpParams()
      .set('company_id', companyId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<EmployeeModel.Entity[]>>(`${this.path}/v1/employees/by-like`, {
        params,
      })
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              EmployeeModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }
}
