import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';
import { AddressModel } from '../entities/address.model';
import { CountryModel } from '../entities/country.model';
import { StateModel } from '../entities/state.model';
import { CityModel } from '../entities/city.model';

export interface AddressZipCodeLookup {
  zip_code: string;
  street: string | null;
  neighborhood: string | null;
  complement: string | null;
  country: CountryModel.JsonProps | null;
  state: StateModel.JsonProps | null;
  city: CityModel.JsonProps | null;
}

@Injectable({
  providedIn: 'root',
})
export class AddressService extends BaseCrudHttp<
  AddressModel.Entity,
  AddressModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/addresses');
  }

  byLike(
    filters: { cityId?: string | null; customerId?: string | null; employeeId?: string | null },
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<AddressModel.Entity[]>> {
    let params = new HttpParams().set('q', q).set('take', take);

    if (filters.cityId) params = params.set('city_id', filters.cityId);
    if (filters.customerId) params = params.set('customer_id', filters.customerId);
    if (filters.employeeId) params = params.set('employee_id', filters.employeeId);

    return this.httpClient
      .get<ResultModel<AddressModel.Entity[]>>(
        `${this.path}/v1/addresses/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              AddressModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }

  lookupZipCode(
    zipCode: string,
  ): Observable<ResultModel<AddressZipCodeLookup>> {
    return this.httpClient.get<ResultModel<AddressZipCodeLookup>>(
      `${this.path}/v1/addresses/lookup-zip-code/${zipCode}`,
    );
  }
}
