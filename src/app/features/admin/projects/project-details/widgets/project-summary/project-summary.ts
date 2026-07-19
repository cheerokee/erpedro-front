import { Component } from '@angular/core';

import { Comments } from './widgets/comments/comments';
import { PendingProjects } from './widgets/pending-projects/pending-projects';
import { ProjectDetail } from './widgets/project-detail/project-detail';
import { ProjectToDo } from './widgets/project-to-do/project-to-do';
import { RecentActivity } from './widgets/recent-activity/recent-activity';
import { TaskOverview } from './widgets/task-overview/task-overview';
import { TeamMember } from './widgets/team-member/team-member';

@Component({
  selector: 'app-project-summary',
  imports: [
    ProjectDetail,
    ProjectToDo,
    PendingProjects,
    TaskOverview,
    RecentActivity,
    TeamMember,
    Comments,
  ],
  templateUrl: './project-summary.html',
  styleUrl: './project-summary.scss',
})
export class ProjectSummary {}
