import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';

export interface BaptismAttachmentS3File {
  id: string;
  url: string;
  key: string;
  bucket: string;
  originalName?: string;
  mimetype: string;
  type: 'PUBLIC' | 'PRIVATE';
}

export interface BaptismAttachmentItem {
  id: string;
  baptism_id: string;
  createdAt?: string;
  attachment: {
    id: string;
    title: string;
    s3_file: BaptismAttachmentS3File;
  };
}

// Sem BaseCrudHttp: create() manda multipart/form-data (arquivo), não JSON —
// não dá pra reaproveitar o create() genérico, que sempre serializa o body
// como JSON.
@Injectable({
  providedIn: 'root',
})
export class BaptismAttachmentService extends HttpService {
  private readonly apiRoute = 'v1/baptism-attachments';

  constructor(public readonly httpClient: HttpClient) {
    super(httpClient);
  }

  listByBaptism(
    baptismId: string,
  ): Observable<ResultModel<BaptismAttachmentItem[]>> {
    return this.httpClient.get<ResultModel<BaptismAttachmentItem[]>>(
      `${this.path}/${this.apiRoute}/by-baptism/${baptismId}`,
    );
  }

  create(
    baptismId: string,
    title: string,
    file: File,
  ): Observable<ResultModel<BaptismAttachmentItem>> {
    const formData = new FormData();
    formData.append('baptism_id', baptismId);
    formData.append('title', title);
    formData.append('file', file);

    return this.httpClient.post<ResultModel<BaptismAttachmentItem>>(
      `${this.path}/${this.apiRoute}`,
      formData,
    );
  }

  // Só o título é editável (backend: UpdateBaptismAttachmentDto) — trocar o
  // arquivo em si é remover e reanexar.
  updateTitle(
    id: string,
    title: string,
  ): Observable<ResultModel<BaptismAttachmentItem>> {
    return this.httpClient.put<ResultModel<BaptismAttachmentItem>>(
      `${this.path}/${this.apiRoute}/${id}`,
      { title },
    );
  }

  delete(id: string): Observable<ResultModel<any>> {
    return this.httpClient.delete<ResultModel<any>>(
      `${this.path}/${this.apiRoute}/${id}`,
    );
  }

  // Arquivo fica no bucket privado — precisa de URL assinada (expira em
  // minutos) pra baixar, ver back ClientS3.getSignedDownloadUrl.
  getDownloadUrl(s3FileId: string): Observable<ResultModel<{ url: string }>> {
    return this.httpClient.get<ResultModel<{ url: string }>>(
      `${this.path}/v1/s3-files/${s3FileId}/download-url`,
    );
  }
}
