import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

import { BudgetDetails } from './widgets/budget-details/budget-details';
import { BudgetDistribution } from './widgets/budget-distribution/budget-distribution';
import { ExpenseChart } from './widgets/expense-chart/expense-chart';
import { ProjectBudget } from './widgets/project-budget/project-budget';
import { projectDetails } from '../../../../../../@shared/data/project';

@Component({
  selector: 'app-finance',
  imports: [
    ExpenseChart,
    BudgetDetails,
    BudgetDistribution,
    ProjectBudget,
    NgClass,
  ],
  templateUrl: './finance.html',
  styleUrl: './finance.scss',
})
export class Finance {
  public expenseCharts = projectDetails.finance.expenses;
}
