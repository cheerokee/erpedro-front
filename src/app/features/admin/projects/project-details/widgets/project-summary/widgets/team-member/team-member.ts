import { Component } from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { SvgIcon } from '../../../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { projectDetails } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-team-member',
  imports: [NgbTooltipModule, Card, SvgIcon],
  templateUrl: './team-member.html',
  styleUrl: './team-member.scss',
})
export class TeamMember {
  public teamMembers = projectDetails.project_summary.team_members;
}
