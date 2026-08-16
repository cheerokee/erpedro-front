import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BaseCrudHttp } from '../../../base/base-crud-http';
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
}
