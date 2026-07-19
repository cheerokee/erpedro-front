import { Component } from '@angular/core';

import { Activity } from './widgets/activity/activity';
import { Attachments } from './widgets/attachments/attachments';
import { Finance } from './widgets/finance/finance';
import { ProjectDetailsHeader } from './widgets/project-details-header/project-details-header';
import { ProjectDetailsTab } from './widgets/project-details-tab/project-details-tab';
import { ProjectStatus } from './widgets/project-status/project-status';
import { ProjectSummary } from './widgets/project-summary/project-summary';
import { ProjectTeam } from './widgets/project-team/project-team';

@Component({
  selector: 'app-project-details',
  imports: [
    ProjectDetailsTab,
    ProjectDetailsHeader,
    ProjectSummary,
    ProjectStatus,
    Finance,
    ProjectTeam,
    Attachments,
    Activity,
  ],
  templateUrl: './project-details.html',
  styleUrl: './project-details.scss',
})
export class ProjectDetails {
  public activeTab: string;

  handleActiveTab(value: string) {
    this.activeTab = value;
  }
}
