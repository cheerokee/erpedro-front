import { Component } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { projectDetails } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-task-overview',
  imports: [NgApexchartsModule, Card],
  templateUrl: './task-overview.html',
  styleUrl: './task-overview.scss',
})
export class TaskOverview {
  public task_overViewChart = projectDetails.project_summary.task_overViewChart;
}
