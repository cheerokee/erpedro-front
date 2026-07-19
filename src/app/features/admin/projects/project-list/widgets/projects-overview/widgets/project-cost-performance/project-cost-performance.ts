import { Component } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { projectCostPerformance } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-project-cost-performance',
  imports: [NgApexchartsModule],
  templateUrl: './project-cost-performance.html',
  styleUrl: './project-cost-performance.scss',
})
export class ProjectCostPerformance {
  public projectCostPerformance = projectCostPerformance;
}
