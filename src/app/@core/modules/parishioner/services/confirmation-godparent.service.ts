import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { ResultModel } from '../../../models/result.model';
import { ConfirmationGodparentModel } from '../entities/confirmation-godparent.model';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationGodparentService extends BaseCrudHttp<
  ConfirmationGodparentModel.Entity,
  ConfirmationGodparentModel.JsonProps
> {
  constructor(public override readonly httpClient: HttpClient) {
    super(httpClient, 'v1/confirmation-godparents');
  }

  /** Backend já traz `godparent.company` carregado — sem chamada extra por
   * linha pra exibir "Nome — Paróquia" na tabela de padrinhos já adicionados. */
  listByConfirmation(
    confirmationId: string,
  ): Observable<ResultModel<ConfirmationGodparentModel.JsonProps[]>> {
    return this.httpClient.get<ResultModel<ConfirmationGodparentModel.JsonProps[]>>(
      `${this.path}/v1/confirmation-godparents/by-confirmation/${confirmationId}`,
    );
  }
}
