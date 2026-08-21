import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { catchError, EMPTY, Observable, switchMap, throwError } from 'rxjs';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req,
  next,
): Observable<any> => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // 1. Adiciona o token inicial
  let authReq = addToken(req, token);

  return next(authReq).pipe(
    catchError((error) => {
      // // 2. Verifica se o erro é 401 e se não é uma tentativa de login/refresh
      // if (error instanceof HttpErrorResponse && error.status === 401 && !req.url.includes('auth/refresh')) {
      //   return handle401Error(req, next, authService);
      // }

      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Se o erro 401 vier da própria rota de refresh, não tente dar refresh de novo!
        if (req.url.includes('/auth/refresh-token')) {
          authService.signOut('expired');
          // EMPTY em vez de propagar o erro — senão o componente que fez a
          // chamada original também mostra o próprio alerta genérico
          // ("Não foi possível salvar"), sobrepondo o de sessão expirada.
          return EMPTY;
        }

        // Demais rotas públicas de auth (sign-in, forgot/reset-password,
        // confirm-email) e as de convite (preview/accept, também sem
        // AuthGuard): um 401 aqui é token de ação inválido/expirado (da
        // rota em si), não sessão expirada — não tentar refresh nem
        // deslogar, só repassar o erro pra quem chamou (ex: AcceptInvite
        // mostrar "convite inválido" em vez de forçar logout de uma sessão
        // que pode nem existir, ou deslogar por engano quem só clicou num
        // link de convite vencido estando logado em outra conta).
        if (
          req.url.includes('/auth/') ||
          req.url.includes('/invites/preview') ||
          req.url.includes('/invites/accept')
        ) {
          return throwError(() => error);
        }

        return handle401Error(req, next, authService);
      }

      return throwError(() => error);
    }),
  );
};

// Função auxiliar para clonar a requisição e injetar o Header
function addToken(request: HttpRequest<any>, token: string | null) {
  return token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
}

// Lógica de Refresh Token
function handle401Error(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService,
) {
  // authService.refreshToken() já persiste o token novo (setToken/
  // setRefreshToken) e já chama signOut('expired') sozinho se o refresh
  // falhar — aqui só repete a chamada original com o token novo, ou
  // desiste em silêncio (EMPTY) se refreshToken() propagar erro.
  return authService.refreshToken().pipe(
    switchMap((accessToken) => next(addToken(request, accessToken))),
    catchError(() => EMPTY),
  );
}
