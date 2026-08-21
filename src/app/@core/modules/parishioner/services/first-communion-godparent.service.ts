import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { FirstCommunionGodparentModel } from '../entities/first-communion-godparent.model';

@Injectable({
  providedIn: 'root',
})
export class FirstCommunionGodparentService extends BaseCrudHttp<
  FirstCommunionGodparentModel.Entity,
  FirstCommunionGodparentModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/first-communion-godparents');
  }

  /** Backend já traz `godparent.company` carregado (ver
   * FirstCommunionGodparentService.listByFirstCommunion, backend) — sem
   * chamada extra por linha pra exibir "Nome — Paróquia" na tabela de
   * padrinhos já adicionados. */
  listByFirstCommunion(
    firstCommunionId: string,
  ): Observable<ResultModel<FirstCommunionGodparentModel.JsonProps[]>> {
    return this.httpClient.get<ResultModel<FirstCommunionGodparentModel.JsonProps[]>>(
      `${this.path}/v1/first-communion-godparents/by-first-communion/${firstCommunionId}`,
    );
  }
}
