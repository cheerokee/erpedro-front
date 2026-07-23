import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { FinancialBillModel } from '../entities/financial-bill.model';

export interface FinancialBillListActor {
  id: string;
  customer?: { id: string; name: string };
  company?: { id: string; name: string };
}

export interface FinancialBillListItem {
  id: string;
  code: number;
  release_date: string;
  total: number;
  status: FinancialBillModel.StatusEnum;
  debtor?: FinancialBillListActor;
  creditor?: FinancialBillListActor;
  company?: { id: string; name: string };
}

export interface FinancialBillListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface FinancialBillListResult {
  items: FinancialBillListItem[];
  meta: FinancialBillListMeta;
}

const FINANCIAL_BILL_LIST_QUERY = gql`
  query FinancialBillList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    financialBillList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        code
        release_date
        total
        status
        debtor {
          id
          customer {
            id
            name
          }
          company {
            id
            name
          }
        }
        company {
          id
          name
        }
      }
      meta {
        totalItems
        itemCount
        itemsPerPage
        totalPages
        currentPage
      }
    }
  }
`;

/** Payload de criação — espelha CreateFinancialBillDto (backend): fatura +
 * parcelas (obrigatório, ao menos 1) + itens (opcional) são enviados juntos
 * numa única chamada, tudo processado em transação no backend
 * (FinancialBillService.create). Diferente de update, que só aceita campos
 * escalares (installments/items passam a ser geridos pelos próprios
 * endpoints depois que a fatura existe — ver FinancialBillItemService/
 * FinancialInstallmentService). */
export interface CreateFinancialBillPayload {
  release_date: string;
  total: number;
  debtor_id: string;
  creditor_id: string;
  company_id: string;
  installments: { due_date: string; amount: number }[];
  items?: {
    service_id: string;
    quantity?: number;
    unit_price?: number;
    description?: string;
  }[];
}

export interface UpdateFinancialBillPayload {
  release_date?: string;
  total?: number;
  status?: FinancialBillModel.StatusEnum;
  debtor_id?: string;
  creditor_id?: string;
  company_id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class FinancialBillService extends BaseCrudHttp<
  FinancialBillModel.Entity,
  FinancialBillModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/financial-bills');
  }

  /** Nomes próprios (não `create`/`update` do BaseCrudHttp) porque o payload
   * de criação de fatura não é `FinancialBillModel.JsonProps` — é um shape
   * dedicado (installments obrigatório, items opcional, sem id/relations),
   * espelhando CreateFinancialBillDto (backend). Sobrescrever `create`/`update`
   * com uma assinatura incompatível quebra `ng build` (TS2416: params do
   * override precisam ser compatíveis com a base). */
  createBill(payload: CreateFinancialBillPayload): Observable<any> {
    return this.httpClient.post<any>(
      `${this.path}/${this.apiRoute}`,
      payload,
    );
  }

  updateBill(id: string, payload: UpdateFinancialBillPayload): Observable<any> {
    return this.httpClient.put<any>(
      `${this.path}/${this.apiRoute}/${id}`,
      payload,
    );
  }

  list(
    filter: FinancialBillModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<FinancialBillListResult> {
    return this.apollo
      .query<{ financialBillList: FinancialBillListResult }>({
        query: FINANCIAL_BILL_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.financialBillList));
  }

  private buildFilterParams(filter: FinancialBillModel.Filter) {
    // aliases seguem os mesmos nomes usados nos leftJoinAndSelect de
    // FinancialGraphqlService.financialBillList (back) — 'b' é a raiz
    // (FinancialBill), 'debtor' é o join de FinancialActor do devedor.
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'b',
      });
    }

    if (filter?.status) {
      params.push({
        field: 'status',
        type: 'eq',
        instanceOf: 'string',
        value: filter.status,
        alias: 'b',
      });
    }

    if (filter?.code) {
      params.push({
        field: 'code',
        type: 'eq',
        instanceOf: 'number',
        value: filter.code as any,
        alias: 'b',
      });
    }

    if (filter?.debtor_customer_id) {
      params.push({
        field: 'customer_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.debtor_customer_id,
        alias: 'debtor',
      });
    }

    return params;
  }
}
