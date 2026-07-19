import { DecimalPipe } from '@angular/common';
import { Component } from '@angular/core';

import { Card } from '../../../../../../@shared/components/ui/card/card';
import { projectDetails } from '../../../../../../@shared/data/project';

@Component({
  selector: 'app-project-team',
  imports: [Card, DecimalPipe],
  templateUrl: './project-team.html',
  styleUrl: './project-team.scss',
})
export class ProjectTeam {
  public projectTeam = projectDetails.team;
}
