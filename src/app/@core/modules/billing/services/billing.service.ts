import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';

// Mesmo shape do backend (BillingService.toInvoiceSummary) — datas chegam
// como string ISO, sem conversão pra Date aqui: o pipe `date` do Angular já
// aceita ISO string direto no template, não precisa de model dedicado.
export interface InvoiceSummary {
  id: string;
  number: string | null;
  status: string | null;
  amountDue: number;
  amountPaid: number;
  currency: string;
  createdAt: string;
  periodStart: string;
  periodEnd: string;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
}

export interface CheckoutSessionResult {
  url: string;
}

export interface CancelSubscriptionResult {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}

export interface ReactivateSubscriptionResult {
  cancelAtPeriodEnd: boolean;
}

export type BillableEntityType = 'companies' | 'holdings';

@Injectable({
  providedIn: 'root',
})
export class BillingService extends HttpService {
  constructor(public override readonly http: HttpClient) {
    super(http);
  }

  createCheckoutSession(
    entityType: BillableEntityType,
    entityId: string,
  ): Observable<ResultModel<CheckoutSessionResult>> {
    return this.http.post<ResultModel<CheckoutSessionResult>>(
      `${this.path}/v1/billing/${entityType}/${entityId}/checkout-session`,
      {},
    );
  }

  changePlan(
    entityType: BillableEntityType,
    entityId: string,
    planId: string,
  ): Observable<ResultModel<any>> {
    return this.http.post<ResultModel<any>>(
      `${this.path}/v1/billing/${entityType}/${entityId}/change-plan`,
      { planId },
    );
  }

  cancelSubscription(
    entityType: BillableEntityType,
    entityId: string,
  ): Observable<ResultModel<CancelSubscriptionResult>> {
    return this.http.post<ResultModel<CancelSubscriptionResult>>(
      `${this.path}/v1/billing/${entityType}/${entityId}/cancel-subscription`,
      {},
    );
  }

  reactivateSubscription(
    entityType: BillableEntityType,
    entityId: string,
  ): Observable<ResultModel<ReactivateSubscriptionResult>> {
    return this.http.post<ResultModel<ReactivateSubscriptionResult>>(
      `${this.path}/v1/billing/${entityType}/${entityId}/reactivate-subscription`,
      {},
    );
  }

  listInvoices(
    entityType: BillableEntityType,
    entityId: string,
  ): Observable<ResultModel<InvoiceSummary[]>> {
    return this.http.get<ResultModel<InvoiceSummary[]>>(
      `${this.path}/v1/billing/${entityType}/${entityId}/invoices`,
    );
  }
}
