import { Component } from '@angular/core';

import { ProjectCostPerformance } from './widgets/project-cost-performance/project-cost-performance';
import { ProjectProfessionalTeam } from './widgets/project-professional-team/project-professional-team';
import { ProjectRating } from './widgets/project-rating/project-rating';
import { TotalProjects } from './widgets/total-projects/total-projects';
import { Card } from '../../../../../../@shared/components/ui/card/card';

@Component({
  selector: 'app-projects-overview',
  imports: [
    Card,
    ProjectCostPerformance,
    ProjectRating,
    ProjectProfessionalTeam,
    TotalProjects,
  ],
  templateUrl: './projects-overview.html',
  styleUrl: './projects-overview.scss',
})
export class ProjectsOverview {}
