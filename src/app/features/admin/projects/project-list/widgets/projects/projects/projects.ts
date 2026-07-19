import { Component, input, inject } from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ProjectDetails } from './project-details/project-details';
import { Card } from '../../../../../../../@shared/components/ui/card/card';
import { projects } from '../../../../../../../@shared/data/project';
import { IProjects } from '../../../../../../../@shared/interface/project';
import { ChatService } from '../../../../../../../@shared/services/chat.service';

@Component({
  selector: 'app-projects',
  imports: [NgbTooltipModule, Card, ProjectDetails],
  templateUrl: './projects.html',
  styleUrl: './projects.scss',
})
export class Projects {
  chatService = inject(ChatService);

  readonly activeTab = input<string>();

  public projects = projects;
  public filteredProject: IProjects[];

  ngOnChanges() {
    const activeTab = this.activeTab();
    if (activeTab && activeTab == 'all') {
      this.filteredProject = projects;
    } else {
      this.filteredProject = this.projects.filter(
        (project) => project.status === this.activeTab(),
      );
    }
  }
}
