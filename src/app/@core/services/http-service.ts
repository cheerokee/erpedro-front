import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export abstract class HttpService {
  public readonly path: string = `${environment.api.protocol}://${environment.api.host}`;
  constructor(public readonly http: HttpClient) {}
}
