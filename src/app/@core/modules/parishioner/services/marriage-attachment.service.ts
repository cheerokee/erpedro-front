import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';

export interface MarriageAttachmentS3File {
  id: string;
  url: string;
  key: string;
  bucket: string;
  originalName?: string;
  mimetype: string;
  type: 'PUBLIC' | 'PRIVATE';
}

export interface MarriageAttachmentItem {
  id: string;
  marriage_id: string;
  createdAt?: string;
  attachment: {
    id: string;
    title: string;
    s3_file: MarriageAttachmentS3File;
  };
}

// Sem BaseCrudHttp: create() manda multipart/form-data (arquivo), não JSON —
// mesmo motivo de BaptismAttachmentService.
@Injectable({
  providedIn: 'root',
})
export class MarriageAttachmentService extends HttpService {
  private readonly apiRoute = 'v1/marriage-attachments';

  constructor(public readonly httpClient: HttpClient) {
    super(httpClient);
  }

  listByMarriage(
    marriageId: string,
  ): Observable<ResultModel<MarriageAttachmentItem[]>> {
    return this.httpClient.get<ResultModel<MarriageAttachmentItem[]>>(
      `${this.path}/${this.apiRoute}/by-marriage/${marriageId}`,
    );
  }

  create(
    marriageId: string,
    title: string,
    file: File,
  ): Observable<ResultModel<MarriageAttachmentItem>> {
    const formData = new FormData();
    formData.append('marriage_id', marriageId);
    formData.append('title', title);
    formData.append('file', file);

    return this.httpClient.post<ResultModel<MarriageAttachmentItem>>(
      `${this.path}/${this.apiRoute}`,
      formData,
    );
  }

  // Só o título é editável (backend: UpdateMarriageAttachmentDto) — trocar
  // o arquivo em si é remover e reanexar.
  updateTitle(
    id: string,
    title: string,
  ): Observable<ResultModel<MarriageAttachmentItem>> {
    return this.httpClient.put<ResultModel<MarriageAttachmentItem>>(
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
