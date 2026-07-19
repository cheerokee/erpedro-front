import { Component, output } from '@angular/core';

import { Card } from '../../../../../../@shared/components/ui/card/card';
import { SvgIcon } from '../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { projectDetailsTab } from '../../../../../../@shared/data/project';

@Component({
  selector: 'app-project-details-tab',
  imports: [SvgIcon, Card],
  templateUrl: './project-details-tab.html',
  styleUrl: './project-details-tab.scss',
})
export class ProjectDetailsTab {
  readonly handleActiveTab = output<string>();

  public projectDetailsTab = projectDetailsTab;
  public activeTab: string = projectDetailsTab[0].value;

  ngOnInit() {
    this.handleActiveTab.emit(this.activeTab);
  }

  changeTab(value: string) {
    this.activeTab = value;
    this.handleActiveTab.emit(this.activeTab);
  }
}
