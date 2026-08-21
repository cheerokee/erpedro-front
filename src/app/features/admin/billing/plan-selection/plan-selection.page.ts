import { Component, OnInit } from '@angular/core';
import { forkJoin, of, switchMap } from 'rxjs';

import { AuthService } from '../../../../@core/services/auth.service';
import { AlertService } from '../../../../@core/services/alert.service';
import { CompanyService } from '../../../../@core/modules/company/services/company.service';
import { HoldingService } from '../../../../@core/modules/company/services/holding.service';
import { CompanyModel } from '../../../../@core/modules/company/entities/company.model';
import { HoldingModel } from '../../../../@core/modules/company/entities/holding.model';
import { PlanModel } from '../../../../@core/modules/financial/entities/plan.model';
import { PlanService } from '../../../../@core/modules/financial/services/plan.service';
import { BillingService } from '../../../../@core/modules/billing/services/billing.service';
import {
  getMyBillableEntity,
  MyBillableEntity,
} from '../../../../@core/utils/get-my-billable-entity.helper';
import { Card } from '../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../@shared/shared.module';

const STATUS_LABEL: Record<CompanyModel.BillingStatusEnum, string> = {
  [CompanyModel.BillingStatusEnum.ACTIVE]: 'Ativo',
  [CompanyModel.BillingStatusEnum.TRIAL]: 'Em teste grátis',
  [CompanyModel.BillingStatusEnum.PAST_DUE]: 'Pagamento pendente',
  [CompanyModel.BillingStatusEnum.INACTIVE]: 'Inativo',
};

@Component({
  templateUrl: './plan-selection.page.html',
  styleUrls: ['./plan-selection.page.scss'],
  imports: [SharedModule, Card],
})
export class PlanSelectionPage implements OnInit {
  myEntity: MyBillableEntity | null = null;
  entity: (CompanyModel.Entity | HoldingModel.Entity) | null = null;
  plans: PlanModel.Entity[] = [];
  loading = true;
  actionLoading = false;
  statusLabelMap = STATUS_LABEL;

  get entityLabel(): string {
    return this.myEntity?.type === 'holdings' ? 'Diocese' : 'Paróquia';
  }

  // GET /v1/companies/:id (BaseCrudService.get) e o equivalente de holdings
  // não carregam a relação `plan` (só `plan_id`, coluna plana) — por isso
  // buscamos o nome na lista de planos já carregada em vez de entity.plan.name.
  get currentPlanName(): string {
    return this.plans.find((plan) => plan.id === this.entity?.plan_id)?.name ?? 'Nenhum';
  }

  constructor(
    private readonly authService: AuthService,
    private readonly companyService: CompanyService,
    private readonly holdingService: HoldingService,
    private readonly planService: PlanService,
    private readonly billingService: BillingService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit() {
    this.myEntity = getMyBillableEntity(this.authService.getAuthenticateUser());

    if (!this.myEntity) {
      this.loading = false;
      return;
    }

    this.fetchAll();
  }

  // "Assinar" sempre faz checkout do plano JÁ atribuído à company/holding
  // (BillingService.createCompanyCheckoutSession, backend, não recebe
  // planId — usa company.plan direto). Se o card clicado não é o plano
  // atualmente atribuído, primeiro troca (só atualiza plan_id local, sem
  // Stripe envolvido, já que ainda não existe assinatura) e encadeia o
  // checkout na sequência.
  subscribe(planId: string) {
    this.actionLoading = true;

    const ensurePlanAssigned$ =
      planId === this.entity?.plan_id
        ? of(null)
        : this.billingService.changePlan(this.myEntity.type, this.myEntity.id, planId);

    ensurePlanAssigned$
      .pipe(
        switchMap(() =>
          this.billingService.createCheckoutSession(this.myEntity.type, this.myEntity.id),
        ),
      )
      .subscribe({
        next: (result) => {
          window.location.href = result.data.url;
        },
        error: (err) => {
          this.actionLoading = false;
          this.alertService.alertError(err, 'Não foi possível iniciar o checkout');
        },
      });
  }

  changePlan(planId: string) {
    this.actionLoading = true;

    this.billingService
      .changePlan(this.myEntity.type, this.myEntity.id, planId)
      .subscribe({
        next: () => {
          this.alertService.alert({
            title: 'Plano alterado com sucesso',
            icon: 'success',
            timer: 3000,
          });
          this.fetchAll();
        },
        error: (err) => {
          this.actionLoading = false;
          this.alertService.alertError(err, 'Não foi possível trocar de plano');
        },
      });
  }

  cancelSubscription() {
    this.actionLoading = true;

    this.billingService
      .cancelSubscription(this.myEntity.type, this.myEntity.id)
      .subscribe({
        next: (result) => {
          this.actionLoading = false;
          const until = new Date(result.data.currentPeriodEnd).toLocaleDateString('pt-BR');
          this.alertService.alert({
            title: 'Assinatura cancelada',
            text: `Acesso mantido até ${until}.`,
            icon: 'success',
            timer: 4000,
          });
        },
        error: (err) => {
          this.actionLoading = false;
          this.alertService.alertError(err, 'Não foi possível cancelar a assinatura');
        },
      });
  }

  reactivateSubscription() {
    this.actionLoading = true;

    this.billingService
      .reactivateSubscription(this.myEntity.type, this.myEntity.id)
      .subscribe({
        next: () => {
          this.actionLoading = false;
          this.alertService.alert({
            title: 'Assinatura reativada',
            icon: 'success',
            timer: 3000,
          });
        },
        error: (err) => {
          this.actionLoading = false;
          this.alertService.alertError(err, 'Não foi possível reativar a assinatura');
        },
      });
  }

  private fetchAll() {
    this.loading = true;

    const entity$ =
      this.myEntity.type === 'holdings'
        ? this.holdingService.get(this.myEntity.id)
        : this.companyService.get(this.myEntity.id);

    const target =
      this.myEntity.type === 'holdings'
        ? PlanModel.TargetEnum.HOLDING
        : PlanModel.TargetEnum.COMPANY;

    forkJoin({
      entity: entity$,
      plans: this.planService.list(target),
    }).subscribe({
      next: ({ entity, plans }) => {
        this.entity =
          this.myEntity.type === 'holdings'
            ? HoldingModel.Entity.toEntity(entity.data as any)
            : CompanyModel.Entity.toEntity(entity.data as any);
        this.plans = plans.items.map((item) => PlanModel.Entity.toEntity(item));
        this.loading = false;
        this.actionLoading = false;
      },
      error: (err) => {
        this.loading = false;
        this.alertService.alertError(err, 'Não foi possível carregar os planos');
      },
    });
  }
}
