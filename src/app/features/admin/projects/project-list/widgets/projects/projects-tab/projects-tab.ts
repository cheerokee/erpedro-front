import { Component, output } from '@angular/core';
import { RouterModule } from '@angular/router';

import { projectTab } from '../../../../../../../@shared/data/project';

@Component({
  selector: 'app-projects-tab',
  imports: [RouterModule],
  templateUrl: './projects-tab.html',
  styleUrl: './projects-tab.scss',
})
export class ProjectsTab {
  readonly activeTabValue = output<string>();

  public projectTab = projectTab;
  public activeTab = projectTab[0].value;

  ngOnInit() {
    this.activeTabValue.emit(this.activeTab);
  }

  handleTab(value: string) {
    if (value) {
      this.activeTab = value;
      this.activeTabValue.emit(this.activeTab);
    }
  }
}
