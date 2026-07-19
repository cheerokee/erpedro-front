import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { Card } from '../../../../../../@shared/components/ui/card/card';
import { CardDropdownButton } from '../../../../../../@shared/components/ui/card/card-dropdown-button/card-dropdown-button';
import { SvgIcon } from '../../../../../../@shared/components/ui/svg-icon/svg-icon';
import { cardToggleOptions1 } from '../../../../../../@shared/data/common';
import { projectDetails } from '../../../../../../@shared/data/project';
import { ChatService } from '../../../../../../@shared/services/chat.service';

@Component({
  selector: 'app-activity',
  imports: [RouterModule, NgbTooltipModule, Card, CardDropdownButton, SvgIcon],
  templateUrl: './activity.html',
  styleUrl: './activity.scss',
})
export class Activity {
  chatService = inject(ChatService);

  public cardToggleOption = cardToggleOptions1;
  public projectActivity = projectDetails.activity;
}
