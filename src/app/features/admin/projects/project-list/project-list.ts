import { Component } from '@angular/core';

import { Projects } from './widgets/projects/projects/projects';
import { ProjectsTab } from './widgets/projects/projects-tab/projects-tab';
import { ProjectsOverview } from './widgets/projects-overview/projects-overview';

@Component({
  selector: 'app-project-list',
  imports: [ProjectsOverview, ProjectsTab, Projects],
  templateUrl: './project-list.html',
  styleUrl: './project-list.scss',
})
export class ProjectList {
  public activeTab: string;

  handleActiveTab(value: string) {
    this.activeTab = value;
  }
}
