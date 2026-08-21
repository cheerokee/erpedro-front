import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { MarriageWitnessModel } from '../entities/marriage-witness.model';

@Injectable({
  providedIn: 'root',
})
export class MarriageWitnessService extends BaseCrudHttp<
  MarriageWitnessModel.Entity,
  MarriageWitnessModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/marriage-witnesses');
  }

  /** Backend já traz `witness.company` carregado — sem chamada extra por
   * linha pra exibir "Nome — Paróquia" na tabela de testemunhas já adicionadas. */
  listByMarriage(
    marriageId: string,
  ): Observable<ResultModel<MarriageWitnessModel.JsonProps[]>> {
    return this.httpClient.get<ResultModel<MarriageWitnessModel.JsonProps[]>>(
      `${this.path}/v1/marriage-witnesses/by-marriage/${marriageId}`,
    );
  }
}
