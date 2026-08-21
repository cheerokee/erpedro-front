import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { jwtDecode } from 'jwt-decode';
import {
  BehaviorSubject,
  catchError,
  finalize,
  map,
  Observable,
  shareReplay,
  throwError,
} from 'rxjs';

import { environment } from '../../../environments/environment';
import { getAuthenticatedUser } from '../utils/get-authenticated-user.helper';
import { getStorageKey } from '../utils/get-storage-key.helper';
import { CompanyModel } from '../modules/company/entities/company.model';
import { RoleModel } from '../modules/acl/entities/role.model';
import { AlertService } from './alert.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Reentrância de signOut(): quando a sessão expira, é comum mais de uma
  // requisição falhar quase junto (várias telas buscando dados ao voltar de
  // um período ocioso) — cada 401 chama signOut() de forma independente.
  // Sem essa trava, uma segunda chamada concorrente reexecuta removeToken()
  // (inofensivo) mas também tenta navegar de novo; em cenários mais raros
  // (retry de refresh com token já nulo, ver refreshToken() abaixo) essa
  // segunda chamada pode disparar navigateByUrl('/sign-in') numa janela em
  // que outro código já está no meio de resolver a navegação — a trava
  // garante um único signOut "de verdade" por vez.
  private signingOut = false;
  // Chamada de refresh em andamento, compartilhada entre requisições
  // concorrentes que expiraram quase juntas — ver refreshToken() abaixo.
  private refreshInFlight$: Observable<string | null> | null = null;
  private tokenStorageKey: string = getStorageKey();
  private refreshTokenStorageKey: string = `${environment.namekey}_refresh_token`;
  public authenticated$ = new BehaviorSubject<AuthenticatedUser>(null);

  constructor(
    private readonly httpClient: HttpClient,
    public readonly router: Router,
    private readonly modalService: NgbModal,
    private readonly alertService: AlertService,
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

  confirmEmail(token: string): Observable<any> {
    return this.httpClient.post(
      `${environment.api.url}/v1/auth/confirm-email`,
      { token },
    );
  }

  // reason='expired' identifica logout automático (401 sem refresh possível
  // — token expirado, tipicamente por inatividade prolongada), vindo de
  // auth.interceptor.ts ou do catchError de refreshToken() abaixo. reason
  // padrão 'manual' é o botão "Sair" (profile.ts), que já confirma antes.
  async signOut(reason: 'manual' | 'expired' = 'manual') {
    // Segunda chamada concorrente (ver comentário de signingOut) é só um
    // no-op — a primeira já está cuidando de tudo.
    if (this.signingOut) return;
    this.signingOut = true;

    try {
      // Trigger event here to clear all data storages on respective modules
      this.removeToken();
      this.removeRefreshToken();
      this.authenticated$.next(null);

      // NgbModal renderiza o modal fora da árvore de componentes da rota
      // (direto no <body>) — navigateByUrl sozinho não o destrói, ficava
      // órfão por cima da tela de login quando o logout automático disparava
      // com um modal aberto.
      this.modalService.dismissAll();

      if (reason === 'expired') {
        this.alertService.alert({
          title: 'Sessão expirada',
          text: 'Você foi desconectado por inatividade. Faça login novamente.',
          icon: 'warning',
          timer: 4000,
        });
      }

      await this.router.navigateByUrl('/sign-in'); // Manter navigateByUrl para ativar o ngOnDestroy
    } finally {
      this.signingOut = false;
    }
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

  // Se já tem um refresh em andamento, todo mundo (quem iniciou e quem só
  // chegou depois) compartilha a MESMA chamada HTTP via shareReplay — nunca
  // dispara uma segunda requisição de refresh em paralelo.
  //
  // Antes disso era isRefreshing (boolean) + BehaviorSubject<any> — tinha 2
  // bugs reais: 1) quem esperava só recebia o token (string) emitido no
  // subject, mas auth.interceptor.ts lia result?.data?.access_token — pra
  // quem esperava isso sempre dava undefined, ou seja, toda requisição que
  // esperava a fila era re-tentada com "Bearer null" mesmo quando o refresh
  // dava certo; 2) se o refresh falhasse, o subject nunca emitia nada de
  // novo, e quem esperava ficava pendurado pra sempre (Observable nem
  // completa nem erra). shareReplay(1) resolve os dois: todo assinante
  // recebe exatamente o mesmo valor (token novo) ou o mesmo erro.
  refreshToken(): Observable<string | null> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const token = this.getToken();

    this.refreshInFlight$ = this.httpClient
      .post<any>(
        `${environment.api.url}/v1/auth/refresh-token`,
        {
          refresh_token: this.getRefreshToken(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .pipe(
        map((res) => {
          if (!res?.data?.access_token) {
            throw new Error('Resposta de refresh sem dados (data null)');
          }

          this.setToken(res.data.access_token);
          this.setRefreshToken(res.data.refresh_token);
          this.authenticated$.next(this.getAuthenticateUser());

          return res.data.access_token as string;
        }),
        catchError((err) => {
          // Propaga de verdade (throwError, não EMPTY) — é assim que
          // handle401Error (auth.interceptor.ts) sabe que deve desistir da
          // requisição original em vez de tentar retry sem token. signOut é
          // reentrante (ver comentário de signingOut), então chamar aqui
          // mesmo com N assinantes concorrentes só desloga uma vez.
          this.signOut('expired');
          return throwError(() => err);
        }),
        finalize(() => {
          // Libera pra próxima expiração de sessão disparar uma chamada de
          // refresh nova — sem isso, o cache de shareReplay ficaria
          // reservado pra sempre com o resultado (ou erro) desta vez.
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );

    return this.refreshInFlight$;
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
  sub: string;
  name: string;
  email: string;
  roles?: RoleModel.Entity[];
  companies?: CompanyModel.Entity[];
  // company_id de todo Employee vinculado a este user (ver AuthUserPayload no back).
  employeeCompanyIds?: string[];
  // ids de todas as companies das holdings referenciadas por roles[].holding_id.
  holdingCompanyIds?: string[];
  exp: number;
  iat: number;
}
