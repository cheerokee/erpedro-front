import { Component } from '@angular/core';

import { Card } from '../../../../../../../../@shared/components/ui/card/card';
import { SvgIcon } from '../../../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { projectDetails } from '../../../../../../../../@shared/data/project';
import { IActivities } from '../../../../../../../../@shared/interface/project';

@Component({
  selector: 'app-recent-activity',
  imports: [Card, SvgIcon],
  templateUrl: './recent-activity.html',
  styleUrl: './recent-activity.scss',
})
export class RecentActivity {
  public recentActivity = projectDetails.project_summary.recent_activity;
  public activeTab: string = this.recentActivity.activities[0].date;

  handleTab(activity: IActivities) {
    this.activeTab = activity.date;
  }
}
