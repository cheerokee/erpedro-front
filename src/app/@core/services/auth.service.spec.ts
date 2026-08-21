import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AuthService } from './auth.service';
import { AlertService } from './alert.service';
import { environment } from '../../../environments/environment';
import { getStorageKey } from '../utils/get-storage-key.helper';

// jwtDecode (usado por getAuthenticatedUser) exige um JWT com formato
// válido (3 partes base64url) — não valida assinatura, então qualquer
// payload serve pra teste, só não pode ser uma string qualquer como
// "new-token" (jwtDecode lança "Invalid token specified").
function fakeJwt(payload: object): string {
  const base64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

  return `${base64url({ alg: 'none' })}.${base64url(payload)}.signature`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let modalSpy: jasmine.SpyObj<NgbModal>;
  let alertSpy: jasmine.SpyObj<AlertService>;

  const tokenKey = getStorageKey();
  const refreshKey = `${environment.namekey}_refresh_token`;
  const refreshUrl = `${environment.api.url}/v1/auth/refresh-token`;

  const newAccessToken = fakeJwt({ sub: 'user-1', name: 'Test', email: 't@test.com', exp: 9999999999 });
  const anotherAccessToken = fakeJwt({ sub: 'user-1', name: 'Test', email: 't@test.com', exp: 9999999999 });

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl', 'navigate']);
    routerSpy.navigateByUrl.and.resolveTo(true);
    modalSpy = jasmine.createSpyObj('NgbModal', ['dismissAll']);
    alertSpy = jasmine.createSpyObj('AlertService', ['alert']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: NgbModal, useValue: modalSpy },
        { provide: AlertService, useValue: alertSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);

    localStorage.setItem(tokenKey, 'old-access-token');
    localStorage.setItem(refreshKey, 'old-refresh-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshKey);
  });

  describe('refreshToken', () => {
    it('faz só uma chamada HTTP mesmo com assinantes concorrentes', () => {
      const results: (string | null)[] = [];
      service.refreshToken().subscribe((token) => results.push(token));
      service.refreshToken().subscribe((token) => results.push(token));

      const req = httpMock.expectOne(refreshUrl);
      req.flush({ data: { access_token: newAccessToken, refresh_token: 'new-refresh' } });

      expect(results).toEqual([newAccessToken, newAccessToken]);
      expect(localStorage.getItem(tokenKey)).toBe(newAccessToken);
      expect(localStorage.getItem(refreshKey)).toBe('new-refresh');
    });

    it('propaga erro pra todo assinante concorrente quando o refresh falha (sem hang)', () => {
      let firstErrored = false;
      let secondErrored = false;

      service.refreshToken().subscribe({ error: () => (firstErrored = true) });
      service.refreshToken().subscribe({ error: () => (secondErrored = true) });

      const req = httpMock.expectOne(refreshUrl);
      req.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

      expect(firstErrored).toBe(true);
      expect(secondErrored).toBe(true);
    });

    it('chama signOut (navigateByUrl) só uma vez mesmo com falha concorrente', () => {
      service.refreshToken().subscribe({ error: () => {} });
      service.refreshToken().subscribe({ error: () => {} });

      const req = httpMock.expectOne(refreshUrl);
      req.flush({ message: 'expired' }, { status: 401, statusText: 'Unauthorized' });

      expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(alertSpy.alert).toHaveBeenCalledTimes(1);
    });

    it('dispara uma chamada HTTP nova na próxima vez que a sessão expirar', () => {
      service.refreshToken().subscribe();
      httpMock
        .expectOne(refreshUrl)
        .flush({ data: { access_token: newAccessToken, refresh_token: 'new-refresh' } });

      service.refreshToken().subscribe();
      httpMock
        .expectOne(refreshUrl)
        .flush({ data: { access_token: anotherAccessToken, refresh_token: 'another-refresh' } });

      expect(localStorage.getItem(tokenKey)).toBe(anotherAccessToken);
    });
  });

  describe('signOut', () => {
    it('remove tokens, mostra alerta e navega pra /sign-in quando a razão é "expired"', async () => {
      await service.signOut('expired');

      expect(localStorage.getItem(tokenKey)).toBeNull();
      expect(localStorage.getItem(refreshKey)).toBeNull();
      expect(alertSpy.alert).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/sign-in');
    });

    it('não mostra alerta quando a razão é "manual"', async () => {
      await service.signOut('manual');

      expect(alertSpy.alert).not.toHaveBeenCalled();
      expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/sign-in');
    });

    it('é reentrante — chamadas concorrentes só executam uma vez', async () => {
      await Promise.all([service.signOut('expired'), service.signOut('expired')]);

      expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(1);
      expect(alertSpy.alert).toHaveBeenCalledTimes(1);
    });

    it('permite um novo signOut depois que o anterior já terminou', async () => {
      await service.signOut('expired');
      await service.signOut('expired');

      expect(routerSpy.navigateByUrl).toHaveBeenCalledTimes(2);
    });
  });
});
