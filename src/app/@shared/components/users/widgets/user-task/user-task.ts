import { SlicePipe } from '@angular/common';
import { Component } from '@angular/core';

import { Card } from '../../../ui/card/card';
import { projects } from '../../../../data/project';
import { ProjectDetails } from '../../../../../features/admin/projects/project-list/widgets/projects/projects/project-details/project-details';

@Component({
  selector: 'app-user-task',
  imports: [SlicePipe, Card, ProjectDetails],
  templateUrl: './user-task.html',
  styleUrl: './user-task.scss',
})
export class UserTask {
  public projects = projects;
}
