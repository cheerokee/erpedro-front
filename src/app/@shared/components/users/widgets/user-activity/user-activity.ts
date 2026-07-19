import { Component, inject } from '@angular/core';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Card } from '../../../ui/card/card';
import { activityColors, userRecentActivity } from '../../../../data/user';
import { ChatService } from '../../../../services/chat.service';

@Component({
  selector: 'app-user-activity',
  imports: [NgbTooltipModule, Card],
  templateUrl: './user-activity.html',
  styleUrl: './user-activity.scss',
})
export class UserActivity {
  chatService = inject(ChatService);

  public userRecentActivity = userRecentActivity;
  public activityColors = activityColors;

  getColor(i: number) {
    return this.activityColors[i % this.activityColors.length];
  }
}
