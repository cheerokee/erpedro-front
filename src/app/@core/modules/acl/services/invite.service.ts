import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { InviteModel } from '../entities/invite.model';

// Não estende BaseCrudHttp de propósito: o backend não expõe update/get/delete
// pra Invite (só create/list/revoke/preview/accept) — herdar a base geraria
// métodos que sempre dariam 404.
@Injectable({
  providedIn: 'root',
})
export class InviteService extends HttpService {
  constructor(public override readonly http: HttpClient) {
    super(http);
  }

  create(data: InviteModel.CreateProps): Observable<ResultModel<InviteModel.JsonProps>> {
    return this.http.post<ResultModel<InviteModel.JsonProps>>(
      `${this.path}/v1/invites`,
      data,
    );
  }

  list(companyId?: string, holdingId?: string): Observable<ResultModel<InviteModel.Entity[]>> {
    let params = new HttpParams();
    if (companyId) params = params.set('company_id', companyId);
    if (holdingId) params = params.set('holding_id', holdingId);

    return this.http
      .get<ResultModel<InviteModel.JsonProps[]>>(`${this.path}/v1/invites`, { params })
      .pipe(
        map((result) => ({
          ...result,
          data: (result.data ?? []).map((item) => new InviteModel.Entity(item)),
        })),
      );
  }

  revoke(id: string): Observable<ResultModel<any>> {
    return this.http.post<ResultModel<any>>(`${this.path}/v1/invites/${id}/revoke`, {});
  }

  // Chamado pela tela pública de aceite antes de mostrar o form — decide se
  // pede nome/senha (conta nova) ou só confirma (conta já existe).
  preview(token: string): Observable<ResultModel<InviteModel.PreviewProps>> {
    const params = new HttpParams().set('token', token);

    return this.http.get<ResultModel<InviteModel.PreviewProps>>(
      `${this.path}/v1/invites/preview`,
      { params },
    );
  }

  accept(data: { token: string; name?: string; password?: string }): Observable<ResultModel<any>> {
    return this.http.post<ResultModel<any>>(`${this.path}/v1/invites/accept`, data);
  }
}
