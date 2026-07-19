import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { Table } from '../../../../../../../../@shared/components/ui/table/table';
import { projectDetails } from '../../../../../../../../@shared/data/project';
import {
  IHasId,
  ITableConfigs,
} from '../../../../../../../../@shared/interface/common';
import {
  IPendingProject,
  IProjectDetails,
} from '../../../../../../../../@shared/interface/project';

@Component({
  selector: 'app-pending-projects',
  imports: [Card, Table],
  templateUrl: './pending-projects.html',
  styleUrl: './pending-projects.scss',
})
export class PendingProjects {
  private sanitizer = inject(DomSanitizer);

  public projectDetails = projectDetails;

  public tableConfig: ITableConfigs<IHasId> = {
    columns: [
      { title: 'Project Name', field_value: 'project_name', sort: true },
      { title: 'Project Head', field_value: 'project_head_name', sort: true },
      { title: 'Priority', field_value: 'priority', sort: true },
      { title: 'Due Date', field_value: 'due_date', sort: true },
      { title: 'Status', field_value: 'status', sort: true },
    ],
    data: [] as IProjectDetails[],
  };

  ngOnInit() {
    this.tableConfig.data =
      this.projectDetails.project_summary.pending_project.map(
        (project: IPendingProject) => {
          const formattedProjects = { ...project };
          formattedProjects.project_head_name = `<div class="common-flex align-items-center">
                            <img class="img-fluid lead-img" src="${project.project_head_profile}" alt="user">
                            <div><a class="c-light" href="javascript:void(0)">${project.project_head_name}</a>
                              <p class="mb-0 c-o-light">${project.project_head_email}</p>
                            </div>
                          </div>`;

          const statusHTML = `<button class="btn button-light-${project.color} txt-${project.color}">
                                ${project.status}
                              </button>`;

          formattedProjects.status =
            this.sanitizer.bypassSecurityTrustHtml(statusHTML);

          return formattedProjects;
        },
      );
  }
}
