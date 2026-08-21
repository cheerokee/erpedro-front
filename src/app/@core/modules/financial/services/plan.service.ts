import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';

import { BaseCrudHttp } from '../../../base/base-crud-http';
import { PlanModel } from '../entities/plan.model';

export interface PlanListItem extends PlanModel.JsonProps {}

export interface PlanListMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface PlanListResult {
  items: PlanListItem[];
  meta: PlanListMeta;
}

const PLAN_LIST_QUERY = gql`
  query PlanList($take: Float, $skip: Float, $filter: [FilterParam!]) {
    planList(take: $take, skip: $skip, filter: $filter) {
      items {
        id
        name
        target
        price
        max_companies
        features
        is_public
        trial_days
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

@Injectable({
  providedIn: 'root',
})
export class PlanService extends BaseCrudHttp<
  PlanModel.Entity,
  PlanModel.JsonProps
> {
  constructor(
    public override readonly httpClient: HttpClient,
    private readonly apollo: Apollo,
  ) {
    super(httpClient, 'v1/plans');
  }

  // is_public=false já é filtrado pelo backend pra quem não é superadmin
  // (ver FinancialGraphqlService.planList) — aqui só filtramos por target,
  // já que a tela de seleção de plano só mostra os do tipo certo (company
  // ou holding, nunca os dois juntos).
  list(target: PlanModel.TargetEnum, take: number = 50): Observable<PlanListResult> {
    return this.apollo
      .query<{ planList: PlanListResult }>({
        query: PLAN_LIST_QUERY,
        variables: {
          take,
          skip: 1,
          filter: [
            {
              field: 'target',
              type: 'eq',
              instanceOf: 'string',
              value: target,
              alias: 'p',
            },
          ],
        },
        fetchPolicy: 'no-cache',
      })
      .pipe(map((result) => result.data.planList));
  }
}
