import { Component } from '@angular/core';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { CardDropdownButton } from '../../../../../../../../@shared/components/ui/card/card-dropdown-button/card-dropdown-button';
import {
  projectDetails,
  todoListColors,
  todoStatus,
} from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-project-to-do',
  imports: [Card, CardDropdownButton],
  templateUrl: './project-to-do.html',
  styleUrl: './project-to-do.scss',
})
export class ProjectToDo {
  public projectTodo = projectDetails.project_summary.todo_list;
  public colors = todoListColors;
  public todoStatus = todoStatus;

  getColor(index: number) {
    return this.colors[index % this.colors.length];
  }
}
