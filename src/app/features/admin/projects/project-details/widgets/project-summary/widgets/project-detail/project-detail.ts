import { Component } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { projectDetails } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-project-detail',
  imports: [NgApexchartsModule, Card],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.scss',
})
export class ProjectDetail {
  public projectSummary = projectDetails.project_summary.summary;
}
