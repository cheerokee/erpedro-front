import { Component } from '@angular/core';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { Table } from '../../../../../../../../@shared/components/ui/table/table';
import { projectDetails } from '../../../../../../../../@shared/data/project';
import {
  IHasId,
  ITableConfigs,
} from '../../../../../../../../@shared/interface/common';

@Component({
  selector: 'app-budget-details',
  imports: [Card, Table],
  templateUrl: './budget-details.html',
  styleUrl: './budget-details.scss',
})
export class BudgetDetails {
  public tableConfig: ITableConfigs<IHasId> = {
    columns: [
      { title: 'Type', field_value: 'type', sort: true },
      {
        title: 'Total Budget',
        field_value: 'total_budget',
        sort: true,
        type: 'price',
        decimal_number: true,
      },
      {
        title: 'Expenses (USD)',
        field_value: 'expenses',
        sort: true,
        type: 'price',
        decimal_number: true,
      },
      {
        title: 'Remaining (USD)',
        field_value: 'remaining',
        sort: true,
        type: 'price',
        decimal_number: true,
      },
    ],
    data: projectDetails.finance.budget_details,
  };
}
