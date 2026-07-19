import { Component } from '@angular/core';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';

@Component({
  selector: 'app-project-budget',
  imports: [Card],
  templateUrl: './project-budget.html',
  styleUrl: './project-budget.scss',
})
export class ProjectBudget {
  public budgetValue: number = 1;

  changeValue(value: number) {
    if (value == -1 && this.budgetValue > 1) {
      this.budgetValue -= 1;
    } else if (value == 1) {
      this.budgetValue += 1;
    }
  }
}
