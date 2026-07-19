import { Component } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { projectDetails } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-budget-distribution',
  imports: [NgApexchartsModule, Card],
  templateUrl: './budget-distribution.html',
  styleUrl: './budget-distribution.scss',
})
export class BudgetDistribution {
  public budgetDistributionChart = projectDetails.finance.budget_distribution;
}
