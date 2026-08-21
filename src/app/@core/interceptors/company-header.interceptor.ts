import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { ActiveCompanyService } from '../services/active-company.service';

// Anexa X-Company-Id em toda request (REST direto e GraphQL/Apollo, que usa
// HttpClient por baixo via HttpLink — ver app.config.ts) quando o usuário
// logado tem uma "empresa ativa" resolvida (ActiveCompanyService). Backend
// só valida/usa esse header quando a request é autenticada e o usuário tem
// acesso a mais de uma company (TenantContextInterceptor) — inofensivo
// mandar sempre que houver um valor, inclusive em rotas públicas (ignorado
// lá, já que `request.user` nunca existe nesse caso).
export const companyHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const activeCompanyService = inject(ActiveCompanyService);
  const companyId = activeCompanyService.getActiveCompanyId();

  const request = companyId
    ? req.clone({ setHeaders: { 'X-Company-Id': companyId } })
    : req;

  return next(request);
};
