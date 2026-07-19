import { Component } from '@angular/core';

import { Card } from '../../../ui/card/card';
import { notifications } from '../../../../data/user';
import { INotification } from '../../../../interface/user';

@Component({
  selector: 'app-user-notification',
  imports: [Card],
  templateUrl: './user-notification.html',
  styleUrl: './user-notification.scss',
})
export class UserNotification {
  public notifications = notifications;

  objectKeys(obj: Record<string, INotification[]>): string[] {
    return Object.keys(obj);
  }

  getNotificationGroup(): Record<string, INotification[]> {
    const groups: Record<string, INotification[]> = {};

    this.notifications.forEach((notification) => {
      if (!groups[notification.date]) {
        groups[notification.date] = [];
      }

      groups[notification.date].push(notification);
    });

    return groups;
  }

  getDate(date: string) {
    let todayDate = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });

    let newDate = new Date();
    newDate.setDate(newDate.getDate() - 1);

    let yesterdayDate = newDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
    if (date == todayDate) {
      return 'Today';
    } else if (date == yesterdayDate) {
      return 'Yesterday';
    } else {
      return date;
    }
  }
}
