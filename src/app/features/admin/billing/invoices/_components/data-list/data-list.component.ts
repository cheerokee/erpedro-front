import { Component, OnInit } from '@angular/core';

import { AuthService } from '../../../../../../@core/services/auth.service';
import { AlertService } from '../../../../../../@core/services/alert.service';
import {
  BillingService,
  InvoiceSummary,
} from '../../../../../../@core/modules/billing/services/billing.service';
import { getMyBillableEntity } from '../../../../../../@core/utils/get-my-billable-entity.helper';
import { Card } from '../../../../../../@shared/components/ui/card/card';
import { SharedModule } from '../../../../../../@shared/shared.module';

const STATUS_LABEL: Record<string, string> = {
  paid: 'Paga',
  open: 'Em aberto',
  void: 'Anulada',
  uncollectible: 'Incobrável',
  draft: 'Rascunho',
};

@Component({
  selector: 'app-data-list-billing-invoices',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  imports: [SharedModule, Card],
})
export class DataListComponent implements OnInit {
  rows: InvoiceSummary[] = [];
  loading = true;
  hasBillableEntity = true;
  statusLabelMap = STATUS_LABEL;

  constructor(
    private readonly authService: AuthService,
    private readonly billingService: BillingService,
    private readonly alertService: AlertService,
  ) {}

  ngOnInit() {
    const myEntity = getMyBillableEntity(this.authService.getAuthenticateUser());

    if (!myEntity) {
      this.hasBillableEntity = false;
      this.loading = false;
      return;
    }

    this.billingService.listInvoices(myEntity.type, myEntity.id).subscribe({
      next: (result) => {
        this.rows = result.data ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.alertService.alertError(err, 'Não foi possível carregar as faturas');
      },
    });
  }

  statusBadgeClass(status: string | null): string {
    switch (status) {
      case 'paid':
        return 'bg-light-success txt-success';
      case 'open':
        return 'bg-light-warning txt-warning';
      case 'uncollectible':
        return 'bg-light-danger txt-danger';
      default:
        return 'bg-light-secondary txt-secondary';
    }
  }
}
