import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { HttpService } from '../services/http-service';
import { ResultModel } from '../models/result.model';

export abstract class BaseCrudHttp<Entity, JsonProps> extends HttpService {
  protected constructor(
    public readonly httpClient: HttpClient,
    public readonly apiRoute: string,
  ) {
    super(httpClient);
  }

  create(jsonProps: JsonProps): Observable<ResultModel<JsonProps>> {
    return this.httpClient.post<ResultModel<JsonProps>>(
      `${this.path}/${this.apiRoute}`,
      jsonProps,
    );
  }

  update(
    id: string,
    jsonProps: Partial<JsonProps>,
  ): Observable<ResultModel<Partial<JsonProps>>> {
    return this.httpClient.put<ResultModel<Partial<JsonProps>>>(
      `${this.path}/${this.apiRoute}/${id}`,
      jsonProps,
    );
  }

  delete(id: string): Observable<ResultModel<any>> {
    return this.httpClient.delete<ResultModel<any>>(
      `${this.path}/${this.apiRoute}/${id}`,
    );
  }

  get(id: string): Observable<ResultModel<JsonProps>> {
    return this.httpClient.get<ResultModel<JsonProps>>(
      `${this.path}/${this.apiRoute}/${id}`,
    );
  }
}
