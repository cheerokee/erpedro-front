import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';

export interface FirstCommunionAttachmentS3File {
  id: string;
  url: string;
  key: string;
  bucket: string;
  originalName?: string;
  mimetype: string;
  type: 'PUBLIC' | 'PRIVATE';
}

export interface FirstCommunionAttachmentItem {
  id: string;
  first_communion_id: string;
  createdAt?: string;
  attachment: {
    id: string;
    title: string;
    s3_file: FirstCommunionAttachmentS3File;
  };
}

// Sem BaseCrudHttp: create() manda multipart/form-data (arquivo), não JSON —
// mesmo motivo de BaptismAttachmentService.
@Injectable({
  providedIn: 'root',
})
export class FirstCommunionAttachmentService extends HttpService {
  private readonly apiRoute = 'v1/first-communion-attachments';

  constructor(public readonly httpClient: HttpClient) {
    super(httpClient);
  }

  listByFirstCommunion(
    firstCommunionId: string,
  ): Observable<ResultModel<FirstCommunionAttachmentItem[]>> {
    return this.httpClient.get<ResultModel<FirstCommunionAttachmentItem[]>>(
      `${this.path}/${this.apiRoute}/by-first-communion/${firstCommunionId}`,
    );
  }

  create(
    firstCommunionId: string,
    title: string,
    file: File,
  ): Observable<ResultModel<FirstCommunionAttachmentItem>> {
    const formData = new FormData();
    formData.append('first_communion_id', firstCommunionId);
    formData.append('title', title);
    formData.append('file', file);

    return this.httpClient.post<ResultModel<FirstCommunionAttachmentItem>>(
      `${this.path}/${this.apiRoute}`,
      formData,
    );
  }

  // Só o título é editável (backend: UpdateFirstCommunionAttachmentDto) —
  // trocar o arquivo em si é remover e reanexar.
  updateTitle(
    id: string,
    title: string,
  ): Observable<ResultModel<FirstCommunionAttachmentItem>> {
    return this.httpClient.put<ResultModel<FirstCommunionAttachmentItem>>(
      `${this.path}/${this.apiRoute}/${id}`,
      { title },
    );
  }

  delete(id: string): Observable<ResultModel<any>> {
    return this.httpClient.delete<ResultModel<any>>(
      `${this.path}/${this.apiRoute}/${id}`,
    );
  }

  // Arquivo fica no bucket privado — precisa de URL assinada pra baixar.
  getDownloadUrl(s3FileId: string): Observable<ResultModel<{ url: string }>> {
    return this.httpClient.get<ResultModel<{ url: string }>>(
      `${this.path}/v1/s3-files/${s3FileId}/download-url`,
    );
  }
}
