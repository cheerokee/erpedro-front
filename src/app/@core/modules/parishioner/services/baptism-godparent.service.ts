import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { BaptismGodparentModel } from '../entities/baptism-godparent.model';

@Injectable({
  providedIn: 'root',
})
export class BaptismGodparentService extends BaseCrudHttp<
  BaptismGodparentModel.Entity,
  BaptismGodparentModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/baptism-godparents');
  }

  /** Backend já traz `godparent.company` carregado (ver AI_CONTEXT.md do
   * backend, BaptismGodparentService.listByBaptism) — sem chamada extra por
   * linha pra exibir "Nome — Paróquia" na tabela de padrinhos já adicionados. */
  listByBaptism(
    baptismId: string,
  ): Observable<ResultModel<BaptismGodparentModel.JsonProps[]>> {
    return this.httpClient.get<ResultModel<BaptismGodparentModel.JsonProps[]>>(
      `${this.path}/v1/baptism-godparents/by-baptism/${baptismId}`,
    );
  }
}
