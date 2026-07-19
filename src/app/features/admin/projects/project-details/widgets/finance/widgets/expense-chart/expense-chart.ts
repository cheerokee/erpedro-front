import { Component, input } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { FeatherIcon } from '../../../../../../../../@shared/components/ui/feather-icon/feather-icon';
import { IExpenses } from '../../../../../../../../@shared/interface/project';

@Component({
  selector: 'app-expense-chart',
  imports: [NgApexchartsModule, Card, FeatherIcon],
  templateUrl: './expense-chart.html',
  styleUrl: './expense-chart.scss',
})
export class ExpenseChart {
  readonly chart = input<IExpenses>();
}
