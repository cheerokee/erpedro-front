import { Component } from '@angular/core';

import { totalProjects } from '../../../../../../../../@shared/data/project';

@Component({
  selector: 'app-total-projects',
  imports: [],
  templateUrl: './total-projects.html',
  styleUrl: './total-projects.scss',
})
export class TotalProjects {
  public totalProjects = totalProjects;
}
