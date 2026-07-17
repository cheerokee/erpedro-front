import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  take,
  tap,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { getAuthenticatedUser } from '../utils/get-authenticated-user.helper';
import { getStorageKey } from '../utils/get-storage-key.helper';
import { CompanyModel } from '../modules/company/entities/company.model';
import { RoleModel } from '../modules/acl/entities/role.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
    null,
  );
  private tokenStorageKey: string = getStorageKey();
  private refreshTokenStorageKey: string = `${environment.namekey}_refresh_token`;
  public authenticated$ = new BehaviorSubject<AuthenticatedUser>(null);

  constructor(
    private readonly httpClient: HttpClient,
    public readonly router: Router,
  ) {}

  signIn(data: { email: string; password: string }): Observable<any> {
    return this.httpClient.post(`${environment.api.url}/v1/auth/sign-in`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.httpClient.post(
      `${environment.api.url}/v1/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.httpClient.post(
      `${environment.api.url}/v1/auth/reset-password`,
      { token, password },
    );
  }

  async signOut() {
    // Trigger event here to clear all data storages on respective modules
    this.removeToken();
    this.removeRefreshToken();
    await this.router.navigateByUrl('/sign-in'); // Manter navigateByUrl para ativar o ngOnDestroy
  }

  setToken(token: string) {
    return localStorage.setItem(this.tokenStorageKey, token);
  }

  setRefreshToken(token: string) {
    return localStorage.setItem(this.refreshTokenStorageKey, token);
  }

  getToken() {
    return localStorage.getItem(this.tokenStorageKey);
  }

  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenStorageKey);
  }

  removeToken() {
    return localStorage.removeItem(this.tokenStorageKey);
  }

  removeRefreshToken() {
    return localStorage.removeItem(this.refreshTokenStorageKey);
  }

  decodeToken(token: string): any {
    return jwtDecode(token);
  }

  refreshToken(): Observable<any> {
    // Se já estiver ocorrendo um refresh, não inicia outro.
    // Faz as outras requisições esperarem o novo token.
    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject.next(null);

    const token = this.getToken();

    return this.httpClient
      .post<any>(
        `${environment.api.url}/authenticate/refresh`,
        {
          refresh_token: this.getRefreshToken(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .pipe(
        tap((res) => {
          this.isRefreshing = false;

          if (!res.data) {
            const errorMsg = 'Resposta de refresh sem dados (data null)';
            throw new Error(errorMsg);
          }

          this.setToken(res.data.access_token);
          this.setRefreshToken(res.data.refresh_token);
          this.authenticated$.next(this.getAuthenticateUser());

          this.refreshTokenSubject.next(res.data.access_token);
        }),
        catchError((err) => {
          this.isRefreshing = false;

          this.signOut();
          return throwError(() => err);
        }),
      );
  }

  getAuthenticateUser(): AuthenticatedUser {
    return getAuthenticatedUser();
  }

  signInSuccess() {
    const desiredUrl = localStorage.getItem(
      `${environment.namekey}_desired_url`,
    );

    if (desiredUrl) {
      this.router.navigateByUrl(desiredUrl);
      localStorage.removeItem(`${environment.namekey}_desired_url`);
    } else this.router.navigate(['/admin'], { replaceUrl: true });
  }

  getBaseStorageKey(): string {
    const { sub } = this.getAuthenticateUser();
    return `${environment.namekey}_${sub ?? 'undefined'}`;
  }

  setCompanies(companies: CompanyModel.Entity[]) {
    localStorage.setItem(
      `${environment.namekey}_companies`,
      JSON.stringify(companies ?? []),
    );
  }

  getCompanies(): CompanyModel.Entity[] {
    const storage: string = localStorage.getItem(
      `${environment.namekey}_companies`,
    );
    if (!storage) return [];

    return JSON.parse(storage);
  }
}

export class AuthenticatedUser {
  username: string;
  sub: string;
  exp: number;
  iat: number;
  roles?: RoleModel.Entity[];
  companies?: CompanyModel.Entity[];
}
