import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { HttpService } from '../../../services/http-service';
import { ResultModel } from '../../../models/result.model';
import { CustomerModel } from '../entities/customer.model';
import { BaseCrudHttp } from '../../../base/base-crud-http';

export interface CustomerListItem extends CustomerModel.JsonProps {
  company?: { id: string; name: string };
}

export interface CustomerAnyCompanyItem {
  id: string;
  name: string;
  company?: { id: string; name: string };
}

export interface CustomerExportAddress {
  is_main: boolean;
  street: string;
  number: string;
  neighborhood?: string;
  zip_code: string;
  city?: { name: string };
  state?: { name: string };
  country?: { name: string };
}

export type CustomerExportItem = Omit<
  CustomerListItem,
  'addresses' | 'father' | 'mother'
> & {
  addresses?: CustomerExportAddress[];
  father?: { name: string };
  mother?: { name: string };
};

export interface CustomerListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface CustomerListResult {
  items: CustomerListItem[];
  meta: CustomerListMeta;
}

const CUSTOMER_LIST_QUERY = gql`
  query CustomerList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    customerList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        document
        country_code
        phone_number
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

// Usada só pela exportação Excel (data-list.component.ts) — não pela tabela
// paginada — para não sobrecarregar cada troca de página/filtro com os
// campos de endereço, que só são necessários no arquivo exportado.
const CUSTOMER_EXPORT_QUERY = gql`
  query CustomerExportList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    customerList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        document
        country_code
        phone_number
        gender
        birthdate
        place_birth
        company {
          id
          name
        }
        father {
          id
          name
        }
        mother {
          id
          name
        }
        addresses {
          is_main
          street
          number
          neighborhood
          zip_code
          city {
            name
          }
          state {
            name
          }
          country {
            name
          }
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

// Sem paginação real na exportação (usuário decide "lista completa" ou
// "lista filtrada", nunca uma página específica) — take bem acima de
// qualquer volume esperado de paroquianos, já que o backend não impõe
// limite máximo em BaseListArgs.
const EXPORT_TAKE = 100000;

@Injectable({
  providedIn: 'root',
})
export class CustomerService extends BaseCrudHttp<
  CustomerModel.Entity,
  CustomerModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/customers');
  }

  list(
    filter: CustomerModel.Filter,
    skip: number = 1,
    take: number = 10,
  ): Observable<CustomerListResult> {
    return this.apollo
      .query<{ customerList: CustomerListResult }>({
        query: CUSTOMER_LIST_QUERY,
        variables: {
          take,
          skip,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.customerList));
  }

  listForExport(
    filter: CustomerModel.Filter,
  ): Observable<CustomerExportItem[]> {
    return this.apollo
      .query<{ customerList: { items: CustomerExportItem[] } }>({
        query: CUSTOMER_EXPORT_QUERY,
        variables: {
          take: EXPORT_TAKE,
          skip: 1,
          filter: this.buildFilterParams(filter),
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.customerList.items));
  }

  private buildFilterParams(filter: CustomerModel.Filter) {
    // alias "c" é obrigatório aqui: customerList faz innerJoin com "company",
    // que também tem coluna "name" — sem alias o SQL fica ambíguo (customer.name
    // vs company.name).
    const params: {
      field: string;
      type: string;
      instanceOf: string;
      value: string;
      alias: string;
    }[] = [];

    if (filter?.name) {
      params.push({
        field: 'name',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.name}%`,
        alias: 'c',
      });
    }

    if (filter?.document) {
      params.push({
        field: 'document',
        type: 'like',
        instanceOf: 'string',
        value: `%${filter.document}%`,
        alias: 'c',
      });
    }

    if (filter?.company_id) {
      params.push({
        field: 'company_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.company_id,
        alias: 'c',
      });
    }

    if (filter?.user_id) {
      params.push({
        field: 'user_id',
        type: 'eq',
        instanceOf: 'string',
        value: filter.user_id,
        alias: 'c',
      });
    }

    return params;
  }

  byLike(
    companyId: string,
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CustomerModel.Entity[]>> {
    const params = new HttpParams()
      .set('company_id', companyId)
      .set('q', q)
      .set('take', take);

    return this.httpClient
      .get<ResultModel<CustomerModel.Entity[]>>(
        `${this.path}/v1/customers/by-like`,
        {
          params,
        },
      )
      .pipe(
        map((result) => {
          if (result.data) {
            result.data = result.data.map((item) =>
              CustomerModel.Entity.toEntity(item as any),
            );
          }

          return result;
        }),
      );
  }

  /** Busca em qualquer paróquia (não só a `companyId` de `byLike`) — usada
   * pelo seletor de padrinho/madrinha/testemunha, onde a pessoa raramente é
   * paroquiana da mesma paróquia do sacramento. Backend expõe só nome +
   * paróquia (ver AI_CONTEXT.md seção 11, exceção deliberada de multitenancy).
   * Retorna o item cru (sem CustomerModel.Entity.toEntity()) — mesmo motivo
   * de RoleService.list()/company-selector: a projeção não traz `created_at`,
   * então toEntity() geraria um Invalid Date à toa. */
  searchAnyCompany(
    q: string = '',
    take: number = 20,
  ): Observable<ResultModel<CustomerAnyCompanyItem[]>> {
    const params = new HttpParams().set('q', q).set('take', take);

    return this.httpClient.get<ResultModel<CustomerAnyCompanyItem[]>>(
      `${this.path}/v1/customers/search-any-company`,
      { params },
    );
  }

  selfRegister(data: {
    name: string;
    email: string;
    password: string;
    document?: string;
    phone_number?: string;
    company_id: string;
  }): Observable<ResultModel<CustomerModel.Entity>> {
    return this.httpClient.post<ResultModel<CustomerModel.Entity>>(
      `${this.path}/v1/customers/self-register`,
      data,
    );
  }
}
